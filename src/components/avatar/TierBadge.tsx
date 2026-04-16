import { Avatar } from './Avatar'
import { TIERS, type Tier } from '@/lib/tiers'

type Props = { tier: Tier; size?: number; dim?: boolean; label?: boolean }

export function TierBadge({ tier, size = 48, dim, label }: Props) {
  const meta = TIERS[tier - 1]!
  return (
    <div className={'inline-flex flex-col items-center gap-1 ' + (dim ? 'opacity-40' : '')}>
      <Avatar tier={tier} size={size} />
      {label && (
        <>
          <span className="text-[10px] font-semibold text-[#e5e7eb]">{meta.name}</span>
          <span className="text-[10px] text-[#6b7280]">L{meta.levelMin}+</span>
        </>
      )}
    </div>
  )
}
