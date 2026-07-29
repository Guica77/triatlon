'use client'

import * as React from 'react'

interface ChurnMonth {
  month: string
  rate: number
  lost: number
}

interface ChurnBreakdownCardProps {
  churnByMonth: ChurnMonth[]
}

export function ChurnBreakdownCard({ churnByMonth }: ChurnBreakdownCardProps) {
  const maxRate = Math.max(...churnByMonth.map(m => m.rate), 1)

  return (
    <div className="bg-bg-card border border-border-default rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-xs font-bold text-text-primary">Evolución del Churn</h3>
        <p className="text-[10px] text-text-muted">Tasa de cancelación mensual</p>
      </div>
      <div className="space-y-3">
        {churnByMonth.map((m) => (
          <div key={m.month} className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="font-medium text-text-secondary">{m.month}</span>
              <span className="font-bold text-text-primary">
                {m.rate}% ({m.lost} perdidos)
              </span>
            </div>
            <div className="h-2 bg-bg-hover rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  m.rate > 10 ? 'bg-sport-run' : m.rate > 5 ? 'bg-warning' : 'bg-sport-bike'
                }`}
                style={{ width: `${(m.rate / maxRate) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="text-[9px] text-text-muted mt-3">
        Churn saludable: &lt;5% · Alerta: 5-10% · Crítico: &gt;10%
      </p>
    </div>
  )
}
