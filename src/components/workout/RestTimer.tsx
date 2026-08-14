'use client'
import { useSyncExternalStore, useEffect, useRef, useState } from 'react'
import { Play } from 'lucide-react'
import { Button } from '@/components/ui'
import { restTimerStore, remainingMs, requestWakeLock } from '@/lib/rest-timer'

export function RestTimer({ defaultDurationSec }: { defaultDurationSec: number }) {
  const state = useSyncExternalStore(
    restTimerStore.subscribe,
    restTimerStore.getSnapshot,
    () => null
  )
  const [, setTick] = useState(0)
  const releaseRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!state) return
    const interval = window.setInterval(() => setTick((x) => x + 1), 1000)
    return () => window.clearInterval(interval)
  }, [state])

  useEffect(() => {
    let cancelled = false
    if (state) {
      requestWakeLock().then((release) => {
        if (cancelled) release()
        else releaseRef.current = release
      })
    }
    return () => {
      cancelled = true
      releaseRef.current?.()
      releaseRef.current = null
    }
  }, [state])

  useEffect(() => {
    if (!state) return
    const remaining = remainingMs(state)
    if (remaining === 0) {
      restTimerStore.stop()
      try {
        const a = new Audio(
          'data:audio/wav;base64,UklGRmQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YUAAAAA='
        )
        a.play().catch(() => {})
      } catch {}
    }
  })

  const remaining = state ? remainingMs(state) : 0
  const mm = String(Math.floor(remaining / 60000)).padStart(2, '0')
  const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0')
  // Hexagon ring drains with remaining time (pathLength trick — see prototype B).
  const ratio = state && state.durationMs > 0 ? remaining / state.durationMs : 0

  return (
    <div className="bg-surface-raised border-border hud-clip-sm border p-3 text-center tabular-nums">
      {state ? (
        <div className="flex items-center justify-center gap-4">
          <span className="relative inline-flex h-20 w-20 items-center justify-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
              <polygon
                points="50,4 90,27 90,73 50,96 10,73 10,27"
                fill="none"
                stroke="#1e293b"
                strokeWidth="4"
              />
              <polygon
                points="50,4 90,27 90,73 50,96 10,73 10,27"
                fill="none"
                stroke="#22d3ee"
                strokeWidth="4"
                pathLength={100}
                strokeDasharray={100}
                strokeDashoffset={100 - ratio * 100}
                strokeLinecap="square"
              />
            </svg>
            <span className="text-system relative font-mono text-lg font-bold">
              {mm}:{ss}
            </span>
          </span>
          <div className="flex flex-col items-start gap-1">
            <span className="text-muted font-mono text-xs tracking-[0.2em] uppercase">
              Odpočinek
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted px-0 underline"
              onClick={() => restTimerStore.stop()}
            >
              Přeskočit
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="text-system"
          iconLeft={<Play size={14} aria-hidden />}
          onClick={() => restTimerStore.start(defaultDurationSec)}
        >
          Spustit rest ({defaultDurationSec} s)
        </Button>
      )}
    </div>
  )
}
