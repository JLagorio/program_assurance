# Framework details page

Source: https://help.vanta.com/en/articles/11345369-framework-details-page
Fetched: 2026-11-17

## Purpose

- One page per framework the organization works towards: what progress has been made and what action items remain.
- Its Requirements tab lists every control by requirement, with completion progress and each control's evidence readiness.

## Layout

- Entry list (Frameworks page, Active tab): columns Framework name, Evidence comp…, Control comple…, Audit ends, Status, Domain, and a "…" row menu (Snooze…, Delete…).
- Breadcrumb "Frameworks" above the title (for example "ISO 27017").
- Line tabs: Overview, Requirements, Updates (count), Scope (a "Beta" badge).
- Requirements toolbar: "Search…"; Control status and Owner dropdowns; at the end "More ⌄" and "+ Create new control".
- Requirements left rail: "REQUIREMENT CATEGORIES" with a collapse button (←|), a list of categories by code and title (CLD.6.3 Relationship between cloud service customer and cloud service provider; CLD.8.1 Responsibility for assets; CLD.9.5 …; CLD.12.1 …; CLD.12.4 Logging and monitoring; CLD.13.1 Network security management; 5.1 …; 6.1 Internal organization; 7.2 During employment; 8.1 …; 8.2 Information classification; 9.1 …; 9.2 User access management; 9.4 …).
- Requirements "Completion" card: "Controls OK" with a large percentage, a bar, "N controls" at the start and "N total" at the end; on its right two small cards, "Test ↗" and "Document ↗", each with passed/total, a bar and a percentage.
- Then one block per category: the code in grey and the title in bold (CLD.6.3 …), with a collapse chevron.
- Inside it one card per requirement: code and title with an arrow (CLD.6.3.1 Shared roles and responsibilities within a cloud computing environment →) and an "Add control" button.
- Requirement card table columns: CONTROL (name over a two-line description), EVIDENCE READINESS (ring and passed/total), OWNER; an unlink icon at the row end.
- Updates tab: Search; Status, Type dropdowns; "Select date range"; one card per update with Status (badge), Release date and Type (chip).
- Overview tab: shown for an available framework on the Frameworks page article (Evidence completion card, Control status ring, program overview) (inferred to be the same tab).

## How you get here / where it leads

- → Frameworks page: click a framework row; Home's Compliance progress cards (inferred).
- → Breadcrumb back to Frameworks.
- → Custom control creation: "+ Create new control" (article: "add custom controls"); "Add control" on a requirement (inferred: maps an existing control).
- → A requirement's own view: the arrow after the requirement title (inferred).
- → A control's view: click a control row (inferred; the Controls page article opens a control in a side panel).
- → Tests page and Documents page: the "Test ↗" and "Document ↗" cards (inferred from the external-link icons).
- → Scope tab: framework scoping (Beta).
- → Snooze a framework; Delete a custom framework (row menu on the Frameworks page).

## Actions

- Search; filter by Control status, Owner.
- + Create new control.
- Add control (per requirement).
- More: Change control set; Export controls; Export all framework evidence; Export custom control history; Export gap assessment; Remove Vanta controls.
- Collapse the category rail; collapse a category.
- Unmap a control from a requirement (inferred from the unlink icon).
- Row menu on the list: Snooze…, Delete… (delete only for a custom framework).
- Updates: search, filter by Status, Type, date range.

## States and numbers

- Column definitions (article): Evidence completion = percentage of evidence that meets the framework's requirements; Control completion = percentage of controls that are passing; Audit ends = audit end date; Status = framework status.
- ISO 27017 Requirements: Controls OK 18%, 8 controls of 44 total (8/44 = 18.2%); Test 93/182, 51%; Document 8/34, 24%.
- A control's evidence readiness: "0/2" with an empty ring; owner "Unassigned".
- Update cards (ISO 27001:2022, Updates 2): "Data masking evidence", Released, Feb 27, 2025, New evidence; "ISO 27001 Policy template updates", Released, Nov 14, 2023, Policy template.
- Updates tab counts: ISO 27017 shows 0, ISO 27001:2022 shows 2.
- The list row menu offers Snooze… and Delete… (red).

## Vocabulary

- Framework, requirement, requirement categories, control, custom control, Vanta controls.
- Controls OK, Completion, Evidence readiness, Owner, Unassigned.
- Control set, gap assessment, framework evidence, custom control history.
- Updates (Released; New evidence; Policy template), Scope (Beta).
- Snooze, Delete.

## Screenshots

- `framework-details-page-01.png`: the Frameworks Active table with a row "…" menu open (Snooze…, Delete…).
- `framework-details-page-02.png`: ISO 27017 Requirements tab: category rail, Completion card (Controls OK 18%, Test 93/182, Document 8/34) and requirement CLD.6.3.1 with its control, evidence readiness 0/2 and owner Unassigned.
- `framework-details-page-03.png`: ISO 27001:2022 Updates tab with two released update cards.

## For Program Assurance

- A baseline's controls read best grouped by family in a collapsible rail, with each requirement as a card holding its controls, their evidence readiness as passed/total and their owner: close to PA's control baseline by family, with an owner column added.
- The completion card splits one percentage into its sources (automated tests vs documents), each with its own count; PA could split "controls satisfied" by what stands behind them (requirements, evidence, assessment).
- Bulk exports (controls, all evidence, gap assessment) sit in one More menu beside the single create action.
