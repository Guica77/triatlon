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
    func save(_ values: [String: Any]) async -> Bool {
        guard !isLoading else { return false }
        state = .loading
        do { try await client.update(values); state = .loaded(try await client.fetch()); return true }
        catch { state = .failed("No se han podido guardar los cambios. Inténtalo de nuevo."); return false }
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

    func update(_ values: [String: Any]) async throws {
        guard Configuration.allows(origin, origin: origin), let url = URL(string: "/api/native/athlete/profile", relativeTo: origin)?.absoluteURL else { throw URLError(.badURL) }
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"; request.timeoutInterval = 30; request.httpShouldHandleCookies = false
        request.setValue("1", forHTTPHeaderField: "X-TriWaveX-Native"); request.setValue("application/json", forHTTPHeaderField: "Accept"); request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: values)
        if let cookies = await cookieHeader(for: url) { request.setValue(cookies, forHTTPHeaderField: "Cookie") }
        let (_, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else { throw URLError(.badServerResponse) }
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
    let openPlanEditor: () -> Void
    let openAccount: () -> Void
    let replayGuide: () -> Void
    @State private var hasLoaded = false
    @State private var managingPlan = false

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
                Button { managingPlan = true } label: {
                    HStack {
                        Label("Gestionar mi plan", systemImage: "slider.horizontal.3")
                        Spacer()
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(profile.goal.name ?? "Abrir plan").lineLimit(1)
                            Text(profile.goal.date ?? "Toca para reorganizar").font(.caption2)
                        }
                        .foregroundStyle(.secondary)
                        Image(systemName: "chevron.right").font(.caption.bold()).foregroundStyle(.tertiary)
                    }
                }
                .accessibilityHint("Edita sesiones, objetivo o carga sin repetir el onboarding")
                NavigationLink { NativePhysiologyEditor(physiology: profile.physiology, save: { values in await model.save(values) }) } label: { Label("Fisiología", systemImage: "heart.text.square") }
                NavigationLink { NativeInjuryEditor(injuries: profile.physiology.injuries, save: { values in await model.save(values) }) } label: { Label("Lesiones", systemImage: "cross.case") }
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
            Section("Ayuda") {
                Button(action: replayGuide) {
                    Label("Descubrir TriWaveX", systemImage: "sparkles")
                }
                NavigationLink {
                    TriWaveXQuickHelpView()
                } label: {
                    Label("Guía rápida", systemImage: "questionmark.circle")
                }
            }
        }
        .listStyle(.insetGrouped)
        .sheet(isPresented: $managingPlan) {
            NativePlanManagementSheet(
                goal: profile.goal,
                physiology: profile.physiology,
                saveGoal: { values in await model.save(values) },
                openSessions: { managingPlan = false; openPlanEditor() }
            )
            .presentationDetents([.medium, .large])
            .presentationDragIndicator(.visible)
        }
    }

    private func metric(_ label: String, value: String) -> some View { VStack(alignment: .leading, spacing: 2) { Text(value).font(.headline.monospacedDigit()); Text(label).font(.caption).foregroundStyle(.secondary) } }
    private func connectionRow(_ name: String, connected: Bool, icon: String) -> some View { HStack { Label(name, systemImage: icon); Spacer(); Text(connected ? "Conectado" : "Disponible").font(.caption.weight(.semibold)).foregroundStyle(connected ? .green : .secondary) } }
}

private struct TriWaveXQuickHelpView: View {
    var body: some View {
        List {
            help(
                "Dispositivos y salud",
                symbol: "applewatch",
                text: "Conecta Apple Health, sensores y proveedores compatibles desde Perfil > Dispositivos y conexiones."
            )
            help(
                "Lesiones y recuperación",
                symbol: "cross.case",
                text: "Registra límites y sensaciones para adaptar la carga. TriWaveX no sustituye el consejo de un profesional sanitario."
            )
            help(
                "Plan y suscripción",
                symbol: "creditcard",
                text: "Cambia objetivos desde Gestionar mi plan y administra o restaura tu compra desde Suscripción y plan."
            )
        }
        .navigationTitle("Guía rápida")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func help(_ title: String, symbol: String, text: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Label(title, systemImage: symbol).font(.headline)
            Text(text).font(.subheadline).foregroundStyle(.secondary)
        }
        .padding(.vertical, 6)
        .accessibilityElement(children: .combine)
    }
}

