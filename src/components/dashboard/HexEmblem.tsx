/**
 * HUD hex rosette emblem (Reforge R2) — the level crest from prototype B.
 * Nested hexagons in system cyan, tier-colored core ring, level number.
 */
type Props = {
  level: number
  tierColor: string
  size?: number
  className?: string
}

function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 90)
    pts.push(`${(cx + r * Math.sin(a)).toFixed(2)},${(cy - r * Math.cos(a)).toFixed(2)}`)
  }
  return pts.join(' ')
}

export function HexEmblem({ level, tierColor, size = 120, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={`Level ${level}`}
      className={`drop-shadow-[0_0_12px_rgba(34,211,238,0.25)] ${className ?? ''}`}
    >
      <polygon
        points={hexPoints(60, 60, 56)}
        fill="none"
        stroke="#22d3ee"
        strokeOpacity="0.35"
        strokeWidth="1"
      />
      <polygon
        points={hexPoints(60, 60, 46)}
        fill="rgba(34,211,238,0.05)"
        stroke="#22d3ee"
        strokeWidth="1.5"
      />
      <polygon
        points={hexPoints(60, 60, 34)}
        fill="rgba(5,8,15,0.85)"
        stroke={tierColor}
        strokeWidth="2"
      />
      <text
        x="60"
        y="60"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#e2f1f8"
        fontSize="30"
        fontWeight="800"
        fontFamily="var(--font-mono)"
      >
        {level}
      </text>
    </svg>
  )
}
