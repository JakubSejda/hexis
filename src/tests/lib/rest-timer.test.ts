// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/sw-rest-timer', () => ({
  notifySwRestTimer: vi.fn(),
  cancelSwRestTimer: vi.fn(),
  requestNotificationPermission: vi.fn(async () => false),
}))

import { restTimerStore } from '@/lib/rest-timer'

describe('restTimerStore.getSnapshot', () => {
  beforeEach(() => {
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
