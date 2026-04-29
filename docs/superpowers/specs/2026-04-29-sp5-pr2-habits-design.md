# SP5 PR-2 — Habits (streak tracker + XP milestones) — Design

**Status:** spec — awaiting user review
**Date:** 2026-04-29
**Initiative:** SP5 — Missing features (Rewards / Habits / Player Bio / Quest Calendar)
**Slice:** PR-2 of SP5 (Habits only). Player Bio / Quest Calendar follow as separate specs.

## 1. Goal

Habits zapne sidebar slot `Habits` (dnes placeholder v `src/components/shell/area-meta.ts`) a přidá denní/týdenní strict-streak tracker. Streak je vlastní gamifikační smyčka — vizuální 🔥 řetězec, žádné body za jednotlivé check. Překročení prahu 7 / 30 / 100 dní emituje jednorázový XP event s vážěnou částkou podle obtížnosti návyku → propojení s existujícím XP systémem (level / tier) a Rewards balance.

Etymologie produktu (ἕξις — "stable state acquired through practice") staví návyky do jádra značky; až do tohoto slice byly explicitně parked (viz `2026-04-24-sp3-dashboard-reimagined-design.md` line 397: *"Multi-quest / habit checklist — Today's Quest is workout-only; habits/rewards are SP5"*).

## 2. Non-goals (parked, not in this PR)

- Curated catalog / wizard / suggested habits (slice = user-defined only, konzistentní s Rewards)
- Streak freeze / grace days / "vacation mode" (strict = honest)
- Per-habit custom XP čísla (jen `weight` enum, žádné free-text částky → footgun pro XP balanc)
- Push notifikace / reminders ("zapomněls vodu")
- Habit kategorie / tagy / barvy / ikony
- Sharing, social proof, friend habits
- Mobile bottom-tab slot (4 tabs full — entry přes dashboard card + sidebar)
- Plný scheduler (`daysOfWeek`, custom intervals, "every 3 days")
- Streak milestone celebration animace (slice = toast only; full-screen polish parked)
- Statistika / heatmap / habit kalendář (logicky patří do SP5 PR-4 = Quest Calendar)
- Reaktivace archived habit (archive = read-only history v tomto slice)

## 3. Core decisions (rozcestníky uzavřené v brainstormingu)

| # | Rozhodnutí | Volba | Důvod |
|---|---|---|---|
| 1 | Habits ↔ XP relace | **Hybrid** — completion zdarma, milestone (7/30/100 d) emituje XP | Čistá XP smyčka, žádný rate-cap; návyky mají měřitelný payoff |
| 2 | Frekvenční model | **Daily + weekly** (`cadence` enum) | Pokrývá 90 % reálných návyků; full scheduler = příliš UI |
| 3 | Strict vs forgiving streak | **Strict** (miss = 0) | Streak = honest; grace/freeze aditivní v dalším slice |
| 4 | CRUD model | **User-defined only** | Konzistentní s Rewards, žádný i18n debt; "habits jsou tvoje" |
| 5 | Per-habit XP weight | **Enum** `light / standard / heavy` (×0.5 / ×1 / ×2) | Globální balanc, ale rozdíl mezi micro a hard návykem |
| 6 | Dashboard integrace | **Today's Checks card** pod Today's Quest | Friction zabíjí návyky; dashboard = primary entry |
| 7 | Completion UX | **Tap = check (optimistic), long-press = undo** | High-frequency low-stakes akce → frictionless |

## 4. Data model

Dvě nové tabulky + jedna nová `xpEvents.eventType` enum hodnota. Žádný zásah do `users` / `xpEvents` schématu mimo enum extend.

### 4.1 `habits`

```ts
export const habits = mysqlTable(
  'habits',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 26 }).notNull(),
    name: varchar('name', { length: 80 }).notNull(),
    cadence: mysqlEnum('cadence', ['daily', 'weekly']).notNull(),
    weeklyTarget: int('weekly_target'),                     // null pro daily; 1..7 pro weekly
    weight: mysqlEnum('weight', ['light', 'standard', 'heavy']).notNull().default('standard'),
    archivedAt: timestamp('archived_at'),                    // soft-delete
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    byUserActive: index('idx_habits_user_active').on(t.userId, t.archivedAt),
  })
)
```

