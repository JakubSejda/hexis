'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'

type WeeklyVolume = {
  weekStart: string
  chest: number
  back: number
  shoulders: number
  arms: number
  legs: number
}

type Props = {
  data: WeeklyVolume[]
}

const CATEGORIES = [
  { key: 'chest', label: 'Chest', color: '#ef4444' },
  { key: 'back', label: 'Back', color: '#3b82f6' },
  { key: 'shoulders', label: 'Shoulders', color: '#f59e0b' },
  { key: 'arms', label: 'Arms', color: '#a78bfa' },
  { key: 'legs', label: 'Legs', color: '#34d399' },
] as const

function formatWeek(dateStr: string) {
  const [, m, d] = dateStr.split('-')
  return `${Number(d)}.${Number(m)}.`
}

export function VolumeChart({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-muted py-8 text-center text-sm">Žádná data</p>
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="weekStart"
            tickFormatter={formatWeek}
            tick={{ fill: '#7c8da6', fontSize: 11 }}
            stroke="#1e293b"
          />
          <YAxis tick={{ fill: '#7c8da6', fontSize: 11 }} stroke="#1e293b" unit=" kg" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#141a22',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              fontSize: '13px',
            }}
            labelFormatter={(label: unknown) => formatWeek(String(label))}
            formatter={(value: unknown, name: unknown) => [
              `${Math.round(Number(value))} kg`,
              String(name),
            ]}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
          {CATEGORIES.map((cat) => (
            <Bar
              key={cat.key}
              dataKey={cat.key}
              name={cat.label}
              stackId="volume"
              fill={cat.color}
              radius={cat.key === 'legs' ? [3, 3, 0, 0] : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
