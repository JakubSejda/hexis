# Polish P1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lift every screen at once by fixing the foundation — load a real webfont (Geist Sans), fix WCAG-failing muted contrast, give cards real elevation, tokenize calendar colors, align radii, add tabular numerals, and make shared shell text legible — all via token/primitive edits, no per-page rewrites.

**Architecture:** Pure design-token and shared-primitive changes. Edits concentrate in `src/app/globals.css`, `src/app/layout.tsx`, and a handful of `src/components/ui/` primitives + 3 shell/calendar/dashboard components. No business logic changes.

**Tech Stack:** Next.js (App Router), Tailwind v4 (`@theme` tokens → utilities), TypeScript, `geist` font package (already installed), Vitest + RTL.

## Global Constraints

- **Font:** Geist Sans only (no separate display font). Wire via `geist/font/sans` exactly like the existing `geist/font/mono`.
- **Branching:** this slice ships as its own PR off `main` (branch `polish-p1-foundation`, already created).
- **No logic changes:** P1 is tokens + shared primitives. Per-component `text-[10px]` cleanup, bespoke-button migration, mobile-nav restructure, onboarding = later slices (P2–P5), out of scope.
- **Czech vocabulary:** unchanged — P1 touches no user-facing copy.
- **Tailwind v4:** `--color-*` tokens generate `bg-*/text-*/border-*` utilities; `--shadow-*` tokens generate `shadow-*` utilities; `--radius-*` back `rounded-*`. Tokens live in the `@theme` block of `globals.css`.

> **Testing note for this slice:** much of P1 is visual (font loading, color values, shadows) and cannot be unit-tested meaningfully. Where a change is assertable via a component's class/attribute, the task updates or adds that assertion. Otherwise the verification is: full suite stays green + the in-browser check in Task 6. **Do not fabricate fake unit tests for pure-CSS changes.**

---

### Task 1: Load Geist Sans

**Files:**
- Modify: `src/app/layout.tsx:1-2,30` (add import + html className)
- Modify: `src/app/globals.css:33-35` (`--font-sans`)

**Interfaces:**
- Consumes: `GeistSans` from `geist/font/sans` (exposes `.variable` = `--font-geist-sans`), mirroring the existing `GeistMono` from `geist/font/mono`.
- Produces: body renders in Geist Sans app-wide.

- [ ] **Step 1: Add the GeistSans import**

In `src/app/layout.tsx`, add below the existing mono import (line 2):

```tsx
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
```

- [ ] **Step 2: Register the font variable on `<html>`**

Change the `<html>` tag (currently `className={`${GeistMono.variable} dark`}`) to:

```tsx
<html lang="cs" className={`${GeistSans.variable} ${GeistMono.variable} dark`}>
```

- [ ] **Step 3: Point `--font-sans` at the loaded variable**

In `src/app/globals.css`, replace the `--font-sans` declaration (lines 33-35) with:

```css
  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
```

- [ ] **Step 4: Verify it compiles and the suite is unaffected**

Run: `npm run typecheck && npm run test:run`
Expected: typecheck clean; tests still green (no test asserts the font stack). In-browser font verification happens in Task 6.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "feat(polish): P1 load Geist Sans webfont"
```

---

### Task 2: Foundation color, elevation & numeral tokens

**Files:**
- Modify: `src/app/globals.css` (`@theme` tokens + `body` rule)
- Modify: `src/components/ui/primitive/Sparkline.tsx:19` (hardcoded muted literal)
- Test: `src/tests/ui/primitive/Sparkline.test.tsx:22`

**Interfaces:**
- Produces: `--color-muted` (#9ca3af), `--color-muted-strong` (#cbd5e1), `--color-border` (#2d3b4f), `--color-cal-habit/weigh/photo`, `--shadow-sm/md/lg`. These generate `text-muted`, `text-muted-strong`, `border-border`, `bg-cal-habit|weigh|photo`, `shadow-sm|md|lg` utilities consumed by Tasks 3–5.

- [ ] **Step 1: Update the contrast/surface tokens**

In `src/app/globals.css`, change these lines in `@theme`:

```css
  --color-border:           #2d3b4f;   /* was #1f2733 — visible card edges */
  --color-foreground:       #e5e7eb;
  --color-muted:            #9ca3af;   /* was #6b7280 — WCAG AA ~4.6:1 */
  --color-muted-strong:     #cbd5e1;   /* new — important secondary values (used by P4) */
