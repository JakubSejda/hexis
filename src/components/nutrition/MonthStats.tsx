import { Card } from '@/components/ui'

type Props = {
  hits: number
  misses: number
  empties: number
}

export function MonthStats({ hits, misses, empties }: Props) {
  const denom = hits + misses
  const pct = denom > 0 ? Math.round((hits / denom) * 100) : 0
  return (
    <div className="mx-4 my-2 grid grid-cols-4 gap-2">
      <Stat value={hits} label="dní hit" valueClass="text-primary" />
      <Stat value={misses} label="dní miss" valueClass="text-danger" />
      <Stat value={empties} label="prázdných" valueClass="text-muted" />
      <Stat value={`${pct}%`} label="úspěšnost" valueClass="text-system" />
    </div>
  )
}

function Stat({
  value,
  label,
  valueClass,
}: {
  value: number | string
  label: string
  valueClass: string
}) {
  return (
    <Card padding="sm" className="text-center">
      <div className={`font-mono text-lg font-bold ${valueClass}`}>{value}</div>
      <div className="text-muted mt-1 font-mono text-[10px] tracking-[0.2em] uppercase">
        {label}
      </div>
    </Card>
  )
}
