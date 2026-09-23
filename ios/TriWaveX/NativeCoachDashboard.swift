import Foundation
import Observation
import SwiftUI
import WebKit

struct NativeCoachDashboard: Decodable, Sendable {
    let coachName: String
    let athletes: [Athlete]

    struct Athlete: Decodable, Identifiable, Sendable {
        let id: String
        let name: String
        let planName: String?
        let groupName: String?
        let todayWorkout: Workout?
        let completedThisWeek: Int
        let totalThisWeek: Int
    }

    struct Workout: Decodable, Sendable {
        let sport: String
        let title: String
        let durationMinutes: Int
        let status: String
    }
}

@Observable @MainActor
final class NativeCoachDashboardModel {
    private let origin: URL
    private let store: WKWebsiteDataStore
    private let session = URLSession(configuration: .ephemeral)
    var dashboard: NativeCoachDashboard?
    var loading = false
    var error: String?

    init(origin: URL, store: WKWebsiteDataStore) {
        self.origin = origin
        self.store = store
    }

    func load(force: Bool = false) async {
        guard !loading, force || dashboard == nil else { return }
        loading = true
        error = nil
        defer { loading = false }
        do {
            var calendar = Calendar(identifier: .gregorian)
            calendar.timeZone = .current
            calendar.firstWeekday = 2
            calendar.minimumDaysInFirstWeek = 4
            let interval = calendar.dateInterval(of: .weekOfYear, for: Date())
            guard let weekStart = interval?.start,
                  let weekEnd = calendar.date(byAdding: .day, value: 6, to: weekStart),
                  let baseURL = URL(string: "/api/native/coach/dashboard", relativeTo: origin)?.absoluteURL,
                  var components = URLComponents(url: baseURL, resolvingAgainstBaseURL: false) else {
                throw NativePlanError.invalidConfiguration
            }
            let dayFormatter = DateFormatter()
            dayFormatter.locale = Locale(identifier: "en_US_POSIX")
            dayFormatter.calendar = calendar
            dayFormatter.timeZone = .current
            dayFormatter.dateFormat = "yyyy-MM-dd"
            components.queryItems = [
                URLQueryItem(name: "today", value: dayFormatter.string(from: Date())),
                URLQueryItem(name: "weekStart", value: dayFormatter.string(from: weekStart)),
                URLQueryItem(name: "weekEnd", value: dayFormatter.string(from: weekEnd)),
            ]
            guard let url = components.url,
                  Configuration.allows(url, origin: origin) else { throw NativePlanError.invalidConfiguration }
            var request = URLRequest(url: url)
            request.httpMethod = "GET"
            request.setValue("application/json", forHTTPHeaderField: "Accept")
            request.setValue("1", forHTTPHeaderField: "X-TriWaveX-Native")
            if let cookie = await cookieHeader(for: url) { request.setValue(cookie, forHTTPHeaderField: "Cookie") }
            let (data, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse,
                  Configuration.allows(http.url ?? url, origin: origin),
                  http.value(forHTTPHeaderField: "Content-Type")?.lowercased().contains("application/json") == true else {
                throw NativePlanError.unavailable
            }
            guard http.statusCode == 200 else {
                if http.statusCode == 401 { throw NativePlanError.unauthorized }
                if http.statusCode == 403 { throw NativeCoachError.role }
                throw NativePlanError.unavailable
            }
            dashboard = try JSONDecoder().decode(NativeCoachDashboard.self, from: data)
        } catch {
            self.error = (error as? LocalizedError)?.errorDescription ?? "No se ha podido cargar tu equipo."
        }
    }

    private func cookieHeader(for url: URL) async -> String? {
        guard let host = url.host?.lowercased(), let scheme = url.scheme?.lowercased() else { return nil }
        let cookies = await withCheckedContinuation { continuation in
            store.httpCookieStore.getAllCookies { continuation.resume(returning: $0) }
        }
        let now = Date()
        let matching = cookies.filter { cookie in
            let domain = cookie.domain.trimmingCharacters(in: CharacterSet(charactersIn: ".")).lowercased()
            return (cookie.expiresDate.map { $0 > now } ?? true) && (!cookie.isSecure || scheme == "https") &&
                (host == domain || host.hasSuffix(".\(domain)")) && !cookie.name.contains(";") && !cookie.value.contains(";")
        }
        return matching.isEmpty ? nil : matching.map { "\($0.name)=\($0.value)" }.joined(separator: "; ")
    }
}

private enum NativeCoachError: LocalizedError {
    case role
    var errorDescription: String? { "Esta cuenta no tiene un espacio de entrenador." }
}

struct NativeCoachDashboardView: View {
    @Bindable var model: NativeCoachDashboardModel
    let openAthlete: (String) -> Void

