import { cn } from '../utils/cn'

/**
 * HUD grammar (Reforge R7): a non-XP bar reports system state, so `system`
 * (cyan) is the default. `accent` (amber) stays reserved for action/XP —
 * `variant="xp"` forces it. Emerald is semantic success only.
 */
type Tone = 'system' | 'accent' | 'success' | 'warn' | 'danger' | 'muted'
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
  system: '#22d3ee',
  accent: '#f59e0b',
  success: '#34d399',
  warn: '#f59e0b',
  danger: '#ef4444',
  muted: '#7c8da6',
}

const XP_COLOR = '#f59e0b'
const XP_GLOW = 'shadow-[0_0_8px_rgba(245,158,11,0.4)]'

export function ProgressBar({
  value,
  max,
  height = 8,
  tone = 'system',
  variant = 'default',
  className,
}: Props) {
  const pct = value != null && max != null && max > 0 ? Math.min((value / max) * 100, 100) : 0
  const fillColor = variant === 'xp' ? XP_COLOR : TONE[tone]
  return (
    <div
      className={cn('bg-border hud-clip-sm overflow-hidden', className)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={value ?? undefined}
      aria-valuemax={max ?? undefined}
    >
      <div
        className={cn(
          'animate-hud-charge h-full transition-[width] duration-200',
          variant === 'xp' && XP_GLOW
        )}
        style={{ width: `${pct}%`, backgroundColor: fillColor }}
      />
    </div>
  )
}
