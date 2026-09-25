import Foundation
import PhotosUI
import StoreKit
import SwiftUI
import UniformTypeIdentifiers
import UIKit
import WebKit

private struct NativeRaceDiscountResponse: Decodable {
    let request: NativeRaceDiscountRequest?
}

private struct NativeRaceDiscountRequest: Decodable, Identifiable, Equatable {
    let id: String
    let raceName: String
    let raceDate: String?
    let status: String
    let reviewNote: String?
    let appleOfferCode: String?
    let createdAt: String
    let reviewedAt: String?
}

private struct NativeRaceDiscountSubmission: Decodable {
    let submitted: Bool
}

private struct NativeRaceDiscountProof {
    let data: Data
    let fileName: String
    let contentType: String
}

@MainActor
@Observable private final class NativeRaceDiscountModel {
    enum State: Equatable {
        case idle
        case loading
        case submitting
        case loaded(NativeRaceDiscountRequest?)
        case failed(String)
    }

    var state: State = .idle
    var submissionError: String?
    private let client: NativeRaceDiscountClient

    init(client: NativeRaceDiscountClient) { self.client = client }

    func load() async {
        guard state != .loading, state != .submitting else { return }
        state = .loading
        do { state = .loaded(try await client.fetch()) }
        catch { state = .failed(error.localizedDescription) }
    }

    func submit(raceName: String, raceDate: Date?, proof: NativeRaceDiscountProof) async -> Bool {
        guard state != .submitting else { return false }
        let previousRequest: NativeRaceDiscountRequest? = if case .loaded(let request) = state { request } else { nil }
        submissionError = nil
        state = .submitting
        do {
            try await client.submit(raceName: raceName, raceDate: raceDate, proof: proof)
            state = .loaded(try await client.fetch())
            return true
        } catch {
            state = .loaded(previousRequest)
            submissionError = error.localizedDescription
            return false
        }
    }
}

private struct NativeRaceDiscountClient {
    enum ClientError: LocalizedError {
        case invalidURL
        case request(String)

        var errorDescription: String? {
            switch self {
            case .invalidURL: "No se ha podido conectar de forma segura con TriWaveX."
            case .request(let message): message
            }
        }
    }

    let origin: URL
    let websiteDataStore: WKWebsiteDataStore

    func fetch() async throws -> NativeRaceDiscountRequest? {
        let (data, _) = try await perform(path: "/api/native/athlete/race-discount", method: "GET")
        return try JSONDecoder().decode(NativeRaceDiscountResponse.self, from: data).request
    }

    func submit(raceName: String, raceDate: Date?, proof: NativeRaceDiscountProof) async throws {
        let boundary = "TriWaveX-\(UUID().uuidString)"
        var body = Data()
        appendField("raceName", value: raceName.trimmingCharacters(in: .whitespacesAndNewlines), boundary: boundary, to: &body)
        appendField("raceDate", value: raceDate.map(Self.dayString) ?? "", boundary: boundary, to: &body)
        body.append(Data("--\(boundary)\r\nContent-Disposition: form-data; name=\"proof\"; filename=\"\(proof.fileName)\"\r\nContent-Type: \(proof.contentType)\r\n\r\n".utf8))
        body.append(proof.data)
        body.append(Data("\r\n--\(boundary)--\r\n".utf8))
        let (_, _) = try await perform(path: "/api/native/athlete/race-discount", method: "POST", contentType: "multipart/form-data; boundary=\(boundary)", body: body)
    }

