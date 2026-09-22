import Foundation
import LocalAuthentication
import Observation
import SwiftUI

@MainActor @Observable
final class AppLock {
    private let enabledKey = "triwavex.app-lock.enabled"
    var isLocked = false
    var isAuthenticating = false
    var errorMessage: String?

    var isEnabled: Bool {
        get { UserDefaults.standard.bool(forKey: enabledKey) }
        set {
            UserDefaults.standard.set(newValue, forKey: enabledKey)
            if !newValue { isLocked = false; errorMessage = nil }
        }
    }

    func lockIfNeeded() {
        guard isEnabled else { return }
        isLocked = true
    }

    func authenticate() async {
        guard isEnabled, !isAuthenticating else { return }
        isAuthenticating = true
        errorMessage = nil
        defer { isAuthenticating = false }
        let context = LAContext()
        var evaluationError: NSError?
        guard context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &evaluationError) else {
            errorMessage = "No se puede verificar la identidad en este iPhone."
            return
        }
        do {
            try await context.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: "Protege el acceso local a TriWaveX.")
            isLocked = false
        } catch {
            errorMessage = "No se ha desbloqueado TriWaveX. Puedes usar Face ID o el código del iPhone."
        }
    }
}

struct AppLockOverlay: View {
    @Bindable var lock: AppLock

    var body: some View {
        ZStack {
            Color(uiColor: .systemBackground).ignoresSafeArea()
            VStack(spacing: 16) {
                Image(systemName: "lock.fill").font(.system(size: 35)).foregroundStyle(Color.triWaveXAqua)
                Text("TriWaveX está bloqueada").font(.title2.bold())
                Text("Usa Face ID o el código de tu iPhone para continuar.").multilineTextAlignment(.center).foregroundStyle(.secondary)
                Button(lock.isAuthenticating ? "Comprobando…" : "Desbloquear") { Task { await lock.authenticate() } }
                    .buttonStyle(TriWaveXPrimaryButtonStyle(tint: .triWaveXAqua))
                    .disabled(lock.isAuthenticating)
                if let errorMessage = lock.errorMessage { Text(errorMessage).font(.footnote).foregroundStyle(.red).multilineTextAlignment(.center) }
            }
            .padding(28)
        }
        .task { await lock.authenticate() }
        .accessibilityElement(children: .contain)
    }
}
