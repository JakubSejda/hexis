# Web Interface Guidelines audit — remediation (design)

**Date:** 2026-09-11
**Status:** approved — owner approved the slice order on 2026-09-11
**Binding references:** `docs/superpowers/prototypes/2026-08-14-reforge/variant-b.html` (HUD identity), `~/SideProjects/.claude/skills/web-design-guidelines` (rule source: `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`)
**Origin:** owner asked for a full-app review against the rules added to `~/SideProjects/.claude/skills` on 2026-09-03. Audit ran over 167 non-test `.tsx` files plus `globals.css`, `layout.tsx` and `manifest.json` on `main` at `f67e87f` (R1–R7 merged).

Two of the three skills excluded themselves and were not used: `landing-page-preflight` ("Not for product UI, dashboards, or sites with an existing design system"), and `design-md` ("Never write a DESIGN.md by extracting an existing SideProjects site. The user has declined that."). Hexis therefore still has no `DESIGN.md` — deliberately, not by omission.

## Why this is not a design change

Every finding below is a compliance or correctness defect against an external rule set. The HUD identity is not reopened: no palette, no geometry, no layout decisions. The one prototype produced during this session (control-scale variants, artifact `c1832a41`) was **rejected by the owner as off-identity and is dead** — nothing in this spec builds on it.

## Findings (39, grouped by slice)

### W1 — platform chrome (4 files)

| # | Location | Defect |
|---|---|---|
| 1 | `layout.tsx:24` | `maximumScale: 1` disables pinch zoom — named anti-pattern |
| 2 | `layout.tsx:21` | `themeColor: '#0A0E14'` ≠ ground `#05080F` (`globals.css:20`); pre-Reforge value |
| 3 | `manifest.json:8,9` | `theme_color`/`background_color` carry the same stale value → PWA splash and status bar are off-palette |
| 4 | `layout.tsx:30` | `<html class="dark">` with no `color-scheme: dark` → native scrollbars, `<select>` and date pickers render light |
| 5 | `layout.tsx:29` | no skip link to `<main>` (`AppShell.tsx:22`) |
| 6 | `globals.css` | no `touch-action: manipulation` → 300 ms double-tap delay on every control in the PWA |
| 7 | `globals.css` | no `-webkit-tap-highlight-color` → default blue tap flash over the HUD palette |
| 8 | `globals.css` | no `overscroll-behavior: contain` → body scroll-chains behind open sheets |
| 9 | `globals.css:181` | reduced-motion block omits `confetti-fall` (`:204`) |

### W2 — login and async feedback (2 files)

| # | Location | Defect |
|---|---|---|
| 10 | `login-form.tsx:52` | no `autoComplete="email"`, no `name` — password managers cannot fill |
| 11 | `login-form.tsx:52` | no `spellCheck={false}` on the email field |
| 12 | `login-form.tsx:60` | no `autoComplete="current-password"`, no `name` |
| 13 | `login-form.tsx:70` | error is not `aria-live`; focus does not move to the first error on submit |
| 14 | `Toast.tsx:19` | toast container has no `aria-live="polite"` — every async confirmation is silent to assistive tech |
| 15 | `Toast.tsx:30` | `text-white` literal instead of a token |

`autoComplete` appears zero times in `src`; login is the only screen where it matters today.

### W3 — the Sheet layer (1 new primitive, 9 call sites)

| # | Location | Defect |
|---|---|---|
| 16 | `BottomSheet.tsx:17` | `focus:outline-none` with no focus replacement |
| 17 | `BottomSheet.tsx:17` | `rounded-t-2xl` — the only shared primitive that never got the HUD grammar |
| 18 | `eslint.config.mjs:31,35` | R7 radius guard regex `\brounded-(lg\|xl\|2xl\|3xl)\b` misses directional variants, which is exactly how #17 survived |
| 19 | `BottomSheet.tsx:17` | no `overscroll-behavior: contain` |
| 20 | `BottomSheet.tsx:22` | title is `text-base font-semibold`; `Dialog` uses a mono eyebrow |
| 21 | `EditSetSheet.tsx:3` | imports both `BottomSheet` and `Dialog` — the split has no rule behind it |

### W4 — accessibility, copy, URL state, performance (24 files)

