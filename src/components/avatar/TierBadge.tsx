import { HexEmblem } from '@/components/dashboard/HexEmblem'
import { TIERS, type Tier } from '@/lib/tiers'

type Props = { tier: Tier; size?: number; dim?: boolean; label?: boolean }

const ROMAN: Record<Tier, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V' }

/**
 * A tier crest in the HUD emblem language. Until this slice it rendered a
 * circular SVG asset from April (public/avatars/tier-N.svg) while the
 * dashboard used HexEmblem — two emblem languages for one concept.
 */
export function TierBadge({ tier, size = 48, dim, label }: Props) {
  const meta = TIERS[tier - 1]!
  return (
    <div className={'inline-flex flex-col items-center gap-1 ' + (dim ? 'opacity-40' : '')}>
      <HexEmblem
        level={tier}
        label={ROMAN[tier]}
        ariaLabel={`Tier ${tier} — ${meta.name}`}
        tierColor={meta.color}
        size={size}
      />
      {label && (
        <>
          <span className="text-foreground text-xs font-semibold">{meta.name}</span>
          <span className="text-muted text-xs">L{meta.levelMin}+</span>
        </>
      )}
    </div>
  )
}
