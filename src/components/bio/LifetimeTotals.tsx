import { Card } from '@/components/ui'

type Props = {
  sessions: number
  sets: number
  liftedKg: number
  totalXp: number
}

const FMT = new Intl.NumberFormat('cs-CZ')

export function LifetimeTotals({ sessions, sets, liftedKg, totalXp }: Props) {
  const tiles: Array<{ label: string; value: string }> = [
    { label: 'Sessions', value: FMT.format(sessions) },
    { label: 'Sets', value: FMT.format(sets) },
    { label: 'Lifted', value: `${FMT.format(liftedKg)} kg` },
    { label: 'XP', value: FMT.format(totalXp) },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {tiles.map((t) => (
        <Card key={t.label} padding="sm">
          <div className="text-muted font-mono text-[11px] tracking-[0.2em] uppercase">
            {t.label}
          </div>
          <div className="text-foreground mt-1 font-mono text-lg font-bold">{t.value}</div>
        </Card>
      ))}
    </div>
  )
}
