import SwiftUI
import WebKit
import Observation

struct NativeAccessResponse: Decodable, Equatable {
    let destination: String
    let userID: String
    let role: String
    let entitled: Bool
}

private enum NativeEntryError: LocalizedError {
    case invalidConfiguration
    case unauthorized
    case message(String)

    var errorDescription: String? {
        switch self {
        case .invalidConfiguration: "No se ha podido abrir TriWaveX de forma segura."
        case .unauthorized: "Tu sesión ha caducado. Vuelve a iniciar sesión."
        case .message(let value): value
        }
    }
}

struct NativeEntryTransport {
    let origin: URL
    let store: WKWebsiteDataStore

    func send<T: Encodable, Response: Decodable>(_ path: String, body: T, response: Response.Type) async throws -> Response {
        guard Configuration.allows(origin, origin: origin),
              let url = URL(string: path, relativeTo: origin)?.absoluteURL,
              Configuration.allows(url, origin: origin) else { throw NativeEntryError.invalidConfiguration }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = 30
        request.httpShouldHandleCookies = false
        request.setValue("1", forHTTPHeaderField: "X-TriWaveX-Native")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.httpBody = try JSONEncoder().encode(body)
        if let cookie = await cookieHeader(for: url) { request.setValue(cookie, forHTTPHeaderField: "Cookie") }

        let configuration = URLSessionConfiguration.ephemeral
        configuration.httpShouldSetCookies = false
        let session = URLSession(configuration: configuration, delegate: NoRedirects(), delegateQueue: nil)
        defer { session.invalidateAndCancel() }
        let (data, rawResponse) = try await session.data(for: request)
        guard let http = rawResponse as? HTTPURLResponse,
              Configuration.allows(http.url ?? url, origin: origin) else { throw NativeEntryError.message("La respuesta del servidor no es válida.") }
        if http.statusCode == 401 { throw NativeEntryError.unauthorized }
        if !(200..<300).contains(http.statusCode) {
            let message = (try? JSONDecoder().decode(ErrorResponse.self, from: data).error) ?? "No se ha podido completar la operación."
            throw NativeEntryError.message(message)
        }
        let result = try JSONDecoder().decode(Response.self, from: data)
        await persistCookies(from: http, for: url)
        return result
    }

    private func cookieHeader(for url: URL) async -> String? {
        guard let host = url.host?.lowercased(), let scheme = url.scheme?.lowercased() else { return nil }
        let cookies = await withCheckedContinuation { continuation in store.httpCookieStore.getAllCookies { continuation.resume(returning: $0) } }
        let now = Date()
        let matching = cookies.filter { cookie in
            let domain = cookie.domain.trimmingCharacters(in: CharacterSet(charactersIn: ".")).lowercased()
            return (cookie.expiresDate.map { $0 > now } ?? true) && (!cookie.isSecure || scheme == "https") &&
                (host == domain || host.hasSuffix(".\(domain)")) && !cookie.name.contains(";") && !cookie.value.contains(";")
        }
        return matching.isEmpty ? nil : matching.map { "\($0.name)=\($0.value)" }.joined(separator: "; ")
    }

    private func persistCookies(from response: HTTPURLResponse, for url: URL) async {
        let fields = response.allHeaderFields.reduce(into: [String: String]()) { result, item in
            if let key = item.key as? String, let value = item.value as? String { result[key] = value }
        }
        for cookie in HTTPCookie.cookies(withResponseHeaderFields: fields, for: url) {
            await store.httpCookieStore.setCookie(cookie)
            HTTPCookieStorage.shared.setCookie(cookie)
        }
    }

    private struct ErrorResponse: Decodable { let error: String }
}

@MainActor
@Observable final class NativeRegistrationModel {
    enum State { case idle, saving, confirmationRequired(String), failed(String) }
    struct Outcome {
        let destination: String
        let givenName: String
        let role: String
        let userID: String
    }

    var firstName = ""
    var lastName = ""
    var email = ""
    var password = ""
    var passwordConfirmation = ""
    var revealPassword = false
    var state: State = .idle

    private let transport: NativeEntryTransport
    private let role: String
    private let defaults: UserDefaults

    init(origin: URL, store: WKWebsiteDataStore, role: String, defaults: UserDefaults = .standard) {
        transport = NativeEntryTransport(origin: origin, store: store)
        self.role = role
        self.defaults = defaults
        firstName = defaults.string(forKey: draftKey("firstName")) ?? ""
        lastName = defaults.string(forKey: draftKey("lastName")) ?? ""
        email = defaults.string(forKey: draftKey("email")) ?? ""
    }

