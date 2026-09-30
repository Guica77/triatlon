import Foundation
import Observation
import SwiftUI
import WebKit

struct NativeChatParticipant: Identifiable, Decodable, Hashable {
    let id: String
    let first_name: String?
    let last_name: String?
    let role: String?

    var name: String { [first_name, last_name].compactMap { $0 }.joined(separator: " ").isEmpty ? "Contacto" : [first_name, last_name].compactMap { $0 }.joined(separator: " ") }
    var subtitle: String { role == "coach" ? "Entrenador" : "Atleta" }
}

struct NativeChatMessage: Identifiable, Decodable, Hashable {
    let id: String
    let sender_id: String
    let receiver_id: String
    let message: String
    let created_at: String

    /// Supabase sends microseconds ("…:00.123456+00:00"), which a plain
    /// ISO8601DateFormatter rejects; every message then showed the current time.
    nonisolated static func date(_ value: String) -> Date? {
        NativeDate.parse(value)
    }

    nonisolated static func timestamp(_ value: String, now: Date = .now, calendar: Calendar = .current) -> String {
        guard let date = date(value) else { return "" }
        let time = DateFormatter.localizedString(from: date, dateStyle: .none, timeStyle: .short)
        if calendar.isDate(date, inSameDayAs: now) { return time }
        return DateFormatter.localizedString(from: date, dateStyle: .short, timeStyle: .none) + " · " + time
    }
}

@MainActor @Observable
final class NativeChatModel {
    private let origin: URL
    private let store: WKWebsiteDataStore
    let isPreviewOnly: Bool
    var participants: [NativeChatParticipant] = []
    var selected: NativeChatParticipant?
    var messages: [NativeChatMessage] = []
    var messageText = ""
    var loading = false
    var sending = false
    var error: String?
    /// Set when the conversation list could not load, so the screen offers a retry.
    var loadFailed = false
    /// Reused while retrying the same text: the server dedupes by this id, so a
    /// send whose response was lost is not stored twice.
    private var pendingSend: (text: String, id: String)?

    init(origin: URL, store: WKWebsiteDataStore, previewParticipants: [NativeChatParticipant]? = nil, previewMessages: [NativeChatMessage] = []) {
        self.origin = origin
        self.store = store
        isPreviewOnly = previewParticipants != nil
        if let previewParticipants {
            participants = previewParticipants
            selected = previewParticipants.first
            messages = previewMessages
        }
    }

    func load() async {
        guard !isPreviewOnly else { return }
        loading = true; error = nil; loadFailed = false
        defer { loading = false }
        do {
            let response: ParticipantsResponse = try await request("api/native/chat/participants")
            guard let rows = response.data else { throw ChatError.message(response.error ?? "No se han podido cargar las conversaciones.") }
            participants = rows
            if selected == nil { selected = rows.first }
            if let selected { await loadMessages(for: selected) }
        } catch {
            if participants.isEmpty { loadFailed = true } else { self.error = error.localizedDescription }
        }
    }

    func select(_ participant: NativeChatParticipant) async {
        guard !isPreviewOnly else { selected = participant; return }
        selected = participant
        await loadMessages(for: participant)
    }

    func refresh() async {
        guard !isPreviewOnly else { return }
        // Background refresh stays silent: the next poll retries on its own.
        if let selected { await loadMessages(for: selected, showSpinner: false, reportsErrors: false) }
    }

    func send() async {
        guard !isPreviewOnly else { return }
        guard let selected, !messageText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, !sending else { return }
        let text = messageText.trimmingCharacters(in: .whitespacesAndNewlines)
        let clientID = pendingSend?.text == text ? pendingSend!.id : UUID().uuidString
        pendingSend = (text, clientID)
        messageText = ""; sending = true
        defer { sending = false }
        do {
            let body = try JSONEncoder().encode(SendInput(participantId: selected.id, message: text, clientMessageId: clientID))
            let response: MessageResponse = try await request("api/native/chat/messages", method: "POST", body: body)
            guard let saved = response.data else { throw ChatError.message(response.error ?? "No se ha podido enviar el mensaje.") }
            pendingSend = nil
            if !messages.contains(where: { $0.id == saved.id }) { messages.append(saved) }
        } catch { messageText = text; self.error = error.localizedDescription }
    }

