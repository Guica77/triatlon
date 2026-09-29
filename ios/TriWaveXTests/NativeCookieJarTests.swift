import XCTest
@testable import TriWaveX

/// Every native request must send the current Supabase session cookies; a
/// wrong or stale cookie signs the athlete out and loses their changes.
@MainActor
final class NativeCookieJarTests: XCTestCase {
    private let url = URL(string: "https://app.triwavex.com/api/native/athlete/profile")!

    private func cookie(
        _ name: String,
        _ value: String,
        domain: String = "app.triwavex.com",
        path: String = "/",
        expires: Date? = nil,
        secure: Bool = true
    ) -> HTTPCookie {
        var properties: [HTTPCookiePropertyKey: Any] = [
            .name: name, .value: value, .domain: domain, .path: path,
        ]
        if let expires { properties[.expires] = expires }
        if secure { properties[.secure] = "TRUE" }
        return HTTPCookie(properties: properties)!
    }

    func testSendsMatchingSessionCookies() {
        let header = NativeCookieJar.header(for: url, cookies: [
            cookie("sb-auth-token.0", "a"),
            cookie("sb-auth-token.1", "b"),
        ])
        XCTAssertEqual(header, "sb-auth-token.0=a; sb-auth-token.1=b")
    }

    func testSkipsExpiredCookies() {
        let header = NativeCookieJar.header(for: url, cookies: [
            cookie("stale", "x", expires: Date(timeIntervalSinceNow: -60)),
            cookie("fresh", "y", expires: Date(timeIntervalSinceNow: 3_600)),
        ])
        XCTAssertEqual(header, "fresh=y")
    }

    func testHostOnlyCookieDoesNotLeakToOtherHosts() {
        let header = NativeCookieJar.header(for: url, cookies: [
            cookie("other", "x", domain: "triwavex.com"),
            cookie("evil", "x", domain: "app.triwavex.com.evil.com"),
            cookie("shared", "y", domain: ".triwavex.com"),
        ])
        XCTAssertEqual(header, "shared=y")
    }

    func testRespectsPathAndSecureFlag() {
        let header = NativeCookieJar.header(for: URL(string: "http://app.triwavex.com/api/native/plan")!, cookies: [
            cookie("secureOnly", "x"),
            cookie("insecure", "y", secure: false),
            cookie("elsewhere", "z", path: "/admin", secure: false),
        ])
        XCTAssertEqual(header, "insecure=y")
    }

    func testMostSpecificPathWinsForDuplicateNames() {
        let header = NativeCookieJar.header(for: url, cookies: [
            cookie("token", "root"),
            cookie("token", "api", path: "/api"),
        ])
        XCTAssertEqual(header, "token=api")
    }

    func testReturnsNilWithoutCookies() {
        XCTAssertNil(NativeCookieJar.header(for: url, cookies: []))
    }
}
