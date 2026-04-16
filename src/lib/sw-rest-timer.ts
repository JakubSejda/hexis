export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function notifySwRestTimer(durationSec: number): void {
  if (typeof navigator === 'undefined') return
  if (!navigator.serviceWorker?.controller) return
  navigator.serviceWorker.controller.postMessage({
    type: 'REST_TIMER_START',
    durationSec,
  })
}

export function cancelSwRestTimer(): void {
  if (typeof navigator === 'undefined') return
  if (!navigator.serviceWorker?.controller) return
  navigator.serviceWorker.controller.postMessage({
    type: 'REST_TIMER_CANCEL',
  })
}
