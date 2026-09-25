import SwiftUI
import WebKit
import Observation
import AuthenticationServices
import GoogleSignInSwift

enum NativeAthleteDraft {
    static let prefix = "triwavex.onboarding."
    static let expiryKey = "triwavex.onboarding.expiresAt"
    static let preAuthStepKey = "triwavex.onboarding.preAuthStep"
    static let lifetime: TimeInterval = 30 * 24 * 60 * 60

    static func removeExpired(from defaults: UserDefaults = .standard) {
        // Purge the legacy sensitive draft introduced by older builds; health
        // answers are now transient until they are submitted after consent.
        defaults.removeObject(forKey: prefix + "injuries")
        guard let expiry = defaults.object(forKey: expiryKey) as? Date else {
            let hasUnboundedDraft = defaults.object(forKey: preAuthStepKey) != nil ||
                ["goal", "modality", "targetRaceDistance", "level", "weeklyHours", "targetRaceDate"].contains {
                    defaults.object(forKey: prefix + $0) != nil
                }
            if hasUnboundedDraft { clearPreAuthDraft(from: defaults) }
            return
        }
        if expiry < Date() { clearPreAuthDraft(from: defaults) }
    }

    fileprivate static func save(_ values: AthletePreferences, step: Int, to defaults: UserDefaults = .standard) {
        defaults.set(values.goal, forKey: prefix + "goal")
        defaults.set(values.modality, forKey: prefix + "modality")
        defaults.set(values.distance, forKey: prefix + "targetRaceDistance")
        defaults.set(values.level, forKey: prefix + "level")
        defaults.set(values.weeklyHours, forKey: prefix + "weeklyHours")
        defaults.set(values.raceDate.map(dayString) ?? "", forKey: prefix + "targetRaceDate")
        defaults.set(step, forKey: preAuthStepKey)
        defaults.set(Date().addingTimeInterval(lifetime), forKey: expiryKey)
    }

    static func clear(from defaults: UserDefaults = .standard) {
        ["goal", "modality", "targetRaceDistance", "level", "weeklyHours", "wantsCoach", "injuries", "step", "readyForPayment", "targetRaceDate"].forEach {
            defaults.removeObject(forKey: prefix + $0)
        }
        defaults.removeObject(forKey: preAuthStepKey)
        defaults.removeObject(forKey: expiryKey)
    }

    private static func clearPreAuthDraft(from defaults: UserDefaults) {
        ["goal", "modality", "targetRaceDistance", "level", "weeklyHours", "targetRaceDate"].forEach {
            defaults.removeObject(forKey: prefix + $0)
        }
        defaults.removeObject(forKey: preAuthStepKey)
        defaults.removeObject(forKey: expiryKey)
    }

    static func dayString(_ date: Date) -> String {
        let parts = Calendar.current.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", parts.year ?? 2000, parts.month ?? 1, parts.day ?? 1)
    }

    static func dayDate(_ value: String) -> Date? {
        let parts = value.split(separator: "-").compactMap { Int($0) }
        guard parts.count == 3 else { return nil }
        return Calendar.current.date(from: DateComponents(year: parts[0], month: parts[1], day: parts[2], hour: 12))
    }
}

private struct AthletePreferences {
    var goal = "Mi próximo objetivo"
    var modality = "triatlon"
    var distance = "half"
    var level = "intermedio"
    var weeklyHours = 7.0
    var raceDate: Date?
}

struct NativeAppIntroductionView: View {
    enum AccountRole: String, CaseIterable {
        case athlete
        case coach

        var title: String { self == .athlete ? "Atleta" : "Entrenador" }
    }

    let onContinue: (AccountRole) -> Void
    let onSignIn: (AccountRole) -> Void
    @State private var role: AccountRole
    @State private var page = 0

    private var slides: [(String, String, IntroPreviewKind)] {
        role == .athlete
            ? [
                ("Un plan con contexto", "Tu objetivo, deporte, experiencia y tiempo disponible se convierten en una preparación hecha para ti.", .plan),
                ("Sigue tu progreso", "Consulta tus sesiones, carga semanal y evolución desde un mismo lugar.", .progress),
                ("Habla con tu entrenador", "Chat reúne la conversación y el feedback de tu preparación.", .chat),
                ("Ajustes y tu cuenta", "En More están Preferencias, Cuenta y Ayuda: privacidad, Face ID, seguridad y soporte.", .profile),
                ("Cambia tu plan cuando quieras", "Desde Gestionar mi plan puedes editar sesiones, cambiar el objetivo o ajustar la carga sin repetir el cuestionario.", .planManagement),
                ("Atleta con IA o entrenador", "Elige Atleta con IA para una planificación adaptativa, o Entrenador para gestionar tu equipo. Puedes cambiar de opción en Suscripción y plan.", .planChoice),
                ("Suscripción y cancelación", "Consulta tus opciones, cambia de plan o abre App Store para gestionar o cancelar. Apple muestra el precio antes de confirmar.", .subscription),
            ]
            : [
                ("Tu equipo, de un vistazo", "Consulta tus atletas activos y el estado de su seguimiento.", .coach),
                ("Planes y comunicación", "Revisa el trabajo de tu equipo y habla con cada atleta desde el chat.", .chat),
                ("Cambia entre atleta y entrenador", "Desde Suscripción y plan puedes elegir Atleta con IA o Entrenador. Si eres entrenador, también eliges la capacidad de atletas.", .planChoice),
                ("Ajustes y tu cuenta", "En More encuentras Preferencias, Cuenta, capacidad y Ayuda para tu equipo.", .profile),
                ("Gestiona tu suscripción", "Revisa la capacidad de atletas, cambia de plan o gestiona y cancela desde App Store.", .subscription),
            ]
    }

    init(initialRole: String, onContinue: @escaping (AccountRole) -> Void, onSignIn: @escaping (AccountRole) -> Void) {
        self.onContinue = onContinue
        self.onSignIn = onSignIn
        _role = State(initialValue: AccountRole(rawValue: initialRole) ?? .athlete)
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                HStack {
                    TriWaveXWordmark(font: .system(size: 25, weight: .black, design: .rounded))
                    Spacer()
                    Text("\(page + 1) / \(slides.count)")
                        .font(.caption.weight(.semibold).monospacedDigit())
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal, 20).padding(.top, 8)

                Picker("Tipo de cuenta", selection: $role) {
                    ForEach(AccountRole.allCases, id: \.self) { option in Text(option.title).tag(option) }
                }
                .pickerStyle(.segmented)
                .padding(.horizontal, 20).padding(.top, 16)
                .onChange(of: role) { _, value in
                    page = 0
                    UserDefaults.standard.set(value.rawValue, forKey: "triwavex.login.role")
                }

                TabView(selection: $page) {
                    ForEach(slides.indices, id: \.self) { index in
                        let slide = slides[index]
                        IntroPreviewScreen(title: slide.0, detail: slide.1, kind: slide.2, role: role) { destination in
                            guard let nextPage = slides.firstIndex(where: { $0.2 == destination }) else { return }
                            withAnimation(.easeInOut(duration: 0.2)) { page = nextPage }
                        }
                            .tag(index).padding(.horizontal, 20)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .accessibilityLabel("Presentación de TriWaveX")
                .frame(maxHeight: .infinity)

                HStack(spacing: 7) {
                    ForEach(slides.indices, id: \.self) { index in
                        Capsule().fill(index == page ? Color.triWaveXAqua : Color.secondary.opacity(0.22))
                            .frame(width: index == page ? 24 : 7, height: 7)
                    }
                    Spacer()
                    if page > 0 {
                        Button("Anterior") { withAnimation(.easeInOut(duration: 0.22)) { page -= 1 } }
                            .font(.subheadline.weight(.semibold)).foregroundStyle(.secondary)
                            .frame(minHeight: 44)
                    }
                    Button("Saltar") { onContinue(role) }
                        .font(.subheadline.weight(.semibold)).foregroundStyle(.secondary)
                        .frame(minHeight: 44).accessibilityHint("Continúa al cuestionario")
                }
                .padding(.horizontal, 24).padding(.bottom, 8)

                Button(page == slides.count - 1 ? "Continuar con el cuestionario" : "Siguiente") {
                    if page < slides.count - 1 { withAnimation(.easeInOut(duration: 0.22)) { page += 1 } }
                    else { onContinue(role) }
                }
                .buttonStyle(TriWaveXPrimaryButtonStyle(tint: .triWaveXAqua))
                .controlSize(.large).padding(.horizontal, 20)

                Button("Ya tengo cuenta · Iniciar sesión") { onSignIn(role) }
                    .buttonStyle(TriWaveXSecondaryButtonStyle())
                    .padding(.horizontal, 20).padding(.top, 4).padding(.bottom, 8)
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .navigationTitle("TriWaveX")
            .navigationBarTitleDisplayMode(.inline)
        }
        .tint(.triWaveXAqua)
    }

}

private enum IntroPreviewKind: Equatable {
    case plan
    case progress
    case coach
    case coachPlan
    case chat
    case profile
    case planManagement
    case planChoice
    case subscription
}

private struct IntroPreviewScreen: View {
    let title: String
    let detail: String
    let kind: IntroPreviewKind
    let role: NativeAppIntroductionView.AccountRole
    let selectPage: (IntroPreviewKind) -> Void
    @State private var demoModels = IntroDemoModels()

