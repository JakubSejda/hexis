# Hexis — Roadmap

**Living doc.** Přidávat během brainstormů, odškrtávat během implementace.

## Legend

- `[ ]` — plánováno / nezahájeno
- `[~]` — rozpracováno
- `[x]` — hotovo

## Fáze 1 — MVP (aktuální)

Pro detail viz `docs/superpowers/specs/2026-04-13-hexis-pwa-design.md`.

### Core
- [x] Next.js 15 projekt setup + TypeScript strict
- [x] Docker Compose s MySQL 8 (dev + test instance)
- [x] Drizzle schema + migrace
- [x] Seed script (katalog ~50 cviků + UA/UB/LA/LB plány)
- [~] NextAuth v5 (credentials hotovo; Google OAuth odložen na pozdější setup)
- [x] Middleware: security headers + rate limit
- [x] Tailwind 4 + Radix primitivy + design tokens

### Workout flow (M2 — hotovo 2026-04-14)
- [x] Dashboard s level, streak, CTA
- [x] /workout picker s plan rotací + resume banner + historie
- [x] Active workout stepper (one-exercise-at-a-time, per-set re-eval)
- [x] POST /api/sessions/[id]/sets + XP award + PR detection
- [x] Rest timer (localStorage + Screen Wake Lock, SW = M8)
- [x] Session complete flow + XP award (append-only ledger)
- [x] Edit/delete set v finished sessions s XP reversal
- [x] 12h lazy session auto-finish
- [x] Ad-hoc exercise přidání během session
- [x] Plate calculator (greedy fill + user plate inventory)
- [x] /settings/plates CRUD
- [x] Bottom tab bar layout

### Smart coach
- [x] `src/lib/1rm.ts` — Epley + Brzycki s testy
- [x] `src/lib/progression.ts` — double progression logika + per-set re-eval
- [x] `src/lib/stagnation.ts` — 2+ týdny detekce
- [x] `src/lib/plates.ts` — plate calculator
- [x] Grafy per cvik (1RM v čase, Recharts)
- [x] Grafy per svalová skupina (týdenní objem stacked bar)
- [x] Export dat do ZIP (CSV)

### Progres tracking
- [x] Weekly measurements grid (inline edit, save on blur)
- [x] Nutrition kalendář s heat map + daily modal
- [x] Body photos upload (HEIC konverze, EXIF strip, thumbnail)
- [x] Photo views: Grid / Timeline / Před×Po (Timelapse deferred)

### Avatar (B1)
- [x] `src/lib/xp-events.ts` — XP deltas + xpToLevel + xpForNextLevel
- [x] `src/lib/xp.ts` — awardXp + reverseXp + getTotalXp (append-only ledger)
- [x] xp_events ledger + aggregace
- [x] Placeholder SVG pro 5 tierů (`public/avatars/tier-{1-5}.svg`)
- [x] Avatar komponenta + XP bar v dashboard
- [x] Levelup toast + mini animace

### Muscle heatmap
- [ ] SVG silueta (front + back) s identifikovatelnými svaly
- [ ] Mapování cvik → svaly (seed `exercise_muscle_groups`)
- [ ] Overlay v workout UI (planned / done / rest barvy)
- [ ] Weekly heatmap na dashboardu

### PWA
- [ ] manifest.json + iOS splash screens + apple-touch-icon
- [ ] Service Worker (Serwist): precache + network-first API
- [ ] PWA install test iOS + Chrome

### Testing
- [x] Vitest setup + unit testy lib funkcí
- [x] Integration testy (xp, session-auto-finish) s testovací DB (port 3308)
- [x] Playwright setup + 3 E2E specs (workout flow, ad-hoc, edit)
- [ ] CI: typecheck + lint + test (pre-push hook)

## Fáze 2 — Hostinger deploy + multi-user

- [ ] Node.js app config na Hostinger Business hPanel
- [ ] Prod env variables + secrets management
- [ ] MySQL na Hostinger (migrace ze lokální)
- [ ] Deployment script (SSH git pull + build + pm2 restart)
- [ ] HTTPS cert setup + custom doména
- [ ] Signup flow + email verification
- [ ] Invite-link systém (zatím bez public registrace)
- [ ] Password reset flow s emailem
- [ ] OAuth Apple
- [ ] Passkey (WebAuthn)
- [ ] 2FA (TOTP)
- [ ] Session strategie revize (JWT → DB session?)
- [ ] Rate limit přesun do Redis / Upstash
- [ ] Offline-first s Dexie.js + sync queue
- [ ] CRDT nebo server-authoritative merge conflictů
- [ ] Sentry integrace

