'use client'

import { useMemo } from 'react'
import { CalendarDay } from './CalendarDay'
import {
  classifyDay,
  classifyMacro,
  type DayClass,
  type MacroClass,
} from '@/lib/nutrition-classify'

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

type WeekTargets = {
  targetKcal: number | null
  targetProteinG: number | null
  targetCarbsG: number | null
  targetFatG: number | null
  targetSugarG: number | null
}

type Props = {
  month: string
  days: DayRow[]
  trackedMacros: string[]
  targetsByWeek: Record<string, WeekTargets>
  weekStartFor: (date: string) => string
  onSelectDay: (date: string) => void
}

const MONTH_NAMES = [
  'Leden',
  'Únor',
  'Březen',
  'Duben',
  'Květen',
  'Červen',
  'Červenec',
  'Srpen',
  'Září',
  'Říjen',
  'Listopad',
  'Prosinec',
]
const DAY_HEADERS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']

export function NutritionCalendar({
  month,
  days,
  trackedMacros,
  targetsByWeek,
  weekStartFor,
  onSelectDay,
}: Props) {
  const byDate = useMemo(() => new Map(days.map((d) => [d.date, d])), [days])
  const today = new Date().toISOString().slice(0, 10)
  const [y, m] = month.split('-').map(Number)
  const firstDay = new Date(Date.UTC(y!, m! - 1, 1))
  const firstDow = (firstDay.getUTCDay() + 6) % 7
  const lastDate = new Date(Date.UTC(y!, m!, 0)).getUTCDate()

  function classifyForDay(d: string, row: DayRow | undefined): DayClass {
    if (!row) return 'empty'
    const t = targetsByWeek[weekStartFor(d)]
    return classifyDay({ kcalActual: row.kcalActual, targetKcal: t?.targetKcal ?? null })
  }

  function macroDots(d: string, row: DayRow | undefined): MacroClass[] {
    if (!row) return trackedMacros.map(() => 'none' as const)
    const t = targetsByWeek[weekStartFor(d)]
    return trackedMacros.map((mk) => {
      switch (mk) {
        case 'kcal':
          return classifyMacro({ actual: row.kcalActual, target: t?.targetKcal ?? null })
        case 'protein':
          return classifyMacro({ actual: row.proteinG, target: t?.targetProteinG ?? null })
        case 'carbs':
          return classifyMacro({ actual: row.carbsG, target: t?.targetCarbsG ?? null })
        case 'fat':
          return classifyMacro({ actual: row.fatG, target: t?.targetFatG ?? null })
        case 'sugar':
          return classifyMacro({ actual: row.sugarG, target: t?.targetSugarG ?? null })
        default:
          return 'none' as const
      }
    })
  }

  const cells: React.ReactNode[] = []
  for (let i = 0; i < firstDow; i++) cells.push(<div key={`pad-${i}`} />)
  for (let d = 1; d <= lastDate; d++) {
    const date = `${month}-${String(d).padStart(2, '0')}`
    const row = byDate.get(date)
    cells.push(
      <CalendarDay
        key={date}
        date={date}
        dayNumber={d}
        klass={classifyForDay(date, row)}
        macros={macroDots(date, row)}
        isToday={date === today}
        isFuture={date > today}
        onClick={() => onSelectDay(date)}
      />
    )
  }

  return (
    <div className="space-y-2">
      <div className="px-4 text-center text-base font-semibold text-[#e5e7eb]">
        {MONTH_NAMES[m! - 1]} {y}
      </div>
      <div className="grid grid-cols-7 gap-1 px-4">
        {DAY_HEADERS.map((h) => (
          <div key={h} className="py-1 text-center text-[11px] text-[#6b7280]">
            {h}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 px-4">{cells}</div>
    </div>
  )
}