    var body: some View {
        Group {
            if let realScreen {
                VStack(alignment: .leading, spacing: 8) {
                    VStack(spacing: 0) {
                        realScreen
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                            .background(Color(uiColor: .systemGroupedBackground))
                        appTabBar
                    }
                    .background(Color(uiColor: .systemGroupedBackground), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                    VStack(alignment: .leading, spacing: 4) {
                        Text("PANTALLA REAL · DATOS DE DEMOSTRACIÓN")
                            .font(.caption2.weight(.bold)).tracking(0.6).foregroundStyle(Color.triWaveXAqua)
                        Text(title).font(.title3.bold()).tracking(-0.2)
                        Text(detail).font(.subheadline).foregroundStyle(.secondary).lineSpacing(1)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(.horizontal, 4)
                }
                .padding(.top, 8)
            } else {
                VStack(alignment: .leading, spacing: 12) {
            VStack(spacing: 0) {
                HStack(spacing: 4) {
                    RoundedRectangle(cornerRadius: 2).fill(Color.primary).frame(width: 24, height: 3)
                    Spacer()
                    Image(systemName: "airpodspro").font(.system(size: 9)).foregroundStyle(.secondary)
                    Circle().fill(Color.green).frame(width: 5, height: 5)
                    Image(systemName: "wifi").font(.system(size: 9)).foregroundStyle(.secondary)
                    Image(systemName: "battery.75percent").font(.system(size: 9)).foregroundStyle(.secondary)
                }.padding(.horizontal, 12).padding(.top, 7).padding(.bottom, 3)
                HStack {
                    TriWaveXWordmark(font: .system(size: 15, weight: .black, design: .rounded))
                    Spacer()
                    Image(systemName: "bell.badge").font(.system(size: 12)).foregroundStyle(Color.triWaveXAqua)
                }
                .padding(.horizontal, 12).padding(.vertical, 8)
                HStack {
                    Text(screenTitle).font(.system(size: 14, weight: .bold))
                    Spacer()
                    if kind == .profile { Image(systemName: "gearshape").font(.system(size: 11)).foregroundStyle(.secondary) }
                }
                .padding(.horizontal, 12).padding(.bottom, 6)
                Divider()
                ScrollView {
                    Group {
                        switch kind {
                        case .plan, .progress, .profile, .coach, .chat: EmptyView()
                        case .coachPlan: coachPlanContent
                        case .planManagement: privacyContent
                        case .planChoice: planChoiceContent
                        case .subscription: subscriptionContent
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .topLeading)
                    .padding(10)
                }
                Divider()
                HStack(spacing: 0) {
                    tab("Hoy", icon: "house", selected: kind == .plan || kind == .coach)
                    if role == .athlete {
                        tab("Plan", icon: "calendar", selected: kind == .coachPlan)
                        tab("Progreso", icon: "chart.bar.xaxis", selected: kind == .progress)
                    }
                    tab("Chat", icon: "bubble.left.and.bubble.right", selected: false)
                    tab("More", icon: "ellipsis.circle", selected: kind == .profile || kind == .planManagement || kind == .planChoice || kind == .subscription)
                }
                .padding(.top, 5).padding(.bottom, 4)
            }
            .frame(maxWidth: 300).frame(height: 380)
            .background(Color(uiColor: .systemGroupedBackground), in: RoundedRectangle(cornerRadius: 30, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 30, style: .continuous).stroke(Color.primary.opacity(0.18), lineWidth: 1))
            .clipShape(RoundedRectangle(cornerRadius: 30, style: .continuous))
            .shadow(color: .black.opacity(0.10), radius: 22, y: 9)
            .frame(maxWidth: .infinity)

            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 6) {
                    Text(kind == .plan || kind == .progress ? "ATLETA" : role == .coach ? "ENTRENADOR" : "TRIWAVEX")
                        .font(.caption2.weight(.bold)).tracking(0.8).foregroundStyle(Color.triWaveXAqua)
                    Text("·")
                    Text("Vista previa").font(.caption2).foregroundStyle(.secondary)
                }
                Text(title).font(.title2.bold()).tracking(-0.3)
                Text(detail).font(.subheadline).foregroundStyle(.secondary)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(.horizontal, 8)
            Spacer(minLength: 0)
        }
                .padding(.top, 16)
            }
        }
    }

    private var realScreen: AnyView? {
        switch kind {
        case .plan:
            AnyView(NativeTodayView(model: demoModels.plan, openPlan: {}))
        case .progress:
            AnyView(AthleteProgressView(model: demoModels.progress, onFallback: {}))
        case .profile:
            AnyView(profileDemo)
        case .coach:
            AnyView(NativeCoachDashboardView(model: demoModels.coach, earningsModel: demoModels.earnings, openAthlete: { _ in }))
        case .chat:
            AnyView(NativeChatView(origin: demoModels.origin, store: demoModels.store, previewConversation: true))
        case .coachPlan:
            AnyView(NativePlanView(model: demoModels.plan, isDemo: true))
        case .planManagement:
            AnyView(NativePlanManagementSheet(
                goal: demoModels.profilePreview.goal,
                physiology: demoModels.profilePreview.physiology,
                saveGoal: { _ in false },
                openSessions: {}
            ))
        case .planChoice, .subscription:
            AnyView(SubscriptionManagementView(
                origin: demoModels.origin,
                store: demoModels.store,
                userID: nil,
                role: role.rawValue,
                status: "active",
                onSubscriptionFinished: nil,
                isDemo: true
            ))
        }
    }

    private var appTabBar: some View {
        HStack(spacing: 0) {
            appTab("Hoy", icon: "house", kind: role == .coach ? .coach : .plan, selected: kind == .plan || kind == .coach)
            if role == .athlete {
                appTab("Plan", icon: "calendar", kind: .coachPlan, selected: kind == .coachPlan)
                appTab("Progreso", icon: "chart.bar.xaxis", kind: .progress, selected: kind == .progress)
            }
            appTab("Chat", icon: "bubble.left.and.bubble.right", kind: .chat, selected: kind == .chat)
            appTab("More", icon: "ellipsis.circle", kind: .profile, selected: kind == .profile || kind == .planManagement || kind == .planChoice || kind == .subscription)
        }
        .padding(.top, 5)
        .padding(.bottom, 4)
        .background(.bar)
        .overlay(alignment: .top) { Divider() }
    }

    private func appTab(_ title: String, icon: String, kind destination: IntroPreviewKind, selected: Bool) -> some View {
        Button { selectPage(destination) } label: {
            VStack(spacing: 3) {
                Image(systemName: icon).font(.system(size: 18, weight: selected ? .semibold : .regular))
                Text(title).font(.caption2.weight(selected ? .semibold : .regular))
            }
            .frame(maxWidth: .infinity, minHeight: 44)
            .foregroundStyle(selected ? Color.triWaveXAqua : Color.secondary)
        }
        .buttonStyle(.plain)
        .disabled(!hasSlide(destination))
    }

    private func hasSlide(_ destination: IntroPreviewKind) -> Bool {
        switch destination {
        case .plan: role == .athlete
        case .progress: role == .athlete
        case .coach: true
        case .chat: true
        case .coachPlan, .profile, .planManagement, .planChoice, .subscription: true
        }
    }

    private var screenTitle: String {
        switch kind {
        case .plan: "Hoy"
        case .progress: "Progreso"
        case .coach: "Tu equipo"
        case .coachPlan: "Planes"
        case .chat: "Mensajes"
        case .profile: "More"
        case .planManagement: "Gestionar mi plan"
        case .planChoice: "Elige tu forma de entrenar"
        case .subscription: "Suscripción y plan"
        }
    }

    private var planContent: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("VISTA PREVIA · DATOS DE EJEMPLO").font(.system(size: 8, weight: .bold)).tracking(0.45).foregroundStyle(.secondary)
            Text("Hola, Guillermo").font(.title3.bold())
            Text("Tu preparación para el próximo objetivo").font(.caption).foregroundStyle(.secondary)
            HStack(spacing: 10) {
                Image(systemName: "figure.run").font(.title3).foregroundStyle(.white).frame(width: 42, height: 42).background(Color.triWaveXAqua, in: RoundedRectangle(cornerRadius: 13))
                VStack(alignment: .leading, spacing: 3) { Text("Tu entrenamiento de hoy").font(.caption.weight(.semibold)); Text("2 sesiones en tu plan").font(.caption2).foregroundStyle(.secondary) }
                Spacer(minLength: 0)
            }
            .padding(11).background(Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 15))
            previewCard(icon: "figure.pool.swim", title: "Natación · Técnica", subtitle: "07:30 · 45 min", color: .triWaveXAqua)
            previewCard(icon: "figure.run", title: "Carrera · Ritmo suave", subtitle: "18:00 · 40 min", color: .triWaveXCoral)
            previewButton("Ver semana completa", icon: "calendar")
        }
    }

