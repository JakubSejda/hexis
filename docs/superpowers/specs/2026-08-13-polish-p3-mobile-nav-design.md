# Polish P3 — Mobile Navigation (design)

**Date:** 2026-08-13
**Status:** approved (owner delegated)
**Parent:** `docs/superpowers/specs/2026-06-29-ux-ui-polish-overhaul-design.md` (slice P3 of 5)

**Goal:** mobile stops stranding half the app. Every area is reachable from the bottom nav (4 daily tabs + "Více" sheet), interactive controls hit the 44px touch floor, the dense grids behave on narrow screens, and the app respects iOS safe-area insets.

## Decisions

### 1. BottomNav: 4 daily tabs + "Více" sheet (audit P1 ×2)

- `MOBILE_TABS` = `['dashboard', 'training', 'nutrition', 'habits']` — the daily loops. Progress/Stats/Rewards/Bio/Calendar/Settings move to the sheet (review/occasional surfaces).
- 5th slot = **"Více"** button (lucide `Menu` icon), same bottom-NavLink styling, `aria-expanded` + `aria-haspopup="dialog"`. Shows active (accent) when the current area lives in the sheet, so the user always sees *where they are*.
- **MoreSheet** (`src/components/shell/MoreSheet.tsx`, client): existing `BottomSheet` primitive, title "Více", 2-column grid of area links fed from `AREA_META` — icon + label, `min-h-11` rows, active item accent + `aria-current="page"`. Navigating closes the sheet.
- New export `MORE_AREAS: readonly Area[]` in `area-meta.ts` = `['progress', 'stats', 'rewards', 'bio', 'calendar', 'settings']` (explicit list, same source-of-truth file as MOBILE_TABS).
- Sidebar (`≥md`) unchanged.

### 2. Touch targets ≥44px (audit P2/P3)

- `StepperNav` prev/next: add `min-h-11 py-2` (keep `disabled:opacity-30`).
- `NutritionPageClient` month arrows: `flex h-11 w-11 items-center justify-center`.
- `CalendarHeader` (quest calendar) arrows: same 44px box if smaller today.
- `HabitDailyRow`: `py-2.5` → `py-3` (~44px row).
- Quest/nutrition calendar day cells stay as-is: `aspect-square` cells are ≥44px at ≥360px viewports; the 320px edge case is accepted (documented, not engineered around).

### 3. Responsive grids (audit P2)

- `PhotoGrid`: `grid-cols-3` → `grid-cols-2 sm:grid-cols-3 md:grid-cols-4`.
- `MeasurementGrid` table: `overflow-x-auto` wrapper (if missing) + right-edge gradient fade (`pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent`) as the scroll affordance; fade sits in a `relative` wrapper.

### 4. Safe-area insets (audit P2/P3)

- Root layout `viewport` export: add `viewportFit: 'cover'` (env() vars are all zero without it).
- `AppHeader`: `pt-[env(safe-area-inset-top)]`.
- `BottomSheet` primitive: `pb-8` → `pb-[max(2rem,env(safe-area-inset-bottom))]`.
- `PhotosPageClient` FAB: `bottom-20` → `bottom-[calc(5rem+env(safe-area-inset-bottom))]`.
- `BottomNav` already carries `pb-[env(safe-area-inset-bottom)]` — unchanged.

## Out of scope (explicitly)

Per-screen typography scaling, LifeAreaCard/BioHero/TransformationStrip responsive layout, Dialog→BottomSheet-on-mobile, chart responsiveness, AppHeader label truncation → P4. Collapsed icon-bar sidebar at sm — rejected (More sheet covers reach; icon bar is extra chrome).

## Tests & verification

- `BottomNav.test.tsx` rewritten for the new tab set + Více button opens the sheet (radix portal renders in jsdom).
- New `MoreSheet.test.tsx`: lists all six areas, marks active, closes on navigate.
- `tests/e2e/nav.spec.ts` mobile block: 4 new tabs navigate; More sheet → Progress/Stats navigate.
- Full gate + browser spot-check at 390px: every area reachable via bottom nav, sheet opens/closes, touch targets comfortable.
