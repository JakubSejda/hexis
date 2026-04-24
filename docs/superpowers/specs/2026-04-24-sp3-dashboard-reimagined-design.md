# SP3 — Dashboard reimagined — Design Spec

**Status:** Draft
**Date:** 2026-04-24
**Sub-project:** SP3 of the 5-SP design rebuild (SP1 + SP2 closed 2026-04-24)
**Scope:** Replace the current vertical stack of 8 dashboard cards with a Life-Areas-centric composition: Status Window, Today's Quest, Life Area grid, Muscle Volume, Week peek, conditional Stagnation alert. First real adoption of quest vocabulary per the SP2 product decision. Domain model (`workout`, `exercise`, `set`) and data queries stay unchanged — this is a presentation rework, not a data rewrite.

---

## 1. Motivation

The MVP dashboard is a flat vertical stack of eight cards (AvatarHero, streak number, stagnation warning, CTA, TodayNutrition, WeekMeasurement, NutritionStreak, MuscleWidget). The user called this "zvrácenej nepřehlednej shluk tlačítek" — every value is a separate card, no information hierarchy, no anchoring metaphor. SP2 landed the Life Areas IA/navigation skeleton; SP3 brings the same metaphor into the dashboard content so the app has a coherent mental model top to bottom.

Moodboard direction: App 4 (Easlo) dominant utility/typographic mode, with App 1/3/5 (Gamified-Quest-Center, Habit Tracker, GymOS) contributing overlay ingredients — Status Window player card, "Today's Quest" CTA language, Life Areas illustrated cards, letter-spaced region headers.

---

## 2. Confirmed product decisions

Three gate decisions made during brainstorming 2026-04-24:

1. **Scope:** Hybrid rebuild. Existing data queries (measurements, nutrition, muscle volumes, workout streak, stagnation, XP) are reused. Presentation cards are rebuilt. Four of the seven existing dashboard sub-components are deleted; their data feeds new components. Two are kept (StagnationWarning, MuscleWidget); one (AvatarHero) is absorbed into StatusWindow.

2. **Hero artwork in Status Window:** Placeholder tier SVG (`/public/avatars/tier-{1-5}.svg`, already present from M6) is shown full-width at ~140 px in Status Window. Accepts the forward commitment to upgrade artwork later (roadmap deferred feature). No new artwork commissioned in SP3.

3. **Today's Quest states:** Workout-only. Four states: Active session / Rest day / Scheduled workout / No plan. Rest day is detected simply as "last finished session was today" — no plan-rotation magic. No-plan fallback for users with empty `userPlans`.

One small addition during design: **MuscleWidget stays on the dashboard** as its own section below Life Areas (decided during section 4 review). It keeps its existing visual but gets a letter-spaced region header and a full-width placement.

---

## 3. Composition

