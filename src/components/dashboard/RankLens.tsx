import { cn } from '@/components/ui'

export type LensTone = 's' | 'a' | 'b' | 'c' | 'd' | 'system'

const TONE: Record<LensTone, string> = {
  s: 'text-rank-s',
  a: 'text-rank-a',
  b: 'text-rank-b',
  c: 'text-rank-c',
  d: 'text-rank-d',
  system: 'text-system',
}

/** Tiers 1–5 read like ranks D→S, so they share the rank colours. */
const TIER_TONE: readonly LensTone[] = ['d', 'c', 'b', 'a', 's']
export const tierTone = (tier: number): LensTone => TIER_TONE[tier - 1] ?? 'system'
export const TONE_TEXT = TONE

const SIZE = { sm: 'h-12 w-11 text-lg', md: 'h-14 w-[3.25rem] text-2xl' } as const

/** Hexagonal lens for ranks and tiers — the one shape that stays angular in D. */
export function RankLens({
  label,
  tone = 'system',
  size = 'md',
  className,
  title,
}: {
  label: string
  tone?: LensTone
  size?: keyof typeof SIZE
  className?: string
  title?: string
}) {
  return (
    <span
      title={title}
      className={cn(
        'font-display relative isolate grid shrink-0 place-items-center font-black',
        TONE[tone],
        SIZE[size],
        className
      )}
    >
      <svg aria-hidden viewBox="0 0 52 58" className="absolute inset-0 -z-10 h-full w-full">
        <polygon
          points="26,2 50,15 50,43 26,56 2,43 2,15"
          className="fill-background/80"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      {label}
    </span>
  )
}