    private var progressContent: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("ENTRENAMIENTO DE HOY").font(.caption2.weight(.bold)).tracking(0.4).foregroundStyle(.secondary)
            Label("Planificado", systemImage: "calendar").font(.caption).foregroundStyle(.secondary)
            previewCard(icon: "figure.pool.swim", title: "Natación", subtitle: "45 min · Técnica", color: .triWaveXAqua)
            Text("RECUPERACIÓN").font(.caption2.weight(.bold)).tracking(0.4).foregroundStyle(.secondary)
            HStack(spacing: 6) {
                metric("Preparación", value: "82")
                metric("HRV", value: "58 ms")
                metric("Sueño", value: "7,5 h")
            }
            Text("ESTA SEMANA").font(.caption2.weight(.bold)).tracking(0.4).foregroundStyle(.secondary)
            HStack { Text("Completado"); Spacer(); Text("4/6 sesiones").fontWeight(.semibold) }.font(.caption)
            ProgressView(value: 0.67).tint(.triWaveXAqua)
            HStack { Text("Carga · 286 TSS"); Spacer(); Text("5 h 20 min") }.font(.caption2).foregroundStyle(.secondary)
        }
    }

    private func metric(_ title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(title).font(.system(size: 8)).foregroundStyle(.secondary)
            Text(value).font(.system(size: 10, weight: .semibold).monospacedDigit())
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(7).background(Color(uiColor: .systemBackground), in: RoundedRectangle(cornerRadius: 9))
    }

    private var coachContent: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("SOLICITUDES Y MENSAJES").font(.caption2.weight(.bold)).tracking(0.5).foregroundStyle(.secondary)
            previewCard(icon: "person.crop.circle.fill", title: "María G.", subtitle: "Preparación · Media distancia", color: .triWaveXAqua)
            previewCard(icon: "person.crop.circle.fill", title: "Luis R.", subtitle: "3 sesiones esta semana", color: .triWaveXBike)
            Label("Tienes un mensaje nuevo", systemImage: "bubble.left.fill")
                .font(.footnote.weight(.medium)).foregroundStyle(Color.triWaveXAqua)
                .padding(10).frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.triWaveXAqua.opacity(0.08), in: RoundedRectangle(cornerRadius: 12))
            previewButton("Abrir equipo", icon: "arrow.right")
        }
    }

    private var coachPlanContent: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("PLAN DE MARÍA").font(.caption2.weight(.bold)).tracking(0.5).foregroundStyle(.secondary)
            HStack {
                Text("Esta semana").font(.subheadline.weight(.semibold))
                Spacer()
                Text("5 sesiones").font(.caption).foregroundStyle(.secondary)
            }
            previewCard(icon: "figure.pool.swim", title: "Natación · Técnica", subtitle: "Lunes · 45 min", color: .triWaveXAqua)
            previewCard(icon: "bicycle", title: "Bici · Resistencia", subtitle: "Miércoles · 90 min", color: .triWaveXBike)
            previewCard(icon: "figure.run", title: "Carrera · Tempo", subtitle: "Viernes · 50 min", color: .triWaveXCoral)
            previewButton("Revisar plan", icon: "arrow.right")
        }
    }

    private var accountContent: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 9) {
                Text("G").font(.subheadline.bold()).foregroundStyle(.white).frame(width: 34, height: 34).background(Color.triWaveXAqua, in: Circle())
                VStack(alignment: .leading, spacing: 1) { Text("Guillermo").font(.caption.weight(.semibold)); Text("Atleta · Triatleta").font(.system(size: 9)).foregroundStyle(.secondary) }
                Spacer()
            }.padding(7).background(Color(uiColor: .systemBackground), in: RoundedRectangle(cornerRadius: 10))
            settingsSection("MI PREPARACIÓN", rows: [("Gestionar mi plan", "slider.horizontal.3")])
            settingsSection("PREFERENCIAS", rows: [("Pedir Face ID al abrir", "faceid"), ("Notificaciones", "bell"), ("Clima", "cloud.sun"), ("Privacidad", "hand.raised")])
            settingsSection("CUENTA", rows: [("Suscripción y plan", "creditcard"), ("Descuento por carrera", "medal.star"), ("Cuenta y seguridad", "person.crop.circle")])
            settingsSection("AYUDA", rows: [("Descubrir TriWaveX", "sparkles"), ("Guía rápida", "questionmark.circle")])
        }
    }

    private var profileDemo: some View {
        NativeProfileView(
            model: demoModels.profile,
            origin: demoModels.origin,
            store: demoModels.store,
            authenticatedUserID: nil,
            authenticatedRole: role.rawValue,
            openDevices: {}, openCoros: {}, openStrava: {}, openPlanEditor: {}, openAccount: {}, replayGuide: {},
            onSubscriptionFinished: nil,
            isDemo: true
        )
        .environment(demoModels.appLock)
    }

    private func settingsSection(_ title: String, rows: [(String, String)]) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title).font(.system(size: 8, weight: .bold)).tracking(0.4).foregroundStyle(.secondary)
            VStack(spacing: 0) {
                ForEach(Array(rows.enumerated()), id: \.offset) { index, row in
                    HStack(spacing: 7) {
                        Image(systemName: row.1).foregroundStyle(Color.triWaveXAqua).frame(width: 14)
                        Text(row.0).font(.system(size: 9, weight: .medium))
                        Spacer()
                        Image(systemName: "chevron.right").font(.system(size: 7, weight: .bold)).foregroundStyle(.tertiary)
                    }.padding(.horizontal, 7).frame(height: 23)
                    if index < rows.count - 1 { Divider().padding(.leading, 27) }
                }
            }.background(Color(uiColor: .systemBackground), in: RoundedRectangle(cornerRadius: 9))
        }
    }

    private var privacyContent: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("MI PREPARACIÓN").font(.caption2.weight(.bold)).tracking(0.5).foregroundStyle(.secondary)
            settingsRow("Editar sesiones", icon: "calendar.badge.pencil")
            settingsRow("Cambiar objetivo", icon: "flag.checkered")
            settingsRow("Subir carga", icon: "chart.line.uptrend.xyaxis")
            settingsRow("Lesiones e historial", icon: "cross.case")
            Label("Los cambios se revisan antes de guardarlos. Si entrenas con coach, conserva el control del plan.", systemImage: "info.circle")
                .font(.caption2).foregroundStyle(.secondary)
                .padding(9).frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(uiColor: .systemBackground), in: RoundedRectangle(cornerRadius: 11))
        }
    }

    private var subscriptionContent: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("OPCIONES").font(.caption2.weight(.bold)).tracking(0.5).foregroundStyle(.secondary)
            settingsRow("Atleta", icon: "figure.run", value: "Ver plan")
            settingsRow("Entrenador", icon: "person.2", value: "Ver plan")
            Text("App Store mostrará el precio vigente y cualquier prueba disponible antes de confirmar.")
                .font(.caption2).foregroundStyle(.secondary)
            settingsRow("Gestionar o cancelar en App Store", icon: "arrow.up.right.square")
            settingsRow("Restaurar compras", icon: "arrow.clockwise")
        }
    }

    private var planChoiceContent: some View {
        VStack(alignment: .leading, spacing: 9) {
            Text("ELIGE TU FORMA DE ENTRENAR").font(.caption2.weight(.bold)).tracking(0.4).foregroundStyle(.secondary)
            VStack(alignment: .leading, spacing: 5) {
                HStack { Label("Atleta con IA", systemImage: "figure.run.circle.fill").font(.subheadline.weight(.semibold)); Spacer(); Image(systemName: "checkmark.circle.fill").foregroundStyle(Color.triWaveXAqua) }
                Text("Planificación adaptativa y métricas para tu progreso.").font(.caption).foregroundStyle(.secondary)
            }
            .padding(12).frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(uiColor: .systemBackground), in: RoundedRectangle(cornerRadius: 14))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.triWaveXAqua, lineWidth: 2))
            VStack(alignment: .leading, spacing: 5) {
                Label("Entrenador", systemImage: "person.2.badge.gearshape.fill").font(.subheadline.weight(.semibold))
                Text("10 atletas incluidos. Añade bloques de hasta 5 atletas.").font(.caption).foregroundStyle(.secondary)
            }
            .padding(12).frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(uiColor: .systemBackground), in: RoundedRectangle(cornerRadius: 14))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.triWaveXBorder, lineWidth: 1))
            Text("El precio localizado y cualquier prueba se muestran antes de confirmar.")
                .font(.caption2).foregroundStyle(.secondary)
        }
    }

    private func previewCard(icon: String, title: String, subtitle: String, color: Color) -> some View {
        HStack(spacing: 9) {
            Image(systemName: icon).font(.headline).foregroundStyle(color)
                .frame(width: 34, height: 34).background(color.opacity(0.12), in: RoundedRectangle(cornerRadius: 10))
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.caption.weight(.semibold))
                Text(subtitle).font(.caption2).foregroundStyle(.secondary)
            }
            Spacer(minLength: 0)
            Image(systemName: "chevron.right").font(.caption2.weight(.bold)).foregroundStyle(.tertiary)
        }
        .padding(9).background(Color(uiColor: .systemBackground), in: RoundedRectangle(cornerRadius: 12))
    }

    private func previewButton(_ title: String, icon: String) -> some View {
        Label(title, systemImage: icon).font(.caption.weight(.semibold))
            .foregroundStyle(.black.opacity(0.9)).frame(maxWidth: .infinity, minHeight: 36)
            .background(Color.triWaveXAqua, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
    }

    private func settingsRow(_ title: String, icon: String, value: String? = nil) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon).foregroundStyle(Color.triWaveXAqua).frame(width: 20)
            Text(title).font(.caption.weight(.medium))
            Spacer()
            if let value { Text(value).font(.caption2).foregroundStyle(.secondary) }
            Image(systemName: "chevron.right").font(.caption2.weight(.bold)).foregroundStyle(.tertiary)
        }
        .padding(9).background(Color(uiColor: .systemBackground), in: RoundedRectangle(cornerRadius: 11))
    }

    private func tab(_ title: String, icon: String, selected: Bool) -> some View {
        VStack(spacing: 3) {
            Image(systemName: icon).font(.system(size: 13, weight: selected ? .semibold : .regular))
            Text(title).font(.system(size: 8, weight: selected ? .semibold : .regular))
        }
        .foregroundStyle(selected ? Color.triWaveXAqua : Color.secondary)
        .frame(maxWidth: .infinity)
    }
}

@MainActor
private final class IntroDemoModels {
    let origin = URL(string: "https://triwavex.com")!
    let store = WKWebsiteDataStore.nonPersistent()
    let appLock = AppLock()
    let plan: NativePlanModel
    let progress: AthleteProgressModel
    let profile: NativeProfileModel
    let profilePreview: NativeProfile
    let coach: NativeCoachDashboardModel
    let earnings: NativeCoachEarningsModel

