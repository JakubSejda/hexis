'use client'

import { useEffect, useReducer, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { X } from 'lucide-react'
import { Card } from '@/components/ui'
import { Lightbox } from '@/components/photos/Lightbox'
import type { DayDetailData } from '@/lib/calendar/types'

const CS_DATE = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })

function formatDate(date: string): string {
  const d = new Date(`${date}T00:00:00Z`)
  return CS_DATE.format(d)
}

type FetchState = { loading: boolean; data: DayDetailData | null }
type FetchAction = { type: 'start' } | { type: 'done'; data: DayDetailData | null }

function fetchReducer(_: FetchState, action: FetchAction): FetchState {
  if (action.type === 'start') return { loading: true, data: null }
  return { loading: false, data: action.data }
}

type Props = {
  date: string | null
  onClose: () => void
}

export function DayDetailModal({ date, onClose }: Props) {
  const [{ data, loading }, dispatch] = useReducer(fetchReducer, { loading: false, data: null })
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  useEffect(() => {
    if (!date) return
    let cancelled = false
    dispatch({ type: 'start' })
    fetch(`/api/calendar/day?date=${date}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: DayDetailData | null) => {
        if (!cancelled) dispatch({ type: 'done', data: d })
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'done', data: null })
      })
    return () => {
      cancelled = true
    }
  }, [date])

  if (!date) return null

  const isEmpty =
    data &&
    data.sessions.length === 0 &&
    data.habits.length === 0 &&
    data.measurement === null &&
    data.photos.length === 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onClose}
    >
      <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-foreground font-semibold">{formatDate(date)}</h2>
          <button
            type="button"
            aria-label="Zavřít"
            onClick={onClose}
            className="text-muted hover:text-foreground"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {loading && <div className="text-muted py-6 text-center text-sm">Načítám…</div>}

        {!loading && data && isEmpty && (
          <div className="text-muted py-6 text-center text-sm">Nic se nedělo</div>
        )}

        {!loading && data && !isEmpty && (
          <div className="mt-4 flex flex-col gap-4">
            {data.sessions.length > 0 && (
              <section>
                <h3 className="text-muted font-mono text-xs tracking-[0.2em] uppercase">
                  Training
                </h3>
                <ul className="mt-2 flex flex-col gap-1">
                  {data.sessions.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex items-baseline gap-2">
                        <span className="text-foreground">{s.planName}</span>
                        {s.durationMin !== null && (
                          <span className="text-muted text-xs">{s.durationMin} min</span>
                        )}
                      </div>
                      <Link
                        href={`/training/${s.id}`}
                        className="text-system text-xs hover:underline"
                      >
                        Zobrazit session
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {data.habits.length > 0 && (
              <section>
                <h3 className="text-muted font-mono text-xs tracking-[0.2em] uppercase">Návyky</h3>
                <ul className="mt-2 flex flex-col gap-1">
                  {data.habits.map((h) => (
                    <li key={h.id} className="text-foreground text-sm">
                      {h.name}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {data.measurement && (
              <section>
                <h3 className="text-muted font-mono text-xs tracking-[0.2em] uppercase">Vážení</h3>
                <div className="text-foreground mt-2 flex items-center justify-between text-sm">
                  <span>
                    {data.measurement.weightKg !== null ? `${data.measurement.weightKg} kg` : '—'}
                  </span>
                  <Link href="/progress" className="text-system text-xs hover:underline">
                    Upravit vážení
                  </Link>
                </div>
              </section>
            )}

            {data.photos.length > 0 && (
              <section>
                <h3 className="text-muted font-mono text-xs tracking-[0.2em] uppercase">Fotky</h3>
                <div className="mt-2 flex gap-2 overflow-x-auto">
                  {data.photos.map((p, i) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setLightboxIdx(i)}
                      aria-label={`Otevřít fotku ${i + 1}`}
                      className="border-border hover:border-accent shrink-0 rounded border bg-black"
                    >
                      <Image
                        src={p.thumbUrl}
                        alt={`Photo ${i + 1}`}
                        width={64}
                        height={96}
                        unoptimized
                        className="h-24 w-16 object-cover"
                      />
                    </button>
                  ))}
                </div>
                {lightboxIdx !== null && (
                  <Lightbox
                    photos={data.photos.map((p) => ({
                      id: p.id,
                      takenAt: data.date,
                      pose: p.pose,
                      fullUrl: p.fullUrl,
                    }))}
                    initialIndex={lightboxIdx}
                    onClose={() => setLightboxIdx(null)}
                    onDeleted={() => {}}
                  />
                )}
              </section>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
