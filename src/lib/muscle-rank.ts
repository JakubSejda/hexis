export type Rank = 'D' | 'C' | 'B' | 'A' | 'S'

// [D→C, C→B, B→A, A→S] thresholds in kg-reps over trailing 8 weeks.
// Initial values — calibrate from real dev session data after PR-2 merge.
export const RANK_THRESHOLDS: Record<string, [number, number, number, number]> = {
  'chest-upper': [2500, 8000, 20000, 40000],
  'chest-mid': [4000, 12000, 30000, 60000],
  'chest-lower': [2000, 6000, 15000, 30000],
  'delts-front': [2000, 6000, 15000, 30000],
  'delts-side': [1500, 5000, 12000, 25000],
  'delts-rear': [1000, 3000, 8000, 16000],
  lats: [3500, 10000, 25000, 50000],
  'traps-upper': [1500, 5000, 12000, 25000],
  'traps-mid': [3000, 9000, 22000, 45000],
  rhomboids: [1500, 5000, 12000, 25000],
  biceps: [2000, 6000, 15000, 30000],
  triceps: [2500, 7500, 18000, 36000],
  forearms: [800, 2500, 6000, 12000],
  'abs-upper': [1000, 3000, 8000, 16000],
  'abs-lower': [800, 2500, 6000, 12000],
  obliques: [800, 2500, 6000, 12000],
  quads: [6000, 18000, 45000, 90000],
  hamstrings: [3500, 10000, 25000, 50000],
  glutes: [4000, 12000, 30000, 60000],
  'calves-gastroc': [1500, 5000, 12000, 25000],
  'calves-soleus': [1000, 3000, 8000, 16000],
  adductors: [1000, 3000, 8000, 16000],
}

export function volumeToRank(volume: number, slug: string): Rank {
  const t = RANK_THRESHOLDS[slug]
  if (!t) return 'D'
  if (volume >= t[3]) return 'S'
  if (volume >= t[2]) return 'A'
  if (volume >= t[1]) return 'B'
  if (volume >= t[0]) return 'C'
  return 'D'
}

export const RANK_COLORS: Record<Rank, string> = {
  S: '#fbbf24',
  A: '#a78bfa',
  B: '#60a5fa',
  C: '#34d399',
  D: '#94a3b8',
}
