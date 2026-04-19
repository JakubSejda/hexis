'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

type DataPoint = {
  date: string
  best1rm: number
}

type Props = {
  data: DataPoint[]
}

function formatDate(dateStr: string) {
  const [, m, d] = dateStr.split('-')
  return `${Number(d)}.${Number(m)}.`
}

export function OneRmChart({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-muted py-8 text-center text-sm">Žádná data</p>
  }

  const globalMax = Math.max(...data.map((d) => d.best1rm))

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2733" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            stroke="#1f2733"
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 11 }}
            stroke="#1f2733"
            domain={['auto', 'auto']}
            unit=" kg"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#141a22',
              border: '1px solid #1f2733',
              borderRadius: '8px',
              fontSize: '13px',
            }}
            labelFormatter={(label: unknown) => formatDate(String(label))}
            formatter={(value: unknown) => {
              const num = Number(value)
              const isPr = num === globalMax
              return [`${num} kg${isPr ? ' PR!' : ''}`, 'Est. 1RM']
            }}
          />
          <Line
            type="monotone"
            dataKey="best1rm"
            stroke="#10b981"
            strokeWidth={2}
            dot={(props: { cx?: number; cy?: number; payload?: DataPoint }) => {
              const isPr = (props.payload?.best1rm ?? 0) === globalMax
              return (
                <circle
                  key={`dot-${props.payload?.date ?? ''}`}
                  cx={props.cx ?? 0}
                  cy={props.cy ?? 0}
                  r={isPr ? 5 : 3}
                  fill={isPr ? '#f59e0b' : '#10b981'}
                  stroke="none"
                />
              )
            }}
            activeDot={{ r: 5, fill: '#10b981' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
