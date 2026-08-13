# Polish P4 — Per-screen polish (design)

**Date:** 2026-08-13
**Status:** approved (owner delegated)
**Parent:** `docs/superpowers/specs/2026-06-29-ux-ui-polish-overhaul-design.md` (slice P4 of 5)

**Goal:** the per-screen leftovers the foundation slices exposed: kill remaining ad-hoc micro-type, make state tints perceptible and hand-rolled cards match Card elevation, adopt `--color-muted-strong` for important secondary values, and make the workout flow's feedback loop visible (skip/finish affordances, prominent rest timer).

## Decisions

### 1. Micro-type sweep (audit Typography P2s)
All remaining `text-[10px]`/`text-[11px]` (29 sites) → `text-xs`. Tracking/uppercase treatments stay. `StatusWindow` tier name: `tracking-[0.3em]` → `tracking-[0.15em]` (audit: excessive letter-spacing at small size). RegionHeader→`Heading variant="region"` consolidation **rejected** — region variant is `font-mono`, RegionHeader deliberately isn't; the ≥12px floor is the actual fix.

### 2. State tints + card elevation on hand-rolled cards (audit Color P1/P2)
- `TodayQuest` active/scheduled/no-plan: `bg-accent/10 hover:bg-accent/15` → `bg-accent/15 hover:bg-accent/25` + `shadow-md hover:shadow-lg transition-shadow` (was imperceptible ~2% luminance tint, no elevation).
- `StagnationWarning`: `bg-accent/5` → `bg-accent/15`, add `shadow-sm`.
- `LifeAreaCard`: add `shadow-md hover:shadow-lg` (matches Card primitive); value `text-2xl` → `text-xl sm:text-2xl` (mobile 2-col grid overflow, audit Mobile P2).
- `HabitDailyRow` weight badge: `bg-black/5 text-muted-foreground` → `bg-surface-raised text-muted` — **`text-muted-foreground` is not a token in this codebase** (shadcn-ism, generates nothing); the badge was near-invisible.
- `AppHeader` streak → `Pill variant="warning" size="sm"` (`hidden md:inline-flex`).
- `SetRow`: `bg-border` → `bg-surface-raised` (semantic surface, not border color as fill).

### 3. `--color-muted-strong` adoption (deferred here from P1)
Important secondary *values* (not labels): StatusWindow XP row, VitalsStrip values, LifetimeTotals values, DailyModal/MonthStats stat values — `text-muted` → `text-muted-strong` where the content is a number the user actually reads. Labels stay `text-muted`.

### 4. Workout flow feedback (audit UX P1/P2)
- **Visible skip**: long-press-to-skip stays, but a visible `Přeskočit cvik` button (outline/md) appears under the stepper — the gesture was undiscoverable.
- **Finish anytime**: `Dokončit trénink` shows on every step — success/lg on the last exercise (unchanged), outline/md elsewhere, side-by-side with skip.
- **Prominent rest timer**: countdown `text-2xl` → `text-4xl`; container `bg-border` → `bg-surface-raised border border-border shadow-sm`.
- **StepperNav legibility**: container `text-xs` → `text-sm`.
- ExerciseStepper drops its own `p-4` (Container owns the gutter since P2/P3 — double-padding leftover).

### 5. Gamification context (audit UX P2, minimal cut)
`RewardCard`: insufficient balance shows inline `Chybí {missing} XP` (danger, xs) instead of hiding it in a `title` tooltip (unreachable on touch). Button stays disabled.

### 6. Responsive leftovers parked from P3
`TransformationStrip` Then/Now: `grid-cols-2` → `grid-cols-1 sm:grid-cols-2`. `BioHero`: stacks on mobile (`flex-col sm:flex-row`).

## Out of scope
Onboarding, empty/error/loading states, toast strategy (P5). Tier color tokens, Dialog→BottomSheet on mobile, NumberInput mobile keyboards, login-page branding — parked (post-initiative or P5 if cheap). Tabular-nums already global since P1.

## Verification
Full gate; existing tests updated only where class assertions change. Browser spot-check: dashboard (tints/elevation), active workout (skip+finish visible, timer prominent), /bio at 390px, rewards insufficient state.
