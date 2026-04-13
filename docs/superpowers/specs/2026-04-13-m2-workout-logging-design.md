# M2 — Core Workout Logging — Design Spec

**Status:** Draft for review
**Date:** 2026-04-13
**Author:** Jakub Sejda (s JARVIS)
**Phase:** 1 — single-user MVP, local dev only
**Depends on:** M0 Foundation (merged), M1 Auth (branch `m1-auth`)

## 1. Cíl

M2 dodává jádro denního flow: vybrat plán → zaznamenat sérii po sérii → dokončit trénink → vrátit se k historii a opravit co je špatně. Sekce 4.1, 4.2 a 5.3 hlavního MVP specu (`docs/superpowers/specs/2026-04-13-hexis-pwa-design.md`) jsou zdrojem pravdy pro doménu; M2 je implementační rozsah, nikoli re-design.

**Hlavní akceptační kritéria:**
- Jakub zvládne zalogovat reálný trénink v gymu bez friction.
- Double progression pracuje správně — první session po hit rep_max v celém cviku navrhne +2.5 kg (barbell) / +1 kg (DB) s resetem na rep_min.
- Ztracené tréninky se dají opravit zpětně (edit/delete/ad-hoc append).
- Žádná session nezůstane viset déle než 12 h nezavřená.
- XP se správně kumuluje i při retroaktivních změnách (append-only ledger).

## 2. Scope

### 2.1 V M2

- Dashboard minimal — level, streak, CTA "Pokračovat v X" nebo "Začít X" (bez grafů, bez avatara).
- `/workout` plán picker + resume banner + historie posledních tréninků.
- `/workout/[id]` active workout stepper (jeden cvik na obrazovce, swipe/tap mezi cviky).
- Per-set double progression suggestion (`src/lib/progression.ts`).
- Rest timer s localStorage persistencí a Screen Wake Lock API.
- Plate calculator + user-configurable plate inventory (`/settings/plates`).
- Edit / delete setů kdekoli (aktivní i dokončená session) s XP reversal přes append-only ledger.
- Skip cviku + add ad-hoc cvik během session.
- 12h lazy auto-finish nezavřených sessions.
- XP events (`set_logged`, `session_complete`, `pr_achieved`) — server-side, bez UI.
- Historie dokončených sessions (list + detail view, read-only / edit toggle).

### 2.2 Explicitně mimo M2

- Grafy / progress view → M4 Smart coach
- Avatar + XP UI → M6 Avatar + XP
- Stagnation detection flag → M4
- Export dat → M4
- Service Worker notifikace pro timer → M8 PWA
- Offline queue → Fáze 2
- Muscle heatmap v workoutu → M7
- Měření / výživa / fotky → M3 / M5

## 3. UX rozhodnutí (brainstorming výstup)

| Rozhodnutí | Volba | Důsledek |
|---|---|---|
| Active-workout layout | **One-exercise stepper** | Full-screen cvik, swipe/tap mezi cviky. Velké tap targety, full-screen rest timer. |
| Dashboard / workout entry | **`/workout` = plán picker** | Dashboard zůstane minimální (level + streak + CTA); reálná entry do tréninku je `/workout`. |
| Client sync model | **Strict server-confirmed** | Žádný optimistic UI. Tap ✓ → spinner → server → UI update. |
| Active session rule | **Max 1 + 12h auto-finish** | Lazy check při `GET /api/workout/active` a `POST /api/sessions`. |
| Editace setů | **Kdekoli (aktivní i dokončená)** | XP reversal při změně/smazání přes append-only ledger. |
| Skip / ad-hoc | **Povolené v aktivní session** | Skip = cvik v DB prostě chybí. Ad-hoc = session_sets bez plan_exercises reference. |
| Suggestion engine trigger | **Per-set přepočet** | Po každém ✓ engine re-evaluates návrh pro další sérii. |
| Plate calculator config | **User-configurable** | Nová tabulka `plate_inventories`, CRUD v `/settings/plates`. |
| Rest timer architektura | **localStorage + Wake Lock API** | Survives tab switch + refresh. SW notifikace čeká M8. |
| Plate inventory storage | **Nová tabulka** | Čisté schema, ready pro Fázi 2 multi-gym. |

