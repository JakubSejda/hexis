# SP2 — Information Architecture & Navigation — Design Spec

**Status:** Draft
**Date:** 2026-04-24
**Sub-project:** SP2 of the 5-SP design rebuild (SP1 Design System closed 2026-04-23)
**Scope:** Flatten the `/progress` umbrella into top-level Life Areas, rename routes, introduce a responsive nav shell (bottom tabs on mobile, sidebar on desktop), add amber accent token. Page content redesign and SP5 feature stubs are explicitly out of scope.

---

## 1. Motivation

Phase 1 MVP shipped with a bottom tab bar carrying four opaque labels (Dashboard / Trénink / Progres / Nastavení). The `/progress` umbrella groups four unrelated concerns (body measurements, nutrition, photos, strength charts) behind a single label, forcing every user into a second-level sub-nav to reach anything. `/avatar` has a route but no nav entry. The moodboard's dominant mode — App 4 (Easlo) — uses a clean sidebar with flat Life-Area sections; App 1/3 contribute the "Life Areas" organizing metaphor as an overlay ingredient.

SP2 establishes the IA skeleton and the nav shell so SP3 (Dashboard reimagined), SP4 (Muscle visual language), and SP5 (Reward/Habit/Bio/Calendar features) can land into a stable structure without re-plumbing nav each time.

---

## 2. Confirmed product decisions

Three gate decisions were made during brainstorming (2026-04-24):

