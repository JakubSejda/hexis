const INACTIVE = '#1f2733'

type Props = {
  view: 'front' | 'back'
  fills: Record<string, string>
  className?: string
}

const FRONT_ZONES: { zone: string; d: string }[] = [
  { zone: 'chest', d: 'M70,95 Q80,88 100,86 Q120,88 130,95 L128,115 Q100,120 72,115 Z' },
  {
    zone: 'shoulders',
    d: 'M58,82 L70,78 L72,95 L70,105 L56,100 Z M130,78 L142,82 L144,100 L130,105 L128,95 Z',
  },
  { zone: 'biceps', d: 'M54,105 L58,100 L60,130 L54,135 Z M142,100 L146,105 L146,135 L140,130 Z' },
  {
    zone: 'forearms',
    d: 'M52,138 L56,135 L54,170 L48,172 Z M144,135 L148,138 L152,172 L146,170 Z',
  },
  { zone: 'abs', d: 'M78,118 L122,118 L120,168 L80,168 Z' },
  { zone: 'quads', d: 'M74,172 L96,170 L92,240 L70,242 Z M104,170 L126,172 L130,242 L108,240 Z' },
  { zone: 'adductors', d: 'M92,180 L108,180 L106,220 L94,220 Z' },
  { zone: 'calves', d: 'M72,260 L90,255 L88,320 L72,322 Z M110,255 L128,260 L128,322 L112,320 Z' },
]

const BACK_ZONES: { zone: string; d: string }[] = [
  { zone: 'back-upper', d: 'M72,90 L128,90 L130,135 L70,135 Z' },
  { zone: 'shoulders', d: 'M56,82 L72,78 L72,95 L58,100 Z M128,78 L144,82 L142,100 L128,95 Z' },
  { zone: 'triceps', d: 'M54,105 L58,100 L60,135 L54,138 Z M142,100 L146,105 L146,138 L140,135 Z' },
  { zone: 'glutes', d: 'M76,155 L124,155 L126,185 L74,185 Z' },
  {
    zone: 'hamstrings',
    d: 'M72,190 L96,188 L92,255 L70,258 Z M104,188 L128,190 L130,258 L108,255 Z',
  },
  { zone: 'calves', d: 'M72,265 L90,260 L88,325 L72,328 Z M110,260 L128,265 L128,328 L112,325 Z' },
]

const OUTLINE =
  'M100,10 Q85,10 82,25 Q78,35 80,45 Q76,50 74,55 Q68,65 60,75 L56,80 Q48,90 50,105 L52,140 Q50,160 48,175 Q46,178 44,180 Q80,170 100,168 Q120,170 156,180 Q154,178 152,175 Q150,160 148,140 L150,105 Q152,90 144,80 L140,75 Q132,65 126,55 Q124,50 122,45 Q120,35 118,25 Q115,10 100,10 Z M80,175 L76,250 Q74,260 70,268 L68,330 Q66,345 72,350 Q80,355 88,350 Q92,345 92,340 L96,260 Q98,250 100,248 Q102,250 104,260 L108,340 Q108,345 112,350 Q120,355 128,350 Q134,345 132,330 L130,268 Q126,260 124,250 L120,175'

export function BodySvg({ view, fills, className }: Props) {
  const zones = view === 'front' ? FRONT_ZONES : BACK_ZONES
  return (
    <svg viewBox="0 0 200 370" className={className} role="img" aria-label={`Body ${view} view`}>
      <path d={OUTLINE} fill="none" stroke="#1f2733" strokeWidth="1.5" />
      {zones.map((z) => (
        <path
          key={`${view}-${z.zone}`}
          data-muscle={z.zone}
          d={z.d}
          fill={fills[z.zone] ?? INACTIVE}
          opacity={0.85}
          stroke="none"
        />
      ))}
    </svg>
  )
}
