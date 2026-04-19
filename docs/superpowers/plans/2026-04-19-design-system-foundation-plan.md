# Design System Foundation — Plan (Part 1 of 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the token layer and the layout primitive library so every SP1 follow-up (Primitive/Compound/Icons/Docs) and every future sub-project (SP2–SP5) composes from a shared, tokenized foundation.

**Architecture:** Three-phase rollout. Phase 0 installs component-testing infra (Vitest + React Testing Library — currently repo has no `.test.tsx` files). Phase 1 extends the Tailwind 4 `@theme` block with the remaining semantic tokens, adds Geist Mono via `next/font`, and adds `lucide-react` + the Radix primitives needed later. Phase 2 is a mechanical sweep that replaces 284 inline hex literals across 70 files with token-backed Tailwind classes. Phase 3 introduces the five layout primitives (`Container`, `Stack`, `Grid`, `Section`, `Divider`) under `src/components/ui/layout/` and adopts them on two existing pages to prove the API. No user-visible redesign happens — this plan is a refactor that unlocks the redesign.

**Tech Stack:** Next.js 16.2.3 (App Router), React 19.2.4, Tailwind CSS 4 (CSS-first `@theme`), Vitest 4, `@radix-ui/react-dialog` (already installed), new deps: `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `lucide-react`, Radix Tabs/Tooltip/DropdownMenu/Accordion, `geist` (font).

**Out of scope for this plan (deferred to Plan Part 2, written after Phase 3 merges):** Phase 4 core primitives (Button, Card, Heading, Pill, Tag, Skeleton, EmptyState), Phase 5 form primitives + formalize existing, Phase 6 compound primitives, Phase 7 icon sweep, Phase 8 docs. Designing those component APIs before validating the layout primitives' API feel is premature — we'll plan them once we know what's working.

---

## File Structure

**Created in this plan:**
- `vitest.config.ts` — extended with jsdom environment (if not already)
- `src/tests/setup.ts` — extended with `@testing-library/jest-dom` matchers
- `src/tests/ui/layout/Container.test.tsx`
- `src/tests/ui/layout/Stack.test.tsx`
- `src/tests/ui/layout/Grid.test.tsx`
- `src/tests/ui/layout/Section.test.tsx`
- `src/tests/ui/layout/Divider.test.tsx`
- `src/components/ui/layout/Container.tsx`
- `src/components/ui/layout/Stack.tsx`
- `src/components/ui/layout/Grid.tsx`
- `src/components/ui/layout/Section.tsx`
- `src/components/ui/layout/Divider.tsx`
- `src/components/ui/layout/index.ts` — barrel
- `src/components/ui/index.ts` — top-level DS barrel

**Modified in this plan:**
- `package.json` — new dev deps + runtime deps
- `src/app/globals.css` — extended `@theme` block
- `src/app/layout.tsx` — Geist Mono via `next/font`
- `vitest.config.ts` — jsdom env
- `src/tests/setup.ts` — RTL matchers
- Up to 70 `.tsx` files under `src/` — mechanical hex → token replacement (Phase 2)
- `src/app/(app)/dashboard/page.tsx` — adopt `Container`/`Stack`/`Section` (Phase 3 proof)
- `src/app/(app)/progress/strength/page.tsx` — adopt layout primitives (Phase 3 proof)

**Each file has one responsibility.** Layout primitives are split one-per-file because they have independent APIs; the barrel re-exports them so callers write `import { Container, Stack } from '@/components/ui/layout'`.

---

## Phase 0 — Component Testing Infrastructure

The repo has 183 tests but **zero** `.test.tsx` files. Before we write any component, we need RTL + jsdom wired up. This phase is pure infrastructure — no user-visible change.

### Task 0.1: Add React Testing Library dev dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install dev deps**

```bash
npm install --save-dev @testing-library/react@^16.1.0 @testing-library/jest-dom@^6.6.3 @testing-library/user-event@^14.5.2 jsdom@^26.0.0
```

Expected: `package.json` gains four new entries under `devDependencies`; `package-lock.json` updated.

- [ ] **Step 2: Verify install**

Run: `npm ls @testing-library/react @testing-library/jest-dom jsdom`
Expected: all three resolve with no `UNMET DEPENDENCY` warnings.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(test): add React Testing Library + jsdom for component tests"
```

---

### Task 0.2: Configure Vitest for jsdom + RTL

**Files:**
- Modify: `vitest.config.ts`
- Modify: `src/tests/setup.ts`

- [ ] **Step 1: Read current vitest config**

Run: `cat vitest.config.ts`
Expected: see existing Vitest config. Note whether `test.environment` is set.

- [ ] **Step 2: Read current setup file**

