import XCTest
@testable import TriWaveX

@MainActor
final class NativeAIConsentTests: XCTestCase {
    func testDecodesServerState() throws {
        let json = #"{"available":true,"providers":["Google Gemini"],"models":["Google Gemini · gemini-3.6-flash"],"version":"v1","granted":false}"#
        let state = try JSONDecoder().decode(NativeAIConsentState.self, from: Data(json.utf8))
        XCTAssertEqual(state.providers, ["Google Gemini"])
        XCTAssertFalse(state.granted)
    }

    func testWithoutLoadedStateItNeverPrompts() {
        let suite = "NativeAIConsentTests.\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suite)!
        defer { defaults.removePersistentDomain(forName: suite) }
        let model = NativeAIConsentModel(
            client: NativeAIConsentClient(origin: URL(string: "https://app.triwavex.com")!, store: .nonPersistent()),
            userID: "user-1",
            defaults: defaults
        )
        XCTAssertFalse(model.shouldPrompt)
        model.markAsked()
        XCTAssertNil(defaults.string(forKey: "triwavex.aiConsent.askedVersion.user-1"))
    }
}
