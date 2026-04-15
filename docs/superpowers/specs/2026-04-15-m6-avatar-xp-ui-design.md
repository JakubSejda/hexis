# M6 — Avatar + XP UI

> Design spec pro milestone 6. Scope: avatar komponenta, dashboard hero, `/avatar` profil stránka, levelup/tierup feedback, rozšíření XP API responses.

## 1. Tier systém

### 1.1 Definice

```typescript
// src/lib/tiers.ts
export type Tier = 1 | 2 | 3 | 4 | 5

export const TIERS = [
  { tier: 1, name: 'Rookie',     levelMin: 1,  levelMax: 5,   color: '#b45309', accent: '#92400e' },
  { tier: 2, name: 'Apprentice', levelMin: 6,  levelMax: 15,  color: '#64748b', accent: '#475569' },
  { tier: 3, name: 'Warrior',    levelMin: 16, levelMax: 30,  color: '#ca8a04', accent: '#a16207' },
  { tier: 4, name: 'Beast',      levelMin: 31, levelMax: 50,  color: '#10b981', accent: '#065f46' },
  { tier: 5, name: 'Titan',      levelMin: 51, levelMax: 999, color: '#0ea5e9', accent: '#0c4a6e' },
] as const
```

### 1.2 Pure funkce

- `levelToTier(level: number): Tier`
- `levelToTierMeta(level: number): TierMeta`
- `nextTierMeta(level: number): TierMeta | null` — vrací null pro Tier 5
- `xpToProgress(totalXp: number, currentLevel: number): { current, max, percent }` — pozice v rámci aktuálního levelu

### 1.3 xp.ts extension

`awardXp` / `reverseXp` rozšířit návratovou hodnotu o tier info:

```typescript
{
  xpDelta: number
  newTotalXp: number
  levelBefore: number
  levelAfter: number
  levelUp: boolean
  tierBefore: Tier
  tierAfter: Tier
  tierUp: boolean
}
```

## 2. Avatar komponenta + SVG

### 2.1 Placeholder SVG assety

5 souborů v `public/avatars/tier-{1-5}.svg`. Každý 56×56 viewBox: outer ring + inner disc + římská číslice (I-V) v centru. Barvy z TIERS (color outer, accent inner ring).

### 2.2 Komponenty

```typescript
// src/components/avatar/Avatar.tsx
<Avatar tier={Tier} size={number} className? ringPulse? />

// src/components/avatar/AvatarWithLevel.tsx
<AvatarWithLevel tier={Tier} level={number} size={number} />  // avatar + L{level} badge v rohu

// src/components/avatar/TierBadge.tsx
<TierBadge tier={Tier} label?={string} size?={number} />       // samostatná ikona pro ladder
```

Renderuje `<img src="/avatars/tier-{tier}.svg">`. `ringPulse` aktivuje Tailwind keyframe animaci (zlatý glow + pulse).

### 2.3 globals.css

Přidat keyframe `@keyframes tier-glow` pro pulsující zlatý ring.

## 3. Dashboard Hero

Nahradit existující `Ahoj, {name} | L{level} {xp}/{max}` blok v `dashboard/page.tsx` centrovanou hero kartou:

- Datum + "Ahoj, {name}"
- Avatar 80px centrovaný (klikatelný → `/avatar`)
- "Level {n} · {tierName}"
- Progress bar (využije `ProgressBar` z M3)
- "{currentXp} XP" + "{toNext} do L{n+1}"

### 3.1 Komponenta

```typescript
// src/components/dashboard/AvatarHero.tsx
<AvatarHero level={number} totalXp={number} userName={string | null} userEmail={string} />
```

Server component. Tier + progress počítané přes `levelToTierMeta` + `xpToProgress`.

## 4. `/avatar` Profil stránka

### 4.1 Sekce v pořadí

1. **Hero** — 160px avatar + level + tier název + progress bar (sdílená logika s `AvatarHero`, jen `size` variace)
2. **TierLadder** — 5 ikon vedle sebe. Current zvýrazněný ringem. Ostatní muted s threshold "L{min}" pod ikonou. Tap na ikonu → tooltip se jménem + level range (bez popisu).
3. **NextTierPreview** — dim verze dalšího tieru, "Odemkneš v Level {n}" + "Zbývá {xp} XP". Skryté pro Tier 5.
4. **XpHistoryChart** — SVG vertical bar chart. 30 sloupců (posledních 30 dní). Výška sloupce = XP/den, barva = dominant event_type v ten den. Celkem XP label pod grafem.
5. **XpBreakdown** — tabulka řádek per `event_type` za posledních 30 dní. Sloupce: label | count | XP total | % z celku. Sort by XP descending.

### 4.2 Data

Server component fetchne:
- `getTotalXp(db, userId)`
- `fetchXpHistory(db, userId, 30)` → `{ daily: [{ date, totalXp, byEvent: Record<event_type, xp> }], total, byEventTotal: Record<event_type, { xp, count }> }`

### 4.3 Soubory

- `src/app/(app)/avatar/page.tsx`
- `src/components/avatar/TierLadder.tsx`
- `src/components/avatar/NextTierPreview.tsx`
- `src/components/avatar/XpHistoryChart.tsx`
- `src/components/avatar/XpBreakdown.tsx`
- `src/lib/queries/xp-history.ts`

## 5. Levelup / Tierup Feedback

### 5.1 Dvě úrovně feedbacku

