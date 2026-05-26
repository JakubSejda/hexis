# SP5 PR-4 — Quest Calendar (design spec)

**Status:** brainstorm-approved 2026-05-26 — implementation plan TBD
**Initiative:** Hexis design overhaul, SP5 (missing features)
**Slice:** last open slice — promotes the final sidebar placeholder

## 1. Goals

In scope for the MVP:

- `/calendar` Quest Calendar destination — month grid (7 × N) with 4-signal day cells (training / habit / weigh-in / photo).
- All-time history, lazy-loaded per month via URL `?ym=YYYY-MM`. No infinite scroll.
- Today highlighted; future days predicted via existing `today-quest.ts` rotation — only tomorrow's next-plan hint is rendered, further future stays blank.
- Streak visualization — runs of ≥ 3 consecutive training days get a visual treatment (background fill + border).
- Day-tap modal — list of the 4 signal types with their data (session name + duration, habit names, weight, photo thumbs); deep links to `/training/[id]`, `/bio`, `/habits`, plus reuse of M5 `Lightbox` for photos.

Out of scope:

- Editable future (no `scheduled_sessions` table, no drag-to-move).
- XP rewards for any calendar interaction — Calendar is read-only.
- Dashboard widget / bottom-tab promotion — Calendar is a secondary destination (sidebar only).
- Reminders, notifications, or recurring-event configuration.

## 2. Information architecture

After this slice, no placeholders remain in the sidebar.

- `src/components/shell/area-meta.ts`:
  - `Area` union gains `'calendar'`.
  - `PlaceholderArea` type **deleted** (no more placeholders).
  - `SIDEBAR_AREAS` appends `'calendar'` (full list: dashboard, training, nutrition, progress, stats, habits, rewards, bio, calendar).
  - `PLACEHOLDER_META` and `PLACEHOLDER_ORDER` **deleted**.
  - `CalendarDays` icon already imported; stays.
- `src/tests/shell/Sidebar.test.tsx`: drop the placeholder section assertion (no placeholders left), add Calendar active-link + active-current tests.
- `tests/e2e/nav.spec.ts`: drop the "SP5 placeholder items exist and are disabled" test entirely, add a Calendar nav assertion.

## 3. Route

- Path: `/calendar` (matches placeholder href).
- Page: `src/app/(app)/calendar/page.tsx`, `export const dynamic = 'force-dynamic'`.
- Query param: `searchParams.ym?: string` (format `YYYY-MM`). Invalid or missing → fallback to the current month (UTC-derived from `new Date()`). No 404.
- Page layout: `CalendarHeader` (month label + nav arrows + back-to-today) → `CalendarGridClient` (server-rendered grid wrapped in a client island for modal state) → `CalendarLegend`.

## 4. Data model

No new schema. The 4 signal sources already exist:

| Signal | Table | Column representing the day |
|---|---|---|
| Training | `sessions` | `DATE(finishedAt)` (only when `finishedAt IS NOT NULL`) |
| Habit | `habit_completions` (join `habits` for `userId`) | `completedOn` (already `mode: 'string'` YYYY-MM-DD) |
| Weigh-in | `measurements` | `weekStart` (YYYY-MM-DD; treated as the weigh-in day per existing Progress UI) |
| Photo | `body_photos` | `takenAt` (YYYY-MM-DD) |

### Pure types — `src/lib/calendar/types.ts`

```ts
export type DaySignals = {
  training: boolean
  habit: boolean
  weigh: boolean
  photo: boolean
}

export type CalendarDay = {
  date: string                       // YYYY-MM-DD
  signals: DaySignals
  isToday: boolean
  isFuture: boolean
  inStreak: boolean                  // computed by detectTrainingStreaks
  forecastPlanName: string | null    // populated only on today+1 via today-quest rotation
}
```

## 5. Queries

All in `src/lib/queries/calendar.ts`. Date range bounds are inclusive YYYY-MM-DD strings; user scoping always present.

