import { Avatar } from './Avatar'
import { nextTierMeta } from '@/lib/tiers'

type Props = { currentLevel: number; totalXp: number }

export function NextTierPreview({ currentLevel, totalXp }: Props) {
  const next = nextTierMeta(currentLevel)
  if (!next) return null
  const xpNeeded = Math.pow(next.levelMin - 1, 2) * 100 - totalXp
  return (
    <div className="rounded-lg border border-[#1F2733] bg-[#141A22] p-4">
      <h2 className="mb-3 text-sm font-semibold text-[#e5e7eb]">Další tier</h2>
      <div className="flex items-center gap-3">
        <div className="opacity-40">
          <Avatar tier={next.tier} size={64} />
        </div>
        <div>
          <div className="text-lg font-bold" style={{ color: next.color }}>
            {next.name}
          </div>
          <div className="text-xs text-[#6b7280]">Odemkneš v Level {next.levelMin}</div>
          <div className="text-xs text-[#6b7280]">
            Zbývá {Math.max(0, xpNeeded).toLocaleString('cs-CZ')} XP
          </div>
        </div>
      </div>
    </div>
  )
}
