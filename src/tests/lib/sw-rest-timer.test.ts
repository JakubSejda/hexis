import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  notifySwRestTimer,
  cancelSwRestTimer,
  requestNotificationPermission,
} from '@/lib/sw-rest-timer'

describe('sw-rest-timer', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('notifySwRestTimer sends postMessage to SW controller', () => {
    const postMessage = vi.fn()
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { controller: { postMessage } },
      configurable: true,
    })
    notifySwRestTimer(90)
    expect(postMessage).toHaveBeenCalledWith({
      type: 'REST_TIMER_START',
      durationSec: 90,
    })
  })

  it('cancelSwRestTimer sends cancel message', () => {
    const postMessage = vi.fn()
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { controller: { postMessage } },
      configurable: true,
    })
    cancelSwRestTimer()
    expect(postMessage).toHaveBeenCalledWith({
      type: 'REST_TIMER_CANCEL',
    })
  })

  it('notifySwRestTimer does nothing without SW controller', () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { controller: null },
      configurable: true,
    })
    expect(() => notifySwRestTimer(60)).not.toThrow()
  })

  it('requestNotificationPermission returns true when already granted', async () => {
    vi.stubGlobal('window', { Notification: { permission: 'granted', requestPermission: vi.fn() } })
    vi.stubGlobal('Notification', { permission: 'granted', requestPermission: vi.fn() })
    const result = await requestNotificationPermission()
    expect(result).toBe(true)
    vi.unstubAllGlobals()
  })

  it('requestNotificationPermission returns false when denied', async () => {
    vi.stubGlobal('window', { Notification: { permission: 'denied', requestPermission: vi.fn() } })
    vi.stubGlobal('Notification', { permission: 'denied', requestPermission: vi.fn() })
    const result = await requestNotificationPermission()
    expect(result).toBe(false)
    vi.unstubAllGlobals()
  })
})
