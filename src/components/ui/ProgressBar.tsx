type Tone = 'primary' | 'success' | 'warn' | 'danger' | 'muted'

type Props = {
  value: number | null
  max: number | null
  height?: number
  tone?: Tone
  className?: string
}

const TONE: Record<Tone, string> = {
  primary: '#10b981',
  success: '#10b981',
  warn: '#f59e0b',
  danger: '#ef4444',
  muted: '#6b7280',
}

export function ProgressBar({ value, max, height = 8, tone = 'primary', className }: Props) {
  const pct = value != null && max != null && max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div
      className={'overflow-hidden rounded-full bg-[#1f2733] ' + (className ?? '')}
      style={{ height }}
      role="progressbar"
      aria-valuenow={value ?? undefined}
      aria-valuemax={max ?? undefined}
    >
      <div
        className="h-full rounded-full transition-[width] duration-200"
        style={{ width: `${pct}%`, background: TONE[tone] }}
      />
    </div>
  )
}
