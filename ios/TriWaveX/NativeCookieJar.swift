import Foundation
import WebKit

/// Shared cookie handling for native API requests.
///
/// The server refreshes the Supabase session on every request and rotates the
/// refresh token in `Set-Cookie`. Every native client must send the current
/// cookies and persist the rotated ones; otherwise the next refresh reuses a
/// revoked token and the account is signed out, losing unsaved changes.
enum NativeCookieJar {
    /// Cookie header value for `url`, honouring domain, path, expiry and secure flags.
    static func header(for url: URL, in store: WKWebsiteDataStore) async -> String? {
        let cookies = await withCheckedContinuation { continuation in
            store.httpCookieStore.getAllCookies { continuation.resume(returning: $0) }
        }
        return header(for: url, cookies: cookies)
    }

    static func header(for url: URL, cookies: [HTTPCookie], now: Date = Date()) -> String? {
        guard let host = url.host?.lowercased(), let scheme = url.scheme?.lowercased() else { return nil }
        let requestPath = url.path.isEmpty ? "/" : url.path
        var seen = Set<String>()
        let matching = cookies
            .filter { cookie in
                let path = cookie.path.isEmpty ? "/" : cookie.path
                return (cookie.expiresDate.map { $0 > now } ?? true) &&
                    (!cookie.isSecure || scheme == "https") &&
                    domainMatches(cookie.domain, host: host) &&
                    (requestPath == path || requestPath.hasPrefix(path.hasSuffix("/") ? path : path + "/")) &&
                    cookie.name.allSatisfy { $0 != ";" && $0 != "\r" && $0 != "\n" } &&
                    cookie.value.allSatisfy { $0 != ";" && $0 != "\r" && $0 != "\n" }
            }
            // RFC 6265: longer paths first; send each name once.
            .sorted { $0.path.count > $1.path.count }
            .filter { seen.insert($0.name).inserted }
        return matching.isEmpty ? nil : matching.map { "\($0.name)=\($0.value)" }.joined(separator: "; ")
    }

    /// Host-only cookies match exactly; `.example.com` also matches subdomains.
    static func domainMatches(_ cookieDomain: String, host: String) -> Bool {
        let domain = cookieDomain.lowercased()
        guard !domain.isEmpty, !domain.contains("/") else { return false }
        if domain.hasPrefix(".") {
            let parent = String(domain.dropFirst())
            return !parent.isEmpty && (host == parent || host.hasSuffix(".\(parent)"))
        }
        return host == domain
    }

    /// Stores any `Set-Cookie` from `response` so rotated session tokens survive.
    static func persist(from response: HTTPURLResponse, for url: URL, in store: WKWebsiteDataStore) async {
        let fields = response.allHeaderFields.reduce(into: [String: String]()) { result, item in
            if let key = item.key as? String, let value = item.value as? String { result[key] = value }
        }
        let now = Date()
        for cookie in HTTPCookie.cookies(withResponseHeaderFields: fields, for: url) {
            // Supabase clears stale session chunks with Max-Age=0.
            if let expires = cookie.expiresDate, expires <= now {
                await store.httpCookieStore.deleteCookie(cookie)
                HTTPCookieStorage.shared.deleteCookie(cookie)
            } else {
                await store.httpCookieStore.setCookie(cookie)
                HTTPCookieStorage.shared.setCookie(cookie)
            }
        }
    }

    /// A session that neither stores nor follows cookies/redirects on its own.
    static func makeSession() -> URLSession {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.httpShouldSetCookies = false
        configuration.httpCookieAcceptPolicy = .never
        return URLSession(configuration: configuration, delegate: NoRedirects(), delegateQueue: nil)
    }
}
