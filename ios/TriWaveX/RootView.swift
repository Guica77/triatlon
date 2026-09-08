import SwiftUI

struct RootView: View {
    private enum Role: String { case athlete, coach
        var title: String { self == .athlete ? "Atleta" : "Entrenador" }
        var icon: String { self == .athlete ? "figure.run" : "figure.outdoor.cycle" }
    }
    @State private var session: SessionModel
    @State private var email = ""
    @State private var password = ""
    @State private var informationURL: URL?
    @State private var role: Role = .athlete
    @Namespace private var roleSelection

    init(origin: URL) { _session = State(initialValue: SessionModel(origin: origin)) }

    var body: some View {
        Group {
            if let destination = session.destination {
                ProductView(origin: session.origin, store: session.store, initialPath: destination)
            } else {
                NavigationStack {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 22) {
                            VStack(alignment: .leading, spacing: 8) {
                                HStack(spacing: 8) {
                                    Circle().fill(Color(red: 0.47, green: 0.78, blue: 1)).frame(width: 9, height: 9)
                                    Circle().fill(Color(red: 0.72, green: 0.95, blue: 0.42)).frame(width: 9, height: 9)
                                    Circle().fill(Color(red: 1, green: 0.54, blue: 0.45)).frame(width: 9, height: 9)
                                }
                                Text("TriWaveX").font(.system(size: 38, weight: .bold, design: .rounded)).tracking(-1)
                                Text("Entrena con un plan que se mueve contigo.")
                                    .font(.body).foregroundStyle(Color.white.opacity(0.66))
                            }.padding(.top, 24)
                            rolePicker
                            VStack(spacing: 14) {
                                TextField("Correo electrónico", text: $email)
                                    .textContentType(.username).keyboardType(.emailAddress)
                                    .textInputAutocapitalization(.never).autocorrectionDisabled()
                                SecureField("Contraseña", text: $password).textContentType(.password)
                            }
                            .textFieldStyle(.roundedBorder)
                            .tint(role == .athlete ? Color(red: 0.47, green: 0.78, blue: 1) : Color(red: 0.72, green: 0.95, blue: 0.42))
                            if let error = session.error { Text(error).font(.footnote.weight(.medium)).foregroundStyle(Color(red: 1, green: 0.54, blue: 0.45)).accessibilityAddTraits(.updatesFrequently) }
                            Button {
                                Task {
                                    await session.login(email: email.trimmingCharacters(in: .whitespacesAndNewlines), password: password)
                                    if session.destination != nil { password = "" }
                                }
                            } label: {
                                HStack { Spacer(); if session.busy { ProgressView() }; Text("Entrar como \(role.title.lowercased())"); Spacer() }
                            }
                            .buttonStyle(.borderedProminent).controlSize(.large)
                            .tint(role == .athlete ? Color(red: 0.47, green: 0.78, blue: 1) : Color(red: 0.72, green: 0.95, blue: 0.42))
                                .disabled(session.busy || email.isEmpty || password.isEmpty)
                            HStack { Rectangle().fill(.white.opacity(0.12)).frame(height: 1); Text("o continúa con").font(.caption).foregroundStyle(.secondary); Rectangle().fill(.white.opacity(0.12)).frame(height: 1) }
                            HStack(spacing: 12) {
                                Button {
                                    session.beginOAuth(.apple, role: role.rawValue)
                                } label: {
                                    Label("Continuar con Apple", systemImage: "apple.logo")
                                        .frame(maxWidth: .infinity, minHeight: 44)
                                }
                                .buttonStyle(.bordered)
                                .tint(.white)
                                .foregroundStyle(.primary)
                                .disabled(session.busy)
                                Button {
                                    session.beginOAuth(.google, role: role.rawValue)
                                } label: {
                                    HStack(spacing: 4) {
                                        Text("G").font(.headline.weight(.bold))
                                        Text("Google")
                                    }
                                }
                                .buttonStyle(.bordered)
                                .frame(minHeight: 44)
                                .disabled(session.busy)
                                .accessibilityLabel("Continuar con Google")
                            }
                            Link("Recuperar contraseña", destination: session.origin.appendingPathComponent("forgot-password"))
                                .font(.footnote.weight(.semibold)).foregroundStyle(Color(red: 0.47, green: 0.78, blue: 1))
                            HStack {
                                Button("Privacidad") { informationURL = session.origin.appendingPathComponent("privacidad") }
                                Spacer()
                                Button("Soporte") { informationURL = session.origin.appendingPathComponent("soporte") }
                            }
                        }.padding(.horizontal, 24).padding(.bottom, 28).frame(maxWidth: 520)
                    }
                    .background(LinearGradient(colors: [Color(red: 0.04, green: 0.08, blue: 0.11), Color(red: 0.06, green: 0.14, blue: 0.17)], startPoint: .topLeading, endPoint: .bottomTrailing).ignoresSafeArea())
                    .navigationTitle("Bienvenido").navigationBarTitleDisplayMode(.inline)
                }
            }
        }
        .sheet(isPresented: Binding(get: { informationURL != nil }, set: { if !$0 { informationURL = nil } })) {
            if let informationURL { SafariView(url: informationURL) }
        }
        .tint(.cyan)
    }

    private var rolePicker: some View {
        HStack(spacing: 4) {
            ForEach([Role.athlete, .coach], id: \.self) { option in
                Button {
                    withAnimation(.spring(response: 0.36, dampingFraction: 0.88)) { role = option }
                } label: {
                    HStack(spacing: 7) {
                        Image(systemName: option.icon).font(.subheadline.weight(.semibold))
                        Text(option.title).font(.subheadline.weight(.semibold))
                    }
                    .foregroundStyle(role == option ? Color.black : Color.white.opacity(0.68))
                    .frame(maxWidth: .infinity, minHeight: 46)
                    .background {
                        if role == option {
                            Capsule().fill(option == .athlete ? Color(red: 0.47, green: 0.78, blue: 1) : Color(red: 0.72, green: 0.95, blue: 0.42))
                                .matchedGeometryEffect(id: "role-selection", in: roleSelection)
                        }
                    }
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(role == option ? .isSelected : [])
            }
        }
        .padding(4).background(.white.opacity(0.10), in: Capsule())
        .overlay(Capsule().stroke(.white.opacity(0.08), lineWidth: 1))
    }
}
