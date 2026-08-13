# Polish P3 — Mobile Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 4 daily tabs + "Více" sheet make every area reachable on mobile; 44px touch targets; responsive photo/measurement grids; iOS safe-area support.

**Architecture:** All nav changes flow from `area-meta.ts` (single source of truth). MoreSheet composes the existing `BottomSheet` primitive. Touch-target and safe-area fixes are single-class edits. No business logic.

**Tech Stack:** Next.js App Router, Tailwind v4, Radix Dialog (via BottomSheet), Vitest + RTL, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-13-polish-p3-mobile-nav-design.md`

## Global Constraints

- Branch `polish-p3-mobile-nav` off `main`, one PR.
- Czech copy: new sheet label is **"Více"**; area labels come from `AREA_META` unchanged.
- Consumers import from `@/components/ui` barrel (ESLint guard enforces).
- RTL files need `// @vitest-environment jsdom`.

---

### Task 1: MOBILE_TABS + MORE_AREAS + MoreSheet + BottomNav 5th tab

**Files:**
- Modify: `src/components/shell/area-meta.ts` (MOBILE_TABS, new MORE_AREAS)
- Create: `src/components/shell/MoreSheet.tsx`
- Modify: `src/components/shell/BottomNav.tsx`, `src/components/shell/index.ts` (export MoreSheet if barrel lists components)
- Test: `src/tests/shell/BottomNav.test.tsx` (rewrite), `src/tests/shell/MoreSheet.test.tsx` (new)
- Test: `tests/e2e/nav.spec.ts` mobile block update

**Interfaces:**
- Produces: `MOBILE_TABS = ['dashboard','training','nutrition','habits']`; `MORE_AREAS = ['progress','stats','rewards','bio','calendar','settings']`; `<MoreSheet open onOpenChange activeArea />`.

- [ ] **Step 1: Failing tests** — rewrite `BottomNav.test.tsx`: renders Dashboard/Training/Nutrition/Habits links + "Více" button; `/nutrition` marks Nutrition active; `/progress` marks no link active but Více button gets accent (assert via class or aria); clicking Více renders dialog with Progress/Stats/Rewards/Player Bio/Quest Calendar/Settings links. New `MoreSheet.test.tsx`: renders all six area links; active area has `aria-current="page"`.
- [ ] **Step 2: Run tests → FAIL.**
- [ ] **Step 3: Implement** — area-meta: swap MOBILE_TABS, add `export const MORE_AREAS: readonly Area[] = ['progress','stats','rewards','bio','calendar','settings'] as const`. MoreSheet: BottomSheet + 2-col grid of `next/link`s (icon + label, `min-h-11`, active = `text-accent` + `aria-current`), each link `onClick={() => onOpenChange(false)}`. BottomNav: map MOBILE_TABS via NavLink (unchanged), append `<button>` Více (Menu icon, bottom-NavLink classes, `aria-haspopup="dialog"`, `aria-expanded={open}`, active-accent when `MORE_AREAS.includes(active)`), `useState` for sheet.
- [ ] **Step 4: Tests PASS + typecheck.**
- [ ] **Step 5: Update `tests/e2e/nav.spec.ts`** mobile test: tabs Training→Nutrition→Habits→Dashboard navigate; then Více → Progress link navigates to /progress; Více → Stats → /stats. (E2E not runnable locally per project constraint — keep spec correct.)
- [ ] **Step 6: Commit** `feat(polish): P3 five-slot BottomNav — daily tabs + Více sheet`

### Task 2: Touch targets

**Files:** `src/components/workout/StepperNav.tsx`, `src/components/nutrition/NutritionPageClient.tsx`, `src/components/calendar/CalendarHeader.tsx`, `src/components/habits/HabitDailyRow.tsx`; check `src/tests` for class assertions.

- [ ] StepperNav both buttons: add `min-h-11 py-2` to className (keep `disabled:opacity-30`).
- [ ] NutritionPageClient month arrows: className → `text-muted flex h-11 w-11 items-center justify-center` (keep aria-labels).
- [ ] CalendarHeader arrows: read file; ensure the two arrow buttons have a ≥44px box (`h-11 w-11` if smaller).
- [ ] HabitDailyRow row: `py-2.5` → `py-3`.
- [ ] `npm run typecheck && npm run test:run` → green. Commit `feat(polish): P3 44px touch targets`.

### Task 3: Responsive grids

**Files:** `src/components/photos/PhotoGrid.tsx`, `src/components/measurements/MeasurementGrid.tsx`.

- [ ] PhotoGrid: `grid-cols-3` → `grid-cols-2 sm:grid-cols-3 md:grid-cols-4`.
- [ ] MeasurementGrid: ensure table wrapper `relative overflow-x-auto`; add fade `<div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent" />` inside the relative wrapper, after the scrollable region.
- [ ] Gate green. Commit `feat(polish): P3 responsive photo grid + measurement scroll fade`.

### Task 4: Safe-area insets

**Files:** `src/app/layout.tsx` (viewport export), `src/components/shell/AppHeader.tsx`, `src/components/ui/primitive/BottomSheet.tsx`, `src/components/photos/PhotosPageClient.tsx`.

- [ ] `viewport` export: add `viewportFit: 'cover'`.
- [ ] AppHeader root: add `pt-[env(safe-area-inset-top)]`.
- [ ] BottomSheet: `pb-8` → `pb-[max(2rem,env(safe-area-inset-bottom))]`.
- [ ] FAB: `bottom-20` → `bottom-[calc(5rem+env(safe-area-inset-bottom))]`.
- [ ] Gate green. Commit `feat(polish): P3 safe-area insets`.

### Task 5: Verification + PR

- [ ] `npm run typecheck && npm run lint && npm run test:run` green.
- [ ] Browser at 390×844 (demo login): bottom nav shows 4 tabs + Více; sheet opens with 6 areas; navigate to Rewards + Settings via sheet; habit row/stepper/month-nav targets comfortable; photo grid 2-col.
- [ ] Push + `gh pr create` (title "Polish P3 — Mobile navigation (5-slot BottomNav + Více sheet, touch targets, safe areas)").

## Self-Review

Spec §1 → Task 1; §2 → Task 2; §3 → Task 3; §4 → Task 4; verification → Task 5. MORE_AREAS/MOBILE_TABS names consistent across tasks. No placeholders — CalendarHeader is a read-then-fix with defined criterion (≥44px box).
