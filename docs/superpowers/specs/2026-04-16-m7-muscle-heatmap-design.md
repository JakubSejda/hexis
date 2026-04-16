# M7 — Muscle Heatmap Design Spec

**Status:** Approved
**Date:** 2026-04-16
**Branch:** `m7-muscle-heatmap`
**Depends on:** M0 (schema, seed), M2 (session_sets)

## 1. Cíl

SVG silueta lidského těla (front + back view) s barevným overlay podle tréninkového objemu. Dva kontexty: dashboard widget (7-denní objem) a active workout (planned/done/rest).

## 2. Scope

| Feature | Popis |
|---------|-------|
| SVG silueta | Front + back view, 12 vizuálních zón, `data-muscle` atributy |
| Dashboard widget | 7-denní heat map, intenzita = relativní objem per sval |
| Workout overlay | Planned = žlutá, done = zelená, rest = šedá |
| Heatmap API | Volume per muscle group za volitelné období |

## 3. SVG Silueta

Vlastní SVG s `<path>` elementy per svalová skupina. Dvě views: front a back. Každý path identifikovaný přes `data-muscle` atribut.

### 3.1 Vizuální zóny → muscle group mapping

| Zóna (SVG path) | Muscle group slugs | View |
|-----------------|-------------------|------|
| chest | chest | front |
| shoulders-front | shoulders | front |
| shoulders-back | shoulders | back |
| biceps | biceps | front |
| triceps | triceps | back |
| forearms-front | forearms | front |
| abs | abs, obliques | front |
| back-upper | back-lats, back-mid, back-rear-delt | back |
| quads | quads | front |
| hamstrings | hamstrings | back |
| glutes | glutes | back |
| calves-front | calves | front |
| calves-back | calves | back |
| adductors | adductors | front |

### 3.2 SVG struktura

```tsx
<svg viewBox="0 0 200 400">
  {/* Body outline (always visible, stroke only) */}
  <path d="..." className="fill-none stroke-[#1f2733]" />
  
  {/* Muscle zones (filled dynamically) */}
  <path data-muscle="chest" d="..." fill={fills.chest} />
  <path data-muscle="quads" d="..." fill={fills.quads} />
  ...
</svg>
```

Komponenta `BodySvg` přijímá `fills: Record<string, string>` — map zóna → CSS barva. Default fill = `#1f2733` (tmavá šedá, "neaktivní").

## 4. Barevná škála

### 4.1 Dashboard / standalone (heat)

Intenzita barvy = poměr objemu per sval k maximálnímu objemu ze všech svalů v daném období.

```
0%   → #1f2733 (šedá, surface border)
1-25%  → #065f46 (tmavě zelená)
26-50% → #10b981 (emerald)
51-75% → #f59e0b (amber)
76-100% → #ef4444 (red)
```

Funkce `volumeToColor(volume: number, maxVolume: number): string` v `src/lib/heatmap-colors.ts`.

### 4.2 Workout (categorical)

3 stavy per svalová skupina:

| Stav | Barva | Podmínka |
|------|-------|----------|
| rest | `#1f2733` | Sval není v žádném planned ani done cviku |
| planned | `#f59e0b` (amber) | Sval je v planned cviku, ale ještě žádný set nebyl zalogován |
| done | `#10b981` (emerald) | Alespoň 1 set zalogován pro cvik targeting tento sval |

## 5. API

### GET `/api/progress/heatmap?days=7`

Vrací volume per muscle group slug za posledních N dní.

Query: join `session_sets` → `sessions` (user filter) → `exercise_muscle_groups` → `muscle_groups`. Agregace `SUM(weight_kg * reps)` grouped by `muscle_groups.slug`. Zahrnuje primary i secondary muscle groups (isPrimary nefiltrován — secondary jen má nižší objem per set).

Response:
```json
{
  "muscles": {
    "chest": 4500,
    "back-lats": 3200,
    "quads": 8900,
    "biceps": 1200,
    ...
  },
  "maxVolume": 8900
}
```

