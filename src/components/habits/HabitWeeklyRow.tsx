'use client'
import { Button } from '@/components/ui'

type Props = {
  habit: {
    id: number
    name: string
    weight: 'light' | 'standard' | 'heavy'
    weeklyTarget: number
    completedThisWeek: number
    completedToday: boolean
    currentStreak: number
  }
  onCheck: (id: number) => void
}

const WEIGHT_LABEL: Record<Props['habit']['weight'], string> = {
  light: '×0.5',
  standard: '×1.0',
  heavy: '×2.0',
}

export function HabitWeeklyRow({ habit, onCheck }: Props) {
  const pct = Math.min(100, Math.round((habit.completedThisWeek / habit.weeklyTarget) * 100))

  return (
    <div
      data-habit-row
      data-habit-id={habit.id}
      className="border-border bg-surface space-y-2 rounded-lg border px-3 py-2.5"
    >
      <div className="flex items-center gap-3">
        <span className="text-foreground flex-1 truncate text-sm font-medium">{habit.name}</span>
        <span className="text-muted-foreground rounded-full bg-black/5 px-2 py-0.5 text-xs">
          {WEIGHT_LABEL[habit.weight]}
        </span>
        <span data-streak-count className="text-foreground text-xs tabular-nums">
          🔥 {habit.currentStreak} t
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="border-border h-2 flex-1 overflow-hidden rounded-full bg-black/5">
          <div data-progress-fill className="bg-primary h-full" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-muted-foreground text-xs tabular-nums">
          {habit.completedThisWeek}/{habit.weeklyTarget} tento týden
        </span>
        <Button
          size="sm"
          variant="secondary"
          disabled={habit.completedToday}
          onClick={() => onCheck(habit.id)}
        >
          Splněno dnes
        </Button>
      </div>
    </div>
  )
}
