const INACTIVE = '#1f2733'
const THRESHOLDS: [number, string][] = [
  [0.76, '#ef4444'],
  [0.51, '#f59e0b'],
  [0.26, '#10b981'],
  [0.01, '#065f46'],
]

export function volumeToColor(volume: number, maxVolume: number): string {
  if (maxVolume <= 0 || volume <= 0) return INACTIVE
  const ratio = volume / maxVolume
  for (const [threshold, color] of THRESHOLDS) {
    if (ratio >= threshold) return color
  }
  return INACTIVE
}

type ZoneMapping = { zone: string; view: 'front' | 'back' }

export const SLUG_TO_ZONE: Record<string, { zone: string; view: 'front' | 'back' | 'both' }> = {
  // Chest split → existing 'chest' zone (front)
  'chest-upper': { zone: 'chest', view: 'front' },
  'chest-mid': { zone: 'chest', view: 'front' },
  'chest-lower': { zone: 'chest', view: 'front' },
  // Deltoid split → existing 'shoulders' zone
  'delts-front': { zone: 'shoulders', view: 'front' },
  'delts-side': { zone: 'shoulders', view: 'both' },
  'delts-rear': { zone: 'shoulders', view: 'back' },
  // Back
  lats: { zone: 'back-upper', view: 'back' },
  'traps-upper': { zone: 'back-upper', view: 'back' },
  'traps-mid': { zone: 'back-upper', view: 'back' },
  rhomboids: { zone: 'back-upper', view: 'back' },
  // Arms
  biceps: { zone: 'biceps', view: 'front' },
  triceps: { zone: 'triceps', view: 'back' },
  forearms: { zone: 'forearms', view: 'front' },
  // Core split → existing 'abs' zone
  'abs-upper': { zone: 'abs', view: 'front' },
  'abs-lower': { zone: 'abs', view: 'front' },
  obliques: { zone: 'abs', view: 'front' },
  // Legs
  quads: { zone: 'quads', view: 'front' },
  hamstrings: { zone: 'hamstrings', view: 'back' },
  glutes: { zone: 'glutes', view: 'back' },
  'calves-gastroc': { zone: 'calves', view: 'both' },
  'calves-soleus': { zone: 'calves', view: 'both' },
  adductors: { zone: 'adductors', view: 'front' },
}

export function slugToZones(slug: string): ZoneMapping[] {
  const mapping = SLUG_TO_ZONE[slug]
  if (!mapping) return []
  if (mapping.view === 'both') {
    return [
      { zone: mapping.zone, view: 'front' },
      { zone: mapping.zone, view: 'back' },
    ]
  }
  return [{ zone: mapping.zone, view: mapping.view }]
}

export const WORKOUT_COLORS = {
  rest: INACTIVE,
  planned: '#f59e0b',
  done: '#10b981',
} as const
