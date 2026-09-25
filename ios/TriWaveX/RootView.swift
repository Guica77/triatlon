import AuthenticationServices
import SwiftUI
import GoogleSignInSwift
import UIKit

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
    @State private var isShowingAthleteOnboarding = false
    @State private var isShowingCoachIntroduction = false
    @State private var role: Role = .athlete
    @State private var onboardingGivenName = ""
    @State private var coachCheckout: CoachCheckout?
    @State private var guidedTourRequest: GuidedTourRequest?
    @State private var hasCompletedStartup = false
    @State private var hasCompletedStartupBeat = false
    @State private var loginIntroStage = 0
    @State private var liftsLoginTitle = false
    @Environment(\.verticalSizeClass) private var verticalSizeClass
    @AppStorage("triwavex.login-intro.seen.v1") private var hasSeenLoginIntro = false
    @AppStorage("triwavex.app-overview.seen.v4") private var hasSeenAppOverview = false
    @FocusState private var focusedField: FocusedField?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    init(origin: URL) {
        _session = State(initialValue: SessionModel(origin: origin))
        let defaults = UserDefaults.standard
        _email = State(initialValue: defaults.string(forKey: "triwavex.login.email") ?? "")
        _role = State(initialValue: Role(rawValue: defaults.string(forKey: "triwavex.login.role") ?? "") ?? .athlete)
        _registrationRole = State(initialValue: Role(rawValue: defaults.string(forKey: "triwavex.registration.activeRole") ?? ""))
        // Keep sign-in controls available immediately; the product overview
        // now carries the first-run introduction instead of a timed login reel.
        _loginIntroStage = State(initialValue: 10)
        _liftsLoginTitle = State(initialValue: true)
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
            } else if session.destination == nil, !hasSeenAppOverview {
                NativeAppIntroductionView(
                    initialRole: role.rawValue,
                    onContinue: { selectedRole in
                        finishAppIntroduction(for: selectedRole, continueToAccountSetup: true)
                    },
                    onSignIn: { selectedRole in
                        finishAppIntroduction(for: selectedRole, continueToAccountSetup: false)
                    }
                )
                .transition(.opacity)
            } else if isShowingAthleteOnboarding {
                NativeAthleteOnboardingView(
                    onCreateAccount: {
                        isShowingAthleteOnboarding = false
                        setRegistrationRole(.athlete)
                    },
                    onContinueWithApple: { request in session.prepareAppleRequest(request) },
                    onAppleCompletion: { result in
                        Task {
                            await session.handleAppleCompletion(result, expectedRole: Role.athlete.rawValue)
                            guard session.destination != nil else { return }
                            isShowingAthleteOnboarding = false
                            if session.destination == "/onboarding" {
                                onboardingGivenName = ""
                            } else {
                                NativeAthleteDraft.clear()
                            }
                        }
                    },
                    onContinueWithGoogle: {
                        googleSignIn(role: .athlete) {
                            isShowingAthleteOnboarding = false
                            if session.destination == "/onboarding" { onboardingGivenName = "" }
                            else { NativeAthleteDraft.clear() }
                        }
                    },
                    appleError: session.error,
                    isSigningIn: session.busy,
                    onCancel: { isShowingAthleteOnboarding = false }
                )
                .transition(.opacity)
            } else if isShowingCoachIntroduction {
                NativeCoachIntroductionView(
                    onCreateAccount: {
                        isShowingCoachIntroduction = false
                        setRegistrationRole(.coach)
                    },
                    onSignIn: {
                        isShowingCoachIntroduction = false
                        role = .coach
                        UserDefaults.standard.set(Role.coach.rawValue, forKey: "triwavex.login.role")
                    }
                )
                .transition(.opacity)
            } else if let registrationRole {
                NativeRegistrationView(
                    role: registrationRole.rawValue,
                    origin: session.origin,
                    store: session.store,
                    onCancel: {
                        if registrationRole == .athlete {
                            setRegistrationRole(nil)
                            isShowingAthleteOnboarding = true
                        } else {
                            setRegistrationRole(nil)
                        }
                    },
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
            } else if session.destination == "/checkout", let userID = session.stableUserID {
                NavigationStack {
                    NativeSubscriptionStoreView(
                        origin: session.origin,
                        store: session.store,
                        expectedUserID: userID,
                        role: Role.athlete.rawValue,
                        showPlanComparison: false,
                        onFinished: { result in
                            guard result.userID == userID, result.role == Role.athlete.rawValue else { return }
                            guidedTourRequest = GuidedTourRequest(userID: result.userID, role: .athlete, givenName: onboardingGivenName)
                            session.destination = result.destination
                        }
                    )
                }
                .transition(.opacity)
            } else if session.destination == "/onboarding", session.role == Role.coach.rawValue,
                      let userID = session.stableUserID {
                NavigationStack {
                    NativeSubscriptionStoreView(
                        origin: session.origin,
                        store: session.store,
                        expectedUserID: userID,
                        role: Role.coach.rawValue,
                        onFinished: { result in
                            guard result.userID == userID,
                                  result.role == Role.coach.rawValue else { return }
                            guidedTourRequest = GuidedTourRequest(
                                userID: result.userID,
                                role: .coach,
                                givenName: onboardingGivenName
                            )
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
        .task(id: "\(session.stableUserID ?? "")|\(session.role ?? "")") {
            guard let userID = session.stableUserID,
                  let role = session.role else { return }
            let transactionStore = SubscriptionStore(
                origin: session.origin,
                store: session.store,
                expectedUserID: userID,
                expectedRole: role
            )
            await transactionStore.observeTransactions { authorization in
                guard let authorization else { return }
                _ = session.applySubscriptionResult(authorization)
            }
        }
        .task {
#if DEBUG
            let arguments = ProcessInfo.processInfo.arguments
            if arguments.contains("--capture-demo-tour") || arguments.contains("--preview-guided-onboarding") {
                hasSeenAppOverview = true
                hasSeenLoginIntro = true
                loginIntroStage = 10
                hasCompletedStartupBeat = true
                hasCompletedStartup = true
                return
            }
#endif
            async let restore: Void = session.restore()
            if !hasSeenAppOverview {
                hasCompletedStartupBeat = true
                hasCompletedStartup = true
                await restore
                return
            }
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
            await session.login(email: "demo@triatlonpro.com", password: "demo123456", expectedRole: Role.athlete.rawValue)
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
        let compactHeight = verticalSizeClass == .compact
        return NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    branding
                        .padding(.bottom, compactHeight ? 8 : 12)

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
                        loginSectionTitle(role == .coach ? "Acceso de entrenador" : "Acceso de atleta")
                            .transition(loginEntryTransition)
                        if role == .coach {
                            Label("Gestiona tus atletas, planes y comunicación desde tu espacio de entrenador.", systemImage: "person.2.fill")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                                .fixedSize(horizontal: false, vertical: true)
                                .padding(.horizontal, 8)
                                .padding(.bottom, 12)
                                .transition(loginEntryTransition)
                        }
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
                                Text(role == .coach ? "Entrar en mi espacio de entrenador" : "Entrar como atleta")
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
                        .padding(.top, compactHeight ? 10 : 14)
                        .padding(.bottom, 6)

                    SignInWithAppleButton(.continue) { request in
                        session.prepareAppleRequest(request)
                    } onCompletion: { result in
                        Task { await session.handleAppleCompletion(result, expectedRole: role.rawValue) }
                    }
                    .signInWithAppleButtonStyle(.black)
                    .frame(maxWidth: .infinity)
                    .frame(height: 50)
                    .disabled(session.busy)
                    .accessibilityHint("Usa tu cuenta de Apple para iniciar sesión como \(role.title.lowercased())")
                    .opacity(session.busy ? 0.7 : 1)

                    GoogleSignInButton(
                        scheme: .light,
                        style: .wide,
                        state: session.busy ? .disabled : .normal
                    ) {
                        googleSignIn(role: role)
                    }
                    .frame(height: 50)
                    .disabled(session.busy)
                    .accessibilityHint("Usa Google para iniciar sesión como \(role.title.lowercased())")

                    VStack(spacing: 8) {
                        if !email.isEmpty {
                            Label("Continuamos donde lo dejaste", systemImage: "arrow.counterclockwise.circle.fill")
                                .font(.footnote.weight(.semibold))
                                .foregroundStyle(.tint)
                        }
                        Text(role == .coach ? "¿Aún no tienes cuenta de entrenador?" : "¿Nuevo en TriWaveX?")
                            .foregroundStyle(.secondary)
                        Button(role == .coach ? "Crear cuenta de entrenador" : "Crear cuenta de atleta") {
                        if role == .athlete {
                            isShowingAthleteOnboarding = true
                        } else {
                            isShowingCoachIntroduction = true
                        }
                        }
                    }
                    .font(.subheadline)
                    .frame(maxWidth: .infinity, minHeight: TriWaveXMetrics.minimumTouchTarget)
                    .padding(.top, 12)
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
                    .padding(.top, 16)
                    .transition(loginEntryTransition)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, compactHeight ? 8 : 16)
                .padding(.bottom, compactHeight ? 10 : 16)
                .frame(maxWidth: 520)
                .frame(maxWidth: .infinity)
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .scrollDismissesKeyboard(.interactively)
            .scrollIndicators(.hidden)
            .toolbar(.hidden, for: .navigationBar)
        }
        .task { await playLoginIntro() }
    }

    private var loginSurface: Color {
        Color(uiColor: .secondarySystemGroupedBackground)
    }

    private func googleSignIn(role: Role, onAuthenticated: @escaping () -> Void = {}) {
        guard let scene = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .first(where: { $0.activationState == .foregroundActive }),
              let root = scene.windows.first(where: \.isKeyWindow)?.rootViewController else {
            session.error = "No se ha podido abrir la ventana segura de Google. Inténtalo de nuevo."
            return
        }
        var presenter = root
        while let presented = presenter.presentedViewController { presenter = presented }
        Task {
            await session.signInWithGoogle(presenting: presenter, expectedRole: role.rawValue)
            guard session.destination != nil else { return }
            onAuthenticated()
        }
    }

    private func loginSectionTitle(_ title: String) -> some View {
        Text(title)
            .font(.system(size: 18, weight: .bold))
            .foregroundStyle(.secondary)
            .padding(.top, verticalSizeClass == .compact ? 10 : 14)
            .padding(.bottom, 6)
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
        VStack(spacing: verticalSizeClass == .compact ? 8 : 12) {
            Group {
                if loginIntroStage < 3 {
                    TypingCycleText(text: loginIntroCopy[loginIntroStage])
                        .font(.system(size: 31, weight: .bold))
                        .foregroundStyle(.primary)
                        .multilineTextAlignment(.center)
                        .transition(.opacity)
                } else if loginIntroStage == 3 {
                    Text("Para eso está…")
                        .font(.system(size: 31, weight: .bold))
                        .foregroundStyle(.primary)
                        .transition(.opacity)
                } else {
                    triWaveXWordmark
                        .frame(height: verticalSizeClass == .compact ? 54 : 64)
                        .scaleEffect(firstIntroWordmarkScale)
                }
            }
            .frame(maxWidth: .infinity, minHeight: verticalSizeClass == .compact ? 54 : 64)

            loginIntroProgress
                .opacity(loginIntroStage < 8 ? 1 : 0)
        }
        .frame(maxWidth: .infinity)
        .offset(y: !reduceMotion && verticalSizeClass != .compact && (loginIntroStage < 4 || liftsLoginTitle && loginIntroStage < 7) ? 250 : 0)
        .animation(
            liftsLoginTitle && !reduceMotion && loginIntroStage == 7
                ? TriWaveXMotion.loginTitleLift
                : TriWaveXMotion.entry(reduced: reduceMotion),
            value: loginIntroStage
        )
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(loginIntroStage < 3 ? loginIntroCopy[loginIntroStage] : loginIntroStage == 3 ? "Para eso está" : "TriWaveX. Entrena con una dirección clara")
    }

    private var loginIntroProgress: some View {
        HStack(spacing: 8) {
            ForEach(0..<3, id: \.self) { step in
                Circle()
                    .fill(step <= min(loginIntroStage, 2) ? Color.triWaveXAqua : Color(uiColor: .tertiaryLabel))
                    .frame(width: 6, height: 6)
                    .scaleEffect(step == min(loginIntroStage, 2) ? 1.18 : 1)
            }
        }
        .animation(TriWaveXMotion.selection(reduced: reduceMotion), value: loginIntroStage)
        .accessibilityHidden(true)
    }

    private var triWaveXWordmark: some View {
        TriWaveXWordmark(font: .system(size: 34, weight: .black, design: .rounded))
    }

    private var firstIntroWordmarkScale: CGFloat {
        guard (4..<7).contains(loginIntroStage), !reduceMotion else {
            return 1
        }
        return 1.58
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
        hasSeenLoginIntro = true
        liftsLoginTitle = true
        loginIntroStage = 10
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
                password: password,
                expectedRole: role.rawValue
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

    private func finishAppIntroduction(
        for selectedRole: NativeAppIntroductionView.AccountRole,
        continueToAccountSetup: Bool
    ) {
        let selected: Role = selectedRole == .coach ? .coach : .athlete
        role = selected
        UserDefaults.standard.set(selected.rawValue, forKey: "triwavex.login.role")
        hasSeenAppOverview = true
        hasSeenLoginIntro = true
        loginIntroStage = 10
        liftsLoginTitle = true

        if continueToAccountSetup, selected == .athlete {
            setRegistrationRole(nil)
            isShowingAthleteOnboarding = true
        } else if continueToAccountSetup {
            isShowingCoachIntroduction = true
        } else {
            setRegistrationRole(nil)
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
