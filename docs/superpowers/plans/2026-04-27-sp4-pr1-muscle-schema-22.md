# SP4 PR-1 — Muscle Schema 15 → 22 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand muscle group schema from 15 → 22 slugs and remap all 33 seeded exercises onto the new slugs, with no UI behavior change. This is the data foundation for SP4's anatomical visual surface (PR-2).

**Architecture:** Pure data + lib changes. Update `MUSCLE_GROUPS` seed (split chest, delts, abs, calves; add traps split). Update `EXERCISES` seed primary/secondary slugs. Extend `SLUG_TO_ZONE` mapping in `heatmap-colors.ts` so existing `BodySvg` zones still receive colors from the new slugs (multiple new slugs collapse into existing visual zones). Add invariant test asserting every exercise references an existing muscle slug.

**Tech Stack:** TypeScript · Drizzle ORM · MySQL · Vitest

**Spec:** `docs/superpowers/specs/2026-04-27-sp4-muscle-visual-language-design.md`

**Branch:** `sp4-muscle-schema-22`

**Acknowledged transitional behavior:** After PR-1, the dashboard `MuscleHeatmap` widget will visually attribute the color of each existing zone (e.g., `chest`) to whichever new slug (`chest-upper` / `chest-mid` / `chest-lower`) iterates first in the data record. This is acceptable transitional state — PR-2 replaces `BodySvg` with `AnatomicalBody` where each slug has its own SVG path and full per-slug rendering.

---

## Task 0: Create worktree

**Files:**
- No code changes

- [ ] **Step 1: Confirm `main` is clean and up-to-date**

Run:
```bash
git status
git fetch origin
git log --oneline main..origin/main  # should be empty
```

Expected: `working tree clean` and no upstream commits ahead.

- [ ] **Step 2: Create worktree off `main`**

Run:
```bash
git worktree add .worktrees/sp4-muscle-schema-22 -b sp4-muscle-schema-22 main
```

Expected: `Preparing worktree (new branch 'sp4-muscle-schema-22')`.

- [ ] **Step 3: Copy `.env.local` into worktree (DB connection)**

Run:
```bash
cp .env.local .worktrees/sp4-muscle-schema-22/.env.local
```

Expected: no stdout (file copied).

- [ ] **Step 4: Install deps in worktree**

Run:
```bash
cd .worktrees/sp4-muscle-schema-22 && npm install
```

Expected: `up to date` or successful install.

All subsequent tasks run inside `.worktrees/sp4-muscle-schema-22/`.

---

## Task 1: Add `seed-integrity` invariant test

Establish a test that asserts every `EXERCISES[].primary` and `EXERCISES[].secondary[]` slug exists in `MUSCLE_GROUPS`. This test passes against the current 15-slug state (baseline), then fails after Task 2 (slugs renamed/removed), then passes again after Task 3 (exercises remapped).

**Files:**
- Create: `src/tests/db/seed-integrity.test.ts`

- [ ] **Step 1: Write the test**

Create `src/tests/db/seed-integrity.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { MUSCLE_GROUPS } from '@/db/seed/muscle-groups'
import { EXERCISES } from '@/db/seed/exercises'

describe('seed integrity', () => {
  const slugs = new Set(MUSCLE_GROUPS.map((mg) => mg.slug))

  it('every exercise primary slug exists in MUSCLE_GROUPS', () => {
    const offenders = EXERCISES.filter((ex) => !slugs.has(ex.primary)).map(
      (ex) => `${ex.name} → primary "${ex.primary}"`
    )
    expect(offenders).toEqual([])
  })

  it('every exercise secondary slug exists in MUSCLE_GROUPS', () => {
    const offenders: string[] = []
    for (const ex of EXERCISES) {
      for (const sec of ex.secondary ?? []) {
        if (!slugs.has(sec)) offenders.push(`${ex.name} → secondary "${sec}"`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('all slugs are unique', () => {
    expect(new Set(MUSCLE_GROUPS.map((mg) => mg.slug)).size).toBe(MUSCLE_GROUPS.length)
  })
})
```

- [ ] **Step 2: Run the test, verify it passes (baseline)**

