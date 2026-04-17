'use client'

import { useEffect, useState } from 'react'
import { Avatar } from '@/components/avatar/Avatar'
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
      <div
        className="relative mx-4 rounded-2xl border border-[#1F2733] bg-[#141A22] p-8 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Avatar tier={tier} size={120} ringPulse />
        <div className="mt-4 text-2xl font-bold" style={{ color: meta.color }}>
          Tier {tier}: {meta.name} odemknuty!
        </div>
        <div className="mt-1 text-sm text-[#6b7280]">Dosahl jsi Level {levelAfter}</div>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-6 rounded-lg bg-[#10b981] px-6 py-2 text-sm font-semibold text-[#0a0e14]"
        >
          Pokracovat
        </button>
      </div>
    </div>
  )
}

const CONFETTI_COLORS = ['#10b981', '#f59e0b', '#0ea5e9', '#eab308', '#ef4444']

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
