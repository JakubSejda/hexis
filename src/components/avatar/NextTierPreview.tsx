import { TierBadge } from './TierBadge'
import { Card, Heading } from '@/components/ui'
import { TONE_TEXT, tierTone } from '@/components/dashboard/RankLens'
import { nextTierMeta } from '@/lib/tiers'

type Props = { currentLevel: number; totalXp: number }

export function NextTierPreview({ currentLevel, totalXp }: Props) {
  const next = nextTierMeta(currentLevel)
  if (!next) return null
  const xpNeeded = Math.pow(next.levelMin - 1, 2) * 100 - totalXp
  return (
    <Card>
      <Heading level={2} variant="region" className="mb-3">
        Další tier
      </Heading>
      <div className="flex items-center gap-3">
        <TierBadge tier={next.tier} size={64} dim />
        <div>
          <div
            className={`font-display text-lg font-black uppercase ${TONE_TEXT[tierTone(next.tier)]}`}
          >
            {next.name}
          </div>
          <div className="text-muted text-xs">Odemkneš na levelu {next.levelMin}</div>
          <div className="text-muted text-xs">
            Zbývá {Math.max(0, xpNeeded).toLocaleString('cs-CZ')} XP
          </div>
        </div>
      </div>
    </Card>
  )
}