- `name` cap 80 (room pro emoji + krátký popis); žádný `description` field — atomické názvy.
- `weeklyTarget` validuje app layer: `cadence='daily'` ⇒ null; `'weekly'` ⇒ 1..7.
- `archivedAt` soft-delete (pattern shodný s rewards): completion historie referencuje archivované habity FK-em a musí dál renderovat.
- Žádné FK constraints (project convention — viz Rewards spec §4).

### 4.2 `habit_completions`

```ts
export const habitCompletions = mysqlTable(
  'habit_completions',
  {
    id: int('id').primaryKey().autoincrement(),
    habitId: int('habit_id').notNull(),
    userId: varchar('user_id', { length: 26 }).notNull(),    // denormalizace pro indexing
    completedOn: date('completed_on').notNull(),             // YYYY-MM-DD v user TZ
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    byHabitDate: uniqueIndex('uniq_habit_date').on(t.habitId, t.completedOn),
    byUserDate: index('idx_completions_user_date').on(t.userId, t.completedOn),
  })
)
```

- **`completedOn` je `date`, ne `timestamp`.** Streak je per-kalendářní-den; timezone řeší app layer.
- **Unique `(habit_id, completed_on)`** — DB guard proti dvojímu odškrtnutí (race ze dvou tabů).
- Uncheck = `DELETE` row (ne soft-delete) — completion je ne-historický fakt.

### 4.3 `xpEvents.eventType` rozšíření

Existující enum `xpEvents.eventType` dostane novou hodnotu `'habit_streak'`. `xpEvents.meta` ponese `{ habitId: number, milestone: 7 | 30 | 100, weight: 'light' | 'standard' | 'heavy' }` pro audit. Žádná schema změna kromě enum extend (Drizzle migration = single ALTER).

### 4.4 Streak compute (read-time)

```ts
async function computeStreak(habit: Habit, today: Date): Promise<number> {
  const completions = await db.select(...).where(eq(habitId, habit.id))
                              .orderBy(desc(completedOn))
                              .limit(200)  // 100denní streak rezerva 2×
  if (habit.cadence === 'daily') {
    return countConsecutiveDays(completions, today)
  } else {
    return countConsecutiveWeeks(completions, habit.weeklyTarget!, today)
  }
}
```

- Volá se per-habit při render `/habits` a dashboard card. Žádný materialized counter (drift risk > query cost).
- Pure helpers `countConsecutiveDays` / `countConsecutiveWeeks` v `src/lib/habits/streak.ts` testované unit.

**Daily streak semantics:**
- Streak = počet po sobě jdoucích kalendářních dní končící buď **dneškem** (pokud je dnes checked), nebo **včerejškem** (pokud dnes ještě není checked, ale včera ano).
- Pokud dnes není checked **a** včera není checked → streak = 0.
- Pozn.: tohle není "1-day grace" výjimka v rozporu s rozhodnutím #3 (strict). Aktuální den je in-flight — počítat ho do streaku až po checku, nebo nepočítat ho do resetu až po půlnoci, jsou dva pohledy na totéž. Bez tohoto pravidla by streak `🔥 23` blikal na `0` každé ráno v 00:00 dokud uživatel nestihne check, což je UX bug, ne strictness.

**Weekly streak semantics:**
- Streak = počet po sobě jdoucích **uzavřených** ISO týdnů (pondělí–neděle), kde count completions ≥ `weeklyTarget`, počítáno zpětně od posledního uzavřeného týdne.
- **Aktuální (probíhající) týden se do streaku nepočítá**, ani když už target stihl. UI ho zobrazuje samostatně jako progress bar (`X/target tento týden`). Až po uzavření týdne (přechod na pondělí) se zařadí do výpočtu — pokud target stihl, streak +1; pokud ne, streak resetne na 0.
- Tj. weekly streak = "kolikrát po sobě jsi to v uzavřených týdnech stihl". Aktuální týden je vždy in-flight; jeho stav je viditelný v progress baru, ale streak je o historii.

