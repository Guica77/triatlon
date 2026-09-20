import SwiftUI

/// The three-stripe TriWaveX mark, drawn as a vector so it stays crisp in the login introduction.
struct TriWaveXMark: View {
    var body: some View {
        GeometryReader { proxy in
            let width = proxy.size.width
            let height = proxy.size.height
            ZStack {
                markStroke(width: width, height: height, start: 0.12, control: 0.28, end: 0.78, rise: 0.16)
                markStroke(width: width, height: height, start: 0.20, control: 0.40, end: 0.90, rise: 0.39)
                markStroke(width: width, height: height, start: 0.30, control: 0.51, end: 0.98, rise: 0.64)
            }
        }
        .accessibilityHidden(true)
    }

    private func markStroke(width: CGFloat, height: CGFloat, start: CGFloat, control: CGFloat, end: CGFloat, rise: CGFloat) -> some View {
        Path { path in
            path.move(to: CGPoint(x: width * start, y: height * 0.9))
            path.addQuadCurve(
                to: CGPoint(x: width * end, y: height * rise),
                control: CGPoint(x: width * control, y: height * 0.28)
            )
        }
        .stroke(.black, style: StrokeStyle(lineWidth: width * 0.115, lineCap: .round, lineJoin: .round))
    }
}
