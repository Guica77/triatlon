import SwiftUI

/// A one-shot, accessible typewriter reveal used only for the login welcome sequence.
struct TypingText: View {
    let text: String
    let characterDelay: Duration

    @State private var visibleCharacterCount = 0

    var body: some View {
        Text(String(text.prefix(visibleCharacterCount)))
            .frame(maxWidth: .infinity)
            .task(id: text) {
                visibleCharacterCount = 0
                if characterDelay == .zero {
                    visibleCharacterCount = text.count
                    return
                }

                for count in 1...text.count {
                    try? await Task.sleep(for: characterDelay)
                    guard !Task.isCancelled else { return }
                    visibleCharacterCount = count
                }
            }
    }
}
