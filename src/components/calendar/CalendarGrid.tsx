import type { CalendarDay } from '@/lib/calendar/types'
import { CalendarCell } from './CalendarCell'

type Props = { days: CalendarDay[] }

const WEEKDAYS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']

/** Returns 0..6 where Monday is 0 (ISO week start). */
function isoWeekday(date: string): number {
  const d = new Date(`${date}T00:00:00Z`)
  const js = d.getUTCDay() // 0..6, Sunday is 0
  return (js + 6) % 7
}

export function CalendarGrid({ days }: Props) {
  if (days.length === 0) return null
  const leading = isoWeekday(days[0]!.date)
  return (
    <div className="grid grid-cols-7 gap-2">
      {WEEKDAYS.map((d) => (
        <div
          key={d}
          className="text-muted text-center font-mono text-xs tracking-[0.2em] uppercase"
        >
          {d}
        </div>
      ))}
      {Array.from({ length: leading }, (_, i) => (
        <div key={`blank-${i}`} data-blank="true" aria-hidden />
      ))}
      {days.map((day) => (
        <CalendarCell key={day.date} day={day} />
      ))}
    </div>
  )
}