    var hasDraft: Bool { !firstName.isEmpty || !lastName.isEmpty || !email.isEmpty }

    var canSubmit: Bool {
        !firstName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        password.count >= 8 && password == passwordConfirmation
    }

    func submit() async -> Outcome? {
        guard canSubmit else { return nil }
        state = .saving
        struct Input: Encodable { let email, password, firstName, lastName, role: String }
        struct Result: Decodable { let emailConfirmRequired: Bool; let destination: String?; let userID: String }
        do {
            let result = try await transport.send("/api/native/register", body: Input(email: email.trimmingCharacters(in: .whitespacesAndNewlines), password: password, firstName: firstName.trimmingCharacters(in: .whitespacesAndNewlines), lastName: lastName.trimmingCharacters(in: .whitespacesAndNewlines), role: role), response: Result.self)
            password = ""; passwordConfirmation = ""
            clearDraft()
            if result.emailConfirmRequired { state = .confirmationRequired(email); return nil }
            guard let destination = result.destination, !result.userID.isEmpty else { state = .failed("No se ha podido iniciar la sesión."); return nil }
            state = .idle
            return Outcome(
                destination: destination,
                givenName: firstName.trimmingCharacters(in: .whitespacesAndNewlines),
                role: role,
                userID: result.userID
            )
        } catch { state = .failed(error.localizedDescription); return nil }
    }

    func persistDraft() {
        defaults.set(firstName, forKey: draftKey("firstName"))
        defaults.set(lastName, forKey: draftKey("lastName"))
        defaults.set(email, forKey: draftKey("email"))
    }

    private func clearDraft() {
        ["firstName", "lastName", "email"].forEach { defaults.removeObject(forKey: draftKey($0)) }
    }

    private func draftKey(_ field: String) -> String { "triwavex.registration.\(role).\(field)" }
}

struct NativeRegistrationView: View {
    let role: String
    let origin: URL
    let store: WKWebsiteDataStore
    let onCancel: () -> Void
    let onRegistered: (NativeRegistrationModel.Outcome) -> Void
    @State private var model: NativeRegistrationModel
    @FocusState private var focusedField: Field?

    private enum Field { case firstName, lastName, email, password, confirmation }

    init(role: String, origin: URL, store: WKWebsiteDataStore, onCancel: @escaping () -> Void, onRegistered: @escaping (NativeRegistrationModel.Outcome) -> Void) {
        self.role = role; self.origin = origin; self.store = store; self.onCancel = onCancel; self.onRegistered = onRegistered
        _model = State(initialValue: NativeRegistrationModel(origin: origin, store: store, role: role))
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Crear cuenta").font(.largeTitle.bold())
                        Text(role == "coach" ? "Empieza a acompañar a tus atletas." : "Empieza a entrenar con una dirección clara.")
                            .foregroundStyle(.secondary)
                        if model.hasDraft {
                            Label("Continuamos donde lo dejaste", systemImage: "arrow.counterclockwise.circle.fill")
                                .font(.footnote.weight(.semibold))
                                .foregroundStyle(.tint)
                        }
                    }.padding(.bottom, 8)

                    Group {
                        HStack(spacing: 12) {
                            nativeField("Nombre", text: $model.firstName, field: .firstName, contentType: .givenName)
                            nativeField("Apellidos", text: $model.lastName, field: .lastName, contentType: .familyName)
                        }
                        nativeField("Correo electrónico", text: $model.email, field: .email, contentType: .emailAddress, keyboard: .emailAddress)
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Contraseña").font(.subheadline.weight(.semibold)).foregroundStyle(.secondary)
                            HStack {
                                Group { model.revealPassword ? AnyView(TextField("Mínimo 8 caracteres", text: $model.password)) : AnyView(SecureField("Mínimo 8 caracteres", text: $model.password)) }
                                    .textContentType(.newPassword).focused($focusedField, equals: .password)
                                Button { model.revealPassword.toggle() } label: { Image(systemName: model.revealPassword ? "eye.slash" : "eye") }.accessibilityLabel("Mostrar u ocultar contraseña")
                            }.padding(.horizontal, 14).frame(minHeight: 52).background(Color.triWaveXSurface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                        }
                        nativeField("Confirmar contraseña", text: $model.passwordConfirmation, field: .confirmation, contentType: .newPassword, secure: true)
                    }
                    .submitLabel(.next)

