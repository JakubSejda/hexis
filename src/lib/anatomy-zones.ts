export type ZoneView = 'front' | 'back' | 'both'
export type ZoneInfo = { view: ZoneView }

export const SLUG_ZONES: Record<string, ZoneInfo> = {
  'chest-upper': { view: 'front' },
  'chest-mid': { view: 'front' },
  'chest-lower': { view: 'front' },
  'delts-front': { view: 'front' },
  'delts-side': { view: 'both' },
  'delts-rear': { view: 'back' },
  lats: { view: 'back' },
  'traps-upper': { view: 'back' },
  'traps-mid': { view: 'back' },
  rhomboids: { view: 'back' },
  biceps: { view: 'front' },
  triceps: { view: 'back' },
  forearms: { view: 'both' },
  'abs-upper': { view: 'front' },
  'abs-lower': { view: 'front' },
  obliques: { view: 'front' },
  quads: { view: 'front' },
  hamstrings: { view: 'back' },
  glutes: { view: 'back' },
  'calves-gastroc': { view: 'both' },
  'calves-soleus': { view: 'both' },
  adductors: { view: 'front' },
}

export function applyHighlights(slugColors: Record<string, string>): {
  front: Record<string, string>
  back: Record<string, string>
} {
  const front: Record<string, string> = {}
  const back: Record<string, string> = {}
  for (const [slug, color] of Object.entries(slugColors)) {
    const info = SLUG_ZONES[slug]
    if (!info) continue
    if (info.view === 'front' || info.view === 'both') front[slug] = color
    if (info.view === 'back' || info.view === 'both') back[slug] = color
  }
  return { front, back }
}
