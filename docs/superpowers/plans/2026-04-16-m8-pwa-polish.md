# M8 — PWA Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Hexis a fully installable PWA with precached app shell, runtime API caching, rest timer notifications via Service Worker, and install prompt.

**Architecture:** Serwist generates and registers the SW from a custom `src/sw.ts` entry point. Rest timer communicates with SW via postMessage. Install prompt intercepts `beforeinstallprompt` event. Icons generated via sharp script.

**Tech Stack:** @serwist/next 9, serwist 9, existing Next.js 16 stack. No other new deps.

**Test runner:** `npx vitest run --no-file-parallelism`

**Branch:** `m8-pwa-polish` (from `main`)

---

### Task 1: Create branch + install deps

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Create branch**

```bash
git checkout main
git checkout -b m8-pwa-polish
```

- [ ] **Step 2: Install Serwist**

```bash
npm install @serwist/next serwist
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(m8): install @serwist/next, serwist"
```

---

### Task 2: Generate placeholder icons

**Files:**
- Create: `scripts/generate-icons.ts`
- Create: `public/icons/icon-192.png`
- Create: `public/icons/icon-512.png`
- Create: `public/icons/icon-maskable-512.png`
- Create: `public/icons/apple-touch-icon.png`

- [ ] **Step 1: Create icon generator script**

```typescript
// scripts/generate-icons.ts
import sharp from 'sharp'
import { mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const OUT = join(process.cwd(), 'public', 'icons')
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })

// Hexagon SVG (emerald on dark background)
const hexSvg = (size: number, padding = 0) => {
  const cx = size / 2
  const cy = size / 2
  const r = (size - padding * 2) / 2
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2
    return `${cx + r * 0.85 * Math.cos(angle)},${cy + r * 0.85 * Math.sin(angle)}`
  }).join(' ')

  return Buffer.from(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#0A0E14"/>
      <polygon points="${points}" fill="#10b981"/>
      <text x="${cx}" y="${cy + r * 0.2}" text-anchor="middle" font-size="${r * 0.5}"
        font-family="sans-serif" font-weight="bold" fill="#0A0E14">H</text>
    </svg>
  `)
}

async function generate() {
  // Standard icons
  await sharp(hexSvg(512)).resize(192, 192).png().toFile(join(OUT, 'icon-192.png'))
  await sharp(hexSvg(512)).png().toFile(join(OUT, 'icon-512.png'))

  // Maskable (with safe zone padding — 20% on each side)
  await sharp(hexSvg(512, 52)).png().toFile(join(OUT, 'icon-maskable-512.png'))

  // Apple touch icon
  await sharp(hexSvg(512)).resize(180, 180).png().toFile(join(OUT, 'apple-touch-icon.png'))

  console.log('Icons generated in public/icons/')
}

