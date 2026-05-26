# SP5 PR-3 — Player Bio (identity + journal) — Design

**Status:** spec — awaiting user review
**Date:** 2026-05-07
**Initiative:** SP5 — Missing features (Rewards / Habits / Player Bio / Quest Calendar)
**Slice:** PR-3 of SP5 (Player Bio only). Quest Calendar follows as PR-4.

## 1. Goal

Player Bio zapne sidebar slot `bio` (dnes placeholder v `src/components/shell/area-meta.ts:100`) a otevírá vlastní destinaci `/bio` — read-only "character identity" surface, doplněk k `/stats` (character progress). Hybrid model: **identita** nahoře (vitals + cíl, nově držené na `users`) + **journal** dole (lifetime totals odvozené z existujících tabulek + body photos osa). Edit formulář žije jako nová sub-route `/settings/profile`.

Etymologie produktu (ἕξις — *stable state acquired through practice*) staví identitu hráče do jádra značky. Dosud byla parked: SP2 spec line 56/132 vyhradil sidebar slot, SP3 spec line 396 explicitně odložil "Stats overview content (Muscle Rank radar, Player Bio) — SP4/SP5". SP4 dodalo Muscle Rank, PR-3 zavírá Bio.

## 2. Non-goals (parked, not in this PR)

- Achievements / badges gallery (vlastní slice později)
- Auto-detected milestones (first 100 kg, tier promotions, monthly streaks) — inference logika zvlášť
- Public share / social profile / friends / leaderboards
- Goal historie / audit log (revize cíle = overwrite)
- Onboarding wizard při prvním loginu (jen empty-state CTA)
- Free-text journal entries / bio paragraphs / motto / tagline
- PhotoViewer enhancements (zoom, swipe-between, shareable URLs)
- Photo upload na `/bio` (zůstává v `/progress` per M5)
- Multi-goal (pouze 1 `goalKg` + 1 `goalText`)
- Měření tělesných obvodů (chest/waist/atd.) — pouze `weightKg` z M3 measurements
- Domain-rename `bio` → `character` (kosmetika, žádná hodnota)

## 3. Core decisions (rozcestníky uzavřené v brainstormingu 2026-05-07)

| # | Rozhodnutí | Volba | Důvod |
|---|---|---|---|
| 1 | Bio vůči /stats | **Hybrid identita + journal** | /stats je character progress (XP/tier/muscle rank); /bio musí mít vlastní účel — kdo postava JE + co došla |
| 2 | Identitní pole | **Standard fitness profil** | birthDate + gender + heightCm + goalKg + goalText + startedAt; aktuální váha derivovaná z `measurements` |
| 3 | Edit surface | **Nová sub-route `/settings/profile`** | Konzistentní s pattern: /stats=display, /settings=config; čisté oddělení čtenáře a formu |
| 4 | Journal scope | **Stat block + body photos osa** | Lifetime totals z existujících dat (sessions/sets/lifted/XP) + chronologická osa fotek; žádná inference milníků |
| 5 | Page composition | **Hero → Vitals → Goal → Lifetime → Photos** | Identita nahoře (kdo jsi), čísla a journey dole (co jsi došel) |
| 6 | Photos UX | **Then/Now hero + horizontal scrub** | Při ≥ 2 fotkách velký first↔latest comparison + scrub strip pod tím; tap = fullscreen |
| 7 | Schema umístění | **Extend `users`** | Pole jsou identitní a vždy 1:1; separate `user_profile` table by jen přidalo JOIN bez izolační hodnoty |
| 8 | Dashboard integrace | **Žádná** | SP3 dashboard composition je fixní; StatusWindow už pokrývá identity peek; Bio je destination, ne widget |

## 4. Schema migration

Migrace `0005_sp5_pr3_player_bio.sql` — ALTER TABLE `users` přidává 6 nullable polí:

```ts
// src/db/schema.ts — extended `users`
export const users = mysqlTable('users', {
  // ...existující pole (id, name, email, ...)
  birthDate:  date('birth_date',  { mode: 'string' }),
  gender:     mysqlEnum('gender', ['male', 'female', 'other']),
  heightCm:   smallint('height_cm'),
  goalKg:     decimal('goal_kg',   { precision: 5, scale: 2 }),
  goalText:   varchar('goal_text', { length: 120 }),
  startedAt:  date('started_at',   { mode: 'string' }),
})
```

