# M3 — Measurements & Nutrition

> Design spec pro milestone 3. Scope: týdenní measurements grid + denní nutrition kalendář s heatmapou. Body photos jsou mimo scope (M5).

## 1. Schema změny

### 1.1 measurements — nové sloupce

| Sloupec | Typ | Popis |
|---------|-----|-------|
| `target_protein_g` | `smallint` | Týdenní cíl protein (g) |
| `target_carbs_g` | `smallint` | Týdenní cíl sacharidy (g) |
| `target_fat_g` | `smallint` | Týdenní cíl tuky (g) |
| `target_sugar_g` | `smallint` | Týdenní cíl cukry (g) |

Přidávají se k existující tabulce. Nullable — uživatel nemusí nastavovat.

### 1.2 nutrition_days — nové sloupce

| Sloupec | Typ | Popis |
|---------|-----|-------|
| `carbs_g` | `smallint` | Skutečné sacharidy (g) |
| `fat_g` | `smallint` | Skutečné tuky (g) |
| `sugar_g` | `smallint` | Skutečný cukr (g) |

### 1.3 users — nový sloupec

| Sloupec | Typ | Default | Popis |
|---------|-----|---------|-------|
| `tracked_macros` | `json` | `["kcal","protein"]` | Pole sledovaných maker |

Možné hodnoty v poli: `"kcal"`, `"protein"`, `"carbs"`, `"fat"`, `"sugar"`. UI zobrazuje jen zapnutá makra.

### 1.4 Žádné nové tabulky

Vše se vejde do existujících tabulek + rozšíření users.

## 2. Navigace & Routing

### 2.1 Tab bar — 4 taby

```
Dashboard  |  Trénink  |  Progres  |  Nastavení
```

`/progress` je nový tab v hlavní navigaci.

### 2.2 Segment control na /progress

```
┌──────────┐┌──────────┐
│   Tělo   ││  Výživa  │
└──────────┘└──────────┘
```

- `/progress` → redirect na `/progress/body`
- `/progress/body` — measurements grid + sparklines
- `/progress/nutrition` — kalendář + heatmapa

Sticky pod headerem. Rozšiřitelný o další segmenty (Síla, Fotky) v budoucích milestonech.

### 2.3 Souborová struktura

```
src/app/(app)/progress/
├── layout.tsx          ← segment control + shared header
├── page.tsx            ← redirect na /progress/body
├── body/
│   └── page.tsx        ← measurements grid
└── nutrition/
    └── page.tsx        ← kalendář + heatmapa

src/app/(app)/settings/
├── plates/page.tsx     ← existující
└── macros/page.tsx     ← NOVÝ — toggle které makra sledovat
```

## 3. Measurements Page — /progress/body

### 3.1 Sparkline karusel

Horizontálně scrollovatelný řádek karet nad tabulkou. Každá karta obsahuje:

- Label metriky (Váha, Pas, Hrudník, Stehno, Biceps)
- Aktuální hodnota (nejnovější non-null)
- Delta oproti předchozímu týdnu. Směr barev závisí na metrice:
  - Váha, Pas: zelená = pokles (žádoucí), červená = nárůst
  - Hrudník, Stehno, Biceps: zelená = nárůst (žádoucí), červená = pokles
- SVG sparkline za posledních 8 týdnů (null hodnoty přeskočeny)

Barva sparkline: zelená (žádoucí trend), červená (nežádoucí), šedá (stabilní/nedostatečná data).

### 3.2 Tabulka

- Řádek = týden, identifikovaný `weekStart` (pondělí)
- Sloupce: Týden | Váha | Δ | Pas | Hrudník | Stehno | Biceps | kcal cíl
- Default view: posledních 8 týdnů
- Scroll dolů: lazy load starších dat (cursor pagination, po 8 týdnech)
- Aktuální týden zvýrazněný (zelený datum, tmavší pozadí)
- Prázdné buňky zobrazeny jako `—` v muted barvě

### 3.3 Delta sloupec (Δ)

Automaticky počítaný: `Wn.weightKg - Wn-1.weightKg`. Delta jen pro váhu (primární metrika).

- Zelená: pokles (záporná delta)
- Červená: nárůst (kladná delta)
- Šedá `—`: chybí předchozí data

### 3.4 Inline edit

- Tap na buňku → NumberInput se objeví přímo v buňce
- Blur nebo Enter → `PUT /api/measurements` (upsert)
- Aktuální buňka vizuálně odlišená (border primary)
- Chyba: toast s error zprávou, hodnota se vrátí na předchozí

