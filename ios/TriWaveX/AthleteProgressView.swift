import SwiftUI

struct AthleteProgressView: View {
    @Bindable var model: AthleteProgressModel
    let onFallback: () -> Void

    var body: some View {
        Group {
            switch model.state {
            case .idle, .loading:
                loadingView
            case .loaded(let progress):
                content(progress)
            case .failed(let error):
                errorView(error)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemGroupedBackground).ignoresSafeArea())
        .tint(.triWaveXAqua)
        .task {
            await model.load()
        }
    }

    private var loadingView: some View {
        ContentUnavailableView {
            ProgressView()
                .controlSize(.large)
        } description: {
            Text("Estamos preparando tus datos de entrenamiento.")
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Cargando tu progreso")
    }

    private func errorView(_ error: AthleteProgressError) -> some View {
        ContentUnavailableView {
            Label(
                error == .offline ? "Sin conexión" : "No se pudo cargar",
                systemImage: error == .offline ? "wifi.slash" : "exclamationmark.triangle"
            )
        } description: {
            Text(error.localizedDescription)
        } actions: {
            VStack(spacing: 12) {
                Button {
                    Task { await model.refresh() }
                } label: {
                    Label("Reintentar", systemImage: "arrow.clockwise")
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)

                Button {
                    onFallback()
                } label: {
                    Label("Abrir resumen web", systemImage: "safari")
                }
                .buttonStyle(.bordered)
            }
        }
        .padding(.horizontal, 24)
        .accessibilityElement(children: .contain)
    }

    private func content(_ progress: AthleteProgress) -> some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Progreso")
                        .font(.largeTitle.weight(.bold))
                    Text("Tu semana, en una vista clara, \(progress.athlete.firstName).")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.vertical, 8)
                .frame(maxWidth: .infinity, alignment: .leading)
                .listRowBackground(Color.clear)
            }

            Section {
                if let workout = progress.todayWorkout {
                    LabeledContent("Disciplina", value: workout.sport.capitalized)
                    LabeledContent("Duración", value: "\(workout.durationMinutes) min")
                    if let description = workout.description, !description.isEmpty {
                        Text(description)
                            .foregroundStyle(.secondary)
                    }
                    Label(
                        workout.completed ? "Completado" : "Planificado",
                        systemImage: workout.completed ? "checkmark.circle.fill" : "calendar"
                    )
                    .foregroundStyle(workout.completed ? .green : .secondary)
                } else {
                    ContentUnavailableView("Sin sesión", systemImage: "calendar", description: Text("No hay sesión programada para hoy."))
                        .listRowBackground(Color.clear)
                }
            } header: {
                Label("Entrenamiento de hoy", systemImage: "figure.run")
            }

            Section {
                LabeledContent("Preparación", value: readiness(progress.recovery))
                LabeledContent("HRV", value: progress.recovery.hrv.map { "\(Int($0)) ms" } ?? "—")
                LabeledContent("Sueño", value: progress.recovery.sleepHours.map { String(format: "%.1f h", $0) } ?? "—")
                LabeledContent("Fatiga", value: progress.recovery.fatigueRating.map { String(Int($0)) } ?? "—")
            } header: {
                Label("Recuperación", systemImage: "heart.text.square")
            }

            Section {
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        Text("Completado")
                        Spacer()
                        Text("\(progress.week.completionPercent)%")
                            .font(.headline.monospacedDigit())
                            .foregroundStyle(.tint)
                    }
                    ProgressView(value: Double(progress.week.completionPercent), total: 100)
                        .accessibilityLabel("Progreso semanal")
                        .accessibilityValue("\(progress.week.completionPercent) por ciento")
                }
                LabeledContent("Sesiones", value: "\(progress.week.completedSessions)/\(progress.week.plannedSessions)")
                LabeledContent("Carga", value: "\(progress.week.totalTss) TSS")
                LabeledContent("Tiempo", value: "\(progress.week.totalMinutes) min")
            } header: {
                Label("Esta semana", systemImage: "chart.bar.xaxis")
            }

            Section {
                LabeledContent("Natación", value: distance(progress.summary.distanceKm.swim))
                LabeledContent("Bici", value: distance(progress.summary.distanceKm.bike))
                LabeledContent("Carrera", value: distance(progress.summary.distanceKm.run))
                LabeledContent("Sesiones completadas", value: "\(progress.summary.completedSessions)")
                LabeledContent("Racha", value: "\(progress.summary.streakWeeks) sem.")
            } header: {
                Label("Resumen", systemImage: "chart.pie")
            }

            Section {
                Text("Actualizado ahora · Datos de tu cuenta")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity)
                    .multilineTextAlignment(.center)
                    .listRowBackground(Color.clear)
            }
        }
        .listStyle(.insetGrouped)
        .refreshable {
            await model.refresh()
        }
    }

    private func readiness(_ recovery: AthleteProgress.Recovery) -> String {
        recovery.readinessScore.map { "\(Int($0))/100" } ?? "—"
    }

    private func distance(_ value: Double) -> String {
        String(format: "%.1f km", value)
    }
}
