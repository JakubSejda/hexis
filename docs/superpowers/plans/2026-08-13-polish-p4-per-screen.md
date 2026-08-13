# Polish P4 — Per-screen polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** micro-type sweep, perceptible state tints + elevation on hand-rolled cards, muted-strong adoption, visible workout skip/finish + prominent rest timer, inline reward shortfall, responsive bio leftovers.

**Architecture:** Class-level edits + one small JSX addition (skip/finish row in ExerciseStepper). No logic changes; long-press skip stays as a secondary path.

**Spec:** `docs/superpowers/specs/2026-08-13-polish-p4-per-screen-design.md`

## Global Constraints

- Branch `polish-p4-per-screen` off `main`, one PR. Czech copy unchanged except the new visible labels: `Přeskočit cvik`, `Dokončit trénink` (existing vocab), `Chybí {n} XP` (existing vocab, surfaced from title). Valid Stack gaps 2|3|4|6|8.

### Task 1: Micro-type sweep
- [ ] Python sweep: `text-[10px]` → `text-xs`, `text-[11px]` → `text-xs` in `src/components/**` and `src/app/**` (29 sites; skip src/tests until assertions checked). StatusWindow: `tracking-[0.3em]` → `tracking-[0.15em]`.
- [ ] `grep -rn "text-\[10px\]\|text-\[11px\]" src/tests tests/e2e` — update matching assertions.
- [ ] Gate + commit `feat(polish): P4 micro-type sweep — text-[10px]/[11px] → text-xs`.

### Task 2: State tints, elevation, badge/streak fixes
- [ ] TodayQuest ×3 Links: `bg-accent/10 hover:bg-accent/15` → `bg-accent/15 hover:bg-accent/25` + append `shadow-md hover:shadow-lg transition-shadow` (replace `transition-colors` with `transition-all`). Rest-day card: add `shadow-md`.
- [ ] StagnationWarning: `bg-accent/5` → `bg-accent/15`, add `shadow-sm`.
- [ ] LifeAreaCard: add `shadow-md hover:shadow-lg`, `transition-colors` → `transition-all`; value `text-2xl` → `text-xl sm:text-2xl`.
- [ ] HabitDailyRow badge: `bg-black/5 text-muted-foreground` → `bg-surface-raised text-muted`.
- [ ] AppHeader streak span → `<Pill variant="warning" size="sm" className="hidden md:inline-flex">{streak} day streak</Pill>`.
- [ ] SetRow: `bg-border` → `bg-surface-raised`.
- [ ] Gate + commit `feat(polish): P4 state tints + elevation on hand-rolled cards`.

### Task 3: muted-strong adoption
- [ ] StatusWindow XP row, VitalsStrip values, LifetimeTotals values, DailyModal `Stat` value + MonthStats value: `text-muted` → `text-muted-strong` on *values* only (labels stay muted). Read each file; if a value is already `text-foreground`, leave it.
- [ ] Gate + commit `feat(polish): P4 muted-strong for key secondary values`.

### Task 4: Workout flow feedback
- [ ] ExerciseStepper: root `flex flex-col gap-4 p-4` → `flex flex-col gap-4` (both return paths); under StepperNav render a `flex gap-2` row: `<Button variant="outline" size="md" className="flex-1" onClick={() => setSkipOpen(true)}>Přeskočit cvik</Button>` + non-last `<Button variant="outline" size="md" className="flex-1" onClick={onFinish}>Dokončit trénink</Button>`; last step keeps the existing success/lg finish button (skip row still shows the skip half).
- [ ] RestTimer: countdown `text-2xl` → `text-4xl`; container `bg-border rounded-lg p-3` → `bg-surface-raised border-border border shadow-sm rounded-lg p-3`.
- [ ] StepperNav container: `text-xs` → `text-sm`.
- [ ] Gate + commit `feat(polish): P4 workout flow — visible skip/finish, prominent rest timer`.

### Task 5: Reward shortfall + responsive bio
- [ ] RewardCard: alongside the disabled redeem Button render `{cantAfford ? <span className="text-danger text-xs">Chybí {missing} XP</span> : null}` (keep title attr).
- [ ] TransformationStrip: `grid-cols-2` (Then/Now block) → `grid-cols-1 sm:grid-cols-2`.
- [ ] BioHero: root `flex items-center gap-4` → `flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4` (verify actual classes in file).
- [ ] Gate + commit `feat(polish): P4 reward shortfall inline + responsive bio`.

### Task 6: Verification + PR
- [ ] Full gate; browser: dashboard tints, workout skip/finish + timer, /bio 390px, rewards insufficient state. Push + PR.

## Self-Review
Spec §1→T1, §2→T2, §3→T3, §4→T4, §5+§6→T5. All class strings verified against current source (read during recon). No placeholders.