- **Vše nullable.** Žádný backfill. Existující `demo` user dostane null hodnoty, `/bio` rendruje empty-state CTAs do `/settings/profile`.
- **Žádný FK, žádné nové indexy.** Řádek se čte 1:1 přes `users.id`, který má PK.
- **`birthDate` / `startedAt` mode `'string'`** — konzistentní s vzorem v projektu pro datumy bez TZ (per `feedback`/code patterns memory).
- **App-layer validace bounds:** `heightCm` 50..250, `goalKg` 30.00..300.00, `goalText` ≤ 120 znaků, `birthDate` 1900-01-01..today, `startedAt` ≤ today.
- **Drizzle migration meta-chain** — stejný postup jako 0003/0004.

## 5. `/bio` page composition

`src/app/(app)/bio/page.tsx` — server component. Layout-only logika; všechny resolvers a queries jsou pure/testovatelné moduly.

```
┌────────────────────────────────────────┐
│  IDENTITY HERO                         │  BioHero
│  Avatar + Jméno + Tier · Day N         │
├────────────────────────────────────────┤
│  V I T A L S                           │  RegionHeader + VitalsStrip
│  Height / Born / Gender / Weight       │
├────────────────────────────────────────┤
│  G O A L                               │  RegionHeader + GoalCard
│  goalKg + goalText + progress bar      │
├────────────────────────────────────────┤
│  L I F E T I M E                       │  RegionHeader + LifetimeTotals
│  4-grid: sessions / sets / kg / XP     │
├────────────────────────────────────────┤
│  T R A N S F O R M A T I O N           │  RegionHeader + TransformationStrip
│  Then↔Now hero + horizontal scrub      │
└────────────────────────────────────────┘
```

Region headers reuse existující `RegionHeader` z SP3 (`src/components/dashboard/RegionHeader.tsx` — letter-spaced uppercase `text-[10px] tracking-[0.25em] text-muted`). BioHero region header není potřeba (hero je self-identifying, stejně jako StatusWindow na dashboardu).

## 6. Components

Všechny nové komponenty žijí v `src/components/bio/`. Testy v `src/tests/bio/`.

### 6.1 `BioHero`

Server component, pure presentation.

```ts
type Props = {
  name: string                      // users.name; fallback "Hráč" pokud null
  tier: 1 | 2 | 3 | 4 | 5
  tierName: string
  level: number
  startedAt: string | null          // ISO date string; null skryje "Day N"
}
```

**Layout:** 96 px `<Avatar tier={tier} size={96} />` vlevo, vpravo blok: `name` bold `text-xl`, pod tím `Level {N} · {tierName}` muted `text-xs tracking-[0.2em] uppercase` s tier-color numerálem; vpravo `Day {N}` velký numerál (dny od `startedAt`, hidden když null).

**Rozdíl vůči StatusWindow** (SP3 dashboard hero): žádný XP bar, žádná streak peek. Bio není "current state", je "kdo je tahle postava". Avatar zde je 96 px (ne 140 px) — Bio hero je sekundární surface, dashboard zůstává primary identity peek.

### 6.2 `VitalsStrip`

Server component, pure. 4 sloty v gridu (mobil 2×2, desktop 4×1).

```ts
type Vital = { label: string; value: string; empty: boolean }
type Props = { vitals: [Vital, Vital, Vital, Vital] }   // Height, Born, Gender, Weight
```

**Sloty:**
- **Height** — `{N} cm` nebo `—`
- **Born** — věk z `birthDate` (`{N} let`) nebo `—`
- **Gender** — lokalizovaný (`muž / žena / jiné / —`)
- **Weight** — latest `measurements.weightKg` (`{N.N} kg`) nebo `—` (derivované, ne na users)

Empty slot opacity-60. Pokud aspoň 1 slot je empty, celý strip wrapped `<Link href="/settings/profile">` s muted hint "Doplň profil →" pod stripem.

### 6.3 `GoalCard`

Server component, pure.

