import { NutritionStreak } from '@/components/nutrition/NutritionStreak'
import type { DayClass } from '@/lib/nutrition-classify'

type Props = {
  streak: number
  thisWeekDays: { date: string; klass: DayClass }[]
}

const LABELS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']

export function NutritionStreakCard({ streak, thisWeekDays }: Props) {
  const week = thisWeekDays.map((d, i) => ({ dayLabel: LABELS[i]!, klass: d.klass }))
  return <NutritionStreak streak={streak} thisWeek={week} />
}