### 3.5 Poznámka

Tap na řádek (mimo buňku s číslem) → expanduje se řádek s textovým polem pro poznámku k danému týdnu. Blur → upsert.

### 3.6 Week start helper

```typescript
function toWeekStart(date: Date): string
```

Vrátí pondělí daného týdne jako `YYYY-MM-DD`. ISO week (pondělí = den 1).

## 4. Nutrition Page — /progress/nutrition

### 4.1 Kalendář

CSS grid 7×5 (Po–Ne × max 6 řádků). Navigace šipkami mezi měsíci.

Každý den (buňka):

- Číslo dne
- Pozadí barva (heatmapa) podle kcal vs target:
  - Zelená (`#065f46`): `kcalActual ≤ targetKcal * 1.1`
  - Červená (`#7f1d1d`): `kcalActual > targetKcal * 1.1`
  - Šedá (`#1f2733`): žádná data nebo žádný target nastaven
- Makro tečky pod číslem — řada malých kroužků, jeden per sledované makro:
  - Zelená: actual ≤ target (splněno)
  - Amber: actual v pásmu (target, target * 1.1] (těsně nad)
  - Červená: actual > target * 1.1 (jasně přes)
  - Žádná tečka pokud makro nemá nastavený target v measurements
- Dnešek: outline `#10b981`, číslo tučně a zelené
- Budoucí dny: tlumená barva čísla, žádné pozadí

Target kcal pro daný den se bere z `measurements.targetKcal` pro týden, do kterého den spadá. Stejně pro protein a ostatní makra.

### 4.2 Legenda

Dvě řady pod kalendářem:
1. Barvy pozadí: Hit / Miss / Prázdný
2. Tečky: kcal ok / makro miss / blízko cíle

### 4.3 Měsíční statistika

Panel pod legendou:
- Dní hit (zelená)
- Dní miss (červená)
- Prázdných (šedá)
- % úspěšnost (amber, `hits / (hits + misses) * 100`)

### 4.4 Daily modal

Tap na den → BottomSheet (Radix, existující komponenta):

- **Kcal progress bar:** `kcalActual / targetKcal` — zelená pokud hit, červená pokud miss
- **Protein progress bar:** `proteinG / targetProteinG` — stejná logika
- **Volitelná makra:** Grid 2×N, zobrazeno jen pro zapnuté makra bez targetu — prostě číslo (carbs, fat, sugar)
- **Poznámka:** Textové pole, editovatelné
- Všechna pole editovatelná inline — upsert na blur/submit
- Submit → `PUT /api/nutrition`

## 5. Dashboard Widgety

Tři nové karty pod stávajícím level/streak/workout CTA na `/dashboard`:

### 5.1 Dnešní výživa

- Kcal progress bar (velký, 10px)
- Protein progress bar (menší, 6px)
- Volitelná makra v 2-sloupcovém gridu (mini 4px bary, jen pokud zapnuté)
- "Upravit →" odkaz → /progress/nutrition s dnešním dnem focusnutým

Pokud dnes žádná data: prázdné bary s CTA "Zalogovat výživu →".

### 5.2 Tento týden (měření)

- Váha: velké číslo (28px) + delta + suffix "kg"
- Sparkline za 8 týdnů vedle váhy
- Řada dalších metrik (pas, hrudník, stehno, biceps) s deltami pod čárou
- "Měřit →" odkaz → /progress/body

Pokud tento týden žádná data: CTA "Zadat měření →".

### 5.3 Výživa streak

- Počet dní v řadě s kcal hitem (velké číslo, amber)
- Mini týdenní tečky (Po–Ne) — zelená = hit, šedá = prázdný/budoucí
- Streak se počítá zpětně od včerejška (dnešek ještě může být doplněn)

## 6. Settings — Makra

### /settings/macros

- Seznam všech dostupných maker: kcal, protein, sacharidy, tuky, cukry
- Toggle (switch) pro každé makro
- kcal a protein vždy zapnuté (nelze vypnout)
- Ostatní (carbs, fat, sugar) volitelné
- PUT /api/user/macros na toggle

## 7. API Routes

