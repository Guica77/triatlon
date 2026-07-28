'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'

interface DataPoint {
  date: string
  signups: number
  total: number
}

interface UserGrowthChartProps {
  data: DataPoint[]
}

export function UserGrowthChart({ data }: UserGrowthChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white">Crecimiento de Usuarios</h3>
          <p className="text-[10px] text-zinc-500 font-medium mt-0.5">Registros totales en los últimos 6 meses</p>
        </div>
      </div>

      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e56a00" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#e56a00" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '12px',
              }}
              itemStyle={{ color: '#a1a1aa' }}
              labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#e56a00"
              strokeWidth={2}
              fill="url(#colorTotal)"
              name="Total usuarios"
            />
            <Area
              type="monotone"
              dataKey="signups"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#colorSignups)"
              name="Registros nuevos"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}