import Link from 'next/link'

type Item = {
  id: number
  planId: number | null
  planSlug?: string | null
  planName?: string | null
  startedAt: string
  finishedAt: string | null
  setCount: number
  volumeKg: number
}

const nf = new Intl.NumberFormat('cs-CZ')

export function SessionHistoryList({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-card border-border text-muted border border-dashed px-4 py-6 text-center text-sm">
        Zatím žádný splněný quest. První trénink se tu objeví hned po dokončení.
      </p>
    )
  }
  return (
    <ul className="flex flex-col gap-2">
      {items.map((s) => (
        <li key={s.id}>
          <Link
            href={`/training/${s.id}`}
            className="rounded-control bg-surface border-border hover:bg-surface-raised flex items-center gap-3 border px-3 py-2.5 text-sm transition-colors"
          >
            <span className="rounded-tick bg-surface-raised text-system font-display grid size-9 shrink-0 place-items-center text-xs font-black">
              {s.planSlug ?? '—'}
            </span>
            <span className="flex-1">
              <span className="block font-semibold">
                {s.planName?.split(' — ')[0] ?? 'Volný trénink'}
              </span>
              <span className="text-muted block text-xs">
                {new Date(s.startedAt).toLocaleDateString('cs-CZ', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'numeric',
                })}
              </span>
            </span>
            <span className="text-muted text-right text-xs">
              <span className="font-display text-foreground block text-sm font-black">
                {nf.format(Math.round(Number(s.volumeKg)))} kg
              </span>
              {s.setCount} sérií
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