struct NativePlanManagementSheet: View {
    let goal: NativeProfile.Goal
    let physiology: NativeProfile.Physiology
    let saveGoal: ([String: Any]) async -> Bool
    let openSessions: () -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var showingGoal = false
    @State private var showingLoad = false
    @State private var showingInjuries = false

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Label("Gestiona cambios sin reiniciar tu preparación.", systemImage: "checkmark.shield")
                        .font(.footnote).foregroundStyle(.secondary)
                }
                Section {
                    Button { openSessions() } label: {
                        Label("Editar sesiones", systemImage: "calendar.badge.pencil")
                    }
                    Button { showingGoal = true } label: {
                        LabeledContent { Text(goal.name ?? "Definir objetivo").foregroundStyle(.secondary).lineLimit(1) } label: { Label("Cambiar objetivo", systemImage: "flag.checkered") }
                    }
                    Button { showingLoad = true } label: {
                        Label("Subir carga", systemImage: "chart.line.uptrend.xyaxis")
                    }
                    Button { showingInjuries = true } label: {
                        LabeledContent { Text(physiology.injuries?.isEmpty == false ? "Revisar historial" : "Sin datos").foregroundStyle(.secondary) } label: { Label("Lesiones e historial", systemImage: "cross.case") }
                    }
                } header: {
                    Text("Tu plan")
                } footer: {
                    Text("Los cambios de carga se analizan antes de guardar. Si tienes entrenador, él mantiene el control del plan.")
                }
            }
            .navigationTitle("Gestionar mi plan")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Cerrar") { dismiss() } } }
            .sheet(isPresented: $showingGoal) { NativeGoalEditor(goal: goal, save: saveGoal) }
            .sheet(isPresented: $showingLoad) { NativeLoadAdjustmentSheet() }
            .sheet(isPresented: $showingInjuries) { NavigationStack { NativeInjuryEditor(injuries: physiology.injuries, save: saveGoal) } }
        }
    }
}

struct NativeGoalEditor: View {
    let goal: NativeProfile.Goal
    let save: ([String: Any]) async -> Bool
    @State private var name: String
    @State private var date: Date
    @State private var saving = false
    @State private var error: String?
    @Environment(\.dismiss) private var dismiss

    init(goal: NativeProfile.Goal, save: @escaping ([String: Any]) async -> Bool) {
        self.goal = goal; self.save = save
        _name = State(initialValue: goal.name ?? "")
        _date = State(initialValue: NativePlanViewDayParser.date(goal.date ?? "") ?? Date())
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Objetivo") { TextField("Nombre de la prueba", text: $name); DatePicker("Fecha", selection: $date, displayedComponents: .date) }
                if let error { Section { Text(error).foregroundStyle(.red) } }
            }
            .navigationTitle("Cambiar objetivo").navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Cancelar") { dismiss() } }; ToolbarItem(placement: .confirmationAction) { Button(saving ? "Guardando…" : "Guardar") { Task { await submit() } }.disabled(saving) } }
        }
    }

    private func submit() async {
        guard name.trimmingCharacters(in: .whitespacesAndNewlines).count <= 120 else { error = "El nombre no puede superar 120 caracteres."; return }
        saving = true; error = nil
        let didSave = await save(["kind": "goal", "name": name, "date": NativePlanViewDayParser.string(date)])
        saving = false; if didSave { dismiss() } else { error = "No se ha podido guardar el objetivo." }
    }
}

struct NativeLoadAdjustmentSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var scope = "Semana completa"
    @State private var level = "Suave"
    var body: some View {
        NavigationStack {
            Form {
                Section("Qué quieres reforzar") { Picker("Alcance", selection: $scope) { Text("Semana completa").tag("Semana completa"); Text("Natación").tag("Natación"); Text("Bici").tag("Bici"); Text("Carrera").tag("Carrera") }; Picker("Progresión", selection: $level) { Text("Suave · hasta 5 %").tag("Suave"); Text("Media · hasta 10 %").tag("Media") } }
                Section("Antes de aplicar") { Label("Comprobaremos recuperación, adherencia, dolor o lesión y el límite del 10 %.", systemImage: "checkmark.shield") }
                Section { Label("Para ajustar minutos concretos, elige una sesión desde «Editar sesiones». La vista previa se mostrará antes de guardar.", systemImage: "info.circle") .font(.footnote).foregroundStyle(.secondary) }
            }
            .navigationTitle("Subir carga").navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Cerrar") { dismiss() } } }
        }
    }
}

struct NativePhysiologyEditor: View {
    let physiology: NativeProfile.Physiology
    let save: ([String: Any]) async -> Bool
    @State private var ftp: String
    @State private var swimPace: String
    @State private var runPace: String
    @State private var baselineHours: String
    @State private var saving = false
    @State private var error: String?
    @Environment(\.dismiss) private var dismiss

