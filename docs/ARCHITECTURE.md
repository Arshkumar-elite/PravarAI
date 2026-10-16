# Architecture and behavioral contract

LeadFlow has two runtime services and one database file. There is one frontend route (`/`)
and two modal workflows. There are no Next.js API routes, background jobs, authentication
services, or external AI calls.

## Boundaries and responsibilities

| Layer | Owns | Does not own |
| --- | --- | --- |
| Next.js App Router | HTML shell, metadata, local font, React providers | Database access |
| Workspace and feature components | Search/filter state, selected lead, dialogs, form drafts | Persistent business state |
| TanStack Query hooks | Fetching, cancellation, server-response cache updates and revalidation | Fabricating successful writes |
| API client | HTTP calls and readable error normalization | Follow-up scheduling decisions |
| Pure frontend helpers | Browser-local dates, grouping, ordering, relative time | Storage or network access |
| FastAPI routes and Pydantic schemas | HTTP contract, validation and response schemas | Browser timezone assumptions |
| Service functions and SQLModel | Transactions, latest-discussion query and persistence | UI state |

The browser talks directly to FastAPI. `NEXT_PUBLIC_API_URL` is a public, build-time
frontend value. `CORS_ORIGINS` is an explicit comma-separated list, with no wildcard.
Docker binds the published ports to loopback for this unauthenticated local demo.

## Database

`Lead` has integer ID, name, optional company/phone, six-value status, nullable current
follow-up, created/updated timestamps, and an internal nullable unique seed key.
`Discussion` has integer ID, lead foreign key, note, nullable historical follow-up,
and creation time. One lead has zero or more discussions.

SQLite foreign keys and WAL mode are enabled on each connection. The database uses a
15-second busy timeout. Sessions are request-scoped and closed after use.
`UTCDateTime` normalizes aware timestamps on write and restores UTC timezone metadata
on read, because SQLite does not preserve that metadata itself. API output uses UTC
ISO 8601 strings with `Z`.

Lead summaries use a single outer join to a window query ordered by discussion time
descending, then ID descending. There is no per-lead lookup loop. The latest note
is derived, not duplicated on the lead row.

Schema creation runs at startup for a new database. This initial submission has no
existing-data migration. Future schema changes should introduce Alembic migrations;
`create_all` is not a migration strategy for an already deployed database.

## HTTP interfaces

| Method and path | Input | Success |
| --- | --- | --- |
| `GET /api/health` | None | `200 {"status":"ok"}` after a DB query |
| `GET /api/leads` | None | `200 LeadSummary[]` |
| `POST /api/leads` | `name`, optional `company`, `phone` | `201 LeadSummary`, New status |
| `GET /api/leads/{id}` | Lead ID | `200 LeadDetail`, including discussions |
| `PATCH /api/leads/{id}` | `status` and/or `follow_up_at: null` | `200 LeadSummary` |
| `POST /api/leads/{id}/discussions` | `note`, optional aware `follow_up_at` | `201 {discussion, lead}` |

`LeadSummary` includes contact fields, status, timestamps, `last_note`, and
`last_discussion_at`. `LeadDetail` adds `discussions` in reverse chronological order.
The internal seed key is never included in responses.

Missing IDs return 404. Invalid inputs return FastAPI's 422 validation detail array.
Other HTTP failures use a string `detail`. Unexpected errors are logged server-side
and return a generic 500 message, with CORS headers preserved. OpenAPI and Swagger
are available at `/openapi.json` and `/docs` on the API service.

Name and note are trimmed and must not be blank. Limits are 120 characters for name,
160 for company, 40 for phone, and 5,000 for note. The API rejects unknown input fields.
Phone numbers are stored as text without country-specific format assumptions.
Duplicate names are allowed: names are not unique person identifiers.

## Save flow and consistency

1. The form validates locally; FastAPI validates again at the trust boundary.
2. Pending state disables conflicting writes and prevents automatic mutation retries.
3. Adding a discussion inserts the note and updates the lead in one DB transaction.
   A failure rolls back both; this is explicitly tested after SQL writes have flushed.
4. The response includes the saved discussion and authoritative updated lead summary.
5. The frontend updates list/detail caches directly from the response, then revalidates.
   Search, filtering and ordering derive from this shared list cache.
6. Drafts clear only after success. A failed request keeps the draft and offers manual retry.

Omitting or sending a null follow-up with a discussion preserves the current reminder.
A non-null follow-up replaces it. Only `PATCH {"follow_up_at": null}` clears it.
Historical discussion follow-up timestamps remain unchanged. Status updates do not
silently remove reminders, even for Won and Lost leads.

The UI cancels outstanding relevant reads before a mutation, preventing an older fetch
from overwriting the save result. Writes within a timeline are serialized by disabled
controls. This is a single-user demo: simultaneous edits from independent clients have
last-write-wins semantics. A response lost after the server committed is an uncertain
outcome; reload before manually retrying. Production multi-user support should add
idempotency keys and optimistic concurrency/version checks.

## Time and list rules

- The viewer's IANA browser timezone is shown beside the date input. Stored times stay UTC.
- Today is the local calendar date, not a UTC date or a rolling 24-hour window.
- Earlier-than-now is overdue; equality with now is not overdue.
- Today's reminders are always pinned, earliest time first. Earlier today is also red.
- Other overdue leads come next, oldest reminder first; remaining leads sort by latest
  discussion or creation time descending. ID descending breaks ties.
- Name search is trimmed/case-insensitive. Status and follow-up filters combine with AND.
- Upcoming means a timestamp later than now, including later today.
- Each lead appears once. New leads have no fabricated discussion history.
- Relative times and groups refresh every minute and on window focus.
- Nonexistent local times during spring DST changes are rejected. For ambiguous fall-back
  times, the browser's Date conversion chooses the earlier occurrence; no offset picker
  is included in this assessment.

## UI and accessibility

Radix dialogs provide focus containment and Escape handling. The wrapper explicitly
returns focus to the opener, falling back to Add lead if filtering removed that opener.
The contact name is the semantic button; a CSS hit area makes the full row clickable.
Note/status metadata remains readable and is also associated with that button.

The timeline scrolls independently on desktop. On small/short viewports the complete
dialog scrolls, keeping the composer reachable. Plain text rendering prevents note HTML
from executing. Status and overdue meanings are written out, not conveyed by color alone.

## Operational choices

- Eight fictional seed leads and fourteen discussions; unique internal seed keys make
  repeat runs non-destructive. Existing user edits are preserved.
- All leads are loaded client-side; pagination, server search and indexes for scale are
  future work, not a hidden production scalability claim.
- SQLite is persisted in a named Compose volume; `docker compose down` preserves it.
- Production builds use supported webpack after a local Turbopack worker failed.
- Explicit optional Rolldown bindings work around npm's incomplete optional-dependency
  installation for the Mac ARM64 and Linux x64 test environments. The lock retains all
  platform variants and nested ESLint validators needed by npm 11 and npm 12; validate
  both targets when refreshing dependencies, because older npm can prune platform entries.
- CI runs application checks, browsers, and a Compose persistence comparison.