```ts
type Props = {
  goalKg: number | null
  goalText: string | null
  currentWeightKg: number | null   // latest measurement
  startedWeightKg: number | null   // first measurement (baseline pro progress bar)
}
```

**Layout (populated):** `goalText` jako titulek `text-base`, pod tím "→ {goalKg} kg" velký numerál `text-2xl`. Progress bar reusing `<ProgressBar>` primitive: pozice počítána přes `goalProgress(start, current, goal)` (viz §7) s clamp [0..1]. Marker label vlevo `{startedWeightKg} kg`, vpravo `{goalKg} kg`, current weight jako fill bod uvnitř.

**Empty (`goalKg === null`):** muted card "Nastav si svůj cíl →" jako `<Link href="/settings/profile">`, žádný progress bar, žádný numeral.

### 6.4 `LifetimeTotals`

Server component, pure. 4-grid (mobil 2×2, desktop 4×1).

```ts
type Props = {
  sessions: number      // count finished sessions lifetime
  sets:     number      // count completed sets lifetime
  liftedKg: number      // SUM(weightKg × reps) přes všechny completed sets
  totalXp:  number
}
```

Každá dlaždice: tier-color numerál `text-2xl font-bold`, label `text-[10px] tracking-[0.2em] uppercase text-muted`. `liftedKg` formátován s mezerou jako tisícovkový oddělovač (`12 480 kg`, locale `cs-CZ`). Žádné empty state — Lvl 1 hráč má `0 / 0 / 0 kg / 0 XP` jako validní render.

Dlaždice nejsou klikací (lifetime totals jsou self-contained datapoints, ne navigace).

### 6.5 `TransformationStrip`

Server component, pure.

```ts
type Photo = {
  id: string
  takenAt: string         // ISO date
  url: string             // presigned URL z M5 helperu
  weightKg: number | null
}
type Props = { photos: Photo[] }   // sorted ASC by takenAt
```

**Stavy:**
- **0 fotek:** muted card "Přidej fotku →" `<Link href="/progress">` (M5 photo upload surface)
- **1 fotka:** "Day 1" hero — single photo `aspect-[3/4]` 60 % šířky, datum + váha pod
- **≥ 2 fotky:** **Then/Now hero** — 2-column grid, vlevo `photos[0]` (first), vpravo `photos[N-1]` (latest), pod každou datum (`cs-CZ`, `dd. M.`) + váha pokud existuje. Pod hero **horizontal scrub strip** všech fotek 64×96 px `aspect-[3/4]`, scrollable `overflow-x-auto`, tap = fullscreen viewer.

**Fullscreen viewer:** plán ověří, jestli M5 vystavila reusable PhotoViewer komponentu. Pokud ne, minimal `<Dialog>` s `<img className="max-h-screen max-w-screen">` + datum overlay. Žádný zoom/swipe (YAGNI pro PR-3).

## 7. Pure helpers + queries

### 7.1 Pure helpers (`src/lib/`)

```ts
// bio-day-count.ts
export function daysSince(startedAt: string | null, today: Date): number | null
// null vstup → null. Inkluzivně: startedAt === today → 1 (Day 1, ne Day 0). Future date → 0.

// bio-age.ts
export function ageFromBirthDate(birthDate: string | null, today: Date): number | null
// Přesný výpočet — den před narozeninami letos = N-1.

// bio-goal-progress.ts
export function goalProgress(
  start: number | null,
  current: number | null,
  goal: number | null,
): number
// Vrací 0..1 clamped. Direction-aware: cíl < start (cutting) i cíl > start (bulking).
// start === null nebo current === null → 0. goal === null → 0.
// goal === current (přesně dosažen) → 1.0.
```

### 7.2 Query helpers