## 4. Route mapa

```
/                             → redirect /dashboard (authed) | /login
(app)
├─ /dashboard                 UPGRADE — level, streak, dnes CTA (M1 má stub, M2 přepíše)
├─ /workout                   NEW  — plán picker + resume banner + poslední tréninky
├─ /workout/[sessionId]       NEW  — stepper (running / finished / edit mode podle stavu + ?edit=1)
└─ /settings
   ├─ /settings/plates        NEW  — bar + inventář talířů CRUD
   └─ /settings/account             (M1 stub)

Bottom tab (mobile, M2): Dashboard · Trénink · Nastavení
```

### URL state v stepperu

`/workout/[id]?ex=<exerciseId>&set=<index>` — refresh / back tě vrátí na přesné místo. `exerciseId` = int z `exercises.id` (schema nemá slug column na exercises).
`/workout/[id]?edit=1` — edit mode na dokončené session.

## 5. Datový model — delta

### 5.1 Nová tabulka

```typescript
// src/db/schema.ts — addition
export const plateInventories = mysqlTable('plate_inventories', {
  userId: varchar('user_id', { length: 26 }).primaryKey(),
  barKg: decimal('bar_kg', { precision: 4, scale: 1 }).default('20').notNull(),
  plates: json('plates').$type<{ weightKg: number; pairs: number }[]>().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
})
```

### 5.2 Nový index

```typescript
// sessions index pro lazy auto-finish + active lookup
index('idx_user_finished').on(sessions.userId, sessions.finishedAt)
```

### 5.3 Beze změny (existuje od M0)

`sessions`, `session_sets`, `exercises`, `exercise_muscle_groups`, `plans`, `plan_exercises`, `xp_events`, `users`, `accounts`.

### 5.4 Migrace

`src/db/migrations/0002_m2_plate_inventory.sql`:

- `CREATE TABLE plate_inventories ...`
- `CREATE INDEX idx_user_finished ON sessions(user_id, finished_at)`

### 5.5 Seed delta

`src/db/bootstrap.ts` rozšířit o `seedPlateInventory(db, userId)` s IPF default:

```typescript
{
  barKg: 20,
  plates: [
    { weightKg: 25, pairs: 2 },
    { weightKg: 20, pairs: 2 },
    { weightKg: 15, pairs: 2 },
    { weightKg: 10, pairs: 2 },
    { weightKg: 5, pairs: 2 },
    { weightKg: 2.5, pairs: 2 },
    { weightKg: 1.25, pairs: 2 },
  ]
}
```

Pro už bootstrapovaného usera (M1 před M2 merge) — idempotentní lazy upsert při prvním `GET /api/plates`.

## 6. API surface

### 6.1 Sessions

```
POST   /api/sessions                 body: { planId?: number }
GET    /api/sessions?limit&cursor    list historie
GET    /api/sessions/[id]            detail vč. exercises + sets
PATCH  /api/sessions/[id]            body: { finishedAt?: boolean, note?: string }
DELETE /api/sessions/[id]            cascade sets + append XP reversal

POST   /api/sessions/[id]/sets       body: { exerciseId, setIndex, weightKg, reps, rpe? }
```

### 6.2 Sets

```
PATCH  /api/sets/[id]                body: { weightKg?, reps?, rpe? }
DELETE /api/sets/[id]                DELETE + append XP reversal
```

### 6.3 Active workout + plates + exercises

```
GET    /api/workout/active           lazy auto-finish + vrátí active session info nebo null
GET    /api/plates                   vrátí inventory (lazy seed pokud chybí)
PUT    /api/plates                   replace celý inventory
GET    /api/exercises?q=&includeCatalog=true    pro ExercisePicker
```

### 6.4 Response shape — klíčové

