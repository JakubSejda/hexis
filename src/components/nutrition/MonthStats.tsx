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
    <div className="grid grid-cols-2 gap-2">
      <Stat value={hits} label="Dní v cíli" valueClass="text-success" />
      <Stat value={misses} label="Mimo cíl" valueClass="text-danger" />
      <Stat value={empties} label="Nezapsáno" valueClass="text-muted" />
      <Stat value={`${pct} %`} label="Úspěšnost" valueClass="text-accent" />
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
      <div className={`font-display text-2xl leading-none font-black ${valueClass}`}>{value}</div>
      <div className="text-muted mt-1.5 text-[10px] font-bold tracking-[0.12em] uppercase">
        {label}
      </div>
    </Card>
  )
}
