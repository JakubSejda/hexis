'use client'

import { useEffect, useState } from 'react'
import { HexEmblem } from '@/components/dashboard/HexEmblem'
import { Button } from '@/components/ui'
import { TIERS, type Tier } from '@/lib/tiers'

type Props = { levelAfter: number; tier: Tier; onDismiss: () => void }

export function TierUpModal({ levelAfter, tier, onDismiss }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') onDismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDismiss])
  const meta = TIERS[tier - 1]!
  return (
    <div
      role="dialog"
      aria-modal
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onDismiss}
    >
      <Confetti />
      <div className="hud-clip bg-system relative mx-4 p-px" onClick={(e) => e.stopPropagation()}>
        <div className="hud-clip bg-surface flex flex-col items-center p-8 text-center">
          <HexEmblem
            level={levelAfter}
            tierColor={meta.accent}
            size={140}
            className="animate-tier-glow"
          />
          <div className="text-system mt-4 font-mono text-xs tracking-[0.3em] uppercase">
            Nový tier odemknut
          </div>
          <div
            className="mt-2 text-2xl font-black tracking-tight uppercase italic"
            style={{ color: meta.color }}
          >
            Tier {tier}: {meta.name} odemknuty!
          </div>
          <div className="text-muted-strong mt-1 font-mono text-sm">
            Dosahl jsi Level {levelAfter}
          </div>
          <Button variant="success" size="md" className="mt-6 px-6" onClick={onDismiss}>
            Pokracovat
          </Button>
        </div>
      </div>
    </div>
  )
}

const CONFETTI_COLORS = ['#22d3ee', '#f59e0b', '#34d399', '#e2f1f8', '#fbbf24']

type ConfettiPiece = {
  left: number
  delay: number
  duration: number
  bg: string
  rotate: number
}

// Module-level so the render-purity rule doesn't apply to Math.random calls.
function generateConfetti(): ConfettiPiece[] {
  return Array.from({ length: 40 }, () => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1.5 + Math.random(),
    bg: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]!,
    rotate: Math.random() * 360,
  }))
}

function Confetti() {
  // Randomised once per mount via lazy state initialiser.
  const [pieces] = useState<ConfettiPiece[]>(generateConfetti)
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: '-20px',
            left: `${p.left}%`,
            width: 8,
            height: 12,
            background: p.bg,
            transform: `rotate(${p.rotate}deg)`,
            animation: `confetti-fall ${p.duration}s linear ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  )
}
