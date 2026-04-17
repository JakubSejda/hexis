# CI Pre-Push Hook — Design

**Date:** 2026-04-17
**Scope:** Finish Phase 1 MVP — the last unchecked item in `docs/superpowers/roadmap/hexis-roadmap.md`:
> `[ ] CI: typecheck + lint + test (pre-push hook)`

## Goal

A local safety net that prevents pushing broken code to the remote while the project has no hosted CI runner yet. Hosted CI (GitHub Actions or similar) will be set up during M9/deploy in Phase 2; until then, the pre-push hook is the single enforcement point.

## Current state

- Husky v9 is installed (`package.json` → `"prepare": "husky"`).
- `.husky/pre-commit` already runs `npx lint-staged` (prettier over staged files) and `npx tsc --noEmit`.
- No `pre-push` hook exists.
- Scripts available: `typecheck`, `lint`, `test:run`, `test:e2e`.
- Integration tests connect to the `hexis-mysql-test` container on port 3308 (see `docker-compose.yml`).

## Design

### Hook contents

New file `.husky/pre-push` (executable), running in fail-fast order — cheapest check first:

1. **Test-DB pre-flight.** Check that port 3308 is reachable. If not, print a single-line hint (`Run: docker compose up -d mysql-test`) and exit 1. Rationale: without this, vitest integration tests fail deep inside with a confusing connection error.
2. `npm run typecheck` — tsc --noEmit across the project.
3. `npm run lint` — ESLint over the repo (the `lint` script delegates to ESLint's own default discovery).
4. `npm run test:run` — Vitest single-run, unit + integration suites.

Each step exits nonzero on failure; Husky surfaces the exit code and blocks the push.

### Deliberately excluded

- **E2E (Playwright).** Requires a running dev server and seeded DB, takes tens of seconds, and is fragile to flaky UI timing. Belongs in hosted CI, not a git hook. Running manually via `npm run test:e2e` remains the workflow for now.
- **Production build (`next build`).** Long; redundant with typecheck + lint for MVP-local purposes. Catch real build breakage at deploy time.
- **Prettier check.** Already enforced at commit time via `lint-staged`.

### Pre-commit hook

Left unchanged. Fast feedback at commit time is valuable, and duplicating `tsc` between commit and push is an acceptable (cheap) safety net against rebase/merge regressions.

### Bypass

Standard `git push --no-verify` remains available for emergencies. No custom escape hatch.

### Implementation choice for the port check

Use `node -e` with a tiny TCP connect attempt rather than relying on `nc` — `nc` is not installed on every contributor's machine, but `node` is guaranteed (it's the project runtime). Keeps the hook dependency-free.

## Deliverables

1. `.husky/pre-push` (new, executable).
2. README `Běžné příkazy` section amended with a one-line note that a pre-push hook runs typecheck + lint + tests, plus a mention that `mysql-test` must be running.
3. Roadmap item flipped to `[x]` in `docs/superpowers/roadmap/hexis-roadmap.md`, marking Phase 1 MVP complete.
4. Manual verification: run `git push` on an unchanged HEAD — hook must execute all four steps and exit cleanly.

## Out of scope

- Hosted CI (GitHub Actions / similar) — deferred to M9/Phase 2.
- Running the test DB automatically (starting the container as part of the hook). Explicit control over Docker lifecycle stays with the developer.
- Splitting unit vs integration tests into separate scripts.
