# SP5 PR-1 — Rewards (spend XP) — Design

**Status:** spec — awaiting user review
**Date:** 2026-04-29
**Initiative:** SP5 — Missing features (Rewards / Habits / Player Bio / Quest Calendar)
**Slice:** PR-1 of SP5 (Rewards only). Habits / Bio / Calendar follow as separate specs.

## 1. Goal

Give XP a second pump. Until now XP only goes up — level rises, but the user never spends it. Rewards introduces a **separate spend ledger** where the user defines their own real-life rewards ("100 XP = sushi", "500 XP = nová kniha") and "vyzvedne si" them by debiting a balance.

The Rewards page is the user-facing translation of that ledger. The sidebar `Rewards` slot (already reserved as a `SP5` placeholder in `src/components/shell/area-meta.ts`) is flipped on by this PR.

## 2. Non-goals (parked, not in this PR)

- Predefined / curated reward catalog (cosmetic skins, badges)
- Recurring rewards or auto-redeem
- Reward categories or tags
- Reward sharing with friends / social proof
- Undo redemption (v1 = soft-delete redemption row only; no time-window logic)
- Mobile bottom-tab slot for Rewards (4 tabs already full — entry from dashboard balance card)
- Notifications / reminders ("Máš dost XP na X")

## 3. Core decision — separate spend ledger, not balance column

`xpEvents` is an append-only event log; `getTotalXp` sums `xp_delta`. `users.level` is denormalized and updated on every `awardXp` call.

**Rewards must NOT decrement `xp_delta` on `xpEvents`** — that would lower `totalXp`, which would lower level/tier. Level reflects lifetime work earned and never goes down.

Instead, Rewards introduces a parallel `reward_redemptions` table. The "k utracení" balance is computed at read time:

```
balanceXp = totalXp − Σ reward_redemptions.cost_xp (for this user)
```

Single source of truth, no migration risk, no balance drift, no double-bookkeeping. Trade-off: every page that shows the balance does one extra `SUM(...)` query. Acceptable — Rewards is a low-traffic page; dashboard balance card uses the same query helper.

## 4. Data model

Two new tables. No changes to existing `users` / `xpEvents`.

### 4.1 `rewards`

```ts
export const rewards = mysqlTable(
  'rewards',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 26 }).notNull(),
    name: varchar('name', { length: 80 }).notNull(),
    costXp: int('cost_xp').notNull(),                // > 0 (CHECK enforced in app layer)
    description: varchar('description', { length: 280 }),
    archivedAt: timestamp('archived_at'),            // soft-archive; null = active
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    byUserActive: index('idx_rewards_user_active').on(t.userId, t.archivedAt),
  })
)
```

- `name` cap 80 chars (room for emoji + description); `description` cap 280 chars (tweet-length).
- `archivedAt` is soft-delete: redemption history rows reference archived rewards by FK and must keep rendering.
- No FK constraint emitted by Drizzle migration (project convention — see existing tables); referential integrity enforced at app layer.

### 4.2 `reward_redemptions`

```ts
export const rewardRedemptions = mysqlTable(
  'reward_redemptions',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 26 }).notNull(),
    rewardId: int('reward_id').notNull(),
    costXp: int('cost_xp').notNull(),                // frozen at redeem time
    note: varchar('note', { length: 280 }),
    redeemedAt: timestamp('redeemed_at').defaultNow().notNull(),
  },
  (t) => ({
    byUserRedeemed: index('idx_redemptions_user_redeemed').on(t.userId, t.redeemedAt),
  })
)
```

- `costXp` is **frozen** at redeem time. If the user later edits the reward's `costXp`, history rows keep their original cost — the ledger stays accurate.
- `note` is optional free-text the user can add at redeem time ("k narozeninám 2026-04-30").

### 4.3 Migration

