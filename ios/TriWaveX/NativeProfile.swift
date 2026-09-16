import Foundation
import Observation
import SwiftUI
import WebKit

@Observable @MainActor
final class NativeProfileModel {
    enum State { case idle, loading, loaded(NativeProfile), failed(String) }
    private let client: NativeProfileClient
    var state: State = .idle

    init(client: NativeProfileClient) { self.client = client }
    func load() async {
        guard !isLoading else { return }
        state = .loading
        do { state = .loaded(try await client.fetch()) }
        catch { state = .failed("No se ha podido cargar tu perfil. Inténtalo de nuevo.") }
    }
    private var isLoading: Bool { if case .loading = state { return true }; return false }
}

struct NativeProfile: Decodable, Sendable {
    let athlete: Athlete
    let goal: Goal
    let physiology: Physiology
    let recovery: Recovery?
    let connections: Connections
    struct Athlete: Decodable, Sendable { let firstName: String; let lastName: String?; let level: String?; let subscriptionStatus: String? }
    struct Goal: Decodable, Sendable { let name: String?; let date: String? }
    struct Physiology: Decodable, Sendable { let ftp: Double?; let swimPace: String?; let runPace: String?; let baselineHours: String?; let injuries: String? }
    struct Recovery: Decodable, Sendable { let readiness: Double?; let hrv: Double?; let sleepHours: Double?; let fatigue: Double? }
    struct Connections: Decodable, Sendable { let strava: Bool; let garmin: Bool; let polar: Bool; let coros: Bool; let suunto: Bool; let amazfit: Bool }
}

struct NativeProfileClient {
    let origin: URL
    let store: WKWebsiteDataStore
    let session: URLSession

    init(origin: URL, store: WKWebsiteDataStore, session: URLSession? = nil) {
        self.origin = origin
        self.store = store
        self.session = session ?? URLSession(configuration: .ephemeral)
    }

    func fetch() async throws -> NativeProfile {
        guard Configuration.allows(origin, origin: origin),
              let url = URL(string: "/api/native/athlete/profile", relativeTo: origin)?.absoluteURL,
              Configuration.allows(url, origin: origin) else { throw URLError(.badURL) }
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.timeoutInterval = 30
        request.httpShouldHandleCookies = false
        request.setValue("1", forHTTPHeaderField: "X-TriWaveX-Native")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let cookies = await cookieHeader(for: url) { request.setValue(cookies, forHTTPHeaderField: "Cookie") }
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse,
              http.statusCode == 200,
              Configuration.allows(http.url ?? url, origin: origin),
              http.value(forHTTPHeaderField: "Content-Type")?.lowercased().contains("application/json") == true else { throw URLError(.badServerResponse) }
        return try JSONDecoder().decode(NativeProfile.self, from: data)
    }

    private func cookieHeader(for url: URL) async -> String? {
        guard let host = url.host?.lowercased(), let scheme = url.scheme?.lowercased() else { return nil }
        let cookies = await withCheckedContinuation { continuation in store.httpCookieStore.getAllCookies { continuation.resume(returning: $0) } }
        let now = Date()
        let matching = cookies.filter { cookie in
            let domain = cookie.domain.trimmingCharacters(in: CharacterSet(charactersIn: ".")).lowercased()
            let path = cookie.path.isEmpty ? "/" : cookie.path
            return (cookie.expiresDate.map { $0 > now } ?? true) &&
                (!cookie.isSecure || scheme == "https") &&
                (host == domain || host.hasSuffix(".\(domain)")) &&
                (url.path == path || url.path.hasPrefix(path.hasSuffix("/") ? path : path + "/")) &&
                !cookie.name.contains(";") && !cookie.value.contains(";")
        }
        return matching.isEmpty ? nil : matching.map { "\($0.name)=\($0.value)" }.joined(separator: "; ")
    }
}

struct NativeProfileView: View {
    @Bindable var model: NativeProfileModel
    let openDevices: () -> Void
    let openCoros: () -> Void
    let openStrava: () -> Void
    let openAccount: () -> Void
    @State private var hasLoaded = false