```typescript
// GET /api/sessions/[id]
{
  id: number
  planId: number | null
  planSlug: string | null
  planName: string | null
  startedAt: string          // ISO
  finishedAt: string | null
  note: string | null
  exercises: Array<{
    exerciseId: number
    name: string
    order: number
    targetSets: number
    repMin: number
    repMax: number
    restSec: number
    sets: Array<{
      id: number
      setIndex: number
      weightKg: string | null   // decimal as string (Drizzle)
      reps: number | null
      rpe: number | null
      completedAt: string
    }>
  }>
}

// POST /api/sessions/[id]/sets response
{
  id: number
  completedAt: string
  xpDelta: number             // +5 base + 50 pokud PR
  newTotalXp: number
  levelUp: boolean
  nextSuggestion: { weightKg: number; reps: number; reason: string } | null
}
```

### 6.5 Data integrity rules

- **Ownership všude** — každý endpoint joinuje `sessions.userId = session.user.id`. Helper `requireOwnership` z M1.
- **Max 1 active session** — SELECT `WHERE userId=? AND finishedAt IS NULL LIMIT 1` před POST /api/sessions; 409 pokud existuje.
- **Append-only XP ledger** — zero UPDATE / DELETE na `xp_events`. Reversal = nový event s opačným `xpDelta` a stejným `sessionId`. Total XP = `SUM(xpDelta)`.
- **Lazy auto-finish** — `checkAndFinishStaleSessions(userId, db)` volán v GET /api/workout/active, POST /api/sessions, a dashboard SSR fetch. Idempotentní.
- **PR detekce** — při POST /api/sets porovnej `estimate1RM(weightKg, reps)` s `MAX(estimate1RM(prior sets exerciseId))`. Pokud vyšší → append `pr_achieved` event +50 s `meta = { exerciseId, estimated1RM }`.
- **Edit setu v dokončené session** — PATCH /api/sets/[id] nemění `set_logged` XP (flat +5 neparametrický). Mění ale PR rekalkulaci: pokud edit vynuluje PR (reps=0 nebo weightKg drop), append reversal `pr_achieved` -50.

## 7. Komponentní architektura

### 7.1 Domain — `src/components/workout/`

- `PlanPicker.tsx` — list plánů (4) + "+ Ad-hoc" card + "doporučeno" pill podle rotace.
- `ResumeBanner.tsx` — sticky banner, render jen pokud active session.
- `SessionHistoryList.tsx` — posledních N sessions (3 na dashboard, 20+ cursor na /workout).
- `ExerciseStepper.tsx` — routing container, current exercise index + URL sync.
- `ExerciseCard.tsx` — jeden cvik: název, historie ("Minule: 60×8, 8, 7"), návrh, set inputy, log.
- `SetInput.tsx` — weight / reps / rpe + ✓ button, strict server-confirmed s per-set spinner.
- `SetRow.tsx` — už zalogovaný set, tap = EditSetSheet.
- `SuggestionHint.tsx` — "Návrh: 62.5 × 8" + důvod (double progression / down-target / žádná historie).
- `RestTimer.tsx` — countdown, localStorage persistence, Screen Wake Lock API, audio beep.
- `StepperNav.tsx` — ‹ prev · [●●●○○○] · next ›.
- `AdHocAddButton.tsx` — otevře ExercisePicker modal.
- `SessionSummary.tsx` — finish screen: total volume, time, note input, finish CTA.
- `SessionDetailView.tsx` — read-only / edit toggle na dokončené session.
- `PlateCalculatorSheet.tsx` — modal: zadej kg, ukáž talíře per stranu + bar.
- `EditSetSheet.tsx` — bottom sheet edit / delete jednoho setu.
- `ExercisePicker.tsx` — search / list katalogu exercises (katalog + custom).

### 7.2 UI primitivy — `src/components/ui/` (nové v M2)

- `BottomSheet.tsx` — Radix Dialog + swipe-to-dismiss wrapper.
- `LongPress.tsx` — `useLongPress(onLongPress, ms=500)` hook.
- `NumberInput.tsx` — tap-target optimized input s +/- stepper buttony.
- `Toast.tsx` — globální toast queue (success / error).

