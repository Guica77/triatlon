import Foundation
import Observation
import WebKit

@Observable
final class AthleteProgressModel {
    enum State {
        case idle
        case loading
        case loaded(AthleteProgress)
        case failed(AthleteProgressError)
    }

    private let client: AthleteProgressClient
    private let previewProgress: AthleteProgress?
    var state: State = .idle
    /// A failed pull-to-refresh keeps the loaded data on screen.
    private(set) var refreshError: AthleteProgressError?
    private var refreshing = false

    init(client: AthleteProgressClient, previewProgress: AthleteProgress? = nil) {
        self.client = client
        self.previewProgress = previewProgress
        if let previewProgress { state = .loaded(previewProgress) }
    }

    func load() async {
        if let previewProgress { state = .loaded(previewProgress); return }
        guard !isLoading else { return }
        state = .loading
        refreshError = nil
        do {
            state = .loaded(try await client.fetch())
        } catch let error as AthleteProgressError {
            state = .failed(error)
        } catch {
            state = .failed(.unavailable)
        }
    }

    func refresh() async {
        guard case .loaded = state else { await load(); return }
        guard previewProgress == nil, !refreshing else { return }
        refreshing = true
        defer { refreshing = false }
        do {
            state = .loaded(try await client.fetch())
            refreshError = nil
        } catch {
            refreshError = error as? AthleteProgressError ?? .unavailable
        }
    }

    private var isLoading: Bool {
        if case .loading = state { return true }
        return false
    }
}

struct AthleteProgress: Decodable, Equatable, Sendable {
    let athlete: Athlete
    let recovery: Recovery
    let todayWorkout: TodayWorkout?
    let week: Week
    let summary: Summary
    let state: State
    let generatedAt: Date

    enum State: String, Decodable, Equatable, Sendable {
        case ready
        case empty
    }

    struct Athlete: Decodable, Equatable, Sendable {
        let firstName: String
    }

    struct Recovery: Decodable, Equatable, Sendable {
        let date: String?
        let readinessScore: Double?
        let hrv: Double?
        let sleepHours: Double?
        let fatigueRating: Double?
    }

    struct TodayWorkout: Decodable, Equatable, Sendable {
        let id: String
        let date: String
        let sport: String
        let durationMinutes: Int
        let description: String?
        let status: String?
        let completed: Bool
    }

    struct Week: Decodable, Equatable, Sendable {
        let startDate: String
        let endDate: String
        let plannedSessions: Int
        let completedSessions: Int
        let completionPercent: Int
        let totalTss: Int
        let totalMinutes: Int
    }

    struct Summary: Decodable, Equatable, Sendable {
        let completedSessions: Int
        let totalTss: Int
        let totalMinutes: Int
        let distanceKm: Distance
        let tssBySport: TSSBySport
        let streakWeeks: Int
    }

    struct Distance: Decodable, Equatable, Sendable {
        let swim: Double
        let bike: Double
        let run: Double
    }

    struct TSSBySport: Decodable, Equatable, Sendable {
        let swim: Int
        let bike: Int
        let run: Int
    }
}

enum AthleteProgressError: LocalizedError, Equatable {
    case invalidConfiguration
    case invalidResponse
    case unauthorized
    case unavailable
    case offline

    var errorDescription: String? {
        switch self {
        case .invalidConfiguration, .invalidResponse:
            "No se ha podido cargar el progreso."
        case .unauthorized:
            "Tu sesión ha caducado. Vuelve a iniciar sesión."
        case .unavailable:
            "El servicio no está disponible. Inténtalo de nuevo."
        case .offline:
            "No hay conexión. Comprueba tu red e inténtalo de nuevo."
        }
    }
}

struct AthleteProgressClient {
    let origin: URL
    let store: WKWebsiteDataStore
    let session: URLSession

    init(origin: URL, store: WKWebsiteDataStore, session: URLSession? = nil) {
        self.origin = origin
        self.store = store
        self.session = session ?? NativeCookieJar.makeSession()
    }

    func fetch() async throws -> AthleteProgress {
        guard Configuration.allows(origin, origin: origin),
              let url = URL(string: "/api/native/athlete/progress", relativeTo: origin)?.absoluteURL,
              Configuration.allows(url, origin: origin) else {
            throw AthleteProgressError.invalidConfiguration
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.timeoutInterval = 30
        request.httpShouldHandleCookies = false
        request.setValue("1", forHTTPHeaderField: "X-TriWaveX-Native")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let cookieHeader = await NativeCookieJar.header(for: url, in: store) {
            request.setValue(cookieHeader, forHTTPHeaderField: "Cookie")
        }

        do {
            let (data, response) = try await session.data(for: request)
            if let http = response as? HTTPURLResponse { await NativeCookieJar.persist(from: http, for: url, in: store) }
            guard let http = response as? HTTPURLResponse,
                  Configuration.allows(http.url ?? url, origin: origin),
                  http.value(forHTTPHeaderField: "Content-Type")?.lowercased().contains("application/json") == true else {
                throw AthleteProgressError.invalidResponse
            }

            switch http.statusCode {
            case 200:
                do {
                    return try NativeDate.decoder().decode(AthleteProgress.self, from: data)
                } catch {
                    throw AthleteProgressError.invalidResponse
                }
            case 401:
                throw AthleteProgressError.unauthorized
            case 500...599:
                throw AthleteProgressError.unavailable
            default:
                throw AthleteProgressError.invalidResponse
            }
        } catch let error as AthleteProgressError {
            throw error
        } catch is URLError {
            throw AthleteProgressError.offline
        } catch {
            throw AthleteProgressError.unavailable
        }
    }

}
