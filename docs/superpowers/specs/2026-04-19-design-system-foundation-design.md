# Design System Foundation — SP1 Design Spec

**Status:** Draft
**Date:** 2026-04-19
**Scope:** Sub-project 1 of 5 in the Hexis design overhaul
**Dominant mode:** App 4 (Easlo) clean-utility overlay with App 1/3/5 gamification garnish — not full RPG

---

## 1. Why this sub-project exists

The MVP landed functionally but visually raw: 284 inline hex literals across 70 files, no shared primitives, emoji/unicode arrows scattered, no type hierarchy. Before any screen-level redesign (SP3 Dashboard, SP4 Muscle language, etc.) can proceed, Hexis needs a **token layer** and a **component library** that all future work composes from.

This spec defines the foundation. No screen-level changes happen here — those live in SP2–SP5.

---

## 2. Locked decisions (recap)

| # | Decision | Choice |
|---|---|---|
| 1 | Palette | Dual **emerald + amber** (emerald = completion/success; amber = action/CTA/XP/movement). Danger = `#EF4444`. |
| 2 | Typography | System sans for body; **Geist Mono letter-spaced** for region-level section headers (`L I F E   A R E A S`). |
| 3 | Density | Soft & cozy — `rounded-2xl` cards (~16px), `rounded-xl` buttons (~12px), generous `p-4`/`p-6`. |
| 4 | Component scope | **Full catalog (C)** — new primitives + formalize existing + Lucide icons. |
| 5 | Icons | **Lucide** (replaces scattered emoji/unicode arrows). |

---

## 3. Token layer

### 3.1 Current state

`src/app/globals.css` already defines (via Tailwind 4 `@theme` block):

```css
--color-background: #0a0e14;
--color-surface:    #141a22;
--color-border:     #1f2733;
--color-foreground: #e5e7eb;
--color-muted:      #6b7280;
--color-primary:    #10b981;   /* emerald */
--color-accent:     #f59e0b;   /* amber */
--color-danger:     #ef4444;
```

These become `bg-primary`, `text-accent`, `border-border`, etc. automatically in Tailwind 4.

### 3.2 What's missing — extend `@theme`

Add the following semantic tokens (not palette tokens — palette is done):

```css
/* Emerald scale — for progress bars, subtle tints */
--color-primary-soft:  #064e3b;   /* emerald-900 tint */
--color-primary-muted: #34d399;   /* emerald-400 for hover/focus */

/* Amber scale — for XP bars, CTAs, quest highlights */
--color-accent-soft:   #78350f;   /* amber-900 tint */
--color-accent-muted:  #fbbf24;   /* amber-400 for hover/focus */

/* Surface elevation */
--color-surface-raised:  #1a2230;  /* one step lighter than surface */
--color-surface-sunken:  #070b10;  /* one step darker — input wells */

/* Semantic status */
--color-success: var(--color-primary);
--color-warning: var(--color-accent);
--color-info:    #38bdf8;          /* sky-400 — rare, info-only */

/* Focus ring */
--color-ring: var(--color-accent);
```

Font tokens:

```css
--font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
             'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Inter', sans-serif;
--font-mono: 'Geist Mono', ui-monospace, 'SF Mono', 'Menlo', monospace;
```

Geist Mono loads via `next/font/google` in `src/app/layout.tsx` — matches existing Next 16 conventions.

Radius tokens (if we want to theme them later):

```css
--radius-sm: 0.5rem;   /* 8px  — pills, tags */
--radius-md: 0.75rem;  /* 12px — buttons, inputs */
--radius-lg: 1rem;     /* 16px — cards */
--radius-xl: 1.5rem;   /* 24px — hero banners, sheets */
```

### 3.3 Migration — 284 hex literals → tokens

Mechanical substitution pass across `src/**/*.tsx`:

| Inline hex | Replace with |
|---|---|
| `#0A0E14` / `#0a0e14` | `bg-background` |
| `#141A22` / `#141a22` | `bg-surface` |
| `#1F2733` / `#1f2733` | `border-border` / `bg-border` |
| `#E5E7EB` / `#e5e7eb` | `text-foreground` |
| `#6B7280` / `#6b7280` | `text-muted` |
| `#10B981` / `#10b981` | `text-primary` / `bg-primary` |
| `#F59E0B` / `#f59e0b` | `text-accent` / `bg-accent` |
| `#EF4444` / `#ef4444` | `text-danger` / `bg-danger` |

Edge cases (rgba, drop-shadow filters in `globals.css`) stay as-is — they reference the amber hex numerically inside keyframes and can stay literal until a follow-up pass.

**Verification gate:** after migration, `grep -r "#[0-9a-fA-F]\{6\}" src/` should return only hits inside `globals.css`, SVG `fill`/`stroke`, and recharts color props (which take literals, not classes).

---

## 4. Typography scale

Reference: App 4 (Easlo) restraint + App 1/3 letter-spaced mono headers.

### 4.1 Type tokens

| Name | Usage | Class |
|---|---|---|
| `display` | Page hero title (Dashboard only) | `text-3xl font-semibold tracking-tight` |
| `h1` | Page titles | `text-2xl font-semibold tracking-tight` |
| `h2` | Card titles | `text-lg font-semibold` |
| `h3` | Sub-section | `text-base font-semibold` |
| `region` | **Letter-spaced mono section headers** (App 1 style: `L I F E   A R E A S`) | `font-mono text-xs tracking-[0.2em] uppercase text-muted` |
| `body` | Default paragraph | `text-sm text-foreground` |
| `caption` | Helper text, metadata | `text-xs text-muted` |
| `numeric` | Weights, reps, XP, calories | `font-mono tabular-nums` |

### 4.2 Heading component API

```tsx
<Heading level={1|2|3} variant="default|region" className?>
  {children}
</Heading>
```

When `variant="region"`, component **automatically inserts en-spaces** between characters and uppercases — authors write `Life Areas`, component renders `L I F E   A R E A S`. Prevents accessibility regressions (screen readers skip over letter-spaced hacks if authors hand-type the spaces).

---

## 5. Component catalog

Three tiers:

- **Layout** — structural, no visuals beyond spacing
- **Primitive** — atomic, composable
- **Compound** — behavior wrapped, multi-part

All live in `src/components/ui/`. Existing primitives stay where they are; new ones slot in alongside.

### 5.1 Layout (new)

| Component | Purpose | Props |
|---|---|---|
| `Container` | Max-width wrapper with consistent horizontal padding | `as?`, `size: 'sm'\|'md'\|'lg'` (default `md` = max-w-2xl mobile-first) |
| `Stack` | Vertical flow with gap | `gap: 2\|3\|4\|6\|8`, `as?` |
| `Grid` | Responsive grid shorthand | `cols: 1\|2\|3\|4`, `gap: …`, `responsive?: {sm, md, lg}` |
| `Section` | Region with optional `<Heading variant="region">` title + content slot | `title?`, `action?` (right-aligned slot), `children` |
| `Divider` | Horizontal rule using `border-border` | `label?` (for "OR" dividers) |

### 5.2 Primitive (new)

| Component | Purpose | Notes |
|---|---|---|
| `Button` | Only way to trigger an action | Variants: `primary` (amber), `secondary` (emerald outline), `ghost`, `danger`. Sizes: `sm`/`md`/`lg`. Supports `iconLeft`/`iconRight` via Lucide. Loading state with spinner. |
| `Card` | Container with surface + border + `rounded-2xl` | Variants: `default`, `interactive` (hover state), `flush` (no padding). |
| `Heading` | See §4.2 | — |
| `Pill` | Compact status badge | Color variants map to semantic tokens: `neutral`, `success`, `warning`, `danger`, `accent`. |
| `Tag` | Similar to Pill but clickable/removable | `onRemove?` → renders X icon. Used for filters, exercise tags. |
| `Skeleton` | Shimmer placeholder | Shapes: `text`, `block`, `avatar`, `card`. Animated with Tailwind `animate-pulse`. |
| `EmptyState` | Zero-data placeholder | `icon` (Lucide), `title`, `description`, `action?` (usually a Button). |
| `Input` | Text input | Variants: `default`, `search` (with magnifying glass icon). Error state. |
| `Select` | Native `<select>` wrapper with custom chevron | Consistent with Input styling. |
| `Avatar` | Round image/initial | Sizes `xs/sm/md/lg/xl`. Fallback = initials on `bg-surface-raised`. |
| `HeroBanner` | Full-bleed image + overlay + title | For Dashboard (SP3). Supports `<Heading>` overlay slot. |