### 7.3 Business logic — `src/lib/`

- `progression.ts` — `suggestNextSet({ history, planExercise, currentSessionSets })` — double progression + per-set re-eval.
- `1rm.ts` — `estimate1RM(weight, reps)` — Epley + Brzycki average.
- `plates.ts` — `calculatePlates({ targetKg, bar, inventory })` — greedy fill.
- `xp.ts` — `awardXp({ event, meta, db, userId, sessionId? })` → insert + return `{ xpDelta, newTotal, levelUp }`.
- `xp-events.ts` — event → delta mapping (single source of truth).
- `session-auto-finish.ts` — `checkAndFinishStaleSessions(userId, db)`.
- `rest-timer.ts` — localStorage helpers `{startedAt, duration}` + wake lock.

### 7.4 State management

- **Server state** — Server Components + Route Handlers. Žádný SWR / React Query.
- **Client state** — lokální `useState` v stepperu (current exercise idx, focused set, timer running flag).
- **Rest timer** — `useSyncExternalStore` s localStorage subscription.
- **Revalidace po mutacích** — po POST/PATCH/DELETE volá `router.refresh()` (Next 16 App Router) nebo mutace vrátí nový state který se mergene do lokálního modelu.

## 8. Auto-finish algoritmus

```typescript
// src/lib/session-auto-finish.ts
export async function checkAndFinishStaleSessions(userId: string, db: DB) {
  const stale = await db.query.sessions.findMany({
    where: and(
      eq(sessions.userId, userId),
      isNull(sessions.finishedAt),
      lt(sessions.startedAt, new Date(Date.now() - 12 * 3600 * 1000)),
    ),
  })
  for (const s of stale) {
    const lastSet = await db.query.sessionSets.findFirst({
      where: eq(sessionSets.sessionId, s.id),
      orderBy: desc(sessionSets.completedAt),
    })
    const finishedAt = lastSet?.completedAt ?? new Date(s.startedAt.getTime() + 3600 * 1000)
    await db.update(sessions)
      .set({ finishedAt })
      .where(and(eq(sessions.id, s.id), isNull(sessions.finishedAt)))  // optimistic lock
    await awardXp({ event: 'session_complete', db, userId, sessionId: s.id })
  }
}
```

Idempotentní díky `WHERE finishedAt IS NULL` — druhé concurrent volání no-op.

## 9. Suggestion engine — double progression

```typescript
// src/lib/progression.ts
export function suggestNextSet(opts: {
  history: HistorySet[]          // posledních ~3 sessions tohoto cviku
  planExercise: PlanExercise     // repMin, repMax, targetSets
  currentSessionSets: SessionSet[]  // sety v této session v tomto cviku
  exerciseType: ExerciseType     // barbell | db | ... ovlivňuje increment
}): Suggestion {
  // 1. Žádná historie + prázdná session → prefill z planExercise (repMin, startWeight)
  // 2. Historie existuje, první série této session:
  //    - Všechny série poslední session na repMax? → +increment, reset na repMin
  //    - Jinak → stejná váha, +1 rep (cap na repMax)
  // 3. Probíhající série (currentSessionSets má setIndex >= 1):
  //    - Předchozí série hit její target? → target same
  //    - Předchozí série pod repMin? → down-target same weight same reps (nebo repMin)
  //    - RPE 10 a reps < target - 2? → down-target explicit
}
```

Increment:
- `barbell` → +2.5 kg (kombinace 1.25 kg talířů per stranu)
- `db` → +1 kg (half step) nebo +2.5 kg závislé na inventory — pro M2 jednoduchý +2.5 kg, optimalizace později
- `cable`, `machine` → +2.5 kg (stack)
- `bodyweight` → +1 rep, žádná váha
- `smith` → +2.5 kg

## 10. Plate calculator