Run:
```bash
npx vitest run src/tests/db/seed-integrity.test.ts
```

Expected: 3 tests pass. This baseline confirms current 15-slug state is consistent.

- [ ] **Step 3: Commit**

Run:
```bash
git add src/tests/db/seed-integrity.test.ts
git commit -m "test(seed): add muscle-group / exercise slug integrity test"
```

---

## Task 2: Update `MUSCLE_GROUPS` to 22 slugs

Replace the seed with 22 slugs (split chest, delts, abs, calves; add traps split). After this task, the integrity test from Task 1 will FAIL — that is expected and intended (Task 3 fixes it).

**Files:**
- Modify: `src/db/seed/muscle-groups.ts`

- [ ] **Step 1: Replace seed with 22 slugs**

Overwrite `src/db/seed/muscle-groups.ts`:

```typescript
import type { DB } from '../client'
import { muscleGroups } from '../schema'

export const MUSCLE_GROUPS = [
  // Chest split
  { slug: 'chest-upper', name: 'Hrudník — horní' },
  { slug: 'chest-mid', name: 'Hrudník — střední' },
  { slug: 'chest-lower', name: 'Hrudník — spodní' },
  // Deltoid split
  { slug: 'delts-front', name: 'Přední deltoid' },
  { slug: 'delts-side', name: 'Boční deltoid' },
  { slug: 'delts-rear', name: 'Zadní deltoid' },
  // Back
  { slug: 'lats', name: 'Lats' },
  { slug: 'traps-upper', name: 'Trapézy — horní' },
  { slug: 'traps-mid', name: 'Trapézy — střední' },
  { slug: 'rhomboids', name: 'Rhomboidy' },
  // Arms
  { slug: 'biceps', name: 'Biceps' },
  { slug: 'triceps', name: 'Triceps' },
  { slug: 'forearms', name: 'Předloktí' },
  // Core
  { slug: 'abs-upper', name: 'Břicho — horní' },
  { slug: 'abs-lower', name: 'Břicho — spodní' },
  { slug: 'obliques', name: 'Šikmé břicho' },
  // Legs
  { slug: 'quads', name: 'Quadriceps' },
  { slug: 'hamstrings', name: 'Hamstringy' },
  { slug: 'glutes', name: 'Hýždě' },
  { slug: 'calves-gastroc', name: 'Lýtka — gastrocnemius' },
  { slug: 'calves-soleus', name: 'Lýtka — soleus' },
  { slug: 'adductors', name: 'Přitahovače' },
] as const

export async function seedMuscleGroups(db: DB): Promise<void> {
  await db.insert(muscleGroups).values([...MUSCLE_GROUPS])
}
```

- [ ] **Step 2: Run integrity test, verify it FAILS**

Run:
```bash
npx vitest run src/tests/db/seed-integrity.test.ts
```

Expected: tests fail. The "primary" test reports offenders like `Incline DB Press → primary "chest"`, `Lat Pulldown (wide grip) → primary "back-lats"`, etc. (Old slugs no longer in `MUSCLE_GROUPS`.) This is the red state. Task 3 fixes it.

- [ ] **Step 3: Do NOT commit yet**

The seed is in a transitional broken state. Task 3 lands together with this in one commit.

---

## Task 3: Remap all 33 exercises to new slugs

Update `EXERCISES` seed primary/secondary slugs. After this task the integrity test passes again.

**Files:**
- Modify: `src/db/seed/exercises.ts`

**Remap table** (source of truth):