## Fáze 3 — Public product

- [ ] Landing page (marketing)
- [ ] Onboarding flow (wizard: body metrics → cíl → plán návrh)
- [ ] Free vs. Pro tier definition
- [ ] Stripe integrace + subscription management
- [ ] Billing dashboard
- [ ] Fakturace (CZ — FAKTUROID / Stripe Tax)
- [ ] GDPR: data export endpoint
- [ ] GDPR: account deletion flow
- [ ] Security audit / penetration test
- [ ] Terms of Service + Privacy Policy
- [ ] Cookie consent (ne-essential)
- [ ] Feature gating (free vs. pro)

## Fáze 4 — Trainer mode

- [ ] Role: trainer / client
- [ ] Trainer dashboard (přehled klientů)
- [ ] Assign plan → klient
- [ ] Trainer sleduje progress klienta
- [ ] Notes mezi trainer ↔ client
- [ ] (možná) real-time chat trainer ↔ client
- [ ] Notifikace (email + push: klient nedodržel plán, PR, atd.)
- [ ] Trainer billing split

## Deferred features (napříč fázemi)

### Avatar
- [ ] **B2 — Procedurální silueta** z měr (pas, hrudník, stehno → SVG path morph)
- [ ] **B4 — 3D rigged model** (React Three Fiber, měnící se podle měr)
- [ ] Upgrade placeholder avatar artwork na finální design (pixel art / illustrator)
- [ ] Custom avatar oblečení / accessories
- [ ] Avatar achievements / badges

### Nutrition
- [ ] **D — Food log** plný (vyhledávání potravin, čárové kódy)
- [ ] Integrace OpenFoodFacts API
- [ ] Integrace MyFitnessPal / Cronometer
- [ ] Makra split (nejen protein, ale i carbs/fats)
- [ ] Water tracking
- [ ] Meal photos (foto → odhad kcal přes AI)

### Workout features
- [ ] Tempo tracking (3-1-2-0 notation)
- [ ] Supersety
- [ ] Drop sets
- [ ] Rest-pause sets
- [ ] Cluster sets
- [ ] AMRAP tracking
- [ ] Cardio tracking (běh, kolo, rower, eliptikál)
- [ ] Mobility / conditioning samostatně
- [ ] Video přehrávač ke cvikům (ne jen YT link)
- [ ] Technique tips + common mistakes per cvik
- [ ] Deload / peaking automation (ne jen flag, ale návrh programu)
- [ ] Volume landmarks (MV/MEV/MAV/MRV per muscle)
- [ ] Auto-regulace podle RPE (jen když RPE 9–10 → snížit příští týden)
- [ ] Plan builder UI (drag & drop tvorba vlastního plánu)

### Photo progress
- [ ] AI auto-detection pose (front/side/back)
- [ ] AI auto-alignment (scale + rotate na stejnou kompozici)
- [ ] Automatická anonymizace obličeje (blur)
- [ ] Video progress
- [ ] Posing guide / checklist

### Analytics
- [ ] Tréninková konzistence score
- [ ] Predikce cíle ("při tempu 0.2 kg/týden dosáhnete 72 kg za …")
- [ ] Doporučení "víc spát" / "méně stresu" na základě RPE trendů
- [ ] Period cycling detection (pro ženské uživatele — Fáze 3+)

### Social
- [ ] Sdílení tréninků / PR
- [ ] Following friends
- [ ] Leaderboards (opt-in)
- [ ] Group challenges

### Platform
- [ ] Nativní iOS app (Capacitor wrapper nebo SwiftUI rewrite)
- [ ] Nativní Android app
- [ ] Apple Watch companion (quick log sets + rest timer)
- [ ] Garmin / Fitbit integrace (import cardio data)

## Technical debt tracker

(Přidávat během implementace když narazíme na kompromis.)

- [ ] *(zatím prázdné)*

## Nápady na pozadí (nezrecenzované)

Surové myšlenky co tu budou čekat na dekantaci. Ne commit.

- *(zatím prázdné)*
