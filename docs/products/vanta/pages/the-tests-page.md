# The Tests page

Source: https://help.vanta.com/en/articles/11345374-the-tests-page
Fetched: 2026-11-17

## Purpose

- "Your one-stop shop" for the list of security items to work on: assess the company's security posture and make progress toward compliance.
- Automated and document checks, each with an owner, a status and a due date, sorted most urgent first.

## Layout

- Global top bar: Vanta mark; help, announcements, settings, avatar at the end.
- Left nav: Help (⌘+K); Home; Tests (current); Reports; Compliance, Customer Trust, Risk, Vendors, Assets, Personnel; Integrations.
- Page header: title "Tests"; at the end "+ Create custom test" and "✎ Edit SLAs".
- Left rail "CATEGORY" with counts: All 2994 (selected), HR 131, IT 206, Policy 1951, Engineering 340, Risks 47, Custom 319; then "DEACTIVATED": All deactivated.
- Summary card "OK": 289 at the heading's end; "8%"; a bar; "289 OK" at the start and "3283 total" at the end.
- Summary card "Needs attention": 2994 at the heading's end; three lines with icons and counts: Overdue 183 (red ✕), Due soon 24 (orange clock), Needs remediation (no SLA assigned) 2787 (red diamond).
- Toolbar: Search; Framework, Control, Integration, Owner, Type, Status, Rollout dropdowns; a column-settings icon.
- Table columns: checkbox, Name, Category, Owner (avatar initials), Type, Status (badge), Due date (calendar icon and date), Frameworks (chips, then "+5").
- SLA settings (full-screen modal from Edit SLAs): Close ✕ and title "SLA settings"; "Save changes" at the end (disabled until a change).
- SLA settings left list "SLA CATEGORIES - ACTIVE", each with its deadline: Account access revocation 3 days (selected); Onboarding 30 days; Security tickets: P0 7 days; P1 14 days; P2 90 days; P3+ 90 days; Vulnerabilities: Critical 30 days; High 30 days; Medium 60 days.
- SLA settings detail: eyebrow "SLA RESPONSE", heading "Account access revocation", a description; card "SLA deadline" with "View history", the note "Changes will be applied to new items, not historical or currently open items", a number field (3) and a unit select (days), "Vanta's recommendation: 1 - 7 days".
- SLA settings card "Tests referencing this SLA" with a Search: each test a link with the frameworks it serves under it.

## How you get here / where it leads

- → Left nav: Tests.
- → Home's Monitoring cards and View tasks; My Work rows "Resolve N failing tests" (inferred from those pages).
- → A test's details: click a test (tabs Results, Evidence, History, Tasks, Controls, Audits, Notes).
- → Integrated task tracker: create a task from a test's Results tab.
- → Remediation instructions: "How to remediate" on the Results tab.
- → SLA settings: Edit SLAs.
- → Custom test creation: + Create custom test.
- → Deactivated tests: All deactivated.

## Actions

- Create custom test, Edit SLAs.
- Search by test name (not by asset name).
- Filter by Framework, Control, Integration, Owner, Type, Status, Rollout; pick a category in the left rail.
- Assign tests to people.
- Select rows (checkboxes).
- In a test: create a task in an integrated tracker, How to remediate.
- In SLA settings: set a deadline per SLA category, View history, Save changes.

## States and numbers

- Default order: most urgent first.
- Status seen: Overdue (red badge) with a red due date (Aug 6, 2022).
- Needs attention 2994 = Overdue 183 + Due soon 24 + Needs remediation (no SLA assigned) 2787.
- Category counts add up to 2994 (131 + 206 + 1951 + 340 + 47 + 319), so the rail counts tests needing attention (inferred).
- OK 289 of 3283 total, shown as 8% (289/3283 = 8.8%).
- Example row: "Application access request denied log", Engineering, owner AE, Type Document, Overdue, Aug 6, 2022, frameworks FedRAMP Mode…, Open Finance D…, +5.
- SLA deadlines: 3, 7, 14, 30, 60, 90 days by category.
- Test details tabs (article): Results = items requiring attention; Evidence = test data and identification (formerly Source Data); History = remediations that have taken place; Tasks = tasks in integrated trackers; Controls = the controls this test provides evidence for; Audits = upcoming audits this test is part of and its status for each; Notes = updates and context.

## Vocabulary

- Test, custom test, category, deactivated.
- OK, Needs attention, Overdue, Due soon, Needs remediation.
- SLA, SLA category, SLA deadline, SLA response, Vanta's recommendation.
- Owner, Type (Document), Rollout, Integration, Frameworks.
- Results, Evidence (Source Data), History, Tasks, Controls, Audits, Notes.
- How to remediate, task tracker.

## Screenshots

- `the-tests-page-01.png`: Tests with the Category rail, the OK (289, 8%) and Needs attention (2994) cards, the filter row and one Overdue document test.
- `the-tests-page-02.png`: the same view with an arrow at Edit SLAs.
- `the-tests-page-03.png`: SLA settings: the active SLA categories with their days, and Account access revocation's 3-day deadline and the tests that reference it.

## For Program Assurance

- PA's evidence and POA&M registers could open with the same pair of cards: what is OK out of the total, and what needs attention split into overdue, due soon and no due date, each line a filter.
- A category rail with counts beside a register (by control family, by system) gives each role its own list without a saved view.
- Due dates driven by a per-category deadline (here SLA; in RMF, POA&M timelines by severity) with a recommended range, applied only to new items, is a clear rule to show where it is set.
