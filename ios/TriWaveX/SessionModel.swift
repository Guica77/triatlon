import AuthenticationServices
import CryptoKit
import Foundation
import Observation
import Security
import WebKit

@Observable
final class SessionModel {
    let origin: URL
    let store = WKWebsiteDataStore.default()
    var destination: String?
    var busy = false
    var error: String?
    private var appleNonce: String?

    init(origin: URL) { self.origin = origin }

    private struct LoginResult: Decodable { let destination: String }

    func prepareAppleRequest(_ request: ASAuthorizationAppleIDRequest) {
        let nonce = Self.randomNonce()
        appleNonce = nonce
        request.requestedScopes = [.fullName, .email]
        request.nonce = Self.sha256(nonce)
    }

    func handleAppleCompletion(_ result: Result<ASAuthorization, Error>, role: String) async {
        switch result {
        case .failure(let error as ASAuthorizationError) where error.code == .canceled:
            return
        case .failure:
            error = "No se ha podido iniciar sesión con Apple. Inténtalo de nuevo."
        case .success(let authorization):
            guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
                  let tokenData = credential.identityToken,
                  let identityToken = String(data: tokenData, encoding: .utf8),
                  let nonce = appleNonce else {
                error = "Apple no ha devuelto una credencial válida. Inténtalo de nuevo."
                return
            }
            await signInWithApple(identityToken: identityToken, nonce: nonce, role: role)
        }
        appleNonce = nil
    }

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
            try await applyLoginResponse(data: data, response: http)
        } catch {
            self.error = "No hemos podido conectar. Comprueba tu conexión e inténtalo de nuevo."
        }
    }

    private func signInWithApple(identityToken: String, nonce: String, role: String) async {
        guard !busy else { return }
        busy = true
        error = nil
        defer { busy = false }
        do {
            var request = URLRequest(url: origin.appendingPathComponent("api/native/apple/session"))
            request.httpMethod = "POST"
            request.timeoutInterval = 30
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.setValue("1", forHTTPHeaderField: "X-TriWaveX-Native")
            request.httpBody = try JSONEncoder().encode([
                "identityToken": identityToken,
                "nonce": nonce,
                "role": role,
            ])
            let configuration = URLSessionConfiguration.ephemeral
            configuration.httpShouldSetCookies = false
            let session = URLSession(configuration: configuration, delegate: NoRedirects(), delegateQueue: nil)
            defer { session.invalidateAndCancel() }
            let (data, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200,
                  http.url.map({ Configuration.allows($0, origin: origin) }) == true else {
                error = "No se ha podido iniciar sesión con Apple. Comprueba tu cuenta e inténtalo de nuevo."
                return
            }
            try await applyLoginResponse(data: data, response: http)
        } catch {
            self.error = "No hemos podido conectar con Apple. Comprueba tu conexión e inténtalo de nuevo."
        }
    }

    private func applyLoginResponse(data: Data, response: HTTPURLResponse) async throws {
        let result = try JSONDecoder().decode(LoginResult.self, from: data)
        guard ["/dashboard", "/coach/dashboard", "/onboarding"].contains(result.destination) else {
            error = "No se ha podido abrir tu perfil."
            return
        }
        let fields = response.allHeaderFields.reduce(into: [String: String]()) { output, entry in
            if let name = entry.key as? String, let value = entry.value as? String { output[name] = value }
        }
        let cookies = HTTPCookie.cookies(withResponseHeaderFields: fields, for: origin)
        guard !cookies.isEmpty else { error = "El servidor no ha creado una sesión. Vuelve a intentarlo."; return }
        await store.removeData(ofTypes: WKWebsiteDataStore.allWebsiteDataTypes(), modifiedSince: .distantPast)
        for cookie in cookies { await store.httpCookieStore.setCookie(cookie) }
        destination = result.destination
    }

    private static func randomNonce(length: Int = 32) -> String {
        let alphabet = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
        var result = ""
        var remaining = length
        while remaining > 0 {
            var random: UInt8 = 0
            guard SecRandomCopyBytes(kSecRandomDefault, 1, &random) == errSecSuccess else { continue }
            if random < 64 { result.append(alphabet[Int(random)]); remaining -= 1 }
        }
        return result
    }

    private static func sha256(_ value: String) -> String {
        SHA256.hash(data: Data(value.utf8)).map { String(format: "%02x", $0) }.joined()
    }
}

// Never forward a credential-bearing POST to a redirect destination.
private final class NoRedirects: NSObject, URLSessionTaskDelegate {
    nonisolated func urlSession(_ session: URLSession, task: URLSessionTask,
        willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest,
        completionHandler: @escaping (URLRequest?) -> Void) { completionHandler(nil) }
}