    init() {
        let now = Date()
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = .current
        let dateFormatter = DateFormatter()
        dateFormatter.locale = Locale(identifier: "en_US_POSIX")
        dateFormatter.calendar = calendar
        dateFormatter.timeZone = .current
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let today = dateFormatter.string(from: now)
        let previewPlan = NativePlan(
            athleteName: "Guillermo",
            planName: "Preparación · Triatlón",
            readOnly: false,
            workouts: [
                .init(id: "demo-swim", date: today, slot: "07:30", status: "planned", sport: "Natación", durationMinutes: 45, title: "Técnica y eficiencia", detail: "Trabajo aeróbico suave y técnica de crol.", lastChange: nil),
                .init(id: "demo-run", date: today, slot: "18:00", status: "planned", sport: "Carrera", durationMinutes: 40, title: "Rodaje suave", detail: "Ritmo cómodo · zona 2.", lastChange: nil),
            ],
            generatedAt: now
        )
        plan = NativePlanModel(client: NativePlanClient(origin: origin, store: store), previewPlan: previewPlan)
        let todayWorkout = AthleteProgress.TodayWorkout(id: "demo-swim", date: today, sport: "Natación", durationMinutes: 45, description: "Técnica y eficiencia", status: "planned", completed: false)
        let recovery = AthleteProgress.Recovery(date: today, readinessScore: 82, hrv: 58, sleepHours: 7.5, fatigueRating: 2)
        let week = AthleteProgress.Week(startDate: today, endDate: today, plannedSessions: 6, completedSessions: 4, completionPercent: 67, totalTss: 286, totalMinutes: 320)
        let distance = AthleteProgress.Distance(swim: 4.2, bike: 72, run: 18)
        let summary = AthleteProgress.Summary(completedSessions: 24, totalTss: 1120, totalMinutes: 1260, distanceKm: distance, tssBySport: .init(swim: 210, bike: 640, run: 270), streakWeeks: 4)
        let sampleProgress = AthleteProgress(athlete: .init(firstName: "Guillermo"), recovery: recovery, todayWorkout: todayWorkout, week: week, summary: summary, state: .ready, generatedAt: now)
        progress = AthleteProgressModel(client: AthleteProgressClient(origin: origin, store: store), previewProgress: sampleProgress)
        let sampleProfile = NativeProfile(
            athlete: .init(firstName: "Guillermo", lastName: nil, level: "Triatleta", subscriptionStatus: "active"),
            goal: .init(name: "Triatlón · Media distancia", date: nil),
            physiology: .init(ftp: 220, swimPace: "1:55/100 m", runPace: "5:10/km", baselineHours: "7", injuries: nil),
            recovery: .init(readiness: 82, hrv: 58, sleepHours: 7.5, fatigue: 2),
            connections: .init(strava: true, garmin: true, polar: false, coros: false, suunto: false, amazfit: false)
        )
        profilePreview = sampleProfile
        profile = NativeProfileModel(client: NativeProfileClient(origin: origin, store: store), previewProfile: sampleProfile)
        let dashboard = NativeCoachDashboard(coachName: "Guillermo", athletes: [
            .init(id: "demo-athlete-1", name: "María G.", planName: "Media distancia", groupName: nil, todayWorkout: .init(sport: "Natación", title: "Técnica", durationMinutes: 45, status: "planned"), completedThisWeek: 4, totalThisWeek: 6),
            .init(id: "demo-athlete-2", name: "Luis R.", planName: "Triatlón olímpico", groupName: nil, todayWorkout: .init(sport: "Carrera", title: "Rodaje suave", durationMinutes: 40, status: "completed"), completedThisWeek: 3, totalThisWeek: 5),
        ])
        coach = NativeCoachDashboardModel(origin: origin, store: store, previewDashboard: dashboard)
        earnings = NativeCoachEarningsModel(origin: origin, store: store, previewEarnings: .init(pendingAppleReportCount: 0, pendingRefundAdjustmentCount: 0, reconciledBalances: [], entries: []))
    }
}

struct NativeCoachIntroductionView: View {
    let onCreateAccount: () -> Void
    let onSignIn: () -> Void

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    ProgressView(value: 1, total: 1)
                        .tint(Color.triWaveXAqua)
                        .accessibilityLabel("Introducción para entrenadores")
                    Label("Espacio de entrenador", systemImage: "person.2.badge.gearshape.fill")
                        .font(.headline)
                        .foregroundStyle(Color.triWaveXAqua)
                    Text("Tu equipo, mejor acompañado")
                        .font(.largeTitle.bold())
                        .tracking(-0.5)
                    Text("Gestiona el trabajo de tus atletas y mantén su seguimiento en un mismo espacio.")
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)

                    VStack(spacing: 10) {
                        feature(icon: "calendar", title: "Planes claros", detail: "Prepara y comparte el trabajo que corresponde a cada atleta.")
                        feature(icon: "person.2.fill", title: "Seguimiento del equipo", detail: "Ten a mano tus atletas activos y el contexto de su entrenamiento.")
                        feature(icon: "bubble.left.and.bubble.right.fill", title: "Comunicación y feedback", detail: "Recoge comentarios y úsalos para orientar los siguientes ajustes.")
                    }

                    Label("Después de crear tu cuenta podrás elegir la capacidad de atletas. Apple mostrará el precio y la renovación antes de confirmar; no se cobra al crear la cuenta.", systemImage: "lock.shield")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(14)
                        .background(Color.triWaveXAqua.opacity(0.08), in: RoundedRectangle(cornerRadius: 14, style: .continuous))

                    Button("Crear cuenta de entrenador", action: onCreateAccount)
                        .buttonStyle(TriWaveXPrimaryButtonStyle(tint: .triWaveXAqua))
                        .controlSize(.large)
                    Button("Ya tengo cuenta · Iniciar sesión", action: onSignIn)
                        .buttonStyle(TriWaveXSecondaryButtonStyle())
                }
                .padding(20)
                .frame(maxWidth: TriWaveXMetrics.contentMaximumWidth, alignment: .leading)
                .frame(maxWidth: .infinity)
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .navigationTitle("TriWaveX")
            .navigationBarTitleDisplayMode(.inline)
        }
        .tint(.triWaveXAqua)
    }

    private func feature(icon: String, title: String, detail: String) -> some View {
        TriWaveXSurface(padding: 14) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: icon)
                    .font(.headline)
                    .foregroundStyle(Color.triWaveXAqua)
                    .frame(width: 28, height: 30)
                VStack(alignment: .leading, spacing: 4) {
                    Text(title).font(.subheadline.weight(.semibold))
                    Text(detail).font(.footnote).foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 0)
            }
        }
    }
}

