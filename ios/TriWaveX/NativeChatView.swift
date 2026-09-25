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
        loading = true; error = nil
        defer { loading = false }
        do {
            let response: ParticipantsResponse = try await request("api/native/chat/participants")
            guard let rows = response.data else { throw ChatError.message(response.error ?? "No se han podido cargar las conversaciones.") }
            participants = rows
            if selected == nil { selected = rows.first }
            if let selected { await loadMessages(for: selected) }
        } catch { self.error = error.localizedDescription }
    }

    func select(_ participant: NativeChatParticipant) async {
        guard !isPreviewOnly else { selected = participant; return }
        selected = participant
        await loadMessages(for: participant)
    }

    func refresh() async {
        guard !isPreviewOnly else { return }
        if let selected { await loadMessages(for: selected, showSpinner: false) }
    }

    func send() async {
        guard !isPreviewOnly else { return }
        guard let selected, !messageText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, !sending else { return }
        let text = messageText.trimmingCharacters(in: .whitespacesAndNewlines)
        messageText = ""; sending = true
        defer { sending = false }
        do {
            let body = try JSONEncoder().encode(SendInput(participantId: selected.id, message: text, clientMessageId: UUID().uuidString))
            let response: MessageResponse = try await request("api/native/chat/messages", method: "POST", body: body)
            guard let saved = response.data else { throw ChatError.message(response.error ?? "No se ha podido enviar el mensaje.") }
            if !messages.contains(where: { $0.id == saved.id }) { messages.append(saved) }
        } catch { messageText = text; self.error = error.localizedDescription }
    }

    private func loadMessages(for participant: NativeChatParticipant, showSpinner: Bool = true) async {
        if showSpinner { loading = true }; defer { if showSpinner { loading = false } }
        do {
            let response: MessagesResponse = try await request("api/native/chat/messages?participantId=\(participant.id)")
            guard let rows = response.data else { throw ChatError.message(response.error ?? "No se ha podido cargar la conversación.") }
            guard selected?.id == participant.id else { return }
            messages = rows
        } catch { if selected?.id == participant.id { self.error = error.localizedDescription } }
    }

    private func request<Response: Decodable>(_ path: String, method: String = "GET", body: Data? = nil) async throws -> Response {
        guard let url = URL(string: path, relativeTo: origin) else { throw ChatError.message("Dirección de chat inválida.") }
        var request = URLRequest(url: url)
        request.httpMethod = method; request.timeoutInterval = 20; request.httpShouldHandleCookies = false
        request.setValue("1", forHTTPHeaderField: "X-TriWaveX-Native")
        if let body { request.setValue("application/json", forHTTPHeaderField: "Content-Type"); request.httpBody = body }
        if let cookie = await cookieHeader(for: url) { request.setValue(cookie, forHTTPHeaderField: "Cookie") }
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else { throw ChatError.message("No se ha podido conectar con el chat.") }
        return try JSONDecoder().decode(Response.self, from: data)
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

    private struct ParticipantsResponse: Decodable { let data: [NativeChatParticipant]?; let error: String? }
    private struct MessagesResponse: Decodable { let data: [NativeChatMessage]?; let error: String? }
    private struct MessageResponse: Decodable { let data: NativeChatMessage?; let error: String? }
    private struct SendInput: Encodable { let participantId: String; let message: String; let clientMessageId: String }
    private enum ChatError: LocalizedError { case message(String); var errorDescription: String? { switch self { case .message(let value): value } } }
}

struct NativeChatView: View {
    @State private var model: NativeChatModel
    @FocusState private var composerFocused: Bool

    init(origin: URL, store: WKWebsiteDataStore, previewConversation: Bool = false) {
        let participants: [NativeChatParticipant]? = previewConversation ? [NativeChatParticipant(id: "demo-coach", first_name: "Ana", last_name: "Coach", role: "coach")] : nil
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
                } else if model.participants.isEmpty {
                    ContentUnavailableView("Sin conversaciones", systemImage: "bubble.left.and.bubble.right", description: Text("Cuando tengas un entrenador o atleta vinculado, aparecerá aquí."))
                } else {
                    conversation
                }
            }
            .navigationTitle(model.selected?.name ?? "Mensajes")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .topBarTrailing) { Button { Task { await model.refresh() } } label: { Image(systemName: "arrow.clockwise") } } }
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
            Text(DateFormatter.localizedString(from: ISO8601DateFormatter().date(from: item.created_at) ?? .now, dateStyle: .none, timeStyle: .short)).font(.caption2).foregroundStyle(.secondary)
        }
    }
}
