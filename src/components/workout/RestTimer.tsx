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
  // Ring drains with remaining time (pathLength trick).
  const ratio = state && state.durationMs > 0 ? remaining / state.durationMs : 0

  return (
    <div className="bg-surface-raised rounded-control p-3 tabular-nums">
      {state ? (
        <div className="flex items-center gap-4">
          <span className="relative inline-flex size-16 shrink-0 items-center justify-center">
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 h-full w-full -rotate-90"
              aria-hidden
            >
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                className="stroke-border"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                className="stroke-accent transition-[stroke-dashoffset] duration-1000 ease-linear"
                strokeWidth="8"
                pathLength={100}
                strokeDasharray={100}
                strokeDashoffset={100 - ratio * 100}
                strokeLinecap="round"
              />
            </svg>
            <span className="font-display relative text-sm font-black">
              {mm}:{ss}
            </span>
          </span>
          <div className="flex flex-col items-start gap-1">
            <span className="font-display text-sm font-black uppercase">Pauza</span>
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
          className="text-system w-full"
          iconLeft={<Play size={14} aria-hidden />}
          onClick={() => restTimerStore.start(defaultDurationSec)}
        >
          Spustit pauzu ({defaultDurationSec} s)
        </Button>
      )}
    </div>
  )
}
