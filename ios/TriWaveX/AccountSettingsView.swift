import SwiftUI
import WebKit
import Observation

@MainActor @Observable
final class AccountSettingsModel {
    let origin: URL; let store: WKWebsiteDataStore
    var scheduledFor: String?; var loading = false; var message: String?
    init(origin: URL, store: WKWebsiteDataStore) { self.origin = origin; self.store = store }
    func load() async { guard !loading else { return }; loading = true; defer { loading = false }; do { scheduledFor = try await request(action: nil).deletionScheduledFor } catch { message = "No se ha podido cargar tu cuenta." } }
    func perform(_ action: String) async -> Bool { guard !loading else { return false }; loading = true; defer { loading = false }; do { let result = try await request(action: action); scheduledFor = result.deletionScheduledFor; return true } catch { message = "No se ha podido completar la acción. Inténtalo de nuevo."; return false } }
    private struct Result: Decodable { let deletionScheduledFor: String? }
    private func request(action: String?) async throws -> Result {
        guard Configuration.allows(origin, origin: origin), let url = URL(string: "/api/native/account", relativeTo: origin)?.absoluteURL else { throw URLError(.badURL) }
        var request = URLRequest(url: url); request.httpMethod = action == nil ? "GET" : "POST"; request.timeoutInterval = 30; request.httpShouldHandleCookies = false; request.setValue("1", forHTTPHeaderField: "X-TriWaveX-Native"); request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let action { request.setValue("application/json", forHTTPHeaderField: "Content-Type"); request.httpBody = try JSONEncoder().encode(["action": action]) }
        let cookies = await withCheckedContinuation { continuation in store.httpCookieStore.getAllCookies { continuation.resume(returning: $0) } }
        if !cookies.isEmpty { request.setValue(cookies.map { "\($0.name)=\($0.value)" }.joined(separator: "; "), forHTTPHeaderField: "Cookie") }
        let (data, response) = try await URLSession(configuration: .ephemeral).data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else { throw URLError(.badServerResponse) }
        return try JSONDecoder().decode(Result.self, from: data)
    }
}

struct AccountSettingsView: View {
    @Bindable var model: AccountSettingsModel
    let onSessionEnded: () -> Void
    @State private var showSignOut = false; @State private var showDelete = false; @State private var confirmation = ""
    var body: some View {
        List {
            Section("Sesión") { Button("Cerrar sesión", systemImage: "rectangle.portrait.and.arrow.right", role: .destructive) { showSignOut = true }.disabled(model.loading) }
            Section("Zona de riesgo") {
                if let date = model.scheduledFor { Text("Tu cuenta se eliminará el \(formatted(date)).").foregroundStyle(.secondary); Button("Cancelar eliminación") { Task { _ = await model.perform("cancelDeletion") } }.disabled(model.loading) }
                else { Button("Eliminar cuenta", systemImage: "trash", role: .destructive) { showDelete = true }.disabled(model.loading); Text("Tu perfil, entrenamientos y chats se eliminarán dentro de 30 días. Podrás cancelar la solicitud antes de esa fecha.").font(.footnote).foregroundStyle(.secondary) }
            }
            if let message = model.message { Text(message).foregroundStyle(.red).font(.footnote) }
        }.navigationTitle("Cuenta").task { await model.load() }
        .confirmationDialog("¿Cerrar sesión?", isPresented: $showSignOut, titleVisibility: .visible) { Button("Cerrar sesión", role: .destructive) { Task { if await model.perform("signout") { onSessionEnded() } } }; Button("Cancelar", role: .cancel) {} } message: { Text("Tus datos y entrenamientos se conservarán.") }
        .alert("¿Programar eliminación?", isPresented: $showDelete) { TextField("Escribe ELIMINAR", text: $confirmation); Button("Programar", role: .destructive) { Task { if await model.perform("scheduleDeletion") { onSessionEnded() } } }.disabled(confirmation != "ELIMINAR"); Button("Cancelar", role: .cancel) {} } message: { Text("La cuenta se eliminará dentro de 30 días. Puedes cancelar la solicitud antes de esa fecha.") }
    }
    private func formatted(_ value: String) -> String { guard let date = ISO8601DateFormatter().date(from: value) else { return "30 días" }; return date.formatted(date: .long, time: .omitted) }
}