    private func perform(path: String, method: String, contentType: String? = nil, body: Data? = nil) async throws -> (Data, HTTPURLResponse) {
        guard Configuration.allows(origin, origin: origin),
              let url = URL(string: path, relativeTo: origin)?.absoluteURL,
              Configuration.allows(url, origin: origin) else { throw ClientError.invalidURL }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.timeoutInterval = 45
        request.httpShouldHandleCookies = false
        request.setValue("1", forHTTPHeaderField: "X-TriWaveX-Native")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let contentType { request.setValue(contentType, forHTTPHeaderField: "Content-Type") }
        request.httpBody = body
        if let cookie = await cookieHeader(for: url) { request.setValue(cookie, forHTTPHeaderField: "Cookie") }

        let configuration = URLSessionConfiguration.ephemeral
        configuration.httpShouldSetCookies = false
        let session = URLSession(configuration: configuration, delegate: NoRedirects(), delegateQueue: nil)
        defer { session.invalidateAndCancel() }
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse,
              Configuration.allows(http.url ?? url, origin: origin) else { throw ClientError.invalidURL }
        guard (200..<300).contains(http.statusCode) else {
            let message = (try? JSONDecoder().decode(NativeRaceDiscountError.self, from: data).error)
                ?? "No se ha podido completar la solicitud. Inténtalo de nuevo."
            throw ClientError.request(message)
        }
        await persistCookies(from: http, for: url)
        return (data, http)
    }

    private func cookieHeader(for url: URL) async -> String? {
        guard let host = url.host?.lowercased(), let scheme = url.scheme?.lowercased() else { return nil }
        let cookies = await withCheckedContinuation { continuation in
            websiteDataStore.httpCookieStore.getAllCookies { continuation.resume(returning: $0) }
        }
        let now = Date()
        let matching = cookies.filter { cookie in
            let domain = cookie.domain.trimmingCharacters(in: CharacterSet(charactersIn: ".")).lowercased()
            return (cookie.expiresDate.map { $0 > now } ?? true) && (!cookie.isSecure || scheme == "https") &&
                (host == domain || host.hasSuffix(".\(domain)")) && !cookie.name.contains(";") && !cookie.value.contains(";")
        }
        return matching.isEmpty ? nil : matching.map { "\($0.name)=\($0.value)" }.joined(separator: "; ")
    }

    private func persistCookies(from response: HTTPURLResponse, for url: URL) async {
        let fields = response.allHeaderFields.reduce(into: [String: String]()) { result, item in
            if let key = item.key as? String, let value = item.value as? String { result[key] = value }
        }
        for cookie in HTTPCookie.cookies(withResponseHeaderFields: fields, for: url) {
            await websiteDataStore.httpCookieStore.setCookie(cookie)
            HTTPCookieStorage.shared.setCookie(cookie)
        }
    }

    private func appendField(_ name: String, value: String, boundary: String, to data: inout Data) {
        data.append(Data("--\(boundary)\r\nContent-Disposition: form-data; name=\"\(name)\"\r\n\r\n\(value)\r\n".utf8))
    }

    private static func dayString(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }
}

private struct NativeRaceDiscountError: Decodable { let error: String }

struct NativeRaceDiscountView: View {
    let origin: URL
    let websiteDataStore: WKWebsiteDataStore
    let expectedUserID: String
    let onSubscriptionFinished: ((NativeSubscriptionResult) -> Void)?

    @State private var model: NativeRaceDiscountModel
    @State private var subscriptionStore: SubscriptionStore
    @State private var raceName = ""
    @State private var raceDate = Date()
    @State private var includesRaceDate = true
    @State private var selectedPhoto: PhotosPickerItem?
    @State private var proof: NativeRaceDiscountProof?
    @State private var showingPDFPicker = false
    @State private var showingOfferCodeRedemption = false
    @State private var alertMessage: String?
    @State private var isPreparingPhoto = false