    private func loadMessages(for participant: NativeChatParticipant, showSpinner: Bool = true, reportsErrors: Bool = true) async {
        if showSpinner { loading = true }; defer { if showSpinner { loading = false } }
        do {
            let response: MessagesResponse = try await request("api/native/chat/messages?participantId=\(participant.id)")
            guard let rows = response.data else { throw ChatError.message(response.error ?? "No se ha podido cargar la conversación.") }
            guard selected?.id == participant.id else { return }
            messages = rows
        } catch { if reportsErrors, selected?.id == participant.id { self.error = error.localizedDescription } }
    }

    private func request<Response: Decodable>(_ path: String, method: String = "GET", body: Data? = nil) async throws -> Response {
        guard let url = URL(string: path, relativeTo: origin) else { throw ChatError.message("Dirección de chat inválida.") }
        var request = URLRequest(url: url)
        request.httpMethod = method; request.timeoutInterval = 20; request.httpShouldHandleCookies = false
        request.setValue("1", forHTTPHeaderField: "X-TriWaveX-Native")
        if let body { request.setValue("application/json", forHTTPHeaderField: "Content-Type"); request.httpBody = body }
        if let cookie = await NativeCookieJar.header(for: url.absoluteURL, in: store) { request.setValue(cookie, forHTTPHeaderField: "Cookie") }
        let session = NativeCookieJar.makeSession(); defer { session.finishTasksAndInvalidate() }
        let (data, response) = try await session.data(for: request)
        if let http = response as? HTTPURLResponse { await NativeCookieJar.persist(from: http, for: url.absoluteURL, in: store) }
        guard let http = response as? HTTPURLResponse else { throw ChatError.message("No se ha podido conectar con el chat.") }
        guard (200..<300).contains(http.statusCode) else {
            if http.statusCode == 401 { throw ChatError.message("Tu sesión ha caducado. Vuelve a iniciar sesión.") }
            let message = (try? JSONSerialization.jsonObject(with: data) as? [String: Any])?["error"] as? String
            throw ChatError.message(message ?? "No se ha podido conectar con el chat.")
        }
        return try JSONDecoder().decode(Response.self, from: data)
    }


    private struct ParticipantsResponse: Decodable { let data: [NativeChatParticipant]?; let error: String? }
    private struct MessagesResponse: Decodable { let data: [NativeChatMessage]?; let error: String? }
    private struct MessageResponse: Decodable { let data: NativeChatMessage?; let error: String? }
    private struct SendInput: Encodable { let participantId: String; let message: String; let clientMessageId: String }
    private enum ChatError: LocalizedError { case message(String); var errorDescription: String? { switch self { case .message(let value): value } } }
}

struct NativeChatView: View {
    @State private var model: NativeChatModel
    @FocusState private var composerFocused: Bool

    init(origin: URL, store: WKWebsiteDataStore, previewConversation: Bool = false, previewAsCoach: Bool = false) {
        // The demo shows the conversation from the viewer's side: a coach talks
        // to an athlete, an athlete talks to their coach.
        let counterpart = previewAsCoach
            ? NativeChatParticipant(id: "demo-athlete", first_name: "María", last_name: "G.", role: "athlete")
            : NativeChatParticipant(id: "demo-coach", first_name: "Ana", last_name: "Coach", role: "coach")
        let participants: [NativeChatParticipant]? = previewConversation ? [counterpart] : nil
        let messages = previewConversation ? [
            NativeChatMessage(id: "demo-message-1", sender_id: "demo-coach", receiver_id: "demo-athlete", message: "¡Hola! He revisado tu semana. ¿Cómo te has encontrado en los entrenamientos?", created_at: ISO8601DateFormatter().string(from: .now.addingTimeInterval(-3600))),
            NativeChatMessage(id: "demo-message-2", sender_id: "demo-athlete", receiver_id: "demo-coach", message: "Bien, aunque la sesión de carrera me ha costado un poco.", created_at: ISO8601DateFormatter().string(from: .now.addingTimeInterval(-3300))),
        ] : []
        _model = State(initialValue: NativeChatModel(origin: origin, store: store, previewParticipants: participants, previewMessages: messages))
    }

