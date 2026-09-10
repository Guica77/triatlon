import SwiftUI
import WebKit
import SafariServices
import AuthenticationServices
import Observation
import UIKit

struct ProductView: View {
    let origin: URL
    let store: WKWebsiteDataStore
    let initialPath: String
    let onDismiss: (() -> Void)?
    @State private var browser = BrowserModel()
    @State private var strava = StravaSessionModel()
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        NavigationStack {
            ZStack {
                ProductWebView(model: browser, origin: origin, store: store, initialPath: initialPath, onStravaConnect: connectStrava)
                if browser.loading && !browser.hasCompletedInitialLoad {
                    TriWaveXLaunchScreen(reduceMotion: reduceMotion)
                        .transition(.opacity)
                }
                if browser.loading && browser.hasCompletedInitialLoad {
                    VStack {
                        TriWaveXLoadingBar()
                            .padding(.horizontal, 24)
                            .padding(.top, 8)
                            .accessibilityElement(children: .combine)
                            .accessibilityLabel("Actualizando contenido")
                        Spacer()
                    }
                    .allowsHitTesting(false)
                    .transition(.opacity)
                }
                if let message = browser.error {
                    TriWaveXErrorState(message: message, retry: browser.retry)
                        .transition(reduceMotion ? .opacity : .opacity.combined(with: .scale(scale: 0.96)))
                }
            }
            .safeAreaInset(edge: .bottom) {
                if browser.showsAppNavigation {
                    nativeTabBar
                    .transition(reduceMotion ? .opacity : .move(edge: .bottom).combined(with: .opacity))
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
        .animation(reduceMotion ? nil : .easeInOut(duration: 0.18), value: browser.loading)
        .animation(reduceMotion ? nil : .easeInOut(duration: 0.2), value: browser.error)
        .animation(reduceMotion ? nil : .spring(response: 0.34, dampingFraction: 0.88), value: browser.showsAppNavigation)
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

    private func tab(_ title: String, path: String) -> some View {
        Button {
            browser.webView?.load(URLRequest(url: origin.appendingPathComponent(String(path.dropFirst()))))
        } label: {
            Text(title)
                .font(.subheadline.weight(.medium))
                .frame(maxWidth: .infinity, minHeight: TriWaveXMetrics.minimumTouchTarget)
        }
        .foregroundStyle(browser.currentPath.hasPrefix(path) ? Color.triWaveXAqua : Color.white.opacity(0.62))
        .background(browser.currentPath.hasPrefix(path) ? Color.triWaveXAqua.opacity(0.12) : .clear, in: RoundedRectangle(cornerRadius: TriWaveXMetrics.controlRadius, style: .continuous))
        .buttonStyle(TriWaveXSelectionButtonStyle())
        .accessibilityLabel(title)
        .accessibilityValue(browser.currentPath.hasPrefix(path) ? "Seleccionado" : "")
        .accessibilityAddTraits(browser.currentPath.hasPrefix(path) ? .isSelected : [])
        .accessibilityHint("Doble toque para abrir")
    }

    private var nativeTabBar: some View {
        HStack(spacing: 4) {
            let coach = initialPath == "/coach/dashboard"
            tab("Entreno", path: coach ? "/coach/dashboard" : "/dashboard")
            if !coach {
                tab("Progreso", path: "/resumen")
            }
            tab("Chat", path: coach ? "/coach/chat" : "/chat")
            tab("Perfil", path: "/settings")
        }
        .padding(.horizontal, 16)
        .padding(.top, 4)
        .padding(.bottom, 3)
        .background(Color.triWaveXSurface.opacity(0.96))
        .overlay(alignment: .top) {
            Rectangle()
                .fill(.white.opacity(0.08))
                .frame(height: 1)
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Navegación principal")
    }

}

private struct TriWaveXLaunchScreen: View {
    let reduceMotion: Bool

    var body: some View {
        ZStack {
            Color.triWaveXInk.ignoresSafeArea()

            VStack(spacing: 16) {
                Text("TriWaveX")
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(.white)
                TriWaveXLoadingBar()
                    .frame(maxWidth: 180)
            }
            .multilineTextAlignment(.center)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Cargando TriWaveX")
    }
}

private struct TriWaveXErrorState: View {
    let message: String
    let retry: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("No se pudo cargar")
                .font(.title3.weight(.semibold))
                .foregroundStyle(.white)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.68))
            Button("Reintentar", action: retry)
                .buttonStyle(TriWaveXPrimaryButtonStyle(tint: .triWaveXAqua))
                .padding(.top, 4)
        }
        .padding(24)
        .frame(maxWidth: 340)
        .background(Color.triWaveXSurface, in: RoundedRectangle(cornerRadius: TriWaveXMetrics.cardRadius, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: TriWaveXMetrics.cardRadius, style: .continuous)
                .stroke(.white.opacity(0.08), lineWidth: 1)
        }
        .padding(24)
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
    let onStravaConnect: () -> Void

    func makeCoordinator() -> Coordinator { Coordinator(model: model, origin: origin, onStravaConnect: onStravaConnect) }
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
        let url = URL(string: initialPath, relativeTo: origin)?.absoluteURL ?? origin
        let request = URLRequest(url: url)
        model.lastRequest = request
        view.load(request)
        return view
    }
    func updateUIView(_ uiView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        let model: BrowserModel
        let origin: URL
        let onStravaConnect: () -> Void
        init(model: BrowserModel, origin: URL, onStravaConnect: @escaping () -> Void) { self.model = model; self.origin = origin; self.onStravaConnect = onStravaConnect }
        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                     decisionHandler: @escaping @MainActor @Sendable (WKNavigationActionPolicy) -> Void) {
            guard let url = action.request.url else { decisionHandler(.cancel); return }
            if url.scheme == "triwavex", url.host == "strava", url.path == "/connect" {
                onStravaConnect(); decisionHandler(.cancel); return
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
            model.showsAppNavigation = ["/dashboard", "/resumen", "/chat", "/settings", "/coach/dashboard", "/coach/chat"].contains { model.currentPath.hasPrefix($0) }
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