struct NativeAthleteOnboardingView: View {
    let onCreateAccount: () -> Void
    let onContinueWithApple: (ASAuthorizationAppleIDRequest) -> Void
    let onAppleCompletion: (Result<ASAuthorization, Error>) -> Void
    let onContinueWithGoogle: () -> Void
    let appleError: String?
    let isSigningIn: Bool
    let onCancel: () -> Void
    @State private var preferences: AthletePreferences
    @State private var step: Int
    @State private var showingSportChoices = false
    @State private var showingDistanceChoices = false
    @State private var hasRaceDate = true
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    init(onCreateAccount: @escaping () -> Void,
         onContinueWithApple: @escaping (ASAuthorizationAppleIDRequest) -> Void = { _ in },
         onAppleCompletion: @escaping (Result<ASAuthorization, Error>) -> Void = { _ in },
         onContinueWithGoogle: @escaping () -> Void = {},
         appleError: String? = nil,
         isSigningIn: Bool = false,
         onCancel: @escaping () -> Void) {
        self.onCreateAccount = onCreateAccount
        self.onContinueWithApple = onContinueWithApple
        self.onAppleCompletion = onAppleCompletion
        self.onContinueWithGoogle = onContinueWithGoogle
        self.appleError = appleError
        self.isSigningIn = isSigningIn
        self.onCancel = onCancel
        NativeAthleteDraft.removeExpired()
        let defaults = UserDefaults.standard
        var initial = AthletePreferences()
        initial.goal = defaults.string(forKey: NativeAthleteDraft.prefix + "goal") ?? initial.goal
        initial.modality = defaults.string(forKey: NativeAthleteDraft.prefix + "modality") ?? initial.modality
        initial.distance = defaults.string(forKey: NativeAthleteDraft.prefix + "targetRaceDistance") ?? initial.distance
        initial.level = defaults.string(forKey: NativeAthleteDraft.prefix + "level") ?? initial.level
        if defaults.object(forKey: NativeAthleteDraft.prefix + "weeklyHours") != nil {
            initial.weeklyHours = defaults.double(forKey: NativeAthleteDraft.prefix + "weeklyHours")
        }
        if let rawDate = defaults.string(forKey: NativeAthleteDraft.prefix + "targetRaceDate"), !rawDate.isEmpty {
            initial.raceDate = NativeAthleteDraft.dayDate(rawDate)
        }
        _preferences = State(initialValue: initial)
        _step = State(initialValue: min(max(defaults.integer(forKey: NativeAthleteDraft.preAuthStepKey), 0), 2))
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    ProgressView(value: Double(step + 1), total: 3).tint(Color.triWaveXAqua)
                        .accessibilityLabel("Paso \(step + 1) de 3")
                    if step == 0 {
                        Label("Bienvenido a TriWaveX", systemImage: "figure.triathlon")
                            .font(.headline).foregroundStyle(Color.triWaveXAqua)
                        Text("Entrena con una dirección clara").font(.largeTitle.bold())
                        Text("Cuéntanos qué quieres preparar y te mostraremos una primera orientación antes de crear tu cuenta.")
                            .foregroundStyle(.secondary)
                        TriWaveXSurface {
                            Label("Un plan adaptado a tu objetivo y al tiempo que tienes", systemImage: "calendar.badge.clock")
                                .font(.headline)
                        }
                    } else if step == 1 {
                        Text("¿Qué quieres conseguir?").font(.largeTitle.bold())
                        TextField("Tu objetivo", text: $preferences.goal)
                            .padding(14).background(Color.triWaveXSurface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                        choice(title: "Deporte", value: modalityTitle, icon: modalityIcon) { showingSportChoices = true }
                        choice(title: "Distancia", value: distanceTitle, icon: "flag.checkered") { showingDistanceChoices = true }
                        Picker("Experiencia", selection: $preferences.level) {
                            Text("Principiante").tag("principiante")
                            Text("Intermedio").tag("intermedio")
                            Text("Avanzado").tag("avanzado")
                        }.pickerStyle(.segmented)
                        Toggle("Ya tengo fecha de competición", isOn: $hasRaceDate)
                        if hasRaceDate {
                            DatePicker("Fecha de la carrera", selection: raceDateBinding, in: Date()..., displayedComponents: .date)
                        } else {
                            Label("Aún no tengo fecha · crearé un plan flexible", systemImage: "arrow.left.arrow.right")
                                .font(.footnote).foregroundStyle(.secondary)
                        }
                        Text("¿Cuánto tiempo puedes entrenar?").font(.headline)
                        Text("\(Int(preferences.weeklyHours)) horas a la semana").font(.title2.weight(.semibold)).foregroundStyle(Color.triWaveXAqua)
                        Slider(value: $preferences.weeklyHours, in: 2...20, step: 1).tint(Color.triWaveXAqua)
                    } else {
                        Label("Una primera orientación", systemImage: "checkmark.seal.fill")
                            .font(.headline).foregroundStyle(Color.triWaveXAqua)
                        Text(modalityTitle + " · " + distanceTitle).font(.largeTitle.bold())
                        Text("\(Int(preferences.weeklyHours)) horas disponibles cada semana")
                            .foregroundStyle(.secondary)
                        Label(raceDateSummary, systemImage: "calendar")
                            .font(.subheadline.weight(.medium)).foregroundStyle(.secondary)
                        TriWaveXSurface {
                            VStack(alignment: .leading, spacing: 14) {
                                Text("Una semana posible").font(.title3.bold())
                                ForEach(suggestedSessions, id: \.day) { session in
                                    HStack(spacing: 12) {
                                        Image(systemName: session.icon).foregroundStyle(Color.triWaveXAqua)
                                            .frame(width: 30, height: 30).background(Color.triWaveXAqua.opacity(0.12), in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                                        Text(session.day).font(.headline).frame(width: 36, alignment: .leading)
                                        Text(session.title).foregroundStyle(.secondary)
                                    }
                                }
                            }
                        }
                        Text("Es solo una muestra orientativa, todavía no es un plan generado ni guardado. Después de crear tu cuenta podrás completar tu perfil y ajustar tus días.")
                            .font(.footnote).foregroundStyle(.secondary)
                        Label("Después de crear la cuenta podrás revisar el plan y el precio de Apple. No se cobrará nada hasta que confirmes.", systemImage: "creditcard")
                            .font(.footnote.weight(.medium))
                            .foregroundStyle(.secondary)
                            .fixedSize(horizontal: false, vertical: true)
                        SignInWithAppleButton(.continue, onRequest: onContinueWithApple, onCompletion: onAppleCompletion)
                            .signInWithAppleButtonStyle(.black).frame(height: 50)
                            .disabled(isSigningIn)
                        GoogleSignInButton(scheme: .light, style: .wide, action: onContinueWithGoogle)
                            .frame(height: 50)
                            .disabled(isSigningIn)
                        if let appleError {
                            Label(appleError, systemImage: "exclamationmark.triangle.fill")
                                .font(.footnote.weight(.medium))
                                .foregroundStyle(.red)
                                .fixedSize(horizontal: false, vertical: true)
                                .padding(12)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(Color.red.opacity(0.08), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                                .accessibilityLabel("Error de inicio de sesión: \(appleError)")
                        }
                        Button("Crear cuenta con correo", action: onCreateAccount)
                            .buttonStyle(TriWaveXPrimaryButtonStyle(tint: .triWaveXAqua)).controlSize(.large).frame(maxWidth: .infinity)
                    }
                    actions
                }
                .padding(20).frame(maxWidth: TriWaveXMetrics.contentMaximumWidth, alignment: .leading).frame(maxWidth: .infinity)
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .navigationTitle("TriWaveX").navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .topBarLeading) { Button("Cancelar", action: cancelAndClear) } }
            .onChange(of: preferences.goal) { _, _ in persist() }
            .onChange(of: preferences.modality) { _, _ in ensureDistanceMatchesModality(); persist() }
            .onChange(of: preferences.distance) { _, _ in persist() }
            .onChange(of: preferences.level) { _, _ in persist() }
            .onChange(of: preferences.weeklyHours) { _, _ in persist() }
            .onChange(of: preferences.raceDate) { _, _ in persist() }
            .onChange(of: hasRaceDate) { _, value in
                if !value { preferences.raceDate = nil }
                else if preferences.raceDate == nil { preferences.raceDate = Calendar.current.date(byAdding: .month, value: 6, to: Date()) }
                persist()
            }
            .confirmationDialog("Elige deporte", isPresented: $showingSportChoices, titleVisibility: .visible) {
                Button("Triatlón") { preferences.modality = "triatlon" }
                Button("Carrera") { preferences.modality = "carrera" }
                Button("Duatlón") { preferences.modality = "duatlon" }
                Button("Acuatlón") { preferences.modality = "acuatlon" }
                Button("Cancelar", role: .cancel) {}
            }
            .confirmationDialog("Elige distancia", isPresented: $showingDistanceChoices, titleVisibility: .visible) {
                ForEach(distanceOptions, id: \.id) { option in Button(option.title) { preferences.distance = option.id } }
                Button("Cancelar", role: .cancel) {}
            }
        }
        .onAppear {
            let storedDate = UserDefaults.standard.string(forKey: NativeAthleteDraft.prefix + "targetRaceDate")
            hasRaceDate = storedDate.map { !$0.isEmpty } ?? false
            persist()
        }
    }

    private var actions: some View {
        VStack(spacing: 10) {
            if step < 2 {
                Button(step == 0 ? "Personalizar mi plan" : "Ver una propuesta") {
                    withAnimation(TriWaveXMotion.stateChange(reduced: reduceMotion)) { step += 1 }
                    persist()
                }
                .buttonStyle(TriWaveXPrimaryButtonStyle(tint: .triWaveXAqua)).controlSize(.large).frame(maxWidth: .infinity)
                .disabled(step == 1 && preferences.goal.trimmingCharacters(in: .whitespacesAndNewlines).count < 2)
            } else if step > 0 {
                Button("Atrás") { withAnimation { step -= 1 }; persist() }.buttonStyle(.borderless)
            }
        }.padding(.top, 6)
    }

    private var raceDateBinding: Binding<Date> {
        Binding(get: { preferences.raceDate ?? Calendar.current.date(byAdding: .month, value: 6, to: Date()) ?? Date() }, set: { preferences.raceDate = $0 })
    }
    private var distanceOptions: [(id: String, title: String)] {
        switch preferences.modality {
        case "carrera": [("5k", "5 km"), ("10k", "10 km"), ("medio_maraton", "Media maratón"), ("maraton", "Maratón"), ("trail", "Trail"), ("ultra", "Ultra en asfalto"), ("ultra_trail", "Ultra Trail")]
        case "triatlon": [("sprint", "Sprint"), ("olimpico", "Olímpico"), ("half", "70.3"), ("full", "Larga distancia")]
        case "duatlon", "acuatlon": [("sprint", "Sprint"), ("olimpico", "Olímpico"), ("half", "Media distancia")]
        default: [("sprint", "Sprint"), ("olimpico", "Olímpico"), ("half", "70.3"), ("full", "Larga distancia")]
        }
    }
    private var distanceTitle: String { distanceOptions.first(where: { $0.id == preferences.distance })?.title ?? distanceOptions[0].title }
    private var raceDateSummary: String {
        guard hasRaceDate, let date = preferences.raceDate else { return "Plan flexible · aún sin fecha de competición" }
        return "Carrera el \(date.formatted(date: .long, time: .omitted))"
    }
    private var modalityTitle: String { switch preferences.modality { case "carrera": "Carrera"; case "duatlon": "Duatlón"; case "acuatlon": "Acuatlón"; default: "Triatlón" } }
    private var modalityIcon: String { switch preferences.modality { case "carrera", "duatlon": "figure.run"; case "acuatlon": "figure.pool.swim"; default: "figure.triathlon" } }
    private var suggestedSessions: [(day: String, title: String, icon: String)] {
        let all: [(day: String, title: String, icon: String)] = switch preferences.modality {
        case "carrera": [("Mar", "Carrera suave", "figure.run"), ("Jue", "Ritmo y técnica", "figure.run"), ("Sáb", "Fuerza", "dumbbell"), ("Dom", "Rodaje largo", "figure.run")]
        case "duatlon": [("Mar", "Carrera", "figure.run"), ("Jue", "Bicicleta", "bicycle"), ("Sáb", "Carrera y técnica", "figure.run"), ("Dom", "Fuerza", "dumbbell")]
        case "acuatlon": [("Mar", "Natación", "figure.pool.swim"), ("Jue", "Carrera", "figure.run"), ("Sáb", "Natación técnica", "figure.pool.swim"), ("Dom", "Fuerza", "dumbbell")]
        case "triatlon": [("Lun", "Natación", "figure.pool.swim"), ("Mié", "Bicicleta", "bicycle"), ("Vie", "Carrera", "figure.run"), ("Dom", "Fuerza y movilidad", "dumbbell")]
        default: [("Lun", "Natación", "figure.pool.swim"), ("Mié", "Bicicleta", "bicycle"), ("Vie", "Carrera", "figure.run"), ("Dom", "Fuerza y movilidad", "dumbbell")]
        }
        return preferences.weeklyHours <= 6 ? Array(all.prefix(3)) : all
    }
    private func choice(title: String, value: String, icon: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 13) {
                Image(systemName: icon).font(.headline).frame(width: 28, height: 28).foregroundStyle(Color.triWaveXAqua)
                VStack(alignment: .leading, spacing: 2) { Text(title).font(.caption.weight(.semibold)).foregroundStyle(.secondary); Text(value).font(.headline).foregroundStyle(.primary) }
                Spacer(); Image(systemName: "chevron.up.chevron.down").font(.caption.weight(.bold)).foregroundStyle(Color.triWaveXAqua)
            }.padding(15).background(Color.triWaveXSurface, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                .overlay { RoundedRectangle(cornerRadius: 16, style: .continuous).stroke(Color.triWaveXAqua.opacity(0.55), lineWidth: 1.5) }
        }.buttonStyle(.plain)
    }
    private func persist() { NativeAthleteDraft.save(preferences, step: step) }
    private func cancelAndClear() { NativeAthleteDraft.clear(); onCancel() }
    private func ensureDistanceMatchesModality() {
        guard !distanceOptions.contains(where: { $0.id == preferences.distance }) else { return }
        preferences.distance = distanceOptions[0].id
    }
}

