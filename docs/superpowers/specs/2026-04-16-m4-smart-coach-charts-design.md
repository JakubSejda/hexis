# M4 — Smart Coach & Charts Design Spec

**Status:** Approved
**Date:** 2026-04-16
**Branch:** `m4-smart-coach-charts`
**Depends on:** M2 (session_sets data), M3 (measurements/nutrition data), M6 (XP/tier system)

## 1. Cíl

Přidat analytickou vrstvu nad existující tréninková data: detekce stagnace, grafy síly a objemu, export dat. Uživatel vidí svůj progres v čase a dostává varování když přestane růst.

## 2. Scope

| Feature | Popis |
|---------|-------|
| Stagnation detection | 2+ týdny bez 1RM progresu per cvik → badge + dashboard warning |
| 1RM chart | Line chart estimated 1RM v čase per exercise |
| Volume chart | Stacked bar: týdenní objem per muscle group |
| CSV/ZIP export | On-demand download sessions, sets, measurements, nutrition |

## 3. Stagnation Detection

### 3.1 Algoritmus

```typescript
// src/lib/stagnation.ts

interface StagnationResult {
  exerciseId: number
  exerciseName: string
  lastPrDate: string          // YYYY-MM-DD
  weeksSincePr: number
  isStagnant: boolean         // weeksSincePr >= 2
  suggestion: 'deload' | 'variation'
}

function detectStagnation(
  exerciseId: number,
  sets: { weightKg: number; reps: number; completedAt: string }[]
): StagnationResult
```

Logika:
1. Pro každý set spočítej `estimate1RM(weightKg, reps)`
2. Najdi datum posledního PR (highest 1RM ever pro tento exercise)
3. `weeksSincePr = floor((now - lastPrDate) / 7)`
4. `isStagnant = weeksSincePr >= 2`
5. Suggestion: `weeksSincePr >= 4 ? 'variation' : 'deload'`

### 3.2 API

`GET /api/progress/stagnation`

Response:
```json
{
  "exercises": [
    {
      "exerciseId": 5,
      "exerciseName": "Bench Press",
      "lastPrDate": "2026-04-02",
      "weeksSincePr": 3,
      "isStagnant": true,
      "suggestion": "deload"
    }
  ]
}
```

Query: všechny cviky s alespoň 2 session za posledních 60 dní. Vrací jen stagnující (isStagnant = true).

### 3.3 UI

- **StagnationBadge** — malý `⚠` badge na ExerciseCard v aktivním workoutu pokud exercise je stagnant
- **StagnationWarning** — dashboard widget pod AvatarHero: "Bench Press: 3 týdny bez PR — zkus deload" (zobrazí se jen pokud ≥1 stagnant exercise)

## 4. 1RM Progress Chart

### 4.1 Data

`GET /api/progress/strength?exerciseId={id}&days={30|90|180|365}`

Query:
```sql
SELECT
  DATE(ss.completed_at) as date,
  MAX(/* estimate1RM(ss.weight_kg, ss.reps) */) as best1rm
FROM session_sets ss
JOIN sessions s ON s.id = ss.session_id
WHERE s.user_id = ? AND ss.exercise_id = ? AND ss.completed_at >= ?
GROUP BY DATE(ss.completed_at)
ORDER BY date ASC
```

Poznámka: `estimate1RM` se počítá v aplikační vrstvě (ne v SQL), takže query vrací raw sets a agregace probíhá v `src/lib/queries/strength-progress.ts`.

Response:
```json
{
  "exerciseId": 5,
  "exerciseName": "Bench Press",
  "dataPoints": [
    { "date": "2026-03-20", "best1rm": 72.5 },
    { "date": "2026-03-23", "best1rm": 73.1 }
  ]
}
```

### 4.2 UI — `/progress/strength`

