import SwiftUI

/// Reveals a short sentence and erases it before the next sentence enters.
struct TypingCycleText: View {
    let text: String
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var visibleCharacterCount = 0

    var body: some View {
        Text(String(text.prefix(visibleCharacterCount)))
            .frame(maxWidth: .infinity)
            .task(id: text) {
                if reduceMotion {
                    visibleCharacterCount = text.count
                    return
                }

                visibleCharacterCount = 0
                for count in 1...text.count {
                    try? await Task.sleep(for: .milliseconds(45))
                    guard !Task.isCancelled else { return }
                    visibleCharacterCount = count
                }
                try? await Task.sleep(for: .milliseconds(420))
                guard !Task.isCancelled else { return }
                try? await Task.sleep(for: .milliseconds(180))
                guard !Task.isCancelled else { return }
                for count in stride(from: text.count - 1, through: 0, by: -1) {
                    try? await Task.sleep(for: .milliseconds(55))
                    guard !Task.isCancelled else { return }
                    visibleCharacterCount = count
                }
            }
    }
}
