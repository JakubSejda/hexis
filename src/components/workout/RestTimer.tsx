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

  return (
    <div className="bg-surface-raised border-border rounded-lg border p-3 text-center tabular-nums shadow-sm">
      {state ? (
        <>
          <div className="text-muted text-xs tracking-wider uppercase">Rest</div>
          <div className="text-accent text-4xl font-bold">
            {mm}:{ss}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted mt-1 underline"
            onClick={() => restTimerStore.stop()}
          >
            Přeskočit
          </Button>
        </>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="text-primary"
          iconLeft={<Play size={14} aria-hidden />}
          onClick={() => restTimerStore.start(defaultDurationSec)}
        >
          Spustit rest ({defaultDurationSec} s)
        </Button>
      )}
    </div>
  )
}
