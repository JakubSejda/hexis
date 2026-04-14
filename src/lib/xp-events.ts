export const XP_DELTAS = {
  session_complete: 100,
  set_logged: 5,
  measurement_added: 20,
  photo_uploaded: 15,
  nutrition_logged: 10,
  pr_achieved: 50,
  streak_day: 10,
} as const

export type XpEventType = keyof typeof XP_DELTAS

export function xpToLevel(totalXp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(totalXp / 100)) + 1)
}

export function xpForNextLevel(level: number): number {
  return level * level * 100
}
