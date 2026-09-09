import AuthenticationServices
import SwiftUI

struct RootView: View {
    private enum Role: String, CaseIterable {
        case athlete
        case coach

        var title: String {
            self == .athlete ? "Atleta" : "Entrenador"
        }

        var icon: String {
            self == .athlete ? "figure.run" : "figure.outdoor.cycle"
        }

        var tint: Color {
            self == .athlete ? .triWaveXAqua : .triWaveXLime
        }
    }

    private enum FocusedField {
        case email
        case password
    }

    @State private var session: SessionModel
    @State private var email = ""
    @State private var password = ""
    @State private var informationURL: URL?
    @State private var role: Role = .athlete
    @Namespace private var roleSelection
    @FocusState private var focusedField: FocusedField?
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    init(origin: URL) {
        _session = State(initialValue: SessionModel(origin: origin))
    }

    var body: some View {
        Group {
            if let destination = session.destination {
                ProductView(
                    origin: session.origin,
                    store: session.store,
                    initialPath: destination,
                    onDismiss: nil
                )
                .transition(.opacity)
            } else {
                loginView
            }
        }
        .sheet(
            isPresented: Binding(
                get: { informationURL != nil },
                set: { if !$0 { informationURL = nil } }
            )
        ) {
            if let informationURL {
                ProductView(
                    origin: session.origin,
                    store: session.store,
                    initialPath: informationURL.path,
                    onDismiss: { self.informationURL = nil }
                )
            }
        }
        .tint(.triWaveXAqua)
        .animation(TriWaveXMotion.stateChange(reduced: reduceMotion), value: session.destination)
        .preferredColorScheme(.dark)
    }

    private var loginView: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    branding
                    roleSection
                    credentialFields

                    if let error = session.error {
                        Label(error, systemImage: "exclamationmark.triangle.fill")
                            .font(.footnote.weight(.medium))
                            .foregroundStyle(Color.triWaveXCoral)
                            .accessibilityLabel("Error: \(error)")
                            .accessibilityAddTraits(.isStaticText)
                    }