## 6. Komponenty

### 6.1 `BodySvg`

Props:
```typescript
type Props = {
  view: 'front' | 'back'
  fills: Record<string, string>  // zone name → color
  className?: string
}
```

Renders SVG silhouette. Fills default to `#1f2733`. Přijímá `className` pro sizing.

### 6.2 `MuscleHeatmap`

Dashboard/standalone wrapper. Fetches heatmap data, computes colors, renders BodySvg front + back side by side.

Props:
```typescript
type Props = {
  data: Record<string, number>  // slug → volume
  maxVolume: number
}
```

Mapuje muscle group slugs → SVG zóny (SLUG_TO_ZONE mapping), pak zóny → barvy přes `volumeToColor`.

### 6.3 `WorkoutHeatmap`

Workout context. Nepoužívá API — dostává data jako props z parent.

Props:
```typescript
type Props = {
  planned: string[]   // exercise IDs planned for this session
  done: string[]      // exercise IDs with at least 1 logged set
  exerciseMuscleMap: Record<number, string[]>  // exerciseId → muscle slugs
}
```

Mapuje exercises → muscles → zóny → 3-state barvy.

### 6.4 `MuscleWidget`

Dashboard card wrapper. Server component, fetches data, renders `MuscleHeatmap`.

## 7. Slug → Zone mapping

```typescript
const SLUG_TO_ZONE: Record<string, { zone: string; view: 'front' | 'back' | 'both' }> = {
  'chest':           { zone: 'chest', view: 'front' },
  'shoulders':       { zone: 'shoulders', view: 'both' },
  'biceps':          { zone: 'biceps', view: 'front' },
  'triceps':         { zone: 'triceps', view: 'back' },
  'forearms':        { zone: 'forearms', view: 'front' },
  'abs':             { zone: 'abs', view: 'front' },
  'obliques':        { zone: 'abs', view: 'front' },
  'back-lats':       { zone: 'back-upper', view: 'back' },
  'back-mid':        { zone: 'back-upper', view: 'back' },
  'back-rear-delt':  { zone: 'back-upper', view: 'back' },
  'quads':           { zone: 'quads', view: 'front' },
  'hamstrings':      { zone: 'hamstrings', view: 'back' },
  'glutes':          { zone: 'glutes', view: 'back' },
  'calves':          { zone: 'calves', view: 'both' },
  'adductors':       { zone: 'adductors', view: 'front' },
}
```

## 8. Nové soubory

```
src/lib/heatmap-colors.ts                  — volumeToColor, SLUG_TO_ZONE mapping
src/lib/queries/heatmap.ts                 — fetchMuscleVolumes (per slug, raw)
src/app/api/progress/heatmap/route.ts      — GET endpoint
src/components/heatmap/BodySvg.tsx         — SVG silueta (front + back), fill map
src/components/heatmap/MuscleHeatmap.tsx   — heat wrapper (slug→zone→color)
src/components/heatmap/WorkoutHeatmap.tsx  — workout 3-state wrapper
src/components/dashboard/MuscleWidget.tsx  — dashboard card (server, fetches data)
```

## 9. Modifikace existujících souborů

- `src/app/(app)/dashboard/page.tsx` — přidat `MuscleWidget`
- `src/app/(app)/workout/[sessionId]/page.tsx` — přidat `WorkoutHeatmap` (collapsible, default closed)

## 10. Testování

### Unit testy
- `heatmap-colors.ts` — volumeToColor thresholds, edge cases (0, max, negative)
- `SLUG_TO_ZONE` — all 15 slugs mapped

### Integration testy
- `GET /api/progress/heatmap` — correct aggregation per slug, respects days param

### E2E
- Dashboard shows heatmap widget
- Workout page has heatmap toggle

## 11. Neřešit v M7

- Standalone `/progress/muscles` page
- Tap-to-detail per svalová skupina
- Animace barevných přechodů
- Period picker na dashboardu (fixně 7 dní)
- Tooltip/popover na hover
