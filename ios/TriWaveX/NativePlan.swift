import Foundation
import Observation
import SwiftUI
import WebKit

struct NativePlan: Decodable, Sendable {
    var athleteName: String
    var planName: String
    var readOnly: Bool
    var workouts: [Workout]
    var generatedAt: Date

    struct Workout: Decodable, Identifiable, Sendable, Equatable {
        let id: String
        var date: String
        let slot: String
        var status: String
        let sport: String
        let durationMinutes: Int
        let title: String
        let detail: String?
        let lastChange: String?
    }
}

struct PlanChange: Decodable, Sendable, Equatable {
    let explanation: String
    let improvement: String
    let watchOut: String
}

struct PlanProposal: Decodable, Identifiable, Sendable {
    let proposalId: String
    let decision: String
    let presentation: Presentation
    let proposedIntent: Intent
    let expiresAt: String

    var id: String { proposalId }

    struct Presentation: Decodable, Sendable {
        let title: String
        let summary: String
        let improvement: String
        let watchOut: String
        let primaryAction: String?
    }

    struct Intent: Decodable, Sendable {
        let workoutId: String
        let targetDate: String
        let targetSlot: String
    }
}

enum NativePlanError: LocalizedError {
    case invalidConfiguration, unauthorized, conflict(String), unavailable

    var errorDescription: String? {
        switch self {
        case .invalidConfiguration: "No se ha podido abrir el plan."
        case .unauthorized: "Tu sesión ha caducado."
        case .conflict(let message): message
        case .unavailable: "No se ha podido actualizar el plan. Inténtalo de nuevo."
        }
    }
}

struct NativePlanClient {
    let origin: URL
    let store: WKWebsiteDataStore
    let session: URLSession

    init(origin: URL, store: WKWebsiteDataStore, session: URLSession? = nil) {
        self.origin = origin
        self.store = store
        self.session = session ?? URLSession(configuration: .ephemeral)
    }

    func fetch() async throws -> NativePlan {
        let (data, response) = try await request(method: "GET", body: nil)
        guard response.statusCode == 200 else { throw mapError(response, data: data) }
        let decoder = JSONDecoder(); decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(NativePlan.self, from: data)
    }

    func updateStatus(id: String, status: String) async throws -> PlanChange {
        let body = try JSONSerialization.data(withJSONObject: ["workoutId": id, "status": status])
        let (data, response) = try await request(method: "PATCH", body: body)
        guard response.statusCode == 200 else { throw mapError(response, data: data) }
        return try JSONDecoder().decode(UpdateResponse.self, from: data).change
    }

    func previewMove(id: String, date: String, slot: String) async throws -> PlanProposal {
        let body = try JSONSerialization.data(withJSONObject: [
            "workoutId": id,
            "targetDate": date,
            "targetSlot": slot,
            "idempotencyKey": UUID().uuidString.lowercased(),
        ])
        let (data, response) = try await request(method: "POST", body: body)
        guard response.statusCode == 200 else { throw mapError(response, data: data) }
        return try JSONDecoder().decode(PlanProposal.self, from: data)
    }

    func resolve(_ proposal: PlanProposal) async throws {
        let action = proposal.decision == "coach_review" ? "submit" : "confirm"
        let body = try JSONSerialization.data(withJSONObject: ["proposalId": proposal.proposalId, "action": action])
        let (data, response) = try await request(method: "PUT", body: body)
        guard response.statusCode == 200 else { throw mapError(response, data: data) }
    }

    private struct UpdateResponse: Decodable { let change: PlanChange }
    private struct ErrorResponse: Decodable { let error: String }

    private func request(method: String, body: Data?) async throws -> (Data, HTTPURLResponse) {
        guard Configuration.allows(origin, origin: origin),
              let url = URL(string: "/api/native/athlete/plan", relativeTo: origin)?.absoluteURL,
              Configuration.allows(url, origin: origin) else { throw NativePlanError.invalidConfiguration }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.httpBody = body
        request.timeoutInterval = 30
        request.httpShouldHandleCookies = false
        request.setValue("1", forHTTPHeaderField: "X-TriWaveX-Native")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if body != nil { request.setValue("application/json", forHTTPHeaderField: "Content-Type") }
        if let cookie = await cookieHeader(for: url) { request.setValue(cookie, forHTTPHeaderField: "Cookie") }
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse,
              Configuration.allows(http.url ?? url, origin: origin),
              http.value(forHTTPHeaderField: "Content-Type")?.lowercased().contains("application/json") == true else {
            throw NativePlanError.unavailable
        }
        return (data, http)
    }

