import SwiftUI

struct TriWaveXStartupView: View {
    let isRestoringSession: Bool

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var accentIsVisible = false

    init(isRestoringSession: Bool = false) {
        self.isRestoringSession = isRestoringSession
    }

    var body: some View {
        ZStack {
            Color(.systemBackground)
                .ignoresSafeArea()

            VStack(spacing: 14) {
                Text("TriWaveX")
                    .font(.system(size: 34, weight: .bold, design: .rounded))
                    .foregroundStyle(Color.triWaveXTextPrimary)

                Text("Entrena con una dirección clara")
                    .font(.body)
                    .foregroundStyle(Color.triWaveXTextSecondary)
                    .multilineTextAlignment(.center)

                Capsule(style: .continuous)
                    .fill(Color.triWaveXAqua)
                    .frame(width: 48, height: 4)
                    .scaleEffect(x: accentIsVisible ? 1 : 0.34, y: 1, anchor: .leading)
                    .opacity(accentIsVisible ? 1 : 0.62)

                if isRestoringSession {
                    ProgressView()
                        .controlSize(.small)
                        .tint(.secondary)
                        .accessibilityLabel("Comprobando sesión")
                }
            }
            .padding(.horizontal, 24)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel(
            isRestoringSession
                ? "TriWaveX. Entrena con una dirección clara. Comprobando sesión"
                : "TriWaveX. Entrena con una dirección clara"
        )
        .accessibilityAddTraits(.updatesFrequently)
        .accessibilityHint("La pantalla de inicio desaparecerá cuando la aplicación esté lista")
        .onAppear {
            guard !reduceMotion else {
                accentIsVisible = true
                return
            }
            withAnimation(TriWaveXMotion.entry) {
                accentIsVisible = true
            }
        }
    }
}
