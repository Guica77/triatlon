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
    }

    private var loginView: some View {
        NavigationStack {
            Form {
                Section {
                    branding
                }
                .listRowBackground(Color.clear)
                .listRowInsets(EdgeInsets(top: 18, leading: 20, bottom: 8, trailing: 20))

                Section("Tipo de cuenta") {
                    Picker("Tipo de cuenta", selection: $role) {
                        ForEach(Role.allCases, id: \.self) { option in
                            Text(option.title).tag(option)
                        }
                    }
                    .pickerStyle(.segmented)
                    .accessibilityLabel("Tipo de cuenta")
                    .disabled(session.busy)
                }

                Section("Acceso") {
                    TextField("Correo electrónico", text: $email)
                        .textContentType(.username)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .submitLabel(.next)
                        .focused($focusedField, equals: .email)
                        .onSubmit { focusedField = .password }
                        .accessibilityLabel("Correo electrónico")

                    SecureField("Contraseña", text: $password)
                        .textContentType(.password)
                        .submitLabel(.go)
                        .focused($focusedField, equals: .password)
                        .onSubmit { if canSubmit { login() } }
                        .accessibilityLabel("Contraseña")

                    if let error = session.error {
                        Label {
                            Text(error)
                                .fixedSize(horizontal: false, vertical: true)
                        } icon: {
                            Image(systemName: "exclamationmark.triangle.fill")
                        }
                        .font(.footnote.weight(.medium))
                        .foregroundStyle(.red)
                        .accessibilityLabel("Error: \(error)")
                    }

                }

                Section {
                    Button {
                        login()
                    } label: {
                        HStack(spacing: 8) {
                            if session.busy {
                                ProgressView()
                            }
                            Text("Entrar como \(role.title.lowercased())")
                        }
                        .frame(maxWidth: .infinity, minHeight: TriWaveXMetrics.minimumTouchTarget)
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                    .disabled(!canSubmit || session.busy)
                    .accessibilityHint(session.busy ? "Iniciando sesión" : "Doble toque para iniciar sesión")
                }
                .listRowBackground(Color.clear)
                .listRowSeparator(.hidden)
                .listRowInsets(EdgeInsets(top: 2, leading: 20, bottom: 8, trailing: 20))

                Section {
                    Link(destination: session.origin.appendingPathComponent("forgot-password")) {
                        Text("¿Has olvidado la contraseña?")
                            .frame(maxWidth: .infinity, minHeight: TriWaveXMetrics.minimumTouchTarget)
                    }
                }
                .listRowBackground(Color.clear)
                .listRowSeparator(.hidden)

                Section {
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
                }
                header: {
                    Text("Otra forma de entrar")
                        .textCase(nil)
                        .frame(maxWidth: .infinity)
                }
                .listRowSpacing(12)
                .listRowInsets(EdgeInsets(top: 10, leading: 20, bottom: 10, trailing: 20))
                .accessibilityElement(children: .contain)
                .accessibilityLabel("Acceso con Apple")
                .accessibilityHint("También puedes usar una cuenta de Apple")
                .disabled(session.busy)
                .opacity(session.busy ? 0.7 : 1)
                .animation(TriWaveXMotion.stateChange(reduced: reduceMotion), value: session.busy)

                Section {
                    VStack(spacing: 8) {
                        Text("¿Nuevo en TriWaveX?")
                            .foregroundStyle(.secondary)
                        Button("Crear cuenta") {
                            informationURL = session.origin.appendingPathComponent(
                                role == .athlete ? "athlete/register" : "coach/register"
                            )
                        }
                    }
                    .frame(maxWidth: .infinity, minHeight: TriWaveXMetrics.minimumTouchTarget)
                    .accessibilityHint("Abre el registro de \(role.title.lowercased())")
                }
                .font(.footnote)
                .listRowBackground(Color.clear)
                .listRowSeparator(.hidden)

                Section {
                    HStack {
                        Button("Privacidad") {
                            informationURL = session.origin.appendingPathComponent("privacidad")
                        }

                        Spacer()

                        Button("Soporte") {
                            informationURL = session.origin.appendingPathComponent("soporte")
                        }
                    }
                    .frame(minHeight: TriWaveXMetrics.minimumTouchTarget)
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(.tint)
                }
                .listRowBackground(Color.clear)
                .listRowSeparator(.hidden)
            }
            .formStyle(.grouped)
            .scrollContentBackground(.visible)
            .scrollDismissesKeyboard(.interactively)
            .toolbar(.hidden, for: .navigationBar)
        }
    }

    private var branding: some View {
        VStack(spacing: 6) {
            Text("TriWaveX")
                .font(.largeTitle.weight(.semibold))
                .foregroundStyle(.primary)

            Text("Entrena con una dirección clara")
                .font(.subheadline)
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