Run: `cat src/tests/setup.ts`
Expected: see existing test setup (DB, env mocks, etc.).

- [ ] **Step 3: Add jsdom environment to vitest config**

Edit `vitest.config.ts` — inside the `test` block, add:

```ts
environmentMatchGlobs: [
  ['src/tests/ui/**', 'jsdom'],
  ['src/tests/**', 'node'],
],
```

This keeps existing Node-based tests (DB/API) fast and scopes jsdom to component tests only. If the file already has `environment: 'node'`, leave it — `environmentMatchGlobs` overrides it per-path.

- [ ] **Step 4: Extend setup with jest-dom matchers**

Append to `src/tests/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
```

This registers matchers like `toBeInTheDocument`, `toHaveClass`, etc. on Vitest's `expect`.

- [ ] **Step 5: Write smoke test to verify wiring**

Create `src/tests/ui/smoke.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('RTL wiring smoke', () => {
  it('renders a div and finds it', () => {
    render(<div data-testid="hello">hello</div>)
    expect(screen.getByTestId('hello')).toBeInTheDocument()
    expect(screen.getByTestId('hello')).toHaveTextContent('hello')
  })
})
```

- [ ] **Step 6: Run the smoke test**

Run: `npm run test:run -- src/tests/ui/smoke.test.tsx`
Expected: PASS. If it fails with `ReferenceError: document is not defined`, the env-matchglobs pattern didn't match — check the glob and path.

- [ ] **Step 7: Run the full suite to ensure no regressions**

Run: `npm run test:run`
Expected: all 184 tests pass (183 existing + new smoke).

- [ ] **Step 8: Commit**

```bash
git add vitest.config.ts src/tests/setup.ts src/tests/ui/smoke.test.tsx
git commit -m "test(ui): wire up jsdom + jest-dom matchers for component tests"
```

---

## Phase 1 — Tokens, Fonts, and Dependencies

Extend the Tailwind 4 `@theme` block, bring in Geist Mono, add Lucide and the Radix primitives we'll need in Plan Part 2. No component code yet.

### Task 1.1: Extend `@theme` with semantic tokens

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Read current globals.css**

Run: `cat src/app/globals.css`
Expected: see existing `@theme` block with 8 color tokens + `--font-sans`.

- [ ] **Step 2: Extend the `@theme` block**

Replace the existing `@theme { … }` block in `src/app/globals.css` with:

```css
@theme {
  /* Surfaces */
  --color-background:       #0a0e14;
  --color-surface:          #141a22;
  --color-surface-raised:   #1a2230;
  --color-surface-sunken:   #070b10;
  --color-border:           #1f2733;
  --color-foreground:       #e5e7eb;
  --color-muted:            #6b7280;

  /* Brand — emerald (completion/success) */
  --color-primary:          #10b981;
  --color-primary-soft:     #064e3b;
  --color-primary-muted:    #34d399;

  /* Brand — amber (action/CTA/XP/movement) */
  --color-accent:           #f59e0b;
  --color-accent-soft:      #78350f;
  --color-accent-muted:     #fbbf24;

  /* Status */
  --color-danger:           #ef4444;
  --color-success:          #10b981;
  --color-warning:          #f59e0b;
  --color-info:             #38bdf8;

  /* Focus ring — amber */
  --color-ring:             #f59e0b;

  /* Fonts */
  --font-sans:
    ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    'Helvetica Neue', Arial, 'Inter', sans-serif;
  --font-mono:
    var(--font-geist-mono), ui-monospace, 'SF Mono', Menlo, monospace;

  /* Radius */
  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
}
```

Leave the `html, body { … }` rule, the `@keyframes` and `.animate-*` rules below untouched.

- [ ] **Step 3: Run typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: no new errors. CSS changes don't affect TS, but we want a fast sanity check.

- [ ] **Step 4: Run the full test suite**

Run: `npm run test:run`
Expected: all tests green.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(theme): extend @theme with semantic surface/brand/status/radius tokens"
```

---

### Task 1.2: Install Geist Mono via `next/font`

**Files:**
- Modify: `package.json` (adds `geist`)
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Install the Geist font package**

```bash
npm install geist@^1.3.1
```

Expected: `geist` added to `dependencies`.

- [ ] **Step 2: Read current root layout**

Run: `cat src/app/layout.tsx`
Expected: see the App Router root layout.

- [ ] **Step 3: Wire up Geist Mono as a CSS variable**

Edit `src/app/layout.tsx`. At the top, after the existing imports, add:

```tsx
import { GeistMono } from 'geist/font/mono'
```

Then locate the `<html>` element and add `GeistMono.variable` to its `className`. Example target shape (adapt to the existing structure):

```tsx
<html lang="en" className={GeistMono.variable}>
```

This exposes the font as `var(--font-geist-mono)`, which the `@theme` block in Task 1.1 consumes via `--font-mono`.

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 5: Start dev server and verify mono renders**

Run: `npm run dev` in a separate terminal; open `http://localhost:3000` (or whichever port it claims). In DevTools console:

```js
getComputedStyle(document.documentElement).getPropertyValue('--font-mono')
```

Expected: returns a string starting with the Geist Mono font family name (not `ui-monospace` alone).

Stop the dev server after verifying.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/app/layout.tsx
git commit -m "feat(typography): load Geist Mono via next/font for region headers"
```

---

### Task 1.3: Install Lucide and remaining Radix primitives

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime deps**

```bash
npm install lucide-react@^0.460.0 @radix-ui/react-tabs@^1.1.2 @radix-ui/react-tooltip@^1.1.4 @radix-ui/react-dropdown-menu@^2.1.2 @radix-ui/react-accordion@^1.2.2
```

Expected: five new entries under `dependencies`.

- [ ] **Step 2: Verify tree-shakeable import works**

Create throwaway file `tmp-lucide-check.ts`:

```ts
import { ChevronRight } from 'lucide-react'
console.log(typeof ChevronRight)
```

Run: `npx tsx tmp-lucide-check.ts`
Expected: prints `function`.

Delete the file: `rm tmp-lucide-check.ts`

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add lucide-react + @radix-ui/{tabs,tooltip,dropdown-menu,accordion}"
```

---

## Phase 2 — Hex Literal Migration

Mechanical pass: 284 inline hex literal occurrences across 70 files become Tailwind classes backed by the `@theme` tokens. This is a pure refactor — visual output is unchanged because the hex values and token values are identical.

### Task 2.1: Map hex → class and draft the migration script

**Files:**
- Create: `scripts/migrate-hex-to-tokens.ts`

- [ ] **Step 1: Create the migration script**

Create `scripts/migrate-hex-to-tokens.ts`:

```ts
// Usage: npx tsx scripts/migrate-hex-to-tokens.ts [--dry]
// Rewrites inline Tailwind class strings: `bg-[#0a0e14]` → `bg-background`, etc.
// Only touches .tsx files under src/. Leaves CSS (keyframes) and SVG fills alone.
import { readFileSync, writeFileSync } from 'node:fs'
import { globSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '..')
const DRY = process.argv.includes('--dry')

// case-insensitive hex → token base name
const HEX_TO_TOKEN: Record<string, string> = {
  '0a0e14': 'background',
  '141a22': 'surface',
  '1a2230': 'surface-raised',
  '070b10': 'surface-sunken',
  '1f2733': 'border',
  'e5e7eb': 'foreground',
  '6b7280': 'muted',
  '10b981': 'primary',
  '064e3b': 'primary-soft',
  '34d399': 'primary-muted',
  'f59e0b': 'accent',
  '78350f': 'accent-soft',
  'fbbf24': 'accent-muted',
  'ef4444': 'danger',
  '38bdf8': 'info',
}

// Tailwind utility prefixes that take a color: bg, text, border, ring, fill, stroke, outline, from, via, to, caret, decoration, placeholder, divide, accent, shadow
const UTIL_PREFIXES = [
  'bg', 'text', 'border', 'ring', 'fill', 'stroke', 'outline',
  'from', 'via', 'to', 'caret', 'decoration', 'placeholder', 'divide',
  'accent', 'shadow',
]

function migrateFile(filepath: string): { changed: boolean; hits: number } {
  const original = readFileSync(filepath, 'utf8')
  let out = original
  let hits = 0
  for (const prefix of UTIL_PREFIXES) {
    for (const [hex, token] of Object.entries(HEX_TO_TOKEN)) {
      // match bg-[#0a0e14] and bg-[#0A0E14]
      const re = new RegExp(`\\b${prefix}-\\[#${hex}\\]`, 'gi')
      out = out.replace(re, () => { hits++; return `${prefix}-${token}` })
    }
  }
  if (out !== original) {
    if (!DRY) writeFileSync(filepath, out)
    return { changed: true, hits }
  }
  return { changed: false, hits: 0 }
}

const files = globSync('src/**/*.{tsx,ts}', { cwd: repoRoot })
let totalHits = 0
let totalFiles = 0
for (const rel of files) {
  const full = resolve(repoRoot, rel)
  const { changed, hits } = migrateFile(full)
  if (changed) {
    totalHits += hits
    totalFiles += 1
    console.log(`${DRY ? '[dry] ' : ''}${rel}  (${hits} replacements)`)
  }
}
console.log(`\n${DRY ? 'Would change' : 'Changed'} ${totalFiles} files, ${totalHits} total replacements.`)
```

- [ ] **Step 2: Dry-run the script**

Run: `npx tsx scripts/migrate-hex-to-tokens.ts --dry`
Expected: lists candidate files with replacement counts. Total hits should be in the ~250 range (some of the 284 matches are inside `globals.css` / SVG fills / rgba literals which are excluded).

If total is 0, the regex is wrong — debug before the next step. If the list includes files you don't expect (e.g., `.ts` files with no hex in class strings), inspect those manually.

- [ ] **Step 3: Commit the script (dry-run only so far)**

```bash
git add scripts/migrate-hex-to-tokens.ts
git commit -m "chore(migrate): add hex→token rewriter script (dry-run verified)"
```

---

### Task 2.2: Run the migration

**Files:**
- Modify: up to 70 `.tsx` files under `src/` (whichever the script touches)

- [ ] **Step 1: Baseline a clean working tree**

Run: `git status`
Expected: clean (last commit was the script).

- [ ] **Step 2: Execute the migration**

Run: `npx tsx scripts/migrate-hex-to-tokens.ts`
Expected: same file list as the dry-run, now with real writes.

- [ ] **Step 3: Verify via grep — only intentional hex remain**

Run:

```bash
npm run lint  # first sanity check
```

Expected: clean. Then inspect residual hex:

```bash
grep -rEn --include='*.tsx' '#[0-9a-fA-F]{6}' src/ | grep -v 'fill="#' | grep -v 'stroke="#'
```

Expected: zero or very few hits. Any remaining hits are cases the script couldn't rewrite — arbitrary-value classes with non-color utilities (e.g., `shadow-[0_0_10px_#f59e0b]`), recharts color props, or inline `style={{ color: '#...' }}`. Those are acceptable to leave for now.

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 5: Run full test suite**

Run: `npm run test:run`
Expected: all 184 tests pass. A failure here means a class string replacement broke something — inspect and fix.

- [ ] **Step 6: Visual smoke test**

Run: `npm run dev` in a separate terminal. Visit in a browser:
- `http://localhost:3000/dashboard`
- `http://localhost:3000/workout`
- `http://localhost:3000/progress/strength`
- `http://localhost:3000/nutrition`
- `http://localhost:3000/avatar`

Expected: each page looks **identical** to pre-migration. Emerald/amber/surface colors all render correctly. If a page is missing color (transparent where there should be a tint), a class string was corrupted — grep for the page name in the migration output and inspect.

Stop the dev server.

- [ ] **Step 7: Commit**

```bash
git add src/
git commit -m "refactor(theme): replace 284 inline hex literals with @theme token classes"
```

---

## Phase 3 — Layout Primitives

Five primitives under `src/components/ui/layout/`. Each gets a unit test (via RTL) + an implementation file + a barrel entry. At the end of the phase we adopt them on two existing pages as a proof.

### Task 3.1: `Container`

**Files:**
- Create: `src/tests/ui/layout/Container.test.tsx`
- Create: `src/components/ui/layout/Container.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/tests/ui/layout/Container.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Container } from '@/components/ui/layout/Container'

describe('Container', () => {
  it('renders children inside a div by default', () => {
    render(<Container><span data-testid="child" /></Container>)
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('applies md max-width by default', () => {
    render(<Container data-testid="c">x</Container>)
    expect(screen.getByTestId('c')).toHaveClass('max-w-2xl')
  })

  it('applies sm max-width when size=sm', () => {
    render(<Container size="sm" data-testid="c">x</Container>)
    expect(screen.getByTestId('c')).toHaveClass('max-w-md')
  })

  it('applies lg max-width when size=lg', () => {
    render(<Container size="lg" data-testid="c">x</Container>)
    expect(screen.getByTestId('c')).toHaveClass('max-w-4xl')
  })

  it('supports polymorphic `as` prop', () => {
    render(<Container as="section" data-testid="c">x</Container>)
    expect(screen.getByTestId('c').tagName).toBe('SECTION')
  })

  it('merges user className', () => {
    render(<Container className="custom" data-testid="c">x</Container>)
    expect(screen.getByTestId('c')).toHaveClass('custom')
  })
})
```

- [ ] **Step 2: Run to confirm failure**

Run: `npm run test:run -- src/tests/ui/layout/Container.test.tsx`
Expected: FAIL — `Cannot find module '@/components/ui/layout/Container'`.

- [ ] **Step 3: Implement `Container`**

Create `src/components/ui/layout/Container.tsx`:

```tsx
import type { ElementType, ReactNode, HTMLAttributes } from 'react'

type Size = 'sm' | 'md' | 'lg'

const SIZE_CLASS: Record<Size, string> = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
}

type Props = {
  as?: ElementType
  size?: Size
  children: ReactNode
} & HTMLAttributes<HTMLElement>

export function Container({
  as: As = 'div',
  size = 'md',
  className,
  children,
  ...rest
}: Props) {
  return (
    <As
      className={['mx-auto w-full px-4', SIZE_CLASS[size], className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </As>
  )
}
```

- [ ] **Step 4: Run tests**

Run: `npm run test:run -- src/tests/ui/layout/Container.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/tests/ui/layout/Container.test.tsx src/components/ui/layout/Container.tsx
git commit -m "feat(ui): add Container layout primitive with size and polymorphic `as`"
```

---

### Task 3.2: `Stack`

**Files:**
- Create: `src/tests/ui/layout/Stack.test.tsx`
- Create: `src/components/ui/layout/Stack.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/tests/ui/layout/Stack.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Stack } from '@/components/ui/layout/Stack'

describe('Stack', () => {
  it('applies flex-col and default gap-4', () => {
    render(<Stack data-testid="s"><span /></Stack>)
    const el = screen.getByTestId('s')
    expect(el).toHaveClass('flex')
    expect(el).toHaveClass('flex-col')
    expect(el).toHaveClass('gap-4')
  })

  it.each([2, 3, 4, 6, 8] as const)('applies gap-%i when gap=%i', (gap) => {
    render(<Stack gap={gap} data-testid="s"><span /></Stack>)
    expect(screen.getByTestId('s')).toHaveClass(`gap-${gap}`)
  })

  it('supports polymorphic `as`', () => {
    render(<Stack as="ul" data-testid="s"><li /></Stack>)
    expect(screen.getByTestId('s').tagName).toBe('UL')
  })
})
```

- [ ] **Step 2: Run to confirm failure**

Run: `npm run test:run -- src/tests/ui/layout/Stack.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `Stack`**

Create `src/components/ui/layout/Stack.tsx`:

```tsx
import type { ElementType, ReactNode, HTMLAttributes } from 'react'

type Gap = 2 | 3 | 4 | 6 | 8

const GAP_CLASS: Record<Gap, string> = {
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  6: 'gap-6',
  8: 'gap-8',
}

type Props = {
  as?: ElementType
  gap?: Gap
  children: ReactNode
} & HTMLAttributes<HTMLElement>

export function Stack({
  as: As = 'div',
  gap = 4,
  className,
  children,
  ...rest
}: Props) {
  return (
    <As
      className={['flex flex-col', GAP_CLASS[gap], className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </As>
  )
}
```

- [ ] **Step 4: Run tests**

Run: `npm run test:run -- src/tests/ui/layout/Stack.test.tsx`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/tests/ui/layout/Stack.test.tsx src/components/ui/layout/Stack.tsx
git commit -m "feat(ui): add Stack layout primitive (vertical flex with gap)"
```

---

### Task 3.3: `Grid`

**Files:**
- Create: `src/tests/ui/layout/Grid.test.tsx`
- Create: `src/components/ui/layout/Grid.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/tests/ui/layout/Grid.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Grid } from '@/components/ui/layout/Grid'

describe('Grid', () => {
  it('applies grid with default cols=2 and gap-4', () => {
    render(<Grid data-testid="g"><span /></Grid>)
    const el = screen.getByTestId('g')
    expect(el).toHaveClass('grid')
    expect(el).toHaveClass('grid-cols-2')
    expect(el).toHaveClass('gap-4')
  })

  it.each([1, 2, 3, 4] as const)('applies grid-cols-%i when cols=%i', (cols) => {
    render(<Grid cols={cols} data-testid="g"><span /></Grid>)
    expect(screen.getByTestId('g')).toHaveClass(`grid-cols-${cols}`)
  })

  it('applies responsive cols at sm/md breakpoints', () => {
    render(
      <Grid cols={1} responsive={{ sm: 2, md: 4 }} data-testid="g">
        <span />
      </Grid>,
    )
    const el = screen.getByTestId('g')
    expect(el).toHaveClass('grid-cols-1')
    expect(el).toHaveClass('sm:grid-cols-2')
    expect(el).toHaveClass('md:grid-cols-4')
  })
})
```

- [ ] **Step 2: Run to confirm failure**

Run: `npm run test:run -- src/tests/ui/layout/Grid.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `Grid`**

Create `src/components/ui/layout/Grid.tsx`:

```tsx
import type { ReactNode, HTMLAttributes } from 'react'

type Cols = 1 | 2 | 3 | 4
type Gap = 2 | 3 | 4 | 6 | 8

const COL_CLASS: Record<Cols, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
}
const SM_COL_CLASS: Record<Cols, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
}
const MD_COL_CLASS: Record<Cols, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
}
const LG_COL_CLASS: Record<Cols, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
}
const GAP_CLASS: Record<Gap, string> = {
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  6: 'gap-6',
  8: 'gap-8',
}