| Helper | Return shape | SQL essence |
|---|---|---|
| `fetchSessionDatesInRange(db, userId, from, to)` | `Set<string>` | `SELECT DATE(finishedAt) FROM sessions WHERE userId AND finishedAt BETWEEN from AND to + ' 23:59:59'` |
| `fetchHabitDatesInRange(db, userId, from, to)` | `Set<string>` | `SELECT completedOn FROM habit_completions JOIN habits ON habit_id = habits.id WHERE habits.userId = ? AND completedOn BETWEEN from AND to` |
| `fetchMeasurementDatesInRange(db, userId, from, to)` | `Set<string>` | `SELECT weekStart FROM measurements WHERE userId AND weekStart BETWEEN from AND to` |
| `fetchPhotoDatesInRange(db, userId, from, to)` | `Set<string>` | `SELECT takenAt FROM body_photos WHERE userId AND takenAt BETWEEN from AND to` |
| `fetchDayDetail(db, userId, date)` | `DayDetailData` | 4 sub-queries via `Promise.all`: sessions (id + planName + duration), habits with completion on that day (id + name), measurement row for `weekStart = date`, photo rows (id + storageKey + pose) |

`fetchDayDetail` is server-only and called via API route — see §7.

## 6. Composition + streak detection

### `src/lib/calendar/compose.ts`

```ts
export function composeCalendarMonth(args: {
  ym: string               // YYYY-MM
  today: string            // YYYY-MM-DD (UTC)
  sessionDates: Set<string>
  habitDates: Set<string>
  weighDates: Set<string>
  photoDates: Set<string>
  lastFinishedPlanId: number | null
  plans: { id: number; name: string; order: number }[]
}): CalendarDay[]
```

Behavior:

- Generates every YYYY-MM-DD for the month (28–31 entries).
- Each day: `signals.training = sessionDates.has(date)`, same for the other three.
- `isToday = date === today`, `isFuture = date > today`.
- `forecastPlanName` filled only on `today + 1` (one calendar day later); the value comes from `nextPlanAfter(lastFinishedPlanId, sortedPlans)` exported from `today-quest.ts` — no new business logic introduced.
- After all days built, calls `detectTrainingStreaks(days)` which mutates `inStreak` in place.

### `src/lib/calendar/streaks.ts`

```ts
export function detectTrainingStreaks(days: CalendarDay[]): void
```

- Scans the array left → right.
- Tracks the current run length of `signals.training === true`.
- On run end (false or future cell): if run length ≥ 3, sets `inStreak = true` on every cell in that run.
- Streak counts only past and today days — forecast (`isFuture && forecastPlanName`) is not part of any streak.
- Does **not** cross month boundaries in the MVP (each month is rendered independently). Acknowledged limitation; can be lifted by precomputing `inStreakAtMonthStart` from the prior month's tail.

## 7. Day detail API

API route `GET /api/calendar/day?date=YYYY-MM-DD`:

- `requireSessionUser` guard — returns 401 if no session.
- Date format check via regex `/^\d{4}-\d{2}-\d{2}$/` — returns 400 on mismatch (no separate Zod schema for one param).
- Calls `fetchDayDetail(db, user.id, date)`; returns:

```ts
type DayDetailData = {
  date: string
  sessions: Array<{ id: number; planName: string; durationMin: number | null }>
  habits: Array<{ id: number; name: string }>
  measurement: { weightKg: number | null; waistCm: number | null } | null
  photos: Array<{ id: number; thumbUrl: string; fullUrl: string; pose: string }>
}
```

Photo URLs follow the M5 convention `/api/photos/{id}` and `/api/photos/{id}/thumb` — never use `photoPath()` (filesystem-only). The modal fetches lazily on open (no preload in the page payload).

## 8. Components

All under `src/components/calendar/`. Server by default; only the grid wrapper and modal are `'use client'`.

| Component | Type | Purpose |
|---|---|---|
| `CalendarHeader.tsx` | server | Month label via `Intl.DateTimeFormat('cs-CZ', { month: 'long', year: 'numeric' })` ("Květen 2026") + prev/next arrow links to `?ym=` + "Dnes" button (shown only when not on current month, links to `/calendar` with no query) |
| `CalendarGrid.tsx` | server | 7-column grid; weekday headers `Po Út St Čt Pá So Ne`; leading empty cells so the 1st falls on the correct weekday (ISO Monday-start); renders `CalendarCell` per day |
| `CalendarCell.tsx` | server | Day number top-left, 4 mini dots at bottom, `opacity-30` when `isFuture && !forecastPlanName`, `ring-2 ring-accent` on today, `bg-accent/10 border-accent/40` when `inStreak`, dotted `border-dashed border-accent/60` + plan label text when forecast |
| `CalendarGridClient.tsx` | client | Wraps `CalendarGrid`; owns `openDate: string \| null` state; cells get `data-date` attr; one delegated click handler opens `DayDetailModal` |
| `DayDetailModal.tsx` | client | Bottom-sheet on `<sm`, centered on `≥sm`; header = formatted day (`{Číslo}. {Měsíc} {Rok}`); 4 sections, each rendered only when truthy; "Nic se nedělo" when all four empty; close button + backdrop click. Photos open M5 `Lightbox` inline. |
| `CalendarLegend.tsx` | server | 4 colored-dot legend ("Training / Návyk / Vážení / Foto") + streak swatch ("3+ den streak") below the grid. |
| `index.ts` | barrel | Re-exports the five components above. |