| Exercise | Old primary | Old secondary | New primary | New secondary |
|---|---|---|---|---|
| Incline DB Press | chest | shoulders, triceps | `chest-upper` | `delts-front`, `triceps` |
| Lat Pulldown (wide grip) | back-lats | biceps | `lats` | `biceps` |
| Seated DB Shoulder Press | shoulders | triceps | `delts-front` | `triceps`, `traps-upper` |
| Seated Cable Row (neutral) | back-mid | biceps, back-rear-delt | `traps-mid` | `biceps`, `delts-rear`, `rhomboids` |
| Cable Lateral Raises | shoulders | – | `delts-side` | – |
| Barbell Curl | biceps | forearms | `biceps` | `forearms` |
| EZ Bar Curl | biceps | forearms | `biceps` | `forearms` |
| Incline DB Curl | biceps | – | `biceps` | – |
| Overhead Triceps Extension | triceps | – | `triceps` | – |
| Rear Delt Cable Fly | back-rear-delt | – | `delts-rear` | `rhomboids` |
| Bench Press | chest | shoulders, triceps | `chest-mid` | `delts-front`, `triceps` |
| Flat DB Press | chest | shoulders, triceps | `chest-mid` | `delts-front`, `triceps` |
| Chest Supported Cable Row | back-mid | biceps | `traps-mid` | `biceps`, `rhomboids` |
| Cable Chest Fly (low) | chest | – | `chest-lower` | – |
| Neutral Grip Pulldown | back-lats | biceps | `lats` | `biceps` |
| Cable Single Arm High Row | back-mid | back-rear-delt | `traps-mid` | `delts-rear`, `rhomboids` |
| Cable Curl | biceps | – | `biceps` | – |
| Hammer Curl (DB) | biceps | forearms | `biceps` | `forearms` |
| Single Arm Triceps Pushdown | triceps | – | `triceps` | – |
| Leg Press | quads | glutes, hamstrings | `quads` | `glutes`, `hamstrings` |
| Smith Machine Squat | quads | glutes, hamstrings | `quads` | `glutes`, `hamstrings`, `adductors` |
| Leg Extension | quads | – | `quads` | – |
| Romanian Deadlift (DB) | hamstrings | glutes, back-mid | `hamstrings` | `glutes`, `traps-mid` |
| Standing Calf Raises | calves | – | `calves-gastroc` | `calves-soleus` |
| Cable Crunch | abs | – | `abs-upper` | `abs-lower` |
| Plank | abs | obliques | `abs-lower` | `abs-upper`, `obliques` |
| Ab Wheel Rollout | abs | – | `abs-upper` | `abs-lower` |
| Romanian Deadlift (Barbell) | hamstrings | glutes, back-mid | `hamstrings` | `glutes`, `traps-mid` |
| Lying Leg Curl | hamstrings | – | `hamstrings` | – |
| Goblet Squat | quads | glutes | `quads` | `glutes`, `adductors` |
| Hip Thrust | glutes | hamstrings | `glutes` | `hamstrings` |
| Hanging Knee Raise | abs | obliques | `abs-lower` | `obliques` |
| Dead Bug | abs | – | `abs-lower` | `abs-upper`, `obliques` |

- [ ] **Step 1: Update `EXERCISES` array**

Replace the `EXERCISES` array literal in `src/db/seed/exercises.ts` (keeping `ExerciseSeed` type, `seedExercises` function, and imports unchanged):