`src/db/migrations/0003_sp5_pr1_rewards.sql` — `CREATE TABLE rewards`, `CREATE TABLE reward_redemptions`, plus indexes. Generated via Drizzle, then committed.

## 5. Server-side queries

New file: `src/lib/queries/rewards.ts`. All functions take `(db, userId)`.

- `fetchRewardsBalance(db, userId): Promise<{ totalXp, spentXp, balanceXp }>`
  - `totalXp` reuses `getTotalXp` from `src/lib/xp.ts`.
  - `spentXp` = `SELECT COALESCE(SUM(cost_xp), 0) FROM reward_redemptions WHERE user_id = ?`.
  - `balanceXp = totalXp − spentXp`.
- `fetchActiveRewards(db, userId): Promise<Reward[]>` — `archivedAt IS NULL`, ordered `costXp ASC` (cheapest first — anchors the ladder).
- `fetchRedemptionHistory(db, userId, limit = 50): Promise<RedemptionWithReward[]>` — JOIN on rewards (left, since reward row may be archived but is never deleted), ordered `redeemedAt DESC`.

Mutation handlers live in route handlers (see §7), not in `queries/`.

## 6. Routes & UI surface

### 6.1 `/rewards` — primary surface

Server component (`src/app/(app)/rewards/page.tsx`). Lays out 3 stacked sections via `RegionHeader` (the SP3 pattern):

```
[ RegionHeader: Odměny ]
  BalanceCard — "K utracení: <balanceXp> XP" + sub: "<totalXp> earned · <spentXp> spent"
  PrimaryButton: "+ Nová odměna" → opens RewardDialog (create)

[ RegionHeader: Tvoje odměny ]
  RewardList — vertical stack of RewardCard rows
    each row: name, costXp, description?, [Vyzvednout] button + [⋯] menu
    [Vyzvednout] disabled when balance < costXp (with tooltip "Chybí <delta> XP")
  Empty state when no active rewards: CTA card "Vytvoř si první odměnu"

[ RegionHeader: Historie ]
  RedemptionList — vertical stack of small rows
    each: date · reward.name (italic if archived) · −costXp · optional note
  Empty state: muted "Zatím žádná vyzvednutí"
```

Mobile-first; sm breakpoint just gives the lists more horizontal padding. No 2-col grids.

### 6.2 `RewardDialog` — create / edit

Client component using DS `Dialog` primitive (added in DS Part 2 PR 2.7).

Form fields:
- **Název** — `Input`, required, 1–80 chars, trimmed
- **Cena (XP)** — `NumberInput`, required, integer ≥ 1, max 999_999 (UI cap; column is `int`)
- **Popis** — native `<textarea>` styled with the same Tailwind classes as `Input` (no DS multiline primitive exists yet; introducing one is out of scope), optional, 0–280 chars

Validation runs on the client before submit; server re-validates and returns 400 with field map on failure.

Edit mode reuses the same dialog, prefilled. Editing cost is allowed and intentionally affects only future redemptions (history rows keep their frozen cost — see §4.2).

### 6.3 `RedeemConfirmDialog`

Triggered from row [Vyzvednout]. Shows: reward name, cost, optional `note` field (Input, ≤280 chars). Two buttons: "Zrušit" / "Vyzvednout". Confirm POSTs to `/api/rewards/[id]/redeem`.

### 6.4 Row [⋯] menu

DS `Menu` primitive. Items:
- **Upravit** — opens `RewardDialog` in edit mode
- **Archivovat** — soft-delete (sets `archived_at = NOW()`); confirms via inline `<Button variant="destructive">` second-press, no extra dialog (small action, undoable by un-archive in §6.5)
- **Smazat** — only shown if the reward has zero redemptions; otherwise hidden (use Archivovat). Confirms via small AlertDialog ("Trvale smazat?").

### 6.5 Archived rewards

