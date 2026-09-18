import Observation
import StoreKit
import SwiftUI

@MainActor
@Observable final class SubscriptionStore {
    enum State: Equatable { case idle, loading, purchasing, restoring, failed(String) }

    var state: State = .idle
    private(set) var products: [Product] = []
    private(set) var purchasedProductIDs = Set<String>()
    private(set) var introEligibleProductIDs = Set<String>()
    private let identifiers = ["com.triwavex.athlete.monthly", "com.triwavex.coach.monthly"]

    func load() async {
        state = .loading
        do {
            products = try await Product.products(for: identifiers).sorted { $0.price < $1.price }
            await refreshEntitlements()
            await refreshIntroEligibility()
            state = .idle
        } catch {
            state = .failed("No se han podido consultar las opciones de App Store.")
        }
    }

    func purchase(_ product: Product) async -> Bool {
        state = .purchasing
        do {
            switch try await product.purchase() {
            case .success(let verification):
                guard case .verified(let transaction) = verification else {
                    state = .failed("Apple no ha podido verificar esta compra.")
                    return false
                }
                purchasedProductIDs.insert(transaction.productID)
                await transaction.finish()
                state = .idle
                return true
            case .pending:
                state = .failed("La compra está pendiente de aprobación. Tu acceso se activará cuando Apple la confirme.")
                return false
            case .userCancelled:
                state = .idle
                return false
            @unknown default:
                state = .failed("No se ha podido completar la compra.")
                return false
            }
        } catch {
            state = .failed("No se ha completado la compra. Inténtalo de nuevo.")
            return false
        }
    }

    func restore(expectedProductID: String) async -> Bool {
        state = .restoring
        do {
            try await AppStore.sync()
            await refreshEntitlements()
            state = .idle
            return purchasedProductIDs.contains(expectedProductID)
        } catch {
            state = .failed("No se han podido restaurar tus compras. Comprueba tu conexión e inténtalo de nuevo.")
            return false
        }
    }

    func observeTransactions() async {
        for await result in Transaction.updates {
            guard case .verified(let transaction) = result else { continue }
            await refreshEntitlements()
            await transaction.finish()
        }
    }

    private func refreshEntitlements() async {
        var active = Set<String>()
        for await result in Transaction.currentEntitlements {
            guard case .verified(let transaction) = result, transaction.revocationDate == nil else { continue }
            active.insert(transaction.productID)
        }
        purchasedProductIDs = active
    }

    private func refreshIntroEligibility() async {
        var eligible = Set<String>()
        for product in products {
            guard let subscription = product.subscription,
                  subscription.introductoryOffer?.paymentMode == .freeTrial,
                  await subscription.isEligibleForIntroOffer else { continue }
            eligible.insert(product.id)
        }
        introEligibleProductIDs = eligible
    }
}

struct NativeSubscriptionStoreView: View {
    let role: String
    let onFinished: () -> Void
    let onPurchased: () -> Void

    @State private var store = SubscriptionStore()
    @State private var restoredMessage: String?

    private let privacyURL = URL(string: "https://app.triwavex.com/legal/privacidad")!
    private let termsURL = URL(string: "https://app.triwavex.com/legal/terminos")!
    private let subscriptionsURL = URL(string: "https://apps.apple.com/account/subscriptions")!

    private var productIdentifier: String {
        role == "coach" ? "com.triwavex.coach.monthly" : "com.triwavex.athlete.monthly"
    }

    private var selectedProduct: Product? {
        store.products.first { $0.id == productIdentifier }
    }