                    Button(action: login) {
                        HStack(spacing: 10) {
                            if session.busy {
                                ProgressView()
                                    .tint(.black.opacity(0.72))
                            }
                            Text("Entrar como \(role.title.lowercased())")
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(TriWaveXPrimaryButtonStyle(tint: role.tint))
                    .disabled(!canSubmit || session.busy)
                    .accessibilityHint(session.busy ? "Iniciando sesión" : "Doble toque para iniciar sesión")

                    alternativeSignIn
                    accountLinks
                }
                .padding(.horizontal, 24)
                .padding(.top, 34)
                .padding(.bottom, 30)
                .frame(maxWidth: TriWaveXMetrics.contentMaximumWidth)
                .frame(maxWidth: .infinity)
            }
            .scrollDismissesKeyboard(.interactively)
            .background(Color.triWaveXBackground.ignoresSafeArea())
            .toolbar(.hidden, for: .navigationBar)
        }
    }

    private var branding: some View {
        VStack(spacing: 12) {
            Text("TU ESPACIO DE ENTRENAMIENTO")
                .font(.caption2.weight(.bold))
                .tracking(1.2)
                .foregroundStyle(Color.triWaveXAqua)

            TriWaveXMark()
                .frame(width: 72, height: 72)
                .padding(.top, 2)
                .accessibilityHidden(true)

            Text("TriWaveX")
                .font(.system(.largeTitle, design: .rounded).weight(.bold))
                .tracking(-0.8)

            Text("Entrena con un plan que se mueve contigo.")
                .font(.subheadline)
                .foregroundStyle(Color.white.opacity(0.64))
        }
        .multilineTextAlignment(.center)
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("TriWaveX. Tu espacio de entrenamiento. Entrena con un plan que se mueve contigo.")
    }

    private var roleSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            TriWaveXSectionLabel(text: "Quiero entrar como")
            rolePicker
        }
    }

    private var rolePicker: some View {
        HStack(spacing: 4) {
            ForEach(Role.allCases, id: \.self) { option in
                Button {
                    withAnimation(TriWaveXMotion.selection(reduced: reduceMotion)) {
                        role = option
                    }
                } label: {
                    HStack(spacing: 7) {
                        Image(systemName: option.icon)
                            .font(.subheadline.weight(.semibold))
                        Text(option.title)
                            .font(.subheadline.weight(.semibold))
                    }
                    .foregroundStyle(role == option ? Color.black : Color.white.opacity(0.68))
                    .frame(maxWidth: .infinity, minHeight: TriWaveXMetrics.compactControlHeight)
                    .background {
                        if role == option {
                            Capsule()
                                .fill(option.tint)
                                .matchedGeometryEffect(id: "role-selection", in: roleSelection)
                        }
                    }
                }
                .buttonStyle(TriWaveXSelectionButtonStyle())
                .accessibilityLabel(option.title)
                .accessibilityValue(role == option ? "Seleccionado" : "No seleccionado")
                .accessibilityAddTraits(role == option ? .isSelected : [])
            }
        }
        .padding(4)
        .background(Color.triWaveXChrome, in: Capsule())
        .overlay(Capsule().stroke(.white.opacity(0.10), lineWidth: 1))
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Tipo de cuenta")
    }

    private var credentialFields: some View {
        TriWaveXSurface(padding: 0) {
            VStack(spacing: 0) {
                HStack(spacing: 12) {
                    Image(systemName: "envelope")
                        .foregroundStyle(role.tint)
                        .frame(width: 18)
                        .accessibilityHidden(true)

                    TextField("Correo electrónico", text: $email)
                        .textContentType(.username)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .submitLabel(.next)
                        .focused($focusedField, equals: .email)
                        .onSubmit { focusedField = .password }
                        .foregroundStyle(.white)
                        .accessibilityLabel("Correo electrónico")
                }
                .padding(.horizontal, 16)
                .frame(minHeight: TriWaveXMetrics.controlHeight)

                Divider()
                    .overlay(.white.opacity(0.10))
                    .padding(.leading, 46)

                HStack(spacing: 12) {
                    Image(systemName: "lock")
                        .foregroundStyle(role.tint)
                        .frame(width: 18)
                        .accessibilityHidden(true)

                    SecureField("Contraseña", text: $password)
                        .textContentType(.password)
                        .submitLabel(.go)
                        .focused($focusedField, equals: .password)
                        .onSubmit { if canSubmit { login() } }
                        .foregroundStyle(.white)
                        .accessibilityLabel("Contraseña")
                }
                .padding(.horizontal, 16)
                .frame(minHeight: TriWaveXMetrics.controlHeight)
            }
        }
        .tint(role.tint)
    }

    private var alternativeSignIn: some View {
        VStack(spacing: 12) {
            HStack(spacing: 12) {
                Rectangle()
                    .fill(.white.opacity(0.10))
                    .frame(height: 1)
                Text("CONTINÚA CON")
                    .font(.caption2.weight(.semibold))
                    .tracking(0.8)
                    .lineLimit(1)
                    .layoutPriority(1)
                    .foregroundStyle(.white.opacity(0.46))
                Rectangle()
                    .fill(.white.opacity(0.10))
                    .frame(height: 1)
            }

            HStack(spacing: 12) {
                SignInWithAppleButton(.signIn) { request in
                    session.prepareAppleRequest(request)
                } onCompletion: { result in
                    Task { await session.handleAppleCompletion(result, role: role.rawValue) }
                }
                .signInWithAppleButtonStyle(.white)
                .frame(maxWidth: .infinity, minHeight: TriWaveXMetrics.compactControlHeight)
                .clipShape(Capsule())
                .shadow(color: .black.opacity(0.16), radius: 8, y: 3)
                .disabled(session.busy)
                .accessibilityLabel("Continuar con Apple")

                Button {
                    session.error = "Estamos terminando la conexión segura de Google. Apple ya usa el acceso nativo."
                } label: {
                    HStack(spacing: 4) {
                        Text("G")
                            .font(.headline.weight(.bold))
                        Text("Google")
                    }
                    .font(.subheadline.weight(.semibold))
                    .frame(maxWidth: .infinity, minHeight: TriWaveXMetrics.compactControlHeight)
                }
                .buttonStyle(TriWaveXSecondaryButtonStyle())
                .disabled(session.busy)
                .accessibilityLabel("Continuar con Google")
                .accessibilityHint("No disponible todavía")
            }
        }
    }

    private var accountLinks: some View {
        VStack(spacing: 4) {
            Link("Recuperar contraseña", destination: session.origin.appendingPathComponent("forgot-password"))
                .font(.footnote.weight(.semibold))
                .frame(minHeight: TriWaveXMetrics.minimumTouchTarget)
                .foregroundStyle(Color.triWaveXAqua)

            HStack {
                Button("Privacidad") {
                    informationURL = session.origin.appendingPathComponent("privacidad")
                }
                .buttonStyle(TriWaveXTextButtonStyle(tint: .triWaveXAqua))

                Spacer()

                Button("Soporte") {
                    informationURL = session.origin.appendingPathComponent("soporte")
                }
                .buttonStyle(TriWaveXTextButtonStyle(tint: .triWaveXAqua))
            }
        }
    }

    private var canSubmit: Bool {
        !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !password.isEmpty
    }

    private func login() {
        guard canSubmit, !session.busy else { return }
        focusedField = nil
        Task {
            await session.login(
                email: email.trimmingCharacters(in: .whitespacesAndNewlines),
                password: password
            )
            if session.destination != nil {
                password = ""
            }
        }
    }
}