```typescript
export const EXERCISES: ExerciseSeed[] = [
  // UA — Upper A (silový)
  { name: 'Incline DB Press', type: 'db', primary: 'chest-upper', secondary: ['delts-front', 'triceps'] },
  { name: 'Lat Pulldown (wide grip)', type: 'cable', primary: 'lats', secondary: ['biceps'] },
  { name: 'Seated DB Shoulder Press', type: 'db', primary: 'delts-front', secondary: ['triceps', 'traps-upper'] },
  {
    name: 'Seated Cable Row (neutral)',
    type: 'cable',
    primary: 'traps-mid',
    secondary: ['biceps', 'delts-rear', 'rhomboids'],
  },
  { name: 'Cable Lateral Raises', type: 'cable', primary: 'delts-side' },
  { name: 'Barbell Curl', type: 'barbell', primary: 'biceps', secondary: ['forearms'] },
  { name: 'EZ Bar Curl', type: 'barbell', primary: 'biceps', secondary: ['forearms'] },
  { name: 'Incline DB Curl', type: 'db', primary: 'biceps' },
  { name: 'Overhead Triceps Extension', type: 'db', primary: 'triceps' },
  { name: 'Rear Delt Cable Fly', type: 'cable', primary: 'delts-rear', secondary: ['rhomboids'] },

  // UB — Upper B (objemový)
  { name: 'Bench Press', type: 'barbell', primary: 'chest-mid', secondary: ['delts-front', 'triceps'] },
  { name: 'Flat DB Press', type: 'db', primary: 'chest-mid', secondary: ['delts-front', 'triceps'] },
  { name: 'Chest Supported Cable Row', type: 'cable', primary: 'traps-mid', secondary: ['biceps', 'rhomboids'] },
  { name: 'Cable Chest Fly (low)', type: 'cable', primary: 'chest-lower' },
  { name: 'Neutral Grip Pulldown', type: 'cable', primary: 'lats', secondary: ['biceps'] },
  {
    name: 'Cable Single Arm High Row',
    type: 'cable',
    primary: 'traps-mid',
    secondary: ['delts-rear', 'rhomboids'],
  },
  { name: 'Cable Curl', type: 'cable', primary: 'biceps' },
  { name: 'Hammer Curl (DB)', type: 'db', primary: 'biceps', secondary: ['forearms'] },
  { name: 'Single Arm Triceps Pushdown', type: 'cable', primary: 'triceps' },

  // LA — Lower A (quad důraz)
  { name: 'Leg Press', type: 'machine', primary: 'quads', secondary: ['glutes', 'hamstrings'] },
  {
    name: 'Smith Machine Squat',
    type: 'smith',
    primary: 'quads',
    secondary: ['glutes', 'hamstrings', 'adductors'],
  },
  { name: 'Leg Extension', type: 'machine', primary: 'quads' },
  {
    name: 'Romanian Deadlift (DB)',
    type: 'db',
    primary: 'hamstrings',
    secondary: ['glutes', 'traps-mid'],
  },
  { name: 'Standing Calf Raises', type: 'machine', primary: 'calves-gastroc', secondary: ['calves-soleus'] },
  { name: 'Cable Crunch', type: 'cable', primary: 'abs-upper', secondary: ['abs-lower'] },
  { name: 'Plank', type: 'bodyweight', primary: 'abs-lower', secondary: ['abs-upper', 'obliques'] },
  { name: 'Ab Wheel Rollout', type: 'bodyweight', primary: 'abs-upper', secondary: ['abs-lower'] },

  // LB — Lower B (hamstring důraz)
  {
    name: 'Romanian Deadlift (Barbell)',
    type: 'barbell',
    primary: 'hamstrings',
    secondary: ['glutes', 'traps-mid'],
  },
  { name: 'Lying Leg Curl', type: 'machine', primary: 'hamstrings' },
  { name: 'Goblet Squat', type: 'db', primary: 'quads', secondary: ['glutes', 'adductors'] },
  { name: 'Hip Thrust', type: 'barbell', primary: 'glutes', secondary: ['hamstrings'] },
  { name: 'Hanging Knee Raise', type: 'bodyweight', primary: 'abs-lower', secondary: ['obliques'] },
  { name: 'Dead Bug', type: 'bodyweight', primary: 'abs-lower', secondary: ['abs-upper', 'obliques'] },
]
```

- [ ] **Step 2: Run integrity test, verify it PASSES**

Run:
```bash
npx vitest run src/tests/db/seed-integrity.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 3: Commit Task 2 + Task 3 together**

Both files combined go in one atomic commit (the seed is consistent only when both changes apply together).

Run:
```bash
git add src/db/seed/muscle-groups.ts src/db/seed/exercises.ts
git commit -m "feat(db): expand muscle-group schema 15 → 22 + remap 33 exercises"
```

---

## Task 4: Add `heatmap-colors` test for 22-slug coverage

`SLUG_TO_ZONE` in `src/lib/heatmap-colors.ts` currently maps the old 15 slugs to `BodySvg` zones. We need to extend it for all 22 new slugs (multiple slugs may collapse into one existing zone — chest-upper/mid/lower → 'chest', delts-front/side/rear → 'shoulders', etc.). Test first, then implement.

No prior test file exists for `heatmap-colors.ts` — this task creates it.

**Files:**
- Create: `src/tests/lib/heatmap-colors.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/tests/lib/heatmap-colors.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { volumeToColor, slugToZones, SLUG_TO_ZONE } from '@/lib/heatmap-colors'
import { MUSCLE_GROUPS } from '@/db/seed/muscle-groups'