```ts
// src/lib/queries/profile.ts
export async function fetchProfile(db, userId): Promise<UserProfile>
// Vybírá users { name, birthDate, gender, heightCm, goalKg, goalText, startedAt }

// src/lib/queries/measurements.ts (rozšíření existujícího modulu)
export async function fetchLatestMeasurement(db, userId): Promise<Measurement | null>
export async function fetchFirstMeasurement(db, userId): Promise<Measurement | null>
// Pokud první neexistuje, doplnit; jinak reuse.

// src/lib/bio-lifetime.ts
export async function fetchLifetimeTotals(db, userId): Promise<{
  sessions: number; sets: number; liftedKg: number; totalXp: number
}>
// Single round-trip: 4 sub-aggregates (CTE nebo Promise.all, decided v plánu).
// liftedKg: SUM(s.weight_kg * s.reps) FROM sets s
//   JOIN sessions ses ON ses.id = s.session_id
//   WHERE ses.user_id = ? AND ses.finished_at IS NOT NULL AND s.weight_kg IS NOT NULL
// totalXp už máme: getTotalXp(db, userId).

// src/lib/queries/body-photos.ts
export async function fetchAllBodyPhotos(db, userId): Promise<BodyPhoto[]>
// ORDER BY taken_at ASC. Vrací s presigned URLs (reuse M5 helper).
```

## 8. `/settings/profile` edit form

Nová sub-route `src/app/(app)/settings/profile/page.tsx` + `src/app/(app)/settings/profile/actions.ts`.

### 8.1 Form fields

HTML form + server action, žádný client state library — matchuje Rewards/Habits pattern.

| Pole | Input | Validace |
|---|---|---|
| `name` | `<input type="text">` | 1..100 znaků, required |
| `birthDate` | `<input type="date">` | 1900-01-01..today, optional |
| `gender` | `<select>` | enum: male/female/other/none, optional |
| `heightCm` | `<input type="number" step="1">` | 50..250, optional |
| `goalKg` | `<input type="number" step="0.1">` | 30.0..300.0, optional |
| `goalText` | `<input type="text">` | 0..120 znaků, optional |
| `startedAt` | `<input type="date">` | ≤ today, optional. Default na today při prvním uložení pokud user nezadá. |

### 8.2 Server action `updateProfile(formData)`

```ts
'use server'
export async function updateProfile(formData: FormData): Promise<
  { ok: true } | { ok: false; errors: { field: string; message: string }[] }
>
```

1. `requireSessionUser()` → user
2. Parse + validate per pole. Errory akumulované do `{ field, message }[]` (pattern z Rewards `actions.ts`).
3. Empty string → null pro nullable pole.
4. `db.update(users).set({...}).where(eq(users.id, user.id))`
5. `revalidatePath('/bio')` + `revalidatePath('/settings/profile')`
6. Return `{ ok: true }`

### 8.3 Page UI

`<Container size="md">` + `<Stack gap={4}>` se sekcemi: **Identita** (name, birthDate, gender, startedAt), **Tělo** (heightCm), **Cíl** (goalKg, goalText). Submit button vpravo dole. Inline error messages pod inputy. Toast na success (reuse existing toast helper).

### 8.4 Linking ze /settings

`/settings/page.tsx` dostává novou Profile kartu jako první v seznamu (před Export / Macros / Plates):

```tsx
<SettingsCard
  href="/settings/profile"
  title="Profile"
  subtitle="Vitals, cíl, datum startu"
  icon={UserCircle2}
/>
```

Plán ověří aktuální tvar `/settings/page.tsx` a sjednotí pattern (pokud existující karty nepoužívají sdílenou komponentu, plán buď extrahuje, nebo lokálně zařadí — neřeší se v této spec sekci).

## 9. Sidebar promotion

Mechanická změna v `src/components/shell/area-meta.ts`, matchuje PR-1/PR-2 pattern.

```ts
export type Area =
  | 'dashboard' | 'training' | 'progress' | 'nutrition'
  | 'stats' | 'habits' | 'rewards' | 'bio' | 'settings'   // ← +bio

export type PlaceholderArea = 'calendar'                  // ← jen calendar zbývá

AREA_META.bio = {
  label: 'Player Bio',
  href: '/bio',
  icon: UserCircle2,
  matches: (p) => p === '/bio' || p.startsWith('/bio/'),
}

export const SIDEBAR_AREAS = [
  'dashboard', 'training', 'nutrition', 'progress',
  'stats', 'habits', 'rewards', 'bio',                    // ← bio přidán
] as const

export const PLACEHOLDER_ORDER = ['calendar'] as const     // ← bio odebrán
```

PLACEHOLDER_META `bio` entry odebrán; zbývá pouze `calendar`.

