import type { CalendarDay } from '@/lib/calendar/types'

type Props = { day: CalendarDay; onSelect?: (date: string) => void }

/** Czech long date, e.g. "15. května 2026" — the cell's accessible name. */
const CS_DATE = new Intl.DateTimeFormat('cs-CZ', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const SIGNAL_KEYS = ['training', 'habit', 'weigh', 'photo'] as const

const SIGNAL_LABEL: Record<(typeof SIGNAL_KEYS)[number], string> = {
  training: 'trénink',
  habit: 'návyk',
  weigh: 'vážení',
  photo: 'fotka',
}

const DOT_BG: Record<(typeof SIGNAL_KEYS)[number], string> = {
  training: 'bg-accent',
  habit: 'bg-cal-habit',
  weigh: 'bg-cal-weigh',
  photo: 'bg-cal-photo',
}

export function CalendarCell({ day, onSelect }: Props) {
  const dayNum = Number(day.date.slice(8, 10))
  const isDimmed = day.isFuture && !day.forecastPlanName
  const baseClasses = [
    'relative',
    'aspect-square',
    'hud-clip-sm',
    'border',
    'border-border',
    'bg-surface',
    'flex',
    'flex-col',
    'items-start',
    'justify-between',
    'p-1',
  ]
  if (day.inStreak) baseClasses.push('bg-accent/10', 'border-accent/40')
  if (day.forecastPlanName) baseClasses.push('border-dashed', 'border-accent/60')
  if (day.isToday) baseClasses.push('border-2', 'border-system')
  if (isDimmed) baseClasses.push('opacity-30')

  const label = CS_DATE.format(new Date(`${day.date}T00:00:00Z`))
  const signals = SIGNAL_KEYS.filter((k) => day.signals[k])

  return (
    <button
      type="button"
      onClick={() => onSelect?.(day.date)}
      aria-label={
        label +
        (day.isToday ? ' — dnes' : '') +
        (signals.length ? ` — ${signals.map((s) => SIGNAL_LABEL[s]).join(', ')}` : '')
      }
      data-date={day.date}
      data-today={day.isToday ? 'true' : undefined}
      data-future={day.isFuture ? 'true' : undefined}
      data-streak={day.inStreak ? 'true' : undefined}
      data-forecast={day.forecastPlanName ? 'true' : undefined}
      className={baseClasses.join(' ')}
    >
      <span className="text-foreground text-sm font-medium">{dayNum}</span>
      {day.forecastPlanName ? (
        <span className="text-muted w-full truncate text-xs">{day.forecastPlanName}?</span>
      ) : isDimmed ? null : (
        <div className="flex gap-[3px]">
          {SIGNAL_KEYS.map((key) => (
            <span
              key={key}
              data-signal={key}
              data-active={day.signals[key] ? 'true' : 'false'}
              className={`h-[6px] w-[6px] rounded-full ${day.signals[key] ? DOT_BG[key] : 'bg-border'}`}
            />
          ))}
        </div>
      )}
    </button>
  )
}
