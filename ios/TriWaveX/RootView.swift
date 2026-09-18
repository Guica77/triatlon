import AuthenticationServices
import SwiftUI

struct RootView: View {
    private struct CoachCheckout {
        let destination: String
        let givenName: String
    }

    private enum Role: String, CaseIterable {
        case athlete
        case coach

        var title: String {
            self == .athlete ? "Atleta" : "Entrenador"
        }
    }

    private enum FocusedField {
        case email
        case password
    }

    @State private var session: SessionModel
    @State private var email = ""
    @State private var password = ""
    @State private var informationURL: URL?
    @State private var registrationRole: Role?
    @State private var role: Role = .athlete
    @State private var onboardingGivenName = ""
    @State private var coachCheckout: CoachCheckout?
    @State private var guidedTourRequest: GuidedTourRequest?
    @FocusState private var focusedField: FocusedField?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    init(origin: URL) {
        _session = State(initialValue: SessionModel(origin: origin))
        let defaults = UserDefaults.standard
        _email = State(initialValue: defaults.string(forKey: "triwavex.login.email") ?? "")
        _role = State(initialValue: Role(rawValue: defaults.string(forKey: "triwavex.login.role") ?? "") ?? .athlete)
        _registrationRole = State(initialValue: Role(rawValue: defaults.string(forKey: "triwavex.registration.activeRole") ?? ""))
        if defaults.bool(forKey: "triwavex.coachCheckout.pending") {
            _coachCheckout = State(initialValue: CoachCheckout(
                destination: defaults.string(forKey: "triwavex.coachCheckout.destination") ?? "/coach/dashboard",
                givenName: defaults.string(forKey: "triwavex.coachCheckout.givenName") ?? ""
            ))
        }
    }

    var body: some View {
        Group {
            if let registrationRole {
                NativeRegistrationView(
                    role: registrationRole.rawValue,
                    origin: session.origin,
                    store: session.store,
                    onCancel: { setRegistrationRole(nil) },
                    onRegistered: { outcome in
                        setRegistrationRole(nil)
                        onboardingGivenName = outcome.givenName
                        if outcome.role == Role.coach.rawValue {
                            setCoachCheckout(CoachCheckout(destination: outcome.destination, givenName: outcome.givenName))
                        } else {
                            session.destination = outcome.destination
                        }
                    }
                )
                .transition(.opacity)
            } else if let coachCheckout {
                NavigationStack {
                    NativeSubscriptionStoreView(
                        role: Role.coach.rawValue,
                        onFinished: {
                            setCoachCheckout(nil)
                            session.destination = coachCheckout.destination
                        },
                        onPurchased: {
                            guidedTourRequest = GuidedTourRequest(role: .coach, givenName: coachCheckout.givenName)
                            setCoachCheckout(nil)
                            session.destination = coachCheckout.destination
                        }
                    )
                }
                .transition(.opacity)
            } else if session.destination == "/onboarding" {
                NativeOnboardingView(
                    origin: session.origin,
                    store: session.store,
                    givenName: onboardingGivenName,
                    onFinished: { purchased in
                        if purchased {
                            guidedTourRequest = GuidedTourRequest(role: .athlete, givenName: onboardingGivenName)
                        }
                        session.destination = "/dashboard"
                    }
                )
                .transition(.opacity)
            } else if let destination = session.destination {
                ProductView(
                    origin: session.origin,
                    store: session.store,
                    initialPath: destination,
                    onDismiss: nil,
                    onSessionEnded: { Task { await session.endSession() } },
                    guidedTourRequest: guidedTourRequest,
                    onGuidedTourFinished: { guidedTourRequest = nil }
                )
                .transition(.opacity)
            } else {
                loginView
            }
        }
        .sheet(
            isPresented: Binding(
                get: { informationURL != nil },
                set: { if !$0 { informationURL = nil } }
            )
        ) {
            if let informationURL {
                ProductView(
                    origin: session.origin,
                    store: session.store,
                    initialPath: informationURL.path,
                    onDismiss: { self.informationURL = nil },
                    onSessionEnded: { self.informationURL = nil; Task { await session.endSession() } },
                    guidedTourRequest: nil,
                    onGuidedTourFinished: {}
                )
            }
        }
        .tint(.triWaveXAqua)
        .animation(TriWaveXMotion.stateChange(reduced: reduceMotion), value: session.destination)
        .task {
#if DEBUG
            let arguments = ProcessInfo.processInfo.arguments
            if arguments.contains("--capture-demo-tour") || arguments.contains("--preview-guided-onboarding") { return }
#endif
            await session.restore()
        }
#if DEBUG
        .task {
            let arguments = ProcessInfo.processInfo.arguments
            guard arguments.contains("--capture-demo-tour") || arguments.contains("--preview-guided-onboarding"),
                  session.destination == nil,
                  !session.busy else { return }
            if arguments.contains("--preview-guided-onboarding") {
                guidedTourRequest = GuidedTourRequest(role: .athlete, givenName: "Guillermo")
            }
            try? await Task.sleep(for: .seconds(3))
            guard !Task.isCancelled else { return }
            await session.login(email: "demo@triatlonpro.com", password: "demo123456")
        }
#endif
    }

