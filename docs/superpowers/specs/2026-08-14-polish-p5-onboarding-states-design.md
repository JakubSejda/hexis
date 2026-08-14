# Polish P5 — Onboarding & states (design)

**Date:** 2026-08-14
**Status:** approved (owner delegated)
**Parent:** `docs/superpowers/specs/2026-06-29-ux-ui-polish-overhaul-design.md` (slice P5 of 5 — final)

**Goal:** a new user is guided, not dumped on an empty dashboard; every async surface has a skeleton instead of `Načítám…` text; app-level errors have a boundary with retry; empty states point at the next action.

## Decisions

### 1. First-run onboarding (audit P0)

- **Gate:** new nullable `users.onboarded_at` (migration 0006, drizzle-kit generate) with manual backfill `UPDATE users SET onboarded_at = created_at WHERE onboarded_at IS NULL` appended to the generated SQL — existing users (incl. demo) never see the wizard.
- **Redirect:** dashboard server page: `if (!user.onboardedAt) redirect('/onboarding')`. Only the dashboard gates (login lands there); deep links stay usable.
- **Route:** `src/app/(app)/onboarding/page.tsx` (server; already-onboarded → redirect `/dashboard`) + `src/components/onboarding/OnboardingWizard.tsx` (client). Lives inside the app shell — no special layout.
- **Wizard, 3 steps** (dots progress, Zpět/Pokračovat, top-right Přeskočit):
  1. **Vítej v Hexis** — pitch: trénink, návyky a progres jako RPG; XP za skutečnou práci.
  2. **Profil** — Jméno / Výška (cm) / Cíl (kg), all optional, saved via existing `PUT /api/user/profile` on continue.
  3. **První quest** — text + primary CTA `Otevřít Training` (completes + routes to `/training`); `Dokončit` routes to `/dashboard`.
- **Completion API:** `POST /api/user/onboarded` → sets `onboarded_at = NOW()` if null, 200 `{ ok: true }`. Both `Přeskočit` and step-3 actions call it.
- **Czech vocab (locked):** Vítej v Hexis / Pokračovat / Zpět / Přeskočit / Dokončit / Jméno / Výška (cm) / Cíl (kg) / Vyber si svůj první quest / Otevřít Training.

### 2. Empty-state CTAs (audit P2)

- **Calendar** empty user: under the existing sentence add three outline/sm buttons — `Začni trénink` → /training, `Vytvoř návyk` → /habits, `Zapiš váhu` → /progress (`Button as="a"`).
- **Habits** empty: drop the premature gesture hint (`Tap = check, drž = vrátit zpět.`) from the empty state — it moves to the list view only (where rows exist). Existing hint line under the list stays as-is if already there; otherwise render it above the daily list.
- **Rewards**: hide the header `+ Nová odměna` button when the reward list is empty — the EmptyState CTA is the single entry point (audit flagged the duplication).

### 3. Loading skeletons (audit P1)

- New `src/app/(app)/loading.tsx`: Container + Skeleton stack (text + 3 card shapes) — route-level fallback for every (app) navigation.
- Replace inline `Načítám…` text: ExerciseStepper Suspense fallback → 2 Skeleton cards; PhotosPageClient → Skeleton card grid; StrengthPageClient → Skeleton block. (Settings/macros loading state got Container in P2 — leave.)

### 4. Error boundary + retry (audit P1)

- New `src/app/(app)/error.tsx` (`'use client'`): Card with `Něco se pokazilo` + muted detail line + `Button` `Zkusit znovu` calling `reset()`.

### 5. Login branding (audit P1, minimal cut)

- Login heading `Hexis — Login` → brand block: `HEXIS` (accent, tracking-wide, bold) + tagline `Tvoje cesta. Tvoje XP.` — no logo asset, no layout rework.

## Out of scope
Toast strategy overhaul, password recovery, habit-check success toast, plan-selection step inside the wizard (Training page already handles it), tier tokens & other post-initiative parked items.

## Verification
Migration applied to dev + test DBs; full gate; new tests (onboarded API, wizard steps + skip, error boundary render, calendar CTA); browser: fresh user → wizard → dashboard; demo user unaffected.
