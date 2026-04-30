export type HabitWeight = 'light' | 'standard' | 'heavy'
export type HabitMilestone = 7 | 30 | 100

export const HABIT_MILESTONES: readonly HabitMilestone[] = [7, 30, 100] as const

export const MILESTONE_BASE_XP: Record<HabitMilestone, number> = {
  7: 50,
  30: 200,
  100: 1000,
}

export const WEIGHT_MULTIPLIER: Record<HabitWeight, number> = {
  light: 0.5,
  standard: 1,
  heavy: 2,
}

export function detectMilestone(streak: number): HabitMilestone | null {
  if (streak === 7 || streak === 30 || streak === 100) return streak
  return null
}

export function xpForMilestone(milestone: HabitMilestone, weight: HabitWeight): number {
  return MILESTONE_BASE_XP[milestone] * WEIGHT_MULTIPLIER[weight]
}

export type HabitStreakMeta = {
  habitId: number
  milestone: HabitMilestone
  weight: HabitWeight
}
