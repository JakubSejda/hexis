import type { CalendarDay } from './types'

const MIN_STREAK = 3

export function detectTrainingStreaks(days: CalendarDay[]): void {
  let runStart = 0
  let runLen = 0
  for (let i = 0; i < days.length; i++) {
    const d = days[i]!
    const countsAsStreakDay = d.signals.training && !d.isFuture
    if (countsAsStreakDay) {
      if (runLen === 0) runStart = i
      runLen++
    } else {
      if (runLen >= MIN_STREAK) {
        for (let j = runStart; j < runStart + runLen; j++) {
          days[j]!.inStreak = true
        }
      }
      runLen = 0
    }
  }
  if (runLen >= MIN_STREAK) {
    for (let j = runStart; j < runStart + runLen; j++) {
      days[j]!.inStreak = true
    }
  }
}
