# Reforge — „HUD" visual identity (design)

**Date:** 2026-08-14
**Status:** approved — owner picked variant B from three working prototypes („Baví mě B")
**Binding reference:** `docs/superpowers/prototypes/2026-08-14-reforge/variant-b.html` — when this spec and the prototype disagree, the prototype wins.
**Origin:** owner rejected the post-Polish look („totálně tragický — UI, UX, design, animace, prokliky; chybí landing page"). Root cause of the failure: Polish fixed craft but gave no identity, and the owner never approved a concrete visual. Reforge fixes both: an approved prototype IS the contract.

## The HUD design language

### Color grammar (strict, never mixed)
| Token | Value | Role |
|---|---|---|
| `--color-background` | `#05080F` | void navy-black, page ground |
| `--color-surface` | `#0B1220` | plate body |
| `--color-surface-raised` | `#111B2E` | raised plate / hover |
| `--color-border` | `#1E293B` | grid-line blue-grey, plate edges at rest |
| `--color-foreground` | `#E2F1F8` | ice text |
| `--color-muted` | `#7C8DA6` | secondary (AA on surface) |
| `--color-muted-strong` | `#A9BDD4` | important secondary values |
| `--color-system` | `#22D3EE` | **cyan = system/info**: edges of active plates, timers, nav accents, suggestions, info states |
| `--color-accent` | `#F59E0B` | **amber = action/XP only**: primary CTAs, XP bars/floats, quest highlight, set-dots |
| `--color-danger` | `#EF4444` | reserved: destructive + RPE ≥ 9.5 |
| `--color-success` | `#34D399` | kept for semantic success feedback only (toasts, checks) — never decorative |

Emerald loses its „brand primary" role — success Buttons migrate to amber (action) per HUD grammar; emerald survives only as semantic success.

### Structure — plates, not cards
- **Plate** = angular panel with ONE clipped corner (12–16px, CSS `clip-path`), 1px edge implemented as a two-layer element (outer = edge color + `p-px`, inner = surface, same clip). Radius ladder dies; plates replace rounded cards app-wide.
- Edge at rest `--color-border`; **active/focused plate** gets cyan edge; **the screen's single call-to-action plate** (quest, primary form) gets amber edge. One amber plate per screen, max.
- Corner brackets (`⌐ ¬`) only on the screen's active/hero plate.
- Page background carries a ~3% opacity hex-grid (inline SVG pattern, in `globals.css` as data-URI on `body::before`).

### Typography
- Labels: `ui-monospace`… **no — Geist Mono stays** (`--font-mono`), uppercase, 10–11px, `tracking-[0.2em]`, muted/system color.
- Data/numbers: Geist Mono bold, tabular (already global).
- Headings: Geist Sans 900, uppercase, `italic` + `skew(-4deg)` on display level (H1/hero), straight for H2/H3.
- Body: Geist Sans unchanged.

### Hexagon alphabet
HEXIS = hexagon. Checkbox/Radio → hex-shaped controls; set-dots and progress markers → mini hexes; tier emblem → hex rosette (SVG); rest timer → draining hex ring (SVG `pathLength`). One shared `HexIcon`/clip utilities module.

### Motion system (`--ease-hud`, guarded by `prefers-reduced-motion`)
- **Power-on**: screen-entry stagger (~90ms/plate): opacity + translateY(8px) + one edge-light sweep across the plate top.
- **Charge**: XP/progress bars fill with a scanning gradient tail.
- **Impact**: logging a set = amber pulse ring from the button + floating mono `+XP`; habit check = hex checkbox pop + success flash.
- **Tick**: rest hex-ring drains visibly per second.
- Framer-motion NOT added — CSS keyframes + small JS hooks suffice (prototype proves it).

## Slices (one PR each, prototype-fidelity reviewed per slice)

| Slice | Scope |
|---|---|
| **R1 — HUD foundation** | Tokens (palette above), hex-grid ground, Plate rework of `Card` (two-layer clip), `Button` (clipped corners, amber primary / cyan-outline system / ghost), `Pill`, `ProgressBar` (charge animation), `Checkbox`/`Radio` hex shape, `Heading` display treatment, status-strip component. Every screen inherits the new ground+plates at once. |
| **R2 — Dashboard** | Rebuild per prototype: mono status strip, hero plate (hex rosette emblem + LEVEL + XP charge bar), amber quest plate with brackets, telemetry row, habits plate. |
| **R3 — Workout** | Mission header + segment blade, exercise plate, set logger with hex set-dots, hex rest ring, impact juice (+XP float, pulse). |
| **R4 — Onboarding & celebrations** | Wizard as HUD boot sequence; level-up/tier-up celebration overlay; quest-complete moment („QUEST SPLNĚN +120 XP"). |
| **R5 — Landing page** | Public `/` for the beta — HUD identity, hero = live-feeling HUD mock, CZ copy, CTA to login. |
| **R6 — Screen sweep** | Nutrition/Habits/Rewards/Bio/Calendar/Stats/Settings adopt plates + grammar; kill remaining rounded-card look. |

## Constraints
- Czech vocabulary unchanged except where the prototype introduces approved labels (Dnešní quest, Začít quest, Mise aktivní, Cvik 01/08).
- Accessibility floor stays: WCAG AA text contrast on new palette (verified per token), focus-visible, reduced-motion.
- Tests: primitives keep role/name contracts; class-assertions updated per slice. Full gate green per PR (CI enforces).

## Out of scope
Sound design, haptics, avatar art beyond the hex rosette, theme switcher (HUD is single-theme by design).
