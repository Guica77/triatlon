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
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    init(origin: URL) { _session = State(initialValue: SessionModel(origin: origin)) }

    var body: some View {
        Group {
            if let destination = session.destination {
                ProductView(origin: session.origin, store: session.store, initialPath: destination, onDismiss: nil)
                    .transition(.opacity)
            } else {
                NavigationStack {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 24) {
                            VStack(spacing: 12) {
                                Text("TU ESPACIO DE ENTRENAMIENTO")
                                    .font(.caption2.weight(.bold))
                                    .tracking(1.2)
                                    .foregroundStyle(Color.triWaveXAqua)
                                TriWaveXMark()
                                    .frame(width: 72, height: 72)
                                    .padding(.top, 2)
                                Text("TriWaveX").font(.system(size: 34, weight: .bold, design: .rounded)).tracking(-0.8)
                                Text("Entrena con un plan que se mueve contigo.")
                                    .font(.subheadline).foregroundStyle(Color.white.opacity(0.64))
                            }
                            .multilineTextAlignment(.center)
                            .frame(maxWidth: .infinity)
                            .padding(.top, 28)
                            VStack(alignment: .leading, spacing: 10) {
                                Text("QUIERO ENTRAR COMO")
                                    .font(.caption2.weight(.bold))
                                    .tracking(0.9)
                                    .foregroundStyle(.white.opacity(0.48))
                                rolePicker
                            }
                            credentialFields
                            if let error = session.error {
                                Label(error, systemImage: "exclamationmark.triangle.fill")
                                    .font(.footnote.weight(.medium))
                                    .foregroundStyle(Color.triWaveXCoral)
                                    .accessibilityAddTraits(.updatesFrequently)
                            }
                            Button {
                                Task {
                                    await session.login(email: email.trimmingCharacters(in: .whitespacesAndNewlines), password: password)
                                    if session.destination != nil { password = "" }
                                }
                            } label: {
                                HStack { Spacer(); if session.busy { ProgressView() }; Text("Entrar como \(role.title.lowercased())"); Spacer() }
                            }
                            .buttonStyle(TriWaveXPrimaryButtonStyle(tint: role == .athlete ? .triWaveXAqua : .triWaveXLime))
                            .disabled(session.busy || email.isEmpty || password.isEmpty)
                            HStack(spacing: 12) {
                                Rectangle().fill(.white.opacity(0.10)).frame(height: 1)
                                Text("O CONTINÚA CON").font(.caption2.weight(.semibold)).tracking(0.8).foregroundStyle(.white.opacity(0.46))
                                Rectangle().fill(.white.opacity(0.10)).frame(height: 1)
                            }
                            HStack(spacing: 12) {
                                SignInWithAppleButton(.signIn) { request in
                                    session.prepareAppleRequest(request)
                                } onCompletion: { result in
                                    Task { await session.handleAppleCompletion(result, role: role.rawValue) }
                                }
                                .signInWithAppleButtonStyle(.white)
                                .frame(maxWidth: .infinity, minHeight: 46)
                                .clipShape(Capsule())
                                .shadow(color: .black.opacity(0.16), radius: 8, y: 3)
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
                                .buttonStyle(TriWaveXSecondaryButtonStyle())
                                .disabled(session.busy)
                                .accessibilityLabel("Continuar con Google")
                            }
                            Link("Recuperar contraseña", destination: session.origin.appendingPathComponent("forgot-password"))
                                .font(.footnote.weight(.semibold)).foregroundStyle(Color(red: 0.47, green: 0.78, blue: 1))
                            HStack {
                                Button("Privacidad") { informationURL = session.origin.appendingPathComponent("privacidad") }
                                    .buttonStyle(TriWaveXTextButtonStyle(tint: .triWaveXAqua))
                                Spacer()
                                Button("Soporte") { informationURL = session.origin.appendingPathComponent("soporte") }
                                    .buttonStyle(TriWaveXTextButtonStyle(tint: .triWaveXAqua))
                            }
                        }
                        .padding(.horizontal, 24)
                        .padding(.top, 34)
                        .padding(.bottom, 30)
                        .frame(maxWidth: 520)
                    }
                    .background(LinearGradient(colors: [.triWaveXInk, .triWaveXSurface], startPoint: .topLeading, endPoint: .bottomTrailing).ignoresSafeArea())
                    .toolbar(.hidden, for: .navigationBar)
                }
            }
        }
        .sheet(isPresented: Binding(get: { informationURL != nil }, set: { if !$0 { informationURL = nil } })) {
            if let informationURL {
                ProductView(origin: session.origin, store: session.store, initialPath: informationURL.path, onDismiss: { self.informationURL = nil })
            }
        }
        .tint(.triWaveXAqua)
        .animation(reduceMotion ? nil : .easeInOut(duration: 0.22), value: session.destination)
    }

    private var rolePicker: some View {
        HStack(spacing: 4) {
            ForEach([Role.athlete, .coach], id: \.self) { option in
                Button {
                    withAnimation(reduceMotion ? nil : .spring(response: 0.34, dampingFraction: 0.86)) { role = option }
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
                .buttonStyle(TriWaveXSelectionButtonStyle())
                .accessibilityAddTraits(role == option ? .isSelected : [])
            }
        }
        .padding(4).background(.white.opacity(0.10), in: Capsule())
        .overlay(Capsule().stroke(.white.opacity(0.08), lineWidth: 1))
    }

    private var credentialFields: some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                Image(systemName: "envelope")
                    .foregroundStyle(Color.triWaveXAqua)
                    .frame(width: 18)
                TextField("Correo electrónico", text: $email)
                    .textContentType(.username)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .foregroundStyle(.white)
            }
            .padding(.horizontal, 16)
            .frame(minHeight: 54)
            Divider().overlay(.white.opacity(0.10)).padding(.leading, 46)
            HStack(spacing: 12) {
                Image(systemName: "lock")
                    .foregroundStyle(Color.triWaveXAqua)
                    .frame(width: 18)
                SecureField("Contraseña", text: $password)
                    .textContentType(.password)
                    .foregroundStyle(.white)
            }
            .padding(.horizontal, 16)
            .frame(minHeight: 54)
        }
        .tint(role == .athlete ? .triWaveXAqua : .triWaveXLime)
        .background(Color.triWaveXChrome.opacity(0.74), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).stroke(.white.opacity(0.12), lineWidth: 1))
    }
}

