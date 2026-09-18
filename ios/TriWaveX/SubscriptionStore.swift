import StoreKit
import SwiftUI
import Observation

@MainActor
@Observable final class SubscriptionStore {
    enum State { case idle, loading, failed(String) }
    var state: State = .idle
    private(set) var products: [Product] = []
    private let identifiers = ["com.triwavex.athlete.monthly", "com.triwavex.coach.monthly"]

    func load() async {
        state = .loading
        do { products = try await Product.products(for: identifiers); state = .idle }
        catch { state = .failed("No se han podido consultar las opciones de App Store.") }
    }
    func purchase(_ product: Product) async -> Bool {
        do {
            let result = try await product.purchase()
            if case .success(let verification) = result, case .verified(let transaction) = verification {
                await transaction.finish()
                state = .idle
                return true
            }
            if case .userCancelled = result { state = .idle; return false }
            state = .failed("No se ha podido verificar la compra.")
            return false
        } catch {
            state = .failed("No se ha completado la compra. Inténtalo de nuevo.")
            return false
        }
    }
}

struct NativeSubscriptionStoreView: View {
    let role: String
    let onFinished: () -> Void
    let onPurchased: () -> Void
    @State private var store = SubscriptionStore()
    private var productIdentifier: String { role == "coach" ? "com.triwavex.coach.monthly" : "com.triwavex.athlete.monthly" }

    init(
        role: String = "athlete",
        onFinished: @escaping () -> Void = {},
        onPurchased: (() -> Void)? = nil
    ) {
        self.role = role
        self.onFinished = onFinished
        self.onPurchased = onPurchased ?? onFinished
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Image(systemName: "checkmark.seal.fill").font(.system(size: 40)).foregroundStyle(Color.triWaveXAqua)
                Text("Tu plan está listo").font(.largeTitle.bold())
                Text("Empieza con 7 días gratis. Apple gestiona el pago y podrás cancelarlo desde Ajustes cuando quieras.").foregroundStyle(.secondary)
                ForEach(store.products.filter { $0.id == productIdentifier }, id: \.id) { product in
                    TriWaveXSurface {
                        VStack(alignment: .leading, spacing: 10) {
                            Text(role == "coach" ? "Entrenador" : "Atleta").font(.title3.bold())
                            Text(product.displayPrice + " al mes después de la prueba").foregroundStyle(.secondary)
                            Button("Empezar prueba gratuita") { Task { if await store.purchase(product) { onPurchased() } } }
                                .buttonStyle(.borderedProminent).controlSize(.large).frame(maxWidth: .infinity)
                        }
                    }
                }
                if store.products.filter({ $0.id == productIdentifier }).isEmpty, !isLoading {
                    ContentUnavailableView("Plan no disponible", systemImage: "creditcard.trianglebadge.exclamationmark", description: Text("Vuelve a intentarlo cuando tengas conexión con App Store."))
                }
                Button("Continuar y activar más tarde", action: onFinished).buttonStyle(.borderless).frame(maxWidth: .infinity)
                    .accessibilityHint("Podrás activar o cambiar tu plan desde Perfil")
            }
            .padding(20).frame(maxWidth: TriWaveXMetrics.contentMaximumWidth, alignment: .leading).frame(maxWidth: .infinity)
        }
        .background(Color(uiColor: .systemGroupedBackground))
        .navigationBarTitleDisplayMode(.inline)
        .navigationTitle("Prueba gratuita")
        .overlay(alignment: .center) {
            if case .loading = store.state { ProgressView("Consultando App Store…") }
            if case .failed(let message) = store.state { ContentUnavailableView("Pago no disponible", systemImage: "creditcard.trianglebadge.exclamationmark", description: Text(message)).background(.regularMaterial) }
        }
        .task { await store.load() }
    }

    private var isLoading: Bool { if case .loading = store.state { true } else { false } }
}
