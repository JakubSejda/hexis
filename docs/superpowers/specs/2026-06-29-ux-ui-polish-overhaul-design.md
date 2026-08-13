# UX/UI Polish Overhaul — design

**Date:** 2026-06-29
**Status:** draft (awaiting user approval)
**Origin:** Owner verdict — current UI is "hrozná" across readability, visual look, UX flows and mobile. A 7-agent design audit produced 135 findings across 6 dimensions; the synthesis identified 6 systemic root causes. This initiative fixes them.

> Audit raw output archived at `docs/superpowers/audits/2026-06-29-uxui-audit.json` (135 findings). The agents' verdict: *"The owner is right — the app reads as default-Tailwind-on-dark, not premium. The cause is foundational, not cosmetic."*

## The 6 root causes (what makes it look cheap)

1. **No real typeface** — `layout.tsx` only loads `GeistMono`; `--font-sans` falls through to the OS system font (`Inter` is a named-but-never-loaded fallback). The whole app renders in the platform default.
2. **Low-contrast secondary layer** — `--color-muted #6b7280` is ~2.8–3.5:1 (fails WCAG AA) yet drives labels, section headers, hints, nav, disabled states; plus ad-hoc `text-[10px]/[11px]`.
3. **Design system bypassed** — primitives exist (Card, Button, Container, Stack, Pill, Input, Select…) but pages hand-roll Tailwind: 33+ bespoke buttons, raw `<checkbox>/<radio>/<select>/<textarea>`, custom badge divs.
4. **No geometric rhythm** — radii mixed (Card `rounded-2xl`, Button `rounded-md`, others `rounded-lg/xl`), spacing ad-hoc, content width inconsistent (`max-w-2xl` vs full-bleed dashboard).
5. **Flat elevation** — every Card is a single near-invisible 1px border, zero shadows; hover barely changes; `bg-accent/10` state tints are imperceptible.
6. **Mobile strands half the app** — `MOBILE_TABS` (area-meta.ts:98) is hardcoded to 4 areas; Habits, Rewards, Nutrition, Bio, Calendar, Settings have **no** bottom-nav entry. Plus sub-44px touch targets and no safe-area insets.

## Locked decisions (from owner)

- **Typeface:** **Geist Sans** (cohesive with the already-loaded GeistMono; clean, premium; ships in the installed `geist` package). Single family — no separate display font.
- **Scope:** full overhaul (all packages), but **sequenced** so the owner sees the lift early.

## Initiative structure — 5 slices, one PR each

Per the project's branching convention (one PR per slice off `main`). The destination is the full overhaul; the route is incremental so each PR is reviewable and the lift is visible immediately.

| Slice | Title | What | Effort |
|---|---|---|---|
| **P1** | **Foundation** | Tokens + font + contrast + elevation + geometry + responsive layout primitives. **Pure token/primitive edits — lifts every screen at once. Implemented first; owner reviews before P2.** | S–M |
| P2 | Primitive adoption | Kill 33+ bespoke buttons, raw form controls, custom badges; add missing primitives (Checkbox, Radio, Textarea, NavLink); wrap pages in Container/Stack; add a lint/grep guard so it can't regress (serves the parked §11.2 follow-up). | L |
| P3 | Mobile navigation | 5-tab BottomNav + "More" sheet fed from area-meta; min-44px touch targets; responsive calendar/table grids; safe-area insets. | M |
| P4 | Per-screen polish | RegionHeader/Heading sizing, interactive-Card adoption, workout flow feedback (XP popup, prominent rest timer, visible skip/finish), gamification context, contrast/state tints, tabular-nums on stat displays. | M |
| P5 | Onboarding & states | First-run onboarding, motivating empty-state CTAs, global error/loading states (skeletons + error boundaries + retry). | L |

**Each of P2–P5 gets its own spec + plan when we reach it.** This document details **P1** in full; P2–P5 are scoped here only at the level above.

---

## P1 — Foundation (detailed design)

**Goal:** with a handful of edits to `globals.css`, `layout.tsx`, and a few shared primitives, visibly lift *every* screen and establish the correct baseline that P2–P5 are judged against. No per-page rewrites in P1.

### 1. Typeface — load Geist Sans

`src/app/layout.tsx`: import `GeistSans` from `geist/font/sans` and add its CSS variable alongside the existing mono var:

```tsx
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
...
<html lang="cs" className={`${GeistSans.variable} ${GeistMono.variable} dark`}>
```

`src/app/globals.css` — point `--font-sans` at the loaded variable (keep a system fallback):

```css
--font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
```

`--font-mono` already references `var(--font-geist-mono)` — unchanged.

### 2. Color & contrast tokens (`globals.css @theme`)

