import SwiftUI
import WebKit
import SafariServices

struct ProductView: View {
    let origin: URL
    let store: WKWebsiteDataStore
    let initialPath: String
    @State private var browser = BrowserModel()

    var body: some View {
        NavigationStack {
            ZStack {
                ProductWebView(model: browser, origin: origin, store: store, initialPath: initialPath)
                if browser.loading { ProgressView("Cargando…").padding().background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16)) }
                if let message = browser.error {
                    ContentUnavailableView {
                        Label("No se pudo cargar", systemImage: "wifi.exclamationmark")
                    } description: { Text(message) } actions: {
                        Button("Reintentar") { browser.retry() }.buttonStyle(.borderedProminent)
                    }.background(.background)
                }
            }
            .navigationTitle("TriWaveX").navigationBarTitleDisplayMode(.inline)
            .safeAreaInset(edge: .bottom) {
                if browser.currentPath != "/onboarding" && !browser.currentPath.contains("login") {
                    HStack {
                        let coach = initialPath == "/coach/dashboard"
                        tab("Entreno", icon: "figure.run", path: coach ? "/coach/dashboard" : "/dashboard")
                        if !coach { tab("Progreso", icon: "chart.xyaxis.line", path: "/resumen") }
                        tab("Chat", icon: "bubble.left.and.bubble.right", path: coach ? "/coach/chat" : "/chat")
                        tab("Perfil", icon: "person.crop.circle", path: "/settings")
                    }.padding(.vertical, 10).background(.regularMaterial)
                }
            }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Atrás", systemImage: "chevron.left") { browser.webView?.goBack() }.disabled(!browser.canGoBack)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Recargar", systemImage: "arrow.clockwise") { browser.retry() }
                }
            }
        }
        .sheet(isPresented: Binding(get: { browser.externalURL != nil }, set: { if !$0 { browser.externalURL = nil } })) {
            if let url = browser.externalURL { SafariView(url: url) }
        }
    }

    private func tab(_ title: String, icon: String, path: String) -> some View {
        Button {
            browser.webView?.load(URLRequest(url: origin.appendingPathComponent(String(path.dropFirst()))))
        } label: {
            VStack(spacing: 4) { Image(systemName: icon); Text(title).font(.caption) }
                .frame(maxWidth: .infinity).frame(minHeight: 44)
        }
        .foregroundStyle(browser.currentPath.hasPrefix(path) ? Color.cyan : Color.secondary)
        .accessibilityAddTraits(browser.currentPath.hasPrefix(path) ? .isSelected : [])
    }
}

@Observable
final class BrowserModel {
    var loading = true
    var error: String?
    var canGoBack = false
    var currentPath = "/onboarding"
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

    func makeCoordinator() -> Coordinator { Coordinator(model: model, origin: origin) }
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
        view.navigationDelegate = context.coordinator
        view.uiDelegate = context.coordinator
        view.allowsBackForwardNavigationGestures = true
        view.isOpaque = false
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
        init(model: BrowserModel, origin: URL) { self.model = model; self.origin = origin }
        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                     decisionHandler: @escaping @MainActor @Sendable (WKNavigationActionPolicy) -> Void) {
            guard let url = action.request.url else { decisionHandler(.cancel); return }
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
            model.loading = false; model.canGoBack = webView.canGoBack
            model.currentPath = webView.url?.path ?? model.currentPath
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
