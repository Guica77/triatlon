import Foundation
import HealthKit
import Observation

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
            let query = HKSampleQuery(sampleType: type, predicate: nil, limit: 1, sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)]) { _, samples, error in
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
                let hours = (samples as? [HKCategorySample] ?? []).filter { $0.value != HKCategoryValueSleepAnalysis.inBed.rawValue }.reduce(0) { $0 + $1.endDate.timeIntervalSince($1.startDate) / 3600 }
                continuation.resume(returning: hours > 0 ? hours : nil)
            }
            store.execute(query)
        }
    }
}
