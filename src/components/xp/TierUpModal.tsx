'use client'

import { useEffect } from 'react'
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

function Confetti() {
  const pieces = Array.from({ length: 40 })
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((_, i) => {
        const left = Math.random() * 100
        const delay = Math.random() * 0.5
        const duration = 1.5 + Math.random()
        const colors = ['#10b981', '#f59e0b', '#0ea5e9', '#eab308', '#ef4444']
        const bg = colors[Math.floor(Math.random() * colors.length)]
        return (
          <span
            key={i}
            style={{
              position: 'absolute',
              top: '-20px',
              left: `${left}%`,
              width: 8,
              height: 12,
              background: bg,
              transform: `rotate(${Math.random() * 360}deg)`,
              animation: `confetti-fall ${duration}s linear ${delay}s forwards`,
            }}
          />
        )
      })}
    </div>
  )
}
