import { cn } from '@/components/ui/utils/cn'

type Tone = 'primary' | 'success' | 'warn' | 'danger' | 'muted'
type Variant = 'default' | 'xp'

type Props = {
  value: number | null
  max: number | null
  height?: number
  tone?: Tone
  variant?: Variant
  className?: string
}

const TONE: Record<Tone, string> = {
  primary: '#10b981',
  success: '#10b981',
  warn: '#f59e0b',
  danger: '#ef4444',
  muted: '#6b7280',
}

const XP_COLOR = '#f59e0b'
const XP_GLOW = 'shadow-[0_0_8px_rgba(245,158,11,0.4)]'

export function ProgressBar({
  value,
  max,
  height = 8,
  tone = 'primary',
  variant = 'default',
  className,
}: Props) {
  const pct = value != null && max != null && max > 0 ? Math.min((value / max) * 100, 100) : 0
  const fillColor = variant === 'xp' ? XP_COLOR : TONE[tone]
  return (
    <div
      className={cn('bg-border overflow-hidden rounded-full', className)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={value ?? undefined}
      aria-valuemax={max ?? undefined}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-200',
          variant === 'xp' && XP_GLOW
        )}
        style={{ width: `${pct}%`, background: fillColor }}
      />
    </div>
  )
}
