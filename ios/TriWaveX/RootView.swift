import SwiftUI

struct RootView: View {
    @State private var session: SessionModel
    @State private var email = ""
    @State private var password = ""
    @State private var informationURL: URL?

    init(origin: URL) { _session = State(initialValue: SessionModel(origin: origin)) }

    var body: some View {
        Group {
            if let destination = session.destination {
                ProductView(origin: session.origin, store: session.store, initialPath: destination)
            } else {
                NavigationStack {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 24) {
                            Image(systemName: "figure.triathlon").font(.system(size: 48)).foregroundStyle(.cyan)
                            Text("TriWaveX").font(.largeTitle.bold())
                            Text("Tu entrenamiento, contigo.").font(.title2).foregroundStyle(.secondary)
                            VStack(spacing: 16) {
                                TextField("Correo electrónico", text: $email)
                                    .textContentType(.username).keyboardType(.emailAddress)
                                    .textInputAutocapitalization(.never).autocorrectionDisabled()
                                SecureField("Contraseña", text: $password).textContentType(.password)
                            }.textFieldStyle(.roundedBorder)
                            if let error = session.error { Text(error).foregroundStyle(.orange).accessibilityAddTraits(.updatesFrequently) }
                            Button {
                                Task {
                                    await session.login(email: email.trimmingCharacters(in: .whitespacesAndNewlines), password: password)
                                    if session.destination != nil { password = "" }
                                }
                            } label: {
                                HStack { Spacer(); if session.busy { ProgressView() }; Text("Entrar"); Spacer() }
                            }.buttonStyle(.borderedProminent).controlSize(.large)
                                .disabled(session.busy || email.isEmpty || password.isEmpty)
                            Link("Recuperar contraseña", destination: session.origin.appendingPathComponent("forgot-password"))
                            HStack {
                                Button("Privacidad") { informationURL = session.origin.appendingPathComponent("privacidad") }
                                Spacer()
                                Button("Soporte") { informationURL = session.origin.appendingPathComponent("soporte") }
                            }
                        }.padding(28).frame(maxWidth: 480)
                    }.navigationTitle("Bienvenido").navigationBarTitleDisplayMode(.inline)
                }
            }
        }
        .sheet(isPresented: Binding(get: { informationURL != nil }, set: { if !$0 { informationURL = nil } })) {
            if let informationURL { SafariView(url: informationURL) }
        }
        .tint(.cyan)
    }
}
