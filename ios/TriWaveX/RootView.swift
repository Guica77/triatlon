import AuthenticationServices
import SwiftUI

struct RootView: View {
    private enum Role: String, CaseIterable {
        case athlete
        case coach

        var title: String {
            self == .athlete ? "Atleta" : "Entrenador"
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
                    onDismiss: nil,
                    onSessionEnded: { Task { await session.endSession() } }
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
                    onDismiss: { self.informationURL = nil },
                    onSessionEnded: { informationURL = nil; Task { await session.endSession() } }
                )
            }
        }
        .tint(.triWaveXAqua)
        .animation(TriWaveXMotion.stateChange(reduced: reduceMotion), value: session.destination)
    }

    private var loginView: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    branding
                        .padding(.bottom, 30)

                    loginSectionTitle("Tipo de cuenta")
                    Picker("Tipo de cuenta", selection: $role) {
                        ForEach(Role.allCases, id: \.self) { option in
                            Text(option.title).tag(option)
                        }
                    }
                    .pickerStyle(.segmented)
                    .font(.headline)
                    .padding(8)
                    .background(loginSurface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                    .accessibilityLabel("Tipo de cuenta")
                    .disabled(session.busy)

                    loginSectionTitle("Acceso")
                    loginSurfaceGroup {
                        TextField("Correo electrónico", text: $email)
                            .textContentType(.username)
                            .keyboardType(.emailAddress)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .submitLabel(.next)
                            .focused($focusedField, equals: .email)
                            .onSubmit { focusedField = .password }
                            .accessibilityLabel("Correo electrónico")
                            .frame(minHeight: 52)
                            .font(.system(size: 18))

                        Divider()

                        SecureField("Contraseña", text: $password)
                            .textContentType(.password)
                            .submitLabel(.go)
                            .focused($focusedField, equals: .password)
                            .onSubmit { if canSubmit { login() } }
                            .accessibilityLabel("Contraseña")
                            .frame(minHeight: 52)
                            .font(.system(size: 18))

                        if let error = session.error {
                            Divider()
                            Label(error, systemImage: "exclamationmark.triangle.fill")
                                .font(.footnote.weight(.medium))
                                .foregroundStyle(.red)
                                .fixedSize(horizontal: false, vertical: true)
                                .accessibilityLabel("Error: \(error)")
                        }
                    }

                    Button {
                        login()
                    } label: {
                        HStack(spacing: 8) {
                            if session.busy { ProgressView() }
                            Text("Entrar como \(role.title.lowercased())")
                        }
                        .font(.system(size: 18, weight: .bold))
                        .frame(maxWidth: .infinity, minHeight: TriWaveXMetrics.minimumTouchTarget)
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                    .padding(.top, 14)
                    .disabled(!canSubmit || session.busy)
                    .accessibilityHint(session.busy ? "Iniciando sesión" : "Doble toque para iniciar sesión")

                    Link(destination: session.origin.appendingPathComponent("forgot-password")) {
                        Text("¿Has olvidado la contraseña?")
                            .frame(maxWidth: .infinity, minHeight: TriWaveXMetrics.minimumTouchTarget)
                    }
                    .font(.subheadline)
                    .padding(.top, 8)

                    Text("Otra forma de entrar")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity)
                        .padding(.top, 24)
                        .padding(.bottom, 12)

                    SignInWithAppleButton(.continue) { request in
                        session.prepareAppleRequest(request)
                    } onCompletion: { result in
                        Task { await session.handleAppleCompletion(result, role: role.rawValue) }
                    }
                    .signInWithAppleButtonStyle(.black)
                    .frame(maxWidth: .infinity)
                    .frame(height: 50)
                    .disabled(session.busy)
                    .accessibilityHint("Usa tu cuenta de Apple para iniciar sesión")
                    .opacity(session.busy ? 0.7 : 1)

                    VStack(spacing: 8) {
                        Text("¿Nuevo en TriWaveX?")
                            .foregroundStyle(.secondary)
                        Button("Crear cuenta") {
                            informationURL = session.origin.appendingPathComponent(
                                role == .athlete ? "athlete/register" : "coach/register"
                            )
                        }
                    }
                    .font(.subheadline)
                    .frame(maxWidth: .infinity, minHeight: TriWaveXMetrics.minimumTouchTarget)
                    .padding(.top, 28)
                    .accessibilityHint("Abre el registro de \(role.title.lowercased())")

                    HStack {
                        Button("Privacidad") {
                            informationURL = session.origin.appendingPathComponent("privacidad")
                        }
                        Spacer()
                        Button("Soporte") {
                            informationURL = session.origin.appendingPathComponent("soporte")
                        }
                    }
                    .font(.footnote.weight(.semibold))
                    .padding(.horizontal, -8)
                    .padding(.top, 26)
                }
                .padding(.horizontal, 20)
                .padding(.top, 54)
                .padding(.bottom, 32)
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .scrollDismissesKeyboard(.interactively)
            .toolbar(.hidden, for: .navigationBar)
        }
    }

    private var loginSurface: Color {
        Color(uiColor: .secondarySystemGroupedBackground)
    }

    private func loginSectionTitle(_ title: String) -> some View {
        Text(title)
            .font(.system(size: 21, weight: .bold))
            .foregroundStyle(.secondary)
            .padding(.top, 18)
            .padding(.bottom, 8)
            .padding(.horizontal, 8)
    }

    private func loginSurfaceGroup<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            content()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 4)
        .background(loginSurface, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
    }

    private var branding: some View {
        VStack(spacing: 6) {
            Text("TriWaveX")
                .font(.system(size: 34, weight: .bold))
                .foregroundStyle(.primary)

            Text("Entrena con una dirección clara")
                .font(.system(size: 17))
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("TriWaveX. Entrena con una dirección clara")
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
