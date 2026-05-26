export type DaySignals = {
  training: boolean
  habit: boolean
  weigh: boolean
  photo: boolean
}

export type CalendarDay = {
  date: string // YYYY-MM-DD
  signals: DaySignals
  isToday: boolean
  isFuture: boolean
  inStreak: boolean
  forecastPlanName: string | null
}

export type DayDetailData = {
  date: string
  sessions: Array<{ id: number; planName: string; durationMin: number | null }>
  habits: Array<{ id: number; name: string }>
  measurement: { weightKg: number | null; waistCm: number | null } | null
  photos: Array<{ id: number; thumbUrl: string; fullUrl: string; pose: string }>
}
