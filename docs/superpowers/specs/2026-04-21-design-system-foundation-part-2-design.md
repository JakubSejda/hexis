# Design System Foundation — SP1 Part 2 Addendum Spec

**Status:** Draft
**Date:** 2026-04-21
**Supersedes:** §10 (rollout) and §11 (open questions) of `2026-04-19-design-system-foundation-design.md`. Everything else in Part 1 spec still applies — this is an addendum, not a rewrite.
**Scope:** Finish SP1. Build remaining ~20 new primitives, formalize 8 existing, Lucide icon sweep, docs.

---

## 1. What Part 1 already landed

Shipped 2026-04-19 as PR #1 on branch `sp1-design-foundation`:

- Extended `@theme` tokens (semantic surface/brand/status/radius + Geist Mono font tokens)
- 284 inline hex literals → token classes across 67 files
- `lucide-react` + `@radix-ui/{tabs,tooltip,dropdown-menu,accordion}` installed (react-dialog was pre-existing)
- 5 layout primitives: `Container`, `Stack`, `Grid`, `Section`, `Divider` (all in `src/components/ui/layout/`)
- RTL + jsdom test infrastructure via per-file `// @vitest-environment jsdom` pragma + explicit `afterEach(cleanup)` in `src/tests/setup.ts`
- Barrel exports at `src/components/ui/index.ts`
- Dashboard + Strength page refactored to use Container/Stack/Section

Conventions established in `project_sp1_conventions.md` (Vitest-4 pragma, Tailwind-4 lookup tables, polymorphic `as`, named exports) apply to every Part 2 component — no re-explanation.

---

## 2. Resolved Part 1 tensions

### 2.1 Container — add `size="full"`

Dashboard is intentionally edge-to-edge on mobile and was bypassing Container. Resolution:

```ts
size?: 'sm' | 'md' | 'lg' | 'full'  // default 'md'
```

Lookup table adds `full: 'w-full'`. `mx-auto` applied conditionally — only for `sm | md | lg`. Vertical padding behavior unchanged across sizes.

**Adoption:** Dashboard wraps in `<Container size="full">` to regain consistent vertical rhythm while staying edge-to-edge horizontally.

### 2.2 Section — add `variant` prop

Existing region-style header (`font-mono uppercase tracking-[0.2em] text-muted`) clashed with inline bold headers ("Estimated 1RM"). Resolution — one component, two modes:

```ts
variant?: 'region' | 'default'  // default 'region' (backward compat)
```

- `variant="region"`: current behavior (mono, uppercase, letter-spaced) — for navigation-style sections (`L I F E   A R E A S`)
- `variant="default"`: `text-base font-semibold text-foreground` — for data/chart section headers

Current `<Section>` usages stay `region` (no migration). Inline bold headers remain inline; SP3 screen redesign decides which promote to `<Section variant="default">`.

---

## 3. New primitives — detailed APIs

All live in `src/components/ui/primitive/` (see §7 for folder restructure). Named exports only. `className` passthrough via `cn()` helper (clsx + tailwind-merge). `ref` forwarded via `React.forwardRef`. Polymorphic `as` prop where it makes sense (callouts per component).

### 3.1 `Button`

```ts
type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
  as?: 'button' | 'a'   // 'a' renders <a> with button styles; omit href at your own risk
  children: ReactNode
} & HTMLAttributes
```

Color decisions:
- `primary` = **amber filled** (`bg-accent text-background`) — default CTA
- `success` = emerald filled (`bg-primary text-background`) — save-and-close, confirm, mark complete
- `secondary` = emerald outline (`border border-primary text-primary`) — secondary actions
- `ghost` = transparent + hover surface-raised — tertiary, toolbar use
- `danger` = red filled (`bg-danger text-background`) — destructive confirms

Loading state: internal spinner (Lucide `<Loader2 class="animate-spin" />`) replaces icon slots, `aria-busy="true"`, `disabled` set, width preserved via `min-w-[current]` technique — button does not jump.