| # | Location | Defect |
|---|---|---|
| 22 | `CalendarGridClient.tsx:22` | `<div onClick>` wrapper — not keyboard reachable, no role |
| 23 | `TimeRangePicker.tsx:17` | `role="tablist"`/`role="tab"` with no `aria-controls`, no tabpanel, no arrow-key handling |
| 24 | `AnatomicalBodyDual.tsx:19` | same ARIA misuse |
| 25 | `UploadSheet.tsx:90` | `<input type="file">` with no label and no `aria-label` |
| 26 | `MeasurementCell.tsx:41` | accessible name is the bare value or `—` — no measure or date context |
| 27 | `HabitsPageClient.tsx:185` | `▲`/`▼` glyphs not `aria-hidden`; button has no `aria-expanded` |
| 28 | `Avatar.tsx:38` | `<img>` with no `width`/`height` → CLS |
| 29 | `UploadSheet.tsx:102` | `<img>` with no `width`/`height` |
| 30 | `HabitDailyRow.tsx:40`, `HabitWeeklyRow.tsx:30` | `flex-1 truncate` without `min-w-0` — truncation silently does not apply |
| 31 | `SetRow.tsx:14`, `ExercisePicker.tsx:41` | tappable rows with no hover state |
| 32 | `RewardsPageClient.tsx:65,88` | native `confirm()` for destructive deletes while the app ships `Dialog` and `RedeemConfirmDialog` |
| 33 | `RewardsPageClient.tsx:65` | straight `"` in Czech copy |
| 34 | `ExercisePicker.tsx:33` `"Hledej..."`, `SessionSummary.tsx:75` `"Poznamka (volitelne)"` | `...` instead of `…`; missing diacritics |
| 35 | `settings/page.tsx:26`, `settings/profile/page.tsx:18`, `PlateInventoryForm.tsx:28`, `HabitsPageClient.tsx:184` | English headings in a Czech UI; `training/page.tsx:50` "trenink" → "trénink" |
| 36 | `rewards/page.tsx:42`, `habits/page.tsx:42`, `ExportClient.tsx:120`, `PlateInventoryForm.tsx:28`, `CalendarHeader.tsx:38`, `AvatarHeroCard.tsx:16` | raw `<h1>` instead of the `Heading` primitive — bypasses the HUD display grammar; `AvatarHeroCard` uses `<h1>` for a mono eyebrow inside a card |
| 37 | `PhotosPageClient.tsx:27`, `BeforeAfter.tsx:18` | view mode and pose filter held in `useState`, not deep-linked |
| 38 | `ExercisePicker.tsx:20` | refetches the catalogue on every keystroke, no debounce |
| 39 | `ExercisePicker.tsx:38` | whole exercise catalogue rendered unvirtualized in a `max-h-[50vh]` scroller |

## Decisions

### W1
- `maximumScale` is removed outright. `viewportFit: 'cover'` stays.
- One ground value, three places: `#05080F` in `layout.tsx` `themeColor`, `manifest.json` `theme_color` **and** `background_color`. A test asserts `layout.tsx`'s `themeColor` equals the `--color-background` literal in `globals.css`, so the next palette change cannot silently desync them again.
- `color-scheme: dark` goes on `html, body` in `globals.css` next to the existing `background`/`color` block, not as an inline style.
- Skip link: first child of `<body>` in `layout.tsx`, visually hidden until `:focus-visible`, targeting `#main`; `AppShell.tsx:22` and the two other `<main>` elements (`app/page.tsx:16`, `(auth)/layout.tsx:5`) get `id="main"`.
- `touch-action: manipulation` and `-webkit-tap-highlight-color: transparent` go on a shared selector for interactive elements (`button, a, [role='button'], input, select, textarea, label`), not on `*` — a blanket `touch-action` would break any future pan/zoom surface (the anatomy SVG is the candidate).
- `overscroll-behavior: contain` is set on the Sheet content in W3, not globally.
- `confetti-fall` joins the reduced-motion block.

### W2
- `Input` already spreads `rest` onto the native input, so `autoComplete`/`name`/`spellCheck` need no primitive change — only the two call sites.
- Login error becomes `role="alert"` (implies `aria-live="assertive"`, right for a submit failure) and the submit handler focuses the email input when credentials are rejected.
- `Toast` container gets `aria-live="polite"` plus `role="status"`. Error-tone toasts stay polite: they follow a user action the user is already watching.
- `text-white` → `text-background` (the danger tone sits on a light-on-dark inversion like every other filled tone).

