import { sparklinePath } from '@/lib/sparkline'

type Props = {
  values: (number | null)[]
  width?: number
  height?: number
  color?: string
  showEndDot?: boolean
  className?: string
}

export function Sparkline({
  values,
  width = 120,
  height = 32,
  color = 'currentColor',
  showEndDot = true,
  className,
}: Props) {
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
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showEndDot && endIdx >= 0 && <circle cx={endX} cy={endY} r={3} fill={color} />}
    </svg>
  )
}
