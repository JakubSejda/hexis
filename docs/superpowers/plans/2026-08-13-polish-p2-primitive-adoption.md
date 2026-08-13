# Polish P2 — Primitive Adoption Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate every bespoke action button, raw form control and custom badge onto DS primitives; build the missing primitives (Textarea, Checkbox, Radio, NavLink) and 3 additive Button variants; wrap 12 pages in Container/Stack; lock it all with an ESLint guard (also mechanizing §11.2).

**Architecture:** Additive primitive work first (Tasks 1–4, each TDD), then mechanical per-domain migrations (Tasks 5–7), page wrapping (Task 8), the guard last so it verifies the migrations (Task 9), full verification (Task 10). No business-logic changes anywhere; every migrated control keeps its handlers, disabled logic and aria attributes.

**Tech Stack:** Next.js App Router, Tailwind v4 tokens, Vitest + RTL (`// @vitest-environment jsdom` pragma per RTL file), ESLint 9 flat config.

**Spec:** `docs/superpowers/specs/2026-08-13-polish-p2-primitive-adoption-design.md`

## Global Constraints

- Branch: `polish-p2-primitives` off `main`, one PR (project branching convention).
- Czech vocabulary: all user-facing strings stay byte-identical (labels move, never change).
- Imports: consumers/tests import from `@/components/ui` top barrel, never nested paths (§11.2).
- `Stack` gap union is `2|3|4|6|8`; `Container` default size is `md`.
- RTL test files start with `// @vitest-environment jsdom`.
- Every migrated button keeps: its `onClick`/`type`/`disabled` logic, its accessible name, `aria-*`/`role` attrs. `Button` hardcodes `type="button"` default but a passed `type="submit"` wins.
- KEEP list (do NOT migrate these raw `<button>`s — interactive tiles): AnatomicalBodyDual tabs, TimeRangePicker tabs, BeforeAfter pose filter, UploadSheet pose selector, CalendarDay + nutrition/CalendarDay cells, PhotoGrid/PhotoTimeline/TransformationStrip/DayDetailModal thumbnails, DayDetailModal close icon, MeasurementCell/MeasurementRow-date hotspots, workout/ExercisePicker rows, SetRow, PlanPicker plan tile, TierLadder tile, HabitsPageClient archive disclosure, StepperNav prev/next, PhotosPageClient FAB, NutritionPageClient month-nav, RedemptionRow `×`.

---

### Task 1: Button — `outline`, `danger-outline`, `dashed` variants

**Files:**
- Modify: `src/components/ui/primitive/Button.tsx` (Variant union + VARIANT_CLASS)
- Test: `src/tests/ui/primitive/Button.test.tsx`

**Interfaces:**
- Produces: `<Button variant="outline|danger-outline|dashed">` — consumed by Tasks 5–7.
  - `outline: 'border border-border text-foreground hover:bg-surface-raised'`
  - `'danger-outline': 'border border-danger text-danger hover:bg-danger/10'`
  - `dashed: 'border border-dashed border-border text-muted hover:bg-surface-raised'`

- [ ] **Step 1: Write failing tests** — append to the existing `describe` in `Button.test.tsx`:

```tsx
it('applies outline variant (neutral border + foreground text)', () => {
  render(<Button variant="outline">Zrušit</Button>)
  const el = screen.getByRole('button', { name: 'Zrušit' })
  expect(el).toHaveClass('border-border')
  expect(el).toHaveClass('text-foreground')
})

it('applies danger-outline variant', () => {
  render(<Button variant="danger-outline">Smazat</Button>)
  const el = screen.getByRole('button', { name: 'Smazat' })
  expect(el).toHaveClass('border-danger')
  expect(el).toHaveClass('text-danger')
})

it('applies dashed variant', () => {
  render(<Button variant="dashed">+ Přidat cvik</Button>)
  const el = screen.getByRole('button', { name: '+ Přidat cvik' })
  expect(el).toHaveClass('border-dashed')
  expect(el).toHaveClass('text-muted')
})
```

- [ ] **Step 2: Run to verify fail** — `npx vitest run src/tests/ui/primitive/Button.test.tsx` → FAIL (TS: variant not in union / class missing).

- [ ] **Step 3: Implement** — in `Button.tsx`:

```tsx
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline' | 'danger-outline' | 'dashed'
```

and add to `VARIANT_CLASS`:

```tsx
  outline: 'border border-border text-foreground hover:bg-surface-raised',
  'danger-outline': 'border border-danger text-danger hover:bg-danger/10',
  dashed: 'border border-dashed border-border text-muted hover:bg-surface-raised',
```

