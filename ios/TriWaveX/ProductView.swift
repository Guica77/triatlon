import SwiftUI
import WebKit
import SafariServices
import AuthenticationServices
import Observation
import UIKit

struct ProductView: View {
    private enum AppTab: Hashable {
        case training
        case plan
        case progress
        case chat
        case profile
    }

    let origin: URL
    let store: WKWebsiteDataStore
    let initialPath: String
    let authenticatedUserID: String?
    let authenticatedRole: String?
    let onDismiss: (() -> Void)?
    let onSessionEnded: (() -> Void)?
    let guidedTourRequest: GuidedTourRequest?
    let onGuidedTourFinished: () -> Void
    let onSubscriptionFinished: ((NativeSubscriptionResult) -> Void)?
    @State private var browser = BrowserModel()
    @State private var strava = StravaSessionModel()
    @State private var health = HealthKitService()
    @State private var bluetooth = BluetoothHeartRateService()
    @State private var showingDevices = false
    @State private var showingAccount = false
    @State private var nativeProgressEnabled = true
    @State private var nativePlanEnabled = true
    @State private var nativeProfileEnabled = true
    @State private var nativeChatEnabled = true
    @State private var webPathOverride: String?
    @State private var athleteProgress: AthleteProgressModel
    @State private var nativePlan: NativePlanModel
    @State private var nativeProfile: NativeProfileModel
    @State private var selectedTab: AppTab
    @State private var guidedOnboarding: GuidedOnboardingModel?
    @State private var hasPresentedInitialContent = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private var isCoach: Bool {
        initialPath.hasPrefix("/coach/")
    }

    private var initialTab: AppTab {
        Self.tab(for: initialPath, isCoach: isCoach)
    }

    init(
        origin: URL,
        store: WKWebsiteDataStore,
        initialPath: String,
        authenticatedUserID: String? = nil,
        authenticatedRole: String? = nil,
        onDismiss: (() -> Void)?,
        onSessionEnded: (() -> Void)? = nil,
        guidedTourRequest: GuidedTourRequest? = nil,
        onGuidedTourFinished: @escaping () -> Void = {},
        onSubscriptionFinished: ((NativeSubscriptionResult) -> Void)? = nil
    ) {
        self.origin = origin
        self.store = store
        self.initialPath = initialPath
        self.authenticatedUserID = authenticatedUserID
        self.authenticatedRole = authenticatedRole
        self.onDismiss = onDismiss
        self.onSessionEnded = onSessionEnded
        self.guidedTourRequest = guidedTourRequest
        self.onGuidedTourFinished = onGuidedTourFinished
        self.onSubscriptionFinished = onSubscriptionFinished
        _athleteProgress = State(initialValue: AthleteProgressModel(client: AthleteProgressClient(origin: origin, store: store)))
        _nativePlan = State(initialValue: NativePlanModel(client: NativePlanClient(origin: origin, store: store)))
        _nativeProfile = State(initialValue: NativeProfileModel(client: NativeProfileClient(origin: origin, store: store)))
        _selectedTab = State(initialValue: Self.tab(for: initialPath, isCoach: initialPath.hasPrefix("/coach/")))
        _guidedOnboarding = State(initialValue: guidedTourRequest.map { GuidedOnboardingModel(request: $0) })
    }

    private static func tab(for path: String, isCoach: Bool) -> AppTab {
        if path == "/plan" && !isCoach { return .plan }
        if path == "/resumen" && !isCoach { return .progress }
        if path.hasPrefix("/chat") || path.hasPrefix("/coach/chat") { return .chat }
        if path == "/settings" { return .profile }
        return .training
    }

