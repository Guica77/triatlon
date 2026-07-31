'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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
    <div className="h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2D3340" />
          <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#242932',
              border: '1px solid #2D3340',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '12px',
              color: '#F0F2F5',
            }}
            itemStyle={{ color: '#9CA3AF' }}
            labelStyle={{ color: '#F0F2F5', fontWeight: 'bold', marginBottom: '4px' }}
          />
          <Area type="monotone" dataKey="total" stroke="#FF6B35" strokeWidth={2} fill="url(#colorTotal)" name="Total usuarios" />
          <Area type="monotone" dataKey="signups" stroke="#22C55E" strokeWidth={2} fill="url(#colorSignups)" name="Registros nuevos" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