### Visual treatment

- 7 equal-width columns, cells `aspect-square` for clean grid look.
- Day number `text-sm` top-left; dot row absolute bottom-center.
- Mini dots: 6 × 6 px each, 3 px gap. Token mapping:
  - Training: `bg-accent` (amber).
  - Habit: `bg-emerald-500`.
  - Weigh-in: `bg-blue-500`.
  - Photo: `bg-purple-500`.
  (Final hex values confirmed against the DS palette during implementation; placeholders here mirror existing per-area accents on `MuscleRank`.)
- Today: `ring-2 ring-accent`.
- In-streak training cells: `bg-accent/10` background fill + `border-accent/40`.
- Future cells (no forecast): `opacity-30`, dots hidden.
- Forecast cell (today + 1 only): dotted `border-dashed border-accent/60` + `text-xs` plan label below the day number (truncated to 8 chars with ellipsis), no dots.
- Other-month leading/trailing cells (if any): rendered as empty placeholders — no day number, no border.

### Navigation

- Prev/next arrows: pure `<Link href={\`?ym=${prevMonth}\`}>` — server navigation, no client state.
- "Dnes" button: `<Link href="/calendar">`, visible only when `ym !== currentMonth`.
- No infinite scroll. No keyboard shortcuts in the MVP.

## 9. Czech vocabulary (locked)

| EN | CS |
|---|---|
| Quest Calendar (sidebar label, page H1) | **Quest Calendar** (EN preserved — matches dashboard "Today's Quest" gamification idiom) |
| Today button | **Dnes** |
| Weekday headers | **Po Út St Čt Pá So Ne** |
| Month label | cs-CZ via `Intl.DateTimeFormat` ("Květen 2026") |
| Legend dot labels | **Training / Návyk / Vážení / Foto** |
| Legend streak swatch | **3+ den streak** |
| Modal section headers | **Training / Návyky / Vážení / Fotky** (plural) |
| Modal empty state | **Nic se nedělo** |
| Forecast plan label | **Plán A?** (question mark — signal is a prediction, not a fact) |
| Modal buttons | **Zobrazit session / Otevřít fotku / Upravit vážení** |
| Empty user (no signals ever) | **Začni svoji cestu — první session, habit nebo váha se tu objeví.** |

## 10. Testing