```

- [ ] **Step 2: Add calendar signal tokens**

In `@theme`, after the `--color-info` line, add:

```css
  /* Calendar day signals (training stays --color-accent) */
  --color-cal-habit:        #10b981;
  --color-cal-weigh:        #38bdf8;
  --color-cal-photo:        #a78bfa;
```

- [ ] **Step 3: Add shadow elevation tokens**

In `@theme`, after the radius block, add:

```css
  /* Elevation */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.40);
  --shadow-md: 0 4px 12px -2px rgb(0 0 0 / 0.50);
  --shadow-lg: 0 12px 28px -6px rgb(0 0 0 / 0.60);
```

- [ ] **Step 4: Add tabular numerals to body**

In `src/app/globals.css`, add to the `html, body` rule (after `font-family`):

```css
  font-variant-numeric: tabular-nums;
```

- [ ] **Step 5: Update the Sparkline muted literal to match the new token**

In `src/components/ui/primitive/Sparkline.tsx:19`, change:

```tsx
  muted: '#9ca3af',
```

- [ ] **Step 6: Update the Sparkline test assertion**

In `src/tests/ui/primitive/Sparkline.test.tsx:22`, change the expected stroke:

```tsx
    expect(path?.getAttribute('stroke')).toBe('#9ca3af')
```

- [ ] **Step 7: Run the suite**

Run: `npm run typecheck && npm run test:run`
Expected: green. The Sparkline test now asserts `#9ca3af`.

- [ ] **Step 8: Commit**

```bash
git add src/app/globals.css src/components/ui/primitive/Sparkline.tsx src/tests/ui/primitive/Sparkline.test.tsx
git commit -m "feat(polish): P1 foundation tokens — muted contrast, borders, shadows, calendar signals, tabular-nums"
```

---

### Task 3: Card & Skeleton elevation + radius ladder; responsive Container

**Files:**
- Modify: `src/components/ui/primitive/Card.tsx:7-12,21` (BASE + interactive variant)
- Modify: `src/components/ui/primitive/Skeleton.tsx:10` (card shape radius)
- Modify: `src/components/ui/layout/Container.tsx:22` (responsive gutter)
- Test: `src/tests/ui/primitive/Card.test.tsx` (lines 14, 20, 43, 112 + add shadow assertion)
- Test: `src/tests/ui/primitive/Skeleton.test.tsx:43,46`

**Interfaces:**
- Consumes: `shadow-md`/`shadow-lg` (Task 2), `--radius-lg` → `rounded-lg`.
- Produces: every `Card` has `shadow-md` + `rounded-lg`; interactive cards gain hover shadow + accent border; Skeleton card shape matches; `Container` has responsive gutters.

- [ ] **Step 1: Update the Card test to expect the new contract (write the failing assertions first)**

In `src/tests/ui/primitive/Card.test.tsx`:
- Line 14 comment + line 20: change `rounded-2xl` → `rounded-lg`.
- After line 20, add: `expect(el).toHaveClass('shadow-md')`.
- Line 43: change `rounded-2xl` → `rounded-lg`.
- Line 112 (`expect(el).not.toHaveClass('rounded-2xl')` in the className-merge test): change to `expect(el).not.toHaveClass('rounded-lg')` only if that test passes a `className` override that replaces radius; otherwise update the literal to `rounded-lg` to keep its intent. Read the surrounding test and keep its meaning.

- [ ] **Step 2: Run the Card test to verify it fails**

Run: `npx vitest run src/tests/ui/primitive/Card.test.tsx`
Expected: FAIL on the `rounded-lg` / `shadow-md` assertions (Card still emits `rounded-2xl`, no shadow).

- [ ] **Step 3: Update the Card primitive**

In `src/components/ui/primitive/Card.tsx`, change BASE (line 21):

```tsx
const BASE = 'border border-border rounded-lg shadow-md transition-shadow'
```

