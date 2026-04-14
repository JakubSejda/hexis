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
            href={`/workout/${s.id}`}
            className="flex items-center justify-between rounded-md bg-[#141A22] px-3 py-2 text-sm"
          >
            <span>
              {new Date(s.startedAt).toLocaleDateString('cs-CZ')}{' '}
              {s.planSlug ? <span className="text-[#10B981]">{s.planSlug}</span> : 'ad-hoc'}
            </span>
            <span className="text-xs text-[#6B7280]">
              {s.setCount} sérií · {Number(s.volumeKg).toFixed(0)} kg
            </span>
          </Link>
        </li>
      ))}
      {items.length === 0 ? (
        <li className="text-xs text-[#6B7280]">Zatím žádné tréninky.</li>
      ) : null}
    </ul>
  )
}
