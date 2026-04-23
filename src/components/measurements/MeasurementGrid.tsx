'use client'

import { useCallback, useMemo, useState } from 'react'
import { ArrowDown } from 'lucide-react'
import { MeasurementRow, type MeasurementValues } from './MeasurementRow'
import { toWeekStart, weekRange } from '@/lib/week'
import { useXpFeedback } from '@/components/xp/XpFeedbackProvider'

type ApiRow = {
  id: number
  weekStart: string
  weightKg: string | null
  waistCm: string | null
  chestCm: string | null
  thighCm: string | null
  bicepsCm: string | null
  targetKcal: number | null
  note: string | null
}

type Props = {
  initialRows: ApiRow[]
}

const HEADERS = ['Tyden', 'Vaha', '\u0394', 'Pas', 'Hrudnik', 'Stehno', 'Biceps', 'kcal cil']

export function MeasurementGrid({ initialRows }: Props) {
  const [rows, setRows] = useState<ApiRow[]>(initialRows)
  const [loadingMore, setLoadingMore] = useState(false)
  const [done, setDone] = useState(false)
  const todayWeek = toWeekStart(new Date())
  const { notifyXp } = useXpFeedback()

  const displayWeeks = useMemo(() => {
    const set = new Set(rows.map((r) => r.weekStart))
    weekRange(new Date(), 8).forEach((w) => set.add(w))
    return Array.from(set).sort((a, b) => (a < b ? 1 : -1))
  }, [rows])

  const byWeek = useMemo(() => new Map(rows.map((r) => [r.weekStart, r])), [rows])

  const upsert = useCallback(
    async (weekStart: string, patch: Partial<MeasurementValues>) => {
      const existing = byWeek.get(weekStart)
      const merged: Record<string, unknown> = { weekStart }
      for (const [k, v] of Object.entries(patch)) merged[k] = v
      const res = await fetch('/api/measurements', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(merged),
      })
      if (!res.ok) return
      const body = await res.json()
      notifyXp(body)
      const next: ApiRow = {
        id: existing?.id ?? body.id,
        weekStart,
        weightKg: existing?.weightKg ?? null,
        waistCm: existing?.waistCm ?? null,
        chestCm: existing?.chestCm ?? null,
        thighCm: existing?.thighCm ?? null,
        bicepsCm: existing?.bicepsCm ?? null,
        targetKcal: existing?.targetKcal ?? null,
        note: existing?.note ?? null,
      }
      for (const [k, v] of Object.entries(patch)) {
        if (k === 'note') {
          next.note = v as string | null
        } else if (k === 'targetKcal') {
          next.targetKcal = v as number | null
        } else {
          ;(next as Record<string, unknown>)[k] = v == null ? null : String(v)
        }
      }
      setRows((prev) => {
        const filtered = prev.filter((r) => r.weekStart !== weekStart)
        return [...filtered, next].sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1))
      })
    },
    [byWeek, notifyXp]
  )

  async function loadMore() {
    if (loadingMore || done) return
    setLoadingMore(true)
    const oldest = rows[rows.length - 1]?.weekStart ?? todayWeek
    const res = await fetch(`/api/measurements?beforeWeek=${oldest}&limit=8`)
    const body = (await res.json()) as { items: ApiRow[] }
    if (body.items.length === 0) setDone(true)
    setRows((prev) => [...prev, ...body.items])
    setLoadingMore(false)
  }

  return (
    <div className="overflow-x-auto p-4">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-border border-b">
            {HEADERS.map((h) => (
              <th
                key={h}
                className="text-muted px-1.5 py-2 text-right text-[11px] font-medium first:text-left"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayWeeks.map((weekStart) => {
            const r = byWeek.get(weekStart)
            const idx = displayWeeks.indexOf(weekStart)
            const prevWeekStart = displayWeeks[idx + 1]
            const prev = prevWeekStart ? byWeek.get(prevWeekStart) : undefined
            const values: MeasurementValues = {
              weightKg: r?.weightKg ? Number(r.weightKg) : null,
              waistCm: r?.waistCm ? Number(r.waistCm) : null,
              chestCm: r?.chestCm ? Number(r.chestCm) : null,
              thighCm: r?.thighCm ? Number(r.thighCm) : null,
              bicepsCm: r?.bicepsCm ? Number(r.bicepsCm) : null,
              targetKcal: r?.targetKcal ?? null,
              note: r?.note ?? null,
            }
            return (
              <MeasurementRow
                key={weekStart}
                weekStart={weekStart}
                isCurrent={weekStart === todayWeek}
                values={values}
                prevWeightKg={prev?.weightKg ? Number(prev.weightKg) : null}
                onCommitValue={(k, v) =>
                  upsert(weekStart, { [k]: v } as Partial<MeasurementValues>)
                }
                onCommitNote={(note) => upsert(weekStart, { note } as Partial<MeasurementValues>)}
              />
            )
          })}
        </tbody>
      </table>
      <div className="text-muted py-3 text-center text-xs">
        {done ? (
          'Žádné starší týdny.'
        ) : (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-1"
          >
            {loadingMore ? (
              'Načítání…'
            ) : (
              <>
                <ArrowDown size={14} aria-hidden />
                Načíst starší týdny
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