                    if case .failed(let message) = model.state { Label(message, systemImage: "exclamationmark.triangle.fill").font(.footnote).foregroundStyle(.red) }
                    if case .confirmationRequired(let address) = model.state { Label("Te hemos enviado un enlace de confirmación a \(address). Cuando lo abras, vuelve a iniciar sesión.", systemImage: "envelope.badge") .font(.footnote).foregroundStyle(.secondary) }

                    Button {
                        focusedField = nil
                        Task { if let result = await model.submit() { onRegistered(result) } }
                    } label: {
                        if case .saving = model.state { ProgressView().tint(.white) } else { Text("Crear cuenta") }
                    }
                    .buttonStyle(TriWaveXPrimaryButtonStyle(tint: .triWaveXAqua)).controlSize(.large).frame(maxWidth: .infinity).disabled(!model.canSubmit || isSaving)

                    Button("Ya tengo una cuenta", action: onCancel).buttonStyle(.borderless).frame(maxWidth: .infinity).padding(.top, 4)
                }
                .padding(20).frame(maxWidth: TriWaveXMetrics.contentMaximumWidth, alignment: .leading).frame(maxWidth: .infinity)
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .navigationTitle("TriWaveX").navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .topBarLeading) { Button("Cancelar", action: onCancel) } }
            .onChange(of: model.firstName) { _, _ in model.persistDraft() }
            .onChange(of: model.lastName) { _, _ in model.persistDraft() }
            .onChange(of: model.email) { _, _ in model.persistDraft() }
        }
    }

    private var isSaving: Bool { if case .saving = model.state { true } else { false } }

    private func nativeField(_ title: String, text: Binding<String>, field: Field, contentType: UITextContentType, keyboard: UIKeyboardType = .default, secure: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(.subheadline.weight(.semibold)).foregroundStyle(.secondary)
            Group { secure ? AnyView(SecureField(title, text: text)) : AnyView(TextField(title, text: text)) }
                .textContentType(contentType).keyboardType(keyboard).textInputAutocapitalization(keyboard == .emailAddress ? .never : .words).autocorrectionDisabled(keyboard == .emailAddress).focused($focusedField, equals: field)
                .padding(.horizontal, 14).frame(minHeight: 52).background(Color.triWaveXSurface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
    }
}

@MainActor
@Observable final class NativeOnboardingModel {
    enum State { case editing, saving, failed(String), preview(NativePlanPreview), readyForPayment }
    var goal = "Mi próximo objetivo"
    var modality = "triatlon"
    var targetRaceDistance = "half"
    var level = "intermedio"
    var weeklyHours = 7.0
    var wantsCoach = false
    var injuries = ""
    var state: State = .editing
    private let transport: NativeEntryTransport
    private let defaults: UserDefaults

    init(origin: URL, store: WKWebsiteDataStore, defaults: UserDefaults = .standard) {
        transport = NativeEntryTransport(origin: origin, store: store)
        self.defaults = defaults
        goal = defaults.string(forKey: "triwavex.onboarding.goal") ?? goal
        modality = defaults.string(forKey: "triwavex.onboarding.modality") ?? modality
        targetRaceDistance = defaults.string(forKey: "triwavex.onboarding.targetRaceDistance") ?? targetRaceDistance
        level = defaults.string(forKey: "triwavex.onboarding.level") ?? level
        if defaults.object(forKey: "triwavex.onboarding.weeklyHours") != nil {
            weeklyHours = defaults.double(forKey: "triwavex.onboarding.weeklyHours")
        }
        wantsCoach = defaults.bool(forKey: "triwavex.onboarding.wantsCoach")
        injuries = defaults.string(forKey: "triwavex.onboarding.injuries") ?? ""
        if defaults.bool(forKey: "triwavex.onboarding.readyForPayment") { state = .readyForPayment }
    }

    var hasDraft: Bool {
        defaults.object(forKey: "triwavex.onboarding.step") != nil || defaults.bool(forKey: "triwavex.onboarding.readyForPayment")
    }

    func persistDraft(step: Int) {
        defaults.set(goal, forKey: "triwavex.onboarding.goal")
        defaults.set(modality, forKey: "triwavex.onboarding.modality")
        defaults.set(targetRaceDistance, forKey: "triwavex.onboarding.targetRaceDistance")
        defaults.set(level, forKey: "triwavex.onboarding.level")
        defaults.set(weeklyHours, forKey: "triwavex.onboarding.weeklyHours")
        defaults.set(wantsCoach, forKey: "triwavex.onboarding.wantsCoach")
        defaults.set(injuries, forKey: "triwavex.onboarding.injuries")
        defaults.set(step, forKey: "triwavex.onboarding.step")
    }

