import Observation
import SwiftUI

enum GuidedOnboardingRole: String, Sendable {
    case athlete
    case coach
}

struct GuidedTourRequest: Sendable {
    let role: GuidedOnboardingRole
    let givenName: String

    var displayName: String? {
        let value = givenName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard (2...30).contains(value.count),
              value.unicodeScalars.contains(where: CharacterSet.letters.contains) else { return nil }
        return value
    }
}

@MainActor
@Observable final class GuidedOnboardingModel {
    private(set) var step = 0
    private(set) var isPresented: Bool
    let request: GuidedTourRequest

    private let defaults: UserDefaults
    private let version = 1

    init(request: GuidedTourRequest, defaults: UserDefaults = .standard) {
        self.request = request
        self.defaults = defaults
        let completed = defaults.bool(forKey: Self.completionKey(for: request))
        step = min(max(defaults.integer(forKey: Self.progressKey(for: request)), 0), 2)
        isPresented = !completed
    }

    var progress: Double { Double(step + 1) / 3 }
    var isLastStep: Bool { step == 2 }

    var title: String {
        let name = request.displayName.map { "\($0), " } ?? ""
        switch (request.role, step) {
        case (.athlete, 0): return "\(name)aquí empieza tu día"
        case (.athlete, 1): return "Tu semana y tu apoyo"
        case (.athlete, 2): return "\(name)ya estás listo"
        case (.coach, 0): return "\(name)este es tu equipo"
        case (.coach, 1): return "Invita a tu primer atleta"
        case (.coach, 2): return "\(name)tu espacio está preparado"
        default: return "Descubre TriWaveX"
        }
    }

    var message: String {
        switch (request.role, step) {
        case (.athlete, 0): return "En Hoy encontrarás la sesión y la prioridad de cada jornada."
        case (.athlete, 1): return "Consulta tu Plan y abre Chat cuando necesites ayuda de tu entrenador o de la IA."
        case (.athlete, 2): return "Abre tu primera sesión. Te acompañaremos sin interrumpir tu entrenamiento."
        case (.coach, 0): return "Consulta el estado de tus atletas desde un único lugar."
        case (.coach, 1): return "Añade un atleta cuando quieras; la invitación solo se envía cuando tú confirmas."
        case (.coach, 2): return "Revisa planes y usa Chat para acompañar a tu equipo."
        default: return ""
        }
    }

    var symbol: String {
        switch (request.role, step) {
        case (.athlete, 0): "house.fill"
        case (.athlete, 1): "calendar.badge.clock"
        case (.athlete, 2): "figure.run"
        case (.coach, 0): "person.2.fill"
        case (.coach, 1): "person.badge.plus"
        case (.coach, 2): "checkmark.seal.fill"
        default: "sparkles"
        }
    }

    func advance() {
        guard step < 2 else { finish(); return }
        step += 1
        defaults.set(step, forKey: Self.progressKey(for: request))
    }

    func skip() { finish() }

    func restart() {
        step = 0
        defaults.set(0, forKey: Self.progressKey(for: request))
        isPresented = true
    }

    func finish() {
        defaults.set(true, forKey: Self.completionKey(for: request, version: version))
        defaults.removeObject(forKey: Self.progressKey(for: request, version: version))
        isPresented = false
    }

    private static func completionKey(for request: GuidedTourRequest, version: Int = 1) -> String {
        let name = request.displayName?.lowercased() ?? "account"
        let safeName = name.unicodeScalars.map { CharacterSet.alphanumerics.contains($0) ? Character(String($0)) : "-" }
        return "triwavex.guided-onboarding.v\(version).\(request.role.rawValue).\(String(safeName))"
    }

    private static func progressKey(for request: GuidedTourRequest, version: Int = 1) -> String {
        completionKey(for: request, version: version) + ".step"
    }
}

struct GuidedOnboardingOverlay: View {
    @Bindable var model: GuidedOnboardingModel
    let onStepChanged: (Int) -> Void
    let onFinished: () -> Void

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var cursorVisible = false
    @State private var pulse = false

    var body: some View {
        ZStack {
            Color.black.opacity(0.28)
                .ignoresSafeArea()
                .accessibilityHidden(true)

            VStack {
                Spacer()

                cursor
                    .padding(.bottom, 8)

                VStack(alignment: .leading, spacing: 14) {
                    HStack {
                        Label(model.request.role == .coach ? "Guía para entrenador" : "Guía para atleta", systemImage: model.symbol)
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.tint)
                        Spacer()
                        Button("Saltar") { finish(skipped: true) }
                            .font(.subheadline.weight(.semibold))
                    }

                    if model.step > 0 {
                        Label("Continuamos donde lo dejaste", systemImage: "arrow.counterclockwise.circle.fill")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.secondary)
                    }

                    Text(model.title)
                        .font(.title2.bold())
                        .fixedSize(horizontal: false, vertical: true)

                    Text(model.message)
                        .font(.body)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)

                    HStack(spacing: 7) {
                        ForEach(0..<3, id: \.self) { index in
                            Capsule()
                                .fill(index <= model.step ? Color.accentColor : Color.secondary.opacity(0.22))
                                .frame(width: index == model.step ? 28 : 9, height: 7)
                        }
                        Spacer()
                        Text("\(model.step + 1) de 3")
                            .font(.caption.monospacedDigit())
                            .foregroundStyle(.secondary)
                    }
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel("Paso \(model.step + 1) de 3")

                    Button(model.isLastStep ? finalButtonTitle : "Continuar") {
                        if model.isLastStep { finish(skipped: false) }
                        else {
                            withAnimation(reduceMotion ? .linear(duration: 0.1) : .spring(response: 0.42, dampingFraction: 0.84)) {
                                model.advance()
                            }
                            onStepChanged(model.step)
                            animateCursor()
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                    .frame(maxWidth: .infinity)
                }
                .padding(20)
                .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 28, style: .continuous))
                .padding(.horizontal, 16)
                .padding(.bottom, 14)
            }
        }
        .transition(.opacity)
        .onAppear { animateCursor() }
        .accessibilityElement(children: .contain)
    }

    private var cursor: some View {
        Image(systemName: "hand.point.up.left.fill")
            .font(.system(size: 42, weight: .semibold))
            .symbolRenderingMode(.palette)
            .foregroundStyle(.white, Color.accentColor)
            .shadow(color: .black.opacity(0.25), radius: 7, y: 4)
            .scaleEffect(pulse ? 0.88 : 1)
            .opacity(cursorVisible ? 1 : 0)
            .offset(y: cursorVisible ? 0 : 22)
            .accessibilityHidden(true)
    }

    private var finalButtonTitle: String {
        model.request.role == .coach ? "Preparar mi equipo" : "Estoy listo"
    }

    private func animateCursor() {
        cursorVisible = false
        pulse = false
        withAnimation(reduceMotion ? .linear(duration: 0.1) : .easeOut(duration: 0.42).delay(0.12)) {
            cursorVisible = true
        }
        guard !reduceMotion else { return }
        withAnimation(.easeInOut(duration: 0.35).repeatCount(2, autoreverses: true).delay(0.55)) {
            pulse = true
        }
    }

    private func finish(skipped: Bool) {
        if skipped { model.skip() } else { model.finish() }
        onFinished()
    }
}