### 4.5 Milestone detection

Při `POST /api/habits/[id]/check`:

1. Insert `habit_completions` row (idempotent: pokud už existuje pro `(habitId, date)`, vrať existující).
2. Spočítat **nový** streak (po insertu).
3. Pokud `newStreak ∈ {7, 30, 100}` **a** stejný milestone ještě nikdy pro tento habit nenastal (query nad `xpEvents` přes `source='habit_streak' AND meta_json.habitId = X AND meta_json.milestone = N`), insert XP event:

   ```
   xp = MILESTONE_BASE_XP[milestone] * WEIGHT_MULTIPLIER[habit.weight]
   ```

   `MILESTONE_BASE_XP = { 7: 50, 30: 200, 100: 1000 }`
   `WEIGHT_MULTIPLIER = { light: 0.5, standard: 1, heavy: 2 }`

4. Vrátit `{ completion, streak, milestoneAwardedXp?: number }`.

**Edge case A — uncheck → recheck stejný den.** Idempotency v kroku 3 (query nad `xpEvents`) zachytí, že milestone už byl emitován; XP se neemituje podruhé.

**Edge case B — uncheck XP neodebírá.** Konzistentní s Rewards (level nikdy neklesá). Uncheck jen zbourá řetěz pro budoucí streaky.

**Edge case C — habit archived po dosažení milestone.** Milestone zůstává v `xpEvents`, level zůstává. Audit trail intaktní.

**Edge case D — milestone double-emit race.** Viz §10.3.

**Edge case E — weekly milestone timing.** Daily streak advance + milestone detection se dějí synchronně při check call. Weekly streak ale advancuje až při uzavření týdne (přechod na pondělí). Milestone pro weekly habits se proto detekuje na **read-time** v `GET /api/habits` — když se streak nově překlopí přes prah (oproti naposled emitovanému milestone), emituje se XP event právě tehdy. Idempotency v kroku 3 zachycuje opakované volání. Pozn.: toaster po překlopení weekly milestone se uživateli ukáže až při dalším otevření app (typicky pondělí ráno) — akceptovatelné, weekly návyky jsou inherentně méně immediate než daily.

## 5. API

Šest route handlers pod `app/api/habits/`. Auth = `getCurrentUserId()` helper (auth-mock pattern z SP5 PR-1, viz `project_sp5_code_patterns` memory).

| Method | Path | Body / Query | Response |
|---|---|---|---|
| GET | `/api/habits` | — | `{ habits: HabitWithStreak[] }` (active first, archived za nimi) |
| POST | `/api/habits` | `{ name, cadence, weeklyTarget?, weight }` | `201 { habit }` |
| PATCH | `/api/habits/[id]` | `{ name?, weight? }` | `200 { habit }` |
| POST | `/api/habits/[id]/archive` | — | `200 { habit }` (archivedAt = now) |
| POST | `/api/habits/[id]/check` | `{ date: 'YYYY-MM-DD' }` | `201 { completion, streak, milestoneAwardedXp? }` |
| DELETE | `/api/habits/[id]/check?date=YYYY-MM-DD` | — | `204` (idempotent) |

```ts
type HabitWithStreak = Habit & {
  currentStreak: number
  completedToday: boolean        // pro daily
  completedThisWeek?: number     // pro weekly: 0..weeklyTarget+
}
```

### 5.1 Validation (app layer)

- `name`: trim, 1..80, nesmí být duplicitní s aktivním habit stejného uživatele (case-insensitive)
- `cadence='daily'` ⇒ `weeklyTarget = null`
- `cadence='weekly'` ⇒ `weeklyTarget ∈ 1..7`
- `weight ∈ {light, standard, heavy}` (default `standard`)
- check `date`: ISO `YYYY-MM-DD`, ≤ "dnes" v user TZ (klient pošle, server validuje proti `tz` headeru — viz §10.1)