struct NativeAccessResponse: Decodable, Equatable {
    let destination: String
    let userID: String
    let role: String
    let entitled: Bool
}

private enum NativeEntryError: LocalizedError {
    case invalidConfiguration
    case unauthorized
    case message(String)

    var errorDescription: String? {
        switch self {
        case .invalidConfiguration: "No se ha podido abrir TriWaveX de forma segura."
        case .unauthorized: "Tu sesión ha caducado. Vuelve a iniciar sesión."
        case .message(let value): value
        }
    }
}

struct NativeEntryTransport {
    let origin: URL
    let store: WKWebsiteDataStore

    func get<Response: Decodable>(_ path: String, response: Response.Type) async throws -> Response {
        guard Configuration.allows(origin, origin: origin),
              let url = URL(string: path, relativeTo: origin)?.absoluteURL,
              Configuration.allows(url, origin: origin) else { throw NativeEntryError.invalidConfiguration }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.timeoutInterval = 30
        request.httpShouldHandleCookies = false
        request.setValue("1", forHTTPHeaderField: "X-TriWaveX-Native")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let cookie = await cookieHeader(for: url) { request.setValue(cookie, forHTTPHeaderField: "Cookie") }

        let configuration = URLSessionConfiguration.ephemeral
        configuration.httpShouldSetCookies = false
        let session = URLSession(configuration: configuration, delegate: NoRedirects(), delegateQueue: nil)
        defer { session.invalidateAndCancel() }
        let (data, rawResponse) = try await session.data(for: request)
        guard let http = rawResponse as? HTTPURLResponse,
              Configuration.allows(http.url ?? url, origin: origin) else {
            throw NativeEntryError.message("La respuesta del servidor no es válida.")
        }
        if http.statusCode == 401 { throw NativeEntryError.unauthorized }
        if !(200..<300).contains(http.statusCode) {
            let message = (try? JSONDecoder().decode(ErrorResponse.self, from: data).error) ?? "No se ha podido cargar la información."
            throw NativeEntryError.message(message)
        }
        let result = try JSONDecoder().decode(Response.self, from: data)
        await persistCookies(from: http, for: url)
        return result
    }

    func send<T: Encodable, Response: Decodable>(_ path: String, body: T, response: Response.Type) async throws -> Response {
        guard Configuration.allows(origin, origin: origin),
              let url = URL(string: path, relativeTo: origin)?.absoluteURL,
              Configuration.allows(url, origin: origin) else { throw NativeEntryError.invalidConfiguration }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = 30
        request.httpShouldHandleCookies = false
        request.setValue("1", forHTTPHeaderField: "X-TriWaveX-Native")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.httpBody = try JSONEncoder().encode(body)
        if let cookie = await cookieHeader(for: url) { request.setValue(cookie, forHTTPHeaderField: "Cookie") }

        let configuration = URLSessionConfiguration.ephemeral
        configuration.httpShouldSetCookies = false
        let session = URLSession(configuration: configuration, delegate: NoRedirects(), delegateQueue: nil)
        defer { session.invalidateAndCancel() }
        let (data, rawResponse) = try await session.data(for: request)
        guard let http = rawResponse as? HTTPURLResponse,
              Configuration.allows(http.url ?? url, origin: origin) else { throw NativeEntryError.message("La respuesta del servidor no es válida.") }
        if http.statusCode == 401 { throw NativeEntryError.unauthorized }
        if !(200..<300).contains(http.statusCode) {
            let message = (try? JSONDecoder().decode(ErrorResponse.self, from: data).error) ?? "No se ha podido completar la operación."
            throw NativeEntryError.message(message)
        }
        let result = try JSONDecoder().decode(Response.self, from: data)
        await persistCookies(from: http, for: url)
        return result
    }

    private func cookieHeader(for url: URL) async -> String? {
        guard let host = url.host?.lowercased(), let scheme = url.scheme?.lowercased() else { return nil }
        let cookies = await withCheckedContinuation { continuation in store.httpCookieStore.getAllCookies { continuation.resume(returning: $0) } }
        let now = Date()
        let matching = cookies.filter { cookie in
            let domain = cookie.domain.trimmingCharacters(in: CharacterSet(charactersIn: ".")).lowercased()
            return (cookie.expiresDate.map { $0 > now } ?? true) && (!cookie.isSecure || scheme == "https") &&
                (host == domain || host.hasSuffix(".\(domain)")) && !cookie.name.contains(";") && !cookie.value.contains(";")
        }
        return matching.isEmpty ? nil : matching.map { "\($0.name)=\($0.value)" }.joined(separator: "; ")
    }

    private func persistCookies(from response: HTTPURLResponse, for url: URL) async {
        let fields = response.allHeaderFields.reduce(into: [String: String]()) { result, item in
            if let key = item.key as? String, let value = item.value as? String { result[key] = value }
        }
        for cookie in HTTPCookie.cookies(withResponseHeaderFields: fields, for: url) {
            await store.httpCookieStore.setCookie(cookie)
            HTTPCookieStorage.shared.setCookie(cookie)
        }
    }

    private struct ErrorResponse: Decodable { let error: String }
}

@MainActor
@Observable final class NativeRegistrationModel {
    enum State { case idle, saving, confirmationRequired(String), failed(String) }
    struct Outcome {
        let destination: String
        let givenName: String
        let role: String
        let userID: String
    }

    var firstName = ""
    var lastName = ""
    var email = ""
    var password = ""
    var passwordConfirmation = ""
    var revealPassword = false
    var state: State = .idle

    private let transport: NativeEntryTransport
    private let role: String
    private let defaults: UserDefaults

    init(origin: URL, store: WKWebsiteDataStore, role: String, defaults: UserDefaults = .standard) {
        transport = NativeEntryTransport(origin: origin, store: store)
        self.role = role
        self.defaults = defaults
        firstName = defaults.string(forKey: draftKey("firstName")) ?? ""
        lastName = defaults.string(forKey: draftKey("lastName")) ?? ""
        email = defaults.string(forKey: draftKey("email")) ?? ""
    }

    var hasDraft: Bool { !firstName.isEmpty || !lastName.isEmpty || !email.isEmpty }

    var canSubmit: Bool {
        !firstName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        password.count >= 8 && password == passwordConfirmation
    }

    func submit() async -> Outcome? {
        guard canSubmit else { return nil }
        state = .saving
        struct Input: Encodable { let email, password, firstName, lastName, role: String }
        struct Result: Decodable { let emailConfirmRequired: Bool; let destination: String?; let userID: String; let role: String? }
        do {
            let result = try await transport.send("/api/native/register", body: Input(email: email.trimmingCharacters(in: .whitespacesAndNewlines), password: password, firstName: firstName.trimmingCharacters(in: .whitespacesAndNewlines), lastName: lastName.trimmingCharacters(in: .whitespacesAndNewlines), role: role), response: Result.self)
            password = ""; passwordConfirmation = ""
            clearDraft()
            if result.emailConfirmRequired { state = .confirmationRequired(email); return nil }
            guard let destination = result.destination, !result.userID.isEmpty,
                  let responseRole = result.role, responseRole == role else {
                state = .failed("El tipo de cuenta recibido no coincide. Contacta con soporte antes de volver a intentarlo.")
                return nil
            }
            state = .idle
            return Outcome(
                destination: destination,
                givenName: firstName.trimmingCharacters(in: .whitespacesAndNewlines),
                role: responseRole,
                userID: result.userID
            )
        } catch { state = .failed(error.localizedDescription); return nil }
    }

    func persistDraft() {
        defaults.set(firstName, forKey: draftKey("firstName"))
        defaults.set(lastName, forKey: draftKey("lastName"))
        defaults.set(email, forKey: draftKey("email"))
    }

    private func clearDraft() {
        ["firstName", "lastName", "email"].forEach { defaults.removeObject(forKey: draftKey($0)) }
    }

    private func draftKey(_ field: String) -> String { "triwavex.registration.\(role).\(field)" }
}

struct NativeRegistrationView: View {
    let role: String
    let origin: URL
    let store: WKWebsiteDataStore
    let onCancel: () -> Void
    let onRegistered: (NativeRegistrationModel.Outcome) -> Void
    @State private var model: NativeRegistrationModel
    @FocusState private var focusedField: Field?

    private enum Field { case firstName, lastName, email, password, confirmation }

    init(role: String, origin: URL, store: WKWebsiteDataStore, onCancel: @escaping () -> Void, onRegistered: @escaping (NativeRegistrationModel.Outcome) -> Void) {
        self.role = role; self.origin = origin; self.store = store; self.onCancel = onCancel; self.onRegistered = onRegistered
        _model = State(initialValue: NativeRegistrationModel(origin: origin, store: store, role: role))
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Crear cuenta").font(.largeTitle.bold())
                        Text(role == "coach" ? "Empieza a acompañar a tus atletas." : "Empieza a entrenar con una dirección clara.")
                            .foregroundStyle(.secondary)
                        if model.hasDraft {
                            Label("Continuamos donde lo dejaste", systemImage: "arrow.counterclockwise.circle.fill")
                                .font(.footnote.weight(.semibold))
                                .foregroundStyle(.tint)
                        }
                    }.padding(.bottom, 8)

