import type { Tier } from '@/lib/tiers'

type Props = { tier: Tier; size?: number; className?: string; ringPulse?: boolean }

export function Avatar({ tier, size = 56, className, ringPulse }: Props) {
  return (
    <img
      src={`/avatars/tier-${tier}.svg`}
      width={size}
      height={size}
      alt={`Tier ${tier}`}
      className={
        'inline-block select-none ' + (ringPulse ? 'animate-tier-glow ' : '') + (className ?? '')
      }
      style={{ width: size, height: size }}
      draggable={false}
    />
  )
}