### 5.2 Immutability rules

- **`cadence` a `weeklyTarget` jsou immutable po create.** Editovat by retroaktivně měnilo význam streak history. Uživatel který chce jiný režim → archivuje + zakládá nový. PATCH na tato pole vrátí `400`.
- **`weight` JE editovatelný**, ovlivní jen **budoucí** milestones. Already-emited XP eventy zůstávají (audit). Zdokumentováno v JSDoc na PATCH endpointu, ne v UI.

## 6. UI

### 6.1 `/habits` page

Single column, dvě sekce (`Daily`, `Weekly`) + collapsed `Archive`. Letter-spaced section headers (DS pattern z dashboardu).

```
┌──────────────────────────────────────────┐
│  HABITS                          [+ Nový]│
│  ────────────────────────────────────────│
│                                          │
│  Daily                                   │
│  ┌──────────────────────────────────────┐│
│  │ ☑  Voda  •  ×1.0  •  🔥 23           ││
│  │ ☐  Čtení •  ×0.5  •  🔥 0            ││
│  │ ☑  Běh   •  ×2.0  •  🔥 4            ││
│  └──────────────────────────────────────┘│
│                                          │
│  Weekly                                  │
│  ┌──────────────────────────────────────┐│
│  │ Pondělky meditace  •  ×1.0           ││
│  │ ▓▓▓░  3/4 tento týden  •  🔥 6 t     ││
│  └──────────────────────────────────────┘│
│                                          │
│  Archive (3)                       [▼]   │
└──────────────────────────────────────────┘
```

**`HabitDailyRow`** — checkbox + název + váha pill + streak. Tap = check (optimistic), long-press na checked = undo (toast "Vráceno"). Sdílená komponenta s dashboard card.

**`HabitWeeklyRow`** — bez checkboxu. Mini progress bar `X/target` + tlačítko `+ Splněno dnes` (jen jednou denně; po klik disabled). Streak v týdnech (`6 t`).

**Empty state** = velký nápis + CTA `+ Založ první návyk`. Hint *"Tap = check, drž = vrátit zpět"* pod CTA.

**Archive** = collapsed accordion default; expand zobrazí archivované habity read-only s posledním streakem před archivem. Reaktivace = parked.

### 6.2 New / Edit habit dialog

Sheet na mobilu, modal na desktopu (DS pattern shodný s Reward edit z SP5 PR-1):

```
┌────────────────────────────────────────┐
│  Nový návyk                            │
│  ────────────────────────────────────  │
│  Název návyku                          │
│  [_________________________________ ]  │
│                                        │
│  Cadence                               │
│  ◉ Daily      ○ Weekly                 │
│                                        │
│  Weekly target            ← jen Weekly │
│  [3] ×/týden                           │
│                                        │
│  Obtížnost                             │
│  ○ Light    ◉ Standard    ○ Heavy      │
│                                        │
│  ────────────────────────────────────  │
│  Při streaku 7 / 30 / 100 dní          │
│  získáš 50 / 200 / 1000 XP.            │   ← static info, mění se podle weight
│                                        │
│              [Cancel]    [Vytvořit]    │
└────────────────────────────────────────┘
```

- Edit režim: cadence/target disabled (immutable), info text *"Cadence nelze měnit. Archivuj a založ nový."*
- Validation inline pod fieldem.
- Submit = optimistic; failure → toast + revert.
- Info text XP se přepočítá živě s výběrem weightu (`50 → 25` pro light, `50 → 100` pro heavy, atd.).

### 6.3 Dashboard "Today's Checks" card

Pod "Today's Quest" v existující dashboard grid (SP3 layout):

```
┌────────────────────────────┐
│  TODAY'S CHECKS            │
│  ────────────────────────  │
│  ☑  Voda            🔥 23  │
│  ☐  Čtení           🔥 0   │
│  ☑  Běh             🔥 4   │
│  ────────────────────────  │
│  3 ze 5 hotovo  ·  Otevřít │
└────────────────────────────┘
```

