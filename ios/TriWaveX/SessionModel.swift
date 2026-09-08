import Foundation
import Observation
import WebKit

@Observable
final class SessionModel {
    enum OAuthProvider: String { case apple, google }
    let origin: URL
    let store = WKWebsiteDataStore.default()
    var destination: String?
    var busy = false
    var error: String?

    init(origin: URL) { self.origin = origin }

    func beginOAuth(_ provider: OAuthProvider, role: String) {
        guard !busy else { return }
        error = nil
        destination = "/api/native/oauth?provider=\(provider.rawValue)&role=\(role)"
    }

    private struct LoginResult: Decodable { let destination: String }

    func login(email: String, password: String) async {
        guard !busy else { return }
        busy = true
        error = nil
        defer { busy = false }
        do {
            var request = URLRequest(url: origin.appendingPathComponent("api/native/session"))
            request.httpMethod = "POST"
            request.timeoutInterval = 30
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.setValue("1", forHTTPHeaderField: "X-TriWaveX-Native")
            request.httpBody = try JSONEncoder().encode(["email": email, "password": password])
            let configuration = URLSessionConfiguration.ephemeral
            configuration.httpShouldSetCookies = false
            let session = URLSession(configuration: configuration, delegate: NoRedirects(), delegateQueue: nil)
            defer { session.invalidateAndCancel() }
            let (data, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200,
                  http.url.map({ Configuration.allows($0, origin: origin) }) == true else {
                error = "No se ha podido iniciar sesión. Revisa tu correo y contraseña o inténtalo de nuevo."
                return
            }
            let result = try JSONDecoder().decode(LoginResult.self, from: data)
            guard ["/dashboard", "/coach/dashboard", "/onboarding"].contains(result.destination) else {
                error = "No se ha podido abrir tu perfil."
                return
            }
            let fields = http.allHeaderFields.reduce(into: [String: String]()) { output, entry in
                if let name = entry.key as? String, let value = entry.value as? String { output[name] = value }
            }
            let cookies = HTTPCookie.cookies(withResponseHeaderFields: fields, for: origin)
            guard !cookies.isEmpty else { error = "El servidor no ha creado una sesión. Vuelve a intentarlo."; return }
            await store.removeData(ofTypes: WKWebsiteDataStore.allWebsiteDataTypes(), modifiedSince: .distantPast)
            for cookie in cookies { await store.httpCookieStore.setCookie(cookie) }
            destination = result.destination
        } catch {
            self.error = "No hemos podido conectar. Comprueba tu conexión e inténtalo de nuevo."
        }
    }
}

// Never forward a credential-bearing POST to a redirect destination.
private final class NoRedirects: NSObject, URLSessionTaskDelegate {
    nonisolated func urlSession(_ session: URLSession, task: URLSessionTask,
        willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest,
        completionHandler: @escaping (URLRequest?) -> Void) { completionHandler(nil) }
}
