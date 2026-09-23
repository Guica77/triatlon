import SwiftUI
import WebKit
import Observation
import AuthenticationServices

enum NativeAthleteDraft {
    static let prefix = "triwavex.onboarding."
    static let expiryKey = "triwavex.onboarding.expiresAt"
    static let preAuthStepKey = "triwavex.onboarding.preAuthStep"
    static let lifetime: TimeInterval = 30 * 24 * 60 * 60

    static func removeExpired(from defaults: UserDefaults = .standard) {
        // Purge the legacy sensitive draft introduced by older builds; health
        // answers are now transient until they are submitted after consent.
        defaults.removeObject(forKey: prefix + "injuries")
        guard let expiry = defaults.object(forKey: expiryKey) as? Date else {
            let hasUnboundedDraft = defaults.object(forKey: preAuthStepKey) != nil ||
                ["goal", "modality", "targetRaceDistance", "level", "weeklyHours", "targetRaceDate"].contains {
                    defaults.object(forKey: prefix + $0) != nil
                }
            if hasUnboundedDraft { clear(from: defaults) }
            return
        }
        if expiry < Date() { clear(from: defaults) }
    }

    fileprivate static func save(_ values: AthletePreferences, step: Int, to defaults: UserDefaults = .standard) {
        defaults.set(values.goal, forKey: prefix + "goal")
        defaults.set(values.modality, forKey: prefix + "modality")
        defaults.set(values.distance, forKey: prefix + "targetRaceDistance")
        defaults.set(values.level, forKey: prefix + "level")
        defaults.set(values.weeklyHours, forKey: prefix + "weeklyHours")
        defaults.set(values.raceDate.map(dayString) ?? "", forKey: prefix + "targetRaceDate")
        defaults.set(step, forKey: preAuthStepKey)
        defaults.set(Date().addingTimeInterval(lifetime), forKey: expiryKey)
    }

    static func clear(from defaults: UserDefaults = .standard) {
        ["goal", "modality", "targetRaceDistance", "level", "weeklyHours", "wantsCoach", "injuries", "step", "readyForPayment", "targetRaceDate"].forEach {
            defaults.removeObject(forKey: prefix + $0)
        }
        defaults.removeObject(forKey: preAuthStepKey)
        defaults.removeObject(forKey: expiryKey)
    }

    static func dayString(_ date: Date) -> String {
        let parts = Calendar.current.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", parts.year ?? 2000, parts.month ?? 1, parts.day ?? 1)
    }

    static func dayDate(_ value: String) -> Date? {
        let parts = value.split(separator: "-").compactMap { Int($0) }
        guard parts.count == 3 else { return nil }
        return Calendar.current.date(from: DateComponents(year: parts[0], month: parts[1], day: parts[2], hour: 12))
    }
}

private struct AthletePreferences {
    var goal = "Mi próximo objetivo"
    var modality = "triatlon"
    var distance = "half"
    var level = "intermedio"
    var weeklyHours = 7.0
    var raceDate: Date?
}

