# SP4 — Muscle Visual Language Design Spec

**Status:** Approved
**Date:** 2026-04-27
**Branches:** `sp4-muscle-schema-22` (PR-1), `sp4-muscle-visual` (PR-2)
**Depends on:** SP3 (RegionHeader, MuscleWidget on dashboard), M7 (existing heatmap infrastructure)

## 1. Cíl

Upgrade muscle visual language Hexis aplikace ze současného polygon SVG (M7-era) na anatomicky realistický styl a přidat Muscle Rank radar jako primární obsah `/stats` stránky.

Splní 3 z 5 reveal-list bodů z moodboardu:
- *Anatomical muscle illustrations* (App 4 Easlo dominantní mode)
- *Muscle Rank radar chart* (App 5 GymOS, A/B/C/D/S ranky)
- Plus dashboard MuscleWidget upgrade (zachování heatmapy s novou anatomickou silhouette)

## 2. Scope (rozhodnuto v brainstormu)

| Otázka | Volba | Implikace |
|---|---|---|
| Styl ilustrace | Anatomicky realistický (App 4 Easlo) | Hand-author SVG paths v PR-2 |
| Počet svalů na radaru | 22 | DB seed migrace 15 → 22 slugů (PR-1) |
| Rank math | Trailing 8-week volume window | Window query, prahy A/B/C/D/S per slug |
| Per-cvik movement ilustrace | Skip — park do SP5+ | Cvik karty zatím bez figurek |
| Kde radar žije | `/stats` page (full-size) | Dashboard zůstává heatmap |

**Out of scope (parkováno):**
- Per-cvik movement figurky (Easlo-style)
- Tap-to-detail per svalová skupina
- Per-muscle history graf
- Tooltip/popover na hover svalu
- Animace barevných přechodů

## 3. Architektura: dva PRs

PR-1 a PR-2 vznikají ze samostatných branch off `main` (per `feedback_branching_strategy.md`).

### PR-1 · `sp4-muscle-schema-22` — DB foundation

- Rozšíří `MUSCLE_GROUPS` seed z 15 → 22 slugů (split chest, delts, abs; přidat trapezius split)
- Aktualizuje `exerciseMuscleGroups` mapping pro všech 33 seeded cviků na nové slugy
- Aktualizuje `SLUG_TO_ZONE` v `src/lib/heatmap-colors.ts`
- Přidá `seed-integrity.test.ts` — každý exercise primary i secondary slug existuje v `MUSCLE_GROUPS`
- **Žádná UI změna** — heatmap query stále vrací volume per slug, jen víc slugů

### PR-2 · `sp4-muscle-visual` — Vizuální surface

Závislé na PR-1 mergnutí.

- Nový `AnatomicalBody` komponent (replace `BodySvg`) — ručně psaný realistický SVG
- Nový `MuscleRank` radar komponent + `MuscleRankSection` server wrapper
- Nový `src/lib/muscle-rank.ts` — `volumeToRank`, `RANK_THRESHOLDS`, `RANK_COLORS`
- Nová query `fetchMuscleVolumesLast8Weeks` v `src/lib/queries/muscle-rank.ts` (refactor existující `fetchMuscleVolumes` s parametrem `daysWindow`)
- `/stats/page.tsx` přidá tři regiony s `RegionHeader`: `AVATAR PROGRESS`, `MUSCLE RANK`, `XP HISTORY`
- Dashboard `MuscleWidget` swap `BodySvg` → `AnatomicalBody`
- Smaže `src/components/heatmap/BodySvg.tsx`

## 4. DB migrace (PR-1)

### 4.1 Slug expansion 15 → 22

