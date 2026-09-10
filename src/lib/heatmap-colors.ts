const INACTIVE = '#1e293b'
const THRESHOLDS: [number, string][] = [
  [0.76, '#ef4444'],
  [0.51, '#f59e0b'],
  [0.26, '#34d399'],
  [0.01, '#064e3b'],
]

export function volumeToColor(volume: number, maxVolume: number): string {
  if (maxVolume <= 0 || volume <= 0) return INACTIVE
  const ratio = volume / maxVolume
  for (const [threshold, color] of THRESHOLDS) {
    if (ratio >= threshold) return color
  }
  return INACTIVE
}

export const WORKOUT_COLORS = {
  rest: INACTIVE,
  planned: '#f59e0b',
  done: '#34d399',
} as const