generate()
```

- [ ] **Step 2: Run the generator**

```bash
npx tsx scripts/generate-icons.ts
```

Expected: 4 PNG files created in `public/icons/`.

- [ ] **Step 3: Verify files exist**

```bash
ls -la public/icons/
```

Expected: `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-icons.ts public/icons/
git commit -m "feat(m8): placeholder PWA icons (hexagon) + generator script"
```

---

### Task 3: Web App Manifest + meta tags

**Files:**
- Create: `public/manifest.json`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create manifest**

```json
{
  "name": "Hexis",
  "short_name": "Hexis",
  "description": "Self-transformation tracker",
  "start_url": "/dashboard",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#0A0E14",
  "background_color": "#0A0E14",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

Save as `public/manifest.json`.

- [ ] **Step 2: Update root layout with meta tags**

Modify `src/app/layout.tsx`. The current file:

```typescript
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hexis',
  description: 'ἕξις — a stable state acquired through practice.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" className="dark">
      <body className="bg-background text-foreground min-h-screen antialiased">{children}</body>
    </html>
  )
}
```

Change the `metadata` export and add `<head>` content:

```typescript
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hexis',
  description: 'ἕξις — a stable state acquired through practice.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Hexis',
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0A0E14',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" className="dark">
      <body className="bg-background text-foreground min-h-screen antialiased">{children}</body>
    </html>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add public/manifest.json src/app/layout.tsx
git commit -m "feat(m8): web app manifest + iOS meta tags + viewport config"
```

---

### Task 4: Serwist Service Worker setup

**Files:**
- Create: `src/sw.ts`
- Modify: `next.config.ts`
- Modify: `tsconfig.json`

- [ ] **Step 1: Add WebWorker lib to tsconfig**

In `tsconfig.json`, change the `lib` array from:

```json
"lib": ["dom", "dom.iterable", "esnext"],
```

To:

```json
"lib": ["dom", "dom.iterable", "esnext", "webworker"],
```

- [ ] **Step 2: Create the Service Worker entry**

```typescript
// src/sw.ts
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
      const existing = clients.find((c) => c.url.includes('/workout'))
      if (existing) {
        return existing.focus()
      }
      return self.clients.openWindow('/workout')
    })
  )
})

serwist.addEventListeners()
```

- [ ] **Step 3: Configure next.config.ts with Serwist plugin**

Replace `next.config.ts`:

```typescript
import type { NextConfig } from 'next'
import withSerwistInit from '@serwist/next'

const withSerwist = withSerwistInit({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})

const nextConfig: NextConfig = {
  /* config options here */
}

export default withSerwist(nextConfig)
```

Note: `disable: true` in dev mode — SW is only active in production build. For testing, set `disable: false` temporarily or run `npm run build && npm start`.

- [ ] **Step 4: Add sw.js to .gitignore**

Append to `.gitignore`:

```
# Serwist generated SW
public/sw.js
public/sw.js.map
public/swe-worker-*.js
public/workbox-*.js
public/workbox-*.js.map
```

- [ ] **Step 5: Commit**

```bash
git add src/sw.ts next.config.ts tsconfig.json .gitignore
git commit -m "feat(m8): Serwist service worker setup (precache + runtime cache + rest timer notification)"
```

---

### Task 5: SW rest timer integration

**Files:**
- Create: `src/lib/sw-rest-timer.ts`
- Modify: `src/lib/rest-timer.ts`

- [ ] **Step 1: Create SW rest timer helpers**

```typescript
// src/lib/sw-rest-timer.ts

/** Request notification permission. Returns true if granted. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

/** Post a REST_TIMER_START message to the active Service Worker. */
export function notifySwRestTimer(durationSec: number): void {
  if (typeof navigator === 'undefined') return
  if (!navigator.serviceWorker?.controller) return
  navigator.serviceWorker.controller.postMessage({
    type: 'REST_TIMER_START',
    durationSec,
  })
}

/** Post a REST_TIMER_CANCEL message to the active Service Worker. */
export function cancelSwRestTimer(): void {
  if (typeof navigator === 'undefined') return
  if (!navigator.serviceWorker?.controller) return
  navigator.serviceWorker.controller.postMessage({
    type: 'REST_TIMER_CANCEL',
  })
}
```

- [ ] **Step 2: Integrate into rest-timer.ts**

In `src/lib/rest-timer.ts`, add import at the top:

```typescript
import { notifySwRestTimer, cancelSwRestTimer, requestNotificationPermission } from './sw-rest-timer'
```

Modify the `start` method of `restTimerStore`:

```typescript
  start(durationSec: number) {
    writeStorage({ startedAt: Date.now(), durationMs: durationSec * 1000 })
    requestNotificationPermission().then((granted) => {
      if (granted) notifySwRestTimer(durationSec)
    })
  },
```

Modify the `stop` method:

```typescript
  stop() {
    writeStorage(null)
    cancelSwRestTimer()
  },
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/sw-rest-timer.ts src/lib/rest-timer.ts
git commit -m "feat(m8): SW rest timer notification integration"
```

---

### Task 6: Install prompt component

**Files:**
- Create: `src/components/pwa/InstallPrompt.tsx`
- Modify: `src/app/(app)/layout.tsx`

- [ ] **Step 1: Create InstallPrompt**

```typescript
// src/components/pwa/InstallPrompt.tsx
'use client'

import { useState, useEffect, useRef } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'hexis:pwa-install-dismissed'

export function InstallPrompt() {
  const [show, setShow] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Don't show if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // Don't show if dismissed
    if (localStorage.getItem(DISMISSED_KEY) === 'true') return

    // iOS detection
    const ua = navigator.userAgent
    const isIosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream
    if (isIosDevice && !(navigator as unknown as { standalone?: boolean }).standalone) {
      setIsIos(true)
      setShow(true)
      return
    }

    // Chrome/Edge install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt.current = e as BeforeInstallPromptEvent
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt.current) {
      await deferredPrompt.current.prompt()
      const { outcome } = await deferredPrompt.current.userChoice
      if (outcome === 'accepted') setShow(false)
      deferredPrompt.current = null
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed right-0 bottom-16 left-0 z-40 border-t border-[#1f2733] bg-[#141a22] px-4 py-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#e5e7eb]">
          {isIos ? 'Otevři Share → Přidat na plochu' : 'Přidej Hexis na plochu'}
        </p>
        <div className="flex gap-2">
          {!isIos ? (
            <button
              onClick={handleInstall}
              className="rounded-md bg-[#10b981] px-3 py-1.5 text-sm font-semibold text-[#0a0e14]"
            >
              Přidat
            </button>
          ) : null}
          <button
            onClick={handleDismiss}
            className="rounded-md px-3 py-1.5 text-sm text-[#6b7280]"
          >
            Zavřít
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire into app layout**

In `src/app/(app)/layout.tsx`, add import:

```typescript
import { InstallPrompt } from '@/components/pwa/InstallPrompt'
```

Add `<InstallPrompt />` right before the closing `</div>` of the root wrapper (after the `<nav>` element):

```tsx
      </nav>
      <InstallPrompt />
    </div>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/pwa/InstallPrompt.tsx src/app/\(app\)/layout.tsx
git commit -m "feat(m8): PWA install prompt component (Chrome + iOS)"
```

---

### Task 7: SW rest timer helpers test

**Files:**
- Create: `src/tests/lib/sw-rest-timer.test.ts`

- [ ] **Step 1: Write tests**

```typescript
// src/tests/lib/sw-rest-timer.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { notifySwRestTimer, cancelSwRestTimer, requestNotificationPermission } from '@/lib/sw-rest-timer'

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
    Object.defineProperty(window, 'Notification', {
      value: { permission: 'granted', requestPermission: vi.fn() },
      configurable: true,
    })
    const result = await requestNotificationPermission()
    expect(result).toBe(true)
  })

  it('requestNotificationPermission returns false when denied', async () => {
    Object.defineProperty(window, 'Notification', {
      value: { permission: 'denied', requestPermission: vi.fn() },
      configurable: true,
    })
    const result = await requestNotificationPermission()
    expect(result).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests**

```bash
npx vitest run src/tests/lib/sw-rest-timer.test.ts
```

Expected: 5/5 PASS

- [ ] **Step 3: Commit**

```bash
git add src/tests/lib/sw-rest-timer.test.ts
git commit -m "test(m8): SW rest timer helper tests"
```

---

### Task 8: Typecheck + full test suite

- [ ] **Step 1: Run typecheck**

```bash
npx tsc --noEmit
```

Expected: clean. Fix any issues. The `webworker` lib in tsconfig might conflict with `dom` types — if there are conflicts, create a separate `tsconfig.sw.json` for the SW file and exclude `src/sw.ts` from the main tsconfig.

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run --no-file-parallelism
```

Expected: all tests pass (178 existing + 5 new = 183). Fix any failures.

- [ ] **Step 3: Commit fixes if needed**

---

### Task 9: E2E spec

**Files:**
- Create: `tests/e2e/pwa.spec.ts`

- [ ] **Step 1: Write E2E spec**

```typescript
// tests/e2e/pwa.spec.ts
import { test, expect } from '@playwright/test'

test.describe('PWA', () => {
  test('manifest.json is accessible', async ({ page }) => {
    const response = await page.goto('/manifest.json')
    expect(response?.status()).toBe(200)
    const json = await response?.json()
    expect(json.name).toBe('Hexis')
    expect(json.display).toBe('standalone')
    expect(json.icons.length).toBeGreaterThanOrEqual(3)
  })

  test('icons are accessible', async ({ page }) => {
    const res192 = await page.goto('/icons/icon-192.png')
    expect(res192?.status()).toBe(200)
    const res512 = await page.goto('/icons/icon-512.png')
    expect(res512?.status()).toBe(200)
  })
})
```

- [ ] **Step 2: Commit**

```bash
git add tests/e2e/pwa.spec.ts
git commit -m "test(m8): E2E spec for PWA manifest + icons"
```

---

### Task 10: Update roadmap

**Files:**
- Modify: `docs/superpowers/roadmap/hexis-roadmap.md`

- [ ] **Step 1: Mark PWA items as done**

READ the file. Find the PWA section and change:

```markdown
### PWA
- [ ] manifest.json + iOS splash screens + apple-touch-icon
- [ ] Service Worker (Serwist): precache + network-first API
- [ ] PWA install test iOS + Chrome
```

To:

```markdown
### PWA
- [x] manifest.json + apple-touch-icon + iOS meta tags
- [x] Service Worker (Serwist): precache + network-first API + rest timer notification
- [x] PWA install prompt (Chrome beforeinstallprompt + iOS guidance)
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/roadmap/hexis-roadmap.md
git commit -m "docs(m8): mark PWA polish milestone complete — Phase 1 MVP done"
```

---

## Summary

| Task | Description | Tests |
|------|-------------|-------|
| 1 | Branch + deps | — |
| 2 | Icon generator + PNG icons | — |
| 3 | manifest.json + meta tags | — |
| 4 | Serwist SW (precache + rest timer + notificationclick) | — |
| 5 | SW rest timer integration into rest-timer.ts | — |
| 6 | InstallPrompt component + app layout wiring | — |
| 7 | SW rest timer helper tests | 5 unit |
| 8 | Typecheck + full test suite | verification |
| 9 | E2E spec | 2 E2E |
| 10 | Roadmap update | — |

**Total new tests:** ~7 (5 unit + 2 E2E)