1. **Platform scope:** Mobile-first PWA with desktop as a first-class bonus. Responsive nav: bottom tabs on `<md`, sidebar on `≥md`.
2. **Life Areas in SP2:** Flatten `/progress` umbrella. Top-level Life Areas become separate routes. Placeholder slots for SP5 items reserved in sidebar now to avoid a second IA reshuffle.
3. **Quest vocabulary:** Cosmetic only — appears on specific surfaces in SP3+ (Today's Quest CTA, level-up toasts, XP breakdown). Life Area labels stay utility (Training, Progress, Nutrition, Stats). Domain model (`workout`, `exercise`, `set`) untouched.

One scope adjustment made during design: Life Area for body measurements + photos keeps the name **Progress** (not "Body"), route stays `/progress`. Strength charts still move out of `/progress` into `/stats/strength` because they belong to the avatar/XP narrative, not the body-tracking narrative.

---

## 3. Final IA

### 3.1 Top-level Life Areas

| # | Life Area | Route | Replaces | In mobile bottom nav? | In sidebar? |
|---|-----------|-------|----------|-----------------------|-------------|
| 1 | Dashboard | `/dashboard` | `/dashboard` | Yes | Yes |
| 2 | Training | `/training` | `/workout` | Yes | Yes |
| 3 | Progress | `/progress` | `/progress/body` (overview) + `/progress/photos` (sub) | Yes | Yes |
| 4 | Nutrition | `/nutrition` | `/progress/nutrition` | No — avatar dropdown | Yes |
| 5 | Stats | `/stats` | `/avatar` (overview) + `/progress/strength` (sub) | Yes | Yes |
| 6 | Settings | `/settings` (new index) | `/settings/plates` as default landing | No — avatar dropdown | Yes (footer anchor) |

### 3.2 Sub-routes

- **Training:** `/training` (picker), `/training/[sessionId]` (active workout). Sub-nav unchanged from current `/workout`.
- **Progress:** `/progress` (weekly measurements grid — same content as today's `/progress/body`), `/progress/photos` (body photos with existing Grid/Timeline/Před×Po tabs inside).
- **Stats:** `/stats` (avatar + level + XP breakdown — same content as today's `/avatar`), `/stats/strength` (1RM charts per exercise).
- **Settings:** `/settings` (new index page — three cards linking to the three sub-pages), `/settings/plates`, `/settings/macros`, `/settings/export` (all unchanged).

### 3.3 SP5 placeholder slots (sidebar only)

Rendered as disabled nav items in a second "Coming soon" section with an `SP5` badge. These are visual placeholders — no routes, no pages. Click = no-op. `aria-disabled="true"`, hover tooltip "Coming in SP5".

- Rewards
- Habits
- Player Bio
- Quest Calendar

Not shown on mobile bottom nav (4-tab slot budget is fixed).

### 3.4 Redirects (permanent, `next.config.ts`)

| Old | New |
|-----|-----|
| `/workout` | `/training` |
| `/workout/:path*` | `/training/:path*` |
| `/avatar` | `/stats` |
| `/progress/body` | `/progress` |
| `/progress/nutrition` | `/nutrition` |
| `/progress/strength` | `/stats/strength` |

All are `permanent: true` (301). `/progress/photos` keeps its path — no redirect needed.

---

## 4. Nav shell components

All new components live in `src/components/ui/compound/`. Naming and export conventions follow the SP1 Part 2 compound pattern (subcomponent dot-export, barrel at `compound/index.ts`).

### 4.1 `<AppShell>`

Orchestrator. Replaces the current `AppLayout` body in `src/app/(app)/layout.tsx`.

```tsx
type LifeArea = 'dashboard' | 'training' | 'progress' | 'nutrition' | 'stats' | 'settings'

<AppShell area="progress" title="Progress" lede="Týdenní měření a fotky">
  {children}
</AppShell>
```

Responsibilities:

- Wraps `Providers` + `XpFeedbackProvider` (moved in from current layout)
- Renders `<Sidebar>` (CSS `md:flex`, hidden below)
- Renders `<AppHeader area={area} />`
- Renders `<main>` with a `<PageTitle>` (internal helper for H1 + lede)
- Renders `<BottomNav active={area} />` (CSS `md:hidden`)
- Renders `<InstallPrompt />` (moved in)

`title` and `lede` are optional — a page can omit and render its own heading if it needs custom markup. Default behavior is that `AppShell` owns the H1 so the letter-spaced label and the page title stay coherent.

### 4.2 `<AppHeader>`

Reads `area` prop and the session's streak query.

**Mobile (52 px):** letter-spaced Life Area label (e.g., `P r o g r e s s`) on the left, avatar button (32 px) on the right.

**Desktop (56 px, inside main column — not full viewport width):** letter-spaced breadcrumb `L I F E · P R O G R E S S` on the left; on the right, streak peek (`12 day streak` with amber numeral, text muted) followed by avatar button (36 px). Streak peek is hidden if `streak === 0`.

Letter-spacing is a pure CSS effect — `tracking-[0.2em] uppercase text-xs`. Text in JSX is plain (`"Progress"`); no hand-inserted spaces.

Level / XP summary are intentionally absent from the header. SP3 Status Window on the Dashboard is the proper home for that.

### 4.3 `<Sidebar>`

Fixed left, 220 px wide, visible `md:flex`. Structure:

```
HEXIS                           brand, letter-spaced, amber
──────────────
LIFE AREAS                      section label (10px uppercase muted)
  Dashboard
  Training
  Nutrition
  Progress
  Stats

COMING SOON                     section label
  Rewards        SP5            disabled, SP5 badge right
  Habits         SP5
  Player Bio     SP5
  Quest Calendar SP5

──────────────                  flex-1 spacer pushes footer down
Settings                        footer anchor
```

Active item: amber text + 2 px left border (inset 14 px padding instead of 16 px to compensate).

### 4.4 `<BottomNav>`

Fixed bottom on `<md`, 64 px height + `pb-[env(safe-area-inset-bottom)]` for notched iOS. Four tabs, icons from `lucide-react`:

| Tab | Area | Icon |
|-----|------|------|
| Dashboard | `dashboard` | `Home` |
| Training | `training` | `Dumbbell` |
| Progress | `progress` | `TrendingUp` |
| Stats | `stats` | `User` |

Active tab: amber icon + amber label. No fill background (avoid Material-style pill).

### 4.5 Avatar dropdown

Reuses the existing `Menu` compound from SP1 PR 2.8. Anchored to the avatar button in `AppHeader`. This is the Menu compound's first real adoption.

**Items in order:**

1. User's display name (disabled, read-only header row)
2. divider
3. Nutrition → `/nutrition`
4. Settings → `/settings`
5. divider
6. Sign out (calls `signOut()` from NextAuth)

---

## 5. Design tokens

### 5.1 Amber accent

Add `--color-accent` to `src/app/globals.css` `@theme` block, value `#f59e0b` (amber-500). Exposed as Tailwind utility `bg-accent`, `text-accent`, `border-accent`.

Used in SP2 only for: active nav states, letter-spaced labels, streak numeral. Broader adoption (gamification garnishes, level-up flourishes) happens in SP3/4/5.

If SP1 already defines a warning or XP amber token that is visually close, unify on that token rather than introducing a parallel one. Check during plan writing.

### 5.2 Letter-spaced label utility

No new token — pure Tailwind composition `tracking-[0.2em] uppercase text-xs font-medium`. If used in more than two places, extract to a shared `<RegionLabel>` component. For SP2, inline composition is fine (header label + sidebar section labels = 2 sites).

---

## 6. Migration plan (commit-level slicing)

SP2 ships as one PR per the "one PR per slice" branching rule. Commits inside are sliced for review auditability. If the diff exceeds ~1200 LOC, split into two PRs at the boundary noted.

1. Amber accent token
2. `<BottomNav>` + tests (standalone, not yet adopted)
3. `<Sidebar>` + tests (standalone)
4. `<AppHeader>` + tests (standalone)
5. `<AppShell>` + tests (wires 2–4)

— *PR split boundary if needed: 1–5 ship first as "nav primitives", 6–13 as "IA migration + adoption"*

6. Route move `/workout` → `/training` (+ redirect)
7. Route move `/avatar` → `/stats` (+ redirect)
8. Route move `/progress/nutrition` → `/nutrition` (+ redirect)
9. Route move `/progress/strength` → `/stats/strength` (+ redirect)
10. Route rework `/progress/body` → `/progress` index (+ redirect); `/progress/photos` unchanged
11. New `/settings` index page (three cards)
12. `AppShell` adoption in `src/app/(app)/layout.tsx`; wire avatar dropdown in `AppHeader` to `Menu` compound with the 4 items from §4.5; delete old `TabLink` + `<nav>` JSX; set `area` prop per page
13. Playwright E2E nav spec + redirect smoke

---

## 7. Testing

### 7.1 Unit / component

- `AppShell` renders sidebar on `md+`, bottom nav below, header always
- `AppHeader` shows correct letter-spaced label per `area` prop
- `AppHeader` hides streak peek when `streak === 0`
- `Sidebar` marks correct item active per `area`; disabled SP5 items have `aria-disabled`
- `BottomNav` marks correct tab active per `area`; all 4 tabs render Lucide icons
- Avatar dropdown opens on click, renders expected 4 items + divider + sign-out

### 7.2 Integration

- Clicking each nav item navigates to the expected route (mock `next/navigation`)
- Avatar dropdown sign-out calls NextAuth's `signOut`

### 7.3 E2E (Playwright — new spec `tests/e2e/nav.spec.ts`)

- All 4 bottom tabs navigate correctly on mobile viewport; active state updates
- Sidebar visible on desktop viewport (≥768 px); clicking items navigates
- Old URLs redirect: `/workout`, `/avatar`, `/progress/body`, `/progress/nutrition`, `/progress/strength` all land on new paths with 301 (verified via response status)

### 7.4 Live browser smoke

Before merge, verify manually:

- All bottom tabs work on narrow viewport (360 px)
- Sidebar appears at `md` breakpoint; layout doesn't break at the transition
- Avatar dropdown opens both on mobile and desktop; Nutrition + Settings navigate correctly
- Streak peek appears on desktop header when streak > 0
- Letter-spaced labels render correctly (no character-collapse on narrow viewports)
- `/progress` shows measurements grid; `/progress/photos` shows photos with existing tabs
- `/stats` shows avatar page; `/stats/strength` shows strength charts
- `/settings` shows index page with three cards

---

## 8. Acceptance

- Tests: all green, zero regressions; new unit + integration coverage for every component in §4, new E2E nav spec per §7.3
- Lint + typecheck clean
- Nested-import guard still passes: `grep -r "@/components/ui/primitive/" src/ tests/` → 0 matches outside barrel (SP1 §11.2)
- All redirects verified manually in browser
- All nav surfaces (bottom tabs, sidebar, avatar dropdown) work on smoke-tested viewports

---

## 9. Out of scope (explicit)

- ❌ Dashboard content redesign (Status Window, Today's Quest, Life Area cards) — SP3
- ❌ Stats overview content (Muscle Rank radar, Player Bio) — SP4/SP5
- ❌ Progress overview content beyond merging current `/progress/body` — SP3 if needed
- ❌ SP5 feature page stubs (Rewards, Habits, Bio, Calendar) — sidebar placeholders only, no routes
- ❌ Tablet-specific layout — `≥md` = desktop sidebar, no intermediate breakpoint
- ❌ Mobile drawer / hamburger overflow — avatar dropdown handles Nutrition + Settings
- ❌ Palette overhaul beyond single amber accent token
- ❌ Muscle heatmap, smart coach charts, exercise pickers — no changes
- ❌ Quest vocabulary rename in domain model, copy, or non-nav surfaces
- ❌ Authentication, session strategy changes
- ❌ Offline-first (Dexie) — Phase 2

---

## 10. Known risks

- **Accent token collision:** If SP1 already defines an amber/warning/XP token close to `#f59e0b`, unify rather than duplicate. Resolve during plan writing by reading `src/app/globals.css` and the Tailwind config.
- **Redirect mechanism:** Use `next.config.ts` `redirects()` rather than middleware (auth already lives in middleware; keep concerns separated). Verify redirects work in dev and in production build.
- **`Menu` compound first adoption:** Built in SP1 PR 2.8 with zero consumers. Avatar dropdown may surface missing behavior (right-aligned anchor, click-outside, focus trap). Treat any gaps as in-scope for SP2 since it's the first real use.
- **Photos page sub-nav:** `/progress/photos` uses the Tabs compound internally (Grid / Timeline / Před×Po). No changes planned, but import paths will need re-pointing if the file moves. Current plan keeps the file where it is (`/progress/photos` stays), so no move.
- **Two-breakpoint mental model:** `<md` and `≥md` is binary. Devices near the boundary (iPad Mini portrait ≈ 744 px) land on mobile; iPad Mini landscape ≈ 1133 px lands on desktop. Acceptable — no iPad-portrait optimization in SP2.

---

## 11. Dependencies / prerequisites

- SP1 Part 2 merged (done — 2026-04-23)
- `lucide-react` installed (done — SP1)
- `Menu` compound available (done — SP1 PR 2.8)
- No data model changes, no DB migrations, no new env vars

---

## 12. Next step

After this spec is reviewed and approved, move to the `writing-plans` skill to produce the implementation plan that walks through the 13 commits in §6 with concrete file paths, test names, and LOC estimates.
