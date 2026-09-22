import Foundation
import Observation
import StoreKit
import SwiftUI
import UIKit
import WebKit

enum SubscriptionAccountToken {
    nonisolated static func uuid(for userID: String) -> UUID? {
        UUID(uuidString: userID)
    }
}

struct NativeSubscriptionResult: Decodable, Equatable {
    let accepted: Bool
    let duplicate: Bool
    let status: String
    let destination: String
    let userID: String
    let role: String
    let entitled: Bool
    let transactionID: String

    func authorizes(transactionID: String, expectedUserID: String, expectedRole: String) -> Bool {
        let destinationMatchesRole = (role == "athlete" && ["/dashboard", "/onboarding"].contains(destination)) ||
            (role == "coach" && destination == "/coach/dashboard")
        return (accepted || duplicate) && entitled &&
            self.transactionID == transactionID && userID == expectedUserID &&
            role == expectedRole && destinationMatchesRole
    }
}

struct SubscriptionFinishGate {
    static func finishIfAuthorized(
        _ result: NativeSubscriptionResult?,
        transactionID: String,
        expectedUserID: String,
        expectedRole: String,
        finish: () async -> Void
    ) async -> Bool {
        guard let result,
              result.authorizes(
                  transactionID: transactionID,
                  expectedUserID: expectedUserID,
                  expectedRole: expectedRole
              ) else {
            return false
        }
        await finish()
        return true
    }
}

@MainActor
@Observable final class SubscriptionStore {
    enum State: Equatable { case idle, loading, purchasing, restoring, failed(String) }

    var state: State = .idle
    private(set) var products: [Product] = []
    private(set) var purchasedProductIDs = Set<String>()
    private(set) var introEligibleProductIDs = Set<String>()
    private let identifiers = ["com.triwavex.athlete.monthly", "com.triwavex.coach.monthly"]
    private let transport: NativeEntryTransport
    private let expectedUserID: String
    private let expectedRole: String

    init(origin: URL, store: WKWebsiteDataStore, expectedUserID: String, expectedRole: String) {
        transport = NativeEntryTransport(origin: origin, store: store)
        self.expectedUserID = expectedUserID
        self.expectedRole = expectedRole
    }

    func load() async {
        state = .loading
        do {
            products = try await Product.products(for: identifiers).sorted { $0.price < $1.price }
            await refreshLocalEntitlements()
            await refreshIntroEligibility()
            state = .idle
        } catch {
            state = .failed("No se han podido consultar las opciones de App Store.")
        }
    }

    func purchase(_ product: Product) async -> NativeSubscriptionResult? {
        state = .purchasing
        guard let accountToken = SubscriptionAccountToken.uuid(for: expectedUserID) else {
            state = .failed("No se ha podido asociar esta compra a tu cuenta.")
            return nil
        }
        do {
            switch try await product.purchase(options: [.appAccountToken(accountToken)]) {
            case .success(let verification):
                guard case .verified(let transaction) = verification else {
                    state = .failed("Apple no ha podido verificar esta compra.")
                    return nil
                }
                return await reconcile(transaction, signedTransactionInfo: verification.jwsRepresentation)
            case .pending:
                state = .failed("La compra está pendiente de aprobación. Tu acceso se activará cuando Apple la confirme.")
                return nil
            case .userCancelled:
                state = .idle
                return nil
            @unknown default:
                state = .failed("No se ha podido completar la compra.")
                return nil
            }
        } catch {
            state = .failed("No se ha completado la compra. Inténtalo de nuevo.")
            return nil
        }
    }

    func restore(expectedProductID: String) async -> NativeSubscriptionResult? {
        state = .restoring
        do {
            try await AppStore.sync()
            for await result in StoreKit.Transaction.currentEntitlements {
                guard case .verified(let transaction) = result,
                      transaction.productID == expectedProductID else { continue }
                if let result = await reconcile(transaction, signedTransactionInfo: result.jwsRepresentation) { return result }
            }
            state = .idle
            return nil
        } catch {
            state = .failed("No se han podido restaurar tus compras. Comprueba tu conexión e inténtalo de nuevo.")
            return nil
        }
    }

    func observeTransactions() async {
        for await result in StoreKit.Transaction.updates {
            guard case .verified(let transaction) = result else { continue }
            _ = await reconcile(transaction, signedTransactionInfo: result.jwsRepresentation)
        }
    }