- [ ] **Step 4: Run to verify pass** — same command → PASS. Then `npm run typecheck`.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/primitive/Button.tsx src/tests/ui/primitive/Button.test.tsx
git commit -m "feat(polish): P2 Button outline/danger-outline/dashed variants"
```

---

### Task 2: Textarea primitive

**Files:**
- Create: `src/components/ui/primitive/Textarea.tsx`
- Modify: `src/components/ui/primitive/index.ts` + top barrel `src/components/ui/index.ts` (match how `Input` is exported)
- Test: `src/tests/ui/primitive/Textarea.test.tsx`

**Interfaces:**
- Produces: `<Textarea label? hint? error? id? className? rows? {...native} />`, forwardRef to `HTMLTextAreaElement`. Consumed by Tasks 5–6. Mirrors `Input`: label renders `<span className="text-muted text-xs font-medium">`, error → `border-danger` + described-by text, `aria-invalid` when error.

- [ ] **Step 1: Write failing tests** — new file with pragma:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { Textarea } from '@/components/ui'

afterEach(cleanup)

describe('Textarea', () => {
  it('renders a textarea with label wired via htmlFor', () => {
    render(<Textarea label="Poznámka" />)
    const el = screen.getByLabelText('Poznámka')
    expect(el.tagName).toBe('TEXTAREA')
    expect(el).toHaveClass('rounded-md')
  })

  it('shows error state (border-danger + aria-invalid + message)', () => {
    render(<Textarea label="Poznámka" error="Povinné pole" />)
    const el = screen.getByLabelText('Poznámka')
    expect(el).toHaveAttribute('aria-invalid', 'true')
    expect(el).toHaveClass('border-danger')
    expect(screen.getByText('Povinné pole')).toBeInTheDocument()
  })

  it('passes native props through (rows, placeholder, value/onChange)', () => {
    render(<Textarea label="Poznámka" rows={4} placeholder="Volitelné" defaultValue="abc" />)
    const el = screen.getByPlaceholderText('Volitelné')
    expect(el).toHaveAttribute('rows', '4')
    expect(el).toHaveValue('abc')
  })

  it('merges className', () => {
    render(<Textarea label="Poznámka" className="min-h-[80px]" />)
    expect(screen.getByLabelText('Poznámka')).toHaveClass('min-h-[80px]')
  })
})
```

- [ ] **Step 2: Run to verify fail** — `npx vitest run src/tests/ui/primitive/Textarea.test.tsx` → FAIL (no export).

- [ ] **Step 3: Implement** — modeled 1:1 on `Input.tsx` (read it first; reuse its label/hint/error JSX structure, drop icons/size/variant):

```tsx
import { forwardRef, useId, type TextareaHTMLAttributes } from 'react'
import { cn } from '../utils/cn'

const BASE =
  'block w-full rounded-md border bg-background p-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50'

type Props = {
  error?: string
  label?: string
  hint?: string
  className?: string
  id?: string
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(function Textarea(
  { error, label, hint, className, id, ...rest }: Props,
  ref
) {
  const autoId = useId()
  const areaId = id ?? autoId
  const descriptionId = `${areaId}-desc`
  const areaEl = (
    <textarea
      ref={ref}
      id={areaId}
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={error || hint ? descriptionId : undefined}
      className={cn(BASE, error ? 'border-danger' : 'border-border', className)}
      {...rest}
    />
  )
  if (!label && !error && !hint) return areaEl
  return (
    <label htmlFor={areaId} className="flex w-full flex-col gap-1">
      {label ? <span className="text-muted text-xs font-medium">{label}</span> : null}
      {areaEl}
      {error ? (
        <span id={descriptionId} className="text-danger text-xs">{error}</span>
      ) : hint ? (
        <span id={descriptionId} className="text-muted text-xs">{hint}</span>
      ) : null}
    </label>
  )
})
```

