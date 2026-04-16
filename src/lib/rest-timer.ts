import {
  notifySwRestTimer,
  cancelSwRestTimer,
  requestNotificationPermission,
} from './sw-rest-timer'

const KEY = 'hexis:rest-timer'

export type TimerState = {
  startedAt: number // Date.now() at start
  durationMs: number
} | null

type Listener = () => void
const listeners = new Set<Listener>()

function readStorage(): TimerState {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as TimerState
    if (!parsed) return null
    // expired? clean up
    if (Date.now() > parsed.startedAt + parsed.durationMs) {
      window.localStorage.removeItem(KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writeStorage(state: TimerState) {
  if (typeof window === 'undefined') return
  if (state === null) {
    window.localStorage.removeItem(KEY)
  } else {
    window.localStorage.setItem(KEY, JSON.stringify(state))
  }
  listeners.forEach((l) => l())
}

export const restTimerStore = {
  start(durationSec: number) {
    writeStorage({ startedAt: Date.now(), durationMs: durationSec * 1000 })
    requestNotificationPermission().then((granted) => {
      if (granted) notifySwRestTimer(durationSec)
    })
  },
  stop() {
    writeStorage(null)
    cancelSwRestTimer()
  },
  getSnapshot(): TimerState {
    return readStorage()
  },
  subscribe(listener: Listener) {
    listeners.add(listener)
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) listener()
    }
    if (typeof window !== 'undefined') window.addEventListener('storage', onStorage)
    return () => {
      listeners.delete(listener)
      if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage)
    }
  },
}

export function remainingMs(state: TimerState, now = Date.now()): number {
  if (!state) return 0
  return Math.max(0, state.startedAt + state.durationMs - now)
}

/** Screen Wake Lock wrapper with graceful fallback on unsupported browsers. */
export async function requestWakeLock(): Promise<() => void> {
  if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
    return () => {}
  }
  try {
    const sentinel = await navigator.wakeLock.request('screen')
    return () => {
      sentinel.release().catch(() => {})
    }
  } catch {
    return () => {}
  }
}
