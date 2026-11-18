# Automated test evidence (a test's Evidence tab)

Source: https://help.vanta.com/en/articles/11345529-automated-test-evidence
Fetched: 2026-11-17

## Purpose

- The Evidence tab of one automated test: what the test checks, which resources it evaluated, and the data behind the result.
- It is also what auditors are given once the test is shared (as "Test Evidence"), minus the API request and response data.

## Layout

- Left nav (this version): Help (⌘+K); Home, My work, Tests (current), Reports; Compliance expanded (Frameworks, Common controls, Controls, Policies, Documents, Audits, Issues, Settings).
- Breadcrumb "Tests" above the title.
- Title: the test's name ("Ensure branch protection rules are enforced for administrators (GitHub)"); a one-paragraph description under it.
- Header actions at the end: "Vanta Agent" (sparkle), "Copy test", a people icon, "…".
- Meta line of small facts with icons: Unassigned · Ran 56m ago · Automated workflow · SLA: 3 days · GitHub · Engineering.
- Line tabs: Results, Evidence (current), History, Tasks 1, Controls 50, Audits, Comments 1.
- Section "Test criteria" with a segmented toggle About | Logic at its end; a box of authored text ("What is the test?", "What are the inputs to the test?" with bullets, "What is pass and what is fail?") cut by "Show more ⌄".
- Section "Test evidence" with Framework and Status dropdowns and a download icon; a table Name, Type, Status, Date; a footer "1 to 5 of 19 results", "Show per page 5", previous/next.
- Clicking a Test evidence row opens a side panel on the table's right: the resource's name, Close ✕, a "Details" tab, a Raw JSON | Table toggle, copy and download icons, a Search, and numbered JSON.
- Section "Out of scope resources": one card per framework ("Removed from SOC 2 ⓘ": "8 Crowdstrike Monitored Hosts"; "Removed from HITRUST ⓘ": "1 Oracle Cloud Compute Instance" with "Hide resources" listing the resource name and its id).
- Section "API requests" with a Resource type dropdown and download; table Date, Resource type, Method, URL, Status; footer "1 to 5 of 124 results".
- Section "Exports": one line per file with a download button (…-testRun.csv, …-workpaper.pdf).
- Older tests show a "Test data" section instead: Resource type dropdown, a "View as JSON" switch, download; table Resource type, ID; "1 to 2 of 2 results".

## How you get here / where it leads

- → Tests (left nav) → click an automated test (opens on its Results tab) → Evidence tab.
- → Resource side panel: click a row of Test evidence.
- → A request's detail (headers and response data): click an API request.
- → Framework › Scope tab: where accounts on the older Source Data view see what is in or out of scope.
- → Auditor view: the same sections as "Test Evidence" when tests are shared with auditors.

## Actions

- About / Logic toggle; Show more.
- Filter Test evidence by Framework, Status; download.
- Open a resource's details; Raw JSON / Table; copy; download.
- Hide resources / show resources per framework.
- Filter API requests by Resource type; open a request; download.
- Download an export: the test run CSV, or the "Workpaper" (an immutable export of the latest run with full metadata, "designed to meet auditor standards").
- Header: Vanta Agent, Copy test, assign (people icon) (inferred), "…" (Manage subscribers, from the assignment article).

## States and numbers

- Resource status: Ok (meets the test's criteria), Not Ready (does not), N/A (evaluated but does not affect the overall test status).
- Each test has its own evaluation criteria; not every in-scope resource must pass for the test to pass.
- Screenshot: 5 of 19 resources shown, every one "Not ready" (GitHub Repo, November 26, 2025, 4:09 PM).
- API requests: 124 results; statuses 304, 200, 200, 404, 404.
- Out of scope: 8 hosts removed from SOC 2; 1 instance removed from HITRUST.
- Test meta: SLA 3 days; Tasks 1; Controls 50; Comments 1.
- Rollout state: the tab was called Source Data; accounts in an active audit still see Source Data; sections vary by test.

## Vocabulary

- Evidence tab (formerly Source Data), Test criteria (About, Logic), Test evidence (evidence table), Out of scope resources, API requests, Exports, Workpaper, Test data.
- Resource, Ok, Not Ready, N/A.
- Removed from <framework>.
- Auditor view, Test Evidence (formerly Test Source Data).

## Screenshots

- `automated-test-evidence-01.png`: a test's page on the Evidence tab: title, meta line, tabs, Test criteria; Tests highlighted in the nav.
- `automated-test-evidence-02.png`: the same header with the About | Logic toggle highlighted.
- `automated-test-evidence-03.png`: Test evidence table of five Not ready GitHub repos with one opened in a Raw JSON side panel.
- `automated-test-evidence-04.png`: Out of scope resources, per framework, with one resource listed.
- `automated-test-evidence-05.png`: API requests table (date, resource type, method, URL, status).
- `automated-test-evidence-06.png`: Exports with a test-run CSV and a workpaper PDF.
- `automated-test-evidence-07.png`: the older Test data table (resource type and id) with a View as JSON switch.

## For Program Assurance

- An evidence version's review could carry the same stack: what the evidence claims to show (criteria), each item it covers with its own status, what was scoped out per system or baseline, and a locked export for the assessor.
- A one-line meta row under the title (owner, last run, due rule, source, category) keeps the record's facts readable without a Details rail.
- The "Workpaper" idea, an immutable export of the exact run an assessor saw, maps to PA's published evidence versions and assessment results.