    var body: some View {
        NavigationStack {
            Group {
                if let dashboard = model.dashboard {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 18) {
                            VStack(alignment: .leading, spacing: 5) {
                                Text("Tu equipo").font(.largeTitle.bold())
                                Text("Hola, \(dashboard.coachName). Aquí tienes el pulso de tus atletas.")
                                    .font(.subheadline).foregroundStyle(.secondary)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)

                            HStack(spacing: 12) {
                                summaryTile(value: "\(dashboard.athletes.count)", label: "Atletas", symbol: "person.2.fill")
                                summaryTile(value: "\(dashboard.athletes.filter { $0.todayWorkout != nil }.count)", label: "Con sesión hoy", symbol: "figure.run")
                            }

                            if dashboard.athletes.isEmpty {
                                ContentUnavailableView("Aún no tienes atletas", systemImage: "person.2", description: Text("Cuando alguien se una a tu equipo, aparecerá aquí."))
                                    .padding(.top, 12)
                            } else {
                                VStack(alignment: .leading, spacing: 12) {
                                    Text("Atletas").font(.title3.bold())
                                    ForEach(dashboard.athletes) { athlete in
                                        Button { openAthlete(athlete.id) } label: { athleteCard(athlete) }
                                            .buttonStyle(.plain)
                                    }
                                }
                            }
                            if let error = model.error {
                                Label(error, systemImage: "exclamationmark.triangle.fill").font(.footnote).foregroundStyle(.red)
                            }
                        }
                        .padding(20)
                    }
                    .refreshable { await model.load(force: true) }
                } else if model.loading {
                    ProgressView("Cargando tu equipo…").frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ContentUnavailableView {
                        Label("Espacio no disponible", systemImage: "person.2.badge.gearshape")
                    } description: { Text(model.error ?? "Comprueba tu conexión e inténtalo de nuevo.") }
                    actions: { Button("Reintentar") { Task { await model.load(force: true) } } }
                }
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .navigationTitle("Hoy")
            .navigationBarTitleDisplayMode(.inline)
            .task { await model.load() }
        }
    }

    private func summaryTile(value: String, label: String, symbol: String) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Image(systemName: symbol).foregroundStyle(Color.triWaveXAqua)
            Text(value).font(.title.bold())
            Text(label).font(.caption).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, minHeight: 105, alignment: .leading)
        .padding(15)
        .background(Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    private func athleteCard(_ athlete: NativeCoachDashboard.Athlete) -> some View {
        HStack(spacing: 12) {
            Image(systemName: athlete.todayWorkout == nil ? "person.fill" : icon(for: athlete.todayWorkout?.sport ?? ""))
                .font(.headline).foregroundStyle(Color.triWaveXAqua)
                .frame(width: 44, height: 44).background(Color.triWaveXAqua.opacity(0.12), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            VStack(alignment: .leading, spacing: 4) {
                Text(athlete.name).font(.headline).foregroundStyle(.primary)
                Text(athlete.todayWorkout.map { "\($0.title) · \($0.durationMinutes) min" } ?? (athlete.planName ?? "Sin sesión hoy"))
                    .font(.caption).foregroundStyle(.secondary).lineLimit(2)
                Text("Semana: \(athlete.completedThisWeek)/\(athlete.totalThisWeek) sesiones" + (athlete.groupName.map { " · \($0)" } ?? ""))
                    .font(.caption2).foregroundStyle(.secondary)
            }
            Spacer(minLength: 0)
            Image(systemName: athlete.todayWorkout?.status == "completed" ? "checkmark.circle.fill" : "chevron.right")
                .foregroundStyle(athlete.todayWorkout?.status == "completed" ? Color.green : Color.secondary)
        }
        .padding(14)
        .background(Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .contentShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    private func icon(for sport: String) -> String {
        let value = sport.lowercased()
        if value.contains("nat") || value.contains("swim") { return "figure.pool.swim" }
        if value.contains("bic") || value.contains("cycl") { return "bicycle" }
        if value.contains("fuer") || value.contains("gym") { return "dumbbell" }
        return "figure.run"
    }
}
