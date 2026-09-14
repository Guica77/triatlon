import SwiftUI

struct ProfileMenuView: View {
    let openWeb: (String) -> Void
    let openDevices: () -> Void

    var body: some View {
        List {
            Section {
                NavigationLink {
                    ProfileIdentityView(openWeb: openWeb)
                } label: {
                    Label("Mi perfil", systemImage: "person.crop.circle")
                }
            }

            Section("Entrenamiento") {
                row("Objetivo y plan", systemImage: "flag.checkered", tint: .orange) { openWeb("/settings?section=plan") }
                row("Fisiología y zonas", systemImage: "heart.text.square", tint: .red) { openWeb("/settings?section=fisiologia") }
                row("Lesiones e historial", systemImage: "cross.case", tint: .orange) { openWeb("/settings?section=lesiones") }
            }

            Section("Conexiones") {
                row("Dispositivos", systemImage: "applewatch", tint: .blue, detail: "Salud, Apple Watch y pulsómetro") { openDevices() }
                row("Strava", systemImage: "figure.run", tint: .orange, detail: "Actividades y métricas") { openWeb("/settings?section=dispositivos") }
            }

            Section("Preferencias") {
                row("Nutrición e hidratación", systemImage: "drop", tint: .cyan) { openWeb("/settings?section=nutricion") }
                row("Notificaciones", systemImage: "bell", tint: .red) { openWeb("/settings?section=notificaciones") }
                row("Clima", systemImage: "cloud.sun", tint: .blue) { openWeb("/settings?section=clima") }
            }

            Section("Datos y cuenta") {
                row("Exportar datos", systemImage: "square.and.arrow.up", tint: .blue) { openWeb("/settings?section=exportar") }
                row("Privacidad y ayuda", systemImage: "hand.raised", tint: .indigo) { openWeb("/settings?section=privacidad") }
                row("Cuenta y suscripción", systemImage: "person.text.rectangle", tint: .gray) { openWeb("/settings?section=cuenta") }
            }
        }
        .navigationTitle("Perfil")
        .navigationBarTitleDisplayMode(.large)
    }

    private func row(_ title: String, systemImage: String, tint: Color, detail: String? = nil, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Label {
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).foregroundStyle(.primary)
                    if let detail { Text(detail).font(.footnote).foregroundStyle(.secondary) }
                }
            } icon: {
                Image(systemName: systemImage).foregroundStyle(tint).frame(width: 24)
            }
        }
    }
}

private struct ProfileIdentityView: View {
    let openWeb: (String) -> Void

    var body: some View {
        List {
            Section {
                Label("Tus datos de atleta", systemImage: "person.text.rectangle")
            } footer: {
                Text("Edita tu identidad deportiva y tus preferencias desde la web segura de TriWaveX.")
            }

            Section {
                Button("Editar perfil") { openWeb("/settings") }
            }
        }
        .navigationTitle("Mi perfil")
        .navigationBarTitleDisplayMode(.inline)
    }
}