**Before finalizing, open `Input.tsx` and copy its exact label/error/hint markup + class strings so Textarea is pixel-consistent (the snippet above is the contract; Input's actual wrapper structure wins on any mismatch).** Export from both barrels exactly like `Input`.

- [ ] **Step 4: Run to verify pass** — same command → PASS. `npm run typecheck`.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/primitive/Textarea.tsx src/components/ui/primitive/index.ts src/components/ui/index.ts src/tests/ui/primitive/Textarea.test.tsx
git commit -m "feat(polish): P2 Textarea primitive"
```

---

### Task 3: Checkbox + Radio primitives

**Files:**
- Create: `src/components/ui/primitive/Checkbox.tsx`, `src/components/ui/primitive/Radio.tsx`
- Modify: both barrels
- Test: `src/tests/ui/primitive/Checkbox.test.tsx`, `src/tests/ui/primitive/Radio.test.tsx`

**Interfaces:**
- Produces:
  - `<Checkbox label? id? className? {...native input props} />` — native `type="checkbox"` styled `accent-accent size-5 cursor-pointer`; with `label` renders `<label className="flex items-center gap-2 text-sm">`; without label renders the bare input (caller supplies `aria-label`). forwardRef to `HTMLInputElement`.
  - `<Radio label id? className? {...native} />` — native `type="radio"`, `accent-accent size-4`, label wrapper `flex items-center gap-2 text-sm`. Caller owns `name`/fieldset.
- Consumed by Task 7 (HabitDailyRow, HabitDialog).

- [ ] **Step 1: Write failing tests** — `Checkbox.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Checkbox } from '@/components/ui'

afterEach(cleanup)

describe('Checkbox', () => {
  it('renders native checkbox with label', async () => {
    const onChange = vi.fn()
    render(<Checkbox label="Ranní protein" checked={false} onChange={onChange} />)
    const el = screen.getByRole('checkbox', { name: 'Ranní protein' })
    expect(el).toHaveClass('accent-accent')
    await userEvent.click(el)
    expect(onChange).toHaveBeenCalledOnce()
  })

  it('renders bare input without label (aria-label passes through)', () => {
    render(<Checkbox aria-label="Návyk" />)
    expect(screen.getByRole('checkbox', { name: 'Návyk' })).toBeInTheDocument()
  })
})
```

`Radio.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Radio } from '@/components/ui'

afterEach(cleanup)

describe('Radio', () => {
  it('renders native radio with label and fires onChange', async () => {
    const onChange = vi.fn()
    render(
      <>
        <Radio name="cadence" value="daily" label="Daily" checked onChange={onChange} />
        <Radio name="cadence" value="weekly" label="Weekly" checked={false} onChange={onChange} />
      </>
    )
    const weekly = screen.getByRole('radio', { name: 'Weekly' })
    expect(weekly).toHaveClass('accent-accent')
    await userEvent.click(weekly)
    expect(onChange).toHaveBeenCalled()
  })

  it('respects disabled', () => {
    render(<Radio name="c" value="x" label="Daily" disabled readOnly checked={false} />)
    expect(screen.getByRole('radio', { name: 'Daily' })).toBeDisabled()
  })
})
```

(If `@testing-library/user-event` isn't a dependency, use `fireEvent.click` from RTL instead — check `package.json` first.)

- [ ] **Step 2: Run to verify fail** — both files → FAIL.

- [ ] **Step 3: Implement** — `Checkbox.tsx`:

```tsx
import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../utils/cn'

type Props = {
  label?: string
  className?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'>

export const Checkbox = forwardRef<HTMLInputElement, Props>(function Checkbox(
  { label, className, ...rest }: Props,
  ref
) {
  const input = (
    <input
      ref={ref}
      type="checkbox"
      className={cn('accent-accent size-5 cursor-pointer', className)}
      {...rest}
    />
  )
  if (!label) return input
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      {input}
      <span>{label}</span>
    </label>
  )
})
```

`Radio.tsx` identical shape with `type="radio"` and `size-4`. Barrel-export both.

- [ ] **Step 4: Run to verify pass** — both files PASS; `npm run typecheck`.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/primitive/Checkbox.tsx src/components/ui/primitive/Radio.tsx src/components/ui/primitive/index.ts src/components/ui/index.ts src/tests/ui/primitive/Checkbox.test.tsx src/tests/ui/primitive/Radio.test.tsx
git commit -m "feat(polish): P2 Checkbox + Radio primitives"
```

---

### Task 4: NavLink primitive + Sidebar/BottomNav adoption

**Files:**
- Create: `src/components/ui/primitive/NavLink.tsx`
- Modify: both barrels; `src/components/shell/Sidebar.tsx` (two Link ternaries), `src/components/shell/BottomNav.tsx` (one Link ternary)
- Test: `src/tests/ui/primitive/NavLink.test.tsx`; check `src/tests/shell/*` + `tests/e2e/nav.spec.ts` for markup assertions

