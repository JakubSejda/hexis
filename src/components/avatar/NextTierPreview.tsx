import { Avatar } from './Avatar'
import { nextTierMeta } from '@/lib/tiers'

type Props = { currentLevel: number; totalXp: number }

export function NextTierPreview({ currentLevel, totalXp }: Props) {
  const next = nextTierMeta(currentLevel)
  if (!next) return null
  const xpNeeded = Math.pow(next.levelMin - 1, 2) * 100 - totalXp
  return (
    <div className="border-border bg-surface rounded-lg border p-4">
      <h2 className="text-foreground mb-3 text-sm font-semibold">Další tier</h2>
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
    </div>
  )
}