- **ExercisePicker**: dropdown s cviky které mají ≥2 datapoints. Seřazené podle počtu sessions DESC. Default = nejčastější cvik.
- **TimeRangePicker**: segment control `30d | 90d | 6m | 1y`. Default = 90d.
- **OneRmChart**: Recharts `ResponsiveContainer` + `LineChart`
  - Osa X: datum (tick per týden)
  - Osa Y: kg (auto range s paddingem)
  - Tooltip: datum + hodnota + "PR!" flag pokud je to maximum
  - Barva: primary (#10B981)
  - Dot: zvýrazněný na PR bodech

## 5. Volume by Muscle Group Chart

### 5.1 Muscle Group Categories

15 raw groups → 5 zobrazitelných kategorií:

| Kategorie | Slug mapping | Barva |
|-----------|-------------|-------|
| Chest | chest | #EF4444 (red) |
| Back | back-lats, back-mid, back-rear-delt | #3B82F6 (blue) |
| Shoulders | shoulders | #F59E0B (amber) |
| Arms | biceps, triceps, forearms | #8B5CF6 (purple) |
| Legs | quads, hamstrings, glutes, calves, adductors | #10B981 (emerald) |

Abs/obliques → nezařazené (typicky nízký objem, clutter v chartu). Pokud uživatel trénuje abs pravidelně, přidáme jako 6. kategorii v budoucnu.

### 5.2 Data

`GET /api/progress/volume?days={30|90|180|365}`

Query logika:
1. Fetch all session_sets za období (join sessions for userId + date filter)
2. Join exercises → exercise_muscle_groups (isPrimary = true only)
3. Volume per set = `weightKg × reps` (bodyweight cviky: volume = reps × 1, tj. weightKg fallback 0 → jen reps)
4. Group by ISO week + muscle group category
5. Return weekly totals

Response:
```json
{
  "weeks": [
    {
      "weekStart": "2026-03-17",
      "chest": 4500,
      "back": 6200,
      "shoulders": 2100,
      "arms": 3400,
      "legs": 8900
    }
  ]
}
```

### 5.3 UI

- **VolumeChart**: Recharts `ResponsiveContainer` + `BarChart` (stacked)
  - Osa X: týden (formát "17.3." / "24.3.")
  - Osa Y: volume (kg)
  - 5 barevných segmentů per bar
  - Legend pod chartem
  - Tooltip: breakdown per skupinu
- **TimeRangePicker**: sdílený se strength chartem (segment control nad oběma)
- Umístění: `/progress/strength` jako druhý chart pod 1RM grafem, oddělený nadpisem

## 6. Progress Page Layout

Rozšíření existujícího segment control:

```
/progress/body       — [existující] sparklines + measurement grid
/progress/nutrition  — [existující] calendar + daily modal
/progress/strength   — [NOVÝ] 1RM chart + volume chart + stagnation warnings
```

SegmentControl: `Body | Nutrition | Strength`

### 6.1 `/progress/strength` layout

```
┌──────────────────────────────┐
│  SegmentControl              │
├──────────────────────────────┤
│  TimeRangePicker [30d|90d|…] │
├──────────────────────────────┤
│  ⚠ Stagnation warnings      │  ← jen pokud existují
│  (collapsible list)          │
├──────────────────────────────┤
│  ExercisePicker [▼ dropdown] │
│  ┌────────────────────────┐  │
│  │   1RM Line Chart       │  │
│  │   (per selected cvik)  │  │
│  └────────────────────────┘  │
├──────────────────────────────┤
│  Objem per svalovou skupinu  │
│  ┌────────────────────────┐  │
│  │   Volume Stacked Bar   │  │
│  │   (all muscle groups)  │  │
│  └────────────────────────┘  │
│  [Legend: ● Chest ● Back …]  │
└──────────────────────────────┘
```

## 7. CSV/ZIP Export

### 7.1 Přístup

Client-side ZIP generování přes **JSZip** — jednodušší než server-side streaming, žádný temp file management.

Flow:
1. User klikne "Export dat" na `/settings/export`
2. Client volá 4 API endpointy paralelně (existující + nový):
   - `GET /api/sessions?limit=9999` (existující, rozšířit o sets inline)
   - `GET /api/measurements?all=true` (nový param)
   - `GET /api/nutrition?all=true` (nový param)
   - `GET /api/export/sets` (nový — flat list všech sets)
3. Client transformuje JSON → CSV stringy
4. JSZip zabalí do `hexis-export-YYYY-MM-DD.zip`
5. Trigger browser download

### 7.2 CSV soubory

**sessions.csv**: `id,plan_name,started_at,finished_at,note,set_count,volume_kg`
**sets.csv**: `id,session_id,exercise_name,set_index,weight_kg,reps,rpe,completed_at`
**measurements.csv**: `week_start,weight_kg,waist_cm,chest_cm,thigh_cm,biceps_cm`
**nutrition.csv**: `date,kcal_actual,protein_g,note`

### 7.3 API rozšíření

- `GET /api/export/sets` — nový endpoint, vrací flat array všech session_sets s exercise name joined
- Existující `/api/measurements` a `/api/nutrition` rozšířit o `?all=true` parametr (bypass pagination/date range)

### 7.4 UI — `/settings/export`

Jednoduchá stránka:
- Nadpis "Export dat"
- Popis: "Stáhne ZIP archiv se všemi tvými daty ve formátu CSV."
- Tlačítko "Stáhnout export"
- Loading state s progress (načítání dat… / generování ZIP… / hotovo)

## 8. Nové závislosti

```json
{
  "recharts": "^2.15",
  "jszip": "^3.10",
  "file-saver": "^2.0"
}
```

`file-saver` pro `saveAs()` cross-browser download triggering.

## 9. Nové soubory

```
src/lib/stagnation.ts
src/lib/queries/strength-progress.ts
src/lib/queries/volume-progress.ts
src/lib/csv.ts                          — JSON→CSV helper

src/app/api/progress/strength/route.ts
src/app/api/progress/volume/route.ts
src/app/api/progress/stagnation/route.ts
src/app/api/export/sets/route.ts

src/app/(app)/progress/strength/page.tsx
src/app/(app)/settings/export/page.tsx

src/components/progress/ExercisePicker.tsx
src/components/progress/TimeRangePicker.tsx
src/components/progress/OneRmChart.tsx
src/components/progress/VolumeChart.tsx
src/components/progress/StagnationList.tsx
src/components/dashboard/StagnationWarning.tsx
src/components/workout/StagnationBadge.tsx
```

## 10. Modifikace existujících souborů

- `src/components/ui/SegmentControl.tsx` — přidat "Strength" segment do progress layout
- `src/app/(app)/progress/layout.tsx` — přidat strength do segmentů
- `src/app/(app)/dashboard/page.tsx` — přidat StagnationWarning widget
- `src/components/workout/ExerciseCard.tsx` — přidat StagnationBadge
- `src/app/api/measurements/route.ts` — přidat `?all=true` support
- `src/app/api/nutrition/route.ts` — přidat `?all=true` support

## 11. Testování

### Unit testy
- `stagnation.ts` — edge cases: no data, exactly 2 weeks, 4+ weeks, fresh PR resets
- `csv.ts` — escape, null handling, unicode
- `strength-progress.ts` — 1RM agregace, empty data, single session
- `volume-progress.ts` — muscle group mapping, bodyweight exercises (weight=0)

### Integration testy
- `GET /api/progress/strength` — correct 1RM per date, respects days param
- `GET /api/progress/volume` — correct grouping, primary muscles only
- `GET /api/progress/stagnation` — returns only stagnant exercises
- `GET /api/export/sets` — flat list, exercise name joined

### E2E
- Navigate to `/progress/strength`, switch exercise, verify chart renders
- Export flow: click download → ZIP contains 4 CSVs

## 12. Neřešit v M4

- Deload program generation (jen flag + suggestion text)
- RPE-based auto-regulation
- Volume landmarks (MV/MEV/MAV/MRV)
- Bodyweight progression tracking (jen weight-based 1RM)
- Server-side export (streaming ZIP)