```typescript
// src/lib/plates.ts
export function calculatePlates(opts: {
  targetKg: number
  bar: { weightKg: number }
  inventory: Array<{ weightKg: number; pairs: number }>
}): { perSide: Array<{ weightKg: number; count: number }>; missingKg: number } {
  // 1. remainder = (targetKg - bar.weightKg) / 2
  // 2. remainder < 0 → throw / invalid
  // 3. greedy: sort inventory desc, zeber co největší kus ≤ remainder, dokud jsou pairs a remainder > 0
  // 4. pokud remainder > 0 na konci → missingKg = remainder * 2 (warning uživateli)
}
```

## 11. Testing

### 11.1 Unit — ~59 testů

- `progression.test.ts` ~20 — všechny větve double progression + per-set re-eval.
- `1rm.test.ts` ~6 — Epley, Brzycki, edge cases.
- `plates.test.ts` ~15 — greedy fill, edge cases, nevyřešitelné kombinace.
- `xp.test.ts` ~10 — event mapping, PR detekce, reversal calc.
- `session-auto-finish.test.ts` ~8 — timing, idempotence, sets MAX fallback, concurrent.

### 11.2 Integration — ~25 testů (Vitest + test DB port 3308)

- Sessions lifecycle: POST → sets → PATCH finish → XP.
- 409 při pokusu o druhou aktivní session.
- Lazy auto-finish při GET /api/workout/active.
- Edit setu v dokončené session → update + žádný extra XP (ale PR reversal pokud relevant).
- DELETE setu → append reversal.
- Ownership: cizí session → 404.
- Plate inventory PUT validace.

### 11.3 E2E — 3 scénáře (Playwright)

1. Login → /workout → start UA → log 3 sety benche → skip OHP → finish → /dashboard.
2. Přidání ad-hoc cviku přes ExercisePicker v aktivní session.
3. Edit setu v dokončené session → ověř změněnou hodnotu v GET response.

### 11.4 Manuální QA před milestone close

- iPhone Safari — tap targety, rest timer + wake lock, Screen sleep behavior.
- Desktop Chrome — keyboard-only navigace ve stepperu.
- PWA install (iOS + Chrome) — pokud M2 už běží pod PWA shellem (M0 má manifest stub).

## 12. Závislosti + riziko

### 12.1 Nové npm balíčky

- Žádné nové major deps. Radix Dialog + Tailwind už v projektu (M0). Wake Lock je Web API, žádný polyfill.

### 12.2 Riziková místa

- **Per-set suggestion re-eval** — netriviální test matrix (history + current session + exercise type). Plně pokryto v `progression.test.ts`.
- **XP reversal při edit/delete** — append-only ledger znamená, že každá mutace může vygenerovat až 2 nové eventy. Testem pokryto, ale je nutno hlídat že `pr_achieved` reversal se spouští jen když PR byl skutečně aktivní.
- **Screen Wake Lock API** — na iOS Safari funguje jen v user gesture. Testováno manuálně, fallback = timer funguje bez wake lock, jen obrazovka zhasne po iOS defaultu.
- **12h auto-finish race** — concurrent fetch z dashboardu a /workout pro stejného usera. Řeší `WHERE finishedAt IS NULL` v UPDATE (optimistic lock).

## 13. Definition of Done

- [ ] Všechny unit + integration + E2E testy zelené.
- [ ] `npm run typecheck` bez chyb.
- [ ] `npm run lint` clean.
- [ ] Migrace `0002_m2_plate_inventory.sql` aplikovaná a reversible (rollback instruction v komentáři).
- [ ] Seed rozšířen, idempotentní lazy upsert pro stávajícího usera.
- [ ] Manuální test: login → start UA → log reálný trénink → finish → historie zobrazí data → edit starého setu → XP total konzistentní.
- [ ] Manuální test: zapomeň finish → druhý den otevři app → auto-finish proběhne → toast se zobrazí.
- [ ] PR / merge strategie podle M1 patternu (rebase + ff).

## 14. Out of scope (připomenuto)

Dashboard rich content, progress grafy, muscle heatmap, avatar UI, XP UI, export, stagnation, food log, body photos, measurements, PWA notifikace, offline sync. Viz sekce 2.2 a hlavní roadmap.
