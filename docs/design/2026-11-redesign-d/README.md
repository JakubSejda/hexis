# Redesign D — "Systém × Atlet" (2026-11)

Binding visual reference for the app. Chosen by the owner on 2026-11-07 from three
contrasting prototypes (A Systém, B Atlet, C Výprava) as "the world and character of A,
the graphics and training UI of B". Open `D-kombinace.html` in a browser at 375 px.

## Grammar

| Role | Token | Use |
|---|---|---|
| World | `system` (blue) | info, rank lenses, glow, secondary buttons |
| Action | `accent` (blue, or neon via `[data-accent='neon']`) | the one CTA per screen, XP bar, active nav |
| Reward | `reward` (gold) | XP / odměna values only |
| Success | `success` (green) | done sets, completed quests |

Shape: `rounded-card` (plates, sheets) · `rounded-control` (rows, inputs, chips) ·
`rounded-tick` (checkboxes) · `rounded-full` (buttons, pills, dots). The hexagon survives only
as the rank / tier lens (`RankLens`, avatars). ESLint enforces this (`eslint.config.mjs`).

Type: `font-display` (Archivo, width 125 %, black, uppercase) for headings and big numbers;
Geist Sans for reading. No tracked monospace labels.

Character art in `public/images/*.svg` is original vector art drawn for Hexis (no third-party
licence). The prototype's raster images in `img/` were AI placeholders and are not shipped.
