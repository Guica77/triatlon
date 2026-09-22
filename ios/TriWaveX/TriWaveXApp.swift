import SwiftUI

@main
struct TriWaveXApp: App {
    @State private var appLock = AppLock()
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            configuredRootView
                .environment(appLock)
                .overlay { if appLock.isLocked { AppLockOverlay(lock: appLock).zIndex(100) } }
                .onChange(of: scenePhase) { _, phase in if phase != .active { appLock.lockIfNeeded() } }
        }
    }

    @ViewBuilder
    private var configuredRootView: some View {
        if let origin = Configuration.siteURL {
            RootView(origin: origin)
                .tint(.triWaveXAqua)
                .background(Color(.systemBackground))
                .preferredColorScheme(.light)
        } else {
            ContentUnavailableView("TriWaveX", systemImage: "wrench.and.screwdriver",
                description: Text("Configura el servidor HTTPS de esta versión en Xcode para iniciar las pruebas."))
        }
    }
}