extension Color {
    static let triWaveXInk = Color(red: 0.025, green: 0.055, blue: 0.075)
    static let triWaveXSurface = Color(red: 0.045, green: 0.105, blue: 0.13)
    static let triWaveXChrome = Color(red: 0.075, green: 0.12, blue: 0.145)
    static let triWaveXAqua = Color(red: 0.47, green: 0.78, blue: 1)
    static let triWaveXLime = Color(red: 0.72, green: 0.95, blue: 0.42)
    static let triWaveXCoral = Color(red: 1, green: 0.54, blue: 0.45)
}

@MainActor
struct TriWaveXPrimaryButtonStyle: ButtonStyle {
    typealias Body = AnyView
    let tint: Color
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    @preconcurrency @MainActor @ViewBuilder
    func makeBody(configuration: Self.Configuration) -> Self.Body {
        AnyView(configuration.label
            .font(.body.weight(.semibold))
            .foregroundStyle(.black.opacity(configuration.isPressed ? 0.76 : 0.92))
            .frame(maxWidth: .infinity, minHeight: 52)
            .background(tint, in: Capsule())
            .overlay(Capsule().stroke(.white.opacity(0.42), lineWidth: 1))
            .shadow(color: tint.opacity(configuration.isPressed ? 0.14 : 0.28), radius: configuration.isPressed ? 3 : 10, y: configuration.isPressed ? 1 : 5)
            .scaleEffect(reduceMotion || !configuration.isPressed ? 1 : 0.975)
            .brightness(configuration.isPressed ? -0.04 : 0)
            .animation(reduceMotion ? nil : .spring(response: 0.22, dampingFraction: 0.8), value: configuration.isPressed))
    }
}

@MainActor
struct TriWaveXSecondaryButtonStyle: ButtonStyle {
    typealias Body = AnyView
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    @preconcurrency @MainActor @ViewBuilder
    func makeBody(configuration: Self.Configuration) -> Self.Body {
        AnyView(configuration.label
            .foregroundStyle(.white.opacity(configuration.isPressed ? 0.72 : 0.92))
            .frame(maxWidth: .infinity, minHeight: 46)
            .background(.white.opacity(configuration.isPressed ? 0.13 : 0.09), in: Capsule())
            .overlay(Capsule().stroke(.white.opacity(0.18), lineWidth: 1))
            .scaleEffect(reduceMotion || !configuration.isPressed ? 1 : 0.975)
            .animation(reduceMotion ? nil : .spring(response: 0.2, dampingFraction: 0.82), value: configuration.isPressed))
    }
}

@MainActor
struct TriWaveXSelectionButtonStyle: ButtonStyle {
    typealias Body = AnyView
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    @preconcurrency @MainActor @ViewBuilder
    func makeBody(configuration: Self.Configuration) -> Self.Body {
        AnyView(configuration.label
            .contentShape(Capsule())
            .scaleEffect(reduceMotion || !configuration.isPressed ? 1 : 0.98)
            .opacity(configuration.isPressed ? 0.84 : 1)
            .animation(reduceMotion ? nil : .easeOut(duration: 0.16), value: configuration.isPressed))
    }
}

@MainActor
struct TriWaveXTextButtonStyle: ButtonStyle {
    typealias Body = AnyView
    let tint: Color
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    @preconcurrency @MainActor @ViewBuilder
    func makeBody(configuration: Self.Configuration) -> Self.Body {
        AnyView(configuration.label
            .font(.footnote.weight(.semibold))
            .foregroundStyle(tint.opacity(configuration.isPressed ? 0.64 : 1))
            .padding(.vertical, 6)
            .scaleEffect(reduceMotion || !configuration.isPressed ? 1 : 0.98)
            .animation(reduceMotion ? nil : .easeOut(duration: 0.14), value: configuration.isPressed))
    }
}

struct TriWaveXMark: View {
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
