import type { CalendarDay } from '@/lib/calendar/types'

type Props = { day: CalendarDay }

const SIGNAL_KEYS = ['training', 'habit', 'weigh', 'photo'] as const

const DOT_BG: Record<(typeof SIGNAL_KEYS)[number], string> = {
  training: 'bg-accent',
  habit: 'bg-cal-habit',
  weigh: 'bg-cal-weigh',
  photo: 'bg-cal-photo',
}

export function CalendarCell({ day }: Props) {
  const dayNum = Number(day.date.slice(8, 10))
  const isDimmed = day.isFuture && !day.forecastPlanName
  const baseClasses = [
    'relative',
    'aspect-square',
    'rounded-md',
    'border',
    'border-border',
    'bg-surface',
    'flex',
    'flex-col',
    'items-start',
    'justify-between',
    'p-1',
  ]
  if (day.isToday) baseClasses.push('ring-2', 'ring-accent')
  if (day.inStreak) baseClasses.push('bg-accent/10', 'border-accent/40')
  if (day.forecastPlanName) baseClasses.push('border-dashed', 'border-accent/60')
  if (isDimmed) baseClasses.push('opacity-30')

  return (
    <div
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
    </div>
  )
}
