import SwiftUI
import WebKit
import Observation

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

private struct NativeEntryTransport {
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
    enum State { case editing, saving, failed(String), readyForPayment }
    var goal = "Completar mi próximo triatlón"
    var modality = "triatlon"
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
        defaults.set(level, forKey: "triwavex.onboarding.level")
        defaults.set(weeklyHours, forKey: "triwavex.onboarding.weeklyHours")
        defaults.set(wantsCoach, forKey: "triwavex.onboarding.wantsCoach")
        defaults.set(injuries, forKey: "triwavex.onboarding.injuries")
        defaults.set(step, forKey: "triwavex.onboarding.step")
    }

    func clearDraft() {
        ["goal", "modality", "level", "weeklyHours", "wantsCoach", "injuries", "step", "readyForPayment"].forEach {
            defaults.removeObject(forKey: "triwavex.onboarding.\($0)")
        }
    }

    func save() async {
        state = .saving
        struct Input: Encodable { let goal, modality, level: String; let weeklyHours: Double; let wantsCoach: Bool; let previousInjuries: String }
        struct Result: Decodable { let success: Bool }
        do {
            _ = try await transport.send("/api/native/onboarding", body: Input(goal: goal, modality: modality, level: level, weeklyHours: weeklyHours, wantsCoach: wantsCoach, previousInjuries: injuries), response: Result.self)
            state = .readyForPayment
            defaults.set(true, forKey: "triwavex.onboarding.readyForPayment")
        } catch { state = .failed(error.localizedDescription) }
    }
}

struct NativeOnboardingView: View {
    let origin: URL
    let store: WKWebsiteDataStore
    let givenName: String
    let onFinished: (_ purchased: Bool) -> Void
    @State private var model: NativeOnboardingModel
    @State private var step = 0

    init(origin: URL, store: WKWebsiteDataStore, givenName: String, onFinished: @escaping (_ purchased: Bool) -> Void) {
        self.origin = origin; self.store = store; self.givenName = givenName; self.onFinished = onFinished
        _model = State(initialValue: NativeOnboardingModel(origin: origin, store: store))
        _step = State(initialValue: min(max(UserDefaults.standard.integer(forKey: "triwavex.onboarding.step"), 0), 2))
    }

    var body: some View {
        NavigationStack {
            Group {
                if case .readyForPayment = model.state {
                    NativeSubscriptionStoreView(
                        role: "athlete",
                        onFinished: { model.clearDraft(); onFinished(false) },
                        onPurchased: { model.clearDraft(); onFinished(true) }
                    )
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
            .onChange(of: model.level) { _, _ in model.persistDraft(step: step) }
            .onChange(of: model.weeklyHours) { _, _ in model.persistDraft(step: step) }
            .onChange(of: model.wantsCoach) { _, _ in model.persistDraft(step: step) }
            .onChange(of: model.injuries) { _, _ in model.persistDraft(step: step) }
        }
    }

    private var progress: some View { ProgressView(value: Double(step + 1), total: 3).tint(Color.triWaveXAqua).accessibilityLabel("Paso \(step + 1) de 3") }

    @ViewBuilder private var content: some View {
        if step == 0 {
            Text(onboardingQuestion).font(.largeTitle.bold())
            Text("Usaremos esta información para prepararte un plan inicial.").foregroundStyle(.secondary)
            TextField("Ejemplo: Mi primer 70.3", text: $model.goal).textFieldStyle(.roundedBorder).font(.title3)
            Picker("Deporte", selection: $model.modality) { Text("Triatlón").tag("triatlon"); Text("Carrera").tag("carrera"); Text("Duatlón").tag("duatlon"); Text("Acuatlón").tag("acuatlon"); Text("Acuabike").tag("acuabike") }.pickerStyle(.navigationLink)
            Picker("Experiencia", selection: $model.level) { Text("Principiante").tag("principiante"); Text("Intermedio").tag("intermedio"); Text("Avanzado").tag("avanzado") }.pickerStyle(.segmented)
        } else if step == 1 {
            Text("¿Cuánto tiempo tienes?").font(.largeTitle.bold())
            Text("\(Int(model.weeklyHours)) horas a la semana").font(.title2.weight(.semibold)).foregroundStyle(Color.triWaveXAqua)
            Slider(value: $model.weeklyHours, in: 2...20, step: 1).tint(Color.triWaveXAqua)
            Text("Podrás cambiarlo cuando quieras. Es mejor empezar con un plan que puedas sostener.").foregroundStyle(.secondary)
        } else {
            Text("Personaliza tu apoyo").font(.largeTitle.bold())
            Toggle("Quiero encontrar o conectar con un entrenador", isOn: $model.wantsCoach)
            VStack(alignment: .leading, spacing: 8) { Text("Lesiones o límites actuales (opcional)").font(.headline); TextEditor(text: $model.injuries).frame(minHeight: 110).padding(8).background(Color.triWaveXSurface, in: RoundedRectangle(cornerRadius: 14, style: .continuous)); Text("Solo lo usamos para ajustar el entrenamiento. No sustituye a un profesional sanitario.").font(.footnote).foregroundStyle(.secondary) }
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
