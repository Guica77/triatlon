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
    func purchase(_ product: Product) async {
        do { let result = try await product.purchase(); if case .success(let verification) = result, case .verified(let transaction) = verification { await transaction.finish(); state = .idle } }
        catch { state = .failed("No se ha completado la compra. Inténtalo de nuevo.") }
    }
}

struct NativeSubscriptionStoreView: View {
    @State private var store = SubscriptionStore()
    var body: some View {
        List {
            Section { Text("7 días gratis · no se cobra hoy").font(.headline); Text("La suscripción se gestiona de forma segura con tu Apple ID. Puedes restaurarla desde Ajustes de App Store.").font(.footnote).foregroundStyle(.secondary) }
            Section("Elige tu plan") {
                ForEach(store.products, id: \.id) { product in
                    Button { Task { await store.purchase(product) } } label: { VStack(alignment: .leading, spacing: 4) { Text(product.displayName).foregroundStyle(.primary); Text(product.displayPrice + " · mensual").font(.footnote).foregroundStyle(.secondary) } }
                }
            }
            if case .loading = store.state { ProgressView("Consultando App Store…") }
            if case .failed(let message) = store.state { ContentUnavailableView("Pago no disponible", systemImage: "creditcard.trianglebadge.exclamationmark", description: Text(message)) }
        }
        .navigationTitle("Suscripción")
        .task { await store.load() }
    }
}
