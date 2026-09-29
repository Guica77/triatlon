import SwiftUI

/// Brand colours of the app icon. The launch screen uses the same lime
/// (`LaunchBackground` asset), so the system launch hands over without a flash.
extension Color {
    static let triWaveXLime = Color("LaunchBackground")
    static let triWaveXMarkInk = Color(red: 11 / 255, green: 17 / 255, blue: 23 / 255)
}

/// One of the three waves of the app icon, traced from its 1024-pt artwork.
nonisolated struct TriWaveXMarkStroke: Shape {
    let index: Int

    // Centre lines of the icon strokes, in the icon's 1024 × 1024 space.
    private static let strokes: [[CGPoint]] = [
        [(268, 655), (300, 568), (350, 478), (400, 407), (450, 353), (500, 315), (550, 289), (600, 272), (650, 267), (700, 270), (767, 293)],
        [(268, 790), (300, 727), (350, 646), (400, 578), (450, 525), (500, 483), (550, 452), (600, 430), (650, 417), (700, 413), (750, 417), (842, 450)],
        [(268, 925), (300, 880), (350, 817), (400, 758), (450, 714), (500, 675), (550, 643), (600, 619), (650, 602), (700, 593), (750, 591), (800, 595), (902, 632)],
    ].map { $0.map { CGPoint(x: $0.0, y: $0.1) } }

    /// The mark's visual centre in icon space, so the waves sit centred in the frame.
    private static let centre = CGPoint(x: 585, y: 597)

    static func lineWidth(for side: CGFloat) -> CGFloat { side * 85 / 1024 * 1.35 }

    func path(in rect: CGRect) -> Path {
        let side = min(rect.width, rect.height)
        let scale = side / 1024 * 1.35
        let point = { (p: CGPoint) in
            CGPoint(x: rect.midX + (p.x - Self.centre.x) * scale, y: rect.midY + (p.y - Self.centre.y) * scale)
        }
        let points = Self.strokes[index].map(point)
        var path = Path()
        path.move(to: points[0])
        // Quadratic segments through the midpoints give a smooth curve that
        // passes close to every traced point.
        for i in 1..<points.count - 1 {
            let mid = CGPoint(x: (points[i].x + points[i + 1].x) / 2, y: (points[i].y + points[i + 1].y) / 2)
            path.addQuadCurve(to: mid, control: points[i])
        }
        path.addLine(to: points[points.count - 1])
        return path
    }
}

struct TriWaveXStartupView: View {
    let isRestoringSession: Bool

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var drawn = false
    @State private var showsWordmark = false
    @State private var showsProgress = false

    init(isRestoringSession: Bool = false) {
        self.isRestoringSession = isRestoringSession
    }

    var body: some View {
        ZStack {
            Color.triWaveXLime.ignoresSafeArea()

            VStack(spacing: 28) {
                mark
                    .frame(width: 132, height: 132)

                VStack(spacing: 8) {
                    Text("TriWaveX")
                        .font(.system(size: 36, weight: .heavy, design: .rounded))
                        .tracking(-0.5)
                    Text("Entrena con una dirección clara")
                        .font(.callout.weight(.medium))
                        .opacity(0.68)
                }
                .foregroundStyle(Color.triWaveXMarkInk)
                .opacity(showsWordmark ? 1 : 0)
                .offset(y: showsWordmark ? 0 : 14)
                .blur(radius: showsWordmark ? 0 : 6)

                ProgressView()
                    .controlSize(.small)
                    .tint(Color.triWaveXMarkInk)
                    .opacity(isRestoringSession && showsProgress ? 0.7 : 0)
                    .accessibilityHidden(true)
            }
            .offset(y: 14)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(
            isRestoringSession
                ? "TriWaveX. Entrena con una dirección clara. Comprobando sesión"
                : "TriWaveX. Entrena con una dirección clara"
        )
        .accessibilityAddTraits(.updatesFrequently)
        .task { await play() }
    }

    private var mark: some View {
        GeometryReader { proxy in
            let side = min(proxy.size.width, proxy.size.height)
            ZStack {
                ForEach(0..<3, id: \.self) { index in
                    TriWaveXMarkStroke(index: index)
                        .trim(from: 0, to: drawn ? 1 : 0)
                        .stroke(Color.triWaveXMarkInk, style: StrokeStyle(lineWidth: TriWaveXMarkStroke.lineWidth(for: side), lineCap: .round, lineJoin: .round))
                        .animation(
                            reduceMotion ? nil : .timingCurve(0.65, 0, 0.25, 1, duration: 0.62).delay(Double(index) * 0.11),
                            value: drawn
                        )
                }
            }
            .scaleEffect(drawn ? 1 : 0.9)
            .animation(reduceMotion ? nil : .spring(response: 0.7, dampingFraction: 0.72), value: drawn)
        }
        .accessibilityHidden(true)
    }

    private func play() async {
        guard !reduceMotion else {
            drawn = true
            showsWordmark = true
            showsProgress = true
            return
        }
        // One frame on the plain lime so it matches the system launch screen.
        try? await Task.sleep(for: .milliseconds(60))
        drawn = true
        try? await Task.sleep(for: .milliseconds(420))
        withAnimation(.spring(response: 0.55, dampingFraction: 0.86)) { showsWordmark = true }
        // Only surface a spinner if restoring the session outlasts the intro.
        try? await Task.sleep(for: .milliseconds(1_100))
        withAnimation(.easeOut(duration: 0.3)) { showsProgress = true }
    }
}
