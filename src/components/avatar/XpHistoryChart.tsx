import type { DailyXp } from '@/lib/queries/xp-history'

type Props = { daily: DailyXp[]; days: number }

const EVENT_COLOR: Record<string, string> = {
  session_complete: '#10b981',
  set_logged: '#065f46',
  measurement_added: '#0ea5e9',
  photo_uploaded: '#8b5cf6',
  nutrition_logged: '#f59e0b',
  pr_achieved: '#eab308',
  streak_day: '#ef4444',
}

export function XpHistoryChart({ daily, days }: Props) {
  const today = new Date()
  const cells: { date: string; totalXp: number; dominant: string }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setUTCDate(d.getUTCDate() - i)
    const date = d.toISOString().slice(0, 10)
    const found = daily.find((x) => x.date === date)
    let dominant = 'session_complete'
    if (found) {
      const entries = Object.entries(found.byEvent) as [string, number][]
      if (entries.length > 0) {
        dominant = entries.reduce((a, b) => (b[1] > a[1] ? b : a), entries[0]!)[0]
      }
    }
    cells.push({ date, totalXp: found?.totalXp ?? 0, dominant })
  }
  const max = Math.max(...cells.map((c) => c.totalXp), 1)
  const width = 320
  const height = 80
  const barW = width / days - 1

  return (
    <div className="border-border bg-surface rounded-lg border p-4">
      <h2 className="text-foreground mb-3 text-sm font-semibold">XP za {days} dní</h2>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block w-full"
      >
        {cells.map((c, i) => {
          const h = (c.totalXp / max) * height
          return (
            <rect
              key={c.date}
              x={i * (width / days)}
              y={height - h}
              width={Math.max(barW, 1)}
              height={h}
              fill={EVENT_COLOR[c.dominant] ?? '#10b981'}
              rx={1}
            />
          )
        })}
      </svg>
      <div className="text-muted mt-2 text-xs">
        Celkem: {cells.reduce((a, c) => a + c.totalXp, 0).toLocaleString('cs-CZ')} XP
      </div>
    </div>
  )
}