**Test updates:**
- `src/tests/shell/Sidebar.test.tsx:31` — pole `['Player Bio', 'Quest Calendar']` → `['Quest Calendar']`
- `tests/e2e/nav.spec.ts` — assertion 2 disabled placeholders → 1, doplnit working `/bio` link assertion

## 10. Empty states

| Sekce | Empty trigger | Render |
|---|---|---|
| BioHero | nemůže nastat | `name` fallback `"Hráč"`. `Day N` skryté když `startedAt === null`. |
| VitalsStrip | aspoň 1 ze 4 polí null | empty sloty `—`, link wrap přes celý strip + muted hint "Doplň profil →" |
| GoalCard | `goalKg === null` | muted card "Nastav si svůj cíl →", žádný progress bar |
| LifetimeTotals | všechna agregace = 0 | render čísel jako `0`/`0 kg` (Lvl 1 hráč má 0, validní identita) |
| TransformationStrip | `photos.length === 0` | empty card "Přidej fotku →" link na `/progress` |

Filozofie: `/bio` nikdy nepošle uživatele "zpátky" wizardem; každý slot říká kam dojít, když chce slot vyplnit. Konzistentní s Rewards/Habits empty patterns.

## 11. Tokens & styling

Žádné nové tokeny. Reuse:
- `RegionHeader` z SP3 (`text-[10px] tracking-[0.25em] uppercase text-muted`)
- `Avatar`, `ProgressBar`, `Container`, `Stack` z DS Part 2
- Tier colors přes `levelToTierMeta`
- Locale `cs-CZ` pro číselné formátování (`12 480 kg`, věk, datumy)

## 12. Slicing preview

Detailní plán produkuje `writing-plans`. Očekávané PR slicing (jeden PR off `main`):

1. Migrace 0005 + schema extension (users +6 polí) + `fetchProfile` query helper
2. Pure helpery: `bio-day-count`, `bio-age`, `bio-goal-progress` (+ unit testy)
3. `LifetimeTotals` query (`bio-lifetime.ts`) + komponenta + testy
4. `TransformationStrip` query (`fetchAllBodyPhotos`) + komponenta + testy
5. `BioHero` + `VitalsStrip` + `GoalCard` komponenty + testy
6. `/bio/page.tsx` integrace + integration test (empty + populated)
7. `/settings/profile` route + form + server action + testy
8. `/settings/page.tsx` Profile karta přidána
9. Sidebar promotion v `area-meta.ts` + `Sidebar.test.tsx` update + nav e2e update
10. E2E `bio.spec.ts` + live smoke

Ships jako jeden PR off `main` per "one PR per slice" branching rule. Cíl ~1200–1500 LOC. Pokud diff přesáhne, split mezi 6/7 (display surface vs edit surface) — display PR mergne první.

## 13. Testing

### 13.1 Unit (pure helpers)

`src/tests/lib/`:
- `bio-day-count.test.ts` — null vstup, dnes (Day 1), včera (Day 2), 365 dní, leap year, future date (clamp na 0)
- `bio-age.test.ts` — null, dnes - 25 let (přesný birthday → 25), den před birthday letos (24), leap-day birthday
- `bio-goal-progress.test.ts` — start=80/current=78/goal=70 → 0.2; goal dosažen → 1.0; cíl nahoru (bulking, start<goal); current null → 0; clamp 0..1

Date-dependent testy používají `vi.setSystemTime` (per `project_sp5_code_patterns` memory).

### 13.2 Component

`src/tests/bio/`:
- `BioHero.test.tsx` — name fallback "Hráč" když null; hides "Day N" když startedAt null; tier color applied
- `VitalsStrip.test.tsx` — 4 sloty, empty `—`, link wrap když ≥ 1 empty; populated full
- `GoalCard.test.tsx` — empty state když goalKg null; progress bar fill mezi start/current/goal; goal-up direction (bulking)
- `LifetimeTotals.test.tsx` — formátování `12 480 kg` (cs-CZ); render zero counts jako `0`
- `TransformationStrip.test.tsx` — 0 fotek (CTA empty), 1 fotka ("Day 1" hero), 2+ fotek (Then/Now hero + scrub strip), tap fullscreen open