### 5.3 Compound (new, Radix-backed)

| Component | Radix primitive | Why |
|---|---|---|
| `Dialog` | `@radix-ui/react-dialog` (already installed) | Confirms, destructive actions, forms |
| `Tabs` | `@radix-ui/react-tabs` | Progress page already uses ad-hoc tabs — consolidate |
| `Tooltip` | `@radix-ui/react-tooltip` | On touch, auto-delegates to tap-to-popover. Don't over-use — metadata only. |
| `Menu` | `@radix-ui/react-dropdown-menu` | Row-level edit/delete on workout sets, measurements |
| `Accordion` | `@radix-ui/react-accordion` | FAQ, collapsible long content in Settings |
| `Breadcrumb` | Custom (trivial) | Settings sub-pages once they land |
| `DataTable` | Custom thin wrapper | Keeps tables (`<thead>`/`<tbody>`) styled consistently; no sorting/paging logic at this tier |

### 5.4 Formalize existing

These already exist in `src/components/ui/` but need:
- Token migration (no inline hex)
- API consistency pass (prop naming, default sizes)
- Storybook-style example in `docs/design-system/examples/` (markdown only — no Storybook install)

| Component | Current state | Action |
|---|---|---|
| `BottomSheet` | Working, Radix Dialog-based | Swap inline hex → tokens, extract into dialog family |
| `NumberInput` | Working | Token migration only |
| `SegmentControl` | Working | Token migration + align API with future `Tabs` |
| `Sparkline` | Working | Token migration (colors passed as props — add prop-safe default tokens) |
| `Switch` | Working | Token migration |
| `Toast` | Working | Token migration, confirm it re-uses `Dialog` a11y patterns |
| `ProgressBar` | Working | Token migration + add `variant="xp"` using amber |
| `LongPress` | Working | No visual change, leave as-is |

### 5.5 Icons — Lucide

Install `lucide-react`. Replace scattered emoji/unicode arrows:

| Current | Replacement |
|---|---|
| `›` | `<ChevronRight size={16} />` |
| `×` | `<X size={16} />` |
| `✓` | `<Check size={16} />` |
| `✗` | `<X size={16} />` (same as above) |
| `↑` / `↓` | `<ArrowUp />` / `<ArrowDown />` |
| `⓵`/status glyphs | Contextual: `Flame`, `Target`, `Trophy`, `Dumbbell`, etc. |

Import individually for tree-shaking: `import { ChevronRight } from 'lucide-react'` — never barrel-import.

---

## 6. File structure

```
src/components/ui/
├── index.ts                  # barrel for the DS — new
├── layout/
│   ├── Container.tsx
│   ├── Stack.tsx
│   ├── Grid.tsx
│   ├── Section.tsx
│   └── Divider.tsx
├── primitive/
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Heading.tsx
│   ├── Pill.tsx
│   ├── Tag.tsx
│   ├── Skeleton.tsx
│   ├── EmptyState.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Avatar.tsx
│   └── HeroBanner.tsx
├── compound/
│   ├── Dialog.tsx
│   ├── Tabs.tsx
│   ├── Tooltip.tsx
│   ├── Menu.tsx
│   ├── Accordion.tsx
│   ├── Breadcrumb.tsx
│   └── DataTable.tsx
├── BottomSheet.tsx           # existing, stays at root
├── LongPress.tsx
├── NumberInput.tsx
├── ProgressBar.tsx
├── Sparkline.tsx
├── Switch.tsx
├── Toast.tsx
└── SegmentControl.tsx

docs/design-system/
├── README.md                 # index + principles
└── examples/
    ├── button.md             # usage + props + do/don't
    ├── card.md
    └── …                     # one per component
```

