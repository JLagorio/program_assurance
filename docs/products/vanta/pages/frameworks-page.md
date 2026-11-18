# Frameworks page

Source: https://help.vanta.com/en/articles/11345371-frameworks-page
Fetched: 2026-11-17

## Purpose

- The progress of every framework the organization has purchased, and any custom frameworks its admins created.
- A catalog of the other frameworks Vanta automates, and a feed of updates to frameworks.

## Layout

- Global top bar: Vanta mark, a workspace switcher ("no probllama") beside it; help, announcements, settings, avatar at the end.
- Left nav: Help (⌘+K); Home, Tests, Reports; Compliance expanded (Frameworks current, Controls, Policies, Documents, Audits, Settings); Customer Trust, Risk, Vendors, Assets, Personnel; Integrations.
- Page header: title "Frameworks"; at the end "+ Add framework" and "View audits" (both outlined).
- Line tabs with counts: Active 24, Available 40 (unread dot), Update Notes 24 (unread dot).
- Active tab toolbar: "Search frameworks"; Status, Domain, Source dropdowns; a column-settings icon at the end.
- Active tab table columns: Framework name (round logo, name, and a second line "Built by Vanta" or "Custom"), Evidence comp(letion), Control comple(tion), Audit ends, Status, Domain (chips), and a row "…" menu.
- Available tab: "Search available frameworks"; Category, Release dropdowns; link at the end "Looking for a framework? Let us know! ↗".
- Available tab, "Recommended for you": "To save you time, we've recommended the frameworks that your organization could implement based on overlap and progress." Three cards: logo, name, domain chip, a ring with a percentage and a help (?) icon, buttons Explore and Schedule a call (primary).
- Available tab, "All frameworks": the same cards; frameworks already active show one "Manage" button instead.
- Explore view: tabs Overview, Requirements, Updates 3; a banner "Get started with ISO 42001" with a pitch and "Schedule a call"; left cards "Evidence completion" and "Control status"; right column "ISO/IEC 42001:2023 program overview" with "Learn More ↗", a description, "Available control sets" chips (Prod, Dev, User) and a collapsible "Audit and assurance steps" (Type, Assessment approach, Outcome).
- Update Notes tab: Search; Framework, Status, Type dropdowns; "Select date" range; table Title, Framework, Release date.
- Update note side panel (opens over the right of the page, with Close ✕): title, one-line summary, facts Framework (link), Status, Type (chip); "Update notes" heading, body text, "The framework is comprised of:" and a list of counted links.

## How you get here / where it leads

- → Left nav: Compliance › Frameworks.
- → Home's "View all frameworks".
- → Framework details: click a framework row.
- → Custom framework creation: "Add framework" (the article: "start the process of adding custom frameworks").
- → Audits: "View audits" (inferred from the label).
- → Explore view of an available framework; → Manage for one already active (inferred: opens its details).
- → Schedule a call (a meeting with a Vanta team member).
- → Update note side panel: click an update; its links open the framework, categories, controls, tests, documents and policies (inferred from link styling).

## Actions

- Add framework, View audits.
- Search frameworks; filter by Status, Domain, Source; column settings.
- Row menu: Snooze…, Delete… (Delete only for custom frameworks, from the Framework details article).
- Explore, Schedule a call, Manage, Learn More.
- Search available frameworks; filter by Category, Release.
- Search update notes; filter by Framework, Status, Type, date range.

## States and numbers

- Framework status: Active (green check), In audit (purple clipboard).
- Source: Built by Vanta, Custom.
- Active rows (Evidence / Control / Audit ends / Status / Domain):
- ESG Demo (Custom): No evidence (dashed ring) / 100% (green check) / — / Active / —.
- ISO 27001:2022: 44% / 18% / — / Active / Security.
- SOC 2: 38% / 18% / Mar 12, 2026 / In audit / Security, Data protection.
- ISO 27017: 46% / 18% / — / Active / Security.
- GDPR: 46% / 17% / — / Active / Security, Data protection.
- GCP (Custom): 46% / 17% / — / Active / —.
- ISO 27701: 27% / 16% / — / Active / Security, Data protection.
- SOX ITGC: 44% / 9% / — / Active / Security, Other.
- MVSP: 51% / 8% / — / Active / Security.
- Progress drawn as a small partial ring beside each percentage.
- Rows appear ordered by Control completion, highest first (inferred from the values).
- Available cards: ISO 42001 26%, AI ACT 26%, FedRAMP r5 1% (recommended); SOC 2 38%, ISO 27001:2022 44% (Manage), HIPAA 54%.
- Explore ISO 42001: Evidence completion 26%, "13 of 50 evidences completed"; Control status "70 total controls", ring 31% Completed, Evidence completed 22, Needs evidence 48.
- Update note EU AI ACT: Status Released, Type New Framework; 7 Categories, 157 controls, 61 tests ("the total number of tests may change based on your active integrations"), 53 documents, 18 policies.
- Update Notes rows: Data masking evidence (ISO 27001:2022, Feb 27, 2025); UK Cyber Essentials v3.1 (Feb 13, 2025); Australia Essential 8 - Level 3 controls (Jan 28, 2025); CMMC 2.0 (Nov 21, 2024); FedRAMP rev.5 (Oct 29, 2024); Title 23 NYCRR Part 500 (Oct 29, 2024); EU AI ACT (Oct 21, 2024); Fedramp Policy Templates (FedRAMP r5, Oct 14, 2024); AI Impact Assessment Template (ISO 42001, Oct 7, 2024); NIS 2 (Oct 7, 2024).

## Vocabulary

- Framework, custom framework, Built by Vanta.
- Active, Available, Update Notes.
- Evidence completion, Control completion, Audit ends, Domain, Source.
- Recommended for you, overlap and progress.
- Explore, Schedule a call, Manage.
- Control sets, Audit and assurance steps, program overview.
- Update note: Released, New Framework, New evidence, Policy template.

## Screenshots

- `frameworks-page-01.png`: the Active tab table of nine frameworks with evidence and control completion rings, Audit ends, Status and Domain chips; Frameworks highlighted in the nav.
- `frameworks-page-02.png`: the Available tab with Recommended for you and All frameworks cards (percentages, Explore, Schedule a call, Manage).
- `frameworks-page-03.png`: Explore view of ISO 42001: get-started banner, Evidence completion 26%, Control status ring 31%, program overview and audit steps.
- `frameworks-page-04.png`: the Update Notes tab table with the EU AI ACT update open in a side panel listing its counted contents.

## For Program Assurance

- A register of the workspace's control baselines (or programs) with two separate completion numbers per row, evidence and control, plus an assessment end date and a state chip (Active, In assessment), reads faster than one blended score.
- "How much of this framework you already cover" on reference baselines not yet adopted is a strong prompt for reuse; PA could show it for overlays and baselines in the library.
- Reference-data releases (a new catalog revision, an overlay version) fit a feed with a side panel that counts what changed and links into each part.