### 13.3 Integration

`src/tests/bio/page.test.tsx`:
- Empty user (žádný profil, žádné session/photos): renders všech 5 sekcí s empty states
- Populated user (full profil + 1 session + 2 photos): renders všechny sekce s daty, Then/Now hero visible
- Auth-mock + DB migration testovací pattern per `project_sp5_code_patterns`

### 13.4 Settings/profile

- `src/tests/settings/profile-form.test.tsx` — form fields rendered, validation chyby pod inputy
- `src/tests/settings/profile-actions.test.ts` — happy path; bounds (heightCm < 50, goalKg > 300, goalText > 120, birthDate před 1900); null-empty-string normalize; revalidatePath called

### 13.5 E2E

- `tests/e2e/bio.spec.ts` (nový) — login → /bio renders → sidebar Bio aktivní → klik na vitals strip → /settings/profile → vyplnit form → submit → toast → zpět na /bio s daty
- `tests/e2e/nav.spec.ts` (existující) — placeholders 2 → 1, working /bio link

### 13.6 Live browser smoke (před merge)

- Demo user (null profil) → /bio empty CTAs OK
- Vyplnit profil → /bio populated render OK
- Mobil 360 px (vitals 2×2, lifetime 2×2, photos scrub overflow-x funguje)
- Desktop 1280 px (vitals 4×1, lifetime 4×1, Then/Now hero side-by-side)
- Hover state na vitals strip + photos strip

## 14. Acceptance

- Všechny testy zelené, nula regresí
- Lint + typecheck clean
- §11.2 nested-import guard zero matches
- Live smoke: mobil + desktop, empty + populated user
- Migrace 0005 bezpečně aplikovatelná (nullable columns, žádný backfill required)
- Sidebar `Player Bio` aktivní s ikonou `UserCircle2`, `Quest Calendar` zůstává placeholder
- PR diff ≤ 1500 LOC nebo split mezi 6/7

## 15. Known risks

- **Lifetime kg lifted query cost.** `SUM(weightKg × reps)` přes všechny lifetime sets může být drahé pro power user (10k+ sets). Mitigation: query je pre-aggregated v jediném round-tripu, `sessions.user_id` + indexy přes `sets.session_id` existují. Pokud > 200 ms na demo dataset, plán přidá materialized view nebo cached aggregate (deferred).
- **PhotoViewer reuse.** Plán ověří jestli M5 vystavila reusable fullscreen photo viewer. Pokud ne, slice obsahuje minimální `<Dialog>` s `<img>` (žádný zoom/swipe — YAGNI pro PR-3).
- **Goal direction.** Cutting i bulking jsou validní; `goalProgress` musí podporovat oba směry přes znaménko `goal - start`. Pokrýt unit testem.
- **Day N calculation.** `startedAt === today` zobrazí `Day 1` (inkluzivně, fitness-app native). Pure helper to fixuje.
- **Empty `name`.** `users.name` je nullable. Fallback `"Hráč"` v BioHero — žádný redirect na settings.
- **Demo seed.** Demo user v `seed.ts` dostane null profil → `/bio` empty CTAs render. Volitelně doplnit demo profil v seed pro screenshoty (decided v plánu).
- **`/settings/page.tsx` shape.** Plán ověří, jestli existující karty (Export / Macros / Plates) používají sdílenou komponentu nebo ad-hoc markup; sjednotí Profile vstup s tím patternem.

## 16. Dependencies / prerequisites

- SP1 Part 2 + SP2 + SP3 + SP4 + SP5 PR-1 + SP5 PR-2 merged (vše done před 2026-05-07)
- Existující queries a libs: `getTotalXp`, `xpToLevel`, `levelToTierMeta`, `requireSessionUser`, `revalidatePath`, M5 body photos schema + presigned-URL helper, M3 measurements queries
- Existující komponenty: `Avatar`, `ProgressBar`, `Container`, `Stack`, `RegionHeader`, `SettingsCard` (pokud existuje — jinak inline pattern)
- Žádné nové dependencies, žádné env vars, žádné API změny

## 17. Next step

Po review této spec a schválení uživatelem → `writing-plans` skill produkuje commit-by-commit implementation plán dle §12 slicing.
