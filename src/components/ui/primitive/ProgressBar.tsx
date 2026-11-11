import { cn } from '../utils/cn'

/**
 * D grammar: a non-XP bar reports system state, so `system` is the default.
 * `variant="xp"` is the accent gradient with a glow. Green is semantic success only.
 */
type Tone = 'system' | 'accent' | 'success' | 'warn' | 'danger' | 'muted'
type Variant = 'default' | 'xp'

type Props = {
  value: number | null
  max: number | null
  height?: number
  tone?: Tone
  variant?: Variant
  /** Accessible name; a progressbar without one is announced as just a number. */
  label?: string
  className?: string
}

const TONE: Record<Tone, string> = {
  system: 'bg-system',
  accent: 'bg-accent',
  success: 'bg-success',
  warn: 'bg-warning',
  danger: 'bg-danger',
  muted: 'bg-muted',
}

const XP_CLASS = 'from-accent-deep to-accent bg-linear-to-r shadow-glow'

export function ProgressBar({
  value,
  max,
  height = 8,
  tone = 'system',
  variant = 'default',
  label = 'Postup',
  className,
}: Props) {
  const pct = value != null && max != null && max > 0 ? Math.min((value / max) * 100, 100) : 0
  const fillClass = variant === 'xp' ? XP_CLASS : TONE[tone]
  return (
    <div
      className={cn('bg-surface-raised overflow-hidden rounded-full', className)}
      style={{ height }}
      role="progressbar"
      aria-label={label}
      aria-valuenow={value ?? undefined}
      aria-valuemax={max ?? undefined}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-500 ease-out', fillClass)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
