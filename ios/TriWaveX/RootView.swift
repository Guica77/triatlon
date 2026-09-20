import AuthenticationServices
import SwiftUI

struct RootView: View {
    private struct CoachCheckout {
        let destination: String
        let givenName: String
        let userID: String
        let role: Role
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
    @State private var hasCompletedStartup = false
    @State private var hasCompletedStartupBeat = false
    @State private var loginIntroStage = 0
    @State private var isPlayingLoginIntro = false
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
                givenName: defaults.string(forKey: "triwavex.coachCheckout.givenName") ?? "",
                userID: defaults.string(forKey: "triwavex.coachCheckout.userID") ?? "",
                role: Role(rawValue: defaults.string(forKey: "triwavex.coachCheckout.role") ?? "coach") ?? .coach
            ))
        }
    }

    var body: some View {
        Group {
            if !hasCompletedStartup {
                TriWaveXStartupView(isRestoringSession: !session.hasCompletedRestore)
                    .transition(.opacity)
            } else if let registrationRole {
                NativeRegistrationView(
                    role: registrationRole.rawValue,
                    origin: session.origin,
                    store: session.store,
                    onCancel: { setRegistrationRole(nil) },
                    onRegistered: { outcome in
                        setRegistrationRole(nil)
                        onboardingGivenName = outcome.givenName
                        session.setStableUserID(outcome.userID)
                        if outcome.role == Role.coach.rawValue {
                            setCoachCheckout(CoachCheckout(destination: outcome.destination, givenName: outcome.givenName, userID: outcome.userID, role: .coach))
                        } else {
                            session.destination = outcome.destination
                        }
                    }
                )
                .transition(.opacity)
            } else if let coachCheckout {
                NavigationStack {
                    NativeSubscriptionStoreView(
                        origin: session.origin,
                        store: session.store,
                        expectedUserID: coachCheckout.userID,
                        role: Role.coach.rawValue,
                        onFinished: { result in
                            guard result.userID == coachCheckout.userID,
                                  result.role == Role.coach.rawValue else { return }
                            guidedTourRequest = GuidedTourRequest(
                                userID: result.userID,
                                role: .coach,
                                givenName: coachCheckout.givenName
                            )
                            setCoachCheckout(nil)
                            session.destination = result.destination
                        }
                    )
                }
                .transition(.opacity)
            } else if session.destination == "/onboarding" {
                Group {
                    if let userID = session.stableUserID {
                        NativeOnboardingView(
                            origin: session.origin,
                            store: session.store,
                            expectedUserID: userID,
                            givenName: onboardingGivenName,
                            onFinished: { result in
                                guard result.userID == userID,
                                      result.role == Role.athlete.rawValue else { return }
                                guidedTourRequest = GuidedTourRequest(
                                    userID: result.userID,
                                    role: .athlete,
                                    givenName: onboardingGivenName
                                )
                                session.destination = result.destination
                            }
                        )
                    } else {
                        ProgressView("Cargando sesión…")
                    }
                }
                .transition(.opacity)
            } else if let destination = session.destination {
                ProductView(
                    origin: session.origin,
                    store: session.store,
                    initialPath: destination,
                    authenticatedUserID: session.stableUserID,
                    authenticatedRole: session.role,
                    onDismiss: nil,
                    onSessionEnded: { Task { await session.endSession() } },
                    guidedTourRequest: guidedTourRequest,
                    onGuidedTourFinished: { guidedTourRequest = nil },
                    onSubscriptionFinished: { result in
                        _ = session.applySubscriptionResult(result)
                    }
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
                    authenticatedUserID: session.stableUserID,
                    authenticatedRole: session.role,
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
            if arguments.contains("--capture-demo-tour") || arguments.contains("--preview-guided-onboarding") {
                hasCompletedStartupBeat = true
                hasCompletedStartup = true
                return
            }
#endif
            async let restore: Void = session.restore()
            if !reduceMotion {
                try? await Task.sleep(for: .milliseconds(280))
                guard !Task.isCancelled else { return }
            }
            hasCompletedStartupBeat = true
            await restore
            finishStartupIfReady()
        }
        .onChange(of: session.hasCompletedRestore) { _, _ in
            finishStartupIfReady()
        }
#if DEBUG
        .task {
            let arguments = ProcessInfo.processInfo.arguments
            guard arguments.contains("--capture-demo-tour") || arguments.contains("--preview-guided-onboarding"),
                  session.destination == nil,
                  !session.busy else { return }
            if arguments.contains("--preview-guided-onboarding") {
                guidedTourRequest = GuidedTourRequest(userID: "preview-user", role: .athlete, givenName: "Guillermo")
            }
            try? await Task.sleep(for: .seconds(3))
            guard !Task.isCancelled else { return }
            await session.login(email: "demo@triatlonpro.com", password: "demo123456")
        }
#endif
    }

    private func finishStartupIfReady() {
        guard hasCompletedStartupBeat,
              session.hasCompletedRestore,
              !hasCompletedStartup else { return }

        withAnimation(TriWaveXMotion.entry(reduced: reduceMotion)) {
            hasCompletedStartup = true
        }
    }

    private var loginView: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    branding
                        .padding(.bottom, 30)

                    if loginIntroStage >= 8 {
                        loginSectionTitle("Tipo de cuenta")
                            .transition(loginEntryTransition)
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
                        .transition(loginEntryTransition)
                    }

                    if loginIntroStage >= 9 {
                        loginSectionTitle("Acceso")
                            .transition(loginEntryTransition)
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
                        .transition(loginEntryTransition)
                    }

                    if loginIntroStage >= 10 {
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
                        Task { await session.handleAppleCompletion(result) }
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
                    .transition(loginEntryTransition)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 54)
                .padding(.bottom, 32)
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .scrollDismissesKeyboard(.interactively)
            .toolbar(.hidden, for: .navigationBar)
        }
        .task { await playLoginIntro() }
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
        Group {
            if loginIntroStage < 3 {
                TypingText(
                    text: loginIntroCopy[loginIntroStage],
                    characterDelay: reduceMotion ? .zero : .milliseconds(32)
                )
                .font(.system(size: 31, weight: .bold))
                .foregroundStyle(.primary)
                .multilineTextAlignment(.center)
                .transition(.opacity)
            } else if loginIntroStage == 3 {
                Text("Para eso está…")
                    .font(.system(size: 28, weight: .semibold))
                    .foregroundStyle(.secondary)
                    .transition(.opacity)
            } else {
                ZStack {
                    Text("TriWaveX")
                        .font(.system(size: loginIntroStage < 7 ? 46 : 34, weight: .black, design: .rounded))
                        .offset(y: loginIntroStage == 4 ? -46 : 0)

                    if loginIntroStage >= 7 {
                        Text("Entrena con una dirección clara")
                            .font(.system(size: 17))
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                            .offset(y: 31)
                    }

                    if loginIntroStage == 4 {
                        TriWaveXMark()
                            .frame(width: 104, height: 84)
                            .offset(y: 47)
                            .transition(.opacity)
                    }
                }
                .foregroundStyle(.black)
                .frame(height: loginIntroStage < 7 ? 164 : 76)
                .background(loginIntroStage < 7 ? .white : .clear, in: RoundedRectangle(cornerRadius: 30, style: .continuous))
            }
        }
        .frame(maxWidth: .infinity, minHeight: loginIntroStage < 7 && loginIntroStage >= 4 ? 164 : 76)
        .offset(y: loginIntroStage < 7 ? 250 : 0)
        .animation(loginIntroStage == 7 ? TriWaveXMotion.loginLogoLift : TriWaveXMotion.entry(reduced: reduceMotion), value: loginIntroStage)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(loginIntroStage < 3 ? loginIntroCopy[loginIntroStage] : "TriWaveX. Entrena con una dirección clara")
    }

    private var loginIntroCopy: [String] {
        [
            "¿Pagar demasiado por entrenar?",
            "¿Otra app difícil de manejar?",
            "¿No sabes ni por dónde empezar?",
        ]
    }

    private var loginEntryTransition: AnyTransition {
        reduceMotion ? .opacity : .opacity.combined(with: .move(edge: .bottom))
    }

    private func playLoginIntro() async {
        guard !isPlayingLoginIntro else { return }
        isPlayingLoginIntro = true
        loginIntroStage = 0
        defer { isPlayingLoginIntro = false }

        let delays = [1200, 1200, 1200, 600, 1200, 450, 1050, 350, 350, 350]
        for (index, delay) in delays.enumerated() {
            try? await Task.sleep(for: .milliseconds(reduceMotion ? 80 : delay))
            guard !Task.isCancelled else { return }
            withAnimation(TriWaveXMotion.entry(reduced: reduceMotion)) {
                loginIntroStage = index + 1
            }
        }
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
            defaults.set(value.userID, forKey: "triwavex.coachCheckout.userID")
            defaults.set(value.role.rawValue, forKey: "triwavex.coachCheckout.role")
        } else {
            ["pending", "destination", "givenName", "userID", "role"].forEach {
                defaults.removeObject(forKey: "triwavex.coachCheckout.\($0)")
            }
        }
    }
}
