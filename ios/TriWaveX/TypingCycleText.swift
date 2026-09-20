import SwiftUI

/// Reveals a short sentence and erases it before the next sentence enters.
struct TypingCycleText: View {
    let text: String
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var visibleCharacterCount = 0
    @State private var showsContinuationDot = false

    var body: some View {
        HStack(spacing: 0) {
            Text(String(text.prefix(visibleCharacterCount)))
            Text(".")
                .opacity(showsContinuationDot ? 1 : 0)
        }
            .frame(maxWidth: .infinity)
            .task(id: text) {
                if reduceMotion {
                    visibleCharacterCount = text.count
                    return
                }

                visibleCharacterCount = 0
                showsContinuationDot = false
                for count in 1...text.count {
                    try? await Task.sleep(for: .milliseconds(32))
                    guard !Task.isCancelled else { return }
                    visibleCharacterCount = count
                }
                withAnimation(.easeOut(duration: 0.18)) { showsContinuationDot = true }
                try? await Task.sleep(for: .milliseconds(260))
                guard !Task.isCancelled else { return }
                withAnimation(.easeOut(duration: 0.18)) { showsContinuationDot = false }
                try? await Task.sleep(for: .milliseconds(120))
                guard !Task.isCancelled else { return }
                for count in stride(from: text.count - 1, through: 0, by: -1) {
                    try? await Task.sleep(for: .milliseconds(32))
                    guard !Task.isCancelled else { return }
                    visibleCharacterCount = count
                }
            }
    }
}
