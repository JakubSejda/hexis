import { Avatar } from './Avatar'
import { Card } from '@/components/ui'
import { nextTierMeta } from '@/lib/tiers'

type Props = { currentLevel: number; totalXp: number }

export function NextTierPreview({ currentLevel, totalXp }: Props) {
  const next = nextTierMeta(currentLevel)
  if (!next) return null
  const xpNeeded = Math.pow(next.levelMin - 1, 2) * 100 - totalXp
  return (
    <Card>
      <h2 className="text-muted mb-3 font-mono text-xs tracking-[0.2em] uppercase">Další tier</h2>
      <div className="flex items-center gap-3">
        <div className="opacity-40">
          <Avatar tier={next.tier} size={64} />
        </div>
        <div>
          <div className="text-lg font-bold" style={{ color: next.color }}>
            {next.name}
          </div>
          <div className="text-muted text-xs">Odemkneš v Level {next.levelMin}</div>
          <div className="text-muted text-xs">
            Zbývá {Math.max(0, xpNeeded).toLocaleString('cs-CZ')} XP
          </div>
        </div>
      </div>
    </Card>
  )
}
