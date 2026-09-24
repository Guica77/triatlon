import SwiftUI

/// Reveals a short sentence and erases it before the next sentence enters.
struct TypingCycleText: View {
    let text: String
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var visibleCharacterCount = 0

    private static let revealCharacterDelayMilliseconds = 45
    private static let pauseBeforeEraseMilliseconds = 420
    private static let pauseAfterEraseMilliseconds = 180
    private static let eraseCharacterDelayMilliseconds = 55

    static func cycleDurationMilliseconds(forCharacterCount count: Int) -> Int {
        count * (revealCharacterDelayMilliseconds + eraseCharacterDelayMilliseconds)
            + pauseBeforeEraseMilliseconds
            + pauseAfterEraseMilliseconds
    }

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
                    try? await Task.sleep(for: .milliseconds(Self.revealCharacterDelayMilliseconds))
                    guard !Task.isCancelled else { return }
                    visibleCharacterCount = count
                }
                try? await Task.sleep(for: .milliseconds(Self.pauseBeforeEraseMilliseconds))
                guard !Task.isCancelled else { return }
                try? await Task.sleep(for: .milliseconds(Self.pauseAfterEraseMilliseconds))
                guard !Task.isCancelled else { return }
                for count in stride(from: text.count - 1, through: 0, by: -1) {
                    try? await Task.sleep(for: .milliseconds(Self.eraseCharacterDelayMilliseconds))
                    guard !Task.isCancelled else { return }
                    visibleCharacterCount = count
                }
            }
    }
}