| Token | From | To | Why |
|---|---|---|---|
| `--color-muted` | `#6b7280` | `#9ca3af` | ~4.6:1 on surfaces — passes WCAG AA. Single biggest readability fix. |
| `--color-muted-strong` | _(new)_ | `#cbd5e1` | For important secondary values (used by P4); defined now. |
| `--color-border` | `#1f2733` | `#2d3b4f` | Card edges become visible (was ~1.3:1 on surface). |

**Calendar signal colors** — tokenize the raw Tailwind colors (`emerald-500/blue-500/purple-500`) into intentional tokens so the 4 day-signals are distinct *and* on-system:

```css
--color-cal-training: #10b981;  /* emerald — matches primary */
--color-cal-habit:    #f59e0b;  /* amber — matches accent */
--color-cal-weigh:    #38bdf8;  /* info */
--color-cal-photo:    #a78bfa;  /* violet — only net-new hue */
```

### 3. Elevation — shadow tokens

Add to `@theme` (Tailwind v4 maps `--shadow-*` → `shadow-*` utilities):

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.40);
--shadow-md: 0 4px 12px -2px rgb(0 0 0 / 0.50);
--shadow-lg: 0 12px 28px -6px rgb(0 0 0 / 0.60);
```

### 4. Tabular numerals

`globals.css` — add to the `body` rule:

```css
font-variant-numeric: tabular-nums;
```

Makes XP / weights / macros / table figures align. App is data-dense with minimal long-form prose, so a global default is appropriate.

### 5. Geometry — radius ladder

Standardize on the existing `--radius-*` tokens:

- **inputs / buttons** → `rounded-md` (0.75rem) — Button already conforms.
- **cards / sheets** → `rounded-lg` (1rem) — change `Card` BASE from `rounded-2xl` to `rounded-lg`.
- **hero / large panels** → `rounded-xl` (1.5rem).

### 6. Card primitive — depth + interactivity (`Card.tsx`)

- BASE: `border border-border rounded-2xl` → `border border-border rounded-lg shadow-md transition-shadow`.
- `interactive` variant: add `hover:shadow-lg hover:border-accent/60` (replace the current border-only hover) so clickable cards read as clickable.

This single edit gives depth to every card-based component app-wide without touching any page.

### 7. Responsive container gutters (`Container.tsx`)

- `px-4` → `px-4 md:px-6` (fixes cramped mobile gutters and tight desktop edges in one primitive).
- **Content-width contract** (documented, enforced in P2): `sm`=max-w-md (forms/auth), `md`=max-w-2xl (default content), `lg`=max-w-4xl (wide data). Pages should stop using `size='full'` for content; P1 flips the dashboard off full-bleed as the one visible per-page exception.

### 8. Shared shell legibility (global, appears on every screen)

- `BottomNav.tsx`: labels `text-[10px]` → `text-xs`, icons `h-5 w-5` → `h-6 w-6`.
- `dashboard/RegionHeader.tsx`: `text-[10px]` → align with `Heading` `region` variant (`text-xs uppercase tracking-[0.2em]`) on the lightened muted.
- Inactive nav uses the lightened `--color-muted`; active stays `text-accent`.

> Deeper per-component `text-[10px]/[11px]` cleanup is **P4** — P1 only fixes the shell pieces that render on every screen.

### Out of scope for P1 (explicitly)

Bespoke-button/raw-form-control migration (P2), bottom-nav 5-tab restructure & touch-target sweep (P3), per-screen hierarchy/state polish (P4), onboarding/empty/error states (P5). P1 is tokens + shared primitives only.

## Testing & verification

This slice is CSS/token/primitive — no business logic changes. Verification:

1. `npm run typecheck` + `npm run lint` clean.
2. `npm run test:run` green. **Risk:** any test asserting a literal class that P1 changes (e.g. `rounded-2xl` on Card, `#6b7280`, `bg-emerald-500` on calendar dots). Audit those assertions first (`grep` for `rounded-2xl`, `emerald-500|blue-500|purple-500`, `text-\[10px\]` in `src/tests`) and update to match the new contract.
3. **Font actually loads** — verify in the running app (DevTools → computed `font-family` on body resolves to Geist Sans, Network shows the font fetched). This is the one thing that can silently no-op.
4. Visual spot-check (logged-in demo user) of dashboard + calendar + a form page on desktop and a narrow viewport: muted text readable, cards have depth, numbers align, gutters breathe.

## Success criteria (P1)

- Body renders in Geist Sans on every platform (not OS default).
- Muted text passes WCAG AA (≥4.5:1) on `--color-surface` and `--color-background`.
- Every Card has visible elevation and a visible edge; interactive cards have a clear hover.
- One radius ladder; no stray `rounded-2xl`.
- Numeric figures align (tabular-nums).
- Mobile gutters and bottom-nav labels are comfortable.
- Full test suite green; font load verified in-browser.
