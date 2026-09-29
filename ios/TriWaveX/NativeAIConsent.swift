import Foundation
import Observation
import SwiftUI
import WebKit

/// The server blocks every AI request until the athlete explicitly allows
/// sending their data to the listed providers (App Review 5.1.2(i)).
struct NativeAIConsentState: Decodable, Equatable, Sendable {
    let available: Bool
    let providers: [String]
    let models: [String]
    let version: String
    let granted: Bool
}

struct NativeAIConsentClient {
    let origin: URL
    let store: WKWebsiteDataStore

    func fetch() async throws -> NativeAIConsentState {
        try await request(method: "GET", body: nil)
    }

    func decide(granted: Bool, version: String) async throws -> NativeAIConsentState {
        try await request(method: "POST", body: try JSONSerialization.data(withJSONObject: ["granted": granted, "version": version]))
    }

    private func request(method: String, body: Data?) async throws -> NativeAIConsentState {
        guard Configuration.allows(origin, origin: origin),
              let url = URL(string: "/api/native/ai-consent", relativeTo: origin)?.absoluteURL,
              Configuration.allows(url, origin: origin) else { throw URLError(.badURL) }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.httpBody = body
        request.timeoutInterval = 30
        request.httpShouldHandleCookies = false
        request.setValue("1", forHTTPHeaderField: "X-TriWaveX-Native")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if body != nil { request.setValue("application/json", forHTTPHeaderField: "Content-Type") }
        if let cookie = await NativeCookieJar.header(for: url, in: store) { request.setValue(cookie, forHTTPHeaderField: "Cookie") }
        let session = NativeCookieJar.makeSession()
        defer { session.finishTasksAndInvalidate() }
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw URLError(.badServerResponse) }
        await NativeCookieJar.persist(from: http, for: url, in: store)
        guard http.statusCode == 200 else {
            if http.statusCode == 401 { throw NativeProfileError.unauthorized }
            if let message = (try? JSONSerialization.jsonObject(with: data) as? [String: Any])?["error"] as? String, !message.isEmpty {
                throw NativeProfileError.message(message)
            }
            throw URLError(.badServerResponse)
        }
        return try JSONDecoder().decode(NativeAIConsentState.self, from: data)
    }
}

@MainActor @Observable
final class NativeAIConsentModel {
    private let client: NativeAIConsentClient
    private let userID: String?
    private let defaults: UserDefaults
    private(set) var state: NativeAIConsentState?
    private(set) var loading = false
    private(set) var saving = false
    var error: String?

    init(client: NativeAIConsentClient, userID: String?, defaults: UserDefaults = .standard) {
        self.client = client
        self.userID = userID
        self.defaults = defaults
    }

    func load() async {
        guard !loading else { return }
        loading = true
        error = nil
        defer { loading = false }
        do { state = try await client.fetch() }
        catch { self.error = (error as? LocalizedError)?.errorDescription ?? "No se ha podido cargar tu permiso de IA." }
    }

    @discardableResult
    func decide(granted: Bool) async -> Bool {
        guard let version = state?.version, !saving else { return false }
        saving = true
        error = nil
        defer { saving = false }
        do {
            state = try await client.decide(granted: granted, version: version)
            markAsked()
            return true
        } catch {
            self.error = (error as? LocalizedError)?.errorDescription ?? "No se ha podido guardar tu decisión. Inténtalo de nuevo."
            // The provider list may have changed; show the current one.
            if case NativeProfileError.message = error { await load() }
            return false
        }
    }

    /// Ask once per disclosure version; a new provider list asks again.
    var shouldPrompt: Bool {
        guard let state, state.available, !state.granted, let key = askedKey else { return false }
        return defaults.string(forKey: key) != state.version
    }

    func markAsked() {
        guard let key = askedKey, let version = state?.version else { return }
        defaults.set(version, forKey: key)
    }

    private var askedKey: String? {
        guard let userID, !userID.isEmpty else { return nil }
        return "triwavex.aiConsent.askedVersion.\(userID)"
    }
}

struct NativeAIConsentView: View {
    @Bindable var model: NativeAIConsentModel
    let origin: URL
    /// Shown as a first-run prompt: offers "Ahora no" and closes after deciding.
    var isPrompt = false
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        Form {
            Section {
                Label {
                    Text("Tus datos y la inteligencia artificial").font(.headline)
                } icon: {
                    Image(systemName: "sparkles").foregroundStyle(Color.triWaveXAqua)
                }
                Text("Para analizar tus actividades, ajustar tu plan y responder tus consultas, TriWaveX puede enviar a proveedores de IA el contexto necesario: entrenamientos, recuperación, lesiones y preferencias de nutrición.")
                    .font(.subheadline)
            }

            if let state = model.state {
                if state.available {
                    Section("Proveedores y modelos") {
                        ForEach(state.models, id: \.self) { Text($0).font(.footnote) }
                    }
                } else {
                    Section { Label("No hay proveedores de IA activos ahora mismo. No se enviará ningún dato.", systemImage: "info.circle").font(.footnote) }
                }
                Section {
                    Label(state.granted ? "Permiso activo" : "Sin permiso: no se envían datos a IA",
                          systemImage: state.granted ? "checkmark.shield.fill" : "hand.raised.fill")
                        .foregroundStyle(state.granted ? Color.triWaveXAqua : .secondary)
                    if state.granted {
                        Button("Retirar permiso", role: .destructive) { Task { await model.decide(granted: false) } }
                            .disabled(model.saving)
                    } else if state.available {
                        Button {
                            Task { if await model.decide(granted: true), isPrompt { dismiss() } }
                        } label: {
                            HStack { if model.saving { ProgressView() }; Text("Permitir el uso de IA") }
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(model.saving)
                    }
                    if isPrompt, !state.granted {
                        Button("Ahora no") { model.markAsked(); dismiss() }
                            .frame(maxWidth: .infinity)
                            .disabled(model.saving)
                    }
                } footer: {
                    Text("Es opcional y puedes cambiarlo cuando quieras en Más › Datos e IA. Sin permiso, TriWaveX sigue funcionando con su planificación basada en reglas. El tratamiento puede ocurrir fuera del Espacio Económico Europeo; retirar el permiso bloquea nuevos envíos, pero no borra lo que un proveedor ya haya recibido. Las respuestas pueden contener errores y no sustituyen una valoración profesional.")
                }
            } else if model.loading {
                Section { ProgressView("Cargando…").frame(maxWidth: .infinity) }
            }

            if let error = model.error {
                Section {
                    Label(error, systemImage: "exclamationmark.triangle.fill").foregroundStyle(.red).font(.footnote)
                    if model.state == nil { Button("Reintentar") { Task { await model.load() } } }
                }
            }

            Section {
                Link("Consultar la política de privacidad", destination: origin.appendingPathComponent("legal/privacidad"))
            }
        }
        .navigationTitle("Datos e IA")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if isPrompt {
                ToolbarItem(placement: .cancellationAction) { Button("Cerrar") { model.markAsked(); dismiss() } }
            }
        }
        .task { if model.state == nil { await model.load() } }
    }
}
