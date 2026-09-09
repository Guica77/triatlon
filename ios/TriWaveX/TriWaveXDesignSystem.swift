import SwiftUI

// MARK: - Foundations

enum TriWaveXMetrics {
    static let contentMaximumWidth: CGFloat = 520
    static let compactControlHeight: CGFloat = 46
    static let controlHeight: CGFloat = 52
    static let minimumTouchTarget: CGFloat = 44
    static let cardRadius: CGFloat = 28
    static let controlRadius: CGFloat = 18
    static let navigationRadius: CGFloat = 24
}

enum TriWaveXMotion {
    static let stateChange = Animation.easeInOut(duration: 0.2)
    static let selection = Animation.spring(response: 0.34, dampingFraction: 0.86)
    static let press = Animation.spring(response: 0.22, dampingFraction: 0.82)

    static func stateChange(reduced: Bool) -> Animation? {
        reduced ? nil : stateChange
    }

    static func selection(reduced: Bool) -> Animation? {
        reduced ? nil : selection
    }
}

extension Color {
    static let triWaveXInk = Color(red: 0.025, green: 0.055, blue: 0.075)
    static let triWaveXSurface = Color(red: 0.045, green: 0.105, blue: 0.13)
    static let triWaveXChrome = Color(red: 0.075, green: 0.12, blue: 0.145)
    static let triWaveXAqua = Color(red: 0.47, green: 0.78, blue: 1)
    static let triWaveXLime = Color(red: 0.72, green: 0.95, blue: 0.42)
    static let triWaveXCoral = Color(red: 1, green: 0.54, blue: 0.45)

    static let triWaveXBackground = triWaveXInk
    static let triWaveXSurfaceElevated = triWaveXChrome
    static let triWaveXPrimaryAccent = triWaveXAqua
    static let triWaveXSecondaryAccent = triWaveXLime
    static let triWaveXError = triWaveXCoral
}

struct TriWaveXSurface<Content: View>: View {
    private let content: Content
    private let padding: CGFloat

    init(padding: CGFloat = 20, @ViewBuilder content: () -> Content) {
        self.padding = padding
        self.content = content()
    }

    var body: some View {
        content
            .padding(padding)
            .background(Color.triWaveXSurfaceElevated, in: RoundedRectangle(cornerRadius: TriWaveXMetrics.cardRadius, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: TriWaveXMetrics.cardRadius, style: .continuous)
                    .stroke(.white.opacity(0.1), lineWidth: 1)
            }
    }
}

struct TriWaveXSectionLabel: View {
    let text: String

    var body: some View {
        Text(text)
            .font(.caption.weight(.bold))
            .textCase(.uppercase)
            .tracking(0.8)
            .foregroundStyle(.white.opacity(0.52))
            .accessibilityAddTraits(.isHeader)
    }
}

struct TriWaveXLoadingBar: View {
    var body: some View {
        ProgressView()
            .progressViewStyle(.linear)
            .tint(.triWaveXAqua)
            .frame(maxWidth: .infinity)
            .accessibilityLabel("Cargando")
    }
}

struct TriWaveXMark: View {
    var body: some View {
        Canvas { context, size in
            let stroke = StrokeStyle(lineWidth: size.width * 0.085, lineCap: .round)
            let waves = [
                (0.23, 0.49, 0.74, 0.29),
                (0.23, 0.64, 0.82, 0.43),
                (0.23, 0.79, 0.88, 0.57)
            ]
            for (startX, startY, endX, endY) in waves {
                var path = Path()
                path.move(to: CGPoint(x: size.width * startX, y: size.height * startY))
                path.addCurve(
                    to: CGPoint(x: size.width * endX, y: size.height * endY),
                    control1: CGPoint(x: size.width * 0.42, y: size.height * 0.11),
                    control2: CGPoint(x: size.width * 0.65, y: size.height * 0.26)
                )
                context.stroke(path, with: .color(.triWaveXLime), style: stroke)
            }
        }
        .background(Color.triWaveXInk, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .stroke(.white.opacity(0.1), lineWidth: 1)
        }
        .accessibilityLabel("Símbolo TriWaveX")
    }
}

// MARK: - Button styles

@MainActor
struct TriWaveXPrimaryButtonStyle: ButtonStyle {
    typealias Body = AnyView
    let tint: Color
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    @preconcurrency @MainActor @ViewBuilder
    func makeBody(configuration: Self.Configuration) -> Self.Body {
        AnyView(
            configuration.label
                .font(.body.weight(.semibold))
                .foregroundStyle(.black.opacity(configuration.isPressed ? 0.76 : 0.92))
                .frame(maxWidth: .infinity, minHeight: TriWaveXMetrics.controlHeight)
                .background(tint, in: Capsule())
                .overlay {
                    Capsule().stroke(.white.opacity(0.42), lineWidth: 1)
                }
                .shadow(
                    color: tint.opacity(configuration.isPressed ? 0.14 : 0.28),
                    radius: configuration.isPressed ? 3 : 10,
                    y: configuration.isPressed ? 1 : 5
                )
                .scaleEffect(reduceMotion || !configuration.isPressed ? 1 : 0.975)
                .brightness(configuration.isPressed ? -0.04 : 0)
                .animation(reduceMotion ? nil : TriWaveXMotion.press, value: configuration.isPressed)
        )
    }
}

@MainActor
struct TriWaveXSecondaryButtonStyle: ButtonStyle {
    typealias Body = AnyView
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    @preconcurrency @MainActor @ViewBuilder
    func makeBody(configuration: Self.Configuration) -> Self.Body {
        AnyView(
            configuration.label
                .foregroundStyle(.white.opacity(configuration.isPressed ? 0.72 : 0.92))
                .frame(maxWidth: .infinity, minHeight: TriWaveXMetrics.compactControlHeight)
                .background(.white.opacity(configuration.isPressed ? 0.13 : 0.09), in: Capsule())
                .overlay {
                    Capsule().stroke(.white.opacity(0.18), lineWidth: 1)
                }
                .scaleEffect(reduceMotion || !configuration.isPressed ? 1 : 0.975)
                .animation(reduceMotion ? nil : TriWaveXMotion.press, value: configuration.isPressed)
        )
    }
}

@MainActor
struct TriWaveXSelectionButtonStyle: ButtonStyle {
    typealias Body = AnyView
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    @preconcurrency @MainActor @ViewBuilder
    func makeBody(configuration: Self.Configuration) -> Self.Body {
        AnyView(
            configuration.label
                .contentShape(Capsule())
                .scaleEffect(reduceMotion || !configuration.isPressed ? 1 : 0.98)
                .opacity(configuration.isPressed ? 0.84 : 1)
                .animation(reduceMotion ? nil : .easeOut(duration: 0.16), value: configuration.isPressed)
        )
    }
}

@MainActor
struct TriWaveXTextButtonStyle: ButtonStyle {
    typealias Body = AnyView
    let tint: Color
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    @preconcurrency @MainActor @ViewBuilder
    func makeBody(configuration: Self.Configuration) -> Self.Body {
        AnyView(
            configuration.label
                .font(.footnote.weight(.semibold))
                .foregroundStyle(tint.opacity(configuration.isPressed ? 0.64 : 1))
                .padding(.vertical, 6)
                .frame(minHeight: TriWaveXMetrics.minimumTouchTarget)
                .scaleEffect(reduceMotion || !configuration.isPressed ? 1 : 0.98)
                .animation(reduceMotion ? nil : .easeOut(duration: 0.14), value: configuration.isPressed)
        )
    }
}