    private func path(for tab: AppTab) -> String {
        switch tab {
        case .training:
            return isCoach ? "/coach/dashboard" : "/dashboard"
        case .plan:
            return "/plan"
        case .progress:
            return "/resumen"
        case .chat:
            return isCoach ? "/coach/chat" : "/chat"
        case .profile:
            return "/settings"
        }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                TabView(selection: $selectedTab) {
                    Color.clear
                        .accessibilityHidden(true)
                        .tabItem { Label("Hoy", systemImage: "house") }
                        .tag(AppTab.training)

                    if !isCoach {
                        Color.clear
                            .accessibilityHidden(true)
                            .tabItem { Label("Plan", systemImage: "calendar") }
                            .tag(AppTab.plan)

                        Color.clear
                            .accessibilityHidden(true)
                            .tabItem { Label("Progreso", systemImage: "chart.bar.xaxis") }
                            .tag(AppTab.progress)
                    }

                    Color.clear
                        .accessibilityHidden(true)
                        .tabItem { Label("Chat", systemImage: "bubble.left.and.bubble.right") }
                        .tag(AppTab.chat)

                    Color.clear
                        .accessibilityHidden(true)
                        .tabItem { Label("Perfil", systemImage: "person.crop.circle") }
                        .tag(AppTab.profile)
                }
                .toolbar(.hidden, for: .tabBar)

                ProductWebView(
                    model: browser,
                    origin: origin,
                    store: store,
                    initialPath: initialPath,
                    isActive: !showingNativeSurface,
                    onStravaConnect: connectStrava,
                    onOpenDevices: { showingDevices = true }
                )
                    .opacity(showingNativeSurface || !hasPresentedInitialContent ? 0 : 1)
                    .scaleEffect(showingNativeSurface || hasPresentedInitialContent || reduceMotion ? 1 : 0.985)
                    .offset(y: showingNativeSurface || hasPresentedInitialContent || reduceMotion ? 0 : 8)
                    .animation(TriWaveXMotion.entry(reduced: reduceMotion), value: hasPresentedInitialContent)
                    .allowsHitTesting(!showingNativeSurface && hasPresentedInitialContent)
                if showingNativePlan {
                    NativePlanView(model: nativePlan)
                }
                if showingNativeProgress {
                    AthleteProgressView(model: athleteProgress, onFallback: openWebProgress)
                }
                if showingNativeProfile {
                    NativeProfileView(
                        model: nativeProfile,
                        origin: origin,
                        store: store,
                        authenticatedUserID: authenticatedUserID,
                        authenticatedRole: authenticatedRole,
                        openDevices: { showingDevices = true },
                        openCoros: { openProfileDestination("/api/auth/coros/connect") },
                        openStrava: { openProfileDestination("/api/auth/telemetry/connect?provider=strava") },
                        openPlanEditor: { selectedTab = .plan },
                        openAccount: { showingAccount = true },
                        replayGuide: replayGuidedTour,
                        onSubscriptionFinished: onSubscriptionFinished
                    )
                }
                if showingNativeChat { NativeChatView(origin: origin, store: store) }
                if !showingNativeSurface && !hasPresentedInitialContent && browser.error == nil {
                    TriWaveXLaunchScreen()
                        .transition(.opacity)
                        .zIndex(10)
                }
                if !showingNativeSurface && browser.loading && browser.hasCompletedInitialLoad {
                    VStack {
                        TriWaveXLoadingBar()
                            .padding(.horizontal, 24)
                            .padding(.top, 8)
                            .accessibilityElement(children: .combine)
                            .accessibilityLabel("Actualizando contenido")
                        Spacer()
                    }
                    .allowsHitTesting(false)
                }
                if !showingNativeSurface, let message = browser.error {
                    TriWaveXErrorState(message: message, retry: browser.retry)
                }
                if let guidedOnboarding, guidedOnboarding.isPresented {
                    GuidedOnboardingOverlay(
                        model: guidedOnboarding,
                        onStepChanged: showGuidedStep,
                        onFinished: onGuidedTourFinished
                    )
                    .zIndex(20)
                }
            }
            .onChange(of: selectedTab) { _, tab in
                selectTab(path: path(for: tab))
            }
            .onChange(of: browser.hasCompletedInitialLoad) { _, isReady in
                guard isReady, !hasPresentedInitialContent else { return }
                withAnimation(TriWaveXMotion.entry(reduced: reduceMotion)) {
                    hasPresentedInitialContent = true
                }
            }
            .onChange(of: browser.currentPath) { _, path in
                let nextTab = Self.tab(for: path, isCoach: isCoach)
                if selectedTab != nextTab {
                    selectedTab = nextTab
                }
            }
            .safeAreaInset(edge: .bottom, spacing: 0) {
                if shouldShowTabBar {
                    nativeTabBar
                }
            }
        }
        .toolbar(.hidden, for: .navigationBar)
        .sheet(isPresented: Binding(get: { browser.externalURL != nil }, set: { if !$0 { browser.externalURL = nil } })) {
            if let url = browser.externalURL { SafariView(url: url) }
        }
        .alert("Strava", isPresented: Binding(get: { strava.message != nil }, set: { if !$0 { strava.message = nil } })) {
            Button("Aceptar", role: .cancel) { strava.message = nil }
        } message: { Text(strava.message ?? "") }
        .sheet(isPresented: $showingDevices) {
            DeviceSettingsView(health: health, bluetooth: bluetooth, onHealthSnapshot: syncHealth)
                .presentationDetents([.medium, .large])
        }
        .sheet(isPresented: $showingAccount) {
            NavigationStack { AccountSettingsView(model: AccountSettingsModel(origin: origin, store: store), onSessionEnded: { showingAccount = false; onSessionEnded?() }) }
        }
