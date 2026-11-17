// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/sw-rest-timer', () => ({
  notifySwRestTimer: vi.fn(),
  cancelSwRestTimer: vi.fn(),
  requestNotificationPermission: vi.fn(async () => false),
}))

import { restTimerStore } from '@/lib/rest-timer'

// Node 25 ships its own half-initialised global localStorage that shadows jsdom's (CI runs Node 25).
function memoryStorage(): Storage {
  const m = new Map<string, string>()
  return {
    get length() {
      return m.size
    },
    clear: () => m.clear(),
    getItem: (k) => m.get(k) ?? null,
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, String(v)),
  }
}

describe('restTimerStore.getSnapshot', () => {
  beforeEach(() => {
    const storage = memoryStorage()
    vi.stubGlobal('localStorage', storage)
    Object.defineProperty(window, 'localStorage', { value: storage, configurable: true })
    restTimerStore.stop()
  })

  it('returns the same object while the timer is unchanged — useSyncExternalStore loops otherwise', () => {
    restTimerStore.start(90)
    const a = restTimerStore.getSnapshot()
    const b = restTimerStore.getSnapshot()
    expect(a).not.toBeNull()
    expect(b).toBe(a)
  })

  it('returns a new snapshot after a restart', () => {
    vi.useFakeTimers()
    restTimerStore.start(90)
    const first = restTimerStore.getSnapshot()
    vi.advanceTimersByTime(1000)
    restTimerStore.start(60)
    expect(restTimerStore.getSnapshot()).not.toBe(first)
    vi.useRealTimers()
  })

  it('is null after stop', () => {
    restTimerStore.start(90)
    restTimerStore.stop()
    expect(restTimerStore.getSnapshot()).toBeNull()
  })
})