    var body: some View {
        NavigationStack {
            Group {
                switch model.state {
                case .idle, .loading: ProgressView("Cargando perfil…").frame(maxWidth: .infinity, maxHeight: .infinity)
                case .failed(let message):
                    ContentUnavailableView {
                        Label("Perfil no disponible", systemImage: "person.crop.circle.badge.exclamationmark")
                    } description: {
                        Text(message)
                    } actions: {
                        Button("Reintentar") { Task { await model.load() } }
                    }
                case .loaded(let profile): profileContent(profile)
                }
            }
            .navigationTitle("Perfil")
            .navigationBarTitleDisplayMode(.large)
            .task { guard !hasLoaded else { return }; hasLoaded = true; await model.load() }
            .refreshable { await model.load() }
        }
    }

    private func profileContent(_ profile: NativeProfile) -> some View {
        List {
            Section {
                HStack(spacing: 14) {
                    Text(String(profile.athlete.firstName.prefix(1)).uppercased()).font(.title2.bold()).foregroundStyle(.white).frame(width: 54, height: 54).background(Color.triWaveXAqua, in: Circle())
                    VStack(alignment: .leading, spacing: 3) { Text([profile.athlete.firstName, profile.athlete.lastName].compactMap { $0 }.joined(separator: " ")).font(.headline); Text(profile.athlete.level ?? "Triatleta").font(.subheadline).foregroundStyle(.secondary) }
                }.padding(.vertical, 5)
            }
            Section("Preparación de hoy") {
                if let recovery = profile.recovery { HStack { metric("Readiness", value: recovery.readiness.map { "\(Int($0))" } ?? "—"); Spacer(); metric("HRV", value: recovery.hrv.map { "\(Int($0)) ms" } ?? "—"); Spacer(); metric("Sueño", value: recovery.sleepHours.map { String(format: "%.1f h", $0) } ?? "—") } }
                else { Label("Aún no hay datos de recuperación", systemImage: "heart.text.square").foregroundStyle(.secondary) }
            }
            Section("Mi preparación") {
                NavigationLink { ProfileDetailView(title: "Plan", rows: [("Objetivo", profile.goal.name ?? "Sin definir"), ("Fecha", profile.goal.date ?? "Sin fecha")]) } label: { Label("Plan", systemImage: "calendar") }
                NavigationLink { ProfileDetailView(title: "Fisiología", rows: [("FTP", profile.physiology.ftp.map { "\(Int($0)) W" } ?? "Sin configurar"), ("Ritmo nado", profile.physiology.swimPace ?? "Sin configurar"), ("Ritmo carrera", profile.physiology.runPace ?? "Sin configurar")]) } label: { Label("Fisiología", systemImage: "heart.text.square") }
                NavigationLink { ProfileDetailView(title: "Lesiones", rows: [("Historial", profile.physiology.injuries ?? "Ninguna registrada")]) } label: { Label("Lesiones", systemImage: "cross.case") }
            }
            Section {
                Button(action: openDevices) { Label("Apple Health, Watch y sensores", systemImage: "applewatch").foregroundStyle(.primary) }
                connectionRow("Strava", connected: profile.connections.strava, icon: "figure.run")
                connectionRow("Garmin", connected: profile.connections.garmin, icon: "watchface.applewatch.case")
                Button(action: openCoros) {
                    HStack {
                        Label("COROS", systemImage: "timer")
                        Spacer()
                        Text(profile.connections.coros ? "Conectado" : "Conectar")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(profile.connections.coros ? .green : Color.triWaveXAqua)
                    }
                }
                connectionRow("Polar", connected: profile.connections.polar, icon: "heart.circle")
                if profile.connections.suunto {
                    connectionRow("Suunto", connected: true, icon: "mountain.2")
                } else {
                    Button(action: openStrava) {
                        HStack {
                            Label("Suunto", systemImage: "mountain.2")
                            Spacer()
                            VStack(alignment: .trailing, spacing: 2) {
                                Text("Solicitud enviada").font(.caption.weight(.semibold)).foregroundStyle(.orange)
                                Text("Conectar con Strava").font(.caption2).foregroundStyle(.tint)
                            }
                        }
                    }
                    .accessibilityLabel("Suunto: solicitud enviada. Conectar Strava mientras tanto")
                }
                if profile.connections.amazfit {
                    connectionRow("Amazfit", connected: true, icon: "watchface.applewatch.case")
                } else {
                    Link(destination: URL(string: "mailto:developer@zepp.com?subject=TriWaveX%20%E2%80%94%20Amazfit%2FZepp%20partner%20API%20request")!) {
                        HStack {
                            Label("Amazfit / Zepp", systemImage: "watchface.applewatch.case")
                            Spacer()
                            VStack(alignment: .trailing, spacing: 2) {
                                Text("Solicitud requerida").font(.caption.weight(.semibold)).foregroundStyle(.orange)
                                Text("Contactar Zepp Health").font(.caption2).foregroundStyle(.tint)
                            }
                        }
                    }
                    .accessibilityLabel("Amazfit y Zepp: solicitar acceso de partner")
                }
                Label("Importar archivo FIT o GPX", systemImage: "square.and.arrow.down").foregroundStyle(.secondary)
            } header: {
                Text("Dispositivos y conexiones")
            } footer: { Text("COROS abre un consentimiento seguro. Suunto está en revisión y permite usar Strava mientras tanto. Garmin y Polar muestran el estado de sus conexiones. Las marcas sin acceso directo usan Strava, Salud o archivos FIT/GPX.") }
            Section("Preferencias") {
                NavigationLink { ProfileDetailView(title: "Notificaciones", rows: [("Estado", "Gestiona los permisos desde Ajustes del iPhone")]) } label: { Label("Notificaciones", systemImage: "bell") }
                NavigationLink { ProfileDetailView(title: "Clima", rows: [("Tiempo local", "Disponible al preparar entrenamientos exteriores")]) } label: { Label("Clima", systemImage: "cloud.sun") }
                NavigationLink { ProfileDetailView(title: "Privacidad", rows: [("Tus datos", "Solo se usan para personalizar tu entrenamiento")]) } label: { Label("Privacidad", systemImage: "hand.raised") }
            }
            Section("Cuenta") {
                NavigationLink {
                    SubscriptionManagementView(status: profile.athlete.subscriptionStatus)
                } label: {
                    Label("Suscripción y plan", systemImage: "creditcard")
                }
                Button(action: openAccount) { Label("Cuenta y seguridad", systemImage: "person.crop.circle").foregroundStyle(.primary) }
            }
        }
        .listStyle(.insetGrouped)
    }