Sizes: `sm = h-8 px-3 text-sm`, `md = h-10 px-4 text-sm`, `lg = h-12 px-6 text-base`. All meet 44px tap target on `md`+ (or via surrounding padding on `sm`).

### 3.2 `Card`

```ts
type CardProps = {
  variant?: 'default' | 'interactive' | 'flush'
  as?: ElementType   // 'div' default; 'a' for link-cards; 'button' for clickable
  padding?: 'none' | 'sm' | 'md' | 'lg'   // default 'md' = p-4
  children: ReactNode
}
```

- `default`: `bg-surface border border-border rounded-2xl p-4`
- `interactive`: `default` + hover `bg-surface-raised` + `cursor-pointer` + focus ring
- `flush`: border + rounded but no padding — for cards with full-bleed content (charts, images)

Link-card pattern:
```tsx
<Card as="a" href="/strength" variant="interactive">…</Card>
```

### 3.3 `Heading`

```ts
type HeadingProps = {
  level: 1 | 2 | 3   // semantic <h1>/<h2>/<h3> element
  as?: 'h1' | 'h2' | 'h3' | 'div'   // override element independently of visual level
  variant?: 'display' | 'default' | 'region'   // default 'default'
  children: ReactNode
}
```

- `display`: `text-3xl font-semibold tracking-tight` — Dashboard hero only
- `default`: maps to level: 1=`text-2xl`, 2=`text-lg`, 3=`text-base`, all `font-semibold`
- `region`: `font-mono text-xs uppercase tracking-[0.2em] text-muted`, auto-inserts en-spaces between characters

Region auto-space: author writes `Dnešní quest`, component renders `D N E Š N Í   Q U E S T` via string transform + CSS uppercase. Czech diacritics not special-cased — browser `text-transform: uppercase` handles them. If a specific heading looks optically broken with diacritics, switch to `variant="default" level={2}` on that heading.

### 3.4 `Pill` and `Tag`

```ts
// Pill — read-only status badge
type PillProps = {
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent'
  size?: 'sm' | 'md'
  children: ReactNode
}

// Tag — like Pill but interactive
type TagProps = PillProps & {
  onRemove?: () => void   // renders <X /> icon when present
  onClick?: () => void
}
```

Both use `rounded-md` (8px — smaller than card/button, per token scale). Pill is `<span>`, Tag is `<button>` if `onClick`/`onRemove`, else `<span>`.

### 3.5 `Skeleton`

```ts
type SkeletonProps = {
  shape?: 'text' | 'block' | 'avatar' | 'card'
  lines?: number   // for shape='text'; default 1
  width?: string | number   // Tailwind class or px value
  height?: string | number
}
```

Animated via `animate-pulse` + `bg-surface-raised`. Used pre-load on Dashboard tiles, Strength history list, Avatar placeholder.

### 3.6 `EmptyState`

```ts
type EmptyStateProps = {
  icon: LucideIcon   // component reference, not JSX
  title: string
  description?: string
  action?: ReactNode   // usually <Button>
}
```

Centered layout, muted icon (64px), title + description, optional CTA below. Used wherever a list is empty (no workouts yet, no measurements, no rewards).

### 3.7 `Input`

```ts
type InputProps = {
  variant?: 'default' | 'search'   // 'search' = magnifying glass iconLeft
  size?: 'sm' | 'md' | 'lg'
  error?: string   // renders inline error text below + red border + aria-invalid
  iconLeft?: ReactNode
  iconRight?: ReactNode
  label?: string   // if present, wraps in <label> with text-muted caption
  hint?: string   // helper text below input (muted); hidden if error present
} & InputHTMLAttributes
```

Error state is the validation pattern across the DS — inline red text below input, `aria-invalid="true"`, red border. Form libraries pass `error={errors.name?.message}` directly.

### 3.8 `Select`

Native `<select>` wrapper with custom chevron (Lucide `<ChevronDown size={16} />`) positioned absolutely. Same prop shape as Input where applicable (`size`, `error`, `label`, `hint`). Options via `children` (`<option>` elements) — keeps native accessibility and keyboard nav intact.