describe('volumeToColor', () => {
  it('returns INACTIVE color for 0 volume', () => {
    expect(volumeToColor(0, 1000)).toBe('#1f2733')
  })

  it('returns INACTIVE color when maxVolume is 0', () => {
    expect(volumeToColor(500, 0)).toBe('#1f2733')
  })

  it('returns red for ratio >= 0.76', () => {
    expect(volumeToColor(800, 1000)).toBe('#ef4444')
    expect(volumeToColor(760, 1000)).toBe('#ef4444')
  })

  it('returns amber for ratio in [0.51, 0.75]', () => {
    expect(volumeToColor(510, 1000)).toBe('#f59e0b')
    expect(volumeToColor(750, 1000)).toBe('#f59e0b')
  })

  it('returns emerald for ratio in [0.26, 0.50]', () => {
    expect(volumeToColor(260, 1000)).toBe('#10b981')
    expect(volumeToColor(500, 1000)).toBe('#10b981')
  })

  it('returns dark green for ratio in [0.01, 0.25]', () => {
    expect(volumeToColor(10, 1000)).toBe('#065f46')
    expect(volumeToColor(250, 1000)).toBe('#065f46')
  })
})

describe('SLUG_TO_ZONE', () => {
  it('maps every MUSCLE_GROUPS slug to a zone', () => {
    const orphans = MUSCLE_GROUPS
      .map((mg) => mg.slug)
      .filter((slug) => !(slug in SLUG_TO_ZONE))
    expect(orphans).toEqual([])
  })

  it('covers all 22 expected new-schema slugs', () => {
    const expected = [
      'chest-upper', 'chest-mid', 'chest-lower',
      'delts-front', 'delts-side', 'delts-rear',
      'lats', 'traps-upper', 'traps-mid', 'rhomboids',
      'biceps', 'triceps', 'forearms',
      'abs-upper', 'abs-lower', 'obliques',
      'quads', 'hamstrings', 'glutes',
      'calves-gastroc', 'calves-soleus', 'adductors',
    ]
    for (const slug of expected) {
      expect(SLUG_TO_ZONE[slug]).toBeDefined()
    }
  })
})

describe('slugToZones', () => {
  it('returns empty array for unknown slug', () => {
    expect(slugToZones('not-a-slug')).toEqual([])
  })

  it('returns single entry for front-only slug', () => {
    const result = slugToZones('chest-mid')
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ view: 'front' })
  })

  it('returns two entries for both-views slug', () => {
    const result = slugToZones('calves-gastroc')
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.view).sort()).toEqual(['back', 'front'])
  })
})
```

- [ ] **Step 2: Run the test, verify it FAILS**

Run:
```bash
npx vitest run src/tests/lib/heatmap-colors.test.ts
```

Expected: failures in `SLUG_TO_ZONE` block — `chest-upper`, `delts-front` etc. are `undefined`. `volumeToColor` tests pass (existing behavior unchanged).

- [ ] **Step 3: Do NOT commit yet**

Test stays red until Task 5.

---

## Task 5: Update `SLUG_TO_ZONE` for 22 slugs

Map all 22 new slugs to existing `BodySvg` zones. Multiple new slugs collapse into a single zone — that is expected (PR-2 will replace `BodySvg` with `AnatomicalBody` where each slug has its own SVG path).

**Files:**
- Modify: `src/lib/heatmap-colors.ts`

- [ ] **Step 1: Replace `SLUG_TO_ZONE`**

In `src/lib/heatmap-colors.ts`, replace the existing `SLUG_TO_ZONE` constant (lines 20–36) with:

```typescript
export const SLUG_TO_ZONE: Record<string, { zone: string; view: 'front' | 'back' | 'both' }> = {
  // Chest split → existing 'chest' zone (front)
  'chest-upper': { zone: 'chest', view: 'front' },
  'chest-mid':   { zone: 'chest', view: 'front' },
  'chest-lower': { zone: 'chest', view: 'front' },
  // Deltoid split → existing 'shoulders' zone
  'delts-front': { zone: 'shoulders', view: 'front' },
  'delts-side':  { zone: 'shoulders', view: 'both' },
  'delts-rear':  { zone: 'shoulders', view: 'back' },
  // Back
  'lats':        { zone: 'back-upper', view: 'back' },
  'traps-upper': { zone: 'back-upper', view: 'back' },
  'traps-mid':   { zone: 'back-upper', view: 'back' },
  'rhomboids':   { zone: 'back-upper', view: 'back' },
  // Arms
  'biceps':   { zone: 'biceps', view: 'front' },
  'triceps':  { zone: 'triceps', view: 'back' },
  'forearms': { zone: 'forearms', view: 'front' },
  // Core split → existing 'abs' zone
  'abs-upper': { zone: 'abs', view: 'front' },
  'abs-lower': { zone: 'abs', view: 'front' },
  'obliques':  { zone: 'abs', view: 'front' },
  // Legs
  'quads':         { zone: 'quads', view: 'front' },
  'hamstrings':    { zone: 'hamstrings', view: 'back' },
  'glutes':        { zone: 'glutes', view: 'back' },
  'calves-gastroc':{ zone: 'calves', view: 'both' },
  'calves-soleus': { zone: 'calves', view: 'both' },
  'adductors':     { zone: 'adductors', view: 'front' },
}
```

The other exports (`volumeToColor`, `slugToZones`, `WORKOUT_COLORS`, `INACTIVE`, `THRESHOLDS`, `ZoneMapping`) stay unchanged.

- [ ] **Step 2: Run the test, verify it PASSES**

Run:
```bash
npx vitest run src/tests/lib/heatmap-colors.test.ts
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