    private func metric(_ label: String, value: String) -> some View { VStack(alignment: .leading, spacing: 2) { Text(value).font(.headline.monospacedDigit()); Text(label).font(.caption).foregroundStyle(.secondary) } }
    private func connectionRow(_ name: String, connected: Bool, icon: String) -> some View { HStack { Label(name, systemImage: icon); Spacer(); Text(connected ? "Conectado" : "Disponible").font(.caption.weight(.semibold)).foregroundStyle(connected ? .green : .secondary) } }
}

struct SubscriptionManagementView: View {
    let status: String?

    private var statusLabel: String {
        switch status?.lowercased() {
        case "coach": return "Entrenador"
        case "trial": return "Prueba"
        case "active", "premium", "pro": return "Activa"
        default: return "Sin suscripción activa"
        }
    }

    var body: some View {
        List {
            Section {
                LabeledContent("Estado", value: statusLabel)
                Text("Esta pantalla gestiona tu acceso sin repetir el onboarding ni cambiar tus objetivos deportivos.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            } header: {
                Text("Tu suscripción")
            }

            Section("Opciones") {
                planRow("Atleta", detail: "5 €/mes después de 7 días de prueba", icon: "figure.run")
                planRow("Entrenador", detail: "30 €/mes · 10 atletas incluidos", icon: "person.2")
                Text("A partir del atleta 11, se añaden 2 €/mes por cada bloque de hasta 5 plazas.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            Section {
                Label("Los cambios de plan y las compras se activarán cuando App Store y el cobro seguro estén configurados.", systemImage: "checkmark.shield")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            } footer: {
                Text("No se realizará ningún cargo ni se modificará tu acceso desde esta pantalla hasta entonces.")
            }
        }
        .navigationTitle("Suscripción y plan")
        .navigationBarTitleDisplayMode(.large)
    }

    private func planRow(_ title: String, detail: String, icon: String) -> some View {
        Label {
            VStack(alignment: .leading, spacing: 2) {
                Text(title).foregroundStyle(.primary)
                Text(detail).font(.footnote).foregroundStyle(.secondary)
            }
        } icon: {
            Image(systemName: icon).foregroundStyle(Color.triWaveXAqua)
        }
    }
}

struct ProfileDetailView: View {
    let title: String
    let rows: [(String, String)]
    var body: some View { List { Section { ForEach(rows, id: \.0) { row in LabeledContent(row.0, value: row.1) } } }.navigationTitle(title).navigationBarTitleDisplayMode(.large) }
}
