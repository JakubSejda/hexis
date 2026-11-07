'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, Heading, Pill, ProgressBar } from '@/components/ui'
import { XP_DELTAS } from '@/lib/xp-events'
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
  today: string
  initialMonth: string
  initialDays: DayRow[]
  trackedMacros: string[]
  targetsByWeek: Record<string, Targets>
}

export function NutritionPageClient({
  today,
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

  const todayRow = days.find((d) => d.date === today) ?? null
  const todayTargets = targetsByWeek[weekStartFor(today)] ?? null
  const nf = new Intl.NumberFormat('cs-CZ')

  return (
    <div className="space-y-4">
      <Card padding="lg" edge={todayRow ? 'default' : 'accent'}>
        <div className="flex items-center justify-between">
          <Pill variant={todayRow ? 'success' : 'accent'} size="md">
            {todayRow ? 'Dnešek zapsán' : 'Vedlejší quest'}
          </Pill>
          <span className="font-display text-reward text-sm font-black">
            +{XP_DELTAS.nutrition_logged} XP
          </span>
        </div>
        {todayRow ? (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <div className="font-display text-3xl leading-none font-black">
                {todayRow.kcalActual != null ? nf.format(todayRow.kcalActual) : '—'}
              </div>
              <div className="text-muted mt-1 text-xs">
                kcal{todayTargets?.targetKcal ? ` z ${nf.format(todayTargets.targetKcal)}` : ''}
              </div>
            </div>
            <div>
              <div className="font-display text-3xl leading-none font-black">
                {todayRow.proteinG ?? '—'}
              </div>
              <div className="text-muted mt-1 text-xs">
                g bílkovin
                {todayTargets?.targetProteinG ? ` z ${todayTargets.targetProteinG}` : ''}
              </div>
            </div>
            {todayTargets?.targetKcal && todayRow.kcalActual != null ? (
              <ProgressBar
                className="col-span-2"
                value={todayRow.kcalActual}
                max={todayTargets.targetKcal}
                tone="accent"
              />
            ) : null}
          </div>
        ) : (
          <>
            <Heading level={2} className="mt-3 text-2xl">
              Zapiš dnešní jídlo
            </Heading>
            <p className="text-muted mt-1 text-sm">
              Stačí kalorie a bílkoviny. Kalendář pak ukáže, které dny jsi trefil cíl.
            </p>
          </>
        )}
        <button
          type="button"
          onClick={() => setSelected(today)}
          className={
            (todayRow
              ? 'bg-surface-raised text-foreground '
              : 'bg-accent text-accent-foreground shadow-glow ') +
            'font-display mt-4 flex h-12 w-full items-center justify-between rounded-full px-5 text-sm font-black uppercase transition-transform active:scale-[0.98]'
          }
        >
          {todayRow ? 'Upravit dnešek' : 'Zapsat dnešek'}
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </Card>
      <div className="flex items-center justify-between">
        <button
          onClick={() => changeMonth(-1)}
          className="text-muted hover:text-system flex h-11 w-11 items-center justify-center transition-colors"
          aria-label="Předchozí měsíc"
        >
          <ChevronLeft size={24} aria-hidden />
        </button>
        <button
          onClick={() => changeMonth(1)}
          className="text-muted hover:text-system flex h-11 w-11 items-center justify-center transition-colors"
          aria-label="Další měsíc"
        >
          <ChevronRight size={24} aria-hidden />
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
