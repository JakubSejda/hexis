'use client'

import { useEffect } from 'react'
import { HexEmblem } from '@/components/dashboard/HexEmblem'
import { TIERS, type Tier } from '@/lib/tiers'

type Props = { levelAfter: number; tier: Tier; onDismiss: () => void }

/**
 * HUD level-up moment (Reforge R4): a brief full-screen overlay — the
 * emblem powers on with the new level. Auto-dismisses; tap skips.
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
        <HexEmblem
          level={levelAfter}
          tierColor={meta.accent}
          size={160}
          className="animate-tier-glow"
        />
        <div className="text-accent font-mono text-xs tracking-[0.3em] uppercase">Level up</div>
        <div className="text-foreground text-4xl font-black tracking-tight uppercase italic">
          Level {levelAfter}
        </div>
        <div className="text-muted-strong font-mono text-sm">
          L{levelAfter - 1} → L{levelAfter} · {meta.name}
        </div>
      </div>
    </div>
  )
}