#if DEBUG
        .task {
            guard ProcessInfo.processInfo.arguments.contains("--capture-demo-tour") else { return }
            await runDemoCaptureTour()
        }
#endif
    }

    private func showGuidedStep(_ step: Int) {
        guard let guidedOnboarding else { return }
        let nextTab: AppTab
        switch (guidedOnboarding.request.role, step) {
        case (.athlete, 0), (.athlete, 2), (.coach, 0), (.coach, 1): nextTab = .training
        case (.athlete, 1): nextTab = .plan
        case (.coach, 2): nextTab = .chat
        default: nextTab = .training
        }
        guard selectedTab != nextTab else { return }
        withAnimation(TriWaveXMotion.stateChange(reduced: reduceMotion)) {
            selectedTab = nextTab
        }
    }

    private func replayGuidedTour() {
        if let guidedOnboarding {
            guidedOnboarding.restart()
        } else {
            let role: GuidedOnboardingRole = isCoach ? .coach : .athlete
            let name: String
            if case .loaded(let profile) = nativeProfile.state { name = profile.athlete.firstName }
            else { name = "" }
            guard let userID = guidedTourRequest?.userID, !userID.isEmpty else { return }
            let model = GuidedOnboardingModel(request: GuidedTourRequest(userID: userID, role: role, givenName: name))
            model.restart()
            guidedOnboarding = model
        }
        showGuidedStep(0)
    }

#if DEBUG
    private func runDemoCaptureTour() async {
        let tour: [AppTab] = isCoach
            ? [.training, .chat, .profile]
            : [.training, .plan, .progress, .chat, .profile]

        for tab in tour {
            guard !Task.isCancelled else { return }
            if selectedTab != tab {
                withAnimation(TriWaveXMotion.stateChange(reduced: reduceMotion)) {
                    selectedTab = tab
                }
            }
            try? await Task.sleep(for: .seconds(8))
        }
    }