                    Group {
                        HStack(spacing: 12) {
                            nativeField("Nombre", text: $model.firstName, field: .firstName, contentType: .givenName)
                            nativeField("Apellidos", text: $model.lastName, field: .lastName, contentType: .familyName)
                        }
                        nativeField("Correo electrónico", text: $model.email, field: .email, contentType: .emailAddress, keyboard: .emailAddress)
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Contraseña").font(.subheadline.weight(.semibold)).foregroundStyle(.secondary)
                            HStack {
                                Group { model.revealPassword ? AnyView(TextField("Mínimo 8 caracteres", text: $model.password)) : AnyView(SecureField("Mínimo 8 caracteres", text: $model.password)) }
                                    .textContentType(.newPassword).focused($focusedField, equals: .password)
                                Button { model.revealPassword.toggle() } label: { Image(systemName: model.revealPassword ? "eye.slash" : "eye") }.accessibilityLabel("Mostrar u ocultar contraseña")
                            }.padding(.horizontal, 14).frame(minHeight: 52).background(Color.triWaveXSurface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                        }
                        nativeField("Confirmar contraseña", text: $model.passwordConfirmation, field: .confirmation, contentType: .newPassword, secure: true)
                    }
                    .submitLabel(.next)

                    if case .failed(let message) = model.state { Label(message, systemImage: "exclamationmark.triangle.fill").font(.footnote).foregroundStyle(.red) }
                    if case .confirmationRequired(let address) = model.state { Label("Te hemos enviado un enlace de confirmación a \(address). Cuando lo abras, vuelve a iniciar sesión.", systemImage: "envelope.badge") .font(.footnote).foregroundStyle(.secondary) }

                    Button {
                        focusedField = nil
                        Task { if let result = await model.submit() { onRegistered(result) } }
                    } label: {
                        if case .saving = model.state { ProgressView().tint(.white) } else { Text("Crear cuenta") }
                    }
                    .buttonStyle(TriWaveXPrimaryButtonStyle(tint: .triWaveXAqua)).controlSize(.large).frame(maxWidth: .infinity).disabled(!model.canSubmit || isSaving)

                    Button("Ya tengo una cuenta", action: onCancel).buttonStyle(.borderless).frame(maxWidth: .infinity).padding(.top, 4)
                }
                .padding(20).frame(maxWidth: TriWaveXMetrics.contentMaximumWidth, alignment: .leading).frame(maxWidth: .infinity)
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .navigationTitle("TriWaveX").navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .topBarLeading) { Button("Cancelar", action: onCancel) } }
            .onChange(of: model.firstName) { _, _ in model.persistDraft() }
            .onChange(of: model.lastName) { _, _ in model.persistDraft() }
            .onChange(of: model.email) { _, _ in model.persistDraft() }
        }
    }

    private var isSaving: Bool { if case .saving = model.state { true } else { false } }

    private func nativeField(_ title: String, text: Binding<String>, field: Field, contentType: UITextContentType, keyboard: UIKeyboardType = .default, secure: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(.subheadline.weight(.semibold)).foregroundStyle(.secondary)
            Group { secure ? AnyView(SecureField(title, text: text)) : AnyView(TextField(title, text: text)) }
                .textContentType(contentType).keyboardType(keyboard).textInputAutocapitalization(keyboard == .emailAddress ? .never : .words).autocorrectionDisabled(keyboard == .emailAddress).focused($focusedField, equals: field)
                .padding(.horizontal, 14).frame(minHeight: 52).background(Color.triWaveXSurface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
    }
}

@MainActor
@Observable final class NativeOnboardingModel {
    enum State { case editing, saving, failed(String), preview(NativePlanPreview), readyForPayment }
    var goal = "Mi próximo objetivo"
    var modality = "triatlon"
    var targetRaceDistance = "half"
    var targetRaceDate: Date?
    var level = "intermedio"
    var weeklyHours = 7.0
    var wantsCoach = false
    var injuries = ""
    var healthDataConsent = false
    var state: State = .editing
    private let transport: NativeEntryTransport
    private let defaults: UserDefaults

    init(origin: URL, store: WKWebsiteDataStore, defaults: UserDefaults = .standard) {
        transport = NativeEntryTransport(origin: origin, store: store)
        self.defaults = defaults
        NativeAthleteDraft.removeExpired(from: defaults)
        goal = defaults.string(forKey: "triwavex.onboarding.goal") ?? goal
        modality = defaults.string(forKey: "triwavex.onboarding.modality") ?? modality
        targetRaceDistance = defaults.string(forKey: "triwavex.onboarding.targetRaceDistance") ?? targetRaceDistance
        if let rawDate = defaults.string(forKey: "triwavex.onboarding.targetRaceDate"), !rawDate.isEmpty {
            targetRaceDate = NativeAthleteDraft.dayDate(rawDate)
        }
        level = defaults.string(forKey: "triwavex.onboarding.level") ?? level
        if defaults.object(forKey: "triwavex.onboarding.weeklyHours") != nil {
            weeklyHours = defaults.double(forKey: "triwavex.onboarding.weeklyHours")
        }
        wantsCoach = defaults.bool(forKey: "triwavex.onboarding.wantsCoach")
        if defaults.bool(forKey: "triwavex.onboarding.readyForPayment") { state = .readyForPayment }
    }

    var hasDraft: Bool {
        defaults.object(forKey: "triwavex.onboarding.step") != nil ||
            defaults.object(forKey: NativeAthleteDraft.expiryKey) != nil ||
            defaults.bool(forKey: "triwavex.onboarding.readyForPayment")
    }

    func persistDraft(step: Int) {
        defaults.set(goal, forKey: "triwavex.onboarding.goal")
        defaults.set(modality, forKey: "triwavex.onboarding.modality")
        defaults.set(targetRaceDistance, forKey: "triwavex.onboarding.targetRaceDistance")
        defaults.set(level, forKey: "triwavex.onboarding.level")
        defaults.set(weeklyHours, forKey: "triwavex.onboarding.weeklyHours")
        defaults.set(wantsCoach, forKey: "triwavex.onboarding.wantsCoach")
        defaults.set(step, forKey: "triwavex.onboarding.step")
    }

    func clearDraft() {
        NativeAthleteDraft.clear(from: defaults)
    }

    func save() async {
        state = .saving
        struct Input: Encodable { let goal, modality, targetRaceDistance, level: String; let targetRaceDate: String?; let weeklyHours: Double; let wantsCoach: Bool; let previousInjuries: String; let healthDataConsent: Bool }
        struct Result: Decodable { let success: Bool; let preview: NativePlanPreview }
        do {
            let result = try await transport.send("/api/native/onboarding", body: Input(goal: goal, modality: modality, targetRaceDistance: targetRaceDistance, level: level, targetRaceDate: targetRaceDate.map(Self.dayString), weeklyHours: weeklyHours, wantsCoach: wantsCoach, previousInjuries: injuries, healthDataConsent: healthDataConsent), response: Result.self)
            state = .preview(result.preview)
        } catch { state = .failed(error.localizedDescription) }
    }

    func continueToPayment() {
        state = .readyForPayment
        defaults.set(true, forKey: "triwavex.onboarding.readyForPayment")
    }

    private static func dayString(_ date: Date) -> String {
        NativeAthleteDraft.dayString(date)
    }
}

struct NativePlanPreview: Decodable {
    struct Session: Decodable { let day: String; let sport: String }
    let name: String
    let description: String?
    let durationWeeks: Int?
    let sessions: [Session]
}

struct NativeOnboardingView: View {
    let origin: URL
    let store: WKWebsiteDataStore
    let expectedUserID: String
    let givenName: String
    let onFinished: (NativeSubscriptionResult) -> Void
    @State private var model: NativeOnboardingModel
    @State private var step = 0
    @State private var showingSportChoices = false
    @State private var showingDistanceChoices = false

    init(origin: URL, store: WKWebsiteDataStore, expectedUserID: String, givenName: String, onFinished: @escaping (NativeSubscriptionResult) -> Void) {
        self.origin = origin; self.store = store; self.expectedUserID = expectedUserID; self.givenName = givenName; self.onFinished = onFinished
        _model = State(initialValue: NativeOnboardingModel(origin: origin, store: store))
        let defaults = UserDefaults.standard
        let savedStep = min(max(defaults.integer(forKey: "triwavex.onboarding.step"), 0), 2)
        let completedPreAuthDraft = defaults.integer(forKey: NativeAthleteDraft.preAuthStepKey) >= 2
        // The pre-sign-in flow already collects goal, sport, distance, level,
        // date and weekly time. Continue at the only new post-auth step.
        _step = State(initialValue: completedPreAuthDraft ? 2 : savedStep)
    }

