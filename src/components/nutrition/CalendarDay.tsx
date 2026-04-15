import type { DayClass, MacroClass } from '@/lib/nutrition-classify'

const BG: Record<DayClass, string> = {
  hit: '#065f46',
  miss: '#7f1d1d',
  empty: '#1f2733',
}
const DOT: Record<MacroClass, string> = {
  hit: '#10b981',
  near: '#f59e0b',
  miss: '#ef4444',
  none: 'transparent',
}

type Props = {
  date: string
  dayNumber: number
  klass: DayClass
  macros: MacroClass[]
  isToday: boolean
  isFuture: boolean
  onClick?: () => void
}

export function CalendarDay({ dayNumber, klass, macros, isToday, isFuture, onClick }: Props) {
  if (isFuture) {
    return (
      <div className="flex aspect-square items-center justify-center">
        <span className="text-sm text-[#374151]">{dayNumber}</span>
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: BG[klass],
        outline: isToday ? '2px solid #10b981' : 'none',
        outlineOffset: -2,
      }}
      className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg"
      aria-label={`Den ${dayNumber}`}
    >
      <span
        className={
          'text-sm ' +
          (isToday
            ? 'font-bold text-[#10b981]'
            : klass === 'empty'
              ? 'text-[#6b7280]'
              : 'font-semibold text-[#e5e7eb]')
        }
      >
        {dayNumber}
      </span>
      {macros.length > 0 && (
        <div className="mt-1 flex gap-1">
          {macros.map((m, i) => (
            <span
              key={i}
              className="block h-1.5 w-1.5 rounded-full"
              style={{ background: DOT[m], display: m === 'none' ? 'none' : 'block' }}
            />
          ))}
        </div>
      )}
    </button>
  )
}
