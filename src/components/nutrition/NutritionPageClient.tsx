'use client'

import { useMemo, useState } from 'react'
import { NutritionCalendar } from './NutritionCalendar'
import { DailyModal } from './DailyModal'
import { MonthStats } from './MonthStats'
import { classifyDay } from '@/lib/nutrition-classify'
import { toWeekStart } from '@/lib/week'

type DayRow = {
  id?: number
  date: string
  kcalActual: number | null
  proteinG: number | null
  carbsG: number | null
  fatG: number | null
  sugarG: number | null
  note: string | null
}

type Targets = {
  targetKcal: number | null
  targetProteinG: number | null
  targetCarbsG: number | null
  targetFatG: number | null
  targetSugarG: number | null
}

type Props = {
  initialMonth: string
  initialDays: DayRow[]
  trackedMacros: string[]
  targetsByWeek: Record<string, Targets>
}

export function NutritionPageClient({
  initialMonth,
  initialDays,
  trackedMacros,
  targetsByWeek,
}: Props) {
  const [month, setMonth] = useState(initialMonth)
  const [days, setDays] = useState<DayRow[]>(initialDays)
  const [selected, setSelected] = useState<string | null>(null)

  function weekStartFor(d: string): string {
    return toWeekStart(new Date(d + 'T00:00:00Z'))
  }

  async function changeMonth(delta: number) {
    const [y, m] = month.split('-').map(Number)
    const next = new Date(Date.UTC(y!, m! - 1 + delta, 1))
    const nextMonth = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`
    setMonth(nextMonth)
    const res = await fetch(`/api/nutrition?month=${nextMonth}`)
    const body = (await res.json()) as { items: DayRow[] }
    setDays(body.items)
  }

  const stats = useMemo(() => {
    let hits = 0
    let misses = 0
    let empties = 0
    for (const d of days) {
      const t = targetsByWeek[weekStartFor(d.date)]
      const c = classifyDay({ kcalActual: d.kcalActual, targetKcal: t?.targetKcal ?? null })
      if (c === 'hit') hits++
      else if (c === 'miss') misses++
      else empties++
    }
    return { hits, misses, empties }
  }, [days, targetsByWeek])

  const selectedRow = useMemo(() => days.find((d) => d.date === selected) ?? null, [days, selected])
  const selectedTargets = selected ? (targetsByWeek[weekStartFor(selected)] ?? null) : null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-4">
        <button onClick={() => changeMonth(-1)} className="text-2xl text-[#6b7280]">
          ‹
        </button>
        <button onClick={() => changeMonth(1)} className="text-2xl text-[#6b7280]">
          ›
        </button>
      </div>
      <NutritionCalendar
        month={month}
        days={days}
        trackedMacros={trackedMacros}
        targetsByWeek={targetsByWeek}
        weekStartFor={weekStartFor}
        onSelectDay={setSelected}
      />
      <MonthStats {...stats} />
      <DailyModal
        open={selected != null}
        date={selected}
        initial={selectedRow}
        trackedMacros={trackedMacros}
        targets={selectedTargets}
        onClose={() => setSelected(null)}
        onSaved={(saved) => {
          setDays((prev) => {
            const filtered = prev.filter((d) => d.date !== saved.date)
            return [...filtered, saved].sort((a, b) => (a.date < b.date ? -1 : 1))
          })
        }}
      />
    </div>
  )
}