    func clearDraft() {
        ["goal", "modality", "targetRaceDistance", "level", "weeklyHours", "wantsCoach", "injuries", "step", "readyForPayment"].forEach {
            defaults.removeObject(forKey: "triwavex.onboarding.\($0)")
        }
    }

    func save() async {
        state = .saving
        struct Input: Encodable { let goal, modality, targetRaceDistance, level: String; let weeklyHours: Double; let wantsCoach: Bool; let previousInjuries: String }
        struct Result: Decodable { let success: Bool; let preview: NativePlanPreview }
        do {
            let result = try await transport.send("/api/native/onboarding", body: Input(goal: goal, modality: modality, targetRaceDistance: targetRaceDistance, level: level, weeklyHours: weeklyHours, wantsCoach: wantsCoach, previousInjuries: injuries), response: Result.self)
            state = .preview(result.preview)
        } catch { state = .failed(error.localizedDescription) }
    }

    func continueToPayment() {
        state = .readyForPayment
        defaults.set(true, forKey: "triwavex.onboarding.readyForPayment")
    }
}

struct NativePlanPreview: Decodable {
    struct Session: Decodable { let day: String; let sport: String }
    let name: String
    let description: String?
    let durationWeeks: Int?
    let sessions: [Session]
}

struct NativeOnboardingView: View {
    let origin: URL
    let store: WKWebsiteDataStore
    let expectedUserID: String
    let givenName: String
    let onFinished: (NativeSubscriptionResult) -> Void
    @State private var model: NativeOnboardingModel
    @State private var step = 0
    @State private var showingSportChoices = false
    @State private var showingDistanceChoices = false

    init(origin: URL, store: WKWebsiteDataStore, expectedUserID: String, givenName: String, onFinished: @escaping (NativeSubscriptionResult) -> Void) {
        self.origin = origin; self.store = store; self.expectedUserID = expectedUserID; self.givenName = givenName; self.onFinished = onFinished
        _model = State(initialValue: NativeOnboardingModel(origin: origin, store: store))
        _step = State(initialValue: min(max(UserDefaults.standard.integer(forKey: "triwavex.onboarding.step"), 0), 2))
    }