- Jen `cadence='daily'` aktivní habits, max 5 (zbytek "...a 2 další" + link).
- Sdílí `HabitDailyRow` se /habits page. Bez "edit" akcí — read+check only.
- Footer: progress text + link `Otevřít` → `/habits`.
- **Empty state** (žádné daily habits) — card se vůbec nerenderuje. Dashboard se neztenčí (Life Areas drží layout).

### 6.4 Streak milestone toast

Při check response s `milestoneAwardedXp`:

```
🔥 Streak 7 dní!  +50 XP
```

DS toast `variant="success"`. Toast vyvolá refresh XP balance v sidebar/header (existující `useXp` hook). Žádná full-screen celebrace v tomto slice.

## 7. Sidebar / nav diff

Změny v `src/components/shell/area-meta.ts`:

```diff
- export type Area = 'dashboard' | 'training' | 'progress' | 'nutrition' | 'stats' | 'rewards' | 'settings'
+ export type Area = 'dashboard' | 'training' | 'progress' | 'nutrition' | 'stats' | 'habits' | 'rewards' | 'settings'

- export type PlaceholderArea = 'habits' | 'bio' | 'calendar'
+ export type PlaceholderArea = 'bio' | 'calendar'

  export const AREA_META: Record<Area, Meta> = {
    ...,
+   habits: {
+     label: 'Habits',
+     href: '/habits',
+     icon: ListChecks,
+     matches: (p) => p === '/habits' || p.startsWith('/habits/'),
+   },
    ...
  }

  export const SIDEBAR_AREAS: readonly Area[] = [
-   'dashboard', 'training', 'nutrition', 'progress', 'stats', 'rewards',
+   'dashboard', 'training', 'nutrition', 'progress', 'stats', 'habits', 'rewards',
  ] as const

  export const PLACEHOLDER_META: ... = {
-   habits: { label: 'Habits', icon: ListChecks },
    bio: ...,
    calendar: ...,
  }

- export const PLACEHOLDER_ORDER: readonly PlaceholderArea[] = ['habits', 'bio', 'calendar'] as const
+ export const PLACEHOLDER_ORDER: readonly PlaceholderArea[] = ['bio', 'calendar'] as const
```

`MOBILE_TABS` beze změny (4 plné). `Sidebar.test.tsx:31` — `'Habits'` se přesune z placeholder assert do active assert.

## 8. Testing strategy

Stejný pattern jako Rewards (Vitest-4 + RTL + auth-mock).

### 8.1 Pure logic (unit)

- `src/lib/habits/streak.ts` — `computeDailyStreak(completions, today)`, `computeWeeklyStreak(completions, target, today)`
  - Cases: prázdno → 0; check dnes → 1; mezera → reset; archived habit → poslední streak před archivem
  - Weekly: ISO týden boundary, target 1..7, partial week
- `src/lib/habits/milestone.ts` — `detectMilestone(prevStreak, newStreak) → 7|30|100|null`, `xpForMilestone(milestone, weight) → number`

### 8.2 API route handlers (vitest, mocked db + auth)

- `POST /api/habits` — validation matrix (cadence × weeklyTarget, name dedup case-insensitive, weight default)
- `PATCH /api/habits/[id]` — cadence/weeklyTarget reject 400; name/weight succeed
- `POST /api/habits/[id]/check` — happy path; idempotent recheck (vrátí existing); milestone fires once; uncheck → recheck stejný den XP nedaruje podruhé; date > today → 400
- `DELETE /api/habits/[id]/check` — happy; non-existent date → 204 (idempotent); XP zůstává

### 8.3 Component (RTL)

- `HabitDailyRow` — tap toggles, long-press undoes, optimistic + revert on failure
- `HabitsPage` — sections render, empty state, archive accordion
- `TodaysChecksCard` — renders only daily, hides if no habits, footer progress

