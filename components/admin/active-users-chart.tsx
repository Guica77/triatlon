'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'

interface ActiveUsersProps {
  mau: number
  wau: number
  dau: number
}

export function ActiveUsersChart({ mau, wau, dau }: ActiveUsersProps) {
  const data = [
    { period: 'MAU', users: mau, color: '#e56a00' },
    { period: 'WAU', users: wau, color: '#22c55e' },
    { period: 'DAU', users: dau, color: '#3b82f6' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5"
    >
      <div className="mb-4">
        <h3 className="text-sm font-bold text-white">Usuarios Activos</h3>
        <p className="text-[10px] text-zinc-500 font-medium mt-0.5">Actividad por ventana temporal</p>
      </div>

      <div className="flex gap-6 mb-4">
        <div>
          <p className="text-2xl font-black text-white">{mau}</p>
          <p className="text-[10px] text-zinc-500 font-bold uppercase">MAU</p>
          <p className="text-[9px] text-zinc-600">Últimos 30 días</p>
        </div>
        <div>
          <p className="text-2xl font-black text-white">{wau}</p>
          <p className="text-[10px] text-zinc-500 font-bold uppercase">WAU</p>
          <p className="text-[9px] text-zinc-600">Últimos 7 días</p>
        </div>
        <div>
          <p className="text-2xl font-black text-white">{dau}</p>
          <p className="text-[10px] text-zinc-500 font-bold uppercase">DAU</p>
          <p className="text-[9px] text-zinc-600">Hoy</p>
        </div>
      </div>

      <div className="h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="period" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '12px',
              }}
              cursor={{ fill: 'rgba(255,255,255,0.02)' }}
            />
            <Bar dataKey="users" name="Usuarios" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <rect key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}