import SwiftUI
import WebKit

/// Public pages (privacy, support) shown from the login screen: a plain web
/// view that runs edge to edge, with no product shell or tab bar around it.
struct InformationView: View {
    let url: URL
    let title: String
    let store: WKWebsiteDataStore
    let onDismiss: () -> Void

    @State private var loading = true
    @State private var failed = false

    var body: some View {
        NavigationStack {
            InformationWebView(url: url, store: store, loading: $loading, failed: $failed)
                .ignoresSafeArea(edges: .bottom)
                .overlay {
                    if failed {
                        ContentUnavailableView {
                            Label("Sin conexión", systemImage: "wifi.slash")
                        } description: {
                            Text("No se ha podido cargar la página. Comprueba tu conexión e inténtalo de nuevo.")
                        } actions: {
                            Button("Reintentar") { failed = false; loading = true }
                        }
                        .background(Color(uiColor: .systemBackground))
                    } else if loading {
                        ProgressView()
                    }
                }
                .navigationTitle(title)
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Cerrar", action: onDismiss)
                    }
                }
        }
    }
}

private struct InformationWebView: UIViewRepresentable {
    let url: URL
    let store: WKWebsiteDataStore
    @Binding var loading: Bool
    @Binding var failed: Bool

    func makeCoordinator() -> Coordinator { Coordinator(origin: url, loading: $loading, failed: $failed) }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = store
        let view = WKWebView(frame: .zero, configuration: configuration)
        // Native user agent keeps the web cookie banner and install prompt hidden.
        view.customUserAgent = "TriWaveXNative/1.0"
        view.navigationDelegate = context.coordinator
        view.backgroundColor = .systemBackground
        view.scrollView.backgroundColor = .systemBackground
        view.load(URLRequest(url: url))
        return view
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {
        // "Reintentar" clears `failed` and sets `loading`; reload once for it.
        if loading && !failed && !uiView.isLoading && context.coordinator.hasFailed {
            context.coordinator.hasFailed = false
            uiView.load(URLRequest(url: url))
        }
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        let origin: URL
        @Binding var loading: Bool
        @Binding var failed: Bool
        var hasFailed = false

        init(origin: URL, loading: Binding<Bool>, failed: Binding<Bool>) {
            self.origin = origin
            _loading = loading
            _failed = failed
        }

        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                     decisionHandler: @escaping @MainActor @Sendable (WKNavigationActionPolicy) -> Void) {
            guard let target = action.request.url else { decisionHandler(.cancel); return }
            // Links off the site (mail, other domains) open outside the sheet.
            if action.targetFrame?.isMainFrame != false, target.host != origin.host {
                UIApplication.shared.open(target)
                decisionHandler(.cancel)
                return
            }
            decisionHandler(.allow)
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) { loading = false }
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { fail() }
        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { fail() }

        private func fail() {
            hasFailed = true
            loading = false
            failed = true
        }
    }
}
