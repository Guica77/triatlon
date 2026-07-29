'use client'

import * as React from 'react'

interface CohortRow {
  cohort: string
  week1: number
  week4: number
  week12: number
}

interface CohortRetentionTableProps {
  data: CohortRow[]
}

export function CohortRetentionTable({ data }: CohortRetentionTableProps) {
  if (!data || data.length === 0) return null

  const getColor = (value: number) => {
    if (value >= 60) return 'bg-sport-bike'
    if (value >= 40) return 'bg-sport-bike/60'
    if (value >= 20) return 'bg-warning/60'
    return 'bg-sport-run/60'
  }

  const getTextColor = (value: number) => {
    if (value >= 40) return 'text-text-primary'
    return 'text-text-muted'
  }

  return (
    <div className="bg-bg-card border border-border-default rounded-xl p-5 overflow-x-auto">
      <div className="mb-4">
        <h3 className="text-xs font-bold text-text-primary">Retención por Cohortes</h3>
        <p className="text-[10px] text-text-muted">Porcentaje de usuarios activos tras registro</p>
      </div>

      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-border-subtle">
            <th className="text-left py-2 pr-4 font-bold text-text-muted uppercase tracking-wider">Cohorte</th>
            <th className="text-center py-2 px-2 font-bold text-text-muted uppercase tracking-wider">Semana 1</th>
            <th className="text-center py-2 px-2 font-bold text-text-muted uppercase tracking-wider">Semana 4</th>
            <th className="text-center py-2 px-2 font-bold text-text-muted uppercase tracking-wider">Semana 12</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.cohort} className="border-b border-border-subtle/50">
              <td className="py-3 pr-4 font-bold text-text-primary">{row.cohort}</td>
              <td className="py-3 px-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-16 sm:w-20 h-2 rounded-full bg-bg-hover overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getColor(row.week1)}`}
                      style={{ width: `${row.week1}%` }}
                    />
                  </div>
                  <span className={`font-bold w-8 text-right ${getTextColor(row.week1)}`}>{row.week1}%</span>
                </div>
              </td>
              <td className="py-3 px-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-16 sm:w-20 h-2 rounded-full bg-bg-hover overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getColor(row.week4)}`}
                      style={{ width: `${row.week4}%` }}
                    />
                  </div>
                  <span className={`font-bold w-8 text-right ${getTextColor(row.week4)}`}>{row.week4}%</span>
                </div>
              </td>
              <td className="py-3 px-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-16 sm:w-20 h-2 rounded-full bg-bg-hover overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getColor(row.week12)}`}
                      style={{ width: `${row.week12}%` }}
                    />
                  </div>
                  <span className={`font-bold w-8 text-right ${getTextColor(row.week12)}`}>{row.week12}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center gap-3 mt-3 text-[9px] text-text-muted">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sport-bike" /> &ge;60%</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sport-bike/60" /> 40-60%</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning/60" /> 20-40%</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sport-run/60" /> &lt;20%</span>
      </div>
    </div>
  )
}
