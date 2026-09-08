import SwiftUI

@main
struct TriWaveXApp: App {
    var body: some Scene {
        WindowGroup {
            if let origin = Configuration.siteURL {
                RootView(origin: origin)
                    .preferredColorScheme(.dark)
            } else {
                ContentUnavailableView("TriWaveX", systemImage: "wrench.and.screwdriver",
                    description: Text("Configura el servidor HTTPS de esta versión en Xcode para iniciar las pruebas."))
            }
        }
    }
}