### 8.4 E2E (`tests/e2e/habits.spec.ts`)

- **Happy:** create daily habit → check today → vidět streak 1 → reload → streak držený → uncheck → 0
- **Milestone:** seed completions na 6 po sobě → check 7. den → toast "+50 XP", balance v sidebaru zvednutá
- **Sidebar:** navigate `/habits` přes desktop sidebar; `Habits` ze sidebar se přesouvá z placeholder do active

## 9. Commit shape

7 commitů, 1 PR (následuje Rewards / SP4 PR-2 cadence):

```
feat(habits): schema (habits + habit_completions tables)
feat(habits): streak compute + milestone detection (pure)
feat(habits): API routes (list/create/edit/archive/check/uncheck)
feat(habits): /habits page (CRUD + checklist + archive)
feat(habits): dashboard Today's Checks card
chore(habits): wire sidebar — promote habits from placeholder to active area
test(habits): e2e happy + milestone path
```

`area-meta.ts` flip v předposledním commitu = single source of truth. E2E commit poslední, aby měl proti čemu běžet.

## 10. Rizika a otevřené body

### 10.1 Timezone

Klient odešle `YYYY-MM-DD` ze své aktuální TZ. Server musí validovat, že to není > "dnes" v té TZ — UTC by povolilo nebo zakázalo check podle náhody offsetu.

**Řešení:** klient pošle `X-User-Tz-Offset` header (offset minutes z `Date.getTimezoneOffset()`). Server zkonstruuje `today` v té TZ a validuje. Cap = ±840 (±14h, max reálný offset). Offset chybějící → fallback UTC + warn log.

Implementační rezerva: pokud Next.js middleware má jednoduchý helper na user TZ z `Accept-Language` / cookie, použít ho. Jinak header je explicit kontrakt klient↔server.

### 10.2 Streak query cost

N habits × scan completions per request. Při 20 habits a denním `/habits` open: 20 dotazů. Akceptovatelné (Rewards balance je jeden SUM dotaz, podobný řád).

Pokud bude pomalé v reálu, materialized streak counter v `habits` updateovaný v transakci s check je aditivní bez schema breaku — cesta otevřená.

### 10.3 Milestone double-emit race

Dva taby checknou habit současně. Unique index `(habit_id, completed_on)` zaručí jen jeden completion row, ale milestone query nad `xpEvents` může proběhnout 2× před prvním insertem.

**Řešení (preferované):** unique index na `xpEvents (user_id, source, JSON_EXTRACT(meta_json, '$.habitId'), JSON_EXTRACT(meta_json, '$.milestone'))`. Vyžaduje ověření, že MySQL verze projektu podporuje functional indexes na JSON paths.

**Fallback:** app-layer transaction `INSERT ... ON DUPLICATE KEY UPDATE no-op` nad uměle vytvořeným unique key sloupcem (`milestone_dedup_key VARCHAR GENERATED ALWAYS AS CONCAT(habit_id, '-', milestone) STORED`).

Otevřený bod do plánu: zjistit MySQL verzi (Drizzle config + prod DB) a zvolit cestu.

### 10.4 Czech vocab lock

V slice používáme: `Návyk` (singular), `návyky` (plural), `Splněno dnes`, `Vráceno`, `Cadence`, `Obtížnost`, `Streak` (anglicismus — používáme jak je, stejně jako `XP`). Lock per `project_sp5_code_patterns` memory.

## 11. Dependencies / blokátory

- Žádné. SP5 PR-1 (Rewards #18) merged 2026-04-29; main je clean. Tato slice neblokuje Player Bio ani Quest Calendar.
- Quest Calendar (SP5 PR-4) bude habits číst pro habit-completion heatmapu — design Habits API tomu odpovídá (`GET /api/habits` vrací completions ready, případně oddělený `GET /api/habits/completions?from=&to=`, který přidám až bude potřeba).

---

**Status:** spec — awaiting user review. Po schválení → invoke `superpowers:writing-plans`.
