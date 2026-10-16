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
| Complete browser baseline | 11 passed: 10 Chromium, 1 WebKit |
| Additional long-content mobile regression | Passed at 360 × 640 |
| Accessibility after the final wrapping change | Passed on workspace, add-lead and timeline |
| Production webpack build | Passed |
| Fresh-checkout locked install, lint, type checks, unit tests and build | Passed after repairing incomplete npm optional-platform lock entries |
| Actual API process restart with a disposable SQLite database | Status, note and UTC follow-up all persisted |
| `docker compose config --quiet` | Passed |
| Production dependency audit (`npm audit --omit=dev`) | Zero reported vulnerabilities |
| Scripted walkthrough | Recorded successfully; approximately 2 minutes 24 seconds |

The full browser baseline passed before adding the long-content test. That added test and
the affected accessibility scenario were then run separately and passed. The CI suite now
contains twelve browser tests and will report its own final result.

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

Docker Desktop reported that it was running, but the engine's version/readiness calls timed
out, including a bounded 15-second attempt. Local Compose image builds, container startup,
and volume-restart persistence have therefore **not been claimed as passed**. The configured
GitHub Actions job runs those checks on a separate Linux Docker engine after application tests.

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
and a Docker Compose seed/restart/data comparison. A configured workflow is not evidence
of success: consult the actual run at
[GitHub Actions](https://github.com/Arshkumar-elite/PravarAI/actions).

Screenshots are in `docs/screenshots/`; the walkthrough is in
`docs/video/leadflow-walkthrough.webm`. Browser tests use an isolated temporary database
with a fixed seed date. The walkthrough uses an isolated database seeded with the current
date and a live browser clock. Neither touches the developer's database.