**Level-up uvnitř tieru (`levelUp && !tierUp`):**
- Toast vpravo dole, 4s, background `TIERS[currentTier].color`
- "Level Up! L{before} → L{after}" (v češtině: "Nová úroveň! L{before} → L{after}")
- Mini avatar + ring-pulse animace

**Tier-up (`tierUp`):**
- Full-screen modal overlay (black 60% alpha)
- Velký avatar 120px nového tieru uprostřed s ring-glow animací
- Headline: "Tier {n}: {tierName} odemknutý!"
- Subtext: "Dosáhl jsi Level {levelAfter}"
- CSS-particle konfety (~30 řádků custom implementation, emerald + accent colors)
- Web Audio API ding (sine 880Hz, 300ms fade-out) pro level-up; ascending arpeggio (C5-E5-G5) pro tier-up
- Dismiss na tap anywhere nebo Enter/Escape

### 5.2 Client flow

1. API response má `{ ..., xpDelta, levelUp, tierUp, levelAfter, tierAfter }`
2. Client code po úspěšné mutaci volá `notifyXp(response)` z kontextu
3. `XpFeedbackProvider` zařadí do queue, zobrazí toast/modal sekvenčně

### 5.3 Soubory

- `src/lib/xp-audio.ts` — `playLevelUpDing()`, `playTierUpFanfare()` (Web Audio API)
- `src/components/xp/XpFeedbackProvider.tsx` — React context + queue
- `src/components/xp/LevelUpToast.tsx`
- `src/components/xp/TierUpModal.tsx` (confetti particles uvnitř)
- Wire do `src/app/(app)/layout.tsx` (wrap children)

## 6. API změny

### 6.1 Rozšířit existující responses

Všechny endpointy s `awardXp` vrátí kompletní XP payload:

- `POST /api/sessions/[id]/sets`
- `POST /api/sessions` (pokud awardne)
- `PATCH /api/sessions/[id]` (session finish)
- `PUT /api/measurements`
- `PUT /api/nutrition`
- Analogicky `DELETE` endpointy s `reverseXp`

Nový shape:
```typescript
{
  // ...existing fields,
  xpDelta: number
  levelUp: boolean
  tierUp: boolean
  levelAfter: number
  tierAfter: Tier
}
```

### 6.2 Nový endpoint

`GET /api/me/xp-history?days=30`

Response:
```typescript
{
  daily: Array<{ date: string, totalXp: number, byEvent: Record<XpEventType, number> }>
  total: number
  byEventTotal: Record<XpEventType, { xp: number, count: number }>
}
```

SQL: `SELECT DATE(created_at), event_type, SUM(xp_delta) sum, COUNT(*) cnt FROM xp_events WHERE user_id=? AND created_at >= ? GROUP BY DATE(created_at), event_type`. Parametry: max 365 dní.

## 7. Testování

### 7.1 Unit

- `tiers.test.ts` — levelToTier, nextTierMeta, xpToProgress. Boundary cases: L1, L5, L6 (Rookie→Apprentice), L15/L16, L30/L31, L50/L51, L999
- `xp.test.ts` extend — tierUp flag true jen na tier boundary, nikdy uvnitř tieru; negative tierUp při reverseXp přes boundary
- `xp-audio.test.ts` — smoke test že `playLevelUpDing` je callable (Web Audio mock)

### 7.2 Integration

- `xp-history.test.ts` — seedne 30 dní eventů napříč typy, ověří aggregaci per day + per event_type, total součet, count správný

### 7.3 E2E

- `avatar-flow.spec.ts` — login → dashboard hero viditelný → klik avatar → /avatar stránka → tier ladder 5 ikon → next tier preview text ok → xp history chart renders

## 8. Komponenty — souhrn

### 8.1 Nové

- `src/lib/tiers.ts`
- `src/lib/xp-audio.ts`
- `src/lib/queries/xp-history.ts`
- `src/components/avatar/Avatar.tsx`
- `src/components/avatar/AvatarWithLevel.tsx`
- `src/components/avatar/TierBadge.tsx`
- `src/components/avatar/TierLadder.tsx`
- `src/components/avatar/NextTierPreview.tsx`
- `src/components/avatar/XpHistoryChart.tsx`
- `src/components/avatar/XpBreakdown.tsx`
- `src/components/dashboard/AvatarHero.tsx`
- `src/components/xp/XpFeedbackProvider.tsx`
- `src/components/xp/LevelUpToast.tsx`
- `src/components/xp/TierUpModal.tsx`
- `src/app/(app)/avatar/page.tsx`
- `src/app/api/me/xp-history/route.ts`
- `public/avatars/tier-{1-5}.svg`

### 8.2 Modifikované

- `src/lib/xp.ts` — rozšířit return s tier info
- `src/app/globals.css` — tier-glow keyframe
- `src/app/(app)/layout.tsx` — wrap children XpFeedbackProvider
- `src/app/(app)/dashboard/page.tsx` — nahradit header blok AvatarHero
- 5 API routes — rozšířit response shape

### 8.3 Navigace k `/avatar`

Bez dedikovaného tab bar slotu. Přístup přes klik na avatar v dashboard hero. Šetří místo v 4-tabu navigaci.

## 9. Závislosti

Žádné nové npm deps. Vše postavené na:
- Existující `ProgressBar`, `Sparkline`, `Toast` primitivech
- Web Audio API (nativní)
- CSS keyframes (nativní)
- Custom SVG (konzistentní s M3)
