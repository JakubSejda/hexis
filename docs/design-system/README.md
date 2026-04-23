# Hexis Design System

Dark-first, mobile-first component library for Hexis. Built on Tailwind v4 (CSS variables via `@theme`), Radix UI where interaction matters, and Lucide icons.

## Token layer

Tokens live in `src/app/globals.css` under `@theme`. Consumers must reference tokens via Tailwind utilities, never hex literals.

| Category | Tokens |
|---|---|
| Surface | `background`, `surface`, `surface-raised`, `surface-sunken`, `border`, `foreground`, `muted` |
| Brand | `primary` (emerald = completion/success), `accent` (amber = CTA/XP/movement) with `*-soft` and `*-muted` variants |
| Status | `danger`, `success`, `warning`, `info` |
| Focus ring | `ring` (amber) |
| Radius | `sm`, `md`, `lg`, `xl` |

## Typography scale

- Display: `text-4xl font-bold` (section heroes)
- H1: `text-2xl font-bold`
- H2: `text-xl font-semibold`
- H3: `text-base font-semibold`
- Body: `text-sm`
- Caption/meta: `text-xs text-muted`
- Numeric data: `text-3xl font-bold` or larger for hero values

## Accessibility floor

- Focus ring visible on all interactive components (`focus-visible:ring-2 focus-visible:ring-ring`)
- Touch targets ≥ 44×44px on mobile (buttons use `h-11` or `h-12`)
- `aria-current="page"` on active nav/breadcrumb, `aria-describedby` for error/hint text
- Radix compound internals (focus trap, portal, keyboard nav) inherited unchanged

## Component catalog

### Layout
- [Container](./examples/container.md) — max-width centered wrapper with responsive padding
- [Stack](./examples/stack.md) — vertical flex with configurable gap
- [Grid](./examples/grid.md) — 2/3/4-column grid with configurable gap
- [Section](./examples/section.md) — titled content group with optional action slot
- [Divider](./examples/divider.md) — 1px horizontal/vertical separator

### Primitives — form & input
- [Input](./examples/input.md) — text input with label/hint/error chrome
- [Select](./examples/select.md) — native select with chevron indicator
- [NumberInput](./examples/numberinput.md) — +/- stepper around a numeric input
- [Switch](./examples/switch.md) — boolean toggle

### Primitives — display
- [Button](./examples/button.md) — 5 variants + loading state
- [Card](./examples/card.md) — surface container, 3 variants
- [Heading](./examples/heading.md) — levels 1–3 + display/region variants
- [Pill](./examples/pill.md) — status pill with tone mapping
- [Tag](./examples/tag.md) — removable tag with icon
- [Avatar](./examples/avatar.md) — tier-colored avatar with initials fallback
- [EmptyState](./examples/emptystate.md) — "no data yet" placeholder with icon + CTA
- [Skeleton](./examples/skeleton.md) — loading placeholder shimmer
- [ProgressBar](./examples/progressbar.md) — linear progress with tone or xp variant
- [Sparkline](./examples/sparkline.md) — inline SVG line chart with tone

### Primitives — navigation
- [SegmentControl](./examples/segmentcontrol.md) — URL-routed segmented picker
- [HeroBanner](./examples/herobanner.md) — full-bleed banner with gradient/image slot

### Feedback
- [Toast](./examples/toast.md) — transient notification via `useToast()`
- [BottomSheet](./examples/bottomsheet.md) — mobile slide-up modal

### Compounds — Radix-backed
- [Dialog](./examples/dialog.md) — re-shaped confirm/modal
- [Tooltip](./examples/tooltip.md) — re-shaped hover/focus tooltip
- [Tabs](./examples/tabs.md) — subcomponent pattern tablist
- [Menu](./examples/menu.md) — dropdown menu
- [Accordion](./examples/accordion.md) — collapsible sections

### Compounds — custom
- [Breadcrumb](./examples/breadcrumb.md) — hierarchical nav with ChevronRight separator
- [DataTable](./examples/datatable.md) — thin table wrapper with columns config

### Hooks
- [useLongPress](./examples/uselongpress.md) — long-press gesture handler

### Utils
- [cn](./examples/cn.md) — `clsx` + `tailwind-merge` combined class-name helper

## Import convention

All components come through the top barrel:

```tsx
import { Button, Card, Heading, Dialog } from '@/components/ui'
```

Sub-barrels (`@/components/ui/layout`, `@/components/ui/primitive`, etc.) exist but consumers should not import from them directly — the top barrel guarantees a stable public surface.

## Testing convention

- Every component has a Vitest test in `src/tests/ui/**` with the `// @vitest-environment jsdom` pragma
- Interaction tests use `@testing-library/user-event` (click, type, keyboard)
- Radix internals (focus trap, portal, escape handling) are NOT re-tested — that's Radix's responsibility

## Spec

Full design spec: `docs/superpowers/specs/2026-04-21-design-system-foundation-part-2-design.md`.