    var body: some View {
        NavigationStack {
            Group {
                if case .readyForPayment = model.state {
                    NativeSubscriptionStoreView(
                        origin: origin,
                        store: store,
                        expectedUserID: expectedUserID,
                        role: "athlete",
                        showPlanComparison: false,
                        onFinished: { result in
                            model.clearDraft()
                            onFinished(result)
                        }
                    )
                } else if case .preview(let preview) = model.state {
                    NativePlanPreviewView(preview: preview, onContinue: model.continueToPayment)
                } else {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 22) {
                            if model.hasDraft {
                                Label("Continuamos donde lo dejaste", systemImage: "arrow.counterclockwise.circle.fill")
                                    .font(.footnote.weight(.semibold)).foregroundStyle(.tint)
                            }
                            progress
                            content
                            Label("Guardado", systemImage: "checkmark.circle.fill")
                                .font(.caption).foregroundStyle(.secondary)
                            actions
                        }
                        .padding(20).frame(maxWidth: TriWaveXMetrics.contentMaximumWidth, alignment: .leading).frame(maxWidth: .infinity)
                    }
                        .background(Color(uiColor: .systemGroupedBackground))
                }
            }
            .navigationTitle(step == 0 ? "Conócete" : step == 1 ? "Tu semana" : "Último detalle")
            .navigationBarTitleDisplayMode(.inline)
            .onChange(of: step) { _, value in model.persistDraft(step: value) }
            .onChange(of: model.goal) { _, _ in model.persistDraft(step: step) }
            .onChange(of: model.modality) { _, _ in model.persistDraft(step: step) }
            .onChange(of: model.targetRaceDistance) { _, _ in model.persistDraft(step: step) }
            .onChange(of: model.level) { _, _ in model.persistDraft(step: step) }
            .onChange(of: model.weeklyHours) { _, _ in model.persistDraft(step: step) }
            .onChange(of: model.wantsCoach) { _, _ in model.persistDraft(step: step) }
            .onChange(of: model.injuries) { _, _ in model.persistDraft(step: step) }
            .onAppear { ensureDistanceMatchesModality() }
            .confirmationDialog("Elige deporte", isPresented: $showingSportChoices, titleVisibility: .visible) {
                Button("Triatlón") { chooseModality("triatlon") }
                Button("Carrera") { chooseModality("carrera") }
                Button("Duatlón") { chooseModality("duatlon") }
                Button("Acuatlón") { chooseModality("acuatlon") }
                Button("Cancelar", role: .cancel) {}
            }
            .confirmationDialog("Elige distancia", isPresented: $showingDistanceChoices, titleVisibility: .visible) {
                ForEach(distanceOptions, id: \.id) { option in
                    Button(option.title) { model.targetRaceDistance = option.id }
                }
                Button("Cancelar", role: .cancel) {}
            }
        }
    }

    private var progress: some View { ProgressView(value: Double(step + 1), total: 3).tint(Color.triWaveXAqua).accessibilityLabel("Paso \(step + 1) de 3") }

    @ViewBuilder private var content: some View {
        if step == 0 {
            Text(onboardingQuestion).font(.largeTitle.bold())
            Text("Elige tu deporte y distancia. Con esto prepararemos un plan inicial que podrás ajustar después.").foregroundStyle(.secondary)
            onboardingChoice(title: "Deporte", value: modalityTitle, icon: modalityIcon) { showingSportChoices = true }
            onboardingChoice(title: "Distancia", value: distanceTitle, icon: "flag.checkered") { showingDistanceChoices = true }
            Picker("Experiencia", selection: $model.level) { Text("Principiante").tag("principiante"); Text("Intermedio").tag("intermedio"); Text("Avanzado").tag("avanzado") }.pickerStyle(.segmented)
        } else if step == 1 {
            Text("¿Cuánto tiempo tienes?").font(.largeTitle.bold())
            Text("\(Int(model.weeklyHours)) horas a la semana").font(.title2.weight(.semibold)).foregroundStyle(Color.triWaveXAqua)
            Slider(value: $model.weeklyHours, in: 2...20, step: 1).tint(Color.triWaveXAqua)
            Text("Podrás cambiarlo cuando quieras. Es mejor empezar con un plan que puedas sostener.").foregroundStyle(.secondary)
        } else {
            Text("Personaliza tu apoyo").font(.largeTitle.bold())
            Toggle("Quiero encontrar o conectar con un entrenador", isOn: $model.wantsCoach)
            if model.wantsCoach {
                Label("Te ayudaremos a encontrar o conectar con un entrenador después. Tu plan inicial y el precio de atleta no cambian.", systemImage: "person.2.fill")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .padding(12)
                    .background(Color.triWaveXAqua.opacity(0.09), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
            VStack(alignment: .leading, spacing: 8) { Text("Lesiones o límites actuales (opcional)").font(.headline); TextEditor(text: $model.injuries).frame(minHeight: 110).padding(8).background(Color.triWaveXSurface, in: RoundedRectangle(cornerRadius: 14, style: .continuous)); Text("Solo lo usamos para ajustar el entrenamiento. No sustituye a un profesional sanitario.").font(.footnote).foregroundStyle(.secondary) }
        }
    }

    private func onboardingChoice(title: String, value: String, icon: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 13) {
                Image(systemName: icon).font(.headline).frame(width: 28, height: 28).foregroundStyle(Color.triWaveXAqua)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(.caption.weight(.semibold)).foregroundStyle(.secondary)
                    Text(value).font(.headline).foregroundStyle(.primary)
                }
                Spacer()
                Image(systemName: "chevron.up.chevron.down").font(.caption.weight(.bold)).foregroundStyle(Color.triWaveXAqua)
            }
            .padding(15)
            .background(Color.triWaveXSurface, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay { RoundedRectangle(cornerRadius: 16, style: .continuous).stroke(Color.triWaveXAqua.opacity(0.55), lineWidth: 1.5) }
        }
        .buttonStyle(.plain)
        .accessibilityHint("Toca para elegir \(title.lowercased())")
    }

    private var modalityTitle: String {
        switch model.modality { case "carrera": "Carrera"; case "duatlon": "Duatlón"; case "acuatlon": "Acuatlón"; default: "Triatlón" }
    }

    private var modalityIcon: String {
        switch model.modality { case "carrera": "figure.run"; case "duatlon": "figure.run"; case "acuatlon": "figure.pool.swim"; default: "figure.triathlon" }
    }

    private var distanceOptions: [(id: String, title: String)] {
        switch model.modality {
        case "carrera": [("5k", "5 km"), ("10k", "10 km"), ("medio_maraton", "Media maratón"), ("maraton", "Maratón"), ("ultra", "Ultra")]
        case "triatlon": [("sprint", "Sprint"), ("olimpico", "Olímpico"), ("half", "70.3"), ("full", "Larga distancia")]
        default: [("sprint", "Sprint"), ("olimpico", "Olímpico"), ("half", "Media distancia")]
        }
    }

    private var distanceTitle: String { distanceOptions.first(where: { $0.id == model.targetRaceDistance })?.title ?? distanceOptions[0].title }

    private func chooseModality(_ value: String) {
        model.modality = value
        ensureDistanceMatchesModality()
    }

    private func ensureDistanceMatchesModality() {
        if !distanceOptions.contains(where: { $0.id == model.targetRaceDistance }) {
            model.targetRaceDistance = distanceOptions[0].id
        }
    }

    private var onboardingQuestion: String {
        let name = givenName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard (2...30).contains(name.count),
              name.unicodeScalars.contains(where: CharacterSet.letters.contains) else {
            return "¿Qué quieres conseguir?"
        }
        return "\(name), ¿qué quieres conseguir?"
    }

    private var actions: some View {
        VStack(spacing: 12) {
            if case .failed(let message) = model.state { Label(message, systemImage: "exclamationmark.triangle.fill").font(.footnote).foregroundStyle(.red) }
            Button {
                if step < 2 { withAnimation { step += 1 } } else { Task { await model.save() } }
            } label: { if case .saving = model.state { ProgressView().tint(.white) } else { Text(step == 2 ? "Ver mi plan" : "Continuar") } }
                .buttonStyle(.borderedProminent).controlSize(.large).frame(maxWidth: .infinity).disabled(isSaving || model.goal.trimmingCharacters(in: .whitespacesAndNewlines).count < 2)
            if step > 0 { Button("Atrás") { withAnimation { step -= 1 } }.buttonStyle(.borderless) }
        }.padding(.top, 12)
    }
    private var isSaving: Bool { if case .saving = model.state { true } else { false } }
}