### 3.9 `Avatar`

```ts
type AvatarProps = {
  src?: string
  alt: string   // required even without src — used for initials fallback
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  fallback?: ReactNode   // override default initials
}
```

Sizes: xs=24, sm=32, md=40, lg=48, xl=64. Fallback = first letters of each alt word (`"Jakub Sejda"` → `JS`) on `bg-surface-raised text-muted`.

### 3.10 `HeroBanner`

Full-bleed (`w-full`) container with optional image + gradient overlay + slot for `<Heading variant="display">`.

```ts
type HeroBannerProps = {
  imageSrc?: string   // next/image src; gradient-only if omitted
  imageAlt?: string
  overlay?: 'dark' | 'gradient' | 'none'   // default 'gradient'
  height?: 'sm' | 'md' | 'lg'   // default 'md' = h-48
  children: ReactNode   // typically <Heading>
}
```

Ships in Part 2 with gradient-only fallback (no image) — actual Dashboard artwork lands in SP3.

---

## 4. Compound primitives — Radix-backed

All in `src/components/ui/compound/`. Thin wrappers that tokenize Radix styles and lock ergonomic defaults. Named exports of each Radix subcomponent (`Dialog.Root`, `Dialog.Trigger`, `Dialog.Content`) OR re-shaped single-export (`<Dialog open onOpenChange title> children </Dialog>`) — decided per component below.

| Component | Shape | Rationale |
|---|---|---|
| `Dialog` | Re-shaped single export | `<Dialog title description open onOpenChange>` — 90% of uses are confirm-style. Escape hatch: `DialogRoot` + subcomponents also exported for custom layouts. |
| `Tabs` | Subcomponent pattern | `<Tabs.Root> <Tabs.List> <Tabs.Trigger> <Tabs.Content>` — content composition is the whole point, don't flatten. |
| `Tooltip` | Re-shaped single export | `<Tooltip content="…">{children}</Tooltip>` — tap-delegation handled internally via Radix `delayDuration={0}` + touch fallback. |
| `Menu` | Subcomponent pattern | Dropdown menus have per-item logic; subcomponents mirror Radix 1:1. |
| `Accordion` | Subcomponent pattern | Same reason as Tabs. |
| `Breadcrumb` | Custom (no Radix) | Trivial markup — `<Breadcrumb items={[{label, href}]} />`. |
| `DataTable` | Custom thin wrapper | `<DataTable headers data />` with `renderCell` for per-column custom rendering. No sorting/paging at this tier — consumer's problem. |

All compound components must pass Radix's native a11y tests unchanged. We do NOT override ARIA roles, focus trap behavior, or keyboard nav.

---

## 5. Formalize existing 8

Token migration already done in Part 1. Remaining formalization actions per component:

| Component | Move to | API changes | Tests | Docs |
|---|---|---|---|---|
| `BottomSheet` | `primitive/` | Align open prop name (`open`/`onOpenChange` — Radix convention); add `title`/`description` props matching Dialog | smoke + open/close interaction | `bottomsheet.md` |
| `NumberInput` | `primitive/` | Align with Input API (`size`, `error`, `label`, `hint` props) — breaking change, refactor 5 callsites (SetInput, PlateInventoryForm, PlateCalculatorSheet, EditSetSheet, DailyModal) | smoke + increment/decrement behavior | `numberinput.md` |
| `SegmentControl` | `primitive/` | No API change — already consistent | smoke + option select | `segmentcontrol.md` |
| `Sparkline` | `primitive/` | Replace remaining inline color props with token-based defaults (`color="primary" \| "accent"`) | smoke only (visual test, hard to unit-test meaningfully) | `sparkline.md` |
| `Switch` | `primitive/` | No API change | smoke + toggle interaction | `switch.md` |
| `Toast` | `primitive/` | No API change; verify Dialog a11y patterns reused | smoke + show/auto-dismiss | `toast.md` |
| `ProgressBar` | `primitive/` | Add `variant="default" \| "xp"` — xp variant uses amber + subtle glow | smoke + variant lookup | `progressbar.md` |
| `LongPress` | `primitive/` | Rename file for clarity (exports `useLongPress` hook, not component) — move to `primitive/useLongPress.ts` | existing hook tests continue | `uselongpress.md` |

