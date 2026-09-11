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
    var state: State = .idle

    init(client: AthleteProgressClient) {
        self.client = client
    }

    func load() async {
        guard !isLoading else { return }
        state = .loading
        do {
            state = .loaded(try await client.fetch())
        } catch let error as AthleteProgressError {
            state = .failed(error)
        } catch {
            state = .failed(.unavailable)
        }
    }

    func refresh() async {
        guard !isLoading else { return }
        await load()
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
        self.session = session ?? URLSession(configuration: .ephemeral)
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
        if let cookieHeader = await cookieHeader(for: url) {
            request.setValue(cookieHeader, forHTTPHeaderField: "Cookie")
        }

        do {
            let (data, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse,
                  Configuration.allows(http.url ?? url, origin: origin),
                  http.value(forHTTPHeaderField: "Content-Type")?.lowercased().contains("application/json") == true else {
                throw AthleteProgressError.invalidResponse
            }

            switch http.statusCode {
            case 200:
                do {
                    let decoder = JSONDecoder()
                    decoder.dateDecodingStrategy = .iso8601
                    return try decoder.decode(AthleteProgress.self, from: data)
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

    private func cookieHeader(for requestURL: URL) async -> String? {
        guard let requestHost = requestURL.host?.lowercased(),
              let requestScheme = requestURL.scheme?.lowercased() else {
            return nil
        }

        let cookies = await withCheckedContinuation { continuation in
            store.httpCookieStore.getAllCookies { cookies in
                continuation.resume(returning: cookies)
            }
        }
        let now = Date()
        var seen = Set<String>()
        let matchingCookies = cookies
            .filter { cookie in
                guard cookie.expiresDate.map({ $0 > now }) ?? true,
                      !cookie.isSecure || requestScheme == "https",
                      cookieDomainMatches(cookie.domain, requestHost: requestHost),
                      cookiePathMatches(cookie.path, requestPath: requestURL.path),
                      cookie.name.allSatisfy({ $0 != ";" && $0 != "\r" && $0 != "\n" }),
                      cookie.value.allSatisfy({ $0 != ";" && $0 != "\r" && $0 != "\n" }) else {
                    return false
                }

                let identity = "\(cookie.name)\u{0}\(cookie.domain.lowercased())\u{0}\(cookie.path)"
                return seen.insert(identity).inserted
            }
            .sorted {
                let leftPath = $0.path.isEmpty ? "/" : $0.path
                let rightPath = $1.path.isEmpty ? "/" : $1.path
                if leftPath.count != rightPath.count {
                    return leftPath.count > rightPath.count
                }
                if $0.domain.count != $1.domain.count {
                    return $0.domain.count > $1.domain.count
                }
                return $0.name < $1.name
            }

        guard !matchingCookies.isEmpty else { return nil }
        return matchingCookies.map { "\($0.name)=\($0.value)" }.joined(separator: "; ")
    }

    private func cookieDomainMatches(_ cookieDomain: String, requestHost: String) -> Bool {
        let domain = cookieDomain.lowercased()
        guard !domain.isEmpty, !domain.contains("/"), !domain.contains("\r"), !domain.contains("\n") else {
            return false
        }

        if domain.hasPrefix(".") {
            let parentDomain = String(domain.dropFirst())
            return !parentDomain.isEmpty && (requestHost == parentDomain || requestHost.hasSuffix(".\(parentDomain)"))
        }

        return requestHost == domain
    }

    private func cookiePathMatches(_ cookiePath: String, requestPath: String) -> Bool {
        let path = cookiePath.isEmpty ? "/" : cookiePath
        let requestPath = requestPath.isEmpty ? "/" : requestPath
        guard path.hasPrefix("/") else { return false }
        guard requestPath == path || requestPath.hasPrefix(path) else { return false }
        guard path != "/", !path.hasSuffix("/"), requestPath.count > path.count else { return true }
        return requestPath.dropFirst(path.count).first == "/"
    }
}