Nested folders (`layout/`, `primitive/`, `compound/`) are a judgment call — skip if we hate them during implementation and flatten. Keep this spec's decision soft.

---

## 7. Accessibility floor

- All interactive primitives hit 44×44 touch target (mobile-first)
- Focus rings use `--color-ring` (amber) — never removed, only restyled
- Color contrast: foreground on background ≥ 4.5:1, muted on background ≥ 3:1 (verified via WCAG)
- All Radix compound components inherit a11y — don't override ARIA props
- `Heading variant="region"` generates real uppercase text with tracking, not letter-spaced hack
- `Tooltip` triggers MUST also work on tap (Radix handles via `delayDuration={0}` + touch fallback)

---

## 8. Out of scope (deferred to later sub-projects)

- **SP2:** bottom nav / sidebar / Life Areas concept
- **SP3:** Dashboard screen layout, hero artwork
- **SP4:** anatomical illustrations, muscle rank radar
- **SP5:** Reward system, Player Bio, Habit tracking, Quest Calendar
- **Non-visual:** storybook, visual regression testing, dark/light theme switching (dark-only for now)

---

## 9. Success criteria

1. `grep -r "#[0-9a-fA-F]\{6\}" src/**/*.tsx` returns zero hits (all hex literals tokenized).
2. No emoji/unicode arrows remain in `src/components/**/*.tsx` — all replaced with Lucide.
3. All 23+ components compile, typecheck clean, lint clean.
4. Existing 183 tests still pass — **no behavioral changes** from SP1.
5. Usage examples compile in `docs/design-system/examples/*.md` (doctested by a tiny script or manually verified — decide during plan).
6. Every existing screen renders with identical layout + spacing — SP1 is a **refactor**, not a redesign.

---

## 10. Rollout approach (for the plan phase)

This is intentionally light — the plan will flesh it out:

1. **PR 1 — Tokens & deps:** extend `@theme`, add `lucide-react`, add Geist Mono via `next/font`, add remaining `@radix-ui/*` packages. No component changes.
2. **PR 2 — Hex migration:** mechanical sed-like pass across all 70 files. No API changes. Verified via grep.
3. **PR 3 — Layout primitives:** Container, Stack, Grid, Section, Divider. Adopt on 2–3 existing pages to prove the API.
4. **PR 4 — Core primitives:** Button, Card, Heading, Pill, Tag, Skeleton, EmptyState. Adopt wherever obviously applicable.
5. **PR 5 — Form primitives:** Input, Select, Avatar. Formalize existing (NumberInput, Switch, SegmentControl, BottomSheet, Toast, ProgressBar, Sparkline).
6. **PR 6 — Compound:** Dialog, Tabs, Menu, Tooltip, Accordion, Breadcrumb, DataTable, HeroBanner.
7. **PR 7 — Icon sweep:** replace `›`/`×`/`✓`/`✗` with Lucide equivalents.
8. **PR 8 — Docs:** `docs/design-system/README.md` + one `examples/*.md` per component.

Each PR runs `test:run` + `lint` + `typecheck` green before merge. Pre-push hook enforces this.

---

## 11. Open questions for implementation phase

- Should `Button`'s `primary` variant be amber-filled (high emphasis) or emerald-filled (success-leaning)? Recommendation: **amber** for CTAs, emerald reserved for "success state" buttons (save-and-close, mark complete). Revisit when we build the first real screen.
- `HeroBanner` — do we ship a version without image (gradient fallback) in SP1, or wait for SP3 where it'll actually get used? Recommendation: **ship shell in SP1, artwork in SP3.**
- Do we need a `Prose` primitive for long-form text (Settings > Privacy/ToS)? Probably yes but defer to SP5 when we actually write those pages.

---

**Next step after this spec:** write implementation plan → `docs/superpowers/plans/2026-04-19-design-system-foundation-plan.md`.