And the `interactive` variant (lines 9-10) — keep the existing classes, append hover elevation + accent border:

```tsx
  interactive:
    'bg-surface cursor-pointer hover:bg-surface-raised hover:shadow-lg hover:border-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
```

- [ ] **Step 4: Run the Card test to verify it passes**

Run: `npx vitest run src/tests/ui/primitive/Card.test.tsx`
Expected: PASS.

- [ ] **Step 5: Align the Skeleton card shape + its test**

In `src/components/ui/primitive/Skeleton.tsx:10`, change:

```tsx
  card: 'h-32 rounded-lg',
```

In `src/tests/ui/primitive/Skeleton.test.tsx`, lines 43 (description) and 46: change `rounded-2xl` → `rounded-lg`.

- [ ] **Step 6: Add responsive Container gutters**

In `src/components/ui/layout/Container.tsx:22`, change the `cn(...)` first argument from `'w-full px-4'` to:

```tsx
      className={cn('w-full px-4 md:px-6', size !== 'full' && 'mx-auto', SIZE_CLASS[size], className)}
```

- [ ] **Step 7: Run the suite**

Run: `npm run typecheck && npm run test:run`
Expected: green.

- [ ] **Step 8: Commit**

```bash
git add src/components/ui/primitive/Card.tsx src/components/ui/primitive/Skeleton.tsx src/components/ui/layout/Container.tsx src/tests/ui/primitive/Card.test.tsx src/tests/ui/primitive/Skeleton.test.tsx
git commit -m "feat(polish): P1 Card/Skeleton elevation + radius ladder, responsive Container"
```

---

### Task 4: Tokenize calendar day signals

**Files:**
- Modify: `src/components/calendar/CalendarCell.tsx:6-11` (DOT_BG)
- Modify: `src/components/calendar/CalendarLegend.tsx:1-6` (ITEMS)
- Test: check `src/tests/calendar/*` and `tests/e2e/calendar.spec.ts` for color-class assertions

**Interfaces:**
- Consumes: `bg-cal-habit/weigh/photo` (Task 2). Training stays `bg-accent` (unchanged).

- [ ] **Step 1: Check for tests asserting the raw colors**

Run: `grep -rn "emerald-500\|blue-500\|purple-500" src/tests tests/e2e`
Expected: note any matches (the earlier audit found none in `src/tests`, but confirm). If a test asserts e.g. `bg-emerald-500`, update it to `bg-cal-habit` in the same task.

- [ ] **Step 2: Update CalendarCell DOT_BG**

In `src/components/calendar/CalendarCell.tsx`, replace the `DOT_BG` map (lines 6-11):

```tsx
const DOT_BG: Record<(typeof SIGNAL_KEYS)[number], string> = {
  training: 'bg-accent',
  habit: 'bg-cal-habit',
  weigh: 'bg-cal-weigh',
  photo: 'bg-cal-photo',
}
```

- [ ] **Step 3: Update CalendarLegend ITEMS**

In `src/components/calendar/CalendarLegend.tsx`, replace the `ITEMS` array (lines 1-6):

```tsx
const ITEMS: Array<{ label: string; dot: string }> = [
  { label: 'Training', dot: 'bg-accent' },
  { label: 'Návyk', dot: 'bg-cal-habit' },
  { label: 'Vážení', dot: 'bg-cal-weigh' },
  { label: 'Foto', dot: 'bg-cal-photo' },
]
```

- [ ] **Step 4: Run the suite**

Run: `npm run typecheck && npm run test:run`
Expected: green.

- [ ] **Step 5: Commit**

```bash
git add src/components/calendar/CalendarCell.tsx src/components/calendar/CalendarLegend.tsx
git commit -m "feat(polish): P1 tokenize calendar day-signal colors"
```

---

### Task 5: Shell legibility + dashboard content width

**Files:**
- Modify: `src/components/shell/BottomNav.tsx:23,28` (label size + icon size)
- Modify: `src/components/dashboard/RegionHeader.tsx:7` (label size)
- Modify: `src/app/(app)/dashboard/page.tsx:151` (Container size)
- Test: check `src/tests` and `tests/e2e/nav.spec.ts` don't assert `text-[10px]` / `h-5 w-5` on these