    private func reconcile(_ transaction: StoreKit.Transaction, signedTransactionInfo: String) async -> NativeSubscriptionResult? {
        struct Input: Encodable {
            let signedTransactionInfo: String
            let productID: String
            let transactionID: String
            let originalTransactionID: String
            let appAccountToken: String?
            let eventType: String
        }

        let input = Input(
            signedTransactionInfo: signedTransactionInfo,
            productID: transaction.productID,
            transactionID: String(transaction.id),
            originalTransactionID: String(transaction.originalID),
            appAccountToken: transaction.appAccountToken?.uuidString,
            eventType: transaction.revocationDate == nil ? "SUBSCRIBED" : "REVOKE"
        )

        do {
            let result = try await transport.send("/api/native/apple/transaction", body: input, response: NativeSubscriptionResult.self)
            guard await SubscriptionFinishGate.finishIfAuthorized(
                result,
                transactionID: String(transaction.id),
                expectedUserID: expectedUserID,
                expectedRole: expectedRole,
                finish: { await transaction.finish() }
            ) else {
                state = .failed("El servidor no ha autorizado esta suscripción.")
                return nil
            }
            purchasedProductIDs.insert(transaction.productID)
            state = .idle
            return result
        } catch {
            state = .failed("No se ha podido confirmar la suscripción. Inténtalo de nuevo.")
            return nil
        }
    }

