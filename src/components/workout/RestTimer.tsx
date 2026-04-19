'use client'
import { useSyncExternalStore, useEffect, useRef, useState } from 'react'
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

  return (
    <div className="bg-border rounded-lg p-3 text-center tabular-nums">
      {state ? (
        <>
          <div className="text-muted text-xs tracking-wider uppercase">Rest</div>
          <div className="text-accent text-2xl font-bold">
            {mm}:{ss}
          </div>
          <button
            type="button"
            className="text-muted mt-1 text-xs underline"
            onClick={() => restTimerStore.stop()}
          >
            Přeskočit
          </button>
        </>
      ) : (
        <button
          type="button"
          className="text-primary text-sm"
          onClick={() => restTimerStore.start(defaultDurationSec)}
        >
          ▶ Spustit rest ({defaultDurationSec} s)
        </button>
      )}
    </div>
  )
}
