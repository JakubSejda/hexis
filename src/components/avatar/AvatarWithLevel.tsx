import { Avatar } from './Avatar'
import type { Tier } from '@/lib/tiers'

type Props = { tier: Tier; level: number; size?: number; className?: string }

export function AvatarWithLevel({ tier, level, size = 80, className }: Props) {
  return (
    <div
      className={'relative inline-block ' + (className ?? '')}
      style={{ width: size, height: size }}
    >
      <Avatar tier={tier} size={size} />
      <span
        className="hud-clip-sm border-background bg-background text-accent absolute right-0 bottom-0 border px-1.5 py-0.5 font-mono text-xs font-bold"
        style={{ transform: 'translate(25%, 25%)' }}
      >
        L{level}
      </span>
    </div>
  )
}
