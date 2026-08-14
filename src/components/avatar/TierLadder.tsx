'use client'

import { useState } from 'react'
import { Card } from '@/components/ui'
import { TierBadge } from './TierBadge'
import { TIERS, type Tier } from '@/lib/tiers'

type Props = { currentTier: Tier }

export function TierLadder({ currentTier }: Props) {
  const [open, setOpen] = useState<Tier | null>(null)
  return (
    <div className="space-y-2">
      <h2 className="text-muted font-mono text-xs tracking-[0.2em] uppercase">Tier ladder</h2>
      <div className="flex justify-around">
        {TIERS.map((t) => (
          <button
            key={t.tier}
            type="button"
            onClick={() => setOpen(open === t.tier ? null : t.tier)}
            className="flex flex-col items-center"
          >
            <div className={t.tier === currentTier ? 'ring-system rounded-full p-0.5 ring-2' : ''}>
              <TierBadge tier={t.tier} size={48} dim={t.tier > currentTier} label />
            </div>
          </button>
        ))}
      </div>
      {open != null && (
        <Card padding="sm" className="text-foreground text-sm">
          <div className="font-semibold">{TIERS[open - 1]!.name}</div>
          <div className="text-muted font-mono text-xs">
            Level {TIERS[open - 1]!.levelMin}–
            {TIERS[open - 1]!.levelMax === 999 ? '∞' : TIERS[open - 1]!.levelMax}
          </div>
        </Card>
      )}
    </div>
  )
}
