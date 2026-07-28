/**
 * AI Smart Notifications System — Triatlon Pro
 *
 * La IA analiza los datos de los atletas y envía notificaciones proactivas:
 * - Detección de anomalías (HRV bajo, fatiga alta)
 * - Predicción de sobreentrenamiento
 * - Recordatorios inteligentes
 * - Alertas de cumplimiento
 */

export interface AINotification {
  id: string
  type: 'alert' | 'warning' | 'insight' | 'reminder'
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  message: string
  athleteId?: string
  athleteName?: string
  createdAt: string
  read: boolean
}

export interface AthleteAnomalyCheck {
  athleteId: string
  athleteName: string
  hrv: number | null
  hrvAvg7Days: number | null
  readiness: number | null
  fatigue: number | null
  daysSinceLastWorkout: number
  weeklyCompliance: number // 0-100
  weeklyTss: number
  ctl: number
  atl: number
  tsb: number
  streak: number // consecutive days training
  sleepAvg: number | null
}

// ============================================================
// Anomaly Detection
// ============================================================

export function detectAnomalies(athlete: AthleteAnomalyCheck): AINotification[] {
  const notifications: AINotification[] = []
  const now = new Date().toISOString()

  // 1. HRV Critical Drop
  if (athlete.hrv !== null && athlete.hrvAvg7Days !== null && athlete.hrv < athlete.hrvAvg7Days * 0.7) {
    notifications.push({
      id: `hrv-drop-${athlete.athleteId}-${Date.now()}`,
      type: 'alert',
      severity: 'critical',
      title: 'Caída crítica de HRV',
      message: `${athlete.athleteName} tiene un HRV de ${Math.round(athlete.hrv)}ms, un 30% por debajo de su media (${Math.round(athlete.hrvAvg7Days)}ms). Alto riesgo de sobreentrenamiento. Considera ajustar su carga.`,
      athleteId: athlete.athleteId,
      athleteName: athlete.athleteName,
      createdAt: now,
      read: false,
    })
  }

  // 2. Consecutive Days Without Workout
  if (athlete.daysSinceLastWorkout >= 4) {
    notifications.push({
      id: `inactive-${athlete.athleteId}-${Date.now()}`,
      type: 'warning',
      severity: athlete.daysSinceLastWorkout >= 7 ? 'high' : 'medium',
      title: 'Inactividad detectada',
      message: `${athlete.athleteName} lleva ${athlete.daysSinceLastWorkout} días sin entrenar. ${athlete.daysSinceLastWorkout >= 7 ? 'Posible riesgo de pérdida de forma. Contacta con él/ella.' : 'Un recordatorio suave podría ayudar.'}`,
      athleteId: athlete.athleteId,
      athleteName: athlete.athleteName,
      createdAt: now,
      read: false,
    })
  }

  // 3. Very Negative TSB (Overreaching)
  if (athlete.tsb < -20) {
    notifications.push({
      id: `tsb-${athlete.athleteId}-${Date.now()}`,
      type: 'alert',
      severity: 'high',
      title: 'Sobreentrenamiento detectado',
      message: `${athlete.athleteName} tiene un TSB de ${Math.round(athlete.tsb)}. Fatiga acumulada muy alta. Recomienda 2-3 días de descarga activa.`,
      athleteId: athlete.athleteId,
      athleteName: athlete.athleteName,
      createdAt: now,
      read: false,
    })
  }

  // 4. TSB Optimized (Performance ready)
  if (athlete.tsb > 5 && athlete.tsb < 15) {
    notifications.push({
      id: `tsb-optimal-${athlete.athleteId}-${Date.now()}`,
      type: 'insight',
      severity: 'low',
      title: 'TSB óptimo',
      message: `${athlete.athleteName} está con TSB de ${Math.round(athlete.tsb)}. Forma ideal para alta intensidad o competición.`,
      athleteId: athlete.athleteId,
      athleteName: athlete.athleteName,
      createdAt: now,
      read: false,
    })
  }

  // 5. Low Compliance
  if (athlete.weeklyCompliance < 60 && athlete.weeklyCompliance > 0) {
    notifications.push({
      id: `compliance-${athlete.athleteId}-${Date.now()}`,
      type: 'warning',
      severity: athlete.weeklyCompliance < 40 ? 'high' : 'medium',
      title: 'Baja adherencia al plan',
      message: `${athlete.athleteName} está al ${athlete.weeklyCompliance}% de cumplimiento semanal. ${athlete.weeklyCompliance < 40 ? 'Se recomienda revisar la carga o la motivación.' : 'Un recordatorio podría ser útil.'}`,
      athleteId: athlete.athleteId,
      athleteName: athlete.athleteName,
      createdAt: now,
      read: false,
    })
  }

  // 6. High Compliance but High Fatigue
  if (athlete.weeklyCompliance >= 90 && athlete.fatigue !== null && athlete.fatigue >= 4) {
    notifications.push({
      id: `fatigue-${athlete.athleteId}-${Date.now()}`,
      type: 'insight',
      severity: 'medium',
      title: 'Cumple pero fatigado',
      message: `${athlete.athleteName} tiene ${athlete.weeklyCompliance}% de cumplimiento pero fatiga alta (${athlete.fatigue}/5). Podría necesitar un día de recuperación.`,
      athleteId: athlete.athleteId,
      athleteName: athlete.athleteName,
      createdAt: now,
      read: false,
    })
  }

  // 7. Strong Performance Trend
  if (athlete.ctl > 80 && athlete.tsb > 0 && athlete.streak >= 14) {
    notifications.push({
      id: `trend-${athlete.athleteId}-${Date.now()}`,
      type: 'insight',
      severity: 'low',
      title: 'Tendencia muy positiva',
      message: `${athlete.athleteName} lleva ${athlete.streak} días consecutivos y CTL de ${Math.round(athlete.ctl)}. Excelente progreso.`,
      athleteId: athlete.athleteId,
      athleteName: athlete.athleteName,
      createdAt: now,
      read: false,
    })
  }

  // 8. Poor Sleep (if available)
  if (athlete.sleepAvg !== null && athlete.sleepAvg < 6) {
    notifications.push({
      id: `sleep-${athlete.athleteId}-${Date.now()}`,
      type: 'warning',
      severity: 'medium',
      title: 'Sueño insuficiente',
      message: `${athlete.athleteName} está durmiendo solo ${athlete.sleepAvg}h de media. La falta de sueño afecta la recuperación y el rendimiento.`,
      athleteId: athlete.athleteId,
      athleteName: athlete.athleteName,
      createdAt: now,
      read: false,
    })
  }

  return notifications
}

// ============================================================
// Generate Summary by Severity
// ============================================================

export function getNotificationsBySeverity(notifications: AINotification[]) {
  return {
    critical: notifications.filter(n => n.severity === 'critical'),
    high: notifications.filter(n => n.severity === 'high'),
    medium: notifications.filter(n => n.severity === 'medium'),
    low: notifications.filter(n => n.severity === 'low'),
  }
}

export function getUnreadCount(notifications: AINotification[]): number {
  return notifications.filter(n => !n.read).length
}

export function getCriticalSummary(notifications: AINotification[]): string {
  const critical = notifications.filter(n => n.severity === 'critical' || n.severity === 'high')
  if (critical.length === 0) return '✅ Todos los atletas están dentro de los parámetros normales.'
  return `⚠️ ${critical.length} alerta${critical.length > 1 ? 's' : ''} requieren atención inmediata: ${critical.map(n => n.athleteName).join(', ')}.`
}