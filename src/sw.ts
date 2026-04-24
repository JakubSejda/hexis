import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { Serwist } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope & WorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
})

// ─── Rest Timer Notification ──────────────────────────────────
let restTimerTimeout: ReturnType<typeof setTimeout> | null = null

self.addEventListener('message', (event) => {
  const data = event.data
  if (!data || typeof data !== 'object') return

  if (data.type === 'REST_TIMER_START' && typeof data.durationSec === 'number') {
    if (restTimerTimeout) clearTimeout(restTimerTimeout)
    restTimerTimeout = setTimeout(() => {
      self.registration.showNotification('Hexis — Rest Timer', {
        body: 'Čas na další sérii!',
        icon: '/icons/icon-192.png',
        tag: 'rest-timer',
        requireInteraction: false,
        silent: false,
      })
      restTimerTimeout = null
    }, data.durationSec * 1000)
  }

  if (data.type === 'REST_TIMER_CANCEL') {
    if (restTimerTimeout) {
      clearTimeout(restTimerTimeout)
      restTimerTimeout = null
    }
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes('/training'))
      if (existing) {
        return existing.focus()
      }
      return self.clients.openWindow('/training')
    })
  )
})

serwist.addEventListeners()
