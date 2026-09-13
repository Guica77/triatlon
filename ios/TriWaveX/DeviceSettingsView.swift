import CoreLocation
import Observation
import SwiftUI

@MainActor @Observable
final class TrainingLocationService: NSObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()
    private(set) var status: CLAuthorizationStatus = .notDetermined
    private(set) var hasLocation = false
    private(set) var location: CLLocation?

    override init() {
        super.init()
        manager.delegate = self
        status = manager.authorizationStatus
    }

    func requestAccess() {
        manager.requestWhenInUseAuthorization()
        if hasLocation { manager.requestLocation() }
    }
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        status = manager.authorizationStatus
        hasLocation = status == .authorizedWhenInUse || status == .authorizedAlways
        if hasLocation { manager.requestLocation() }
    }
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) { location = locations.last }
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) { location = nil }
}

struct DeviceSettingsView: View {
    @Bindable var health: HealthKitService
    @Bindable var bluetooth: BluetoothHeartRateService
    let onHealthSnapshot: (HealthSnapshot) -> Void
    @State private var location = TrainingLocationService()
    @State private var weather = TrainingWeatherService()

    var body: some View {
        NavigationStack {
            List {
                Section("Salud y recuperación") {
                    deviceRow("Salud", detail: healthDetail, systemImage: "heart.fill", tint: .red) {
                        Task { await health.requestAccess(); if let snapshot = health.latestSnapshot, snapshot.hasRecoveryMetrics { onHealthSnapshot(snapshot) } }
                    }
                    deviceRow("Apple Watch", detail: appleWatchDetail, systemImage: "applewatch", tint: .blue) {
                        Task { await health.refresh(); if let snapshot = health.latestSnapshot, snapshot.hasRecoveryMetrics { onHealthSnapshot(snapshot) } }
                    }
                }

                Section("Entrenamiento en directo") {
                    deviceRow("Pulsómetro", detail: bluetoothDetail, systemImage: "heart.circle", tint: .orange) {
                        if case .connected = bluetooth.state { bluetooth.disconnect() } else { bluetooth.connect() }
                    }
                } footer: {
                    Text("La banda Bluetooth tiene prioridad durante el entrenamiento. Apple Watch queda como respaldo.")
                }

                Section("Tiempo") {
                    deviceRow("Ubicación de entrenamiento", detail: locationDetail, systemImage: "location", tint: .blue) {
                        location.requestAccess()
                    }
                    deviceRow("Tiempo local", detail: weather.summary, systemImage: "cloud.sun", tint: .blue) {
                        Task { await weather.refresh(for: location.location) }
                    }
                } footer: {
                    Text(weather.trainingAdvice ?? "Usamos tu ubicación solo al preparar un entrenamiento exterior. También podrás elegir una ciudad manualmente.")
                }
            }
            .navigationTitle("Dispositivos")
            .navigationBarTitleDisplayMode(.large)
        }
    }

    private func deviceRow(_ title: String, detail: String, systemImage: String, tint: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Label {
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).foregroundStyle(.primary)
                    Text(detail).font(.footnote).foregroundStyle(.secondary)
                }
            } icon: {
                Image(systemName: systemImage).foregroundStyle(tint).frame(width: 24)
            }
        }
    }

    private var healthDetail: String {
        switch health.state {
        case .ready: "Conectado · métricas actualizadas"
        case .unavailableData: "Esperando datos recientes"
        case .needsAuthorization: "Conectar Salud"
        case .unavailable: "No disponible en este dispositivo"
        case .failed: "No se ha podido actualizar"
        }
    }

    private var appleWatchDetail: String { health.latestSnapshot?.sourceName ?? "Disponible al conectar Salud" }
    private var bluetoothDetail: String {
        if case let .connected(name) = bluetooth.state { return "Conectado · \(name)" }
        return bluetooth.state == .scanning ? "Buscando…" : "Conectar banda Bluetooth"
    }
    private var locationDetail: String { location.hasLocation ? "Usar mi ubicación" : "Permitir al usar la app" }
}
