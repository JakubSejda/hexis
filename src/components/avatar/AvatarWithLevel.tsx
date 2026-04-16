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
        className="absolute right-0 bottom-0 rounded-full border border-[#0a0e14] bg-[#0a0e14] px-1.5 py-0.5 text-[10px] font-bold text-[#10b981]"
        style={{ transform: 'translate(25%, 25%)' }}
      >
        L{level}
      </span>
    </div>
  )
}
