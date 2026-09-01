# Reforge R7 — grammar cleanup (design)

**Date:** 2026-09-01
**Status:** approved — cleanup slice against the already-approved Reforge contract
**Binding reference:** `docs/superpowers/prototypes/2026-08-14-reforge/variant-b.html` + `docs/superpowers/specs/2026-08-14-reforge-hud-design.md`
**Origin:** post-Reforge audit of `main` (R1–R6 merged, #34–#39). R6's screen sweep stopped at screen level; the primitive layer and a set of leaf components never got the grammar. `globals.css` itself labels the emerald block "Semantic success (feedback only, never decorative)" while ~20 call sites use `text-primary`/`bg-primary` decoratively — the code contradicts its own comment.

## Audit findings this slice closes

1. **Decorative emerald survives.** `--color-primary: #34d399` is still a de-facto brand primary, used on: `Switch` (checked), `Toast` (success), `Tabs` (active trigger), `Pill` (success), `ProgressBar`/`Sparkline` (`tone="primary"` default), `AvatarWithLevel` (level badge), `PhotosPageClient` (FAB), `BeforeAfter`/`UploadSheet` (segment toggles), `PlanPicker` (recommended plan), `SessionHistoryList`, `SessionDetailView`, `PlateInventoryForm`, `StepperNav`, `SetRow`, `SessionSummary`, `CalendarDay`, `MonthStats`.
2. **Radius ladder did not die.** 16 files still carry `rounded-lg/xl/2xl` — including the never-reforged `Toast` (lg), `Tabs` (lg/md) and `Dialog` (xl), plus dashboard widgets (`WeekPeek` xl, `RewardsBalanceCard` 2xl, `MuscleWidget`), the whole photos area (5 files), `PlanPicker`, `ResumeBanner`, `StagnationList`, auth layout, settings/macros.
3. **Hexagon clip is copy-pasted 4×** (`Checkbox`, `Radio`, `ExerciseCard`, `OnboardingWizard`) — the R1 spec asked for one shared clip utility.
4. **Off-palette hex literals** (found while fixing #1, same defect in a different disguise). Charts, heatmaps and SVG contexts — where Tailwind classes cannot reach — still carry Tailwind-default values instead of HUD tokens: `#10b981` (emerald-500, not `--color-success` #34d399), `#6b7280` (grey-500, not `--color-muted`), `#1f2733` (pre-Reforge border), `#065f46`, `#0ea5e9`, `#8b5cf6`, `#eab308`. Affects `heatmap-colors`, `XpHistoryChart`, `MeasurementRow`, `SparklineCard`, `CalendarDay`, `NutritionStreak`, `VolumeChart`, `OneRmChart`, `MuscleRank`, `AnatomicalBody`.
5. **Chrome repaints autofilled inputs** near-white (#e8f0fe) with black text — verified in-browser on `/login`, the first screen a beta tester sees. Invisible to the test suite.

## Decisions

### Colour role mapping (derived from the HUD grammar, not re-designed)
| Role | Token | Applied to |
|---|---|---|
| system / info / nav / suggestion | `--color-system` (cyan) | `Switch` checked, `Tabs` active trigger, `StepperNav` current marker, `BeforeAfter` + `UploadSheet` segment toggles, `PlanPicker` recommended edge + pill, `SessionHistoryList` plan slug, ghost text actions (`SessionDetailView`, `PlateInventoryForm`) |
| action / XP / progression | `--color-accent` (amber) | `AvatarWithLevel` level badge, photos FAB |
| semantic success | `--color-success` (emerald) | `Pill variant="success"`, `Toast` success, `CalendarDay` hit day, `MonthStats` "dní hit" |
| neutral data | `--color-foreground` | `SessionSummary` stat values, `SetRow` values |

### Token layer
- `--color-primary`, `--color-primary-soft`, `--color-primary-muted` are **deleted**. Emerald keeps only its semantic names: `--color-success` (existing) plus new `--color-success-soft` (#064e3b) and `--color-success-muted` (#6ee7b7). Removing the token is what makes the grammar enforceable — there is no longer a neutral-sounding "primary" to reach for.
- New `.hud-hex` utility in `globals.css`; the 4 inline `clipPath` copies collapse onto it.

### Primitive tone APIs
`ProgressBar` and `Sparkline` drop `tone="primary"` and gain `tone="system"` / `tone="accent"`. This is a breaking rename rather than an additive alias: the whole point is that "primary" stops existing. `ProgressBar` default tone becomes `system` (a non-XP bar is system info); `Sparkline` default stays `muted`. `typecheck` enumerates every caller.

### Radius
All remaining `rounded-lg/xl/2xl` become `hud-clip` (plate scale) or `hud-clip-sm` (control scale). `Dialog` becomes a proper two-layer plate (edge + surface) like `Card`.
**Out of scope:** `rounded-md` (22×) and `rounded-full` (18×) on inputs, avatars and dots. Those are the control/round scale, not the card scale R6 was meant to kill; converting them is a separate judgement call about the hexagon alphabet and would balloon this slice.

### Palette alignment (finding 4)
Role-preserving shade swaps only — every value keeps its meaning, it just moves onto the HUD token: emerald→`#34d399`, grey→`#7c8da6`, old border→`#1e293b`, emerald-dark→`#064e3b`, sky→`#22d3ee`, violet→`#a78bfa` (matches `--color-cal-photo`), yellow→`#fbbf24`. One deliberate role change: the nutrition calendar's "today" outline moves from emerald to cyan, because today is a system state, not a success.
**Excluded:** `src/lib/tiers.ts` tier colours (tier tokens are an explicitly parked P4 item) and the *roles* in chart ramps — recolouring telemetry emerald→cyan would be re-designing, not aligning, and needs an owner call.

### Autofill (finding 5)
`background-color` is not overridable on `:-webkit-autofill`; a 1000px inset box-shadow plus `-webkit-text-fill-color` is the only reliable repaint. Added to `globals.css`.

### Regression guard
ESLint `no-restricted-syntax` bans, across `src/**/*.tsx` **including the UI kit**, class-name literals matching `(bg|text|border|ring|from|to|via)-primary` and `rounded-(lg|xl|2xl|3xl)`. Without it a deleted token fails silently — Tailwind simply generates no rule, so a regression looks like slightly-wrong styling rather than an error.

## Constraints
- Czech vocabulary unchanged; no copy edits.
- WCAG AA maintained: cyan #22d3ee and amber #f59e0b on `--color-surface` #0b1220 both clear AA for the sizes used; emerald keeps its existing pairing.
- Gate green (typecheck / lint / tests) with class assertions updated per touched primitive. New assertions were mutation-checked — reverting `Switch` to emerald and `Dialog` to `rounded-xl` makes them fail — so they are real guards, not tautologies.
- Verified in the browser on `/login`, `/dashboard`, `/settings/macros`, `/nutrition`, `/progress`, `/progress/photos`, `/training`, `/habits` (dialog open). The `Switch` knob lost its own clip during that pass: clipping knob *and* track turned the "on" state into an unreadable glyph, so the corner cut now lives on the track only.

## Out of scope
`rounded-md` / `rounded-full` sweep (above), Dialog→BottomSheet mobile pattern, NumberInput mobile UX, icon-only Button size, tier colour tokens — all remain on the P4 parking list.