    init(role: String = "athlete", onFinished: @escaping () -> Void = {}, onPurchased: (() -> Void)? = nil) {
        self.role = role
        self.onFinished = onFinished
        self.onPurchased = onPurchased ?? onFinished
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                header
                if let product = selectedProduct {
                    planCard(product)
                    purchaseButton(product)
                } else if !isBusy {
                    unavailableState
                }
                supportActions
                legalCopy
            }
            .padding(20)
            .frame(maxWidth: TriWaveXMetrics.contentMaximumWidth, alignment: .leading)
            .frame(maxWidth: .infinity)
        }
        .background(Color(uiColor: .systemGroupedBackground))
        .navigationBarTitleDisplayMode(.inline)
        .navigationTitle("Suscripción")
        .overlay { if isBusy { loadingOverlay } }
        .task { await store.load() }
        .task { await store.observeTransactions() }
        .alert("Compras restauradas", isPresented: Binding(
            get: { restoredMessage != nil },
            set: { if !$0 { restoredMessage = nil } }
        )) {
            Button("Aceptar") { restoredMessage = nil }
        } message: {
            Text(restoredMessage ?? "")
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 10) {
            Image(systemName: role == "coach" ? "person.2.badge.gearshape.fill" : "figure.run.circle.fill")
                .font(.system(size: 42, weight: .semibold))
                .foregroundStyle(Color.triWaveXAqua)
                .accessibilityHidden(true)
            Text(role == "coach" ? "Entrena a tu equipo" : "Tu plan está listo")
                .font(.largeTitle.bold())
                .tracking(-0.6)
            Text(role == "coach"
                 ? "Organiza hasta 10 atletas, comparte sesiones y sigue su evolución desde un solo lugar."
                 : "Sigue tu semana, registra cada sesión y adapta el plan con tus datos reales.")
                .foregroundStyle(.secondary)
        }
    }

    private func planCard(_ product: Product) -> some View {
        let eligible = store.introEligibleProductIDs.contains(product.id)
        return TriWaveXSurface {
            VStack(alignment: .leading, spacing: 14) {
                HStack(alignment: .firstTextBaseline) {
                    Text(role == "coach" ? "Entrenador" : "Atleta").font(.title3.bold())
                    Spacer()
                    if eligible {
                        Text("7 días gratis")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(Color.triWaveXAqua)
                            .padding(.horizontal, 10).padding(.vertical, 5)
                            .background(Color.triWaveXAqua.opacity(0.12), in: Capsule())
                    }
                }
                Text("\(product.displayPrice) al mes").font(.title2.bold().monospacedDigit())
                Divider()
                benefit("checkmark.circle.fill", role == "coach" ? "10 atletas incluidos" : "Plan adaptado a tu progreso")
                benefit("arrow.triangle.2.circlepath", "Renovación mensual hasta que canceles")
                benefit("iphone.and.arrow.forward", "Disponible con tu Apple ID en tus dispositivos")
                if role == "coach" {
                    Text("Las ampliaciones de capacidad se mostrarán antes de confirmar cualquier cargo adicional.")
                        .font(.footnote).foregroundStyle(.secondary)
                }
            }
        }
    }

    private func benefit(_ systemImage: String, _ text: String) -> some View {
        Label(text, systemImage: systemImage).font(.subheadline).symbolRenderingMode(.hierarchical)
    }

    private func purchaseButton(_ product: Product) -> some View {
        let eligible = store.introEligibleProductIDs.contains(product.id)
        let alreadyPurchased = store.purchasedProductIDs.contains(product.id)
        return Button {
            Task {
                if alreadyPurchased {
                    onPurchased()
                } else if await store.purchase(product) {
                    onPurchased()
                }
            }
        } label: {
            Text(alreadyPurchased ? "Continuar con mi suscripción" : eligible ? "Empezar 7 días gratis" : "Suscribirme por \(product.displayPrice)/mes")
        }
        .buttonStyle(TriWaveXPrimaryButtonStyle(tint: .triWaveXAqua))
        .disabled(isBusy)
        .accessibilityHint(eligible ? "Apple mostrará la confirmación. No se cobra durante la prueba gratuita." : "Apple mostrará el precio antes de confirmar.")
    }

    private var supportActions: some View {
        VStack(spacing: 4) {
            Button("Restaurar compras") {
                Task {
                    let restored = await store.restore(expectedProductID: productIdentifier)
                    if restored {
                        restoredMessage = "Tu suscripción está activa en este dispositivo."
                        onPurchased()
                    } else if case .idle = store.state {
                        restoredMessage = "No hemos encontrado una suscripción activa para este plan."
                    }
                }
            }
            .buttonStyle(TriWaveXTextButtonStyle(tint: .triWaveXAqua))
            .disabled(isBusy)
            Link("Gestionar suscripción con Apple", destination: subscriptionsURL)
                .font(.footnote.weight(.semibold))
                .frame(minHeight: TriWaveXMetrics.minimumTouchTarget)
        }
        .frame(maxWidth: .infinity)
    }

    private var legalCopy: some View {
        VStack(alignment: .leading, spacing: 9) {
            Text("El pago se cargará a tu Apple ID al confirmar. La suscripción se renueva automáticamente cada mes salvo que la canceles al menos 24 horas antes de la renovación. Puedes gestionarla en los ajustes de tu cuenta de Apple.")
            HStack(spacing: 18) {
                Link("Términos de uso", destination: termsURL)
                Link("Privacidad", destination: privacyURL)
            }
        }
        .font(.caption).foregroundStyle(.secondary).tint(Color.triWaveXAqua)
    }

    private var unavailableState: some View {
        ContentUnavailableView {
            Label("Plan no disponible", systemImage: "creditcard.trianglebadge.exclamationmark")
        } description: {
            Text(failureMessage ?? "Vuelve a intentarlo cuando tengas conexión con App Store.")
        } actions: {
            Button("Reintentar") { Task { await store.load() } }
        }
    }

    private var loadingOverlay: some View {
        ZStack {
            Color.black.opacity(0.08).ignoresSafeArea()
            ProgressView(loadingMessage)
                .padding(.horizontal, 22).padding(.vertical, 16)
                .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        }
        .accessibilityElement(children: .combine)
    }

    private var isBusy: Bool {
        switch store.state { case .loading, .purchasing, .restoring: true; default: false }
    }

    private var loadingMessage: String {
        switch store.state {
        case .purchasing: "Confirmando con Apple…"
        case .restoring: "Restaurando compras…"
        default: "Consultando App Store…"
        }
    }

    private var failureMessage: String? {
        if case .failed(let message) = store.state { return message }
        return nil
    }
}
