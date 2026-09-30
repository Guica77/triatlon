import XCTest
@testable import TriWaveX

/// The plan and progress screens failed to decode because the server sends
/// `toISOString()` with milliseconds, which `.iso8601` rejects.
@MainActor
final class NativeDateTests: XCTestCase {
    private struct Payload: Decodable { let generatedAt: Date }

    func testDecodesMillisecondTimestampsFromToISOString() throws {
        let json = Data(#"{"generatedAt":"2026-09-30T08:15:30.123Z"}"#.utf8)
        let payload = try NativeDate.decoder().decode(Payload.self, from: json)
        let expected = ISO8601DateFormatter().date(from: "2026-09-30T08:15:30Z")!.addingTimeInterval(0.123)
        XCTAssertEqual(payload.generatedAt.timeIntervalSince1970, expected.timeIntervalSince1970, accuracy: 0.001)
    }

    func testDecodesTimestampsWithoutFraction() throws {
        let json = Data(#"{"generatedAt":"2026-09-30T08:15:30Z"}"#.utf8)
        XCTAssertNoThrow(try NativeDate.decoder().decode(Payload.self, from: json))
    }

    func testRejectsInvalidDates() {
        let json = Data(#"{"generatedAt":"ayer"}"#.utf8)
        XCTAssertThrowsError(try NativeDate.decoder().decode(Payload.self, from: json))
    }
}