    private func mapError(_ response: HTTPURLResponse, data: Data) -> NativePlanError {
        if response.statusCode == 401 { return .unauthorized }
        if response.statusCode == 409, let message = try? JSONDecoder().decode(ErrorResponse.self, from: data).error { return .conflict(message) }
        return .unavailable
    }

    private func cookieHeader(for url: URL) async -> String? {
        guard let host = url.host?.lowercased(), let scheme = url.scheme?.lowercased() else { return nil }
        let cookies = await withCheckedContinuation { continuation in store.httpCookieStore.getAllCookies { continuation.resume(returning: $0) } }
        let now = Date()
        let matching = cookies.filter { cookie in
            let domain = cookie.domain.trimmingCharacters(in: CharacterSet(charactersIn: ".")).lowercased()
            return (cookie.expiresDate.map { $0 > now } ?? true) && (!cookie.isSecure || scheme == "https") &&
                (host == domain || host.hasSuffix(".\(domain)")) && !cookie.name.contains(";") && !cookie.value.contains(";")
        }
        return matching.isEmpty ? nil : matching.map { "\($0.name)=\($0.value)" }.joined(separator: "; ")
    }
}

@Observable @MainActor
final class NativePlanModel {
    private let client: NativePlanClient
    var plan: NativePlan?
    var loading = false
    var savingIDs = Set<String>()
    var error: String?
    var latestChange: PlanChange?
    var proposal: PlanProposal?
    var resolvingProposal = false

    init(client: NativePlanClient) { self.client = client }

    func load(force: Bool = false) async {
        guard !loading, force || plan == nil else { return }
        loading = true; error = nil
        defer { loading = false }
        do { plan = try await client.fetch() }
        catch { self.error = (error as? LocalizedError)?.errorDescription ?? "No se ha podido cargar el plan." }
    }

    func updateStatus(_ workout: NativePlan.Workout, status: String) async -> Bool {
        guard !savingIDs.contains(workout.id), var current = plan,
              let index = current.workouts.firstIndex(where: { $0.id == workout.id }) else { return false }
        let original = current.workouts[index]
        current.workouts[index].status = status
        plan = current
        savingIDs.insert(workout.id)
        error = nil
        do { latestChange = try await client.updateStatus(id: workout.id, status: status) }
        catch {
            if var rollback = plan, let rollbackIndex = rollback.workouts.firstIndex(where: { $0.id == workout.id }) {
                rollback.workouts[rollbackIndex] = original; plan = rollback
            }
            self.error = (error as? LocalizedError)?.errorDescription ?? "No se ha podido guardar el cambio."
            savingIDs.remove(workout.id)
            return false
        }
        savingIDs.remove(workout.id)
        return true
    }

    func previewMove(_ workout: NativePlan.Workout, date: String) async -> Bool {
        guard !savingIDs.contains(workout.id) else { return false }
        savingIDs.insert(workout.id)
        error = nil
        defer { savingIDs.remove(workout.id) }
        do {
            proposal = try await client.previewMove(id: workout.id, date: date, slot: workout.slot)
            return true
        } catch {
            self.error = (error as? LocalizedError)?.errorDescription ?? "No se ha podido analizar el cambio."
            return false
        }
    }

    func resolveProposal() async -> Bool {
        guard let proposal, !resolvingProposal else { return false }
        resolvingProposal = true
        error = nil
        defer { resolvingProposal = false }
        do {
            try await client.resolve(proposal)
            if proposal.decision != "coach_review", var current = plan,
               let index = current.workouts.firstIndex(where: { $0.id == proposal.proposedIntent.workoutId }) {
                current.workouts[index].date = proposal.proposedIntent.targetDate
                plan = current
            }
            latestChange = PlanChange(
                explanation: proposal.presentation.summary,
                improvement: proposal.presentation.improvement,
                watchOut: proposal.presentation.watchOut
            )
            self.proposal = nil
            return true
        } catch {
            self.error = (error as? LocalizedError)?.errorDescription ?? "No se ha podido confirmar el cambio."
            return false
        }
    }
}