| Současný slug | Akce | Nové slugy |
|---|---|---|
| `chest` | split | `chest-upper`, `chest-mid`, `chest-lower` |
| `shoulders` | split | `delts-front`, `delts-side`, `delts-rear` |
| `back-rear-delt` | merge → | `delts-rear` (sjednoceno s ramenovým rear delt) |
| `back-lats` | rename | `lats` |
| `back-mid` | split | `traps-mid`, `rhomboids` |
| (chybí) | add | `traps-upper` |
| `biceps` | keep | `biceps` |
| `triceps` | keep | `triceps` |
| `forearms` | keep | `forearms` |
| `abs` | split | `abs-upper`, `abs-lower` |
| `obliques` | keep | `obliques` |
| `quads` | keep | `quads` |
| `hamstrings` | keep | `hamstrings` |
| `glutes` | keep | `glutes` |
| `calves` | split | `calves-gastroc`, `calves-soleus` |
| `adductors` | keep | `adductors` |

Výsledek: **22 slugů** — `chest-upper`, `chest-mid`, `chest-lower`, `delts-front`, `delts-side`, `delts-rear`, `lats`, `traps-upper`, `traps-mid`, `rhomboids`, `biceps`, `triceps`, `forearms`, `abs-upper`, `abs-lower`, `obliques`, `quads`, `hamstrings`, `glutes`, `calves-gastroc`, `calves-soleus`, `adductors`.

### 4.2 Exercise remap (33 cviků)

Per cvik se rozhodne nový primary/secondary mapping ručně v PR-1 patche `src/db/seed/exercises.ts`. Příklady:

- `Incline DB Press`: primary `chest-upper`, secondary `delts-front`, `triceps`
- `Bench Press`: primary `chest-mid`, secondary `delts-front`, `triceps`
- `Cable Chest Fly (low)`: primary `chest-lower`
- `Seated DB Shoulder Press`: primary `delts-front`, secondary `triceps`
- `Cable Lateral Raises`: primary `delts-side`
- `Rear Delt Cable Fly`: primary `delts-rear`
- `Lat Pulldown (wide grip)`: primary `lats`, secondary `biceps`
- `Seated Cable Row (neutral)`: primary `traps-mid`, secondary `biceps`, `delts-rear`
- `Cable Single Arm High Row`: primary `traps-mid`, secondary `delts-rear`, `rhomboids`

(Plný remap kompletních 33 cviků v PR-1 description.)

### 4.3 Reset DB strategy

Aplikace v dev mode (Phase 2 deploy odložen, žádná production data). PR-1 dělá kompletní re-seed: drop+recreate `muscle_groups` + `exercise_muscle_groups`, žádná data migration logika.

Existující dev `session_sets` data zůstanou (volume reálná čísla), jen mapování exercise→muscle se změní. Heatmap query po re-seedu zase rozsvítí svaly podle nové vazby.

### 4.4 Soubory

```
src/db/seed/muscle-groups.ts    — UPDATED: 22 slugů
src/db/seed/exercises.ts        — UPDATED: remap primary/secondary per cvik
src/lib/heatmap-colors.ts       — UPDATED: SLUG_TO_ZONE pro 22 slugů
src/lib/__tests__/heatmap-colors.test.ts — UPDATED: všech 22 slugů má zónu
src/db/__tests__/seed-integrity.test.ts  — NEW
```

## 5. `AnatomicalBody` komponent (PR-2)

Nahrazuje `BodySvg`. Realistický anatomický SVG, front + back view, každý sval samostatný `<path>` (nebo `<g>` skupina paths) s `data-muscle` atributem.

### 5.1 Props

```ts
type Props = {
  view: 'front' | 'back'
  highlights: Record<string, string>  // muscle slug → CSS color
  className?: string
  ariaLabel?: string
}
```

### 5.2 Klíčové rozdíly oproti `BodySvg`

1. **`data-muscle` = slug**, ne abstraktní zone. Žádný `SLUG_TO_ZONE` lookup uvnitř komponenty.
2. **22 zón** rozdělených mezi front a back (některé slugy viditelné v obou views — `delts-side`, `calves`, `forearms`).
3. **Outline jako separátní path** se `stroke` (žádný fill) — kontura vždy viditelná.
4. **Každý sval má detailní svalové rýhy** jako sub-paths uvnitř `<g data-muscle="…">`.

### 5.3 Slug→zone mapování ven z komponenty

`src/lib/anatomy-zones.ts`:

```ts
export type ZoneInfo = { view: 'front' | 'back' | 'both' }

export const SLUG_ZONES: Record<string, ZoneInfo> = {
  'chest-upper':  { view: 'front' },
  'chest-mid':    { view: 'front' },
  'chest-lower':  { view: 'front' },
  'delts-front':  { view: 'front' },
  'delts-side':   { view: 'both' },
  'delts-rear':   { view: 'back' },
  'lats':         { view: 'back' },
  'traps-upper':  { view: 'back' },
  'traps-mid':    { view: 'back' },
  'rhomboids':    { view: 'back' },
  'biceps':       { view: 'front' },
  'triceps':      { view: 'back' },
  'forearms':     { view: 'both' },
  'abs-upper':    { view: 'front' },
  'abs-lower':    { view: 'front' },
  'obliques':     { view: 'front' },
  'quads':        { view: 'front' },
  'hamstrings':   { view: 'back' },
  'glutes':         { view: 'back' },
  'calves-gastroc': { view: 'both' },
  'calves-soleus':  { view: 'both' },
  'adductors':      { view: 'front' },
}

export function applyHighlights(
  slugColors: Record<string, string>
): { front: Record<string, string>; back: Record<string, string> } {
  // Rozdělí jednu mapu slug→barva na front+back podle SLUG_ZONES.view.
  // Pro view='both' barva se aplikuje v obou výstupech.
}
```

### 5.4 Layout (composition)

`AnatomicalBody` sám neřeší side-by-side layout — vykreslí jen jeden view. Composition skládá caller:

- Dashboard `MuscleWidget` / `MuscleHeatmap`: front + back vedle sebe (default), tab switcher na ≤sm breakpoint
- `/stats` `MuscleRankSection`: jen front + back vedle sebe pod radarem (později — out of SP4 scope)

Tab switcher kompozit komponent: nový `AnatomicalBodyDual` v `src/components/anatomy/AnatomicalBodyDual.tsx` — wrappuje dvě `AnatomicalBody` instance s responsive logikou.

### 5.5 Soubory

```
src/components/anatomy/
  AnatomicalBody.tsx         — pure render, single view
  AnatomicalBody.test.tsx
  AnatomicalBodyDual.tsx     — front+back layout (responsive: side-by-side ≥sm, tabs <sm)
  AnatomicalBodyDual.test.tsx
src/lib/
  anatomy-zones.ts           — SLUG_ZONES + applyHighlights
  anatomy-zones.test.ts
src/components/heatmap/
  BodySvg.tsx                — DELETED
  MuscleHeatmap.tsx          — UPDATED: import AnatomicalBodyDual
  WorkoutHeatmap.tsx         — UPDATED: import AnatomicalBodyDual
```

### 5.6 Asset workflow

SVG paths se píšou ručně commit-by-commit v PR-2. Pořadí:
1. Front-view base outline + chest×3 + delts-front + abs×2 + obliques + biceps + forearms (front) + quads + adductors + calves-front
2. Back-view base outline + delts-rear + delts-side (back-half) + lats + traps×2 + rhomboids + triceps + forearms (back) + glutes + hamstrings + calves-back

**Fallback risk mitigace:** pokud asset trvá příliš dlouho, dočasně použít stávající `BodySvg` polygon paths uvnitř `AnatomicalBody` shellu (s 22 slugovými zónami namapovanými na hrubší tvary). PR-2 shippuje s funkčním vizuálem, dolaďování svalových rýh jde do follow-up commitů.

## 6. `MuscleRank` radar + rank computation (PR-2)

### 6.1 Rank math

`src/lib/muscle-rank.ts`:

```ts
export type Rank = 'D' | 'C' | 'B' | 'A' | 'S'

// [D→C, C→B, B→A, A→S] thresholds in kg-reps for trailing 8 weeks.
// Initial values — calibrate from dev/seeded session data after PR-2 merge.
export const RANK_THRESHOLDS: Record<string, [number, number, number, number]> = {
  'chest-mid':   [4000, 12000, 30000, 60000],
  'chest-upper': [2500,  8000, 20000, 40000],
  'chest-lower': [2000,  6000, 15000, 30000],
  'delts-front': [2000,  6000, 15000, 30000],
  'delts-side':  [1500,  5000, 12000, 25000],
  'delts-rear':  [1000,  3000,  8000, 16000],
  'lats':        [3500, 10000, 25000, 50000],
  'traps-upper': [1500,  5000, 12000, 25000],
  'traps-mid':   [3000,  9000, 22000, 45000],
  'rhomboids':   [1500,  5000, 12000, 25000],
  'biceps':      [2000,  6000, 15000, 30000],
  'triceps':     [2500,  7500, 18000, 36000],
  'forearms':    [ 800,  2500,  6000, 12000],
  'abs-upper':   [1000,  3000,  8000, 16000],
  'abs-lower':   [ 800,  2500,  6000, 12000],
  'obliques':    [ 800,  2500,  6000, 12000],
  'quads':       [6000, 18000, 45000, 90000],
  'hamstrings':  [3500, 10000, 25000, 50000],
  'glutes':        [4000, 12000, 30000, 60000],
  'calves-gastroc':[1500,  5000, 12000, 25000],
  'calves-soleus': [1000,  3000,  8000, 16000],
  'adductors':     [1000,  3000,  8000, 16000],
}

export function volumeToRank(volume: number, slug: string): Rank {
  const t = RANK_THRESHOLDS[slug]
  if (!t) return 'D'
  if (volume >= t[3]) return 'S'
  if (volume >= t[2]) return 'A'
  if (volume >= t[1]) return 'B'
  if (volume >= t[0]) return 'C'
  return 'D'
}

export const RANK_COLORS: Record<Rank, string> = {
  S: '#fbbf24',  // gold
  A: '#a78bfa',  // purple
  B: '#60a5fa',  // blue
  C: '#34d399',  // emerald
  D: '#94a3b8',  // slate
}
```

Per-slug prahy (ne uniform) zachycují fakt, že velké svalové skupiny generují víc volume než malé — uniform prahy by daly všem D=lýtkům A-rank a chest-mid by zůstal D u běžného uživatele.

### 6.2 Query

`src/lib/queries/muscle-rank.ts`:

```ts
export async function fetchMuscleVolumesLast8Weeks(
  userId: number
): Promise<Record<string, number>>
```

Refactor existující `fetchMuscleVolumes` v `src/lib/queries/heatmap.ts` — přidat parametr `daysWindow: number`, default 7. `fetchMuscleVolumesLast8Weeks` volá s `daysWindow=56`.

### 6.3 `MuscleRank` komponent

`src/components/anatomy/MuscleRank.tsx`:

```ts
type Props = {
  ranks: Record<string, Rank>
  className?: string
}
```

Pure render. 22-osý radar:

- **Osy** seřazené po regionech (clockwise od horní): `chest-upper`, `chest-mid`, `chest-lower`, `delts-front`, `delts-side`, `delts-rear`, `lats`, `traps-upper`, `traps-mid`, `rhomboids`, `biceps`, `triceps`, `forearms`, `abs-upper`, `abs-lower`, `obliques`, `adductors`, `quads`, `hamstrings`, `glutes`, `calves-gastroc`, `calves-soleus` (= 22)
- **4 grid rings** (D/C/B/A bandů, kroužek S na vnějším okraji = 100% radius)
- **Polygon výplň** podle rank-to-radius mapping: D=0.2, C=0.4, B=0.6, A=0.8, S=1.0; barva polygonu = gradient nebo flat barva podle průměrného ranku
- **Tečka per osa** v barvě rank (z `RANK_COLORS`)
- **Label per osa** — zkrácený czech název (max 8 znaků)
- **`role="img"` + `aria-label="Muscle rank radar"`**

