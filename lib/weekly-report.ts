/**
 * Weekly Report Generator — Triatlon Pro
 *
 * Genera reportes automáticos semanales para coaches con:
 * - Métricas de cada atleta
 * - NOTIFICACIONES DE ANOMALÍAS (HRV, fatiga, cumplimiento, TSB)
 * - Comparación vs semana anterior
 * - Resumen general del equipo
 */

export interface AthleteReport {
  name: string
  weeklyTss: number
  previousWeekTss: number
  tssChange: number
  completedWorkouts: number
  totalWorkouts: number
  compliance: number
  hrv: number | null
  readiness: number | null
  fatigue: number | null
  tsb: number
  ctl: number
  atl: number
  status: 'excellent' | 'good' | 'warning' | 'critical'
  alerts: string[]
}

export interface WeeklyReport {
  weekRange: string
  dateGenerated: string
  totalAthletes: number
  athletes: AthleteReport[]
  teamCompliance: number
  teamTss: number
  teamTssChange: number
  athletesNeedingAttention: AthleteReport[]
  summary: string
}

// ============================================================
// Report Generator
// ============================================================

export function generateWeeklyReport(
  athletes: AthleteReport[]
): WeeklyReport {
  const now = new Date()
  const monday = getMonday(now)
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)

  const weekRange = `${monday.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${sunday.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`

  // Calculate team metrics
  const teamCompliance = athletes.length > 0
    ? Math.round(athletes.reduce((sum, a) => sum + a.compliance, 0) / athletes.length)
    : 0

  const teamTss = athletes.reduce((sum, a) => sum + a.weeklyTss, 0)
  const teamTssChange = athletes.length > 0
    ? Math.round(athletes.reduce((sum, a) => sum + a.tssChange, 0) / athletes.length)
    : 0

  // Flag athletes needing attention
  const athletesNeedingAttention = athletes.filter(a =>
    a.alerts.length > 0 || a.status === 'critical' || a.status === 'warning'
  )

  // Generate summary
  const summary = generateSummary(athletes, teamCompliance, athletesNeedingAttention)

  return {
    weekRange,
    dateGenerated: now.toISOString(),
    totalAthletes: athletes.length,
    athletes,
    teamCompliance,
    teamTss,
    teamTssChange,
    athletesNeedingAttention,
    summary,
  }
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function generateSummary(
  athletes: AthleteReport[],
  teamCompliance: number,
  athletesNeedingAttention: AthleteReport[]
): string {
  const total = athletes.length
  const goodStatus = athletes.filter(a => a.status === 'excellent' || a.status === 'good').length
  const criticalCount = athletes.filter(a => a.status === 'critical').length

  let summary = `📊 **Informe Semanal de Rendimiento**\n\n`

  summary += `**Resumen del equipo:**\n`
  summary += `• Atletas: ${total}\n`
  summary += `• Cumplimiento medio: ${teamCompliance}%\n`
  summary += `• Estado positivo: ${goodStatus} de ${total} atletas\n`

  if (athletesNeedingAttention.length > 0) {
    summary += `\n**⚠️ Atletas que requieren atención (${athletesNeedingAttention.length}):**\n`
    athletesNeedingAttention.slice(0, 5).forEach(a => {
      summary += `• **${a.name}**: ${a.alerts.slice(0, 2).join(', ')}\n`
    })
  }

  if (criticalCount > 0) {
    summary += `\n🚨 **${criticalCount} atleta${criticalCount > 1 ? 's' : ''} en estado crítico** — se recomienda contacto inmediato.\n`
  }

  summary += `\n📈 **Carga del equipo:** ${teamCompliance >= 80 ? 'Buena carga de entrenamiento' : 'La carga está por debajo del objetivo'}.\n`

  return summary
}

// ============================================================
// Generate Text Report for Email/PDF
// ============================================================

export function generateReportText(report: WeeklyReport): string {
  let text = '=== INFORME SEMANAL DE RENDIMIENTO ===\n'
  text += `Periodo: ${report.weekRange}\n`
  text += `Generado: ${report.dateGenerated}\n\n`
  text += report.summary
  text += '\n\n=== DETALLE POR ATLETA ===\n\n'

  report.athletes.forEach((a, i) => {
    text += `${i + 1}. ${a.name}\n`
    text += `   TSS: ${a.weeklyTss} (${a.tssChange > 0 ? '+' : ''}${a.tssChange}% vs anterior)\n`
    text += `   Cumplimiento: ${a.compliance}% (${a.completedWorkouts}/${a.totalWorkouts})\n`
    text += `   CTL/ATL/TSB: ${Math.round(a.ctl)}/${Math.round(a.atl)}/${Math.round(a.tsb)}\n`
    text += `   HRV: ${a.hrv ? a.hrv + ' ms' : 'Sin datos'}\n`
    text += `   Estado: ${getStatusLabel(a.status)}\n`
    if (a.alerts.length > 0) {
      text += `   Alertas: ${a.alerts.join(', ')}\n`
    }
    text += '\n'
  })

  return text
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'excellent': return '✅ Excelente'
    case 'good': return '✅ Buena'
    case 'warning': return '⚠️ Atención'
    case 'critical': return '🚨 Crítico'
    default: return status
  }
}

/**
 * Formato HTML para email o dashboard
 */
export function generateReportHTML(report: WeeklyReport): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, sans-serif; color: #333; }
    .header { background: linear-gradient(135deg, #e56a00, #d95d00); color: white; padding: 20px; border-radius: 12px; }
    .summary { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
    .athlete { margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 8px; }
    .alert { color: #dc2626; font-weight: bold; }
    .good { color: #16a34a; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏊 Informe Semanal de Rendimiento</h1>
    <p>Periodo: ${report.weekRange}</p>
  </div>
  <div class="summary">
    <p>${report.summary.replace(/\n/g, '<br>')}</p>
  </div>
  <h2>Detalle por Atleta</h2>
  ${report.athletes.slice(0, 10).map(a => `
    <div class="athlete">
      <h3>${a.name} <span class="${a.status === 'critical' || a.status === 'warning' ? 'alert' : 'good'}">${a.status}</span></h3>
      <p>TSS: ${a.weeklyTss} | Cumplimiento: ${a.compliance}% | CTL/ATL/TSB: ${Math.round(a.ctl)}/${Math.round(a.atl)}/${Math.round(a.tsb)}</p>
      ${a.alerts.length > 0 ? `<p class="alert">${a.alerts.join(', ')}</p>` : ''}
    </div>
  `).join('')}
</body>
</html>`
}