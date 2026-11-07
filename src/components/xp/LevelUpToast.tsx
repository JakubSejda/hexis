'use client'

import { useEffect } from 'react'
import { TIERS, type Tier } from '@/lib/tiers'

type Props = { levelAfter: number; tier: Tier; onDismiss: () => void }

/**
 * Level-up moment: a brief full-screen overlay where the accent orb breathes
 * around the new level. Auto-dismisses; tap skips.
 */
export function LevelUpToast({ levelAfter, tier, onDismiss }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500)
    return () => clearTimeout(t)
  }, [onDismiss])
  const meta = TIERS[tier - 1]!
  return (
    <div
      role="status"
      onClick={onDismiss}
      className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center gap-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="animate-hud-power-on flex flex-col items-center gap-4">
        <div className="quest-orb border-accent grid size-52 place-items-center rounded-full border-2">
          <span className="font-display text-center leading-none font-black uppercase">
            <span className="text-accent block text-lg">Level</span>
            <span className="hero-level block text-7xl">{levelAfter}</span>
          </span>
        </div>
        <div className="font-display text-3xl font-black uppercase">Level up</div>
        <div className="text-muted-strong text-sm">
          Level {levelAfter - 1} → {levelAfter} · {meta.name}
        </div>
      </div>
    </div>
  )
}
