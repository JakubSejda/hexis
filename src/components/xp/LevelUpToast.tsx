'use client'

import { useEffect } from 'react'
import { Avatar } from '@/components/avatar/Avatar'
import { TIERS, type Tier } from '@/lib/tiers'

type Props = { levelAfter: number; tier: Tier; onDismiss: () => void }

export function LevelUpToast({ levelAfter, tier, onDismiss }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [onDismiss])
  const meta = TIERS[tier - 1]!
  return (
    <div
      role="status"
      className="fixed right-6 bottom-6 z-50 flex items-center gap-3 rounded-lg p-3 shadow-lg"
      style={{ background: meta.accent, color: '#e5e7eb' }}
    >
      <Avatar tier={tier} size={40} ringPulse />
      <div>
        <div className="text-sm font-bold">Nova uroven!</div>
        <div className="text-xs opacity-90">
          L{levelAfter - 1} &rarr; L{levelAfter}
        </div>
      </div>
    </div>
  )
}