**Interfaces:**
- Produces: `<NavLink href active variant icon={Icon}>{label}</NavLink>`; `variant: 'side' | 'bottom'`; sets `aria-current="page"` when active; renders `next/link`.
- Class contract (copied verbatim from current shell code — pixel-identical):
  - side base: `flex items-center gap-2.5 px-4 py-2 text-sm transition-colors`; active: `text-accent border-accent bg-surface border-l-2 pl-[14px]`; inactive: `text-muted hover:bg-surface hover:text-foreground`; icon `h-4 w-4`.
  - bottom base: `flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors`; active: `text-accent`; inactive: `text-muted hover:text-foreground`; icon `h-6 w-6`.

- [ ] **Step 1: Write failing tests**

```tsx
// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { Home } from 'lucide-react'
import { NavLink } from '@/components/ui'

afterEach(cleanup)

describe('NavLink', () => {
  it('side variant, active: aria-current + accent + left border', () => {
    render(<NavLink href="/dashboard" active variant="side" icon={Home}>Dashboard</NavLink>)
    const link = screen.getByRole('link', { name: 'Dashboard' })
    expect(link).toHaveAttribute('aria-current', 'page')
    expect(link).toHaveClass('text-accent')
    expect(link).toHaveClass('border-l-2')
  })

  it('side variant, inactive: muted, no aria-current', () => {
    render(<NavLink href="/training" active={false} variant="side" icon={Home}>Training</NavLink>)
    const link = screen.getByRole('link', { name: 'Training' })
    expect(link).not.toHaveAttribute('aria-current')
    expect(link).toHaveClass('text-muted')
  })

  it('bottom variant: column layout + text-xs', () => {
    render(<NavLink href="/dashboard" active={false} variant="bottom" icon={Home}>Dashboard</NavLink>)
    const link = screen.getByRole('link', { name: 'Dashboard' })
    expect(link).toHaveClass('flex-col')
    expect(link).toHaveClass('text-xs')
  })
})
```

- [ ] **Step 2: Run to verify fail.**

- [ ] **Step 3: Implement**

```tsx
import Link from 'next/link'
import type { ComponentType, ReactNode, SVGProps } from 'react'
import { cn } from '../utils/cn'

type Variant = 'side' | 'bottom'

const BASE: Record<Variant, string> = {
  side: 'flex items-center gap-2.5 px-4 py-2 text-sm transition-colors',
  bottom: 'flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors',
}
const ACTIVE: Record<Variant, string> = {
  side: 'text-accent border-accent bg-surface border-l-2 pl-[14px]',
  bottom: 'text-accent',
}
const INACTIVE: Record<Variant, string> = {
  side: 'text-muted hover:bg-surface hover:text-foreground',
  bottom: 'text-muted hover:text-foreground',
}
const ICON: Record<Variant, string> = { side: 'h-4 w-4', bottom: 'h-6 w-6' }

type Props = {
  href: string
  active: boolean
  variant: Variant
  icon: ComponentType<SVGProps<SVGSVGElement>>
  children: ReactNode
  className?: string
}

export function NavLink({ href, active, variant, icon: Icon, children, className }: Props) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(BASE[variant], active ? ACTIVE[variant] : INACTIVE[variant], className)}
    >
      <Icon className={ICON[variant]} aria-hidden />
      <span>{children}</span>
    </Link>
  )
}
```

Barrel-export. Then replace all three ternary `<Link>` blocks in `Sidebar.tsx` (Life Areas map + Settings) and `BottomNav.tsx` with `<NavLink variant="side"|"bottom" href={meta.href} active={isActive} icon={meta.icon}>{meta.label}</NavLink>`. BottomNav's `<span>{meta.label}</span>` already matches NavLink's internal span.