#endif

    private var shouldShowTabBar: Bool {
        guard onDismiss == nil else { return false }
        return showingNativePlan || showingNativeProgress || showingNativeProfile || showingNativeChat || browser.showsAppNavigation ||
            (!browser.hasCompletedInitialLoad && isMainNavigationPath(initialPath))
    }

    private func isMainNavigationPath(_ path: String) -> Bool {
        ["/dashboard", "/plan", "/resumen", "/chat", "/settings", "/coach/dashboard", "/coach/chat"]
            .contains { path.hasPrefix($0) }
    }

    private var nativeTabBar: some View {
        HStack(spacing: 0) {
            tabButton(.training, title: "Hoy", systemImage: "house")
            if !isCoach {
                tabButton(.plan, title: "Plan", systemImage: "calendar")
                tabButton(.progress, title: "Progreso", systemImage: "chart.bar.xaxis")
            }
            tabButton(.chat, title: "Chat", systemImage: "bubble.left.and.bubble.right")
            tabButton(.profile, title: "More", systemImage: "ellipsis.circle")
        }
        .padding(.top, 8)
        .padding(.bottom, 6)
        .background(.bar)
        .overlay(alignment: .top) {
            Divider()
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Navegación principal")
    }

    private func tabButton(_ tab: AppTab, title: String, systemImage: String) -> some View {
        let isSelected = selectedTab == tab
        return Button {
            selectedTab = tab
        } label: {
            VStack(spacing: 3) {
                Image(systemName: systemImage)
                    .font(.system(size: 18, weight: isSelected ? .semibold : .regular))
                Text(title)
                    .font(.caption2.weight(isSelected ? .semibold : .regular))
            }
            .frame(maxWidth: .infinity, minHeight: TriWaveXMetrics.minimumTouchTarget)
            .foregroundStyle(isSelected ? Color.triWaveXAqua : .secondary)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(title)
        .accessibilityValue(isSelected ? "Seleccionado" : "")
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }

    private var showingNativeProgress: Bool {
        nativeProgressEnabled && selectedTab == .progress && !isCoach
    }

    private var showingNativePlan: Bool {
        nativePlanEnabled && selectedTab == .plan && !isCoach
    }

    private var showingNativeSurface: Bool {
        showingNativePlan || showingNativeProgress || showingNativeProfile || showingNativeChat
    }

    private var showingNativeProfile: Bool {
        nativeProfileEnabled && selectedTab == .profile
    }

    private var showingNativeChat: Bool {
        nativeChatEnabled && selectedTab == .chat
    }

    private func openWebProgress() {
        nativeProgressEnabled = false
        webPathOverride = "/resumen"
        browser.currentPath = "/resumen"
        let request = URLRequest(url: origin.appendingPathComponent("resumen"))
        browser.lastRequest = request
        browser.webView?.load(request)
    }

    private func selectTab(path: String) {
        if path == "/plan" && !isCoach {
            webPathOverride = "/plan"
            nativePlanEnabled = true
            return
        }
        if path == "/resumen" && !isCoach {
            webPathOverride = nil
            nativeProgressEnabled = true
            return
        }
        if path == "/settings" {
            // The native profile is rendered from this path. Keeping the override
            // makes it visible when the athlete switches here from another tab.
            webPathOverride = "/settings"
            nativeProfileEnabled = true
            return
        }
        if path == "/chat" || path == "/coach/chat" {
            webPathOverride = path
            nativeChatEnabled = true
            return
        }
        webPathOverride = path
        nativePlanEnabled = false
        nativeProgressEnabled = false
        nativeProfileEnabled = false
        nativeChatEnabled = false
        browser.currentPath = path
        let request = URLRequest(url: origin.appendingPathComponent(String(path.dropFirst())))
        browser.lastRequest = request
        browser.webView?.load(request)
    }

    private func openProfileDestination(_ path: String) {
        nativeProfileEnabled = false
        nativeChatEnabled = false
        webPathOverride = path
        browser.currentPath = path
        guard let url = URL(string: path, relativeTo: origin)?.absoluteURL else { return }
        let request = URLRequest(url: url)
        browser.lastRequest = request
        browser.webView?.load(request)
    }

    private func connectStrava() {
        guard let webView = browser.webView else { return }
        let script = """
        fetch('/api/native/strava/authorize', { credentials: 'same-origin', headers: { 'X-TriWaveX-Native': '1' } })
          .then(async response => JSON.stringify({ status: response.status, body: await response.json() }))
        """
        webView.evaluateJavaScript(script) { result, error in
            guard error == nil, let text = result as? String,
                  let data = text.data(using: .utf8),
                  let response = try? JSONDecoder().decode(NativeStravaStart.self, from: data),
                  response.status == 200, let value = response.body.authorizationURL,
                  let url = URL(string: value) else {
                strava.message = "No se ha podido iniciar la conexión con Strava."
                return
            }
            strava.start(url: url) { callback in completeStrava(callback, in: webView) }
        }
    }

    private func syncHealth(_ snapshot: HealthSnapshot) {
        guard let webView = browser.webView,
              let data = try? JSONSerialization.data(withJSONObject: [
                "date": String(ISO8601DateFormatter().string(from: snapshot.date).prefix(10)),
                "sleepHours": snapshot.sleepHours!,
                "hrv": snapshot.hrv!,
                "restingHeartRate": snapshot.restingHeartRate!,
              ]), let body = String(data: data, encoding: .utf8) else { return }
        let script = "fetch('/api/native/health/sync', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-TriWaveX-Native': '1' }, body: JSON.stringify(\(body)) })"
        webView.evaluateJavaScript(script) { _, _ in webView.reload() }
    }

    private func completeStrava(_ callback: URL, in webView: WKWebView) {
        guard let components = URLComponents(url: callback, resolvingAgainstBaseURL: false),
              components.scheme == "triwavex", components.host == "strava", components.path == "/callback",
              let code = components.queryItems?.first(where: { $0.name == "code" })?.value,
              let state = components.queryItems?.first(where: { $0.name == "state" })?.value,
              let data = try? JSONSerialization.data(withJSONObject: ["code": code, "state": state]),
              let body = String(data: data, encoding: .utf8) else {
            strava.message = "Strava no ha devuelto una respuesta válida."
            return
        }
        let script = """
        fetch('/api/native/strava/complete', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-TriWaveX-Native': '1' }, body: JSON.stringify(\(body)) })
          .then(async response => JSON.stringify({ status: response.status, body: await response.json() }))
        """
        webView.evaluateJavaScript(script) { result, error in
            guard error == nil, let text = result as? String,
                  let data = text.data(using: .utf8),
                  let response = try? JSONDecoder().decode(NativeStravaCompletion.self, from: data) else {
                strava.message = "No se ha podido terminar la conexión con Strava."
                return
            }
            if response.status == 200 && response.body.connected == true {
                strava.message = "Strava ya está conectado. Tus actividades se importarán en TriWaveX."
                browser.webView?.reload()
            } else {
                strava.message = response.body.error ?? "No se ha podido conectar Strava."
            }
        }
    }

}

private struct TriWaveXLaunchScreen: View {
    @State private var isAnimating = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        ZStack {
            Color(.systemBackground).ignoresSafeArea()

            VStack(spacing: 18) {
                VStack(spacing: 7) {
                    Text("TriWaveX")
                        .font(.system(size: 30, weight: .bold, design: .rounded))
                        .foregroundStyle(Color.triWaveXTextPrimary)
                    Capsule(style: .continuous)
                        .fill(Color.triWaveXAqua)
                        .frame(width: 44, height: 4)
                        .scaleEffect(x: reduceMotion ? 1 : (isAnimating ? 1 : 0.72), y: 1)
                        .opacity(reduceMotion ? 1 : (isAnimating ? 1 : 0.55))
                }

                HStack(spacing: 10) {
                    ProgressView()
                        .controlSize(.small)
                    Text("Cargando…")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(.secondary)
                }
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("TriWaveX. Cargando")
        .onAppear {
            guard !reduceMotion else { return }
            withAnimation(.easeOut(duration: 0.7).repeatForever(autoreverses: true)) {
                isAnimating = true
            }
        }
    }
}

private struct TriWaveXErrorState: View {
    let message: String
    let retry: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("No se pudo cargar")
                .font(.title3.weight(.semibold))
                .foregroundStyle(Color.triWaveXTextPrimary)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(Color.triWaveXTextSecondary)
                .fixedSize(horizontal: false, vertical: true)
            Button("Reintentar", action: retry)
                .buttonStyle(TriWaveXPrimaryButtonStyle(tint: .triWaveXAqua))
                .padding(.top, 4)
        }
        .padding(24)
        .frame(maxWidth: 360)
        .background(Color.triWaveXSurface, in: RoundedRectangle(cornerRadius: TriWaveXMetrics.cardRadius, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: TriWaveXMetrics.cardRadius, style: .continuous)
                .stroke(Color.triWaveXBorder, lineWidth: 1)
        }
        .padding(24)
        .accessibilityElement(children: .contain)
    }
}

