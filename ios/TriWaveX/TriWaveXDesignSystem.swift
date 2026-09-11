import SwiftUI
import UIKit

// MARK: - Foundations

enum TriWaveXMetrics {
    static let contentMaximumWidth: CGFloat = 520
    static let compactControlHeight: CGFloat = 46
    static let controlHeight: CGFloat = 52
    static let minimumTouchTarget: CGFloat = 44
    static let cardRadius: CGFloat = 18
    static let controlRadius: CGFloat = 12
}

private enum TriWaveXPalette {
    static let ink = Color(uiColor: .systemBackground)
    static let surface = Color(uiColor: .secondarySystemGroupedBackground)
    static let elevated = Color(uiColor: .tertiarySystemGroupedBackground)
    static let textPrimary = Color(uiColor: .label)
    static let textSecondary = Color(uiColor: .secondaryLabel)
    static let border = Color(uiColor: .separator)
}

enum TriWaveXMotion {
    static let stateChange = Animation.easeOut(duration: 0.2)
    static let selection = Animation.easeInOut(duration: 0.16)
    static let press = Animation.easeOut(duration: 0.14)

    static func stateChange(reduced: Bool) -> Animation? {
        reduced ? nil : stateChange
    }

    static func selection(reduced: Bool) -> Animation? {
        reduced ? nil : selection
    }
}

extension Color {
    static let triWaveXInk = TriWaveXPalette.ink
    static let triWaveXSurface = TriWaveXPalette.surface
    static let triWaveXElevated = TriWaveXPalette.elevated
    static let triWaveXTextPrimary = TriWaveXPalette.textPrimary
    static let triWaveXTextSecondary = TriWaveXPalette.textSecondary
    static let triWaveXBorder = TriWaveXPalette.border
    static let triWaveXAqua = Color(uiColor: .systemBlue)
    static let triWaveXCoral = Color(uiColor: .systemRed)

    static let triWaveXBackground = triWaveXInk
    static let triWaveXPrimaryAccent = triWaveXAqua
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
            .background(Color.triWaveXSurface, in: RoundedRectangle(cornerRadius: TriWaveXMetrics.cardRadius, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: TriWaveXMetrics.cardRadius, style: .continuous)
                    .stroke(Color.triWaveXBorder, lineWidth: 1)
            }
    }
}

struct TriWaveXSectionLabel: View {
    let text: String

    var body: some View {
        Text(text)
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(Color.triWaveXTextSecondary)
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
                .foregroundStyle(.black.opacity(configuration.isPressed ? 0.72 : 0.9))
                .frame(maxWidth: .infinity, minHeight: TriWaveXMetrics.controlHeight)
                .background(
                    tint.opacity(configuration.isPressed ? 0.82 : 1),
                    in: RoundedRectangle(cornerRadius: TriWaveXMetrics.controlRadius, style: .continuous)
                )
                .scaleEffect(reduceMotion || !configuration.isPressed ? 1 : 0.98)
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
                .foregroundStyle(Color.triWaveXTextPrimary.opacity(configuration.isPressed ? 0.72 : 0.92))
                .frame(maxWidth: .infinity, minHeight: TriWaveXMetrics.compactControlHeight)
                .background(
                    Color.triWaveXElevated.opacity(configuration.isPressed ? 0.92 : 0.76),
                    in: RoundedRectangle(cornerRadius: TriWaveXMetrics.controlRadius, style: .continuous)
                )
                .overlay {
                    RoundedRectangle(cornerRadius: TriWaveXMetrics.controlRadius, style: .continuous)
                        .stroke(Color.triWaveXBorder, lineWidth: 1)
                }
                .scaleEffect(reduceMotion || !configuration.isPressed ? 1 : 0.98)
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
                .contentShape(RoundedRectangle(cornerRadius: TriWaveXMetrics.controlRadius, style: .continuous))
                .scaleEffect(reduceMotion || !configuration.isPressed ? 1 : 0.98)
                .opacity(configuration.isPressed ? 0.84 : 1)
                .animation(reduceMotion ? nil : TriWaveXMotion.press, value: configuration.isPressed)
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