Run:
```bash
git add src/lib/heatmap-colors.ts src/tests/lib/heatmap-colors.test.ts
git commit -m "feat(heatmap): extend SLUG_TO_ZONE to 22-slug schema"
```

---

## Task 6: Full verification gauntlet

Run typecheck, lint, full test suite, and §11.2 nested-import grep guard. Manual smoke verifying dev DB re-seeds cleanly and dashboard heatmap renders.

**Files:**
- No code changes

- [ ] **Step 1: Typecheck**

Run:
```bash
npm run typecheck
```

Expected: zero errors.

- [ ] **Step 2: Lint**

Run:
```bash
npm run lint
```

Expected: zero errors and zero warnings.

- [ ] **Step 3: Full unit test suite**

Run:
```bash
npm run test:run
```

Expected: all tests pass. Look in particular for: existing heatmap-related tests (e.g., `MuscleHeatmap.test.tsx` if present), any test importing from `muscle-groups.ts` or `exercises.ts`.

- [ ] **Step 4: §11.2 nested-import grep guard**

Run from worktree root:
```bash
grep -rn "from '@/components/ui/[a-z-]\+/[a-z-]" src/ --include="*.tsx" --include="*.ts" | grep -v "/index" || echo "PASS"
```

Expected: `PASS` (no nested imports beyond barrel).

- [ ] **Step 5: Manual re-seed of dev DB**

Verify the new seed applies cleanly to the dev MySQL container. Inside the worktree:

```bash
# Truncate tables (seed has idempotence guard that skips if non-empty)
mysql --host=127.0.0.1 --port=3306 --user=hexis --password="$(grep ^DATABASE_URL .env.local | sed -E 's/.*hexis:([^@]+)@.*/\1/')" hexis -e "
  SET FOREIGN_KEY_CHECKS=0;
  TRUNCATE exercise_muscle_groups;
  TRUNCATE exercises;
  TRUNCATE muscle_groups;
  SET FOREIGN_KEY_CHECKS=1;
"

# Re-seed
npm run db:seed
```

Expected output:
```
Seeding muscle_groups...
Seeding exercises + muscle group mapping...
Seed complete (plans se vytvoří v bootstrap pro reálného usera).
```

If the `mysql` CLI command fails (auth/connection), use `npm run db:studio` to open Drizzle Studio and truncate the three tables manually, then `npm run db:seed`.

