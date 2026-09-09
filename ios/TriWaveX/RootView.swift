import AuthenticationServices
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
                ProductView(origin: session.origin, store: session.store, initialPath: destination, onDismiss: nil)
            } else {
                NavigationStack {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 22) {
                            VStack(spacing: 10) {
                                Text("Bienvenido")
                                    .font(.headline.weight(.semibold))
                                    .foregroundStyle(.white.opacity(0.9))
                                TriWaveXMark()
                                    .frame(width: 64, height: 64)
                                    .padding(.top, 8)
                                HStack(spacing: 8) {
                                    Circle().fill(Color(red: 0.47, green: 0.78, blue: 1)).frame(width: 9, height: 9)
                                    Circle().fill(Color(red: 0.72, green: 0.95, blue: 0.42)).frame(width: 9, height: 9)
                                    Circle().fill(Color(red: 1, green: 0.54, blue: 0.45)).frame(width: 9, height: 9)
                                }
                                Text("TriWaveX").font(.system(size: 38, weight: .bold, design: .rounded)).tracking(-1)
                                Text("Entrena con un plan que se mueve contigo.")
                                    .font(.body).foregroundStyle(Color.white.opacity(0.66))
                            }
                            .multilineTextAlignment(.center)
                            .frame(maxWidth: .infinity)
                            .padding(.top, 28)
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
                                SignInWithAppleButton(.signIn) { request in
                                    session.prepareAppleRequest(request)
                                } onCompletion: { result in
                                    Task { await session.handleAppleCompletion(result, role: role.rawValue) }
                                }
                                .signInWithAppleButtonStyle(.white)
                                .frame(maxWidth: .infinity, minHeight: 46)
                                .clipShape(Capsule())
                                .disabled(session.busy)
                                Button {
                                    session.error = "Estamos terminando la conexión segura de Google. Apple ya usa el acceso nativo."
                                } label: {
                                    HStack(spacing: 4) {
                                        Text("G").font(.headline.weight(.bold))
                                        Text("Google")
                                    }
                                    .font(.subheadline.weight(.semibold))
                                    .frame(maxWidth: .infinity, minHeight: 46)
                                }
                                .buttonStyle(.bordered)
                                .tint(.white.opacity(0.28))
                                .foregroundStyle(.white)
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
                    .toolbar(.hidden, for: .navigationBar)
                }
            }
        }
        .sheet(isPresented: Binding(get: { informationURL != nil }, set: { if !$0 { informationURL = nil } })) {
            if let informationURL {
                ProductView(origin: session.origin, store: session.store, initialPath: informationURL.path, onDismiss: { self.informationURL = nil })
            }
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

private struct TriWaveXMark: View {
    var body: some View {
        Canvas { context, size in
            let stroke = StrokeStyle(lineWidth: size.width * 0.085, lineCap: .round)
            let color = Color(red: 0.72, green: 0.95, blue: 0.42)
            let waves = [
                (0.23, 0.49, 0.74, 0.29),
                (0.23, 0.64, 0.82, 0.43),
                (0.23, 0.79, 0.88, 0.57)
            ]
            for (startX, startY, endX, endY) in waves {
                var path = Path()
                path.move(to: CGPoint(x: size.width * startX, y: size.height * startY))
                path.addCurve(
                    to: CGPoint(x: size.width * endX, y: size.height * endY),
                    control1: CGPoint(x: size.width * 0.42, y: size.height * 0.11),
                    control2: CGPoint(x: size.width * 0.65, y: size.height * 0.26)
                )
                context.stroke(path, with: .color(color), style: stroke)
            }
        }
        .background(Color(red: 0.04, green: 0.08, blue: 0.11), in: RoundedRectangle(cornerRadius: 20))
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.white.opacity(0.1), lineWidth: 1))
        .accessibilityLabel("Símbolo TriWaveX")
    }
}
