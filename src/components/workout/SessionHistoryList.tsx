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

export function SessionHistoryList({ items }: { items: Item[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((s) => (
        <li key={s.id}>
          <Link
            href={`/training/${s.id}`}
            className="bg-surface flex items-center justify-between rounded-md px-3 py-2 text-sm"
          >
            <span>
              {new Date(s.startedAt).toLocaleDateString('cs-CZ')}{' '}
              {s.planSlug ? <span className="text-primary">{s.planSlug}</span> : 'ad-hoc'}
            </span>
            <span className="text-muted text-xs">
              {s.setCount} sérií · {Number(s.volumeKg).toFixed(0)} kg
            </span>
          </Link>
        </li>
      ))}
      {items.length === 0 ? <li className="text-muted text-xs">Zatím žádné tréninky.</li> : null}
    </ul>
  )
}
