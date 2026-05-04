'use client'
import { useLongPress } from '@/components/ui'

type Props = {
  habit: {
    id: number
    name: string
    weight: 'light' | 'standard' | 'heavy'
    currentStreak: number
    completedToday: boolean
  }
  onCheck: (id: number) => void
  onUncheck: (id: number) => void
}

const WEIGHT_LABEL: Record<Props['habit']['weight'], string> = {
  light: '×0.5',
  standard: '×1.0',
  heavy: '×2.0',
}

export function HabitDailyRow({ habit, onCheck, onUncheck }: Props) {
  const longPress = useLongPress(() => {
    if (habit.completedToday) onUncheck(habit.id)
  })

  const handleClick = () => {
    if (!habit.completedToday) onCheck(habit.id)
  }

  return (
    <div
      data-habit-row
      data-habit-id={habit.id}
      className="border-border bg-surface flex items-center gap-3 rounded-lg border px-3 py-2.5"
      {...longPress}
    >
      <input
        type="checkbox"
        checked={habit.completedToday}
        onChange={handleClick}
        aria-label={habit.name}
        className="size-5 cursor-pointer"
      />
      <span className="text-foreground flex-1 truncate text-sm font-medium">{habit.name}</span>
      <span className="text-muted-foreground rounded-full bg-black/5 px-2 py-0.5 text-xs">
        {WEIGHT_LABEL[habit.weight]}
      </span>
      <span data-streak-count className="text-foreground text-xs tabular-nums">
        🔥 {habit.currentStreak}
      </span>
    </div>
  )
}
