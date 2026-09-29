import Foundation
import HealthKit
import Observation
import WebKit

struct HealthSnapshot: Sendable {
    let date: Date
    let sleepHours: Double?
    let hrv: Double?
    let restingHeartRate: Double?
    let sourceName: String?

    var hasRecoveryMetrics: Bool {
        sleepHours != nil && hrv != nil && restingHeartRate != nil
    }
}

@MainActor @Observable
final class HealthKitService {
    enum State: Equatable {
        case unavailable
        case needsAuthorization
        case ready
        case unavailableData
        case failed(String)
    }

    private let store = HKHealthStore()
    private(set) var state: State = .needsAuthorization
    private(set) var latestSnapshot: HealthSnapshot?

    func requestAccess() async {
        guard HKHealthStore.isHealthDataAvailable() else { state = .unavailable; return }
        do {
            try await store.requestAuthorization(toShare: [], read: readTypes)
            await refresh()
        } catch {
            state = .failed("No se ha podido autorizar Salud.")
        }
    }

    func refresh() async {
        guard HKHealthStore.isHealthDataAvailable() else { state = .unavailable; return }
        do {
            async let sleep = sleepDuration()
            async let hrv = latestQuantity(.heartRateVariabilitySDNN, unit: HKUnit.secondUnit(with: .milli))
            async let resting = latestQuantity(.restingHeartRate, unit: HKUnit.count().unitDivided(by: .minute()))
            let (sleepHours, hrvSample, restingSample) = try await (sleep, hrv, resting)
            let source = hrvSample?.sourceRevision.source.name ?? restingSample?.sourceRevision.source.name
            latestSnapshot = HealthSnapshot(date: .now, sleepHours: sleepHours, hrv: hrvSample?.value, restingHeartRate: restingSample?.value, sourceName: source)
            state = latestSnapshot?.hasRecoveryMetrics == true ? .ready : .unavailableData
        } catch {
            state = .failed("No se han podido leer los datos de Salud.")
        }
    }

    private var readTypes: Set<HKObjectType> {
        [HKObjectType.categoryType(forIdentifier: .sleepAnalysis), HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN), HKObjectType.quantityType(forIdentifier: .restingHeartRate), HKObjectType.workoutType()].compactMap { $0 }.reduce(into: Set<HKObjectType>()) { $0.insert($1) }
    }

    private func latestQuantity(_ identifier: HKQuantityTypeIdentifier, unit: HKUnit) async throws -> (value: Double, sourceRevision: HKSourceRevision)? {
        guard let type = HKObjectType.quantityType(forIdentifier: identifier) else { return nil }
        return try await withCheckedThrowingContinuation { continuation in
            // Recovery must reflect the last days, not a reading from weeks ago.
            let recent = HKQuery.predicateForSamples(withStart: Calendar.current.date(byAdding: .hour, value: -48, to: .now), end: .now)
            let query = HKSampleQuery(sampleType: type, predicate: recent, limit: 1, sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]) { _, samples, error in
                if let error { continuation.resume(throwing: error); return }
                guard let sample = samples?.first as? HKQuantitySample else { continuation.resume(returning: nil); return }
                continuation.resume(returning: (sample.quantity.doubleValue(for: unit), sample.sourceRevision))
            }
            store.execute(query)
        }
    }

    private func sleepDuration() async throws -> Double? {
        guard let type = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else { return nil }
        let start = Calendar.current.date(byAdding: .hour, value: -18, to: .now) ?? .now
        return try await withCheckedThrowingContinuation { continuation in
            let predicate = HKQuery.predicateForSamples(withStart: start, end: .now)
            let query = HKSampleQuery(sampleType: type, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, error in
                if let error { continuation.resume(throwing: error); return }
                let asleep = (samples as? [HKCategorySample] ?? []).filter { HealthKitService.isAsleep($0.value) }
                let hours = HealthKitService.mergedDuration(asleep.map { ($0.startDate, $0.endDate) }) / 3600
                continuation.resume(returning: hours > 0 ? hours : nil)
            }
            store.execute(query)
        }
    }

    /// Only asleep stages count; "in bed" and "awake" do not.
    nonisolated static func isAsleep(_ value: Int) -> Bool {
        HKCategoryValueSleepAnalysis.allAsleepValues.map(\.rawValue).contains(value)
    }

    /// Apple Watch, iPhone and third-party apps often record the same night;
    /// merge overlapping intervals so sleep is not counted twice.
    nonisolated static func mergedDuration(_ intervals: [(Date, Date)]) -> TimeInterval {
        let sorted = intervals.filter { $0.1 > $0.0 }.sorted { $0.0 < $1.0 }
        var total: TimeInterval = 0
        var current: (Date, Date)?
        for interval in sorted {
            if let open = current, interval.0 <= open.1 {
                current = (open.0, max(open.1, interval.1))
            } else {
                if let open = current { total += open.1.timeIntervalSince(open.0) }
                current = interval
            }
        }
        if let open = current { total += open.1.timeIntervalSince(open.0) }
        return total
    }
}

/// Sends the recovery snapshot to the server natively, so it works on every
/// native screen instead of depending on a loaded web view.
struct NativeHealthSyncClient {
    let origin: URL
    let store: WKWebsiteDataStore

    /// Local calendar day: the athlete's morning in Spain is not yesterday in UTC.
    nonisolated static func dayString(_ date: Date, calendar: Calendar = .current) -> String {
        let parts = calendar.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", parts.year ?? 0, parts.month ?? 0, parts.day ?? 0)
    }

    func sync(_ snapshot: HealthSnapshot) async throws {
        guard let sleep = snapshot.sleepHours, let hrv = snapshot.hrv, let resting = snapshot.restingHeartRate,
              let url = URL(string: "/api/native/health/sync", relativeTo: origin)?.absoluteURL,
              Configuration.allows(url, origin: origin) else { throw URLError(.badURL) }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = 30
        request.httpShouldHandleCookies = false
        request.setValue("1", forHTTPHeaderField: "X-TriWaveX-Native")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: [
            "date": Self.dayString(snapshot.date), "sleepHours": sleep, "hrv": hrv, "restingHeartRate": resting,
        ])
        if let cookie = await NativeCookieJar.header(for: url, in: store) { request.setValue(cookie, forHTTPHeaderField: "Cookie") }
        let session = NativeCookieJar.makeSession()
        defer { session.finishTasksAndInvalidate() }
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw URLError(.badServerResponse) }
        await NativeCookieJar.persist(from: http, for: url, in: store)
        guard http.statusCode == 200 else {
            if http.statusCode == 401 { throw NativeProfileError.unauthorized }
            if let message = (try? JSONSerialization.jsonObject(with: data) as? [String: Any])?["error"] as? String { throw NativeProfileError.message(message) }
            throw URLError(.badServerResponse)
        }
    }
}