    private func refreshLocalEntitlements() async {
        var active = Set<String>()
        for await result in StoreKit.Transaction.currentEntitlements {
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
    let origin: URL
    let websiteDataStore: WKWebsiteDataStore
    let expectedUserID: String
    let role: String
    let showPlanComparison: Bool
    let onFinished: (NativeSubscriptionResult) -> Void

    @State private var store: SubscriptionStore
    @State private var restoredMessage: String?
    @State private var showingPaymentReview = false

    private let privacyURL = URL(string: "https://app.triwavex.com/legal/privacidad")!
    private let termsURL = URL(string: "https://app.triwavex.com/legal/terminos")!
    private let subscriptionsURL = URL(string: "https://apps.apple.com/account/subscriptions")!

    private var productIdentifier: String {
        role == "coach" ? "com.triwavex.coach.monthly" : "com.triwavex.athlete.monthly"
    }

    private var selectedProduct: Product? {
        store.products.first { $0.id == productIdentifier }
    }

    init(origin: URL, store: WKWebsiteDataStore, expectedUserID: String, role: String, showPlanComparison: Bool = true, onFinished: @escaping (NativeSubscriptionResult) -> Void) {
        self.origin = origin
        self.websiteDataStore = store
        self.expectedUserID = expectedUserID
        self.role = role
        self.showPlanComparison = showPlanComparison
        self.onFinished = onFinished
        _store = State(initialValue: SubscriptionStore(origin: origin, store: store, expectedUserID: expectedUserID, expectedRole: role))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                header
                if showPlanComparison { planComparison }
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
        .sheet(isPresented: $showingPaymentReview) {
            if let product = selectedProduct {
                NativePaymentReviewView(product: product, role: role, eligibleForIntro: store.introEligibleProductIDs.contains(product.id), isBusy: isBusy) {
                    showingPaymentReview = false
                    Task {
                        if let result = await store.purchase(product) { onFinished(result) }
                    }
                }
            }
        }
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

    private var planComparison: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Elige tu forma de entrenar")
                .font(.title3.bold())
            HStack(alignment: .top, spacing: 12) {
                comparisonCard(
                    title: "Atleta con IA",
                    price: price(for: "com.triwavex.athlete.monthly"),
                    detail: "Planificación adaptativa y métricas para tu progreso.",
                    selected: role == "athlete"
                )
                comparisonCard(
                    title: "Si eres entrenador",
                    price: price(for: "com.triwavex.coach.monthly"),
                    detail: "10 atletas incluidos. Desde el undécimo, añade bloques de hasta 5 atletas.",
                    selected: role == "coach"
                )
            }
            Text("La prueba gratuita y el importe exacto aparecen antes de confirmar. Los impuestos se muestran cuando corresponda.")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
    }

    private func comparisonCard(title: String, price: String, detail: String, selected: Bool) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(.subheadline.weight(.semibold)).foregroundStyle(.secondary)
            Text(price).font(.headline.bold()).foregroundStyle(.primary)
            Text(detail).font(.caption).foregroundStyle(.secondary).multilineTextAlignment(.leading)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(Color.triWaveXSurface, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay { RoundedRectangle(cornerRadius: 16, style: .continuous).stroke(selected ? Color.triWaveXAqua : Color.clear, lineWidth: 2) }
        .accessibilityAddTraits(selected ? .isSelected : [])
    }

    private func price(for identifier: String) -> String {
        store.products.first(where: { $0.id == identifier }).map { "\($0.displayPrice)/mes" } ?? "Disponible en App Store"
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
                    Text("Cada bloque adicional de 5 atletas cuesta 2,99 €/mes y se muestra antes de confirmar.")
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
            if alreadyPurchased {
                Task {
                    if let result = await store.restore(expectedProductID: product.id) {
                        onFinished(result)
                    }
                }
            } else {
                showingPaymentReview = true
            }
        } label: {
            Text(alreadyPurchased ? "Continuar con mi suscripción" : "Revisar y continuar al pago")
        }
        .buttonStyle(TriWaveXPrimaryButtonStyle(tint: .triWaveXAqua))
        .disabled(isBusy)
        .accessibilityHint(eligible ? "Apple mostrará la confirmación. No se cobra durante la prueba gratuita." : "Apple mostrará el precio antes de confirmar.")
    }

    private var supportActions: some View {
        VStack(spacing: 4) {
            Button("Restaurar compras") {
                Task {
                    if let result = await store.restore(expectedProductID: productIdentifier) {
                        restoredMessage = "Tu suscripción está activa en este dispositivo."
                        onFinished(result)
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

private struct NativePaymentReviewView: View {
    let product: Product
    let role: String
    let eligibleForIntro: Bool
    let isBusy: Bool
    let onConfirm: () -> Void

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 20) {
                Label("Pago seguro con Apple", systemImage: "lock.shield.fill")
                    .font(.headline)
                    .foregroundStyle(Color.triWaveXAqua)
                Text("Revisa tu suscripción")
                    .font(.largeTitle.bold())
                VStack(alignment: .leading, spacing: 10) {
                    HStack { Text(role == "coach" ? "Entrenador" : "Atleta con IA"); Spacer(); Text("\(product.displayPrice)/mes").bold() }
                    if eligibleForIntro { Text("7 días gratis, sin cobro hoy.").foregroundStyle(.secondary) }
                    if role == "coach" { Text("Incluye 10 atletas. Cada bloque adicional de 5 atletas cuesta 2,99 €/mes.").font(.subheadline).foregroundStyle(.secondary) }
                    if role != "coach" {
                        Label("Desbloquea tu plan completo, los ajustes de carga y el seguimiento de cada sesión.", systemImage: "checkmark.circle.fill")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    Text("Apple mostrará el importe final y los impuestos antes de confirmar. Puedes cancelar desde Ajustes de tu Apple ID.").font(.footnote).foregroundStyle(.secondary)
                }
                .padding(16)
                .background(Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                Spacer()
                SlideToConfirm(
                    title: eligibleForIntro ? "Desliza para empezar 7 días gratis" : "Desliza para confirmar",
                    isDisabled: isBusy,
                    onConfirmed: onConfirm
                )
            }
            .padding(20)
            .navigationTitle("Confirmar pago")
            .navigationBarTitleDisplayMode(.inline)
        }
        .presentationDetents([.medium, .large])
    }
}

private struct SlideToConfirm: View {
    let title: String
    let isDisabled: Bool
    let onConfirmed: () -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var offset: CGFloat = 0
    @State private var hasConfirmed = false

    var body: some View {
        GeometryReader { proxy in
            let knobSize: CGFloat = 52
            let horizontalPadding: CGFloat = 6
            let maximumOffset = max(0, proxy.size.width - knobSize - horizontalPadding * 2)

            ZStack(alignment: .leading) {
                Capsule()
                    .fill(Color(uiColor: .tertiarySystemFill))

                Text(hasConfirmed || isDisabled ? "Preparando confirmación de Apple…" : title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity)
                    .padding(.horizontal, 56)
                    .lineLimit(1)

                Circle()
                    .fill(isDisabled || hasConfirmed ? Color.secondary : Color.triWaveXAqua)
                    .frame(width: knobSize, height: knobSize)
                    .overlay {
                        Image(systemName: hasConfirmed ? "checkmark" : "chevron.right")
                            .font(.headline.weight(.bold))
                            .foregroundStyle(.white)
                    }
                    .offset(x: horizontalPadding + offset)
                    .shadow(color: .black.opacity(0.16), radius: 6, y: 3)
            }
            .contentShape(Capsule())
            .gesture(
                DragGesture(minimumDistance: 2)
                    .onChanged { value in
                        guard !isDisabled, !hasConfirmed else { return }
                        offset = min(max(0, value.translation.width), maximumOffset)
                    }
                    .onEnded { _ in
                        guard !isDisabled, !hasConfirmed else { return }
                        if maximumOffset > 0, offset >= maximumOffset * 0.82 {
                            complete(maximumOffset: maximumOffset)
                        } else {
                            withAnimation(reduceMotion ? .linear(duration: 0.1) : .spring(response: 0.34, dampingFraction: 0.78)) {
                                offset = 0
                            }
                        }
                    }
            )
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(title)
            .accessibilityHint("Desliza hasta el final o usa la acción Confirmar. Apple mostrará la confirmación final.")
            .accessibilityAddTraits(.isButton)
            .accessibilityAction(named: Text("Confirmar")) {
                guard !isDisabled, !hasConfirmed else { return }
                complete(maximumOffset: maximumOffset)
            }
        }
        .frame(height: 64)
        .opacity(isDisabled && !hasConfirmed ? 0.72 : 1)
        .onChange(of: isDisabled) { _, busy in
            guard !busy else { return }
            hasConfirmed = false
            offset = 0
        }
    }

    private func complete(maximumOffset: CGFloat) {
        withAnimation(reduceMotion ? .linear(duration: 0.1) : .easeOut(duration: 0.18)) {
            offset = maximumOffset
            hasConfirmed = true
        }
        UINotificationFeedbackGenerator().notificationOccurred(.success)
        onConfirmed()
    }
}