private struct NativeStravaStart: Decodable {
    struct Body: Decodable { let authorizationURL: String?; let error: String? }
    let status: Int
    let body: Body
}

private struct NativeStravaCompletion: Decodable {
    struct Body: Decodable { let connected: Bool?; let error: String? }
    let status: Int
    let body: Body
}

@Observable
final class StravaSessionModel: NSObject, ASWebAuthenticationPresentationContextProviding {
    var message: String?
    private var session: ASWebAuthenticationSession?

    func start(url: URL, completion: @escaping (URL) -> Void) {
        let session = ASWebAuthenticationSession(url: url, callbackURLScheme: "triwavex") { [weak self] callback, error in
            defer { self?.session = nil }
            if let callback { completion(callback) }
            else if (error as? ASWebAuthenticationSessionError)?.code != .canceledLogin {
                self?.message = "No se ha podido abrir Strava. Comprueba tu conexión e inténtalo de nuevo."
            }
        }
        session.presentationContextProvider = self
        session.prefersEphemeralWebBrowserSession = false
        self.session = session
        if !session.start() { message = "No se ha podido abrir Strava."; self.session = nil }
    }

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        UIApplication.shared.connectedScenes.compactMap { ($0 as? UIWindowScene)?.windows.first(where: \.isKeyWindow) }.first ?? ASPresentationAnchor()
    }
}

@Observable
final class BrowserModel {
    var loading = true
    var hasCompletedInitialLoad = false
    var error: String?
    var canGoBack = false
    var currentPath = "/onboarding"
    var showsAppNavigation = false
    var externalURL: URL?
    var webView: WKWebView?
    var lastRequest: URLRequest?
    func retry() {
        error = nil
        if let lastRequest { webView?.load(lastRequest) }
    }
}

