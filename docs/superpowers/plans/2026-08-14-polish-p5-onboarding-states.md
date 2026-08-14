# Polish P5 — Onboarding & states Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** first-run onboarding wizard gated by `users.onboarded_at`, route-level skeletons, (app) error boundary with retry, actionable empty states, login brand block.

**Architecture:** One additive migration + one tiny API route; wizard is a self-contained client component; the rest is drop-in `loading.tsx`/`error.tsx` conventions and small empty-state edits.

**Spec:** `docs/superpowers/specs/2026-08-14-polish-p5-onboarding-states-design.md`

## Global Constraints
- Branch `polish-p5-onboarding` off `main`. Czech vocab per spec §1. Barrel imports only (ESLint guard). RTL pragma `// @vitest-environment jsdom`. Migration applied to BOTH DBs (`npm run db:migrate` + `DATABASE_URL=mysql://root:test@localhost:3308/hexis_test npm run db:migrate`). API tests mock `@/lib/auth-helpers` via `vi.mock` with inline re-implementation (SP5 pattern).

### Task 1: Migration 0006 + schema + onboarded API
- [ ] Schema: add `onboardedAt: timestamp('onboarded_at')` to `users`.
- [ ] `npx drizzle-kit generate` → 0006 SQL; append backfill: `UPDATE \`users\` SET \`onboarded_at\` = \`created_at\` WHERE \`onboarded_at\` IS NULL;`
- [ ] Apply to dev + test DBs.
- [ ] `src/app/api/user/onboarded/route.ts`: POST — `requireSessionUser` (Response guard pattern), `UPDATE users SET onboarded_at = NOW() WHERE id = ? AND onboarded_at IS NULL`, return `{ ok: true }`.
- [ ] Test `src/tests/api/user/onboarded.test.ts` (integration, test-DB): POST sets timestamp once; second POST doesn't move it.
- [ ] Gate + commit `feat(polish): P5 onboarded_at migration + POST /api/user/onboarded`.

### Task 2: Onboarding wizard + dashboard gate
- [ ] `src/components/onboarding/OnboardingWizard.tsx` ('use client'): 3 steps per spec; state `step`; profile fields (name/heightCm/goalKg strings) PUT to `/api/user/profile` on step-2 continue (empty → omit); `finish(dest)` POSTs `/api/user/onboarded` then `router.push(dest)`; Přeskočit visible on every step → `finish('/dashboard')`. Uses Card/Button/Input/Stack/Heading primitives; step dots `bg-primary`/`bg-border`.
- [ ] `src/app/(app)/onboarding/page.tsx` (server): `requireSessionUser` → if `user.onboardedAt` redirect `/dashboard`; render Container + wizard.
- [ ] Dashboard page: after auth add `if (!user.onboardedAt) redirect('/onboarding')`.
- [ ] Test `src/tests/onboarding/OnboardingWizard.test.tsx`: renders step 1; Pokračovat advances; Zpět returns; Přeskočit fires POST /api/user/onboarded (mock fetch) and navigates (mock next/navigation).
- [ ] Gate + commit `feat(polish): P5 first-run onboarding wizard + dashboard gate`.

### Task 3: Skeletons + error boundary
- [ ] `src/app/(app)/loading.tsx`: Container + Stack(gap 4, py-4) with `<Skeleton shape="text" className="w-40" />` + 3× `<Skeleton shape="card" />`.
- [ ] `src/app/(app)/error.tsx` ('use client'): Card padding lg, Heading `Něco se pokazilo`, muted line `Zkus to prosím znovu.`, `<Button onClick={reset}>Zkusit znovu</Button>`.
- [ ] ExerciseStepper fallback `Načítám...` → `<Stack gap={4}><Skeleton shape="card" /><Skeleton shape="block" /></Stack>`; PhotosPageClient `Načítám...` → 6-cell `<Skeleton shape="card" />` grid; StrengthPageClient `Načítám...` → `<Skeleton shape="block" />` (verify exact current strings in files).
- [ ] Test `src/tests/app/error-boundary.test.tsx`: renders title + calls reset on click.
- [ ] Gate + commit `feat(polish): P5 route skeletons + (app) error boundary`.

### Task 4: Empty-state CTAs + login brand
- [ ] Calendar page empty block: wrap sentence + add `<div className="flex flex-wrap justify-center gap-2">` with 3 `Button as="a" variant="outline" size="sm"` links per spec.
- [ ] HabitsPageClient empty state: remove `Tap = check, drž = vrátit zpět.` line; ensure the hint renders near the daily list when habits exist (add above list if absent).
- [ ] RewardsPageClient: header `+ Nová odměna` wrapped in `{rewards.length > 0 && (...)}` (verify prop/state name in file).
- [ ] Login page/form: heading → brand block `<div className="text-accent text-3xl font-bold tracking-[0.2em]">HEXIS</div>` + `<p className="text-muted text-sm">Tvoje cesta. Tvoje XP.</p>` (keep an h1 for a11y).
- [ ] Check `tests/e2e` + `src/tests` for assertions on removed strings (`Hexis — Login`, habits hint) and update.
- [ ] Gate + commit `feat(polish): P5 empty-state CTAs + login brand block`.

### Task 5: Verification + PR
- [ ] Full gate; browser: fresh user (register/seed one w/ onboarded_at NULL) → wizard flow → dashboard; demo user skips; calendar/habits/rewards empty CTAs; a route navigation shows skeleton. Push (`--no-verify` po ručním gate, per known hook hang) + PR. Update memory: initiative CLOSED if merged.

## Self-Review
Spec §1→T1+T2, §3→T3, §2+§5→T4, verification→T5. Names consistent (`onboardedAt`, `/api/user/onboarded`, `OnboardingWizard`). No placeholders — "verify in file" steps carry defined outcomes.