### W3
- One primitive, `Sheet`, replacing both `BottomSheet` and the `Dialog` wrapper. API is `Dialog`'s current one (`open`, `onOpenChange`, `title`, `description`, `dismissible`, `children`) because it is the superset. Under `md` it docks to the bottom edge with the clip on the top-left corner and `pb-[max(1.25rem,env(safe-area-inset-bottom))]`; at `md` and up it is the existing centred two-layer plate. Both states carry the mono eyebrow title, `overscroll-behavior: contain`, and a real focus ring.
- `BottomSheet` and the `Dialog` wrapper are **deleted**, not aliased — same reasoning as R7's `tone="primary"` rename. The Radix re-exports at the bottom of `Dialog.tsx` stay; `Menu`, `Tooltip` and `Tabs` depend on them.
- Nine call sites migrate: `MoreSheet`, `UploadSheet`, `DailyModal`, `ExercisePicker`, `PlateCalculatorSheet`, `EditSetSheet`, `HabitDialog`, `RewardDialog`, `RedeemConfirmDialog`.
- The R7 guard regex widens to cover directional forms of the same banned ladder: `rounded-((t|b|l|r|tl|tr|bl|br|s|e|ss|se|es|ee)-)?(lg|xl|2xl|3xl)`. The banned set is unchanged — `rounded-md` and `rounded-full` stay legal, because the control scale is out of scope (below). A probe file proves the new regex fires on `rounded-t-2xl` and still fires on the plain forms.
- `autoFocus` on `RewardDialog:63` and `HabitDialog:76` becomes desktop-only (`md`+), since on a phone it opens the keyboard over the sheet.

### W4
- `TimeRangePicker` and `AnatomicalBodyDual` adopt the existing Radix `Tabs` compound rather than hand-rolling arrow-key handling. Both already have exactly the tablist shape Radix expects.
- `CalendarGridClient` moves the handler onto the per-day `<button>` that `CalendarCell` already renders.
- Destructive deletes use `Dialog` (W3's `Sheet`) with a danger-variant confirm action, matching `RedeemConfirmDialog`. No undo window — the data is cheap to recreate and an undo store is not worth it here.
- Deep links: `?view=` on photos, `?pose=` on before/after, via `useSearchParams` + `router.replace` (no history entry per toggle).
- `ExercisePicker`: 250 ms debounce plus `content-visibility: auto` on the `<li>` rows. No `virtua` dependency — the catalogue is in the low hundreds, and `content-visibility` costs nothing.
- Czech copy fixes are literal string edits. `Heading` adoption replaces the six raw `<h1>`s; `AvatarHeroCard:16` becomes `Heading variant="region"` on a `<p>`, since it is a label, not a heading.

## Out of scope

- **Control scale** (`rounded-md` 18×, `rounded-full` 10×) and **tier colours** (`lib/tiers.ts`). The prototype that asked these questions was rejected; they stay parked exactly as R7 left them, and nothing in W1–W4 touches either.
- `Dialog`→`Sheet` is a merge, not a mobile redesign: no swipe-to-dismiss, no snap points.
- `DESIGN.md` for Hexis — excluded by the `design-md` skill's own rule.

## Testing

Every slice ships with tests in the existing `src/tests/ui` style, and each new assertion is mutation-checked (revert the fix, the test must fail) per the R7 precedent.

- W1: `layout.tsx` viewport/themeColor object asserted directly; theme-color ↔ `--color-background` equality test reads both files; skip link present and targets an existing id.
- W2: login inputs carry the right `autoComplete`/`name`; submit failure moves focus; toast container exposes `aria-live`.
- W3: `Sheet` renders a mono eyebrow title, traps focus, and both geometry states are asserted via class contract; every migrated call site keeps its existing test.
- W4: one test per a11y fix (roles, labels, `aria-expanded`), URL round-trip tests for the two deep links, debounce test with fake timers.

Gate per slice: `npm run typecheck`, `npm run lint`, `npx vitest run` — all green, plus a browser pass on the touched screens for W1 and W3 (the chrome and sheet changes are invisible to jsdom).

## Slices

| Slice | Branch | Scope | Findings |
|---|---|---|---|
| W1 | `wig-w1-platform-chrome` | viewport, theme colour, `color-scheme`, skip link, touch CSS, reduced motion | 1–9 |
| W2 | `wig-w2-login-feedback` | login autofill + error focus, toast live region | 10–15 |
| W3 | `wig-w3-sheet` | `Sheet` primitive, 9 call sites, guard regex | 16–21 |
| W4 | `wig-w4-a11y-copy-state` | ARIA, copy, headings, deep links, picker performance | 22–39 |

One PR per slice off `main`, per the standing branching rule.