struct ProductWebView: UIViewRepresentable {
    let model: BrowserModel
    let origin: URL
    let store: WKWebsiteDataStore
    let initialPath: String
    let isActive: Bool
    let onStravaConnect: () -> Void
    let onOpenDevices: () -> Void

    func makeCoordinator() -> Coordinator { Coordinator(model: model, origin: origin, onStravaConnect: onStravaConnect, onOpenDevices: onOpenDevices) }
    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = store
        // This style is installed only by the iOS host; standalone web navigation is unchanged.
        configuration.userContentController.addUserScript(WKUserScript(source: """
            const style = document.createElement('style');
            style.textContent = 'nav[aria-label="Navegación principal"] { display: none !important; }';
            document.documentElement.appendChild(style);
            """, injectionTime: .atDocumentEnd, forMainFrameOnly: true))
        let view = WKWebView(frame: .zero, configuration: configuration)
        // This identifies the native shell so web-only PWA prompts and its service worker stay out of the iOS app.
        view.customUserAgent = "TriWaveXNative/1.0"
        view.navigationDelegate = context.coordinator
        view.uiDelegate = context.coordinator
        view.allowsBackForwardNavigationGestures = true
        view.isOpaque = true
        view.backgroundColor = .systemBackground
        view.scrollView.backgroundColor = .systemBackground
        model.webView = view
        model.currentPath = initialPath
        if isActive {
            loadInitialRequest(in: view)
        }
        return view
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {
        guard isActive, uiView.url == nil, model.lastRequest == nil else { return }
        loadInitialRequest(in: uiView)
    }

    private func loadInitialRequest(in webView: WKWebView) {
        let url = URL(string: initialPath, relativeTo: origin)?.absoluteURL ?? origin
        let request = URLRequest(url: url)
        model.lastRequest = request
        webView.load(request)
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        let model: BrowserModel
        let origin: URL
        let onStravaConnect: () -> Void
        let onOpenDevices: () -> Void
        init(model: BrowserModel, origin: URL, onStravaConnect: @escaping () -> Void, onOpenDevices: @escaping () -> Void) { self.model = model; self.origin = origin; self.onStravaConnect = onStravaConnect; self.onOpenDevices = onOpenDevices }
        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                     decisionHandler: @escaping @MainActor @Sendable (WKNavigationActionPolicy) -> Void) {
            guard let url = action.request.url else { decisionHandler(.cancel); return }
            if url.scheme == "triwavex", url.host == "strava", url.path == "/connect" {
                onStravaConnect(); decisionHandler(.cancel); return
            }
            if url.scheme == "triwavex", url.host == "devices" {
                onOpenDevices(); decisionHandler(.cancel); return
            }
            if Configuration.allows(url, origin: origin) {
                if action.targetFrame?.isMainFrame != false { model.lastRequest = action.request }
                decisionHandler(.allow)
            } else {
                if action.navigationType == .linkActivated, url.scheme == "https" { model.externalURL = url }
                else if action.targetFrame?.isMainFrame != false {
                    model.loading = false
                    model.error = "Este acceso externo todavía no está disponible en esta versión iOS."
                }
                decisionHandler(.cancel)
            }
        }
        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            model.loading = true; model.error = nil
        }
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            model.loading = false; model.hasCompletedInitialLoad = true; model.canGoBack = webView.canGoBack
            model.currentPath = webView.url?.path ?? model.currentPath
            model.showsAppNavigation = ["/dashboard", "/plan", "/resumen", "/chat", "/settings", "/coach/dashboard", "/coach/chat"].contains { model.currentPath.hasPrefix($0) }
        }
        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { failed(error) }
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { failed(error) }
        func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
            model.loading = false; model.error = "La vista se ha cerrado. Pulsa Reintentar para recuperarla."
        }
        private func failed(_ error: Error) {
            guard (error as NSError).code != NSURLErrorCancelled else { return }
            model.loading = false; model.error = "Comprueba tu conexión e inténtalo de nuevo."
        }
        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                     for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            if let url = action.request.url, Configuration.allows(url, origin: origin) { webView.load(action.request) }
            return nil
        }
    }
}

struct SafariView: UIViewControllerRepresentable {
    let url: URL
    func makeUIViewController(context: Context) -> SFSafariViewController { SFSafariViewController(url: url) }
    func updateUIViewController(_ uiViewController: SFSafariViewController, context: Context) {}
}
