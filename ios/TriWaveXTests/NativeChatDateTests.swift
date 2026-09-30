import XCTest
@testable import TriWaveX

/// Messages must show when they were sent, not the moment they were loaded.
@MainActor
final class NativeChatDateTests: XCTestCase {
    func testParsesSupabaseMicrosecondTimestamps() {
        let date = try! XCTUnwrap(NativeChatMessage.date("2026-09-29T10:15:30.123456+00:00"))
        let expected = ISO8601DateFormatter().date(from: "2026-09-29T10:15:30Z")!.addingTimeInterval(0.123)
        XCTAssertEqual(date.timeIntervalSince1970, expected.timeIntervalSince1970, accuracy: 0.001)
    }

    func testParsesPlainTimestamps() {
        XCTAssertNotNil(NativeChatMessage.date("2026-09-29T10:15:30Z"))
    }

    func testUnknownTimestampShowsNothingInsteadOfNow() {
        XCTAssertEqual(NativeChatMessage.timestamp("not a date"), "")
    }

    func testOlderMessagesIncludeTheDay() {
        let now = ISO8601DateFormatter().date(from: "2026-09-29T12:00:00Z")!
        let label = NativeChatMessage.timestamp("2026-09-20T10:00:00Z", now: now)
        XCTAssertTrue(label.contains("·"), label)
    }
}