    var body: some View {
        NavigationStack {
            Group {
                if model.loading && model.participants.isEmpty {
                    ProgressView("Cargando mensajes…")
                } else if model.loadFailed {
                    ContentUnavailableView {
                        Label("No se ha podido cargar el chat", systemImage: "wifi.slash")
                    } description: {
                        Text("Comprueba tu conexión e inténtalo de nuevo.")
                    } actions: {
                        Button("Reintentar") { Task { await model.load() } }
                    }
                } else if model.participants.isEmpty {
                    ContentUnavailableView("Sin conversaciones", systemImage: "bubble.left.and.bubble.right", description: Text("Cuando tengas un entrenador o atleta vinculado, aparecerá aquí."))
                } else {
                    conversation
                }
            }
            .navigationTitle(model.selected?.name ?? "Mensajes")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .topBarTrailing) { Button { Task { await model.load() } } label: { Image(systemName: "arrow.clockwise") }.accessibilityLabel("Actualizar").disabled(model.loading) } }
        }
        .task { await model.load() }
        .task {
            guard !model.isPreviewOnly else { return }
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(15))
                if !Task.isCancelled { await model.refresh() }
            }
        }
        .alert("Chat", isPresented: Binding(get: { model.error != nil }, set: { if !$0 { model.error = nil } })) { Button("Aceptar", role: .cancel) { model.error = nil } } message: { Text(model.error ?? "") }
    }

    private var conversation: some View {
        VStack(spacing: 0) {
            if model.participants.count > 1 {
                Picker("Conversación", selection: Binding(get: { model.selected }, set: { next in if let next { Task { await model.select(next) } } })) {
                    ForEach(model.participants) { Text($0.name).tag(Optional($0)) }
                }
                .pickerStyle(.menu)
                .padding(.horizontal)
            }
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 8) {
                        ForEach(model.messages) { item in
                            HStack {
                                if item.sender_id == model.selected?.id { messageBubble(item, incoming: true); Spacer(minLength: 48) }
                                else { Spacer(minLength: 48); messageBubble(item, incoming: false) }
                            }
                            .id(item.id)
                        }
                    }
                    .padding(.horizontal, 12).padding(.vertical, 16)
                }
                .onChange(of: model.messages.last?.id) { _, id in if let id { withAnimation { proxy.scrollTo(id, anchor: .bottom) } } }
            }
            Divider()
            HStack(alignment: .bottom, spacing: 10) {
                TextField("Mensaje", text: $model.messageText, axis: .vertical)
                    .lineLimit(1...5).focused($composerFocused).padding(.horizontal, 12).padding(.vertical, 9)
                    .background(Color(uiColor: .secondarySystemBackground), in: Capsule())
                Button { Task { await model.send() } } label: { Image(systemName: model.sending ? "hourglass" : "arrow.up.circle.fill").font(.system(size: 30)) }
                    .disabled(model.messageText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || model.sending)
                    .accessibilityLabel("Enviar mensaje")
            }
            .padding(.horizontal, 12).padding(.vertical, 10).background(.bar)
        }
    }

    private func messageBubble(_ item: NativeChatMessage, incoming: Bool) -> some View {
        VStack(alignment: incoming ? .leading : .trailing, spacing: 3) {
            Text(item.message).textSelection(.enabled).padding(.horizontal, 12).padding(.vertical, 9)
                .foregroundStyle(incoming ? Color.primary : Color.white)
                .background(incoming ? Color(uiColor: .secondarySystemBackground) : Color.accentColor, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            Text(NativeChatMessage.timestamp(item.created_at)).font(.caption2).foregroundStyle(.secondary)
        }
    }
}
