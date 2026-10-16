# Verification results

Verification date: October 16, 2026. Local environment: macOS ARM64, Node 24.4.1,
Python 3.13.7, uv 0.11.28, Next.js 16.4.2, FastAPI 0.143.2.

## Executed locally

| Check | Actual result |
| --- | --- |
| Backend Ruff lint and formatting | Passed |
| API tests | 19 passed |
| Frontend ESLint | Passed without warnings |
| Next.js type generation and TypeScript | Passed |
| Vitest logic/interaction tests | 17 passed |
| Complete browser regression in Linux CI | 12 passed: 11 Chromium, 1 WebKit |
| Additional long-content mobile regression | Passed at 360 × 640 |
| Accessibility after the final wrapping change | Passed on workspace, add-lead and timeline |
| Production webpack build | Passed |
| Fresh-checkout locked install, lint, type checks, unit tests and build | Passed after repairing incomplete npm optional-platform lock entries |
| Actual API process restart with a disposable SQLite database | Status, note and UTC follow-up all persisted |
| `docker compose config --quiet` | Passed |
| Compose image builds, service health, seed, restart and data comparison in Linux CI | Passed |
| Production dependency audit (`npm audit --omit=dev`) | Zero reported vulnerabilities |
| Scripted walkthrough | Recorded successfully; approximately 2 minutes 24 seconds |

The complete workflow passed on application commit `654a447`, including all 48 tests
(19 API, 17 frontend, 12 browser), production builds, and Docker persistence:
[verified CI run](https://github.com/Arshkumar-elite/PravarAI/actions/runs/38925192304).
The final verification-report commit only changes documentation.

## Behavior covered

- Required/default/optional fields, all six statuses, invalid inputs, and missing IDs.
- Reverse chronological discussions and deterministic ordering when timestamps tie.
- Latest-note summaries and UTC serialization of an offset follow-up.
- A simulated exception after SQL writes flush rolls back both discussion and lead changes.
- Omitted reminders are preserved; explicit clearing keeps historical reminder records.
- Seed idempotency: eight leads, fourteen discussions, and preservation of user edits.
- Local-midnight and year boundaries, spring DST gaps, and a New York midnight after fall DST.
- Combined search, status and reminder filters; no duplicate pinned leads.
- Immediate saves and reload persistence through the real API in Chromium and WebKit.
- Failed request recovery, preserved drafts, and duplicate-click prevention while a promise is pending.
- Keyboard focus containment/restoration, axe scans, and empty/unavailable API recovery.
- Full workflows at 390px, layout evidence at 360/390/768/1440px, and long plain-text notes
  in a short mobile dialog without horizontal overflow or executable HTML.
- Browser page-error collection during screenshot capture reported no unhandled errors.

## Environment limitations and dependency notes

Docker Desktop reported that it was running, but the local engine's version/readiness calls
timed out, including a bounded 15-second attempt. Local container execution remains
unverified. The full Compose image builds, startup health checks, seed command, API restart,
and before/after data comparison **passed on GitHub Actions' Linux Docker engine**.

The initial CI attempt found missing optional-platform entries in the npm lockfile. A later
npm 11 resolution filled nested ESLint validators but pruned platform entries required by
npm 12. The final lock preserves both sets of npm-generated entries, without inventing
versions or integrity hashes. It passes clean Mac ARM64 and Linux x64 lock validation,
a real clean Mac install/build, and the complete Linux CI workflow.

The complete npm audit reports five high-severity findings in the development-only
`eslint-config-next → fast-glob → micromatch → braces` chain. The latest upstream `braces`
release available during verification was 3.0.3. npm's proposed automated fix was a major
downgrade to Next.js 14's lint configuration, which was not applied. The production-only
audit reports zero vulnerabilities. Recheck upstream advisories before using this project
outside the local assessment scope.

Starlette emits a deprecation warning about its httpx TestClient integration; API tests pass.
The local Turbopack production build failed while launching a compilation worker. The
supported webpack build was selected and passed, including from a clean checkout.

## CI and evidence

The workflow at `.github/workflows/ci.yml` runs lint/type/unit/build checks, all browser tests,
and a Docker Compose seed/restart/data comparison. See the
[successful run for the final application revision](https://github.com/Arshkumar-elite/PravarAI/actions/runs/38925192304)
or the [workflow history](https://github.com/Arshkumar-elite/PravarAI/actions).

Screenshots are in `docs/screenshots/`; the walkthrough is in
`docs/video/leadflow-walkthrough.webm`. Browser tests use an isolated temporary database
with a fixed seed date. The walkthrough uses an isolated database seeded with the current
date and a live browser clock. Neither touches the developer's database.