type Props = {
  cols?: Cols
  gap?: Gap
  responsive?: { sm?: Cols; md?: Cols; lg?: Cols }
  children: ReactNode
} & HTMLAttributes<HTMLDivElement>

export function Grid({
  cols = 2,
  gap = 4,
  responsive,
  className,
  children,
  ...rest
}: Props) {
  const classes = [
    'grid',
    COL_CLASS[cols],
    GAP_CLASS[gap],
    responsive?.sm ? SM_COL_CLASS[responsive.sm] : '',
    responsive?.md ? MD_COL_CLASS[responsive.md] : '',
    responsive?.lg ? LG_COL_CLASS[responsive.lg] : '',
    className ?? '',
  ].filter(Boolean).join(' ')
  return <div className={classes} {...rest}>{children}</div>
}
```

Note on the lookup-table approach: Tailwind 4's JIT scans source for class literals. Building class names via string interpolation (`grid-cols-${cols}`) would break tree-shaking. Explicit maps preserve the literals.

- [ ] **Step 4: Run tests**

Run: `npm run test:run -- src/tests/ui/layout/Grid.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/tests/ui/layout/Grid.test.tsx src/components/ui/layout/Grid.tsx
git commit -m "feat(ui): add Grid layout primitive with responsive cols"
```

---

### Task 3.4: `Divider`

**Files:**
- Create: `src/tests/ui/layout/Divider.test.tsx`
- Create: `src/components/ui/layout/Divider.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/tests/ui/layout/Divider.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Divider } from '@/components/ui/layout/Divider'

