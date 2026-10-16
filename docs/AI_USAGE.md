# AI usage and attribution

## Disclosure

OpenAI Codex assisted with architecture planning, implementation of the frontend/backend,
test creation, debugging, documentation, and scripted evidence capture. The user supplied
the assessment and wireframes, selected the stack/delivery scope, requested a premium CRM
design, and explicitly requested a dedicated UI/UX skill.

The public [Anthropic frontend-design skill](https://github.com/anthropics/skills/tree/main/skills/frontend-design)
was installed and read during implementation. Its two-pass design/review method informed
the token system, typography, task-first layout, and screenshot critique. The local-only
workflow from the installed Sites skill was also used; this repository is not a hosted Site.

Generated contributions include the application code, seed content, tests, CI/Compose
configuration, and draft documentation. All sample contact details are fictional.
No customer data, email credentials, private assessment correspondence, or AI API keys
are included in the repository.

## Verification performed by the implementation agent

- Ran API tests covering validation, persistence, ordering, UTC conversion, and rollback.
- Ran UI unit/interaction tests and real-browser end-to-end flows.
- Inspected screenshots at desktop, tablet, and mobile widths.
- Used accessibility checks to identify and fix contrast, accessible-name, and focus issues.
- Ran static checks and a production build; documented environment-specific limitations.

Exact outcomes are recorded in [TESTING.md](TESTING.md). Automated and AI-assisted review
is not represented as an independent human code review. The repository owner should review
the code and recorded demonstration before sending the application submission.

## Sources

- [Next.js documentation](https://nextjs.org/docs/app): framework setup and build behavior.
  Installed version-specific documentation was also consulted under `node_modules/next/dist/docs`.
- [FastAPI SQL databases](https://fastapi.tiangolo.com/tutorial/sql-databases/),
  [testing](https://fastapi.tiangolo.com/tutorial/testing/), and
  [error handling](https://fastapi.tiangolo.com/tutorial/handling-errors/).
- [TanStack mutation responses](https://tanstack.com/query/latest/docs/framework/react/guides/updates-from-mutation-responses).
- [Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog) and
  [shadcn/ui](https://ui.shadcn.com/docs/components/dialog): accessible UI primitive patterns.
  The small local primitives are adapted to the project's custom CSS; they were not copied
  wholesale from a generated dashboard template.
- [Attio record/activity patterns](https://attio.com/help/reference/managing-your-data/records/create-and-view-records).
- [Playwright clock](https://playwright.dev/docs/clock): deterministic browser-time tests.
- Manrope is bundled through `@fontsource-variable/manrope`; Lucide supplies interface icons.
  Their upstream licenses remain with their packages.

Pinterest was searched for CRM references, but pin pages were inaccessible. No Pinterest
assets were downloaded or reused. No generated raster imagery is used in the app.