All formalize moves update `src/components/ui/index.ts` barrel + all consumer import paths (via codemod — paths are all `@/components/ui/X` and resolve through barrel, so zero breakage expected).

---

## 6. Icon sweep — Lucide replacements

Mechanical substitution pass across `src/**/*.tsx` (not just `components/ui/`):

| Current glyph | Lucide replacement |
|---|---|
| `›` / `>` (as arrow) | `<ChevronRight size={16} />` |
| `‹` / `<` (as arrow) | `<ChevronLeft size={16} />` |
| `×` / `✕` | `<X size={16} />` |
| `✓` / `✔` | `<Check size={16} />` |
| `✗` | `<X size={16} />` |
| `↑` | `<ArrowUp size={16} />` |
| `↓` | `<ArrowDown size={16} />` |
| `🔥` (streak) | `<Flame size={16} />` |
| `🎯` (goal) | `<Target size={16} />` |
| `🏆` (trophy) | `<Trophy size={16} />` |
| `💪` (strength) | `<Dumbbell size={16} />` |
| Other emoji | Case-by-case per semantic Lucide icon |

Import pattern (tree-shakeable):
```tsx
import { ChevronRight, X, Check } from 'lucide-react'
```

**Verification:** after sweep, regex scan for arrow glyphs and common emoji in `src/**/*.tsx` returns zero matches (except where emoji is literal user content, e.g., streak message strings).

---

## 7. Folder structure — complete the nesting