struct NativeAthleteOnboardingView: View {
    let onCreateAccount: () -> Void
    let onContinueWithApple: (ASAuthorizationAppleIDRequest) -> Void
    let onAppleCompletion: (Result<ASAuthorization, Error>) -> Void
    let onCancel: () -> Void
    @State private var preferences: AthletePreferences
    @State private var step: Int
    @State private var showingSportChoices = false
    @State private var showingDistanceChoices = false
    @State private var hasRaceDate = true
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    init(onCreateAccount: @escaping () -> Void,
         onContinueWithApple: @escaping (ASAuthorizationAppleIDRequest) -> Void = { _ in },
         onAppleCompletion: @escaping (Result<ASAuthorization, Error>) -> Void = { _ in },
         onCancel: @escaping () -> Void) {
        self.onCreateAccount = onCreateAccount
        self.onContinueWithApple = onContinueWithApple
        self.onAppleCompletion = onAppleCompletion
        self.onCancel = onCancel
        NativeAthleteDraft.removeExpired()
        let defaults = UserDefaults.standard
        var initial = AthletePreferences()
        initial.goal = defaults.string(forKey: NativeAthleteDraft.prefix + "goal") ?? initial.goal
        initial.modality = defaults.string(forKey: NativeAthleteDraft.prefix + "modality") ?? initial.modality
        initial.distance = defaults.string(forKey: NativeAthleteDraft.prefix + "targetRaceDistance") ?? initial.distance
        initial.level = defaults.string(forKey: NativeAthleteDraft.prefix + "level") ?? initial.level
        if defaults.object(forKey: NativeAthleteDraft.prefix + "weeklyHours") != nil {
            initial.weeklyHours = defaults.double(forKey: NativeAthleteDraft.prefix + "weeklyHours")
        }
        if let rawDate = defaults.string(forKey: NativeAthleteDraft.prefix + "targetRaceDate"), !rawDate.isEmpty {
            initial.raceDate = NativeAthleteDraft.dayDate(rawDate)
        }
        _preferences = State(initialValue: initial)
        _step = State(initialValue: min(max(defaults.integer(forKey: NativeAthleteDraft.preAuthStepKey), 0), 2))
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    ProgressView(value: Double(step + 1), total: 3).tint(Color.triWaveXAqua)
                        .accessibilityLabel("Paso \(step + 1) de 3")
                    if step == 0 {
                        Label("Bienvenido a TriWaveX", systemImage: "figure.triathlon")
                            .font(.headline).foregroundStyle(Color.triWaveXAqua)
                        Text("Entrena con una dirección clara").font(.largeTitle.bold())
                        Text("Cuéntanos qué quieres preparar y te mostraremos una primera orientación antes de crear tu cuenta.")
                            .foregroundStyle(.secondary)
                        TriWaveXSurface {
                            Label("Un plan adaptado a tu objetivo y al tiempo que tienes", systemImage: "calendar.badge.clock")
                                .font(.headline)
                        }
                    } else if step == 1 {
                        Text("¿Qué quieres conseguir?").font(.largeTitle.bold())
                        TextField("Tu objetivo", text: $preferences.goal)
                            .padding(14).background(Color.triWaveXSurface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                        choice(title: "Deporte", value: modalityTitle, icon: modalityIcon) { showingSportChoices = true }
                        choice(title: "Distancia", value: distanceTitle, icon: "flag.checkered") { showingDistanceChoices = true }
                        Picker("Experiencia", selection: $preferences.level) {
                            Text("Principiante").tag("principiante")
                            Text("Intermedio").tag("intermedio")
                            Text("Avanzado").tag("avanzado")
                        }.pickerStyle(.segmented)
                        Toggle("Ya tengo fecha de competición", isOn: $hasRaceDate)
                        if hasRaceDate {
                            DatePicker("Fecha de la carrera", selection: raceDateBinding, in: Date()..., displayedComponents: .date)
                        } else {
                            Label("Aún no tengo fecha · crearé un plan flexible", systemImage: "arrow.left.arrow.right")
                                .font(.footnote).foregroundStyle(.secondary)
                        }
                        Text("¿Cuánto tiempo puedes entrenar?").font(.headline)
                        Text("\(Int(preferences.weeklyHours)) horas a la semana").font(.title2.weight(.semibold)).foregroundStyle(Color.triWaveXAqua)
                        Slider(value: $preferences.weeklyHours, in: 2...20, step: 1).tint(Color.triWaveXAqua)
                    } else {
                        Label("Una primera orientación", systemImage: "checkmark.seal.fill")
                            .font(.headline).foregroundStyle(Color.triWaveXAqua)
                        Text(modalityTitle + " · " + distanceTitle).font(.largeTitle.bold())
                        Text("\(Int(preferences.weeklyHours)) horas disponibles cada semana")
                            .foregroundStyle(.secondary)
                        Label(raceDateSummary, systemImage: "calendar")
                            .font(.subheadline.weight(.medium)).foregroundStyle(.secondary)
                        TriWaveXSurface {
                            VStack(alignment: .leading, spacing: 14) {
                                Text("Una semana posible").font(.title3.bold())
                                ForEach(suggestedSessions, id: \.day) { session in
                                    HStack(spacing: 12) {
                                        Image(systemName: session.icon).foregroundStyle(Color.triWaveXAqua)
                                            .frame(width: 30, height: 30).background(Color.triWaveXAqua.opacity(0.12), in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                                        Text(session.day).font(.headline).frame(width: 36, alignment: .leading)
                                        Text(session.title).foregroundStyle(.secondary)
                                    }
                                }
                            }
                        }
                        Text("Es solo una muestra orientativa, todavía no es un plan generado ni guardado. Después de crear tu cuenta podrás completar tu perfil y ajustar tus días.")
                            .font(.footnote).foregroundStyle(.secondary)
                        SignInWithAppleButton(.continue, onRequest: onContinueWithApple, onCompletion: onAppleCompletion)
                            .signInWithAppleButtonStyle(.black).frame(height: 50)
                        Button("Crear cuenta con correo", action: onCreateAccount)
                            .buttonStyle(TriWaveXPrimaryButtonStyle(tint: .triWaveXAqua)).controlSize(.large).frame(maxWidth: .infinity)
                    }
                    actions
                }
                .padding(20).frame(maxWidth: TriWaveXMetrics.contentMaximumWidth, alignment: .leading).frame(maxWidth: .infinity)
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .navigationTitle("TriWaveX").navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .topBarLeading) { Button("Cancelar", action: cancelAndClear) } }
            .onChange(of: preferences.goal) { _, _ in persist() }
            .onChange(of: preferences.modality) { _, _ in ensureDistanceMatchesModality(); persist() }
            .onChange(of: preferences.distance) { _, _ in persist() }
            .onChange(of: preferences.level) { _, _ in persist() }
            .onChange(of: preferences.weeklyHours) { _, _ in persist() }
            .onChange(of: preferences.raceDate) { _, _ in persist() }
            .onChange(of: hasRaceDate) { _, value in
                if !value { preferences.raceDate = nil }
                else if preferences.raceDate == nil { preferences.raceDate = Calendar.current.date(byAdding: .month, value: 6, to: Date()) }
                persist()
            }
            .confirmationDialog("Elige deporte", isPresented: $showingSportChoices, titleVisibility: .visible) {
                Button("Triatlón") { preferences.modality = "triatlon" }
                Button("Carrera") { preferences.modality = "carrera" }
                Button("Duatlón") { preferences.modality = "duatlon" }
                Button("Acuatlón") { preferences.modality = "acuatlon" }
                Button("Cancelar", role: .cancel) {}
            }
            .confirmationDialog("Elige distancia", isPresented: $showingDistanceChoices, titleVisibility: .visible) {
                ForEach(distanceOptions, id: \.id) { option in Button(option.title) { preferences.distance = option.id } }
                Button("Cancelar", role: .cancel) {}
            }
        }
        .onAppear {
            let storedDate = UserDefaults.standard.string(forKey: NativeAthleteDraft.prefix + "targetRaceDate")
            hasRaceDate = storedDate.map { !$0.isEmpty } ?? false
            persist()
        }
    }

    private var actions: some View {
        VStack(spacing: 10) {
            if step < 2 {
                Button(step == 0 ? "Personalizar mi plan" : "Ver una propuesta") {
                    withAnimation(TriWaveXMotion.stateChange(reduced: reduceMotion)) { step += 1 }
                    persist()
                }
                .buttonStyle(TriWaveXPrimaryButtonStyle(tint: .triWaveXAqua)).controlSize(.large).frame(maxWidth: .infinity)
                .disabled(step == 1 && preferences.goal.trimmingCharacters(in: .whitespacesAndNewlines).count < 2)
            } else if step > 0 {
                Button("Atrás") { withAnimation { step -= 1 }; persist() }.buttonStyle(.borderless)
            }
        }.padding(.top, 6)
    }

    private var raceDateBinding: Binding<Date> {
        Binding(get: { preferences.raceDate ?? Calendar.current.date(byAdding: .month, value: 6, to: Date()) ?? Date() }, set: { preferences.raceDate = $0 })
    }
    private var distanceOptions: [(id: String, title: String)] {
        switch preferences.modality {
        case "carrera": [("5k", "5 km"), ("10k", "10 km"), ("medio_maraton", "Media maratón"), ("maraton", "Maratón"), ("ultra", "Ultra")]
        case "triatlon": [("sprint", "Sprint"), ("olimpico", "Olímpico"), ("half", "70.3"), ("full", "Larga distancia")]
        default: [("sprint", "Sprint"), ("olimpico", "Olímpico"), ("half", "Media distancia")]
        }
    }
    private var distanceTitle: String { distanceOptions.first(where: { $0.id == preferences.distance })?.title ?? distanceOptions[0].title }
    private var raceDateSummary: String {
        guard hasRaceDate, let date = preferences.raceDate else { return "Plan flexible · aún sin fecha de competición" }
        return "Carrera el \(date.formatted(date: .long, time: .omitted))"
    }
    private var modalityTitle: String { switch preferences.modality { case "carrera": "Carrera"; case "duatlon": "Duatlón"; case "acuatlon": "Acuatlón"; default: "Triatlón" } }
    private var modalityIcon: String { switch preferences.modality { case "carrera", "duatlon": "figure.run"; case "acuatlon": "figure.pool.swim"; default: "figure.triathlon" } }
    private var suggestedSessions: [(day: String, title: String, icon: String)] {
        let all: [(day: String, title: String, icon: String)] = switch preferences.modality {
        case "carrera": [("Mar", "Carrera suave", "figure.run"), ("Jue", "Ritmo y técnica", "figure.run"), ("Sáb", "Fuerza", "dumbbell"), ("Dom", "Rodaje largo", "figure.run")]
        case "duatlon": [("Mar", "Carrera", "figure.run"), ("Jue", "Bicicleta", "bicycle"), ("Sáb", "Carrera y técnica", "figure.run"), ("Dom", "Fuerza", "dumbbell")]
        case "acuatlon": [("Mar", "Natación", "figure.pool.swim"), ("Jue", "Carrera", "figure.run"), ("Sáb", "Natación técnica", "figure.pool.swim"), ("Dom", "Fuerza", "dumbbell")]
        default: [("Lun", "Natación", "figure.pool.swim"), ("Mié", "Bicicleta", "bicycle"), ("Vie", "Carrera", "figure.run"), ("Dom", "Fuerza y movilidad", "dumbbell")]
        }
        return preferences.weeklyHours <= 6 ? Array(all.prefix(3)) : all
    }
    private func choice(title: String, value: String, icon: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 13) {
                Image(systemName: icon).font(.headline).frame(width: 28, height: 28).foregroundStyle(Color.triWaveXAqua)
                VStack(alignment: .leading, spacing: 2) { Text(title).font(.caption.weight(.semibold)).foregroundStyle(.secondary); Text(value).font(.headline).foregroundStyle(.primary) }
                Spacer(); Image(systemName: "chevron.up.chevron.down").font(.caption.weight(.bold)).foregroundStyle(Color.triWaveXAqua)
            }.padding(15).background(Color.triWaveXSurface, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                .overlay { RoundedRectangle(cornerRadius: 16, style: .continuous).stroke(Color.triWaveXAqua.opacity(0.55), lineWidth: 1.5) }
        }.buttonStyle(.plain)
    }
    private func persist() { NativeAthleteDraft.save(preferences, step: step) }
    private func cancelAndClear() { NativeAthleteDraft.clear(); onCancel() }
    private func ensureDistanceMatchesModality() {
        guard !distanceOptions.contains(where: { $0.id == preferences.distance }) else { return }
        preferences.distance = distanceOptions[0].id
    }
}

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
        struct Result: Decodable { let emailConfirmRequired: Bool; let destination: String?; let userID: String; let role: String? }
        do {
            let result = try await transport.send("/api/native/register", body: Input(email: email.trimmingCharacters(in: .whitespacesAndNewlines), password: password, firstName: firstName.trimmingCharacters(in: .whitespacesAndNewlines), lastName: lastName.trimmingCharacters(in: .whitespacesAndNewlines), role: role), response: Result.self)
            password = ""; passwordConfirmation = ""
            clearDraft()
            if result.emailConfirmRequired { state = .confirmationRequired(email); return nil }
            guard let destination = result.destination, !result.userID.isEmpty,
                  let responseRole = result.role, responseRole == role else {
                state = .failed("El tipo de cuenta recibido no coincide. Contacta con soporte antes de volver a intentarlo.")
                return nil
            }
            state = .idle
            return Outcome(
                destination: destination,
                givenName: firstName.trimmingCharacters(in: .whitespacesAndNewlines),
                role: responseRole,
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
    var targetRaceDate: Date?
    var level = "intermedio"
    var weeklyHours = 7.0
    var wantsCoach = false
    var injuries = ""
    var healthDataConsent = false
    var state: State = .editing
    private let transport: NativeEntryTransport
    private let defaults: UserDefaults

    init(origin: URL, store: WKWebsiteDataStore, defaults: UserDefaults = .standard) {
        transport = NativeEntryTransport(origin: origin, store: store)
        self.defaults = defaults
        NativeAthleteDraft.removeExpired(from: defaults)
        goal = defaults.string(forKey: "triwavex.onboarding.goal") ?? goal
        modality = defaults.string(forKey: "triwavex.onboarding.modality") ?? modality
        targetRaceDistance = defaults.string(forKey: "triwavex.onboarding.targetRaceDistance") ?? targetRaceDistance
        if let rawDate = defaults.string(forKey: "triwavex.onboarding.targetRaceDate"), !rawDate.isEmpty {
            targetRaceDate = NativeAthleteDraft.dayDate(rawDate)
        }
        level = defaults.string(forKey: "triwavex.onboarding.level") ?? level
        if defaults.object(forKey: "triwavex.onboarding.weeklyHours") != nil {
            weeklyHours = defaults.double(forKey: "triwavex.onboarding.weeklyHours")
        }
        wantsCoach = defaults.bool(forKey: "triwavex.onboarding.wantsCoach")
        if defaults.bool(forKey: "triwavex.onboarding.readyForPayment") { state = .readyForPayment }
    }

    var hasDraft: Bool {
        defaults.object(forKey: "triwavex.onboarding.step") != nil ||
            defaults.object(forKey: NativeAthleteDraft.expiryKey) != nil ||
            defaults.bool(forKey: "triwavex.onboarding.readyForPayment")
    }

    func persistDraft(step: Int) {
        defaults.set(goal, forKey: "triwavex.onboarding.goal")
        defaults.set(modality, forKey: "triwavex.onboarding.modality")
        defaults.set(targetRaceDistance, forKey: "triwavex.onboarding.targetRaceDistance")
        defaults.set(level, forKey: "triwavex.onboarding.level")
        defaults.set(weeklyHours, forKey: "triwavex.onboarding.weeklyHours")
        defaults.set(wantsCoach, forKey: "triwavex.onboarding.wantsCoach")
        defaults.set(step, forKey: "triwavex.onboarding.step")
    }

    func clearDraft() {
        NativeAthleteDraft.clear(from: defaults)
    }

    func save() async {
        state = .saving
        struct Input: Encodable { let goal, modality, targetRaceDistance, level: String; let targetRaceDate: String?; let weeklyHours: Double; let wantsCoach: Bool; let previousInjuries: String; let healthDataConsent: Bool }
        struct Result: Decodable { let success: Bool; let preview: NativePlanPreview }
        do {
            let result = try await transport.send("/api/native/onboarding", body: Input(goal: goal, modality: modality, targetRaceDistance: targetRaceDistance, level: level, targetRaceDate: targetRaceDate.map(Self.dayString), weeklyHours: weeklyHours, wantsCoach: wantsCoach, previousInjuries: injuries, healthDataConsent: healthDataConsent), response: Result.self)
            state = .preview(result.preview)
        } catch { state = .failed(error.localizedDescription) }
    }

    func continueToPayment() {
        state = .readyForPayment
        defaults.set(true, forKey: "triwavex.onboarding.readyForPayment")
    }

    private static func dayString(_ date: Date) -> String {
        NativeAthleteDraft.dayString(date)
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
            Toggle("Consiento que TriWaveX use estos datos de salud para adaptar mi entrenamiento", isOn: $model.healthDataConsent)
                .font(.footnote)
            Text("Puedes dejarlo en blanco si prefieres no compartir esta información. Tu consentimiento se guardará junto con el perfil.")
                .font(.footnote).foregroundStyle(.secondary)
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
                .buttonStyle(.borderedProminent).controlSize(.large).frame(maxWidth: .infinity)
                .disabled(isSaving || model.goal.trimmingCharacters(in: .whitespacesAndNewlines).count < 2 || (!model.injuries.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !model.healthDataConsent))
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
