import type { DayClass } from '@/lib/nutrition-classify'

type Props = {
  streak: number
  thisWeek: { dayLabel: string; klass: DayClass }[]
}

const BG: Record<DayClass, string> = {
  hit: '#065f46',
  miss: '#7f1d1d',
  empty: '#1f2733',
}

export function NutritionStreak({ streak, thisWeek }: Props) {
  return (
    <div className="rounded-xl border border-[#1f2733] bg-[#141a22] p-3.5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-[#e5e7eb]">Výživa streak</div>
          <div className="text-xs text-[#6b7280]">Dní v řadě s hitem</div>
        </div>
        <div className="text-3xl font-bold text-[#f59e0b]">{streak}</div>
      </div>
      <div className="mt-2.5 flex justify-center gap-1.5">
        {thisWeek.map((d, i) => (
          <div
            key={i}
            className={
              'flex h-6 w-6 items-center justify-center rounded text-[10px] font-semibold ' +
              (d.klass === 'empty' ? 'text-[#6b7280]' : 'text-white')
            }
            style={{ background: BG[d.klass] }}
          >
            {d.dayLabel}
          </div>
        ))}
      </div>
    </div>
  )
}
