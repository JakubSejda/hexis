'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { Tier } from '@/lib/tiers'
import { LevelUpToast } from './LevelUpToast'
import { TierUpModal } from './TierUpModal'
import { playLevelUpDing, playTierUpFanfare } from '@/lib/xp-audio'

type XpResponse = {
  xpDelta?: number
  levelUp?: boolean
  tierUp?: boolean
  levelAfter?: number
  tierAfter?: Tier
}

type Queued =
  | { kind: 'level'; levelAfter: number; tier: Tier }
  | { kind: 'tier'; levelAfter: number; tier: Tier }

type Ctx = { notifyXp: (r: XpResponse) => void }
const XpCtx = createContext<Ctx | null>(null)

export function useXpFeedback(): Ctx {
  const c = useContext(XpCtx)
  if (!c) throw new Error('useXpFeedback must be used inside XpFeedbackProvider')
  return c
}

export function XpFeedbackProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<Queued[]>([])

  const notifyXp = useCallback((r: XpResponse) => {
    if (!r.levelUp || r.levelAfter == null || r.tierAfter == null) return
    const item: Queued = r.tierUp
      ? { kind: 'tier', levelAfter: r.levelAfter, tier: r.tierAfter as Tier }
      : { kind: 'level', levelAfter: r.levelAfter, tier: r.tierAfter as Tier }
    setQueue((prev) => [...prev, item])
    if (item.kind === 'tier') playTierUpFanfare()
    else playLevelUpDing()
  }, [])

  const current = queue[0]
  const dismiss = useCallback(() => setQueue((prev) => prev.slice(1)), [])
  const ctxValue = useMemo(() => ({ notifyXp }), [notifyXp])

  return (
    <XpCtx value={ctxValue}>
      {children}
      {current?.kind === 'level' && (
        <LevelUpToast levelAfter={current.levelAfter} tier={current.tier} onDismiss={dismiss} />
      )}
      {current?.kind === 'tier' && (
        <TierUpModal levelAfter={current.levelAfter} tier={current.tier} onDismiss={dismiss} />
      )}
    </XpCtx>
  )
}
