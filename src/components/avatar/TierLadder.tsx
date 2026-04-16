'use client'

import { useState } from 'react'
import { TierBadge } from './TierBadge'
import { TIERS, type Tier } from '@/lib/tiers'

type Props = { currentTier: Tier }

export function TierLadder({ currentTier }: Props) {
  const [open, setOpen] = useState<Tier | null>(null)
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-[#e5e7eb]">Tier ladder</h2>
      <div className="flex justify-around">
        {TIERS.map((t) => (
          <button
            key={t.tier}
            type="button"
            onClick={() => setOpen(open === t.tier ? null : t.tier)}
            className="flex flex-col items-center"
          >
            <div
              className={t.tier === currentTier ? 'rounded-full p-0.5 ring-2 ring-[#10b981]' : ''}
            >
              <TierBadge tier={t.tier} size={48} dim={t.tier > currentTier} label />
            </div>
          </button>
        ))}
      </div>
      {open != null && (
        <div className="rounded-lg border border-[#1F2733] bg-[#0a0e14] p-3 text-sm text-[#e5e7eb]">
          <div className="font-semibold">{TIERS[open - 1]!.name}</div>
          <div className="text-xs text-[#6b7280]">
            Level {TIERS[open - 1]!.levelMin}–
            {TIERS[open - 1]!.levelMax === 999 ? '∞' : TIERS[open - 1]!.levelMax}
          </div>
        </div>
      )}
    </div>
  )
}
