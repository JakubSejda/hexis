# M8 — PWA Polish Design Spec

**Status:** Approved
**Date:** 2026-04-16
**Branch:** `m8-pwa-polish`
**Depends on:** M0 (Next.js setup), M2 (rest-timer.ts)

## 1. Cíl

Udělat z Hexis plnohodnotnou PWA — instalovatelnou na home screen, s precache app shellu, runtime cache pro API, a rest timer notifikací přes Service Worker.

## 2. Scope

| Feature | Popis |
|---------|-------|
| manifest.json | App metadata, ikony, standalone display |
| iOS meta tags | apple-touch-icon, web-app-capable, status-bar |
| Service Worker | Serwist: precache static, network-first API, cache-first photos |
| Rest timer notification | SW postMessage → setTimeout → showNotification |
| Install prompt | Custom banner "Přidat na plochu" |

## 3. Web App Manifest

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

Umístění: `public/manifest.json`

## 4. Ikony

Placeholder ikony pro MVP — zelený hexagon (#10b981) na tmavém pozadí (#0A0E14).

| Soubor | Rozměr | Účel |
|--------|--------|------|
| `public/icons/icon-192.png` | 192×192 | Manifest icon |
| `public/icons/icon-512.png` | 512×512 | Manifest icon, splash |
| `public/icons/icon-maskable-512.png` | 512×512 | Maskable (safe zone padding) |
| `public/icons/apple-touch-icon.png` | 180×180 | iOS home screen |

Generování: jednorázový script `scripts/generate-icons.ts` pomocí sharp (SVG → PNG resize). Spustit jednou, commitnout výsledné PNG.

## 5. iOS Meta Tags

V `src/app/layout.tsx` do `<head>`:

```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Hexis" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
```

## 6. Service Worker (Serwist)

### 6.1 Setup

`@serwist/next` plugin v `next.config.ts` — automaticky generuje a registruje SW.

### 6.2 Cache strategie

| Pattern | Strategie | TTL |
|---------|-----------|-----|
| `/_next/static/**` | Precache (build time) | Immutable |
| `/icons/**` | Precache | Immutable |
| `/api/photos/*/thumb` | CacheFirst | 24h |
| `/api/**` | NetworkFirst | 5s timeout, fallback cache |
| Navigace | NetworkFirst | 3s timeout |

### 6.3 SW soubor

`src/sw.ts` — custom Serwist SW entry point:

```typescript
import { defaultCache } from '@serwist/next/worker'
import { Serwist } from 'serwist'

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: defaultCache,
})

// Rest timer listener
self.addEventListener('message', (event) => { ... })

serwist.addEventListeners()
```

## 7. Rest Timer Notification

### 7.1 Flow

1. **Start:** Hlavní vlákno volá `navigator.serviceWorker.controller.postMessage({ type: 'REST_TIMER_START', durationSec: 90 })`
2. **SW:** `setTimeout(() => self.registration.showNotification(...), durationSec * 1000)`
3. **Cancel:** `postMessage({ type: 'REST_TIMER_CANCEL' })` → SW `clearTimeout`
4. **Notification tap:** `notificationclick` event → `clients.openWindow` nebo `client.focus()`

### 7.2 Notification

```
Title: "Hexis — Rest Timer"
Body: "Čas na další sérii!"
Icon: /icons/icon-192.png
Tag: "rest-timer" (replaces previous)
RequireInteraction: false
Silent: false
```

### 7.3 Permission

Při prvním startu rest timeru → `Notification.requestPermission()`. Pokud denied → timer funguje normálně (vizuální + audio v tabu), jen bez SW notifikace.

### 7.4 Integrace s rest-timer.ts

Modify `src/lib/rest-timer.ts`:
- Po `start()` → volat `notifySwRestTimer(durationSec)`
- Po `stop()`/reset → volat `cancelSwRestTimer()`
- Helper funkce v `src/lib/sw-rest-timer.ts`

## 8. Install Prompt

### 8.1 `beforeinstallprompt` event

Chrome/Edge emitují `beforeinstallprompt` event. Zachytit, uložit, zobrazit custom banner.

### 8.2 InstallPrompt komponenta

```
┌──────────────────────────────────────┐
│ 📱 Přidej Hexis na plochu            │
│ [Přidat]                    [Zavřít] │
└──────────────────────────────────────┘
```

- Fixed bottom banner (nad tab bar)
- Dismiss → `localStorage.set('pwa-install-dismissed', 'true')` → neukázat znovu
- Tap "Přidat" → `prompt()` na uloženém `beforeinstallprompt` eventu
- iOS: detekce `navigator.standalone === false` + iOS → text "Otevři Share → Přidat na plochu"

### 8.3 Umístění

Renderuje se v `src/app/(app)/layout.tsx`, jen pokud:
- App není v standalone mode
- User ještě nezavřel banner
- Na iOS: `navigator.standalone !== true`

## 9. Nové závislosti

```json
{
  "@serwist/next": "^9",
  "serwist": "^9"
}
```

## 10. Nové soubory

```
public/manifest.json
public/icons/icon-192.png
public/icons/icon-512.png
public/icons/icon-maskable-512.png
public/icons/apple-touch-icon.png
scripts/generate-icons.ts              — jednorázový icon generator
src/sw.ts                              — custom SW entry (Serwist + rest timer listener)
src/lib/sw-rest-timer.ts               — postMessage helpers
src/components/pwa/InstallPrompt.tsx   — install banner
```

## 11. Modifikace existujících souborů

- `next.config.ts` — přidat Serwist plugin
- `src/app/layout.tsx` — manifest link, iOS meta tags, theme-color
- `src/app/(app)/layout.tsx` — přidat InstallPrompt
- `src/lib/rest-timer.ts` — volat SW notification helpers v start/stop
- `tsconfig.json` — přidat `"WebWorker"` do lib (pro SW types)

## 12. Testování

### Unit testy
- `sw-rest-timer.ts` — postMessage mock, permission check

### Integration
- Manifest accessible at `/manifest.json`
- SW registers successfully

### Manual QA (nelze automatizovat)
- iOS Safari: Add to Home Screen → standalone mode
- Chrome: Install prompt → PWA window
- Rest timer: start → switch tab → notification arrives
- Offline: app shell loads, API shows cached data

## 13. Neřešit v M8

- Offline-first data sync (Dexie.js — Fáze 2)
- Background sync pro queued mutations
- Push notification subscription (server-side)
- iOS splash screens per device (příliš device-specific)
- Periodic background fetch
