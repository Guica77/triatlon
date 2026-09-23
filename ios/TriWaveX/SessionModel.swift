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
    private(set) var stableUserID: String?
    private(set) var role: String?
    private(set) var entitled = false
    private(set) var hasCompletedRestore = false
    var busy = false

    var isAuthorized: Bool { entitled && destination != nil }
    var error: String?
    private var appleNonce: String?

    init(origin: URL) { self.origin = origin }

    func restore() async {
        guard !hasCompletedRestore, destination == nil, !busy else { return }
        defer { hasCompletedRestore = true }
        guard let cookie = await cookieHeader() else { return }
        busy = true
        defer { busy = false }
        do {
            var request = URLRequest(url: origin.appendingPathComponent("api/native/session"))
            request.httpMethod = "GET"
            request.timeoutInterval = 15
            request.setValue("1", forHTTPHeaderField: "X-TriWaveX-Native")
            request.setValue("application/json", forHTTPHeaderField: "Accept")
            request.setValue(cookie, forHTTPHeaderField: "Cookie")
            let configuration = URLSessionConfiguration.ephemeral
            configuration.httpShouldSetCookies = false
            let session = URLSession(configuration: configuration, delegate: NoRedirects(), delegateQueue: nil)
            defer { session.invalidateAndCancel() }
            let (data, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse,
                  Configuration.allows(http.url ?? request.url ?? origin, origin: origin) else { return }
            if http.statusCode == 401 { return }
            guard http.statusCode == 200,
                  let result = try? JSONDecoder().decode(LoginResult.self, from: data),
                  let userID = result.userID,
                  !userID.isEmpty,
                  applyAuthorization(result) else { return }
            stableUserID = userID
            destination = result.destination
        } catch {
            // Session restoration is best effort; the normal login remains available.
        }
    }

    func endSession() async {
        await store.removeData(ofTypes: WKWebsiteDataStore.allWebsiteDataTypes(), modifiedSince: .distantPast)
        for cookie in HTTPCookieStorage.shared.cookies(for: origin) ?? [] {
            HTTPCookieStorage.shared.deleteCookie(cookie)
        }
        [
            "pending", "destination", "givenName", "userID", "role",
        ].forEach { UserDefaults.standard.removeObject(forKey: "triwavex.coachCheckout.\($0)") }
        NativeAthleteDraft.clear()
        stableUserID = nil
        role = nil
        entitled = false
        destination = nil
        error = nil
    }

    func setStableUserID(_ userID: String) {
        guard !userID.isEmpty else { return }
        stableUserID = userID
    }

    private struct LoginResult: Decodable {
        let destination: String
        let userID: String?
        let role: String
        let entitled: Bool
    }

    @discardableResult
    private func applyAuthorization(_ result: LoginResult) -> Bool {
        guard result.role == "athlete" || result.role == "coach",
              ["/dashboard", "/coach/dashboard", "/onboarding"].contains(result.destination),
              result.entitled || result.destination == "/onboarding" else {
            role = nil
            entitled = false
            error = "No se ha podido abrir tu perfil."
            return false
        }
        role = result.role
        entitled = result.entitled
        return true
    }

    func prepareAppleRequest(_ request: ASAuthorizationAppleIDRequest) {
        let nonce = Self.randomNonce()
        appleNonce = nonce
        request.requestedScopes = [.fullName, .email]
        request.nonce = Self.sha256(nonce)
    }

    func handleAppleCompletion(_ result: Result<ASAuthorization, Error>, expectedRole: String = "athlete") async {
        defer { appleNonce = nil }

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
            await signInWithApple(identityToken: identityToken, nonce: nonce, expectedRole: expectedRole)
        }
    }

    func login(email: String, password: String, expectedRole: String) async {
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
            guard let http = response as? HTTPURLResponse,
                  http.url.map({ Configuration.allows($0, origin: origin) }) == true else {
                error = "La respuesta del servidor no es válida. Inténtalo de nuevo."
                return
            }
            guard http.statusCode == 200 else {
                error = Self.passwordServerError(statusCode: http.statusCode, data: data)
                return
            }
            do {
                try await applyLoginResponse(data: data, response: http, expectedRole: expectedRole)
            } catch {
                self.error = "El servidor ha devuelto una sesión no válida. Inténtalo de nuevo."
            }
        } catch {
            self.error = Self.connectionError(error, provider: "")
        }
    }

    private func signInWithApple(identityToken: String, nonce: String, expectedRole: String) async {
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
                "role": expectedRole,
            ])
            let configuration = URLSessionConfiguration.ephemeral
            configuration.httpShouldSetCookies = false
            let session = URLSession(configuration: configuration, delegate: NoRedirects(), delegateQueue: nil)
            defer { session.invalidateAndCancel() }
            let (data, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse,
                  http.url.map({ Configuration.allows($0, origin: origin) }) == true else {
                error = "No se ha podido iniciar sesión con Apple. Comprueba tu cuenta e inténtalo de nuevo."
                return
            }
            guard http.statusCode == 200 else {
                error = Self.appleServerError(statusCode: http.statusCode, data: data)
                return
            }
            do {
                try await applyLoginResponse(data: data, response: http, expectedRole: expectedRole)
            } catch {
                self.error = "Apple ha devuelto una sesión no válida. Inténtalo de nuevo."
            }
        } catch {
            self.error = Self.connectionError(error, provider: " con Apple")
        }
    }

    private func applyLoginResponse(data: Data, response: HTTPURLResponse, expectedRole: String? = nil) async throws {
        let result = try JSONDecoder().decode(LoginResult.self, from: data)
        guard let userID = result.userID, !userID.isEmpty,
              ["/dashboard", "/coach/dashboard", "/onboarding"].contains(result.destination) else {
            error = "No se ha podido abrir tu perfil."
            return
        }
        if let expectedRole, result.role != expectedRole {
            let accountType = result.role == "coach" ? "entrenador" : "atleta"
            error = "Esta cuenta está registrada como \(accountType). Cambia el tipo de cuenta para entrar."
            return
        }
        let fields = response.allHeaderFields.reduce(into: [String: String]()) { output, entry in
            if let name = entry.key as? String, let value = entry.value as? String { output[name] = value }
        }
        let cookies = HTTPCookie.cookies(withResponseHeaderFields: fields, for: origin)
        guard !cookies.isEmpty else { error = "El servidor no ha creado una sesión. Vuelve a intentarlo."; return }
        await store.removeData(ofTypes: WKWebsiteDataStore.allWebsiteDataTypes(), modifiedSince: .distantPast)
        for cookie in cookies {
            await store.httpCookieStore.setCookie(cookie)
            HTTPCookieStorage.shared.setCookie(cookie)
        }
        guard applyAuthorization(result) else { return }
        stableUserID = userID
        destination = result.destination
    }

    private static func appleServerError(statusCode: Int, data: Data) -> String {
        struct ErrorResponse: Decodable {
            let error: String?
        }

        let serverMessage = (try? JSONDecoder().decode(ErrorResponse.self, from: data))?.error
        switch statusCode {
        case 400:
            return serverMessage ?? "Apple no ha devuelto una credencial válida. Inténtalo de nuevo."
        case 401:
            return "Apple no ha podido verificar esta cuenta. Comprueba la configuración de Apple e inténtalo de nuevo."
        case 503:
            return "El servicio de Apple no está disponible ahora. Inténtalo de nuevo en unos minutos."
        default:
            return "No se ha podido iniciar sesión con Apple. Inténtalo de nuevo."
        }
    }

    private static func passwordServerError(statusCode: Int, data: Data) -> String {
        struct ErrorResponse: Decodable { let error: String? }
        let serverMessage = (try? JSONDecoder().decode(ErrorResponse.self, from: data))?.error
        switch statusCode {
        case 400, 401:
            return serverMessage ?? "Revisa tu correo, contraseña y confirmación de correo."
        case 503:
            return "El servicio de acceso no está disponible ahora. Inténtalo de nuevo en unos minutos."
        default:
            return "No se ha podido iniciar sesión. Inténtalo de nuevo."
        }
    }

    private static func connectionError(_ error: Error, provider: String) -> String {
        let urlError = error as? URLError
        switch urlError?.code {
        case .notConnectedToInternet, .networkConnectionLost:
            return "No hay conexión a internet. Compruébala e inténtalo de nuevo."
        case .timedOut:
            return "La conexión ha tardado demasiado. Inténtalo de nuevo."
        default:
            return "No hemos podido conectar\(provider). Comprueba tu conexión e inténtalo de nuevo."
        }
    }

    @discardableResult
    func applySubscriptionResult(_ result: NativeSubscriptionResult) -> Bool {
        guard stableUserID == result.userID,
              result.accepted || result.duplicate,
              result.entitled,
              (result.role == "athlete" && ["/dashboard", "/onboarding"].contains(result.destination)) ||
                (result.role == "coach" && result.destination == "/coach/dashboard") else { return false }
        role = result.role
        entitled = true
        destination = result.destination
        return true
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

    private func cookieHeader() async -> String? {
        let cookies = await withCheckedContinuation { continuation in
            store.httpCookieStore.getAllCookies { continuation.resume(returning: $0) }
        }
        let host = origin.host?.lowercased() ?? ""
        let now = Date()
        let matching = cookies.filter { cookie in
            let domain = cookie.domain.trimmingCharacters(in: CharacterSet(charactersIn: ".")).lowercased()
            return (cookie.expiresDate.map { $0 > now } ?? true) &&
                (!cookie.isSecure || origin.scheme == "https") &&
                (host == domain || host.hasSuffix(".\(domain)")) &&
                !cookie.name.contains(";") && !cookie.value.contains(";")
        }
        return matching.isEmpty ? nil : matching.map { "\($0.name)=\($0.value)" }.joined(separator: "; ")
    }

    private static func sha256(_ value: String) -> String {
        SHA256.hash(data: Data(value.utf8)).map { String(format: "%02x", $0) }.joined()
    }
}

// Never forward a credential-bearing POST to a redirect destination.
final class NoRedirects: NSObject, URLSessionTaskDelegate {
    nonisolated func urlSession(_ session: URLSession, task: URLSessionTask,
        willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest,
        completionHandler: @escaping (URLRequest?) -> Void) { completionHandler(nil) }
}