| Layer | File | Coverage |
|---|---|---|
| Pure | `src/tests/lib/calendar/compose.test.ts` | Empty month; fully populated month; today flag; future flag; forecast injection (only today + 1); generated day count for 28/29/30/31-day months; month-boundary days. |
| Pure | `src/tests/lib/calendar/streaks.test.ts` | No streak (run = 2); exact streak (run = 3); long streak (run = 10); multiple runs in one month; gap breaks streak; forecast cells excluded. |
| Query | `src/tests/lib/calendar-queries.test.ts` | All 4 date-range queries + `fetchDayDetail`. Empty user (returns empty Sets / null); populated user; scope by userId (other user's rows ignored); date boundary inclusion (from and to inclusive). PREFIX: `caltq_`. |
| API | `src/tests/api/calendar-day.test.ts` | GET 200 with full data; 200 with empty arrays on no-data day; 401 with no session; 400 on malformed date. Auth-mock pattern per `project_sp5_code_patterns.md` §1. |
| RTL | `src/tests/calendar/CalendarHeader.test.tsx` | Month label rendered; prev/next links contain correct `?ym=`; "Dnes" hidden on current month, visible on others. |
| RTL | `src/tests/calendar/CalendarCell.test.tsx` | Day number rendered; 4 dots reflect signals; ring on today; dotted border + plan label on forecast; dimmed opacity on plain future; `data-date` attr present. |
| RTL | `src/tests/calendar/DayDetailModal.test.tsx` | Fetches on open; renders only sections with data; "Nic se nedělo" empty state; close button + backdrop close. M5 `Lightbox` mocked. |
| RTL integration | `src/tests/calendar/page.test.tsx` | Empty user (forecast on today + 1 only); populated user (signals + 3-day streak visible); `?ym` param honored; invalid `?ym` falls back to current month. Auth mocked, system time pinned. |
| Shell | `src/tests/shell/Sidebar.test.tsx` | Drop placeholder section assertion (no placeholders left); add Calendar active-link + `aria-current` tests. |
| E2E | `tests/e2e/calendar.spec.ts` | Sidebar → Calendar nav; today highlighted; tap day → modal opens → close. |
| E2E | `tests/e2e/nav.spec.ts` (update) | Drop placeholder block entirely; add Calendar nav assertion. |

Test patterns from `project_sp5_code_patterns.md` apply throughout: prefix isolation against the dev DB, `db` from `@/db/client`, `vi.setSystemTime` for any date-window assertion, `vi.mock('@/components/photos/Lightbox', …)` for modal tests, `vi.mock('@/lib/auth-helpers', …)` for API tests.

## 11. Risks & open questions

| Risk | Mitigation |
|---|---|
| Per-month query cost (4 queries on every month navigation) | Acceptable for MVP — each query is one-month, indexed (`idx_sessions_user_finished`, `idx_habit_completions_user_date`, `idx_measurements_user_week`, `idx_body_photos_user`). Monitor; introduce a `daily_summary` rollup table only if real-world latency demands it. |
| Streak doesn't cross month boundary in MVP | Documented limitation. Visual UX is per-month context anyway. Future fix: precompute `inStreakAtMonthStart` from prior month's tail and seed `detectTrainingStreaks`. |
| Forecast accuracy is weak (only tomorrow's next-plan hint) | Acceptable — current schema has no weekly schedule. The `?` suffix on the plan label communicates uncertainty. Lifting this would require new schema, out of MVP scope. |
| `measurements.weekStart` semantics — week not day | Matches existing Progress page convention (treats `weekStart` as the measurement event date). Document inline in the query helper. |
| `PlaceholderArea` type deletion changes exported API surface | Justified — no callers will remain after this slice. Verify via grep for `PlaceholderArea` / `PLACEHOLDER_META` / `PLACEHOLDER_ORDER` before deleting; update any leftover imports. |
| URL `?ym` keeps page dynamic | Already the case (`force-dynamic`). No static generation considered. |
| Photo URLs in modal | Use `/api/photos/${id}` / `/api/photos/${id}/thumb` — NEVER `photoPath()` (filesystem). Documented per `project_sp5_code_patterns.md` §16. |

## 12. File map (summary)

**New:**
- `src/lib/calendar/types.ts`
- `src/lib/calendar/compose.ts` (+ test)
- `src/lib/calendar/streaks.ts` (+ test)
- `src/lib/queries/calendar.ts` (5 helpers + types) (+ test)
- `src/app/api/calendar/day/route.ts` (+ test)
- `src/app/(app)/calendar/page.tsx` (+ test)
- `src/components/calendar/CalendarHeader.tsx`
- `src/components/calendar/CalendarGrid.tsx`
- `src/components/calendar/CalendarCell.tsx`
- `src/components/calendar/CalendarGridClient.tsx`
- `src/components/calendar/DayDetailModal.tsx`
- `src/components/calendar/CalendarLegend.tsx`
- `src/components/calendar/index.ts`
- Tests for each component above (RTL)
- `tests/e2e/calendar.spec.ts`

**Modified:**
- `src/components/shell/area-meta.ts` (promote calendar, drop PlaceholderArea entirely)
- `src/tests/shell/Sidebar.test.tsx`
- `tests/e2e/nav.spec.ts`

## 13. Out-of-scope follow-ups (parked)

- Daily-summary rollup table for sub-100ms calendar reads at large data volumes.
- Streak that crosses month boundaries.
- Forecast that uses a real weekly schedule (requires `plan_days` or similar schema).
- Yearly heatmap view (GitHub-style contributions grid).
- Export to ICS / Google Calendar.
- Reminders / notifications for habit days or scheduled sessions.
