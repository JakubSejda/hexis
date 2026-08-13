# Polish P2 — Primitive Adoption (design)

**Date:** 2026-08-13
**Status:** approved (owner delegated: "nechám to na tobě")
**Parent:** `docs/superpowers/specs/2026-06-29-ux-ui-polish-overhaul-design.md` (slice P2 of 5)

**Goal:** the design system stops being bypassed. Every hand-rolled action button, raw form control and custom badge migrates to a DS primitive; the primitives that were missing (Textarea, Checkbox, Radio, NavLink) get built; every `(app)` page sits in `Container`/`Stack`; and an ESLint guard makes the whole class of regressions impossible (also closing the parked §11.2 nested-import follow-up).

## Inventory (from 2026-08-13 code sweep, post-P1)

- **48 raw `<button>`** in 34 files: **24 migrate** to `Button`, 24 stay (interactive tiles/cells/tabs/thumbnails/FAB/icon-only hotspots where `Button` doesn't fit — those are P3/P4 territory).
- **12 raw form-control sites**: 4 textareas, 4 selects (+1 select in ProfileFormClient), 2 radio groups, 1 checkbox — plus ProfileFormClient's raw `<input>`s.
- **12 `(app)` pages** render without `Container` (raw `<div className="space-y-6 p-4">` etc.).
- Badge drift: PlanPicker "doporučeno" span → `Pill`; MuscleRankSection CTA `<Link>` styled as a button → `Button as="a"`.

## Decisions

### 1. Button — three additive variants (no API breaks)

Migration killed most `className` overrides only if these exist:

```tsx
outline:          'border border-border text-foreground hover:bg-surface-raised',
'danger-outline': 'border border-danger text-danger hover:bg-danger/10',
dashed:           'border border-dashed border-border text-muted hover:bg-surface-raised',
```

- `outline` = neutral cancel/secondary-neutral ("Zrušit" ×2 and similar). Existing `secondary` (emerald outline) stays untouched.
- `danger-outline` = EditSetSheet's outlined "Smazat" (delete-confirm trigger).
- `dashed` = "add" affordance (`+ Přidat cvik`, `+ Ad-hoc trénink`).
- **Height normalization:** bespoke `h-11`/`py-2.5` buttons normalize to the size ladder (`lg` h-12 for sheet/primary actions, `md` h-10 for dialog actions). Deliberate visual change, consistent with P1's radius ladder.
- **NOT added:** `link`/underline variant (1 site — RestTimer keeps a `className` underline override; workout flow is P4), icon-only size (icon-only buttons stay raw; P3/P4).

### 2. New primitives (all in `src/components/ui/primitive/`, barrel-exported)

- **`Textarea`** — mirrors `Input` API: `label/hint/error/id/className` + native textarea attrs, same BASE (`rounded-md border bg-background focus:ring-2 focus:ring-ring`), `min-h` via `rows`. No size prop (textareas scale by rows).
- **`Checkbox`** — native `<input type="checkbox">` styled via `accent-accent size-5 cursor-pointer`, optional `label` (renders `<label>` wrapper with `gap-2 text-sm`), forwardRef, `id` fallback to `useId`. Native input keeps full RTL/a11y semantics.
- **`Radio`** — same approach as Checkbox (`accent-accent size-4`), `label` required in practice; group semantics (fieldset/legend, `name`) stay at the call site — no RadioGroup abstraction for 2 consumers (YAGNI).
- **`NavLink`** — centralizes the active/inactive ternary duplicated across Sidebar (×2) and BottomNav. Wraps `next/link`; props: `href`, `active: boolean`, `variant: 'side' | 'bottom'`, `icon: LucideIcon`, `children`, `className?`. Sets `aria-current="page"` when active. Variant classes copied verbatim from the current Sidebar/BottomNav ternaries (P1 values: `text-xs`, `h-6 w-6` icons in bottom variant) — pixel-identical, pure extraction.

### 3. Migration map (exact, from classified sweep)

**Buttons → `Button`** (24 sites): ProfileFormClient submit → `primary/md` + `loading`; login-form submit → `success/md/w-full` + `loading`; MeasurementGrid load-more → `ghost/sm` + `loading`; DailyModal save → `success/md/w-full`; UploadSheet upload → `success/lg` + `loading` + explicit `disabled={!file}`; RewardList empty-CTA → `primary/md`; ExportClient → `success/lg` + `disabled` during fetch/zip; AdHocAddButton → `dashed/md/w-full`; EditSetSheet save `success/lg/flex-1`, delete-trigger `danger-outline/lg`, cancel `outline/lg/flex-1`, delete-confirm `danger/lg/flex-1`; ExerciseStepper finish `success/lg`, cancel `outline/lg/flex-1`, skip `primary/lg/flex-1`; PlanPicker ad-hoc → `dashed/lg/w-full`; PlateInventoryForm smaz `ghost/sm/text-danger`, přidat `ghost/sm/text-primary`, uložit `success/lg`; RestTimer skip `ghost/sm` + underline override, start `ghost/sm/text-primary` + lucide `Play` iconLeft (replaces `▶` glyph); SessionSummary finish → `success/lg` + `loading`; SetInput → `success/lg` + `loading` + explicit `disabled={reps === null}` + `Check` iconLeft; TierUpModal → `success/md`.

**KEEP as raw `<button>`** (24): segmented tabs (AnatomicalBodyDual, TimeRangePicker, BeforeAfter pose filter, UploadSheet pose selector), calendar/nutrition day cells, photo thumbnails (PhotoGrid, PhotoTimeline, TransformationStrip, DayDetailModal), table-cell hotspots (MeasurementCell, MeasurementRow date), list rows (ExercisePicker workout, SetRow, PlanPicker plan tile), TierLadder tile, HabitsPageClient archive disclosure, StepperNav prev/next (custom `disabled:opacity-30`), PhotosPageClient FAB, NutritionPageClient month-nav icons, DayDetailModal close icon, RedemptionRow `×`.

**Form controls:** progress/ExercisePicker + BeforeAfter ×2 + ProfileFormClient gender → `Select`; SessionSummary + DailyModal + MeasurementRow + RewardDialog textareas → `Textarea`; HabitDialog cadence+obtížnost radios → `Radio` (fieldset stays); HabitDailyRow checkbox → `Checkbox` (unlabeled variant — visible label span stays as-is, `aria-label` moves onto the primitive). ProfileFormClient's raw text/date/number `<input>`s → `Input` primitive; local `Field` wrapper stays only if error layout needs it, else `Input`'s own `label`/`error`.

**Badges:** PlanPicker `doporučeno` span → `Pill variant="neutral" size="sm" className="ml-2 text-primary"`; MuscleRankSection `Spustit trénink` Link → `Button as="a" href="/training" variant="primary" size="sm"` (also kills hardcoded `text-white`). AppHeader avatar-trigger & streak text stay (P4).

### 4. Pages → Container/Stack (12 pages)

All follow the existing pattern (`settings/page.tsx`, `dashboard`): `<Container>` (default `md`) + `<Stack gap={6} className="py-4">` replacing `space-y-6 p-4` divs. Pages: progress, training, training/[sessionId], rewards, habits, nutrition, stats, stats/strength, settings/macros, settings/plates, settings/export, progress/photos. Valid `Stack` gaps are `2|3|4|6|8`.

### 5. ESLint guard (regression lock + §11.2)

New override block in `eslint.config.mjs`, scoped to `src/**` excluding `src/components/ui/**`:

- `no-restricted-imports`: patterns `@/components/ui/*/*` → "import from the @/components/ui barrel" (mechanizes the grep-only §11.2 guard; already 0 violations).
- `no-restricted-syntax` on JSX: `<select>`, `<textarea>`, `<input type="checkbox">`, `<input type="radio">` → "use the Select/Textarea/Checkbox/Radio primitive".
- Raw `<button>` is **not** banned (interactive tiles are legitimate); the guard covers the mechanically-detectable classes.
- Runs via existing `npm run lint` → covered by the pre-push hook. (GH Actions CI remains a separate parked follow-up.)

## Out of scope (explicitly)

Mobile nav restructure + touch targets (P3); icon-only Button size, per-screen hierarchy, AppHeader badge polish, workout-flow feedback (P4); onboarding/empty/error states (P5); FormGroup/DialogActions/DataTable-for-measurements from the audit (not in the P2 scope line — reconsider in P4).

## Verification

1. `typecheck` + `lint` + full suite green; new primitives get RTL tests; migrated components' existing tests updated where they assert classes/markup.
2. Guard proof: a scratch violation of each new rule fails lint, then is removed.
3. Browser spot-check (dev :3002, demo user): habits dialog radios/checkbox, a workout flow sheet, nutrition daily modal, settings/profile form, one wrapped page per group — nothing visually broken, buttons keep accessible names.