- [ ] **Step 4: Verify** — `npx vitest run src/tests/ui/primitive/NavLink.test.tsx` PASS; then `grep -rn "aria-current" src/tests tests/e2e` and run any shell/nav test files (`npx vitest run src/tests/shell` if present) — aria-current + labels preserved, so they should stay green. `npm run typecheck`.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/primitive/NavLink.tsx src/components/ui/primitive/index.ts src/components/ui/index.ts src/components/shell/Sidebar.tsx src/components/shell/BottomNav.tsx src/tests/ui/primitive/NavLink.test.tsx
git commit -m "feat(polish): P2 NavLink primitive; Sidebar/BottomNav adopt it"
```

---

### Task 5: Workout domain migration

**Files (all Modify):** `src/components/workout/`: `AdHocAddButton.tsx`, `EditSetSheet.tsx`, `ExerciseStepper.tsx`, `PlanPicker.tsx`, `PlateInventoryForm.tsx`, `RestTimer.tsx`, `SessionSummary.tsx`, `SetInput.tsx`
**Test:** first `grep -rln "AdHocAddButton\|EditSetSheet\|ExerciseStepper\|PlanPicker\|PlateInventoryForm\|RestTimer\|SessionSummary\|SetInput" src/tests tests/e2e` and update anything asserting removed classes/markup; accessible names are unchanged so role/name queries stay green.

**Interfaces:** Consumes Task 1 variants + Task 2 Textarea + existing `Button`, `Pill` from `@/components/ui`.

- [ ] **Step 1: Per-site migration** (keep every handler/disabled/aria; delete the bespoke className):

| Site | Replacement |
|---|---|
| `AdHocAddButton.tsx:13` | `<Button variant="dashed" size="md" className="w-full" onClick={…}>+ Přidat cvik</Button>` |
| `EditSetSheet.tsx:44` save | `<Button variant="success" size="lg" className="flex-1" onClick={…}>Uložit</Button>` |
| `EditSetSheet.tsx:51` delete-trigger | `<Button variant="danger-outline" size="lg" onClick={…}>Smazat</Button>` |
| `EditSetSheet.tsx:69` cancel | `<Button variant="outline" size="lg" className="flex-1" onClick={…}>Zrušit</Button>` |
| `EditSetSheet.tsx:76` delete-confirm | `<Button variant="danger" size="lg" className="flex-1" onClick={…}>Smazat</Button>` |
| `ExerciseStepper.tsx:84` | `<Button variant="success" size="lg" onClick={…}>Dokončit trénink</Button>` |
| `ExerciseStepper.tsx:111` | `<Button variant="outline" size="lg" className="flex-1" onClick={…}>Zrušit</Button>` |
| `ExerciseStepper.tsx:118` | `<Button variant="primary" size="lg" className="flex-1" onClick={…}>Přeskočit</Button>` |
| `PlanPicker.tsx:50` | `<Button variant="dashed" size="lg" className="w-full" onClick={…}>+ Ad-hoc trénink</Button>` |
| `PlanPicker.tsx:42` badge | `<Pill variant="neutral" size="sm" className="ml-2 text-primary">doporučeno</Pill>` |
| `PlateInventoryForm.tsx:49` | `<Button variant="ghost" size="sm" className="text-danger" onClick={…} aria-label={\`Smazat talíř ${…}\`}>smaz</Button>` (derive the aria-label from the row's plate weight variable in scope) |
| `PlateInventoryForm.tsx:58` | `<Button variant="ghost" size="sm" className="self-start text-primary" onClick={…}>+ Pridat talir</Button>` |
| `PlateInventoryForm.tsx:66` | `<Button variant="success" size="lg" onClick={…}>Ulozit</Button>` |
| `RestTimer.tsx:61` | `<Button variant="ghost" size="sm" className="text-muted mt-1 underline" onClick={…}>Přeskočit</Button>` |
| `RestTimer.tsx:70` | `<Button variant="ghost" size="sm" className="text-primary" iconLeft={<Play size={14} aria-hidden />} onClick={…}>Spustit rest ({defaultDurationSec} s)</Button>` — import `Play` from `lucide-react`, drop the `▶` glyph |
| `SessionSummary.tsx:54` | `<Button variant="success" size="lg" loading={saving} onClick={…}>Dokoncit trenink</Button>` (drop the ternary label — `loading` shows the spinner) |
| `SessionSummary.tsx:48` textarea | `<Textarea value={note} onChange={…} placeholder="Poznamka (volitelne)" rows={3} className="min-h-[80px]" />` |
| `SetInput.tsx:38` | `<Button variant="success" size="lg" loading={submitting} disabled={reps === null} iconLeft={<Check size={14} aria-hidden />} className="gap-1" onClick={…}>Zapsat sérii</Button>` — keep `reps === null` explicit |

Keep raw: PlanPicker plan tile (:31), SetRow, StepperNav, workout/ExercisePicker rows.

**Label-vs-loading note:** where the old code swapped the label text while saving (`{saving ? 'Ukladam...' : 'Dokoncit trenink'}`), keep only the base label and let `loading` communicate progress — but if an existing test asserts the "Ukládám…" text, keep the ternary label inside the Button children instead of fighting the test.

- [ ] **Step 2: Verify** — `npm run typecheck && npx vitest run src/tests/workout src/tests/ui 2>/dev/null || npm run test:run` (fall back to full suite if the path filter matches nothing). Fix any class-assertion tests found by the Step-0 grep.

- [ ] **Step 3: Commit**

```bash
git add src/components/workout src/tests
git commit -m "feat(polish): P2 workout domain — Button/Textarea/Pill adoption"
```

---

### Task 6: Forms, dialogs & misc migration

**Files (all Modify):** `src/components/nutrition/DailyModal.tsx`, `src/components/photos/UploadSheet.tsx`, `src/components/settings/ExportClient.tsx`, `src/components/rewards/RewardList.tsx`, `src/components/rewards/RewardDialog.tsx`, `src/components/measurements/MeasurementGrid.tsx`, `src/components/measurements/MeasurementRow.tsx`, `src/components/xp/TierUpModal.tsx`, `src/app/(auth)/login/login-form.tsx`, `src/app/(app)/settings/profile/ProfileFormClient.tsx`, `src/components/anatomy/MuscleRankSection.tsx`
**Test:** `grep -rln "DailyModal\|UploadSheet\|ExportClient\|RewardList\|RewardDialog\|MeasurementGrid\|MeasurementRow\|TierUpModal\|login-form\|ProfileFormClient\|MuscleRankSection" src/tests tests/e2e` first; update class-assertions only.

**Interfaces:** Consumes Tasks 1–2 + existing `Button/Input/Select` from `@/components/ui`.

- [ ] **Step 1: Per-site migration:**

| Site | Replacement |
|---|---|
| `DailyModal.tsx:175` | `<Button variant="success" size="md" className="w-full" onClick={save}>Uložit</Button>` |
| `DailyModal.tsx:167` textarea | `<Textarea value={…} onChange={…} placeholder={…} rows={3} />` (carry over existing placeholder/label text exactly) |
| `UploadSheet.tsx:121` | `<Button variant="success" size="lg" loading={uploading} disabled={!file} onClick={…}>Nahrát</Button>` |
| `ExportClient.tsx:124` | `<Button variant="success" size="lg" disabled={status === 'fetching' \|\| status === 'zipping'} onClick={…}>{label[status]}</Button>` (label map already conveys progress → plain `disabled`, no `loading` spinner duplication) |
| `RewardList.tsx:35` | `<Button variant="primary" size="md" onClick={onCreate}>Vytvoř si první odměnu</Button>` |
| `RewardDialog.tsx:82` textarea | `<Textarea label="Poznámka" value={…} onChange={…} rows={2} />` — reuse the existing label text from the surrounding `<label>`; delete the manual wrapper |
| `MeasurementGrid.tsx:144` | `<Button variant="ghost" size="sm" loading={loadingMore} iconLeft={<ArrowDown size={14} aria-hidden />} className="text-muted gap-1 text-xs" onClick={…}>Načíst starší týdny</Button>` |
| `MeasurementRow.tsx:107` textarea | `<Textarea value={…} onChange={…} rows={2} className="text-xs" />` (keep any onBlur-save handler) |
| `TierUpModal.tsx:35` | `<Button variant="success" size="md" className="mt-6 px-6" onClick={onDismiss}>Pokracovat</Button>` |
| `login-form.tsx:72` | `<Button type="submit" variant="success" size="md" loading={isPending} className="w-full">Přihlásit</Button>` (keep "Přihlašuji…" ternary only if a test asserts it) |
| `MuscleRankSection.tsx:73` | `<Button as="a" href="/training" variant="primary" size="sm">Spustit trénink</Button>` (kills hardcoded `text-white`; keep `next/link`? — `Button as="a"` renders `<a>`: for an internal route use `<Link href="/training" passHref legacyBehavior>`-free approach: simply keep `<Link>` if prefetch matters, styled by Button classes is NOT available → decision: plain `<Button as="a" href>` is fine for this CTA; full-page navigation acceptable) |
| `ProfileFormClient.tsx` | Replace local `Field`+raw controls: text/date/number `<input>`s → `<Input label=… error=… type=… value=… onChange=… />`; gender `<select>` → `<Select label="Pohlaví" error=…>{options}</Select>`; submit (:174) → `<Button type="submit" variant="primary" size="md" loading={saving}>Uložit</Button>`. Keep the exact option values/labels (`—/muž/žena/jiné`) and all `update(...)` handlers. Delete `Field` if unused after migration. |

- [ ] **Step 2: Verify** — `npm run typecheck && npm run test:run`. The login e2e + profile tests query by role/name — labels unchanged.

- [ ] **Step 3: Commit**

```bash
git add src/components src/app src/tests
git commit -m "feat(polish): P2 forms & dialogs — Button/Textarea/Input/Select adoption"
```

---

### Task 7: Habits + remaining selects

**Files (all Modify):** `src/components/habits/HabitDialog.tsx`, `src/components/habits/HabitDailyRow.tsx`, `src/components/progress/ExercisePicker.tsx`, `src/components/photos/BeforeAfter.tsx`
**Test:** `grep -rln "HabitDialog\|HabitDailyRow\|ExercisePicker\|BeforeAfter" src/tests tests/e2e` — habits tests exercise the checkbox by `aria-label` (habit name) and radios by label text; both survive.

**Interfaces:** Consumes Task 3 `Checkbox`/`Radio` + existing `Select`.

- [ ] **Step 1: Per-site migration:**

| Site | Replacement |
|---|---|
| `HabitDialog.tsx:85` cadence radios | `<Radio name="cadence" value={c} label={c === 'daily' ? 'Daily' : 'Weekly'} checked={cadence === c} onChange={() => setCadence(c)} disabled={isEdit} />` inside the existing fieldset/map — delete the manual `<label>` wrapper |
| `HabitDialog.tsx:119` weight radios | same pattern: `<Radio name="weight" value={w} label={w} checked={weight === w} onChange={() => setWeight(w)} className="capitalize" … />` — note the `capitalize` was on the old label; put it on Radio's `className`? **No** — Radio's `className` styles the input; keep `capitalize` by passing the label pre-capitalized? Do NOT change the rendered string: keep the fieldset's surrounding `<div className="flex gap-4">` and let `Radio` render `label={w}`, adding a `labelClassName`? — **Simplest correct move: extend Radio with optional `labelClassName?: string` applied to the label wrapper (additive, add a test line in Task 3's file if you touch the API).** Use `labelClassName="capitalize"`. |
| `HabitDailyRow.tsx:39` | `<Checkbox checked={habit.completedToday} onChange={handleClick} aria-label={habit.name} />` (bare, no `label` — the visible name span stays where it is) |
| `progress/ExercisePicker.tsx:19` | `<Select value={value ?? ''} onChange={(e) => onChange(Number(e.target.value))}>{options}</Select>` — options unchanged |
| `BeforeAfter.tsx:53,65` | both `<select>` → `<Select size="sm" className="flex-1" value={…} onChange={…}>{options}</Select>` — keep the `flex gap-2` row + `→` span |

- [ ] **Step 2: Verify** — `npm run typecheck && npm run test:run` (habits suite is the risk area — its RTL tests click the checkbox/radios).

- [ ] **Step 3: Commit**

```bash
git add src/components/habits src/components/progress src/components/photos src/components/ui src/tests
git commit -m "feat(polish): P2 habits + selects — Checkbox/Radio/Select adoption"
```

---

### Task 8: Pages → Container/Stack

**Files (all Modify):** `src/app/(app)/` pages: `progress/page.tsx`, `training/page.tsx`, `training/[sessionId]/page.tsx`, `rewards/page.tsx`, `habits/page.tsx`, `nutrition/page.tsx`, `stats/page.tsx`, `stats/strength/page.tsx`, `settings/macros/page.tsx`, `settings/plates/page.tsx`, `settings/export/page.tsx`, `progress/photos/page.tsx`

**Interfaces:** Consumes `Container`, `Stack` from `@/components/ui` (existing). Pattern reference: `src/app/(app)/settings/page.tsx` + `dashboard/page.tsx`.

- [ ] **Step 1: Wrap each page** — replace the outer layout div (typically `<div className="space-y-6 p-4">` or similar) with:

```tsx
<Container>
  <Stack gap={6} className="py-4">
    …existing children unchanged…
  </Stack>
</Container>
```

Rules: `Container` default (`md`) everywhere — matches dashboard/settings; map `space-y-N` → nearest valid `Stack` gap (`2|3|4|6|8`); `p-4` → Container brings `px-4 md:px-6`, keep vertical via `className="py-4"` on Stack; if a page has no outer spacing div, wrap its fragment as-is. Do not touch page content/headings.

- [ ] **Step 2: Verify** — `npm run typecheck && npm run test:run && npm run lint`. Visual diff happens in Task 10's browser pass.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)"
git commit -m "feat(polish): P2 wrap all (app) pages in Container/Stack"
```

---

### Task 9: ESLint DS guard (raw controls + §11.2 nested imports)

**Files:**
- Modify: `eslint.config.mjs`

**Interfaces:** Produces lint failures for: nested `@/components/ui/*/*` imports; raw `<select>/<textarea>/<input type="checkbox"|"radio">` JSX — everywhere in `src/**` except `src/components/ui/**`.

- [ ] **Step 1: Add the override block** to `eslint.config.mjs` after the existing entries:

```js
  // Design-system adherence guard (Polish P2). Two rules:
  // 1. §11.2 — consumers import from the @/components/ui barrel, never nested paths.
  // 2. Raw form controls are banned outside the UI kit — use the primitives.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/components/ui/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/components/ui/*/*', '@/components/ui/*/**'],
              message: 'Import from the @/components/ui barrel (spec §11.2).',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXOpeningElement[name.name='select']",
          message: 'Use the Select primitive from @/components/ui.',
        },
        {
          selector: "JSXOpeningElement[name.name='textarea']",
          message: 'Use the Textarea primitive from @/components/ui.',
        },
        {
          selector:
            "JSXOpeningElement[name.name='input']:has(JSXAttribute[name.name='type'] Literal[value='checkbox'])",
          message: 'Use the Checkbox primitive from @/components/ui.',
        },
        {
          selector:
            "JSXOpeningElement[name.name='input']:has(JSXAttribute[name.name='type'] Literal[value='radio'])",
          message: 'Use the Radio primitive from @/components/ui.',
        },
      ],
    },
  },
```

(Flat-config note: this must be a new config object appended to the `defineConfig([...])` array. If `Literal[value=…]` doesn't match the JSX attribute string, the fallback selector is `JSXAttribute[name.name='type'][value.value='checkbox']` inside `:has()` — verify with the scratch test below.)

- [ ] **Step 2: Prove the guard fires** — temporarily add `const x = <textarea />` to any component, run `npm run lint`, expect the new error; revert. Repeat mentally for one nested import (`import { Card } from '@/components/ui/primitive/Card'`) — or trust the rule if the textarea proof worked and the pattern is exercised by Step 3.

- [ ] **Step 3: Run lint on the real tree** — `npm run lint` → must be clean (Tasks 5–7 removed all violations; if anything slips through, fix it now the same way).

- [ ] **Step 4: Commit**

```bash
git add eslint.config.mjs
git commit -m "feat(polish): P2 ESLint DS guard — barrel imports (§11.2) + raw form controls"
```

---

### Task 10: Full verification + browser + PR

**Files:** none (verification only)

- [ ] **Step 1: Gate** — `npm run typecheck && npm run lint && npm run test:run` → all green.

- [ ] **Step 2: Browser spot-check** — dev server `npm run dev -- --port 3002`, demo `demo@hexis.local / Demo1234` (if login fails with CredentialsSignin, run `npm run db:migrate` — dev DB behind on migrations). Check: `/habits` (dialog radios + row checkbox), `/training` → start a session (SetInput button, RestTimer, EditSetSheet), `/nutrition` (DailyModal), `/settings/profile` (full form), `/rewards` (empty-state CTA or dialog), one wrapped page from each group (`/stats`, `/settings/macros`) at 1280px + 390px. Buttons keep accessible names; nothing visually broken.

- [ ] **Step 3: Push + PR**

```bash
git push -u origin polish-p2-primitives
gh pr create --title "Polish P2 — Primitive adoption (Button/Textarea/Checkbox/Radio/NavLink + DS guard)" --body "<summary per spec; link spec>"
```

## Self-Review

- **Spec coverage:** §1 Button variants → Task 1. §2 new primitives → Tasks 2–4. §3 migration map: workout → Task 5; forms/dialogs/badges → Task 6; habits/selects → Task 7; KEEP list → Global Constraints. §4 pages → Task 8. §5 guard → Task 9. Verification → Task 10. Covered.
- **Placeholder scan:** every migration row carries exact target JSX; ExportClient loading-vs-disabled decided (disabled); HabitDialog capitalize resolved (labelClassName additive prop); ProfileFormClient scope explicit. The "check grep first" steps have defined follow-ups. Clean.
- **Type consistency:** variant names `outline`/`danger-outline`/`dashed` (Task 1) match Tasks 5–7 usage. `Textarea` props (label/hint/error/rows) match Task 5–6 call sites. `Checkbox`/`Radio` props match Task 7. `NavLink` props (href/active/variant/icon) match Task 4 adoption. Consistent.
