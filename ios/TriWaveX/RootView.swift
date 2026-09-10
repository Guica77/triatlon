import AuthenticationServices
import SwiftUI

struct RootView: View {
    private enum Role: String, CaseIterable {
        case athlete
        case coach

        var title: String {
            self == .athlete ? "Atleta" : "Entrenador"
        }

        var tint: Color {
            .triWaveXPrimaryAccent
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
                        Text(error)
                            .font(.footnote.weight(.medium))
                            .foregroundStyle(Color.triWaveXError)
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
        Text("TriWaveX")
            .font(.system(.largeTitle, design: .default).weight(.semibold))
            .frame(maxWidth: .infinity)
            .accessibilityLabel("TriWaveX")
    }

    private var roleSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            TriWaveXSectionLabel(text: "Quiero entrar como")
            rolePicker
        }
    }

    private var rolePicker: some View {
        HStack(spacing: 0) {
            ForEach(Role.allCases, id: \.self) { option in
                Button {
                    withAnimation(TriWaveXMotion.selection(reduced: reduceMotion)) {
                        role = option
                    }
                } label: {
                    Text(option.title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(role == option ? .white : .white.opacity(0.62))
                        .frame(maxWidth: .infinity, minHeight: TriWaveXMetrics.compactControlHeight)
                        .background(
                            role == option ? Color.white.opacity(0.14) : .clear,
                            in: RoundedRectangle(cornerRadius: TriWaveXMetrics.controlRadius, style: .continuous)
                        )
                }
                .buttonStyle(TriWaveXSelectionButtonStyle())
                .accessibilityLabel(option.title)
                .accessibilityValue(role == option ? "Seleccionado" : "No seleccionado")
                .accessibilityAddTraits(role == option ? .isSelected : [])
            }
        }
        .padding(2)
        .background(Color.triWaveXSurface, in: RoundedRectangle(cornerRadius: TriWaveXMetrics.controlRadius, style: .continuous))
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Tipo de cuenta")
    }

    private var credentialFields: some View {
        TriWaveXSurface(padding: 0) {
            VStack(spacing: 0) {
                HStack(spacing: 12) {
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
                    .padding(.leading, 16)

                HStack(spacing: 12) {
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
                Text("O también")
                    .font(.footnote)
                    .foregroundStyle(.white.opacity(0.52))
                Rectangle()
                    .fill(.white.opacity(0.10))
                    .frame(height: 1)
            }

            VStack(spacing: 10) {
                SignInWithAppleButton(.signIn) { request in
                    session.prepareAppleRequest(request)
                } onCompletion: { result in
                    Task { await session.handleAppleCompletion(result, role: role.rawValue) }
                }
                .signInWithAppleButtonStyle(.white)
                .frame(maxWidth: .infinity, minHeight: TriWaveXMetrics.compactControlHeight)
                .clipShape(RoundedRectangle(cornerRadius: TriWaveXMetrics.controlRadius, style: .continuous))
                .disabled(session.busy)
                .accessibilityLabel("Continuar con Apple")

                Text("Google todavía no está disponible")
                    .font(.footnote)
                    .foregroundStyle(.white.opacity(0.5))
                    .frame(minHeight: TriWaveXMetrics.minimumTouchTarget)
                    .multilineTextAlignment(.center)
                    .accessibilityLabel("Google todavía no está disponible")
                    .accessibilityAddTraits(.isStaticText)
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