    var body: some View {
        NavigationStack {
            Group {
                if case .readyForPayment = model.state {
                    NativeSubscriptionStoreView(
                        origin: origin,
                        store: store,
                        expectedUserID: expectedUserID,
                        role: "athlete",
                        showPlanComparison: false,
                        onFinished: { result in
                            model.clearDraft()
                            onFinished(result)
                        }
                    )
                } else if case .preview(let preview) = model.state {
                    NativePlanPreviewView(preview: preview, onContinue: model.continueToPayment)
                } else {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 22) {
                            if model.hasDraft {
                                Label("Continuamos donde lo dejaste", systemImage: "arrow.counterclockwise.circle.fill")
                                    .font(.footnote.weight(.semibold)).foregroundStyle(.tint)
                            }
                            progress
                            content
                            Label("Guardado", systemImage: "checkmark.circle.fill")
                                .font(.caption).foregroundStyle(.secondary)
                            actions
                        }
                        .padding(20).frame(maxWidth: TriWaveXMetrics.contentMaximumWidth, alignment: .leading).frame(maxWidth: .infinity)
                    }
                        .background(Color(uiColor: .systemGroupedBackground))
                }
            }
            .navigationTitle(step == 0 ? "Conócete" : step == 1 ? "Tu semana" : "Último detalle")
            .navigationBarTitleDisplayMode(.inline)
            .onChange(of: step) { _, value in model.persistDraft(step: value) }
            .onChange(of: model.goal) { _, _ in model.persistDraft(step: step) }
            .onChange(of: model.modality) { _, _ in model.persistDraft(step: step) }
            .onChange(of: model.targetRaceDistance) { _, _ in model.persistDraft(step: step) }
            .onChange(of: model.level) { _, _ in model.persistDraft(step: step) }
            .onChange(of: model.weeklyHours) { _, _ in model.persistDraft(step: step) }
            .onChange(of: model.wantsCoach) { _, _ in model.persistDraft(step: step) }
            .onAppear { ensureDistanceMatchesModality() }
            .confirmationDialog("Elige deporte", isPresented: $showingSportChoices, titleVisibility: .visible) {
                Button("Triatlón") { chooseModality("triatlon") }
                Button("Carrera") { chooseModality("carrera") }
                Button("Duatlón") { chooseModality("duatlon") }
                Button("Acuatlón") { chooseModality("acuatlon") }
                Button("Cancelar", role: .cancel) {}
            }
            .confirmationDialog("Elige distancia", isPresented: $showingDistanceChoices, titleVisibility: .visible) {
                ForEach(distanceOptions, id: \.id) { option in
                    Button(option.title) { model.targetRaceDistance = option.id }
                }
                Button("Cancelar", role: .cancel) {}
            }
        }
    }

    private var progress: some View { ProgressView(value: Double(step + 1), total: 3).tint(Color.triWaveXAqua).accessibilityLabel("Paso \(step + 1) de 3") }

    @ViewBuilder private var content: some View {
        if step == 0 {
            Text(onboardingQuestion).font(.largeTitle.bold())
            Text("Elige tu deporte y distancia. Con esto prepararemos un plan inicial que podrás ajustar después.").foregroundStyle(.secondary)
            onboardingChoice(title: "Deporte", value: modalityTitle, icon: modalityIcon) { showingSportChoices = true }
            onboardingChoice(title: "Distancia", value: distanceTitle, icon: "flag.checkered") { showingDistanceChoices = true }
            Picker("Experiencia", selection: $model.level) { Text("Principiante").tag("principiante"); Text("Intermedio").tag("intermedio"); Text("Avanzado").tag("avanzado") }.pickerStyle(.segmented)
        } else if step == 1 {
            Text("¿Cuánto tiempo tienes?").font(.largeTitle.bold())
            Text("\(Int(model.weeklyHours)) horas a la semana").font(.title2.weight(.semibold)).foregroundStyle(Color.triWaveXAqua)
            Slider(value: $model.weeklyHours, in: 2...20, step: 1).tint(Color.triWaveXAqua)
            Text("Podrás cambiarlo cuando quieras. Es mejor empezar con un plan que puedas sostener.").foregroundStyle(.secondary)
        } else {
            Text("Personaliza tu apoyo").font(.largeTitle.bold())
            Toggle("Quiero encontrar o conectar con un entrenador", isOn: $model.wantsCoach)
            if model.wantsCoach {
                Label("Te ayudaremos a encontrar o conectar con un entrenador después. Tu plan inicial y el precio de atleta no cambian.", systemImage: "person.2.fill")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .padding(12)
                    .background(Color.triWaveXAqua.opacity(0.09), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
            VStack(alignment: .leading, spacing: 8) { Text("Lesiones o límites actuales (opcional)").font(.headline); TextEditor(text: $model.injuries).frame(minHeight: 110).padding(8).background(Color.triWaveXSurface, in: RoundedRectangle(cornerRadius: 14, style: .continuous)); Text("Solo lo usamos para ajustar el entrenamiento. No sustituye a un profesional sanitario.").font(.footnote).foregroundStyle(.secondary) }
            Toggle("Consiento que TriWaveX use estos datos de salud para adaptar mi entrenamiento", isOn: $model.healthDataConsent)
                .font(.footnote)
            Text("Puedes dejarlo en blanco si prefieres no compartir esta información. Tu consentimiento se guardará junto con el perfil.")
                .font(.footnote).foregroundStyle(.secondary)
        }
    }

    private func onboardingChoice(title: String, value: String, icon: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 13) {
                Image(systemName: icon).font(.headline).frame(width: 28, height: 28).foregroundStyle(Color.triWaveXAqua)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(.caption.weight(.semibold)).foregroundStyle(.secondary)
                    Text(value).font(.headline).foregroundStyle(.primary)
                }
                Spacer()
                Image(systemName: "chevron.up.chevron.down").font(.caption.weight(.bold)).foregroundStyle(Color.triWaveXAqua)
            }
            .padding(15)
            .background(Color.triWaveXSurface, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay { RoundedRectangle(cornerRadius: 16, style: .continuous).stroke(Color.triWaveXAqua.opacity(0.55), lineWidth: 1.5) }
        }
        .buttonStyle(.plain)
        .accessibilityHint("Toca para elegir \(title.lowercased())")
    }

    private var modalityTitle: String {
        switch model.modality { case "carrera": "Carrera"; case "duatlon": "Duatlón"; case "acuatlon": "Acuatlón"; default: "Triatlón" }
    }

    private var modalityIcon: String {
        switch model.modality { case "carrera": "figure.run"; case "duatlon": "figure.run"; case "acuatlon": "figure.pool.swim"; default: "figure.triathlon" }
    }

    private var distanceOptions: [(id: String, title: String)] {
        switch model.modality {
        case "carrera": [("5k", "5 km"), ("10k", "10 km"), ("medio_maraton", "Media maratón"), ("maraton", "Maratón"), ("trail", "Trail"), ("ultra", "Ultra en asfalto"), ("ultra_trail", "Ultra Trail")]
        case "triatlon": [("sprint", "Sprint"), ("olimpico", "Olímpico"), ("half", "70.3"), ("full", "Larga distancia")]
        case "duatlon", "acuatlon": [("sprint", "Sprint"), ("olimpico", "Olímpico"), ("half", "Media distancia")]
        default: [("sprint", "Sprint"), ("olimpico", "Olímpico"), ("half", "70.3"), ("full", "Larga distancia")]
        }
    }

    private var distanceTitle: String { distanceOptions.first(where: { $0.id == model.targetRaceDistance })?.title ?? distanceOptions[0].title }

    private func chooseModality(_ value: String) {
        model.modality = value
        ensureDistanceMatchesModality()
    }

    private func ensureDistanceMatchesModality() {
        if !distanceOptions.contains(where: { $0.id == model.targetRaceDistance }) {
            model.targetRaceDistance = distanceOptions[0].id
        }
    }

    private var onboardingQuestion: String {
        let name = givenName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard (2...30).contains(name.count),
              name.unicodeScalars.contains(where: CharacterSet.letters.contains) else {
            return "¿Qué quieres conseguir?"
        }
        return "\(name), ¿qué quieres conseguir?"
    }

    private var actions: some View {
        VStack(spacing: 12) {
            if case .failed(let message) = model.state { Label(message, systemImage: "exclamationmark.triangle.fill").font(.footnote).foregroundStyle(.red) }
            Button {
                if step < 2 { withAnimation { step += 1 } } else { Task { await model.save() } }
            } label: {
                if isSaving {
                    HStack(spacing: 10) {
                        ProgressView().tint(.white)
                        Text("Guardando tu plan…")
                    }
                } else {
                    Text(step == 2 ? "Ver mi plan" : "Continuar")
                }
            }
                .buttonStyle(.borderedProminent).controlSize(.large).frame(maxWidth: .infinity)
                .disabled(isSaving || model.goal.trimmingCharacters(in: .whitespacesAndNewlines).count < 2 || (!model.injuries.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !model.healthDataConsent))
                .accessibilityLabel(isSaving ? "Guardando tu plan y preparando tus entrenamientos" : step == 2 ? "Ver mi plan" : "Continuar")
            if isSaving {
                Label("Estamos creando las sesiones de tu calendario. Esto puede tardar unos segundos.", systemImage: "calendar.badge.clock")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            if step > 0 { Button("Atrás") { withAnimation { step -= 1 } }.buttonStyle(.borderless) }
        }.padding(.top, 12)
    }
    private var isSaving: Bool { if case .saving = model.state { true } else { false } }
}

private struct NativePlanPreviewView: View {
    let preview: NativePlanPreview
    let onContinue: () -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                Label("Tu plan inicial", systemImage: "checkmark.seal.fill")
                    .font(.headline)
                    .foregroundStyle(Color.triWaveXAqua)
                Text(preview.name).font(.largeTitle.bold())
                if let description = preview.description, !description.isEmpty {
                    Text(description).foregroundStyle(.secondary)
                }
                if let duration = preview.durationWeeks {
                    Label("Plan de \(duration) semanas", systemImage: "calendar")
                        .font(.subheadline.weight(.semibold))
                }
                TriWaveXSurface {
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Tus días propuestos").font(.title3.bold())
                        ForEach(preview.sessions, id: \.day) { session in
                            HStack(spacing: 12) {
                                Image(systemName: icon(for: session.sport))
                                    .foregroundStyle(Color.triWaveXAqua)
                                    .frame(width: 30, height: 30)
                                    .background(Color.triWaveXAqua.opacity(0.12), in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                                Text(session.day).font(.headline).frame(width: 32, alignment: .leading)
                                Text(title(for: session.sport)).foregroundStyle(.secondary)
                            }
                        }
                    }
                }
                Label("Podrás adaptar los días y la carga desde tu plan cuando actives el acceso.", systemImage: "slider.horizontal.3")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                Button("Ver acceso y prueba gratuita", action: onContinue)
                    .buttonStyle(TriWaveXPrimaryButtonStyle(tint: .triWaveXAqua))
                    .frame(maxWidth: .infinity)
            }
            .padding(20)
            .frame(maxWidth: TriWaveXMetrics.contentMaximumWidth, alignment: .leading)
            .frame(maxWidth: .infinity)
        }
        .background(Color(uiColor: .systemGroupedBackground))
        .navigationTitle("Tu plan")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func icon(for sport: String) -> String {
        switch sport { case "natacion": "figure.pool.swim"; case "ciclismo": "bicycle"; case "carrera": "figure.run"; case "fuerza": "dumbbell"; default: "arrow.triangle.2.circlepath" }
    }

    private func title(for sport: String) -> String {
        switch sport { case "natacion": "Natación"; case "ciclismo": "Ciclismo"; case "carrera": "Carrera"; case "fuerza": "Fuerza"; default: "Transición" }
    }
}