| Method | Endpoint | Popis |
|--------|----------|-------|
| `GET` | `/api/measurements?from=&to=` | Fetch měření pro rozsah. Default: 8 týdnů od teď. Cursor pagination. |
| `PUT` | `/api/measurements` | Upsert týdne. Body: `{ weekStart, weightKg?, waistCm?, chestCm?, thighCm?, bicepsCm?, targetKcal?, targetProteinG?, targetCarbsG?, targetFatG?, targetSugarG?, note? }` |
| `DELETE` | `/api/measurements/[id]` | Smazání + XP reversal. |
| `GET` | `/api/nutrition?month=YYYY-MM` | Fetch dnů pro měsíc. |
| `PUT` | `/api/nutrition` | Upsert dne. Body: `{ date, kcalActual?, proteinG?, carbsG?, fatG?, sugarG?, note? }` |
| `DELETE` | `/api/nutrition/[id]` | Smazání + XP reversal. |
| `GET` | `/api/user/macros` | Vrátí `{ macros: string[] }`. |
| `PUT` | `/api/user/macros` | Update. Body: `{ macros: string[] }`. Validace: musí obsahovat `"kcal"` a `"protein"`. |

Všechny routy: `getSessionUser()` → Zod validate → ownership → mutace → XP → response.

PUT (upsert) místo POST+PATCH — přirozenější pro data klíčovaná `(user, week/date)`.

## 8. XP Integrace

| Event | Trigger | XP |
|-------|---------|-----|
| `measurement_added` | První upsert pro daný týden (insert, ne update existujícího) | +20 |
| `nutrition_logged` | První upsert pro daný den (insert, ne update existujícího) | +10 |

- Update existujícího záznamu XP neuděluje
- Delete → `reverseXp()` s příslušným eventem
- Detekce insert vs update: MySQL `ON DUPLICATE KEY UPDATE` vrátí `affectedRows = 1` pro insert, `affectedRows = 2` pro update. XP se udělí jen pokud `affectedRows === 1`.

## 9. Testování

### 9.1 Unit testy (Vitest)

- `toWeekStart()` — pondělí pro různé dny, edge cases (neděle, přelom roku, přestupný rok)
- Sparkline SVG helper — generuje body, přeskakuje null hodnoty
- Heatmap klasifikace — hit/miss/empty, toleranční pásmo ±10%
- Nutrition streak — počítání zpětně, přerušení, prázdné dny
- Delta výpočet — záporná/kladná/null předchozí

### 9.2 Integration testy (Vitest + test DB na portu 3308)

- Measurements CRUD: upsert insert, upsert update, fetch range, delete + XP reversal
- Nutrition CRUD: upsert insert, upsert update, fetch měsíc, delete + XP reversal
- Macros preference: GET default, PUT update, validace (kcal+protein povinné)
- XP: award jen na insert, žádné XP na update, reversal na delete

### 9.3 E2E (Playwright)

- Measurements flow: navigace → /progress/body, inline edit buňky, ověření persistence
- Nutrition flow: navigace → /progress/nutrition, tap den, vyplnit modal, ověření heatmapa barvy
- Dashboard widgety: zalogovat výživu → zkontrolovat že dashboard ukazuje data

## 10. Komponenty

### 10.1 Nové sdílené

- `Sparkline` — SVG polyline z pole `(number | null)[]`, konfigurovatelná barva + výška
- `SegmentControl` — generic toggle pro N segmentů, aktivní = primary
- `ProgressBar` — hodnota/max, barva, výška, label

### 10.2 Nové doménové

**Measurements:**
- `MeasurementGrid` — tabulka s inline edit logikou
- `MeasurementRow` — řádek s editovatelnými buňkami + expandovatelná poznámka
- `SparklineCard` — karta pro karusel (label + hodnota + delta + sparkline)

**Nutrition:**
- `NutritionCalendar` — měsíční CSS grid s heatmapou
- `CalendarDay` — buňka dne (barva + tečky + číslo)
- `DailyModal` — BottomSheet s formulářem pro denní záznam
- `MonthStats` — panel s měsíčním souhrnem
- `NutritionStreak` — streak číslo + týdenní tečky

**Dashboard:**
- `TodayNutritionCard` — dnešní makra s progress bary
- `WeekMeasurementCard` — váha + delta + sparkline + mini metriky
- `NutritionStreakCard` — streak widget pro dashboard

## 11. Závislosti

Žádné nové npm dependencies. Vše postaveno na:
- Existující `@radix-ui/react-dialog` (BottomSheet)
- Existující `NumberInput` komponenta
- Ruční SVG sparklines
- Tailwind 4 třídy + existující design tokens
