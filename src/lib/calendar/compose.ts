import { nextPlanAfter, type Plan } from '@/lib/today-quest'
import type { CalendarDay } from './types'

const MS_PER_DAY = 86_400_000

function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate()
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

function ymdAtUtc(year: number, monthIndex0: number, day: number): string {
  return `${year}-${pad2(monthIndex0 + 1)}-${pad2(day)}`
}

export type ComposeArgs = {
  ym: string // YYYY-MM
  today: string // YYYY-MM-DD (UTC calendar day)
  sessionDates: Set<string>
  habitDates: Set<string>
  weighDates: Set<string>
  photoDates: Set<string>
  lastFinishedPlanId: number | null
  plans: Plan[]
}

export function composeCalendarMonth(args: ComposeArgs): CalendarDay[] {
  const [yStr, mStr] = args.ym.split('-')
  const year = Number(yStr)
  const monthIndex0 = Number(mStr) - 1
  const total = daysInMonth(year, monthIndex0)

  const sortedPlans = [...args.plans].sort((a, b) => a.order - b.order)
  const forecast = nextPlanAfter(args.lastFinishedPlanId, sortedPlans)

  // today+1 in YYYY-MM-DD (UTC)
  const todayMs = Date.UTC(
    Number(args.today.slice(0, 4)),
    Number(args.today.slice(5, 7)) - 1,
    Number(args.today.slice(8, 10))
  )
  const tomorrowMs = todayMs + MS_PER_DAY
  const tomorrow = new Date(tomorrowMs)
  const tomorrowKey = ymdAtUtc(
    tomorrow.getUTCFullYear(),
    tomorrow.getUTCMonth(),
    tomorrow.getUTCDate()
  )

  const out: CalendarDay[] = []
  for (let d = 1; d <= total; d++) {
    const date = ymdAtUtc(year, monthIndex0, d)
    const isToday = date === args.today
    const isFuture = date > args.today
    const forecastPlanName = date === tomorrowKey && forecast ? forecast.name : null
    out.push({
      date,
      signals: {
        training: args.sessionDates.has(date),
        habit: args.habitDates.has(date),
        weigh: args.weighDates.has(date),
        photo: args.photoDates.has(date),
      },
      isToday,
      isFuture,
      inStreak: false,
      forecastPlanName,
    })
  }
  return out
}
