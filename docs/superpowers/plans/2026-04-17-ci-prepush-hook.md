# CI Pre-Push Hook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local `pre-push` git hook that runs typecheck + lint + Vitest before every push, so Phase 1 MVP ships with a working safety net in lieu of hosted CI.

**Architecture:** Single shell script at `.husky/pre-push` executed by Husky v9. Fail-fast order: TCP pre-flight for the test-DB port → `typecheck` → `lint` → `test:run`. Husky is already installed and the existing `pre-commit` hook (prettier + tsc) stays unchanged. E2E and `next build` are intentionally excluded — they belong in hosted CI (M9).

**Tech Stack:** Husky v9, Node.js (for a dependency-free TCP port check), npm scripts (`typecheck`, `lint`, `test:run`).

**Related spec:** `docs/superpowers/specs/2026-04-17-ci-prepush-hook-design.md`

---

## File Structure

- Create: `.husky/pre-push` — new executable shell script, the whole hook lives here.
- Modify: `README.md` — add one line to the `Běžné příkazy` section noting the pre-push hook and its test-DB dependency.
- Modify: `docs/superpowers/roadmap/hexis-roadmap.md` — flip the `CI: typecheck + lint + test (pre-push hook)` checkbox and add a "Phase 1 complete" marker note at the top of Phase 1.

No test files are added. This is an ops/tooling change verified by executing the hook manually (the hook IS the test harness for other code).

---

### Task 1: Create the `pre-push` hook

**Files:**
- Create: `.husky/pre-push`

- [ ] **Step 1: Write the hook script**

Create `.husky/pre-push` with exactly this content (no shebang — Husky v9 invokes it through its own runner, matching the style of the existing `.husky/pre-commit`):

```sh
# Hexis pre-push hook — local CI safety net.
# Runs: test-DB pre-flight → typecheck → lint → vitest.
# Bypass with: git push --no-verify

# 1. Test-DB pre-flight.
# Integration tests require the hexis-mysql-test container on port 3308.
# We use `node` (guaranteed — it's the project runtime) instead of `nc`
# (not installed everywhere) so the hook stays dependency-free.
node -e "require('net').createConnection(3308,'127.0.0.1').on('connect',function(){this.end();process.exit(0)}).on('error',function(){process.exit(1)})" || {
  echo "✗ Test DB (port 3308) not reachable."
  echo "  Run: docker compose up -d mysql-test"
  exit 1
}

# 2. Typecheck (fastest).
npm run typecheck || exit 1

# 3. Lint.
npm run lint || exit 1

# 4. Unit + integration tests.
npm run test:run || exit 1
```

- [ ] **Step 2: Make it executable**

Run:

```bash
chmod +x .husky/pre-push
```

Verify it's executable:

```bash
ls -l .husky/pre-push
```

Expected: the mode column shows `-rwxr-xr-x` (or equivalent, the important bit is the `x` flag on the owner).

- [ ] **Step 3: Verify the test-DB pre-flight works in isolation**

Confirm the `mysql-test` container is up:

```bash
docker compose ps mysql-test
```

Expected: container listed with `STATUS` containing `healthy` (or at least `running`).

Now run just the pre-flight line by hand:

```bash
node -e "require('net').createConnection(3308,'127.0.0.1').on('connect',function(){this.end();console.log('ok');process.exit(0)}).on('error',function(e){console.log('err:',e.code);process.exit(1)})"
```

Expected: prints `ok` and exits 0.

If it prints `err: ECONNREFUSED`, start the container with `docker compose up -d mysql-test` and retry before moving on.

- [ ] **Step 4: Run the hook end-to-end against the current HEAD**

With the test DB up, trigger the hook by attempting a push that produces no actual transfer (unchanged HEAD against the tracking branch). If there are uncommitted changes or the branch is already up to date, a dry-run push still runs hooks:

```bash
git push --dry-run
```

Expected: all four steps print their output in order, the final line is the push summary (something like `Everything up-to-date` or a dry-run transfer report), and the shell exit code is 0.

If `typecheck`, `lint`, or `test:run` fails on a clean `main`, that's a pre-existing repo issue — stop and report it, do not push.

- [ ] **Step 5: Verify the hook actually blocks on failure**

Force a failure to confirm the hook isn't accidentally a no-op. Temporarily break typecheck by adding an invalid line to any file that's typechecked, e.g. append `const broken: number = 'not a number'` to the end of `src/lib/xp.ts` (choose any `.ts` file under `src/` — pick something small you can easily revert).

```bash
git add -A
git commit -m "temp: force typecheck failure"
git push --dry-run
```

Expected:
- `✗` pre-flight line does NOT appear (DB is up).
- Typecheck runs and fails with a TS error.
- Hook exits non-zero; `git push` aborts with a hook failure message.
- No push occurs (dry-run or otherwise).

Clean up immediately:

```bash
git reset --hard HEAD~1
```

Confirm the file is back to its committed state:

```bash
git status
```

Expected: `nothing to commit, working tree clean`.

- [ ] **Step 6: Verify the DB pre-flight blocks correctly**

Stop the test DB container and confirm the hook exits fast with the friendly hint:

```bash
docker compose stop mysql-test
git push --dry-run
```

Expected:
- Hook prints `✗ Test DB (port 3308) not reachable.` and the hint line.
- Hook exits non-zero; typecheck/lint/tests do NOT run.