describe('Divider', () => {
  it('renders an hr with border-border class when no label', () => {
    render(<Divider data-testid="d" />)
    const el = screen.getByTestId('d')
    expect(el.tagName).toBe('HR')
    expect(el).toHaveClass('border-border')
  })

  it('renders label between two rules when label provided', () => {
    render(<Divider label="OR" />)
    expect(screen.getByText('OR')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to confirm failure**

Run: `npm run test:run -- src/tests/ui/layout/Divider.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `Divider`**

Create `src/components/ui/layout/Divider.tsx`:

```tsx
import type { HTMLAttributes } from 'react'

type Props = { label?: string } & HTMLAttributes<HTMLElement>

export function Divider({ label, className, ...rest }: Props) {
  if (!label) {
    return (
      <hr
        className={['border-border', className].filter(Boolean).join(' ')}
        {...rest}
      />
    )
  }
  return (
    <div
      className={['flex items-center gap-3 text-muted', className].filter(Boolean).join(' ')}
      role="separator"
      aria-label={label}
    >
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs uppercase tracking-wider">{label}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

Run: `npm run test:run -- src/tests/ui/layout/Divider.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/tests/ui/layout/Divider.test.tsx src/components/ui/layout/Divider.tsx
git commit -m "feat(ui): add Divider layout primitive with optional label"
```

---

### Task 3.5: `Section`

**Files:**
- Create: `src/tests/ui/layout/Section.test.tsx`
- Create: `src/components/ui/layout/Section.tsx`

Note: `Section` depends on the region-style letter-spaced mono header. Until we have a full `Heading` primitive (Plan Part 2), `Section` renders the header inline with mono + tracking classes.

- [ ] **Step 1: Write the failing test**

Create `src/tests/ui/layout/Section.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Section } from '@/components/ui/layout/Section'

describe('Section', () => {
  it('renders children', () => {
    render(<Section><span data-testid="c" /></Section>)
    expect(screen.getByTestId('c')).toBeInTheDocument()
  })

  it('renders a region-style header from title with expanded letter-spacing', () => {
    render(<Section title="Life Areas">x</Section>)
    const header = screen.getByRole('heading', { level: 2 })
    expect(header).toHaveClass('font-mono')
    expect(header.className).toMatch(/tracking-/)
    expect(header.className).toMatch(/uppercase/)
    expect(header).toHaveTextContent(/life areas/i)
  })

  it('renders an action slot to the right of the header', () => {
    render(
      <Section title="X" action={<button>see all</button>}>
        body
      </Section>,
    )
    expect(screen.getByRole('button', { name: /see all/i })).toBeInTheDocument()
  })

  it('omits the header when no title', () => {
    render(<Section>body</Section>)
    expect(screen.queryByRole('heading')).toBeNull()
  })
})
```

- [ ] **Step 2: Run to confirm failure**

Run: `npm run test:run -- src/tests/ui/layout/Section.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `Section`**

Create `src/components/ui/layout/Section.tsx`:

```tsx
import type { ReactNode, HTMLAttributes } from 'react'

type Props = {
  title?: string
  action?: ReactNode
  children: ReactNode
} & HTMLAttributes<HTMLElement>

export function Section({ title, action, className, children, ...rest }: Props) {
  return (
    <section
      className={['flex flex-col gap-3', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {title ? (
        <div className="flex items-end justify-between">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            {title}
          </h2>
          {action ? <div>{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}
```

The `tracking-[0.2em]` arbitrary value delivers the `L I F E   A R E A S` visual effect without forcing authors to hand-insert spaces — screen readers still read "Life Areas".

- [ ] **Step 4: Run tests**

Run: `npm run test:run -- src/tests/ui/layout/Section.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/tests/ui/layout/Section.test.tsx src/components/ui/layout/Section.tsx
git commit -m "feat(ui): add Section layout primitive with region-style mono header"
```

---

### Task 3.6: Barrel exports

**Files:**
- Create: `src/components/ui/layout/index.ts`
- Create: `src/components/ui/index.ts`

- [ ] **Step 1: Create layout barrel**

Create `src/components/ui/layout/index.ts`:

```ts
export { Container } from './Container'
export { Stack } from './Stack'
export { Grid } from './Grid'
export { Section } from './Section'
export { Divider } from './Divider'
```

- [ ] **Step 2: Create top-level UI barrel**

Create `src/components/ui/index.ts`:

```ts
export * from './layout'

// existing primitives — re-export so callers can import from '@/components/ui'
export { BottomSheet } from './BottomSheet'
export { LongPress } from './LongPress'
export { NumberInput } from './NumberInput'
export { ProgressBar } from './ProgressBar'
export { Sparkline } from './Sparkline'
export { Switch } from './Switch'
export { Toast } from './Toast'
export { SegmentControl } from './SegmentControl'
```

Note: this only works if the existing primitives use named exports. Verify with `grep -nE '^export (function|const) (BottomSheet|LongPress|NumberInput|ProgressBar|Sparkline|Switch|Toast|SegmentControl)' src/components/ui/*.tsx`. If any uses a default export, either change to named (small refactor, fine) or skip it from the barrel and document it.

- [ ] **Step 3: Verify imports work**

Create `tmp-barrel-check.ts` in the repo root:

```ts
import { Container, Stack, Grid, Section, Divider } from '@/components/ui/layout'
import * as ui from '@/components/ui'
console.log(!!Container && !!Stack && !!Grid && !!Section && !!Divider, !!ui.Container)
```

Run: `npx tsx tmp-barrel-check.ts`
Expected: `true true`.

Delete: `rm tmp-barrel-check.ts`

- [ ] **Step 4: Typecheck + lint + tests**

Run: `npm run typecheck && npm run lint && npm run test:run`
Expected: all clean. All 184 + 25 new layout tests = ~209 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/layout/index.ts src/components/ui/index.ts
git commit -m "feat(ui): add barrel exports for layout primitives and existing ui"
```

---

### Task 3.7: Adopt layout primitives on the Dashboard page

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`

Goal: replace the ad-hoc `<div className="mx-auto max-w-2xl px-4 flex flex-col gap-4">` patterns on the Dashboard with `<Container><Stack>…</Stack></Container>`. Wrap any existing card cluster that has a muted header (e.g., "Today", "Measurements") with `<Section title="…">`. **Do not change any child content or styling** — only swap the layout wrappers.

- [ ] **Step 1: Read the file**

Run: `cat src/app/(app)/dashboard/page.tsx`
Expected: see the current dashboard implementation. Identify layout wrappers and inline section headers.

- [ ] **Step 2: Refactor using layout primitives**

Replace outer layout wrapper patterns with `Container` + `Stack`. Replace inline section header patterns (e.g., `<h2 className="text-muted uppercase tracking-wider text-xs">…</h2>` followed by content) with `<Section title="…">…</Section>`.

Preserve every piece of visible content. If the file uses `space-y-4` on the outer div, replace the outer `<div className="space-y-4">` with `<Stack gap={4}>`. If you're unsure whether a change preserves layout, leave that block alone and note it in the commit message.

Import from the barrel:

```tsx
import { Container, Stack, Section } from '@/components/ui/layout'
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: clean.

- [ ] **Step 4: Visual smoke test**

Run: `npm run dev` in a separate terminal. Visit `http://localhost:3000/dashboard`. Compare against the screenshot you took pre-refactor (if any — if not, compare against a prior commit by `git stash`, loading, and `git stash pop`).

Expected: page looks identical. Spacing, max-width, header treatment all match.

- [ ] **Step 5: Run tests**

Run: `npm run test:run`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(app\)/dashboard/page.tsx
git commit -m "refactor(dashboard): adopt Container/Stack/Section layout primitives"
```

---

### Task 3.8: Adopt layout primitives on the Strength progress page

**Files:**
- Modify: `src/app/(app)/progress/strength/page.tsx`

Same goal as Task 3.7, applied to the strength progress page. This is our second proof that the API handles the variation found in real screens.

- [ ] **Step 1: Read the file**

Run: `cat src/app/\(app\)/progress/strength/page.tsx`
Expected: see the current layout.

- [ ] **Step 2: Refactor**

Apply the same substitution pattern as Task 3.7. Preserve all content.

- [ ] **Step 3: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: clean.

- [ ] **Step 4: Visual smoke test**

Run: `npm run dev` in a separate terminal. Visit `http://localhost:3000/progress/strength`.

Expected: identical to pre-refactor.

- [ ] **Step 5: Run full test suite**

Run: `npm run test:run`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(app\)/progress/strength/page.tsx
git commit -m "refactor(progress): adopt Container/Stack/Section on strength page"
```

---

### Task 3.9: Pre-push + final verification

- [ ] **Step 1: Run the full check sequence**

Run: `npm run typecheck && npm run lint && npm run test:run`
Expected: all green. Test count is ~209 (184 prior + 25 layout).

- [ ] **Step 2: Push the branch**

```bash
git push -u origin HEAD
```

Expected: the pre-push hook (already installed per repo history, see commit `62aa7b9`) runs lint/typecheck/tests on its own and either allows the push or blocks it. If blocked: fix the underlying issue, create a NEW commit (do NOT `--no-verify`), re-push.

- [ ] **Step 3: Open a PR**

```bash
gh pr create --title "SP1 Phase 1-3: tokens, hex migration, layout primitives" --body "$(cat <<'EOF'
## Summary
- Phase 0: wired up React Testing Library + jsdom for component tests
- Phase 1: extended @theme with surface-raised/sunken, brand soft/muted scales, status tokens, ring, radius. Added Geist Mono via next/font. Installed lucide-react + remaining Radix primitives.
- Phase 2: replaced 284 inline hex literals across the codebase with @theme token classes via a one-shot migration script
- Phase 3: added Container/Stack/Grid/Section/Divider layout primitives and adopted them on Dashboard + Strength pages

Part 1 of 2 — Phases 4-8 (Button/Card/Heading, form primitives, compound, icon sweep, docs) follow in a second plan once these API shapes prove out in real use.

## Test plan
- [ ] `npm run test:run` — ~209 tests green, including 25 new layout primitive tests
- [ ] `npm run lint` clean
- [ ] `npm run typecheck` clean
- [ ] Visually verify Dashboard and Strength pages render identically to main
- [ ] Grep confirms no stray `bg-[#hex]` / `text-[#hex]` / `border-[#hex]` class literals remain in src/**/*.tsx

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL printed.

---

## Self-review checklist (for the person executing this plan)

Before merging, confirm:

- [ ] No file under `src/**/*.tsx` contains `bg-[#...]`, `text-[#...]`, `border-[#...]`, `ring-[#...]` arbitrary-value class literals (run `grep -rEn --include='*.tsx' '(bg|text|border|ring)-\[#[0-9a-fA-F]{6}\]' src/` — expected zero hits).
- [ ] All five layout primitives import from `@/components/ui/layout`.
- [ ] Existing MVP pages render visually identically to pre-refactor main.
- [ ] Test count increased by exactly the number of new tests written (25 new: 6 Container + 7 Stack + 6 Grid + 2 Divider + 4 Section), no existing test was deleted.
- [ ] No existing component's behavior changed — Phase 2 + 3 are refactors only.

---

## What comes next (Plan Part 2)

Once this plan's PR merges, write `docs/superpowers/plans/<date>-design-system-foundation-plan-part-2.md` covering:
- Phase 4: `Button`, `Card`, `Heading`, `Pill`, `Tag`, `Skeleton`, `EmptyState` (core primitives)
- Phase 5: `Input`, `Select`, `Avatar`, `HeroBanner` (form/media primitives); formalize `BottomSheet`, `NumberInput`, `SegmentControl`, `Sparkline`, `Switch`, `Toast`, `ProgressBar`, `LongPress`
- Phase 6: `Dialog`, `Tabs`, `Tooltip`, `Menu`, `Accordion`, `Breadcrumb`, `DataTable` (Radix-backed compound)
- Phase 7: Lucide icon sweep (replace `›`/`×`/`✓`/`✗` and similar)
- Phase 8: `docs/design-system/` examples + README

Deferred because the exact shape of `Button` / `Card` / `Heading` depends on patterns we'll discover while using the layout primitives in Phases 3.7 and 3.8. Planning them in detail before that feedback is speculative.