Server wrapper `MuscleRankSection.tsx`:
- Async server component
- Fetch `fetchMuscleVolumesLast8Weeks(userId)`
- Compute ranks per všech 22 slugů (chybějící slug → volume 0 → D)
- Spočítat session count za 8wk window — pokud `< 3` → render empty state
- Jinak render `<MuscleRank>` + legend („3× S · 5× A · 8× B · 4× C · 2× D") + top-3-weakest list

### 6.4 Empty state

```
„Začni trénovat, rank se ti vykreslí po prvních pár tréninzích"
[CTA: Spustit trénink → /training]
```

Threshold: < 3 sessions za posledních 8 týdnů. Důvod: s 1-2 sessions je rank dominovaný šumem.

### 6.5 Soubory

```
src/lib/muscle-rank.ts                — RANK_THRESHOLDS, RANK_COLORS, volumeToRank
src/lib/__tests__/muscle-rank.test.ts
src/lib/queries/muscle-rank.ts        — fetchMuscleVolumesLast8Weeks
src/lib/queries/__tests__/muscle-rank.test.ts
src/lib/queries/heatmap.ts            — UPDATED: fetchMuscleVolumes(userId, daysWindow=7)
src/components/anatomy/MuscleRank.tsx
src/components/anatomy/MuscleRank.test.tsx
src/components/anatomy/MuscleRankSection.tsx  — server wrapper
```

## 7. `/stats` integrace (PR-2)

### 7.1 Layout

```
[Avatar tier card]              ← bez headeru, hero block (zachováno)

‹ AVATAR PROGRESS ›
[TierLadder]
[NextTierPreview]

‹ MUSCLE RANK ›                 ← NEW
[MuscleRank radar]
[Rank breakdown legend]
[Top 3 weakest list]

‹ XP HISTORY ›
[XpHistoryChart]
[XpBreakdown]
```

### 7.2 Composition

```tsx
<div className="space-y-6 p-4">
  <AvatarHeroCard ... />

  <section>
    <RegionHeader>Avatar Progress</RegionHeader>
    <TierLadder ... />
    <NextTierPreview ... />
  </section>

  <section>
    <RegionHeader>Muscle Rank</RegionHeader>
    <MuscleRankSection userId={user.id} />
  </section>

  <section>
    <RegionHeader>XP History</RegionHeader>
    <XpHistoryChart ... />
    <XpBreakdown ... />
  </section>
</div>
```

`AvatarHeroCard` — extrakce inline JSX hero bloku ze současného `/stats/page.tsx` do samostatného komponentu (cleanup jako součást SP4 práce v této oblasti).

### 7.3 Top-3-weakest list

Pod radarem + legendou:

```tsx
<div>
  <h4>Doplň</h4>
  <ul>
    {weakest3.map(({ slug, rank, name }) => (
      <li key={slug}>
        <span style={{ color: RANK_COLORS[rank] }}>{name} ({rank})</span>
      </li>
    ))}
  </ul>
</div>
```

`weakest3` = 3 slugy s nejnižším rank (sort by rank D < C < B < A < S, tiebreak by volume ascending).

### 7.4 Soubory

```
src/app/(app)/stats/page.tsx       — UPDATED: 3 regions, RegionHeader, MuscleRankSection
src/components/avatar/AvatarHeroCard.tsx — NEW (extract z page.tsx)
src/components/avatar/AvatarHeroCard.test.tsx
```

## 8. Dashboard `MuscleWidget` update (PR-2)

Swap `BodySvg` → `AnatomicalBody` přes `AnatomicalBodyDual` wrapper:

- `src/components/heatmap/MuscleHeatmap.tsx` — import `AnatomicalBodyDual`, props rename `fills` → `highlights`, `applyHighlights` ze `src/lib/anatomy-zones.ts`
- `src/components/heatmap/WorkoutHeatmap.tsx` — totéž

Žádná změna logiky barevné škály — `volumeToColor` zachován.

## 9. Testing strategy

### 9.1 Unit testy

**PR-1:**
- `heatmap-colors.test.ts` (update) — všech 22 slugů má zónu, žádný orphan
- `seed-integrity.test.ts` (nový) — každý exercise primary i secondary slug existuje v `MUSCLE_GROUPS`

**PR-2:**
- `muscle-rank.test.ts` — `volumeToRank` thresholds: pro každý z 22 slugů test boundary cases (volume = 0 → D, exact threshold → next rank up, volume = max → S, missing slug → D)
- `anatomy-zones.test.ts` — všech 22 slugů má `SLUG_ZONES`, `applyHighlights` rozdělí mapu správně mezi front+back
- `MuscleRank.test.tsx` (RTL) — 22 axes vykresleny, polygon points odpovídají rankům, legend counts summují
- `AnatomicalBody.test.tsx` (RTL) — `data-muscle` attr per slug, fill aplikuje `highlights` map, default fill `#1f2733` pro neoznačené slugy, outline path vždy přítomen
- `AnatomicalBodyDual.test.tsx` (RTL) — side-by-side ≥sm, tabs <sm
- `MuscleHeatmap.test.tsx` (update) — používá `AnatomicalBodyDual`, žádný `BodySvg` import

### 9.2 Integration testy

**PR-2:**
- `fetchMuscleVolumesLast8Weeks` query test — seedne sessions napříč 12 týdny, ověří že vrací jen poslední 8wk objem agregovaný per slug

### 9.3 E2E testy

**PR-2:** `tests/e2e/muscle-rank.spec.ts`:
- Login jako demo user
- Navigace na `/stats`
- Verify 3 region headers viditelné: `AVATAR PROGRESS`, `MUSCLE RANK`, `XP HISTORY`
- Verify radar SVG viditelný (`svg[role="img"][aria-label="Muscle rank radar"]`)
- Verify legend (`/S · A · B · C · D/`)
- Verify top-3-weakest list (3 položky)
- Empty state path: nový uživatel s 0 sessions → empty state text místo radaru

**Update:** `tests/e2e/muscle-heatmap.spec.ts` — verify dashboard widget stále funguje s `AnatomicalBodyDual`.

### 9.4 Verification před merge

Pro každý PR:
- `npm run typecheck` clean
- `npm run lint` clean
- `npm test` všechny unit + integration green
- `npm run test:e2e` (kde aplikuje) green
- §11.2 nested-import grep guard clean
- Manual dev-server smoke v prohlížeči: `/dashboard` (heatmap renders), `/stats` (radar renders), `/training/[id]` (workout heatmap renders)

## 10. Rizika & mitigace

| Riziko | Mitigace |
|---|---|
| Anatomický SVG asset trvá déle než čekáme | Fallback: použít stávající `BodySvg` polygon paths uvnitř `AnatomicalBody` shellu. PR-2 shippuje radar + DB integraci, vizuál se dolaďuje v follow-up commitech. |
| Rank thresholds jsou off (všichni S nebo všichni D) | Po nasazení tunit z reálných dev session dat. `RANK_THRESHOLDS` má komentář „initial — calibrate later". |
| Exercise remap (PR-1) zbloudí slug | `seed-integrity.test.ts` chytí typo. Plus manual review tabulky 33 cviků v PR-1 description. |
| `delts-rear` merge ze `back-rear-delt` zruší existující dev session data mapping | Akceptovatelné — pre-prod, žádná production data. Re-seed po PR-1. |
| Refactor `fetchMuscleVolumes` (přidání `daysWindow` param) zlomí existující heatmap call sites | Default `daysWindow=7` zachovává backward-compatible signature. Test pokrývá oba paths. |

## 11. Out-of-scope confirmace

Tyto věci se v SP4 *neimplementují*, parkují se na pozdější iterace:

- Per-cvik movement figurky (Easlo-style) — kandidát na SP6 nebo separátní mini-PR po SP5
- `/stats/muscles` sub-route — YAGNI dokud nemáme dost obsahu pro split
- Tap-to-detail per svalová skupina (modal s per-muscle history)
- Per-muscle history time-series graf
- Tooltip/popover na hover svalu v `AnatomicalBody`
- Animace barevných přechodů
- Period picker pro rank (fixně 8wk)
- Calibrace `RANK_THRESHOLDS` z reálných dat (initial empirical hodnoty stačí pro merge)
