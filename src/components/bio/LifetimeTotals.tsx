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
        <div key={t.label} className="border-border bg-surface rounded-lg border p-3">
          <div className="text-muted text-[10px] tracking-[0.2em] uppercase">{t.label}</div>
          <div className="text-foreground mt-1 text-2xl font-bold">{t.value}</div>
        </div>
      ))}
    </div>
  )
}