    private var loginView: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    branding
                        .padding(.bottom, 30)

                    loginSectionTitle("Tipo de cuenta")
                    Picker("Tipo de cuenta", selection: $role) {
                        ForEach(Role.allCases, id: \.self) { option in
                            Text(option.title).tag(option)
                        }
                    }
                    .pickerStyle(.segmented)
                    .font(.headline)
                    .padding(8)
                    .background(loginSurface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                    .accessibilityLabel("Tipo de cuenta")
                    .disabled(session.busy)
                    .onChange(of: role) { _, value in
                        UserDefaults.standard.set(value.rawValue, forKey: "triwavex.login.role")
                    }

                    loginSectionTitle("Acceso")
                    loginSurfaceGroup {
                        TextField("Correo electrónico", text: $email)
                            .textContentType(.username)
                            .keyboardType(.emailAddress)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .submitLabel(.next)
                            .focused($focusedField, equals: .email)
                            .onSubmit { focusedField = .password }
                            .accessibilityLabel("Correo electrónico")
                            .frame(minHeight: 52)
                            .font(.system(size: 18))
                            .onChange(of: email) { _, value in
                                UserDefaults.standard.set(value, forKey: "triwavex.login.email")
                            }

                        Divider()

                        SecureField("Contraseña", text: $password)
                            .textContentType(.password)
                            .submitLabel(.go)
                            .focused($focusedField, equals: .password)
                            .onSubmit { if canSubmit { login() } }
                            .accessibilityLabel("Contraseña")
                            .frame(minHeight: 52)
                            .font(.system(size: 18))

                        if let error = session.error {
                            Divider()
                            Label(error, systemImage: "exclamationmark.triangle.fill")
                                .font(.footnote.weight(.medium))
                                .foregroundStyle(.red)
                                .fixedSize(horizontal: false, vertical: true)
                                .accessibilityLabel("Error: \(error)")
                        }
                    }

                    Button {
                        login()
                    } label: {
                        HStack(spacing: 8) {
                            if session.busy { ProgressView() }
                            Text("Entrar como \(role.title.lowercased())")
                        }
                        .font(.system(size: 18, weight: .bold))
                        .frame(maxWidth: .infinity, minHeight: TriWaveXMetrics.minimumTouchTarget)
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                    .padding(.top, 14)
                    .disabled(!canSubmit || session.busy)
                    .accessibilityHint(session.busy ? "Iniciando sesión" : "Doble toque para iniciar sesión")

                    Link(destination: session.origin.appendingPathComponent("forgot-password")) {
                        Text("¿Has olvidado la contraseña?")
                            .frame(maxWidth: .infinity, minHeight: TriWaveXMetrics.minimumTouchTarget)
                    }
                    .font(.subheadline)
                    .padding(.top, 8)

                    Text("Otra forma de entrar")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity)
                        .padding(.top, 24)
                        .padding(.bottom, 12)

                    SignInWithAppleButton(.continue) { request in
                        session.prepareAppleRequest(request)
                    } onCompletion: { result in
                        Task { await session.handleAppleCompletion(result, role: role.rawValue) }
                    }
                    .signInWithAppleButtonStyle(.black)
                    .frame(maxWidth: .infinity)
                    .frame(height: 50)
                    .disabled(session.busy)
                    .accessibilityHint("Usa tu cuenta de Apple para iniciar sesión")
                    .opacity(session.busy ? 0.7 : 1)

                    VStack(spacing: 8) {
                        if !email.isEmpty {
                            Label("Continuamos donde lo dejaste", systemImage: "arrow.counterclockwise.circle.fill")
                                .font(.footnote.weight(.semibold))
                                .foregroundStyle(.tint)
                        }
                        Text("¿Nuevo en TriWaveX?")
                            .foregroundStyle(.secondary)
                        Button("Crear cuenta") {
                            setRegistrationRole(role)
                        }
                    }
                    .font(.subheadline)
                    .frame(maxWidth: .infinity, minHeight: TriWaveXMetrics.minimumTouchTarget)
                    .padding(.top, 28)
                    .accessibilityHint("Abre el registro de \(role.title.lowercased())")

                    HStack {
                        Button("Privacidad") {
                            informationURL = session.origin.appendingPathComponent("privacidad")
                        }
                        Spacer()
                        Button("Soporte") {
                            informationURL = session.origin.appendingPathComponent("soporte")
                        }
                    }
                    .font(.footnote.weight(.semibold))
                    .padding(.horizontal, -8)
                    .padding(.top, 26)
                }
                .padding(.horizontal, 20)
                .padding(.top, 54)
                .padding(.bottom, 32)
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .scrollDismissesKeyboard(.interactively)
            .toolbar(.hidden, for: .navigationBar)
        }
    }

    private var loginSurface: Color {
        Color(uiColor: .secondarySystemGroupedBackground)
    }

    private func loginSectionTitle(_ title: String) -> some View {
        Text(title)
            .font(.system(size: 21, weight: .bold))
            .foregroundStyle(.secondary)
            .padding(.top, 18)
            .padding(.bottom, 8)
            .padding(.horizontal, 8)
    }

    private func loginSurfaceGroup<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            content()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 4)
        .background(loginSurface, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
    }

    private var branding: some View {
        VStack(spacing: 6) {
            Text("TriWaveX")
                .font(.system(size: 34, weight: .bold))
                .foregroundStyle(.primary)

            Text("Entrena con una dirección clara")
                .font(.system(size: 17))
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("TriWaveX. Entrena con una dirección clara")
    }

    private var canSubmit: Bool {
        !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !password.isEmpty
    }

    private func login() {
        guard canSubmit, !session.busy else { return }
        focusedField = nil
        Task {
            await session.login(
                email: email.trimmingCharacters(in: .whitespacesAndNewlines),
                password: password
            )
            if session.destination != nil {
                password = ""
                UserDefaults.standard.removeObject(forKey: "triwavex.login.email")
            }
        }
    }

    private func setRegistrationRole(_ value: Role?) {
        registrationRole = value
        if let value {
            UserDefaults.standard.set(value.rawValue, forKey: "triwavex.registration.activeRole")
        } else {
            UserDefaults.standard.removeObject(forKey: "triwavex.registration.activeRole")
        }
    }

    private func setCoachCheckout(_ value: CoachCheckout?) {
        coachCheckout = value
        let defaults = UserDefaults.standard
        if let value {
            defaults.set(true, forKey: "triwavex.coachCheckout.pending")
            defaults.set(value.destination, forKey: "triwavex.coachCheckout.destination")
            defaults.set(value.givenName, forKey: "triwavex.coachCheckout.givenName")
        } else {
            ["pending", "destination", "givenName"].forEach {
                defaults.removeObject(forKey: "triwavex.coachCheckout.\($0)")
            }
        }
    }
}
