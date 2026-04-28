const INACTIVE = '#1f2733'

type Props = {
  view: 'front' | 'back'
  highlights: Record<string, string>
  className?: string
  ariaLabel?: string
}

type SlugPath = { slug: string; d: string }

// Front-view geometry — derived from the legacy BodySvg zones, sliced into 22 slugs.
// Coordinate system: viewBox 0 0 200 370.
export const FRONT_PATHS: SlugPath[] = [
  // Chest split (top→mid→bottom slices of legacy chest path)
  { slug: 'chest-upper', d: 'M70,95 Q80,88 100,86 Q120,88 130,95 L129,103 Q100,99 71,103 Z' },
  { slug: 'chest-mid', d: 'M71,103 Q100,99 129,103 L128,111 Q100,115 72,111 Z' },
  { slug: 'chest-lower', d: 'M72,111 Q100,115 128,111 L128,115 Q100,120 72,115 Z' },
  // Deltoids visible from front: front head + side head (lateral strip)
  { slug: 'delts-front', d: 'M58,82 L70,78 L72,95 L60,98 Z M130,78 L142,82 L140,98 L128,95 Z' },
  { slug: 'delts-side', d: 'M56,98 L60,98 L58,108 L54,106 Z M140,98 L144,98 L146,106 L142,108 Z' },
  // Arms
  { slug: 'biceps', d: 'M54,108 L58,103 L60,130 L54,135 Z M142,103 L146,108 L146,135 L140,130 Z' },
  {
    slug: 'forearms',
    d: 'M52,138 L56,135 L54,170 L48,172 Z M144,135 L148,138 L152,172 L146,170 Z',
  },
  // Core (split abs vertically + obliques as side strips)
  { slug: 'abs-upper', d: 'M82,118 L118,118 L117,142 L83,142 Z' },
  { slug: 'abs-lower', d: 'M83,142 L117,142 L116,168 L84,168 Z' },
  {
    slug: 'obliques',
    d: 'M78,118 L82,118 L84,168 L80,168 Z M118,118 L122,118 L120,168 L116,168 Z',
  },
  // Legs front
  { slug: 'quads', d: 'M74,172 L96,170 L92,240 L70,242 Z M104,170 L126,172 L130,242 L108,240 Z' },
  { slug: 'adductors', d: 'M92,180 L108,180 L106,220 L94,220 Z' },
  // Calves front (gastroc upper, soleus lower)
  {
    slug: 'calves-gastroc',
    d: 'M72,260 L90,255 L89,290 L72,292 Z M110,255 L128,260 L128,292 L111,290 Z',
  },
  {
    slug: 'calves-soleus',
    d: 'M72,292 L89,290 L88,320 L72,322 Z M111,290 L128,292 L128,322 L112,320 Z',
  },
]

export const BACK_PATHS: SlugPath[] = [
  // Upper back split: traps-upper (neck/top), traps-mid (between blades), rhomboids (lower-mid), lats (under)
  { slug: 'traps-upper', d: 'M84,90 L116,90 L114,102 L86,102 Z' },
  { slug: 'traps-mid', d: 'M82,102 L118,102 L116,118 L84,118 Z' },
  { slug: 'rhomboids', d: 'M86,118 L114,118 L112,128 L88,128 Z' },
  { slug: 'lats', d: 'M72,108 L86,118 L88,135 L70,135 Z M128,118 L128,108 L130,135 L112,135 Z' },
  // Deltoids back: rear head (back) + side head (lateral strip back)
  { slug: 'delts-rear', d: 'M58,82 L72,78 L72,95 L60,98 Z M128,78 L142,82 L140,98 L128,95 Z' },
  { slug: 'delts-side', d: 'M56,98 L60,98 L58,108 L54,106 Z M140,98 L144,98 L146,106 L142,108 Z' },
  // Arms back
  { slug: 'triceps', d: 'M54,105 L58,100 L60,135 L54,138 Z M142,100 L146,105 L146,138 L140,135 Z' },
  {
    slug: 'forearms',
    d: 'M52,138 L56,135 L54,170 L48,172 Z M144,135 L148,138 L152,172 L146,170 Z',
  },
  // Glutes
  { slug: 'glutes', d: 'M76,155 L124,155 L126,185 L74,185 Z' },
  // Hamstrings
  {
    slug: 'hamstrings',
    d: 'M72,190 L96,188 L92,255 L70,258 Z M104,188 L128,190 L130,258 L108,255 Z',
  },
  // Calves back (gastroc upper, soleus lower)
  {
    slug: 'calves-gastroc',
    d: 'M72,265 L90,260 L89,295 L72,297 Z M110,260 L128,265 L128,297 L111,295 Z',
  },
  {
    slug: 'calves-soleus',
    d: 'M72,297 L89,295 L88,328 L72,328 Z M111,295 L128,297 L128,328 L112,328 Z',
  },
]

export const FRONT_SLUGS = FRONT_PATHS.map((p) => p.slug)
export const BACK_SLUGS = BACK_PATHS.map((p) => p.slug)

const OUTLINE =
  'M100,10 Q85,10 82,25 Q78,35 80,45 Q76,50 74,55 Q68,65 60,75 L56,80 Q48,90 50,105 L52,140 Q50,160 48,175 Q46,178 44,180 Q80,170 100,168 Q120,170 156,180 Q154,178 152,175 Q150,160 148,140 L150,105 Q152,90 144,80 L140,75 Q132,65 126,55 Q124,50 122,45 Q120,35 118,25 Q115,10 100,10 Z M80,175 L76,250 Q74,260 70,268 L68,330 Q66,345 72,350 Q80,355 88,350 Q92,345 92,340 L96,260 Q98,250 100,248 Q102,250 104,260 L108,340 Q108,345 112,350 Q120,355 128,350 Q134,345 132,330 L130,268 Q126,260 124,250 L120,175'

export function AnatomicalBody({ view, highlights, className, ariaLabel }: Props) {
  const paths = view === 'front' ? FRONT_PATHS : BACK_PATHS
  const label = ariaLabel ?? `Anatomical body ${view} view`
  return (
    <svg viewBox="0 0 200 370" className={className} role="img" aria-label={label}>
      <path d={OUTLINE} fill="none" stroke="#1f2733" strokeWidth="1.5" data-outline="true" />
      {paths.map((p) => (
        <path
          key={`${view}-${p.slug}`}
          data-muscle={p.slug}
          d={p.d}
          fill={highlights[p.slug] ?? INACTIVE}
          opacity={0.85}
          stroke="none"
        />
      ))}
    </svg>
  )
}