Finish the `layout/primitive/compound/` split that Part 1 half-started. Move existing 8 primitives out of `src/components/ui/*.tsx` root into `src/components/ui/primitive/`. Rename `LongPress.tsx` → `useLongPress.ts` (it's a hook, not a component).

End state:

```
src/components/ui/
├── index.ts                       # barrel (updated imports)
├── layout/
│   ├── Container.tsx
│   ├── Stack.tsx
│   ├── Grid.tsx
│   ├── Section.tsx
│   ├── Divider.tsx
│   └── index.ts
├── primitive/
│   ├── Button.tsx                 # NEW
│   ├── Card.tsx                   # NEW
│   ├── Heading.tsx                # NEW
│   ├── Pill.tsx                   # NEW
│   ├── Tag.tsx                    # NEW
│   ├── Skeleton.tsx               # NEW
│   ├── EmptyState.tsx             # NEW
│   ├── Input.tsx                  # NEW
│   ├── Select.tsx                 # NEW
│   ├── Avatar.tsx                 # NEW
│   ├── HeroBanner.tsx             # NEW
│   ├── BottomSheet.tsx            # moved from root
│   ├── NumberInput.tsx            # moved from root
│   ├── SegmentControl.tsx         # moved from root
│   ├── Sparkline.tsx              # moved from root
│   ├── Switch.tsx                 # moved from root
│   ├── Toast.tsx                  # moved from root
│   ├── ProgressBar.tsx            # moved from root
│   ├── useLongPress.ts            # moved + renamed from LongPress.tsx
│   └── index.ts
├── compound/
│   ├── Dialog.tsx
│   ├── Tabs.tsx
│   ├── Tooltip.tsx
│   ├── Menu.tsx
│   ├── Accordion.tsx
│   ├── Breadcrumb.tsx
│   ├── DataTable.tsx
│   └── index.ts
└── utils/
    └── cn.ts                       # clsx + tailwind-merge helper
```

Import convention stays stable — consumers import from `@/components/ui` (top barrel), never from nested paths.

---

## 8. Testing strategy — smoke + behavior

Per Q6 decision (B). Every component gets:

1. **Smoke test** — renders with default props, no throws, expected root element in DOM.
2. **Polymorphic `as` test** — for components that support `as`, verify correct element rendered for 2 alternatives (e.g., `<Card as="a">` renders `<a>`).
3. **Variant/size lookup tests** — every variant string maps to the expected class lookup (catches Tailwind-4 JIT misses from typos in lookup tables).
4. **Interaction tests** — `user-event` clicks/types/keyboard for components with behavior: Button (click + loading disables click), Input (onChange + error renders aria-invalid), Dialog (open triggers + escape closes + backdrop click closes), Tabs (click + arrow-key nav), Menu (open + item select), Accordion (toggle expand), Tag (onRemove click), Tooltip (open on hover/focus).
5. **cn() merge tests** — spot-check that `className` override wins via tailwind-merge on at least Button, Card, Input.

Estimated test additions: ~150–200 tests for Part 2 across ~28 component files. All use `// @vitest-environment jsdom` pragma (Part 1 convention). Co-located in `src/tests/ui/primitive/*.test.tsx` and `src/tests/ui/compound/*.test.tsx`.

Radix compound internals (focus trap, portal, escape handling) are NOT re-tested — that's Radix's responsibility. We test our wrapper API only.

---

## 9. Docs — markdown per component

`docs/design-system/examples/` gets one markdown file per primitive + compound. Each file:

```markdown
# Button

Brief one-line purpose.

## Props
| Prop | Type | Default | Description |
...

## Examples

### Primary CTA
\`\`\`tsx
<Button variant="primary" size="md" iconLeft={<Plus />}>
  Log workout
</Button>
\`\`\`

### Loading state
\`\`\`tsx
<Button loading>Saving…</Button>
\`\`\`

## Do / Don't
- Use `primary` (amber) for the main screen CTA
- Use `success` (emerald) for "action completed" confirms — not for initiating actions
- Don't nest Button inside Button
- Don't use `ghost` as a primary action — users miss it on touch
```

Also: one `docs/design-system/README.md` index listing all components + linking to examples + summarizing token layer, typography scale, and accessibility floor.

Total: ~29 markdown files (11 new primitives + 7 compounds + 8 formalized + 5 layout + README).

---

## 10. Rollout — updated for Part 2 with full adoption

Part 2 adopts each new primitive on existing pages wherever obviously applicable (Q7 decision A). This means bigger PRs but reality-tested APIs before SP2+ work starts. Icon sweep is global.

Order matters — lower tiers first so higher tiers can compose them:

**PR 2.1 — Part 1 tension resolution + `cn` helper**
- Container `size="full"` support
- Section `variant` prop support
- Add `src/components/ui/utils/cn.ts` (clsx + tailwind-merge)
- Add `tailwind-merge` dep
- Wrap Dashboard in `<Container size="full">`
- Tests for new Container/Section props

**PR 2.2 — Folder restructure**
- Move 8 existing primitives to `primitive/` folder
- Rename `LongPress.tsx` → `useLongPress.ts`
- Update barrel + verify all imports still resolve (consumers import from `@/components/ui`)
- Zero behavioral change — pure file move

**PR 2.3 — Core primitives: Button, Card, Heading**
- Build 3 primitives with tests + markdown docs
- Adopt Button on inline `<button className>` sites across app (scope confirmed during implementation — grep-based audit first)
- Adopt Card on dashboard/strength/measurements surface containers where applicable
- Adopt Heading on page titles + Section `variant="default"` headers where applicable

**PR 2.4 — Display primitives: Pill, Tag, Skeleton, EmptyState, Avatar**
- Build 5 primitives with tests + docs
- Adopt Pill on status badges across app (scope confirmed during implementation)
- Adopt EmptyState on all "no data yet" placeholders (scope confirmed during implementation)
- Skeleton adopted pre-load on Dashboard tiles + lists

**PR 2.5 — Form primitives: Input, Select + NumberInput alignment**
- Build Input + Select with tests + docs
- Refactor `NumberInput` to match Input API (`size`, `error`, `label`, `hint`) — breaking, 5 callsites updated (SetInput, PlateInventoryForm, PlateCalculatorSheet, EditSetSheet, DailyModal)
- Adopt Input on `<input className>` instances in forms (scope confirmed during implementation)

**PR 2.6 — HeroBanner + ProgressBar XP variant + Sparkline colors**
- Ship HeroBanner shell (gradient-only, no artwork)
- Add `variant="xp"` to ProgressBar, adopt on XP display
- Replace Sparkline inline color props with token-based defaults

**PR 2.7 — Compound: Dialog + Tooltip**
- Build Dialog (re-shaped API) + Tooltip (re-shaped API) with tests + docs
- Adopt Dialog everywhere current BottomSheet is used as modal + confirm dialogs
- Adopt Tooltip on metadata labels (muscle group abbreviations, chart axis hints)

**PR 2.8 — Compound: Tabs + Menu + Accordion**
- Build 3 compounds with tests + docs
- Adopt Tabs on Progress page (consolidate ad-hoc tabs)
- Adopt Menu on row-level edit/delete (workout sets, measurements)
- Accordion on long Settings sections

**PR 2.9 — Compound: Breadcrumb + DataTable**
- Build 2 custom compounds with tests + docs
- Adopt where applicable (Breadcrumb on Settings sub-pages if they exist; DataTable on measurements history)

**PR 2.10 — Icon sweep (global)**
- Replace `›`/`×`/`✓`/`✗`/`↑`/`↓` and emoji icons with Lucide across all `src/**/*.tsx`
- Mechanical pass, codemod-assisted
- Verify regex scan returns zero arrow/emoji matches outside user-content strings

**PR 2.11 — Docs + README**
- Write `docs/design-system/examples/*.md` for all ~29 components
- Write `docs/design-system/README.md` index
- Cross-link from top-level `README.md`

Each PR: `test:run` + `lint` + `typecheck` all green. Pre-push hook enforces. No PR exceeds ~40 files of diff except 2.2 (pure moves) and 2.10 (mechanical sweep).

---

## 11. Success criteria

1. All ~28 components compile + typecheck + lint clean.
2. `grep -rn "from '@/components/ui/[^']*/[^']*'"` in `src/` returns zero matches — all imports go through top barrel.
3. ~150–200 new tests added; all previous tests still pass (including Part 1's).
4. No arrow glyphs (`›`, `‹`, `×`, `✓`, `✗`, `↑`, `↓`) in `src/components/**/*.tsx` and `src/app/**/*.tsx` outside intentional user-content strings. Non-UI files (`src/lib/**`, `src/db/**`, tests) keep math symbols (`×` as multiplication) — not in sweep scope.
5. `docs/design-system/examples/*.md` exists for every component in §3, §4, §5; `README.md` index exists.
6. Dashboard page uses: `Container size="full"`, `Heading`, `Button`, `Card`, `Section` (both variants), at least one `EmptyState`, `ProgressBar variant="xp"`.
7. Every existing screen still renders with equivalent behavior — no regressions. Icon sweep may change visual appearance of glyphs but not information architecture.

---

## 12. Open questions — defer to plan/implementation phase

- `Prose` primitive for long-form text (Settings > Privacy/ToS) — deferred to SP5 when those pages actually exist. Not in Part 2 scope.
- Hero artwork for `HeroBanner` — deferred to SP3. Part 2 ships gradient-only.
- Dark/light theme toggle — explicitly out of scope. App stays dark-only through SP5. Token layer already supports future split via CSS custom properties.
- Visual regression testing tooling (Chromatic, Playwright snapshots) — deferred to SP5 or later. Not worth the infra cost until the design stabilizes.
- `Storybook` install — explicitly rejected. Markdown docs (§9) + component tests (§8) + adopted-in-real-pages (§10) cover the same ground without the dep bloat.

---

**Next step after this spec:** write implementation plan → `docs/superpowers/plans/2026-04-21-design-system-foundation-part-2-plan.md`.
