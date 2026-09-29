import HealthKit
import XCTest
@testable import TriWaveX

/// Recovery data drives the plan; double-counted sleep or a crash on a
/// malformed strap packet would give the athlete wrong advice.
@MainActor
final class HealthAndHeartRateTests: XCTestCase {
    private let base = Date(timeIntervalSince1970: 1_800_000_000)
    private func at(_ hours: Double) -> Date { base.addingTimeInterval(hours * 3_600) }

    func testOverlappingSleepFromTwoSourcesCountsOnce() {
        // Watch 23:00–07:00 and iPhone 23:30–06:30 for the same night.
        let total = HealthKitService.mergedDuration([(at(0), at(8)), (at(0.5), at(7.5))])
        XCTAssertEqual(total / 3_600, 8, accuracy: 0.001)
    }

    func testSeparateSleepIntervalsAreAdded() {
        let total = HealthKitService.mergedDuration([(at(5), at(6)), (at(0), at(2))])
        XCTAssertEqual(total / 3_600, 3, accuracy: 0.001)
    }

    func testAwakeAndInBedAreNotSleep() {
        XCTAssertFalse(HealthKitService.isAsleep(HKCategoryValueSleepAnalysis.inBed.rawValue))
        XCTAssertFalse(HealthKitService.isAsleep(HKCategoryValueSleepAnalysis.awake.rawValue))
        XCTAssertTrue(HealthKitService.isAsleep(HKCategoryValueSleepAnalysis.asleepDeep.rawValue))
    }

    func testHeartRateParsesEightAndSixteenBitValues() {
        XCTAssertEqual(BluetoothHeartRateService.heartRate(from: Data([0x00, 142])), 142)
        XCTAssertEqual(BluetoothHeartRateService.heartRate(from: Data([0x01, 0x9C, 0x00])), 156)
    }

    func testMalformedHeartRatePacketsAreIgnored() {
        XCTAssertNil(BluetoothHeartRateService.heartRate(from: Data()))
        XCTAssertNil(BluetoothHeartRateService.heartRate(from: Data([0x01, 0x9C])))
        XCTAssertNil(BluetoothHeartRateService.heartRate(from: Data([0x00, 0x00])))
    }

    func testHealthSyncUsesTheLocalDay() {
        var madrid = Calendar(identifier: .gregorian)
        madrid.timeZone = TimeZone(identifier: "Europe/Madrid")!
        // 2026-09-29 00:30 in Madrid is still 2026-09-28 in UTC.
        let date = ISO8601DateFormatter().date(from: "2026-09-28T22:30:00Z")!
        XCTAssertEqual(NativeHealthSyncClient.dayString(date, calendar: madrid), "2026-09-29")
    }
}