Dashboard vertical order (top to bottom, all cards full width on mobile, contained on desktop via the AppShell's `md:pl-[220px]` offset):

1. **Status Window** — hero card with tier SVG + Level + XP bar + streak peek
2. **Today's Quest** — primary CTA, renders one of four states
3. **L I F E  A R E A S** region — 2×2 grid on `<md`, 4×1 grid on `≥md`. Four cards (Training, Nutrition, Progress, Stats).
4. **M U S C L E  V O L U M E** region — single full-width section wrapping the existing `MuscleWidget`.
5. **T H I S  W E E K** region — Week peek: Po-Ne day dots.
6. **Stagnation alert** (conditional) — inline alert only if stagnating exercises exist.

Region headers (`S T A T U S`, `T O D A Y · S  Q U E S T`, `L I F E  A R E A S`, `M U S C L E  V O L U M E`, `T H I S  W E E K`) render as letter-spaced uppercase `text-[10px] tracking-[0.2em] text-muted` above each section. Status Window does not need a header (hero is self-identifying). Stagnation alert has its own inline heading.

---

## 4. Components

All new components live in `src/components/dashboard/`. Naming keeps the existing `PascalCase.tsx` convention. Tests go in `src/tests/dashboard/` (new folder).

### 4.1 `StatusWindow`

Server component, pure presentation. Props:

```ts
type Props = {
  level: number
  totalXp: number
  tier: 1 | 2 | 3 | 4 | 5
  tierName: string
  tierColor: string
  streak: number              // 0 = hidden
}
```

**Layout (top to bottom):**

1. **Top row** — date string left (`cs-CZ` locale: `sobota · 24. dubna`), streak peek right (`🔥 N day streak`, `🔥` emoji + amber numeral). Streak peek hidden when `streak === 0`.
2. **Hero avatar** — `<Avatar tier={tier} size={140} />` (existing component). Centered. `animate-tier-glow` CSS class applied when `tier >= 3` for subtle progression feedback. Radial gradient backdrop (CSS only, no image asset).
3. **Level + tier name** — `Level {N}` in bold `text-3xl` with `style={{ color: tierColor }}`. Below, tier name letter-spaced uppercase `text-xs text-muted tracking-[0.3em]` (e.g. `— B R O N Z E —`). Tier name uses wider tracking than region headers to emphasize it as a character identity rather than a section marker.
4. **XP bar** — `<ProgressBar variant="xp" value={...} max={...} height={8} />` full card width. Below, `X do L{level+1}` right-aligned `text-xs text-muted`.
5. **Tap target** — whole card wrapped in `<Link href="/stats">` with hover `border-accent`.

**What it replaces:**
- `AvatarHero.tsx` — deleted after migration.
- Inline streak card in `dashboard/page.tsx` — deleted.
- User-name greeting ("Ahoj, Jakub") — removed from Dashboard entirely; the AppHeader breadcrumb already shows the active Life Area context, and duplicating user identity on the dashboard adds noise.

### 4.2 `TodayQuest`

Server component, pure presentation. Consumes a discriminated union `Quest` resolved by a pure helper `resolveTodayQuest(...)`.

```ts
type Quest =
  | { kind: 'active'; sessionId: string; planName: string; completed: number; total: number }
  | { kind: 'rest'; nextPlanName: string | null }
  | { kind: 'scheduled'; planName: string; exerciseCount: number }
  | { kind: 'no-plan' }
```

**Each state rendering:**

- **`active`** — accent background, label "TODAY'S QUEST" letter-spaced top. Primary line: `▶ Pokračuj v {planName}`, bold large. Secondary: `{completed} ze {total} cviků hotovo  ▰▰▰░░` (text + inline mini progress bar). Whole card is `<Link href="/training/{sessionId}">`.
- **`rest`** — neutral `bg-surface-raised`, label. Primary: `Rest day` muted large. Secondary: `Dnes regeneruj. Zítra: {nextPlanName}` (or just `Dnes regeneruj.` if `nextPlanName === null`). Not clickable (read-only state).
- **`scheduled`** — accent background, label. Primary: `▶ {planName}` bold large. Secondary: `{exerciseCount} cviků`. (Time estimate is a nice-to-have; defer unless plan metadata makes it trivial. If needed later, add `exerciseCount × 5 min` rough estimate; do NOT add per-exercise metadata in SP3.) Whole card is `<Link href="/training">` (picker with nextPlan pre-selected if picker supports it; otherwise plain picker is fine).
- **`no-plan`** — accent background, label. Primary: `Začni svojí cestu` motivational. Secondary: `Nastav si svůj první plán →`. Whole card is `<Link href="/training">` (picker shows empty state).

**State resolution order (top wins):**

```ts
function resolveTodayQuest({
  activeSession,   // first unfinished session or null
  lastFinished,    // last finished session or null
  plans,           // sorted plans (by order)
  exerciseCounts,  // Map<planId, count> for scheduled/active
  today,           // Date
}): Quest {
  if (activeSession) return { kind: 'active', ... }
  if (plans.length === 0) return { kind: 'no-plan' }
  if (lastFinished && isSameUtcDay(lastFinished.finishedAt, today)) {
    return { kind: 'rest', nextPlanName: nextPlanAfter(lastFinished, plans).name }
  }
  const scheduled = nextPlanAfter(lastFinished, plans)
  return { kind: 'scheduled', planName: scheduled.name, exerciseCount: exerciseCounts.get(scheduled.id) ?? 0 }
}
```

Helper lives in `src/lib/today-quest.ts` (pure, tested independently; no DB, no React).

**Active session `completed` count:** number of distinct `exercise_id` values that have at least one completed `set` in the session. If the query cost is not trivial, fallback to `undefined` and render only `▶ Pokračuj v {planName}` without progress — report in plan if this pragma is needed.

**What it replaces:**
- Inline 3-way CTA (`active ? ... : nextPlan ? ... : ...`) in `dashboard/page.tsx` — deleted.

### 4.3 `LifeAreaCard`

Generic card component, one shared shell, four instances (Training, Nutrition, Progress, Stats).

```ts
type Props = {
  area: 'training' | 'nutrition' | 'progress' | 'stats'
  label: string              // e.g. "TRAINING"
  value: string              // e.g. "12 sessions"
  secondary: string          // e.g. "this week"
  visual: React.ReactNode    // sparkline / bar / chevrons — inline SVG
  href: string               // "/training" etc
  empty?: boolean            // render muted empty state
}
```

**Card shell:**

- `<Link href={href}>` with full card as tap target
- Padding `p-4`
- Border `border-border` → `border-accent` on hover
- Background `bg-surface`

**Contents:**

- Top: `<span class="text-muted text-[10px] tracking-[0.2em] uppercase">{label}</span>`
- Middle: `<div class="text-2xl font-bold">{value}</div>` (muted opacity-60 if `empty`)
- Below: `<div class="text-xs text-muted">{secondary}</div>`
- Bottom: `visual` slot (32-40 px tall, card width)

**Instance table:**

| Area | label | value (populated) | secondary | visual | href | empty condition | empty text |
|------|-------|-------------------|-----------|--------|------|-----------------|------------|
| Training | TRAINING | `{N} sessions` (last 7 days) | `this week` | 8-week session-count sparkline | `/training` | 0 sessions 30+ days | `Žádné tréninky · Začni` |
| Nutrition | NUTRITION | `{kcal}` today (or `—`) | `of {targetKcal}` (or `no target`) | horizontal bar fill 0–120% clamped | `/nutrition` | no today row & no target | `Nelogováno · Přidej` |
| Progress | PROGRESS | `{sign}{delta} kg` (e.g. `−0.4 kg`) | `last week` | 8-week weight sparkline | `/progress` | no measurements 2+ weeks | `Bez měření · Zvaž se` |
| Stats | STATS | `Level {N}` | tier name | 3 chevron glyphs showing tier index filled | `/stats` | Level 1 & XP < 50 | `Nová postava · L1` |

**Data resolution:**

Dashboard page resolves each instance server-side and passes final strings to `LifeAreaCard`. The card itself does NOT query — keeps it pure/testable. Resolution helpers live in `src/lib/dashboard-life-areas.ts`:

```ts
export function resolveTrainingCard(sessions: Date[]): LifeAreaInput
export function resolveNutritionCard(todayRow, thisWeekRow): LifeAreaInput
export function resolveProgressCard(weightSeries: (number | null)[]): LifeAreaInput
export function resolveStatsCard(level: number, totalXp: number): LifeAreaInput
```

Each returns `{ value, secondary, visual, empty }` (plus the static label/href/area). Card is dumb.

**Visuals:**

- Sparkline — reuses existing `Sparkline` primitive from SP1 (tone="primary" or "accent")
- Horizontal bar — new small helper inside `LifeAreaCard` (reuse `ProgressBar` primitive, constrain height)
- 3 chevron glyphs — inline Lucide `ChevronUp` × 3 with filled/outlined variants based on tier index

### 4.4 `WeekPeek`

Server component, pure. Consumes pre-resolved days array.

```ts
type Day = { weekdayLabel: string; status: 'workout' | 'rest' | 'empty' }
type Props = { days: Day[] }   // always length 7, Po..Ne
```

**Rendering:**

- 7-column grid, weekday labels row (top) `text-[10px] text-muted`, status glyphs row (below)
- Glyphs: `●` filled amber (workout), `○` ring muted (rest), `·` dot very muted (empty)
- Legend line below: `workout ● · rest ○ · future ·` all `text-[10px] text-muted`
- Whole strip is `<Link href="/training">` — clicking goes to Training page (has session history)

Status resolution helper in `src/lib/week-peek.ts`:

```ts
export function resolveWeekPeek(sessionDates: Date[], today: Date): Day[]
```

Logic: iterate Po..Ne of the ISO week containing `today`. For each day:
- day key in `Set(sessionDates.map toISO slice 0,10)` → `workout`
- previous day was `workout` AND today's day = this day AND this day hasn't been done → `rest`
- day > today → `empty`
- otherwise → `empty`

**Simplified rule:** `workout` if session on that day, `rest` if session yesterday AND today (comparing only weekdays within the shown week), `empty` otherwise. No `missed-scheduled` (`✕`) status in SP3 — YAGNI per brainstorm.

### 4.5 Kept components

**`StagnationWarning`** — keep as-is. Dashboard renders it at the bottom, conditional on `items.length > 0`. Old styling preserved. Linked to `/stats/strength` (already updated in SP2).

**`MuscleWidget`** — keep as-is (`src/components/dashboard/MuscleWidget.tsx`). Wrap its render site in Dashboard page with a letter-spaced region header:

```tsx
<section>
  <RegionHeader>Muscle Volume</RegionHeader>
  <MuscleWidget data={...} maxVolume={...} />
</section>
```

No internal changes to MuscleWidget. The existing query `fetchMuscleVolumes(db, user.id, 7)` already runs in the page.

### 4.6 Deleted components

- `src/components/dashboard/AvatarHero.tsx` — absorbed into `StatusWindow`
- `src/components/dashboard/TodayNutritionCard.tsx` — data feeds Nutrition LifeAreaCard; detail moves to `/nutrition`
- `src/components/dashboard/WeekMeasurementCard.tsx` — data feeds Progress LifeAreaCard; detail moves to `/progress`
- `src/components/dashboard/NutritionStreakCard.tsx` — data visible in `/nutrition` detail; not surfaced on dashboard anymore (the nutrition streak was redundant with the kcal target rendering)

Their tests (if any) are deleted alongside.

### 4.7 Optional helper: `RegionHeader`

Letter-spaced region label used in 4 places (`L I F E  A R E A S`, `M U S C L E  V O L U M E`, `T H I S  W E E K`, optionally `T O D A Y · S  Q U E S T`). Lives at `src/components/dashboard/RegionHeader.tsx`.

```tsx
export function RegionHeader({ children }: { children: string }) {
  return (
    <div className="text-muted px-1 pb-2 text-[10px] font-medium tracking-[0.25em] uppercase">
      {children}
    </div>
  )
}
```

---

## 5. Dashboard page rewrite

`src/app/(app)/dashboard/page.tsx` is the integration site. Current page: ~192 lines. New page: similar size but different distribution — most of the logic moves into pure resolvers.

**Server queries (unchanged — keep as-is):**
- `getTotalXp(db, user.id)` → totalXp
- `xpToLevel(totalXp)` → level
- `levelToTierMeta(level)` → tier/tierName/tierColor
- `fetchWorkoutStreak(db, user.id)` → streak
- `active` session query
- `userPlans` query
- `lastFinished` query
- `exerciseCounts` query (new — count exercises per plan id for TodayQuest scheduled state)
- `fetchRange measurements` (keep)
- `fetchRange nutrition` (keep, range narrowed from 30 days to last 8 weeks for sparkline range)
- `fetchStagnatingExercises` (keep — feeds StagnationWarning)
- `fetchMuscleVolumes` (keep — feeds MuscleWidget)
- `sessions last 8 weeks` (new — feeds Training LifeAreaCard sparkline and WeekPeek)

**Page composition (pseudocode):**

```tsx
export default async function DashboardPage() {
  // auth + stale session check (unchanged)
  // all queries (see above)

  const quest = resolveTodayQuest({ activeSession, lastFinished, plans: sortedPlans, exerciseCounts, today })
  const trainingCard = resolveTrainingCard(sessionsLast8Weeks)
  const nutritionCard = resolveNutritionCard(todayRow, thisWeekRow)
  const progressCard = resolveProgressCard(weightSeries)
  const statsCard = resolveStatsCard(level, totalXp)
  const weekPeek = resolveWeekPeek(sessionsLast8Weeks.filter(inThisWeek), today)

  return (
    <Container size="full">
      <Stack gap={5} className="py-4">
        <StatusWindow level={level} totalXp={totalXp} tier={tier} tierName={tierName} tierColor={tierColor} streak={streak} />
        <TodayQuest quest={quest} />
        <section>
          <RegionHeader>Life Areas</RegionHeader>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <LifeAreaCard area="training" {...trainingCard} label="TRAINING" href="/training" />
            <LifeAreaCard area="nutrition" {...nutritionCard} label="NUTRITION" href="/nutrition" />
            <LifeAreaCard area="progress" {...progressCard} label="PROGRESS" href="/progress" />
            <LifeAreaCard area="stats" {...statsCard} label="STATS" href="/stats" />
          </div>
        </section>
        <section>
          <RegionHeader>Muscle Volume</RegionHeader>
          <MuscleWidget data={heatmapData.muscles} maxVolume={heatmapData.maxVolume} />
        </section>
        <section>
          <RegionHeader>This Week</RegionHeader>
          <WeekPeek days={weekPeek} />
        </section>
        {stagnation.length > 0 && <StagnationWarning items={stagnation} />}
      </Stack>
    </Container>
  )
}
```

The legacy `measurementToTargets` / `measurementToValues` helpers inside the current page are no longer needed — deleted alongside the TodayNutritionCard / WeekMeasurementCard removal.

---

## 6. Tokens & styling

No new tokens. SP2 already resolved amber accent (`--color-accent: #f59e0b`). Tier colors come from existing `levelToTierMeta`. Region headers use `text-muted` + `tracking-[0.25em]`. No color system additions.

---

## 7. Migration plan (commit-level slicing preview)

Detailed plan will be produced by writing-plans. Expected commit slicing:

1. `RegionHeader` primitive + test
2. Pure resolvers in `src/lib/` (+ unit tests): `today-quest.ts`, `dashboard-life-areas.ts`, `week-peek.ts`
3. `LifeAreaCard` component + tests
4. `TodayQuest` component + tests
5. `StatusWindow` component + tests
6. `WeekPeek` component + tests
7. Dashboard page rewrite — integrate all + delete obsolete components
8. Delete orphaned components: `AvatarHero`, `TodayNutritionCard`, `WeekMeasurementCard`, `NutritionStreakCard` (+ their tests)
9. Add new `exerciseCounts` query helper for TodayQuest scheduled state
10. E2E smoke spec update (dashboard render + quest state transitions if feasible)

Ships as one PR per the "one PR per slice off main" branching rule. If diff exceeds ~1500 LOC, split at boundary after component unit tests (1–6) and before page integration (7+).

---

## 8. Testing

### 8.1 Unit / component

- `resolveTodayQuest` — all 4 states + priority order (active wins over no-plan wins over rest wins over scheduled)
- `resolveTrainingCard`, `resolveNutritionCard`, `resolveProgressCard`, `resolveStatsCard` — populated and empty variants
- `resolveWeekPeek` — workout on Mon, rest on Tue, empty future days; full-week case; no-workout case
- `StatusWindow` — hides streak at 0; renders tier name; applies `animate-tier-glow` class at tier ≥ 3
- `TodayQuest` — each state renders expected primary text, link target, and attributes (active state has link to session, rest is non-clickable)
- `LifeAreaCard` — empty prop applies muted styling; href wraps whole card; visual slot renders
- `WeekPeek` — 7 columns, correct glyphs per status, link to /training

### 8.2 Integration

- Dashboard page renders Status → Quest → Life Areas → MuscleWidget → WeekPeek → (Stagnation if applicable) in order
- Empty-user dashboard (0 sessions, no measurements) shows no-plan quest + empty Life Areas + empty WeekPeek

### 8.3 E2E

Extend `tests/e2e/dashboard-m3.spec.ts` (existing) OR create `tests/e2e/dashboard-sp3.spec.ts` with:
- Dashboard sections visible (StatusWindow, TodayQuest, LifeAreas × 4, MuscleWidget, WeekPeek)
- Clicking a LifeAreaCard navigates to correct detail page
- TodayQuest "active" state click navigates to `/training/{id}`

### 8.4 Live browser smoke

Before merge: demo user login, verify:
- StatusWindow shows correct level, tier name, XP bar, streak (7+ day streak renders ok; 0-streak hides peek)
- TodayQuest state is correct for demo user's session history (should be `scheduled` or `no-plan` for a fresh demo)
- Life Area cards show real data or empty states as appropriate
- MuscleWidget renders (data may be empty for demo user — render gracefully)
- Week peek shows dots for today/past days
- Hover states (desktop): amber border on cards
- Mobile 360 px: 2×2 life areas grid fits without overflow
- Desktop 1280 px: 4×1 life areas row fits

---

## 9. Acceptance

- Tests: all green, zero regressions; new unit + integration tests for each component + resolver in §4 and §8.1
- Lint + typecheck clean
- §11.2 guard (nested-import) still zero matches
- Live browser smoke passes on mobile (360) and desktop (1280)
- 4 obsolete components (AvatarHero, TodayNutritionCard, WeekMeasurementCard, NutritionStreakCard) and their tests deleted; no dangling imports
- PR diff within reasonable review size (~1000–1500 LOC; split if larger)

---

## 10. Out of scope (explicit)

- ❌ New avatar artwork — keep placeholder tier SVGs; upgrade is a separate (roadmap-deferred) task
- ❌ Life Area detail pages — `/training`, `/nutrition`, `/progress`, `/stats` pages keep their current (non-redesigned) content in SP3; their redesign will come organically in SP4/SP5
- ❌ Multi-quest / habit checklist — Today's Quest is workout-only; habits/rewards are SP5
- ❌ Muscle Rank radar — planned for SP4
- ❌ Hero anime illustration integration — uses placeholder SVGs only
- ❌ Time estimate on TodayQuest `scheduled` state — deferred unless trivial
- ❌ "Missed scheduled day" status on WeekPeek — requires plan-rotation intent; YAGNI
- ❌ Per-day clickable history on WeekPeek — full strip links to `/training`
- ❌ Onboarding flow for no-plan users beyond the CTA link — Phase 3 feature
- ❌ Any domain-model rename (`workout` → `quest`, `exercise` → `skill`) — cosmetic-only per SP2 Q3

---

## 11. Known risks

- **Active session `completed` count query cost:** counting distinct exercise IDs with completed sets for an in-progress session may be a non-trivial join. Mitigation: resolve during plan writing by either adding a small index or falling back to omitting the count from the active state. The spec-compliant fallback is documented in §4.2.
- **Rest day detection edge case:** "last session finished today" only works if the user finished a session same-day. If they auto-finish from a 12-hour stale session (M8 auto-finish), `finishedAt` is today; still works. If the user never actually finishes (rare), rest detection breaks. Acceptable for SP3.
- **Placeholder hero SVGs will remain visible for weeks/months.** This is a forward commitment to their acceptable-enough visual quality. Mitigation: small glow animation + radial gradient backdrop + letter-spaced tier name elevate the presentation above "raw placeholder" feel.
- **MuscleWidget data may be empty or sparse** for demo/new users. It already handles empty data per M7; verify during smoke.
- **Page load cost:** Dashboard already runs 10+ queries. SP3 adds one more (exercise counts for scheduled plan) and widens the sessions range (30 days → 8 weeks). Acceptable — all queries are indexed and unchanged in pattern. No N+1 introduced.
- **Locale consistency:** date formatting uses `cs-CZ` locale. Keep consistent with existing date formatting elsewhere (`AvatarHero` currently does this — behavior is preserved).

---

## 12. Dependencies / prerequisites

- SP1 Part 2 merged (done — 2026-04-23)
- SP2 merged (done — 2026-04-24, PR #14 squash `9b712f5`)
- Existing queries and libs: `getTotalXp`, `xpToLevel`, `levelToTierMeta`, `xpToProgress`, `fetchWorkoutStreak`, `fetchRange` (measurements/nutrition), `fetchStagnatingExercises`, `fetchMuscleVolumes`, `calcStreak`, `classifyDay`, `toWeekStart`, `weekRange`
- Existing components kept: `Avatar`, `ProgressBar` (variant="xp"), `Sparkline`, `MuscleWidget`, `StagnationWarning`
- No new dependencies, no DB migrations, no env vars, no API changes

---

## 13. Next step

After this spec is reviewed and approved, move to the `writing-plans` skill to produce a commit-by-commit implementation plan following the §7 slicing.