private struct NativePlanPreviewView: View {
    let preview: NativePlanPreview
    let onContinue: () -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                Label("Tu plan inicial", systemImage: "checkmark.seal.fill")
                    .font(.headline)
                    .foregroundStyle(Color.triWaveXAqua)
                Text(preview.name).font(.largeTitle.bold())
                if let description = preview.description, !description.isEmpty {
                    Text(description).foregroundStyle(.secondary)
                }
                if let duration = preview.durationWeeks {
                    Label("Plan de \(duration) semanas", systemImage: "calendar")
                        .font(.subheadline.weight(.semibold))
                }
                TriWaveXSurface {
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Tus días propuestos").font(.title3.bold())
                        ForEach(preview.sessions, id: \.day) { session in
                            HStack(spacing: 12) {
                                Image(systemName: icon(for: session.sport))
                                    .foregroundStyle(Color.triWaveXAqua)
                                    .frame(width: 30, height: 30)
                                    .background(Color.triWaveXAqua.opacity(0.12), in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                                Text(session.day).font(.headline).frame(width: 32, alignment: .leading)
                                Text(title(for: session.sport)).foregroundStyle(.secondary)
                            }
                        }
                    }
                }
                Label("Podrás adaptar los días y la carga desde tu plan cuando actives el acceso.", systemImage: "slider.horizontal.3")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                Button("Ver acceso y prueba gratuita", action: onContinue)
                    .buttonStyle(TriWaveXPrimaryButtonStyle(tint: .triWaveXAqua))
                    .frame(maxWidth: .infinity)
            }
            .padding(20)
            .frame(maxWidth: TriWaveXMetrics.contentMaximumWidth, alignment: .leading)
            .frame(maxWidth: .infinity)
        }
        .background(Color(uiColor: .systemGroupedBackground))
        .navigationTitle("Tu plan")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func icon(for sport: String) -> String {
        switch sport { case "natacion": "figure.pool.swim"; case "ciclismo": "bicycle"; case "carrera": "figure.run"; case "fuerza": "dumbbell"; default: "arrow.triangle.2.circlepath" }
    }

    private func title(for sport: String) -> String {
        switch sport { case "natacion": "Natación"; case "ciclismo": "Ciclismo"; case "carrera": "Carrera"; case "fuerza": "Fuerza"; default: "Transición" }
    }
}