**Interfaces:** none new — consumes the lightened `--color-muted` from Task 2.

- [ ] **Step 1: Check for brittle assertions**

Run: `grep -rn "text-\[10px\]\|h-5 w-5" src/tests tests/e2e`
Expected: note matches on BottomNav/RegionHeader and update them in this task if present.

- [ ] **Step 2: Enlarge BottomNav labels + icons**

In `src/components/shell/BottomNav.tsx`:
- In the `Link` className, change `text-[10px]` → `text-xs`.
- Change the icon `<Icon className="h-5 w-5" .../>` → `className="h-6 w-6"`.

- [ ] **Step 3: Enlarge the dashboard RegionHeader label**

In `src/components/dashboard/RegionHeader.tsx:7`, change `text-[10px]` → `text-xs` (keep the rest of the class string).

- [ ] **Step 4: Take the dashboard off full-bleed**

In `src/app/(app)/dashboard/page.tsx:151`, change `<Container size="full">` → `<Container size="md">`.

- [ ] **Step 5: Run the suite**

Run: `npm run typecheck && npm run lint && npm run test:run`
Expected: green.

- [ ] **Step 6: Commit**

```bash
git add src/components/shell/BottomNav.tsx src/components/dashboard/RegionHeader.tsx "src/app/(app)/dashboard/page.tsx"
git commit -m "feat(polish): P1 shell legibility + dashboard content width"
```

---

### Task 6: Full verification + in-browser check

**Files:** none (verification only)

- [ ] **Step 1: Full static + test gate**

Run: `npm run typecheck && npm run lint && npm run test:run`
Expected: typecheck clean, lint clean, full suite green (note pre-existing skips/none).

- [ ] **Step 2: Verify the font actually loads in the running app**

With the dev server running (`http://localhost:3002`, demo `demo@hexis.local / Demo1234`), confirm in the browser:
- Computed `font-family` on `<body>` resolves to a `Geist` family (DevTools → Elements → Computed), and the Network tab shows the Geist font file fetched.
- This is the one change that can silently no-op — do not skip it.

- [ ] **Step 3: Visual spot-check (desktop + narrow viewport)**

On `/dashboard`, `/calendar`, and a form page (`/settings/profile`), confirm: muted/label text is comfortably readable; cards have visible edges + drop shadow; interactive cards show a hover lift; numbers align (tabular); dashboard is centered (not full-bleed); mobile bottom-nav labels are legible at `text-xs`. Capture notes (and screenshots if the tool cooperates) for the PR.

- [ ] **Step 4: Push the branch and open the PR**

```bash
git push -u origin polish-p1-foundation
gh pr create --title "Polish P1 — Foundation (font, contrast, elevation, tokens)" --body "<summary of P1 per the spec; link the spec + audit>"
```

## Self-Review

- **Spec coverage:** P1 §1 typeface → Task 1. §2 color/contrast → Task 2 (muted, muted-strong, border) + Task 4 (calendar tokens). §3 elevation → Task 2 (shadow tokens) + Task 3 (Card applies them). §4 tabular-nums → Task 2. §5 radius ladder → Task 3 (Card→rounded-lg; Button already rounded-md; Skeleton aligned). §6 Card depth/interactive → Task 3. §7 responsive Container + dashboard width → Task 3 (gutters) + Task 5 (dashboard). §8 shell legibility → Task 5. Verification §→ Task 6. All covered.
- **Placeholder scan:** Task 4 Step 1 / Task 5 Step 1 are real grep guards with defined follow-up, not placeholders. Card.test.tsx line-112 step instructs reading surrounding context because the exact assertion intent depends on that test's setup — acceptable (the change is mechanical: `rounded-2xl`→`rounded-lg`). No "TBD"/"handle edge cases".
- **Type consistency:** token names (`--color-cal-habit/weigh/photo`, `--color-muted-strong`, `--shadow-sm/md/lg`) are used identically across Tasks 2→3→4. `GeistSans.variable` matches the `geist/font/sans` API (mirrors existing `GeistMono`). Utility names (`bg-cal-habit`, `shadow-md`, `rounded-lg`) follow Tailwind v4 token→utility mapping. Consistent.
