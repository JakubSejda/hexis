import { sparklinePath } from '@/lib/sparkline'

type Tone = 'primary' | 'success' | 'warn' | 'danger' | 'muted'

type Props = {
  values: (number | null)[]
  width?: number
  height?: number
  tone?: Tone
  showEndDot?: boolean
  className?: string
}

const TONE: Record<Tone, string> = {
  primary: '#10b981',
  success: '#10b981',
  warn: '#f59e0b',
  danger: '#ef4444',
  muted: '#6b7280',
}

export function Sparkline({
  values,
  width = 120,
  height = 32,
  tone = 'muted',
  showEndDot = true,
  className,
}: Props) {
  const stroke = TONE[tone]
  const path = sparklinePath(values, width, height)
  if (!path) return <svg width={width} height={height} className={className} aria-hidden />
  let endIdx = -1
  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i] != null) {
      endIdx = i
      break
    }
  }
  const stepX = values.length > 1 ? width / (values.length - 1) : 0
  const endX = endIdx * stepX
  const nums = values.filter((v): v is number => v != null)
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  const range = max - min || 1
  const isConstant = max === min
  const endY = isConstant
    ? height / 2
    : height - (((values[endIdx] as number) - min) / range) * height
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden
    >
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showEndDot && endIdx >= 0 && <circle cx={endX} cy={endY} r={3} fill={stroke} />}
    </svg>
  )
}