- [ ] **Step 6: Manual dev-server smoke**

Run dev server in worktree:
```bash
npm run dev
```

Open `http://localhost:3000/dashboard` (login as `demo@hexis.local / Demo1234`). Verify:
- `MuscleWidget` card renders (no console errors)
- Body silhouette colors based on demo seed sessions (chest, quads, etc. should have some color if demo user has session data)
- No 500 / hydration errors

Also open `http://localhost:3000/training` — pick any session — verify `WorkoutHeatmap` (collapsible at bottom) opens without errors.

Stop dev server (Ctrl+C).

- [ ] **Step 7: No commit needed**

Verification step. If any check fails, halt and diagnose before opening the PR.

---

## Task 7: Open the PR

**Files:**
- No code changes

- [ ] **Step 1: Push branch**

Run:
```bash
git push -u origin sp4-muscle-schema-22
```

Expected: branch pushed, gh / origin tracking set.

- [ ] **Step 2: Open PR via `gh`**

Run:
```bash
gh pr create --title "SP4 PR-1 — muscle schema 15 → 22 (foundation)" --body "$(cat <<'EOF'
## Summary
- Expand `MUSCLE_GROUPS` seed from 15 → 22 slugs (split chest, delts, abs, calves; add `traps-upper`/`traps-mid`/`rhomboids`).
- Remap all 33 seeded exercises onto new slugs (full table in spec §4.2 / plan Task 3).
- Extend `SLUG_TO_ZONE` in `src/lib/heatmap-colors.ts` so existing `BodySvg` zones still receive colors.
- Add `seed-integrity` invariant test asserting every exercise references an existing slug.
- Add `heatmap-colors` unit tests covering all 22 slugs and color thresholds.

Foundation PR for SP4 (Muscle Visual Language). PR-2 follows with `AnatomicalBody` + `MuscleRank` radar.

Spec: `docs/superpowers/specs/2026-04-27-sp4-muscle-visual-language-design.md`
Plan: `docs/superpowers/plans/2026-04-27-sp4-pr1-muscle-schema-22.md`

## Acknowledged transitional behavior
After merge, dashboard `MuscleHeatmap` colors each `BodySvg` zone (e.g., 'chest') based on whichever new slug (chest-upper / chest-mid / chest-lower) iterates first. PR-2 replaces `BodySvg` with `AnatomicalBody` where each slug has its own SVG path. Acceptable transitional state.

## Test plan
- [ ] `npm run typecheck` clean
- [ ] `npm run lint` clean
- [ ] `npm run test:run` all unit + integration green
- [ ] §11.2 nested-import grep guard clean
- [ ] Dev DB re-seed succeeds (truncate + `db:seed`)
- [ ] Dashboard `/dashboard` MuscleWidget renders without errors
- [ ] Workout page `WorkoutHeatmap` renders without errors

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL printed; CI starts. Confirm with the user before merging.

---

## Self-Review Checklist (writer's pass)

- [x] **Spec coverage:**
  - §4.1 (slug expansion 15→22) → Task 2 ✓
  - §4.2 (exercise remap 33 cviků) → Task 3 ✓
  - §4.3 (reset DB strategy) → Task 6 Step 5 ✓
  - §4.4 files list (`muscle-groups.ts`, `exercises.ts`, `heatmap-colors.ts`, `heatmap-colors.test.ts`, `seed-integrity.test.ts`) → Tasks 1, 2, 3, 4, 5 ✓
- [x] **Placeholder scan:** no "TBD", "TODO", "implement later", or vague "handle edge cases" steps. Every code step has full code.
- [x] **Type consistency:** `MUSCLE_GROUPS` slugs in Task 2 exactly match the slugs referenced in Task 3 (primary/secondary), Task 4 test expected list, and Task 5 `SLUG_TO_ZONE` keys.
- [x] **TDD ordering:** Tasks 1, 2, 3 form red→green sequence (test passes baseline → fails after schema change → passes after remap). Tasks 4, 5 form red→green sequence.
- [x] **Commit cadence:** Tasks 1, 3, 5 each commit; Tasks 2 + 4 stay red, paired with the next task's commit.
