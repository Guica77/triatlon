import XCTest
@testable import TriWaveX

/// `removeExpired` runs from `NativeAthleteOnboardingView.init`. Any
/// UserDefaults write there invalidates RootView's @AppStorage and re-creates
/// the view, so a clean store must be left untouched or the app hangs.
@MainActor
final class NativeAthleteDraftTests: XCTestCase {
    private final class WriteCountingDefaults: UserDefaults {
        var writes = 0
        override func set(_ value: Any?, forKey defaultName: String) {
            writes += 1
            super.set(value, forKey: defaultName)
        }
        override func removeObject(forKey defaultName: String) {
            writes += 1
            super.removeObject(forKey: defaultName)
        }
    }

    private func makeDefaults() -> WriteCountingDefaults {
        let suiteName = "NativeAthleteDraftTests.\(UUID().uuidString)"
        let defaults = WriteCountingDefaults(suiteName: suiteName)!
        addTeardownBlock { UserDefaults().removePersistentDomain(forName: suiteName) }
        return defaults
    }

    func testRemoveExpiredDoesNotWriteWhenThereIsNoDraft() {
        let defaults = makeDefaults()
        NativeAthleteDraft.removeExpired(from: defaults)
        XCTAssertEqual(defaults.writes, 0)
    }

    func testRemoveExpiredDoesNotWriteForAValidDraft() {
        let defaults = makeDefaults()
        defaults.set(Date().addingTimeInterval(3600), forKey: NativeAthleteDraft.expiryKey)
        defaults.set("Mi objetivo", forKey: NativeAthleteDraft.prefix + "goal")
        defaults.writes = 0

        NativeAthleteDraft.removeExpired(from: defaults)

        XCTAssertEqual(defaults.writes, 0)
        XCTAssertEqual(defaults.string(forKey: NativeAthleteDraft.prefix + "goal"), "Mi objetivo")
    }

    func testRemoveExpiredPurgesLegacyHealthDraftOnce() {
        let defaults = makeDefaults()
        defaults.set("rodilla", forKey: NativeAthleteDraft.prefix + "injuries")

        NativeAthleteDraft.removeExpired(from: defaults)
        XCTAssertNil(defaults.object(forKey: NativeAthleteDraft.prefix + "injuries"))

        defaults.writes = 0
        NativeAthleteDraft.removeExpired(from: defaults)
        XCTAssertEqual(defaults.writes, 0)
    }

    func testRemoveExpiredClearsAnExpiredDraft() {
        let defaults = makeDefaults()
        defaults.set(Date().addingTimeInterval(-60), forKey: NativeAthleteDraft.expiryKey)
        defaults.set("Mi objetivo", forKey: NativeAthleteDraft.prefix + "goal")

        NativeAthleteDraft.removeExpired(from: defaults)

        XCTAssertNil(defaults.object(forKey: NativeAthleteDraft.prefix + "goal"))
        XCTAssertNil(defaults.object(forKey: NativeAthleteDraft.expiryKey))
    }
}