struct NativePlanView: View {
    @Bindable var model: NativePlanModel
    @State private var selectedDate = Date()
    @State private var weekStart = Calendar.current.dateInterval(of: .weekOfYear, for: Date())?.start ?? Date()
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        NavigationStack {
            Group {
                if let plan = model.plan { content(plan) }
                else if model.loading { ProgressView("Cargando tu plan…").frame(maxWidth: .infinity, maxHeight: .infinity) }
                else {
                    ContentUnavailableView {
                        Label("Plan no disponible", systemImage: "calendar.badge.exclamationmark")
                    } description: {
                        Text(model.error ?? "Inténtalo de nuevo.")
                    } actions: {
                        Button("Reintentar") { Task { await model.load(force: true) } }
                    }
                }
            }
            .navigationTitle("Plan")
            .navigationBarTitleDisplayMode(.large)
            .task { await model.load() }
            .refreshable { await model.load(force: true) }
            .sheet(item: $model.proposal) { proposal in
                PlanProposalSheet(
                    proposal: proposal,
                    resolving: model.resolvingProposal,
                    confirm: { await model.resolveProposal() },
                    cancel: { model.proposal = nil }
                )
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
            }
            .alert("Cambio guardado", isPresented: Binding(get: { model.latestChange != nil }, set: { if !$0 { model.latestChange = nil } })) {
                Button("Aceptar", role: .cancel) { model.latestChange = nil }
            } message: {
                if let change = model.latestChange { Text("\(change.explanation)\n\nMejora: \(change.improvement)\n\nA vigilar: \(change.watchOut)") }
            }
        }
    }

    private func content(_ plan: NativePlan) -> some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                planHeader(plan)
                weekPicker
                dayPicker(plan)
                workoutsSection(plan)
                if let message = model.error { Label(message, systemImage: "exclamationmark.triangle.fill").font(.footnote).foregroundStyle(.red).frame(maxWidth: .infinity, alignment: .leading) }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 24)
        }
        .background(Color(uiColor: .systemGroupedBackground))
    }

    private func planHeader(_ plan: NativePlan) -> some View {
        HStack(spacing: 12) {
            Image(systemName: "calendar").font(.title2).foregroundStyle(.white).frame(width: 46, height: 46).background(Color.triWaveXAqua, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            VStack(alignment: .leading, spacing: 3) { Text(plan.planName).font(.headline); Text(plan.readOnly ? "Gestionado por tu entrenador" : "Toca una sesión para editar fecha y estado").font(.footnote).foregroundStyle(.secondary) }
            Spacer()
        }
        .padding(14).background(Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    private var weekPicker: some View {
        HStack {
            Button { changeWeek(-1) } label: { Image(systemName: "chevron.left").frame(width: 44, height: 44) }
            Spacer()
            Button("Esta semana") { withAnimation(TriWaveXMotion.selection(reduced: reduceMotion)) { let today = Date(); weekStart = Calendar.current.dateInterval(of: .weekOfYear, for: today)?.start ?? today; selectedDate = today } }.font(.subheadline.weight(.semibold))
            Spacer()
            Button { changeWeek(1) } label: { Image(systemName: "chevron.right").frame(width: 44, height: 44) }
        }
    }

    private func dayPicker(_ plan: NativePlan) -> some View {
        HStack(spacing: 6) {
            ForEach(weekDates, id: \.self) { date in
                let selected = Calendar.current.isDate(date, inSameDayAs: selectedDate)
                let count = workouts(on: date, in: plan).count
                Button { withAnimation(TriWaveXMotion.selection(reduced: reduceMotion)) { selectedDate = date } } label: {
                    VStack(spacing: 6) {
                        Text(date.formatted(.dateTime.weekday(.narrow))).font(.caption2.weight(.semibold))
                        Text(date.formatted(.dateTime.day())).font(.body.weight(selected ? .bold : .medium))
                        Circle().fill(count > 0 ? Color.triWaveXAqua : .clear).frame(width: 5, height: 5)
                    }
                    .foregroundStyle(selected ? .white : .primary).frame(maxWidth: .infinity, minHeight: 66)
                    .background(selected ? Color.triWaveXAqua : Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                }.buttonStyle(.plain).accessibilityLabel(date.formatted(date: .complete, time: .omitted))
            }
        }
    }

    @ViewBuilder private func workoutsSection(_ plan: NativePlan) -> some View {
        let dayWorkouts = workouts(on: selectedDate, in: plan)
        VStack(alignment: .leading, spacing: 10) {
            Text(selectedDate.formatted(.dateTime.weekday(.wide).day().month(.wide))).font(.headline).frame(maxWidth: .infinity, alignment: .leading)
            if dayWorkouts.isEmpty {
                ContentUnavailableView("Día de recuperación", systemImage: "figure.mind.and.body", description: Text("No hay sesiones programadas."))
                    .frame(maxWidth: .infinity).padding(.vertical, 20).background(Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 18))
            } else {
                ForEach(dayWorkouts) { workout in
                    NavigationLink {
                        NativeWorkoutEditor(workout: workout, coachControlled: plan.readOnly, saving: model.savingIDs.contains(workout.id)) { date, status in
                            if date != workout.date { return await model.previewMove(workout, date: date) }
                            if status != workout.status { return await model.updateStatus(workout, status: status) }
                            return false
                        }
                    } label: { workoutCard(workout) }.buttonStyle(.plain)
                }
            }
        }
    }

    private func workoutCard(_ workout: NativePlan.Workout) -> some View {
        HStack(spacing: 12) {
            Image(systemName: sportIcon(workout.sport)).font(.headline).foregroundStyle(sportColor(workout.sport)).frame(width: 40, height: 40).background(sportColor(workout.sport).opacity(0.12), in: RoundedRectangle(cornerRadius: 11))
            VStack(alignment: .leading, spacing: 4) { Text(workout.title).font(.subheadline.weight(.semibold)).lineLimit(2); Text("\(workout.durationMinutes) min · \(statusLabel(workout.status))").font(.caption).foregroundStyle(.secondary) }
            Spacer(); if model.savingIDs.contains(workout.id) { ProgressView() } else { Image(systemName: "pencil.circle.fill").font(.title3).foregroundStyle(Color.triWaveXAqua) }
        }
        .padding(14).background(Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    private var weekDates: [Date] { (0..<7).compactMap { Calendar.current.date(byAdding: .day, value: $0, to: weekStart) } }
    private func workouts(on date: Date, in plan: NativePlan) -> [NativePlan.Workout] { let key = Self.dayFormatter.string(from: date); return plan.workouts.filter { $0.date == key } }
    private func changeWeek(_ offset: Int) { withAnimation(TriWaveXMotion.selection(reduced: reduceMotion)) { weekStart = Calendar.current.date(byAdding: .day, value: offset * 7, to: weekStart) ?? weekStart; selectedDate = weekStart } }
    private static let dayFormatter: DateFormatter = { let value = DateFormatter(); value.calendar = Calendar(identifier: .gregorian); value.locale = Locale(identifier: "en_US_POSIX"); value.dateFormat = "yyyy-MM-dd"; return value }()
    private func sportIcon(_ sport: String) -> String { switch sport { case "natacion": "figure.pool.swim"; case "ciclismo": "bicycle"; case "carrera": "figure.run"; case "fuerza": "dumbbell"; default: "figure.mixed.cardio" } }
    private func sportColor(_ sport: String) -> Color { switch sport { case "natacion": .triWaveXSwim; case "ciclismo": .triWaveXBike; case "carrera": .green; case "fuerza": .purple; default: .secondary } }
    private func statusLabel(_ status: String) -> String { switch status { case "completed": "Completado"; case "missed": "No realizado"; default: "Pendiente" } }
}

struct NativeWorkoutEditor: View {
    let workout: NativePlan.Workout
    let coachControlled: Bool
    let saving: Bool
    let save: (String, String) async -> Bool
    @State private var date: Date
    @State private var status: String
    @Environment(\.dismiss) private var dismiss

    init(workout: NativePlan.Workout, coachControlled: Bool, saving: Bool, save: @escaping (String, String) async -> Bool) {
        self.workout = workout; self.coachControlled = coachControlled; self.saving = saving; self.save = save
        _date = State(initialValue: NativePlanViewDayParser.date(workout.date) ?? Date())
        _status = State(initialValue: workout.status)
    }

    var body: some View {
        Form {
            Section("Sesión") { LabeledContent("Deporte", value: workout.sport.capitalized); LabeledContent("Duración", value: "\(workout.durationMinutes) minutos"); Text(workout.detail ?? workout.title).foregroundStyle(.secondary) }
            Section("Programación") {
                DatePicker("Fecha", selection: $date, in: Date()...(Calendar.current.date(byAdding: .day, value: 56, to: Date()) ?? Date()), displayedComponents: .date)
                    .disabled(workout.status == "completed")
                    .onChange(of: date) { _, _ in status = workout.status }
                Picker("Estado", selection: $status) { Text("Pendiente").tag("pending"); Text("Completado").tag("completed"); Text("No realizado").tag("missed") }
                    .disabled(coachControlled)
                    .onChange(of: status) { _, _ in date = NativePlanViewDayParser.date(workout.date) ?? Date() }
            }
            Section { Label("Vista previa", systemImage: "sparkles"); Text(coachControlled ? "Prepararemos una solicitud para que tu entrenador decida." : "Antes de guardar comprobaré la carga, la recuperación y los posibles conflictos.").font(.footnote).foregroundStyle(.secondary) }
            if coachControlled { Section { Label("Tu entrenador mantiene el control total", systemImage: "person.badge.shield.checkmark").foregroundStyle(.secondary) } }
        }
        .navigationTitle("Entrenamiento").navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button(saving ? "Analizando…" : coachControlled ? "Proponer" : "Continuar") {
                    Task { if await save(NativePlanViewDayParser.string(date), status) { dismiss() } }
                }
                .disabled(saving || workout.status == "completed" || (NativePlanViewDayParser.string(date) == workout.date && status == workout.status))
            }
        }
    }
}

struct PlanProposalSheet: View {
    let proposal: PlanProposal
    let resolving: Bool
    let confirm: () async -> Bool
    let cancel: () -> Void

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Image(systemName: proposal.decision == "blocked" ? "exclamationmark.shield.fill" : "sparkles")
                        .font(.title2.weight(.semibold))
                        .foregroundStyle(proposal.decision == "blocked" ? .red : .orange)
                        .frame(width: 50, height: 50)
                        .background((proposal.decision == "blocked" ? Color.red : Color.orange).opacity(0.12), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                    Text(proposal.presentation.title).font(.title2.bold())
                    Text(proposal.presentation.summary).foregroundStyle(.secondary)
                    proposalDetail("Mejora prevista", text: proposal.presentation.improvement, color: .blue)
                    proposalDetail("A vigilar", text: proposal.presentation.watchOut, color: .secondary)
                    if let primaryAction = proposal.presentation.primaryAction {
                        Button {
                            Task { _ = await confirm() }
                        } label: {
                            if resolving { ProgressView().frame(maxWidth: .infinity) }
                            else { Text(primaryAction).frame(maxWidth: .infinity) }
                        }
                        .buttonStyle(TriWaveXPrimaryButtonStyle(tint: .triWaveXAqua))
                        .disabled(resolving)
                    }
                    Button(proposal.presentation.primaryAction == nil ? "Elegir otra fecha" : "Ahora no", action: cancel)
                        .buttonStyle(TriWaveXTextButtonStyle(tint: .triWaveXAqua))
                        .disabled(resolving)
                        .frame(maxWidth: .infinity)
                }
                .padding(20)
            }
            .background(Color(uiColor: .systemGroupedBackground))
        }
    }

    private func proposalDetail(_ title: String, text: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(title.uppercased()).font(.caption.weight(.bold)).foregroundStyle(color)
            Text(text).font(.subheadline).foregroundStyle(.primary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(color.opacity(0.08), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}

enum NativePlanViewDayParser {
    static let formatter: DateFormatter = { let value = DateFormatter(); value.calendar = Calendar(identifier: .gregorian); value.locale = Locale(identifier: "en_US_POSIX"); value.dateFormat = "yyyy-MM-dd"; return value }()
    static func date(_ value: String) -> Date? { formatter.date(from: value) }
    static func string(_ value: Date) -> String { formatter.string(from: value) }
}
