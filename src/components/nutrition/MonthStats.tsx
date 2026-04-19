type Props = {
  hits: number
  misses: number
  empties: number
}

export function MonthStats({ hits, misses, empties }: Props) {
  const denom = hits + misses
  const pct = denom > 0 ? Math.round((hits / denom) * 100) : 0
  return (
    <div className="border-border bg-surface mx-4 my-2 flex justify-around rounded-lg border p-3">
      <Stat value={hits} label="dní hit" color="#10b981" />
      <Stat value={misses} label="dní miss" color="#ef4444" />
      <Stat value={empties} label="prázdných" color="#6b7280" />
      <Stat value={`${pct}%`} label="úspěšnost" color="#f59e0b" />
    </div>
  )
}

function Stat({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold" style={{ color }}>
        {value}
      </div>
      <div className="text-muted text-[11px]">{label}</div>
    </div>
  )
}
