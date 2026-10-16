# LeadFlow design direction

## Brief and audience

A sales representative needs to see who needs attention, recall the last conversation,
and record the next step without leaving the lead list. The supplied assessment wireframes
define the flows; this design refines their visual hierarchy and responsive behavior.

## References and method

- [Anthropic frontend-design skill](https://github.com/anthropics/skills/tree/main/skills/frontend-design):
  installed and read during implementation; deliberate tokens, brief review, screenshot critique.
- [Attio records and activity](https://attio.com/help/reference/managing-your-data/records/create-and-view-records):
  contact-first hierarchy, record preview, chronological activity and contextual actions.
- [shadcn workspace components](https://ui.shadcn.com/examples/dashboard):
  restrained controls and consistent primitive construction.
- [Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog):
  keyboard interaction, focus containment, accessible titles.
- Pinterest CRM searches were attempted, but individual pin pages were inaccessible.
  No Pinterest image or uninspected design is claimed as an implemented reference.

## Tokens

| Role | Value |
| --- | --- |
| Canvas | `#f7f8fa` |
| Surface | `#ffffff` |
| Ink | `#182230` |
| Muted text | `#647084` |
| Action | `#315ce7` |
| Attention | `#b42336` |

Manrope is locally bundled for both headings and body. Sizes: 12px metadata, 13–14px
controls and supporting text, 15px lead names, 22px dialogs, 30px workspace title.
Spacing uses a 4px base; small controls use 6–8px radii, grouped surfaces 12px,
dialogs 16px. Shadows distinguish overlays, not every row.

## Layout

Left-aligned, centered workspace with one meaningful visual emphasis: the Today group.

```text
LeadFlow / Workspace                                  + Add lead
----------------------------------------------------------------
Leads                                                 Today's date
Your conversations, with the next step in sight.
[Search by name........................] [Follow-ups: All]
[All leads] [New] [Contacted] [Qualified] [Proposal Sent] [Won] [Lost]

Today’s follow-ups (2)                              Pinned for today
  Name / company          Latest discussion           Status / due
  Name / company          Latest discussion           Status / due

Other leads (6)
  Name / company          Latest discussion           Status / due
  ...
```

On mobile, each row stacks into a contact card; search remains full width, status
filters wrap, and dialogs use the available viewport without hiding the composer.

## Pre-build critique

A permanent sidebar and metric-card strip would consume space without helping this
single-screen task, so neither is included. A table alone would bury the last discussion,
so rows preserve a readable note preview. Today is emphasized by grouping and a small
blue marker; overdue is explicit red text, never color alone. No decorative gradients,
stock photos, fake menu actions, or nonfunctional navigation are introduced.

## Visual QA

Inspect desktop, tablet, 390px and 360px layouts, plus long names/notes, modal scroll,
empty/error states and keyboard focus. Record resulting screenshots in `docs/screenshots/`.
