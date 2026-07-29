'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface ActiveUsersProps {
  mau: number
  wau: number
  dau: number
}

const COLORS = ['#60a5fa', '#34d399', '#fb7185']

export function ActiveUsersChart({ mau, wau, dau }: ActiveUsersProps) {
  const data = [
    { period: 'MAU', users: mau },
    { period: 'WAU', users: wau },
    { period: 'DAU', users: dau },
  ]

  return (
    <div className="bg-bg-card border border-border-default rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-xs font-bold text-text-primary">Usuarios Activos</h3>
        <p className="text-[10px] text-text-muted">Actividad por ventana temporal</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <p className="text-xl font-bold text-text-primary">{mau}</p>
          <p className="text-[9px] font-bold uppercase tracking-wider text-sport-swim">MAU</p>
          <p className="text-[8px] text-text-muted">30 días</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-text-primary">{wau}</p>
          <p className="text-[9px] font-bold uppercase tracking-wider text-sport-bike">WAU</p>
          <p className="text-[8px] text-text-muted">7 días</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-text-primary">{dau}</p>
          <p className="text-[9px] font-bold uppercase tracking-wider text-sport-run">DAU</p>
          <p className="text-[8px] text-text-muted">Hoy</p>
        </div>
      </div>

      <div className="h-[100px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272b" />
            <XAxis dataKey="period" tick={{ fill: '#63636e', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#63636e', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181d',
                border: '1px solid #27272b',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '12px',
                color: '#e4e4e7',
              }}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
            <Bar dataKey="users" radius={[4, 4, 0, 0]}>
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