    init(physiology: NativeProfile.Physiology, save: @escaping ([String: Any]) async -> Bool) {
        self.physiology = physiology; self.save = save
        _ftp = State(initialValue: physiology.ftp.map { String(Int($0)) } ?? "")
        _swimPace = State(initialValue: physiology.swimPace ?? "")
        _runPace = State(initialValue: physiology.runPace ?? "")
        _baselineHours = State(initialValue: physiology.baselineHours ?? "")
    }

    var body: some View {
        Form {
            Section {
                TextField("FTP (vatios)", text: $ftp).keyboardType(.numberPad)
                TextField("Ritmo de natación", text: $swimPace).textInputAutocapitalization(.never)
                TextField("Ritmo de carrera", text: $runPace).textInputAutocapitalization(.never)
            } header: { Text("Potencia y ritmos") } footer: { Text("Ejemplo: 1:50/100 m en natación y 5:00/km en carrera.") }
            Section { TextField("Horas semanales", text: $baselineHours).keyboardType(.numbersAndPunctuation) } header: { Text("Carga habitual") }
            if let error { Section { Text(error).foregroundStyle(.red) } }
        }
        .navigationTitle("Fisiología").navigationBarTitleDisplayMode(.inline)
        .toolbar { ToolbarItem(placement: .confirmationAction) { Button(saving ? "Guardando…" : "Guardar") { Task { await submit() } }.disabled(saving) } }
    }

    private func submit() async {
        let cleanedFTP = ftp.trimmingCharacters(in: .whitespacesAndNewlines)
        let parsedFTP = cleanedFTP.isEmpty ? nil : Double(cleanedFTP)
        if !cleanedFTP.isEmpty && (parsedFTP == nil || parsedFTP! < 50 || parsedFTP! > 600) { error = "El FTP debe estar entre 50 y 600 W."; return }
        saving = true; error = nil
        let didSave = await save(["kind": "physiology", "ftp": parsedFTP ?? NSNull(), "swimPace": swimPace, "runPace": runPace, "baselineHours": baselineHours])
        saving = false
        if didSave { dismiss() } else { error = "No se han podido guardar los cambios." }
    }
}

struct NativeInjuryEditor: View {
    let injuries: String?
    let save: ([String: Any]) async -> Bool
    @State private var value: String
    @State private var saving = false
    @State private var error: String?
    @Environment(\.dismiss) private var dismiss

    init(injuries: String?, save: @escaping ([String: Any]) async -> Bool) { self.injuries = injuries; self.save = save; _value = State(initialValue: injuries ?? "") }

    var body: some View {
        Form {
            Section { TextEditor(text: $value).frame(minHeight: 150) } header: { Text("Historial") } footer: { Text("Incluye información para adaptar tu entrenamiento. Si tienes dolor agudo o síntomas preocupantes, consulta con un profesional sanitario.") }
            if let error { Section { Text(error).foregroundStyle(.red) } }
        }
        .navigationTitle("Lesiones e historial").navigationBarTitleDisplayMode(.inline)
        .toolbar { ToolbarItem(placement: .confirmationAction) { Button(saving ? "Guardando…" : "Guardar") { Task { await submit() } }.disabled(saving) } }
    }

    private func submit() async {
        guard value.count <= 1_500 else { error = "El historial no puede superar 1.500 caracteres."; return }
        saving = true; error = nil; let didSave = await save(["kind": "injuries", "injuries": value]); saving = false
        if didSave { dismiss() } else { error = "No se han podido guardar los cambios." }
    }
}

struct SubscriptionManagementView: View {
    let status: String?
    private let subscriptionsURL = URL(string: "https://apps.apple.com/account/subscriptions")!

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

            Section {
                NavigationLink {
                    NativeSubscriptionStoreView(role: "athlete")
                } label: {
                    planRow("Atleta", detail: "Entrenamiento personal y seguimiento", icon: "figure.run")
                }
                NavigationLink {
                    NativeSubscriptionStoreView(role: "coach")
                } label: {
                    planRow("Entrenador", detail: "Gestión de hasta 10 atletas", icon: "person.2")
                }
            } header: {
                Text("Opciones")
            } footer: {
                Text("App Store mostrará el precio vigente y cualquier prueba disponible antes de confirmar.")
            }

            Section {
                Link(destination: subscriptionsURL) {
                    Label("Gestionar o cancelar en App Store", systemImage: "arrow.up.right.square")
                }
                NavigationLink {
                    NativeSubscriptionStoreView(role: status?.lowercased() == "coach" ? "coach" : "athlete")
                } label: {
                    Label("Restaurar compras", systemImage: "arrow.clockwise")
                }
            } footer: {
                Text("Las compras se asocian a tu Apple ID. Restaurar no genera un nuevo cargo.")
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