Restart the container:

```bash
docker compose start mysql-test
```

Wait ~5–10 s, then confirm:

```bash
docker compose ps mysql-test
```

Expected: back to `healthy`/`running`.

- [ ] **Step 7: Commit the hook**

```bash
git add .husky/pre-push
git commit -m "$(cat <<'EOF'
feat(ci): pre-push hook runs typecheck + lint + tests

Local safety net in lieu of hosted CI (deferred to M9).
Fails fast on: test-DB unreachable → typecheck → lint → vitest.
E2E and next build intentionally excluded.
EOF
)"
```

Expected: commit succeeds. (The pre-commit hook — lint-staged + tsc — runs on this commit; it should pass since we're only adding a shell script, nothing staged matches lint-staged globs, and tsc is unaffected.)

---

### Task 2: Document the hook in README

**Files:**
- Modify: `README.md` — insert into the `Běžné příkazy` section.

- [ ] **Step 1: Add the hook line to `Běžné příkazy`**

Open `README.md` and find the code block starting at `### Běžné příkazy` (around line 52–66). Right after the closing ``` of that block, and before the `### Reset DB` heading, insert the following paragraph:

```markdown
> **Pre-push hook:** při každém `git push` se spouští `typecheck + lint + vitest` (viz `.husky/pre-push`).
> Vyžaduje běžící test DB (`docker compose up -d mysql-test`).
> Bypass v nouzi: `git push --no-verify`.
```

Use Edit with `old_string` = the existing `### Reset DB` heading line preceded by its blank line, and `new_string` = the block above + the same heading. Example shape:

`old_string`:

````
```

### Reset DB
````

`new_string`:

````
```

> **Pre-push hook:** při každém `git push` se spouští `typecheck + lint + vitest` (viz `.husky/pre-push`).
> Vyžaduje běžící test DB (`docker compose up -d mysql-test`).
> Bypass v nouzi: `git push --no-verify`.

### Reset DB
````

- [ ] **Step 2: Verify the edit renders as intended**

```bash
grep -n "Pre-push hook" README.md
```

Expected: one hit, located between the `Běžné příkazy` code block and the `### Reset DB` heading.

- [ ] **Step 3: Commit the README update**

```bash
git add README.md
git commit -m "$(cat <<'EOF'
docs(readme): document pre-push hook + test-DB requirement

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds. The pre-push hook itself is NOT triggered by committing (only pre-commit runs here) — no test DB needed.

---

### Task 3: Flip the roadmap checkbox and mark Phase 1 complete

**Files:**
- Modify: `docs/superpowers/roadmap/hexis-roadmap.md` — lines around 72–76 (Testing section) and around line 11 (Phase 1 heading).

- [ ] **Step 1: Flip the CI checkbox**

Open `docs/superpowers/roadmap/hexis-roadmap.md`. Find this exact line:

```
- [ ] CI: typecheck + lint + test (pre-push hook)
```

Change to:

```
- [x] CI: typecheck + lint + test (pre-push hook)
```

- [ ] **Step 2: Add a Phase-1-complete marker**

Find the Phase 1 heading:

```
## Fáze 1 — MVP (aktuální)
```

Change to:

```
## Fáze 1 — MVP ✅ hotovo (2026-04-17)
```

Rationale: Matches the style of the existing M2 completion note on line 24 (`### Workout flow (M2 — hotovo 2026-04-14)`). The "(aktuální)" label is now misleading — next active milestone will be M9/deploy in Phase 2.

- [ ] **Step 3: Verify the diff looks right**

```bash
git diff docs/superpowers/roadmap/hexis-roadmap.md
```

Expected: exactly two changed lines — the Phase 1 heading and the CI checkbox. Nothing else.

- [ ] **Step 4: Commit the roadmap flip**

```bash
git add docs/superpowers/roadmap/hexis-roadmap.md
git commit -m "$(cat <<'EOF'
docs(roadmap): Phase 1 MVP complete — pre-push hook lands the last item

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds.

---

### Task 4: Final end-to-end verification

**Files:** none (verification only).

- [ ] **Step 1: Confirm clean working tree**

```bash
git status
```

Expected: `nothing to commit, working tree clean` and three new commits ahead of the remote (hook, readme, roadmap).

- [ ] **Step 2: Run the full hook manually one more time**

```bash
git push --dry-run
```

Expected: pre-flight ok → typecheck green → lint green → vitest green → `Everything up-to-date` (or dry-run transfer summary). Exit code 0.

- [ ] **Step 3: Report readiness**

State to the user: Phase 1 MVP is complete, three commits are staged locally (hook, README, roadmap), and the user can `git push` when ready. Do NOT push — pushing to remote requires explicit user approval.

---

## Self-Review Notes

- **Spec coverage:** All four spec deliverables map to tasks — hook (Task 1), README (Task 2), roadmap flip (Task 3), manual verification (Task 4, plus verification steps embedded in Task 1). ✓
- **Placeholder scan:** No TBDs, no "add appropriate error handling", no unresolved types. ✓
- **Type consistency:** N/A (no code types defined).
- **Destructive steps flagged:** Task 1 Step 5 uses `git reset --hard HEAD~1` to clean up the deliberately-broken commit. This is explicitly scoped to reverting a commit the plan just created one step earlier, and the plan instructs to verify with `git status` afterward.