    init(origin: URL, websiteDataStore: WKWebsiteDataStore, expectedUserID: String, onSubscriptionFinished: ((NativeSubscriptionResult) -> Void)?) {
        self.origin = origin
        self.websiteDataStore = websiteDataStore
        self.expectedUserID = expectedUserID
        self.onSubscriptionFinished = onSubscriptionFinished
        _model = State(initialValue: NativeRaceDiscountModel(client: NativeRaceDiscountClient(origin: origin, websiteDataStore: websiteDataStore)))
        _subscriptionStore = State(initialValue: SubscriptionStore(origin: origin, store: websiteDataStore, expectedUserID: expectedUserID, expectedRole: "athlete"))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                introduction
                switch model.state {
                case .idle, .loading:
                    ProgressView("Cargando tus solicitudes…").frame(maxWidth: .infinity, minHeight: 100)
                case .submitting:
                    ProgressView("Enviando solicitud de forma segura…").frame(maxWidth: .infinity, minHeight: 100)
                case .failed(let message):
                    errorCard(message)
                case .loaded(let request):
                    if let request { requestCard(request) }
                    if request?.status != "pending" { applicationForm }
                }
            }
            .padding(20)
            .frame(maxWidth: TriWaveXMetrics.contentMaximumWidth, alignment: .leading)
            .frame(maxWidth: .infinity)
        }
        .background(Color(uiColor: .systemGroupedBackground))
        .navigationTitle("Descuento por carrera")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await model.load()
            await subscriptionStore.observeTransactions { result in
                if let result {
                    alertMessage = "Apple ha confirmado la suscripción. Tu plan se ha actualizado."
                    onSubscriptionFinished?(result)
                } else {
                    alertMessage = "Apple aceptó el código, pero no se pudo confirmar el plan en esta cuenta. Contacta con soporte antes de volver a canjearlo."
                }
            }
        }
        .refreshable { await model.load() }
        .fileImporter(isPresented: $showingPDFPicker, allowedContentTypes: [.pdf], allowsMultipleSelection: false) { result in
            loadPDF(result)
        }
        .onChange(of: selectedPhoto) { _, photo in
            guard let photo else { return }
            Task { await loadPhoto(photo) }
        }
        .alert("Descuento por carrera", isPresented: Binding(get: { alertMessage != nil }, set: { if !$0 { alertMessage = nil } })) {
            Button("Aceptar") { alertMessage = nil }
        } message: { Text(alertMessage ?? "") }
        .offerCodeRedemption(isPresented: $showingOfferCodeRedemption) { result in
            if case .failure = result {
                alertMessage = "Apple no ha podido canjear el código. Comprueba que siga activo y vuelve a intentarlo."
            }
        }
    }

    private var introduction: some View {
        VStack(alignment: .leading, spacing: 12) {
            Image(systemName: "medal.star")
                .font(.system(size: 38, weight: .semibold))
                .foregroundStyle(Color.triWaveXAqua)
                .accessibilityHidden(true)
            Text("Corre tu próxima carrera con TriWaveX")
                .font(.largeTitle.bold())
                .tracking(-0.5)
            Text("Si ya estás inscrito en una competición, puedes solicitar un 25% de descuento durante un mes en el plan de atleta.")
                .foregroundStyle(.secondary)
            Label("Revisamos la inscripción antes de aprobarla", systemImage: "checkmark.shield")
                .font(.subheadline.weight(.medium))
                .foregroundStyle(Color.triWaveXAqua)
            Text("La solicitud no activa una suscripción. Si se aprueba, recibirás un código real de Apple, de un solo uso, que canjearás en la hoja oficial de App Store.")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.triWaveXSurface, in: RoundedRectangle(cornerRadius: TriWaveXMetrics.cardRadius, style: .continuous))
    }

    private var applicationForm: some View {
        let compactControlHeight = TriWaveXMetrics.compactControlHeight
        return VStack(alignment: .leading, spacing: 16) {
            Text("Solicitar descuento")
                .font(.title2.bold())
            TextField("Nombre de la carrera", text: $raceName)
                .textContentType(.none)
                .textInputAutocapitalization(.words)
                .autocorrectionDisabled(false)
                .padding(14)
                .background(Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                .accessibilityLabel("Nombre de la carrera")

            Toggle("Incluir fecha de la carrera", isOn: $includesRaceDate)
            if includesRaceDate {
                DatePicker("Fecha", selection: $raceDate, displayedComponents: .date)
                    .datePickerStyle(.compact)
            }

            VStack(alignment: .leading, spacing: 10) {
                Text("Justificante de inscripción").font(.headline)
                Text("Adjunta una captura o un PDF. El justificante se guarda de forma privada para verificar la solicitud. Máximo 4 MB.")
                    .font(.footnote).foregroundStyle(.secondary)
                PhotosPicker(selection: $selectedPhoto, matching: .images, photoLibrary: .shared()) {
                    Label("Elegir foto", systemImage: "photo")
                        .frame(maxWidth: .infinity, minHeight: compactControlHeight)
                }
                .buttonStyle(TriWaveXSecondaryButtonStyle())
                Button { showingPDFPicker = true } label: {
                    Label("Elegir PDF", systemImage: "doc")
                        .frame(maxWidth: .infinity, minHeight: TriWaveXMetrics.compactControlHeight)
                }
                .buttonStyle(TriWaveXSecondaryButtonStyle())
                if isPreparingPhoto { ProgressView("Preparando imagen…") }
                if let proof {
                    Label(proof.fileName, systemImage: proof.contentType == "application/pdf" ? "doc.fill" : "photo.fill")
                        .font(.footnote.weight(.medium))
                        .lineLimit(1)
                        .accessibilityLabel("Justificante seleccionado: \(proof.fileName)")
                }
            }
            Button(action: submit) {
                if isBusy { ProgressView().frame(maxWidth: .infinity, minHeight: TriWaveXMetrics.controlHeight) }
                else { Text("Enviar para revisión").frame(maxWidth: .infinity, minHeight: TriWaveXMetrics.controlHeight) }
            }
            .buttonStyle(TriWaveXPrimaryButtonStyle(tint: Color.triWaveXAqua))
            .disabled(!canSubmit)
            .opacity(canSubmit ? 1 : 0.55)
            .accessibilityHint("Envía la carrera y el comprobante al equipo de revisión")
        }
        .padding(18)
        .background(Color.triWaveXSurface, in: RoundedRectangle(cornerRadius: TriWaveXMetrics.cardRadius, style: .continuous))
    }

    private func requestCard(_ request: NativeRaceDiscountRequest) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Tu solicitud").font(.title3.bold())
                Spacer()
                statusBadge(request.status)
            }
            Text(request.raceName).font(.headline)
            if let date = request.raceDate, !date.isEmpty { Label(date, systemImage: "calendar").font(.subheadline).foregroundStyle(.secondary) }
            switch request.status {
            case "pending":
                Text("Estamos comprobando tu inscripción. Te avisaremos cuando haya una resolución.")
                    .font(.subheadline).foregroundStyle(.secondary)
            case "rejected":
                Text(request.reviewNote ?? "No se pudo verificar el justificante. Puedes corregirlo y volver a solicitarlo.")
                    .font(.subheadline).foregroundStyle(.secondary)
            case "approved":
                approvedCode(request.appleOfferCode)
            default:
                Text("Estado de revisión no disponible.").font(.subheadline).foregroundStyle(.secondary)
            }
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.triWaveXSurface, in: RoundedRectangle(cornerRadius: TriWaveXMetrics.cardRadius, style: .continuous))
    }

    @ViewBuilder
    private func approvedCode(_ code: String?) -> some View {
        if let code, !code.isEmpty {
            Text("Solicitud aprobada: código de Apple válido para el descuento indicado durante un mes.")
                .font(.subheadline).foregroundStyle(.secondary)
            Text(code)
                .font(.title3.monospaced().weight(.semibold))
                .textSelection(.enabled)
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            Button {
                UIPasteboard.general.string = code
                showingOfferCodeRedemption = true
            } label: {
                Label("Copiar código y canjear en Apple", systemImage: "apple.logo")
                    .frame(maxWidth: .infinity, minHeight: TriWaveXMetrics.controlHeight)
            }
            .buttonStyle(TriWaveXPrimaryButtonStyle(tint: Color.triWaveXAqua))
            Text("La hoja de Apple no recibe el código automáticamente: pégalo allí. El acceso solo se activa cuando Apple confirma el canje.")
                .font(.footnote).foregroundStyle(.secondary)
        } else {
            Text("La solicitud figura aprobada, pero el código de Apple aún no está disponible. Contacta con soporte; no se ha generado ningún código ficticio.")
                .font(.subheadline).foregroundStyle(.secondary)
        }
    }

    private func statusBadge(_ status: String) -> some View {
        let (title, color): (String, Color) = switch status {
        case "pending": ("En revisión", .orange)
        case "approved": ("Aprobada", .green)
        case "rejected": ("Necesita cambios", .red)
        default: ("Estado", .secondary)
        }
        return Text(title)
            .font(.caption.weight(.semibold))
            .foregroundStyle(color)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(color.opacity(0.12), in: Capsule())
            .accessibilityLabel("Estado: \(title)")
    }

    private func errorCard(_ message: String) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("No se ha podido cargar", systemImage: "wifi.exclamationmark").font(.headline)
            Text(message).font(.subheadline).foregroundStyle(.secondary)
            Button("Reintentar") { Task { await model.load() } }
                .buttonStyle(TriWaveXSecondaryButtonStyle())
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.triWaveXSurface, in: RoundedRectangle(cornerRadius: TriWaveXMetrics.cardRadius, style: .continuous))
    }

    private var isBusy: Bool { if case .submitting = model.state { return true }; return false }
    private var canSubmit: Bool {
        guard !isBusy, !isPreparingPhoto, let proof,
              (2...120).contains(raceName.trimmingCharacters(in: .whitespacesAndNewlines).count),
              proof.data.count <= 4 * 1024 * 1024 else { return false }
        return true
    }

    private func submit() {
        guard let proof else { return }
        Task {
            let success = await model.submit(raceName: raceName, raceDate: includesRaceDate ? raceDate : nil, proof: proof)
            if success {
                self.proof = nil
                selectedPhoto = nil
                alertMessage = "Solicitud enviada. Podrás seguir su estado desde esta pantalla."
            } else {
                alertMessage = model.submissionError ?? "No se ha podido enviar la solicitud. Inténtalo de nuevo."
            }
        }
    }

    private func loadPDF(_ result: Result<[URL], Error>) {
        do {
            guard let url = try result.get().first else { return }
            let hasAccess = url.startAccessingSecurityScopedResource()
            defer { if hasAccess { url.stopAccessingSecurityScopedResource() } }
            let data = try Data(contentsOf: url, options: .mappedIfSafe)
            guard data.count <= 4 * 1024 * 1024 else {
                alertMessage = "El PDF supera el límite de 4 MB. Elige un archivo más pequeño."
                return
            }
            proof = NativeRaceDiscountProof(data: data, fileName: "justificante.pdf", contentType: "application/pdf")
            selectedPhoto = nil
        } catch {
            alertMessage = "No se ha podido leer el PDF seleccionado. Inténtalo de nuevo."
        }
    }

    private func loadPhoto(_ item: PhotosPickerItem) async {
        isPreparingPhoto = true
        defer { isPreparingPhoto = false }
        do {
            guard let sourceData = try await item.loadTransferable(type: Data.self),
                  let image = UIImage(data: sourceData),
                  let jpeg = image.jpegData(compressionQuality: 0.78),
                  jpeg.count <= 4 * 1024 * 1024 else {
                alertMessage = "No se ha podido preparar la foto dentro del límite de 4 MB. Prueba con una imagen más pequeña."
                return
            }
            proof = NativeRaceDiscountProof(data: jpeg, fileName: "inscripcion.jpg", contentType: "image/jpeg")
        } catch {
            alertMessage = "No se ha podido leer la foto seleccionada. Inténtalo de nuevo."
        }
    }
}
