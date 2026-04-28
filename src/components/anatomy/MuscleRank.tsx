import { type Rank, RANK_COLORS } from '@/lib/muscle-rank'

type Props = {
  ranks: Record<string, Rank>
  className?: string
}

export const RADAR_AXES = [
  'chest-upper',
  'chest-mid',
  'chest-lower',
  'delts-front',
  'delts-side',
  'delts-rear',
  'lats',
  'traps-upper',
  'traps-mid',
  'rhomboids',
  'biceps',
  'triceps',
  'forearms',
  'abs-upper',
  'abs-lower',
  'obliques',
  'adductors',
  'quads',
  'hamstrings',
  'glutes',
  'calves-gastroc',
  'calves-soleus',
] as const

const AXIS_LABELS: Record<string, string> = {
  'chest-upper': 'Hrudn↑',
  'chest-mid': 'Hrudn=',
  'chest-lower': 'Hrudn↓',
  'delts-front': 'Delt p',
  'delts-side': 'Delt b',
  'delts-rear': 'Delt z',
  lats: 'Lats',
  'traps-upper': 'Trap↑',
  'traps-mid': 'Trap=',
  rhomboids: 'Rhomb',
  biceps: 'Biceps',
  triceps: 'Tric',
  forearms: 'Předl',
  'abs-upper': 'Břich↑',
  'abs-lower': 'Břich↓',
  obliques: 'Šikmé',
  adductors: 'Přitah',
  quads: 'Quads',
  hamstrings: 'Hams',
  glutes: 'Hýždě',
  'calves-gastroc': 'Lýtka↑',
  'calves-soleus': 'Lýtka↓',
}

const RANK_RADIUS: Record<Rank, number> = { D: 0.2, C: 0.4, B: 0.6, A: 0.8, S: 1.0 }

const VIEW_SIZE = 320
const CENTER = VIEW_SIZE / 2
const RADIUS = 120
const LABEL_RADIUS = 145

function polar(idx: number, count: number, r: number): { x: number; y: number } {
  const angle = (idx / count) * Math.PI * 2 - Math.PI / 2
  return { x: CENTER + Math.cos(angle) * r, y: CENTER + Math.sin(angle) * r }
}

export function MuscleRank({ ranks, className }: Props) {
  const count = RADAR_AXES.length
  const polygonPoints = RADAR_AXES.map((slug, i) => {
    const rank = ranks[slug] ?? 'D'
    const rNorm = RANK_RADIUS[rank]
    const { x, y } = polar(i, count, RADIUS * rNorm)
    return `${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ')

  return (
    <svg
      viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
      className={className}
      role="img"
      aria-label="Muscle rank radar"
    >
      {/* Grid rings for D, C, B, A (S = outer edge of axes) */}
      {[0.2, 0.4, 0.6, 0.8].map((band) => (
        <circle
          key={band}
          data-grid-ring={band}
          cx={CENTER}
          cy={CENTER}
          r={RADIUS * band}
          fill="none"
          stroke="#1f2733"
          strokeWidth={0.75}
        />
      ))}

      {/* Axes + labels */}
      {RADAR_AXES.map((slug, i) => {
        const tip = polar(i, count, RADIUS)
        const label = polar(i, count, LABEL_RADIUS)
        return (
          <g key={slug}>
            <line
              data-axis={slug}
              x1={CENTER}
              y1={CENTER}
              x2={tip.x}
              y2={tip.y}
              stroke="#1f2733"
              strokeWidth={0.5}
            />
            <text
              x={label.x}
              y={label.y}
              fontSize={9}
              fill="#94a3b8"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {AXIS_LABELS[slug] ?? slug}
            </text>
          </g>
        )
      })}

      {/* Rank polygon */}
      <polygon
        data-polygon="true"
        points={polygonPoints}
        fill="#a78bfa"
        fillOpacity={0.25}
        stroke="#a78bfa"
        strokeWidth={1}
      />

      {/* Rank dots */}
      {RADAR_AXES.map((slug, i) => {
        const rank = ranks[slug] ?? 'D'
        const { x, y } = polar(i, count, RADIUS * RANK_RADIUS[rank])
        return <circle key={slug} data-dot={slug} cx={x} cy={y} r={3} fill={RANK_COLORS[rank]} />
      })}
    </svg>
  )
}