Out of MVP scope: no UI for unarchiving. If user wants it back, they create a new one. Spec re-visits if users complain. (Internal note: server endpoint `PATCH /api/rewards/[id]` accepts `archivedAt: null` for future un-archive — schema-ready, UI-deferred.)

## 7. API routes

All under `src/app/api/rewards/`. All require `requireUser()` (existing auth helper).

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/rewards` | — | `{ balance, rewards, history }` (one round-trip for SSR hydration) |
| POST | `/api/rewards` | `{ name, costXp, description? }` | `{ id, ...reward }` |
| PATCH | `/api/rewards/[id]` | partial `{ name?, costXp?, description?, archivedAt? }` | updated reward |
| DELETE | `/api/rewards/[id]` | — | `204`; rejects with `409` if redemptions exist |
| POST | `/api/rewards/[id]/redeem` | `{ note? }` | `{ redemption, balance }`; rejects with `402` if `balance < costXp` |
| DELETE | `/api/rewards/redemptions/[id]` | — | `204` (allows accidental-delete cleanup; no time window) |

Server-side balance check on `redeem` is the source of truth — UI disabled state is decoration.

## 8. Navigation hook-up

`src/components/shell/area-meta.ts`:
- Move `'rewards'` out of `PlaceholderArea` / `PLACEHOLDER_META` / `PLACEHOLDER_ORDER`.
- Add to `Area` union, `AREA_META` (with `href: '/rewards'`, `icon: Gift`, `matches: (p) => p === '/rewards' || p.startsWith('/rewards/')`).
- Add to `SIDEBAR_AREAS`.
- **Do NOT** add to `MOBILE_TABS` — already at 4 tabs (dashboard / training / progress / stats).

`Sidebar.tsx` — no change needed; reads from `SIDEBAR_AREAS`. The "Coming soon" section now shows 3 placeholders (habits / bio / calendar) instead of 4.

`useActiveArea()` — no change; the path-matcher pattern is identical to existing areas.

### 8.1 Dashboard entry point (mobile primary)

Append a single CTA row to `StatusWindow` (or a tiny new `BalanceCard` directly under it) that shows `K utracení: <balanceXp> XP` and links to `/rewards`. This is the only mobile entry point.

Decision: keep `StatusWindow` API stable, add a *separate* `RewardsBalanceCard` below it on the dashboard. Avoids prop creep on `StatusWindow`. Card is conditional: hidden when `totalXp === 0` (cold-start state has nothing to spend).

## 9. Czech vocabulary (locked)

| Concept | Term |
|---|---|
| Page title | **Odměny** |
| Balance label | **K utracení** |
| Earned (helper) | **Získáno** |
| Spent (helper) | **Utraceno** |
| Action — buy/use | **Vyzvednout** |
| Action — undo | **Vrátit** *(parked, not in PR)* |
| Section | **Tvoje odměny** / **Historie** |
| Empty state CTA | **Vytvoř si první odměnu** |
| Insufficient balance | **Chybí <delta> XP** |
| Archived reward in history | rendered in italic with no special label |

Verb choice rationale: "Vyzvednout" implies claiming something deserved, which fits XP-as-currency framing. "Koupit" was rejected as too transactional.

## 10. Components inventory

New (all under `src/components/rewards/`):
- `BalanceCard.tsx` — display-only card; balance + earned/spent breakdown; reused on `/rewards` and dashboard
- `RewardCard.tsx` — single reward row with [Vyzvednout] + [⋯]
- `RewardList.tsx` — wraps cards + empty state
- `RewardDialog.tsx` — create/edit form in `Dialog`
- `RedeemConfirmDialog.tsx` — confirm + optional note
- `RedemptionRow.tsx` — single history row
- `RedemptionList.tsx` — wraps rows + empty state
- `RewardsPageClient.tsx` — client wrapper that owns dialog open/close state and refreshes server data via `router.refresh()` after mutations (no React Query in this codebase yet — follows the SP3/SP4 pattern of `'use client'` + `router.refresh()`)

Reuses (no new primitives):
- `RegionHeader` from `src/components/dashboard/`
- `Card`, `Stack`, `Button`, `Input`, `NumberInput`, `Dialog`, `Menu`, `AlertDialog` from DS

## 11. Testing

| Layer | What |
|---|---|
| Integration (DB) | `fetchRewardsBalance` returns `{ totalXp − spentXp }` correctly across: 0 XP, 0 redemptions; 100 XP earned, 30 spent (= 70 balance); negative `xpEvents` (refund) summing correctly. |
| Unit | API route validation pure functions: cost ≤ 0 rejected; name empty/over-cap rejected; description over-cap rejected. |
| Integration (DB) | Redeem with insufficient balance returns 402 and writes no row. |
| Integration | CRUD reward (insert → list → patch → archive → confirm hidden from active list, visible in history). |
| Integration | Redeem flow: insert reward, redeem, balance decreases by exactly `costXp`, history row exists with frozen cost. |
| Integration | Edit reward `costXp` after redemption: history rows keep frozen cost, future redemptions use new cost. |
| Integration | Soft-archive vs delete: delete blocked when redemptions exist (409); archive always works. |
| Playwright | Happy path: open `/rewards` (empty), create "sushi 100 XP", redeem, balance updates, history shows redemption. Use existing `demo@hexis.local` seed user. |
| Playwright | Disabled state: with `balanceXp=0`, [Vyzvednout] is `aria-disabled="true"` (or `disabled`) and tooltip shows "Chybí 100 XP". |

Existing test suites (`426/426 → 516/516` baseline) stay green. Target after PR-1: ~`540/540` unit + 6/6 e2e.

## 12. Out-of-scope follow-ups (post-merge backlog)

- Rewards stats card on `/stats` ("Celkem vyzvednuto: 1 240 XP")
- Reward suggestions / templates ("typical first rewards" — UX decision after seeing real usage)
- "Reward earned" celebration animation on level-up (link to recommended reward at the right cost tier)
- Mobile entry: if BottomNav redesign happens (5-tab variant), add Rewards there
- Un-archive UI (server already supports it)
- Localized currency framing for non-Czech locales (i18n is project-wide deferred)

## 13. Risk register

| Risk | Mitigation |
|---|---|
| Balance drift if `xpEvents` adds delete semantics later | Balance is computed; nothing to drift. If `xpEvents` ever supports hard delete, balance auto-corrects on next read. |
| User redeems same reward twice in flight | Server-side balance check at INSERT time uses `SELECT … FOR UPDATE` (or relies on small transaction window — MySQL InnoDB row locks). Acceptable; cost-of-conflict is tiny. |
| Reward `costXp` integer overflow | Cap at 999_999 in UI; column `int` accepts up to 2.1B. |
| Soft-archived reward with redemptions later renamed in DB by hand | History row's `costXp` is frozen; only the displayed name changes. Acceptable. |
| Dashboard `RewardsBalanceCard` shown before user has any rewards | Guarded: hidden when `totalXp === 0`. After first XP, card appears with empty rewards list — acceptable nudge. |

## 14. PR plan

Single PR (`#18`), branch `sp5-pr1-rewards` off `main`, targeting `main`.

Commit shape (following SP4 PR-2 cadence):
1. `feat(db): add rewards + reward_redemptions schema (migration 0003)`
2. `feat(api): /api/rewards CRUD + redeem + history`
3. `feat(rewards): BalanceCard + RewardCard + List + Dialog`
4. `feat(rewards): /rewards page (SSR + client wrapper)`
5. `feat(shell): flip rewards from placeholder to active sidebar area`
6. `feat(dashboard): RewardsBalanceCard under StatusWindow`
7. `test: rewards balance, CRUD, redeem, archive, e2e happy path`

Self-review + commit messages follow `feedback_branching_strategy.md` (one PR per slice off main).
