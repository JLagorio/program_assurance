# Automated test history (a test's History tab, and its history in an audit)

Source: https://help.vanta.com/en/articles/11345515-automated-test-history
Fetched: 2026-11-17

## Purpose

- The History tab of an automated test: past results, shown one of two ways depending on whether the test is tied to an SLA category.
- The same history inside an audit, where an auditor checks the test's effectiveness over the audit window.

## Layout

- Test page header: breadcrumb "Tests"; title ("Medium vulnerabilities identified in packages are addressed (Azure Container)"); description; meta line Unassigned · Azure · Last refreshed 16 hours ago (refresh icon); a people icon and "…" at the end.
- Line tabs: Results, Source data, History (current), Tasks (0), Controls (61), Audits, Notes.
- Info banner: "This test evaluates different resources based on the framework. As a result, the status of this test may vary by framework over time. To view test history for a particular framework, select it below."
- "Remediation history ⓘ" heading with a select beside it (All resources, or one framework), and a date range at the end ("Nov 5, 2024 - May 5, 2025").
- Filter row: "With due date (725) ⌄" (active, purple), "Remediation status ⌄".
- SLA test table columns: NAME (the failing item, with "Within SLA" in green under it), DETECTED ON, DUE ON, REMEDIATED ON (each a date over a time), TIME TO REMEDIATE.
- Framework select (open): All resources; ISO 27001:2022 (checked); then frameworks greyed out with "- Not available" (FedRAMP Moderate Rev. 4, ADG Test Frame, Open Finance Data Security Standard, Minimum Viable Secure Product, SOC 2, Australian Essential 8, HITRUST, UK Cyber Essentials).
- Empty result: "No results found" / "There aren't any results for this query."
- Non-SLA tests (article only): a horizontal timeline bar instead of the table.
- Audit workspace (auditor's view, Evidence page): a dark top bar with the audit's name ("NoProbllama, SOC 2 Type II"), badges External and Upcoming, the window "Jul 7 2025 - Oct 2 2025", and the auditor ("Demo Auditor").
- Audit left nav: Evidence (current), Controls, Framework; Risk, Vendors, Assets, Personnel; Integrations; Organization settings.
- Audit Evidence page: title "Evidence"; "View SLAs" and "Export ⌄" at the end; an "Evidence tracker ⓘ" card with one stacked bar and its legend; Search evidence; Type and Created by dropdowns; line tabs with counts; table Evidence, Type, Last updat(ed), Owner, Auditor Assessment, and an "Update evidence ↗" button per row.
- Evidence drawer: facts Auditor assessment (badge), Type, Category, Time sensitivity, Recurrence, Owner; tabs Details, Related controls, Audit activity, Comments; Audit activity is a timeline of cards ("<actor> changed the evidence status to <badge>", date and time).

## How you get here / where it leads

- → Tests → a test → History tab.
- → Audits (left nav) → open the audit → select an evidence item → its drawer → Details tab → "View History".
- → Audit activity tab in the same drawer.
- → "Update evidence ↗" from the audit's evidence list back to the item (inferred from the label and icon).
- → A test reaches an audit's evidence list only if it is mapped to at least one control mapped to the audited framework, and is applicable.

## Actions

- Choose resources or a framework for the history; choose a date range.
- Filters: With due date / Without due date; Remediation status; Within SLA; SLA Missed.
- View History (audit drawer).
- In the audit: View SLAs, Export, search evidence, filter by Type and Created by, tabs by assessment state, Update evidence.

## States and numbers

- SLA tests: track how long each failing entity (user, device, resource) stays non-compliant, not just pass/fail.
- Non-SLA tests: timeline bar, green = passing, red = failing, grey = not run or not applicable.
- In the audit, View History: a table of entities not remediated by the SLA deadline for SLA tests; a line graph for non-SLA tests; it stores history throughout the audit period.
- Screenshot rows: six CVE package findings, each Within SLA, detected Apr 23, 2025 5:05 PM, due Jun 18, 2025 5:05 PM, remediated May 04, 2025 1:09 AM, time to remediate 11 days.
- With due date (725) across all resources; With due date (0) for ISO 27001:2022 alone.
- Evidence tracker: Not ready for audit 311, Flagged by auditor 0, Ready for audit 178, Accepted 0, Not applicable 33; tab All (522) = their sum.
- Auditor Assessment badges: Ready for audit (blue, dashed ring), Not applicable (grey), Not ready for audit (red diamond).
- Drawer facts: Ready for audit; Document; Custom; Upload anytime; Renew monthly; owner August Bosson.
- Audit activity: "Vanta Automation created this evidence with status Not ready for audit" then "changed the evidence status to Ready for audit", both May 2nd 2025, 4:13 PM.
- Audit window rule: Audit Activity tracks from the day the audit is created; View History shows the whole audit window, days before creation included.
- Applicability: a test that relies on an integration not connected, or on scoped-out assets, is not applicable and leaves the tests page and the audit's evidence view; deleting an integration removes its tests.

## Vocabulary

- History tab, Remediation history, SLA category tests, non-SLA tests.
- Detected on, Due on, Remediated on, Time to remediate, Within SLA, SLA Missed, With due date.
- Audit, audit window, External, Upcoming.
- Evidence tracker, Auditor Assessment: Not ready for audit, Flagged by auditor, Ready for audit, Accepted, Not applicable.
- View History, Audit activity, Related controls, Time sensitivity, Recurrence.
- Applicable / not applicable, framework scoping.

## Screenshots

- `automated-test-history-01.png`: a test's History tab with the framework banner, Remediation history over All resources and a table of CVEs remediated within SLA in 11 days.
- `automated-test-history-02.png`: the Remediation history select open: All resources, ISO 27001:2022 chosen, other frameworks Not available.
- `automated-test-history-03.png`: ISO 27001:2022 chosen, With due date (0) and Remediation status filters, and the No results found empty state.
- `automated-test-history-04.png`: the auditor's audit Evidence page: tracker bar (311 / 0 / 178 / 0 / 33), state tabs and an evidence table with Update evidence buttons.
- `automated-test-history-05.png`: an evidence drawer's facts and its Audit activity timeline of two status changes.

## For Program Assurance

- A control's or a POA&M item's history read per system or baseline (the framework select with "Not available" for those that do not apply) answers "since when has this been failing here".
- Detected on, due on, remediated on and time to remediate, with Within or Missed under the name, is a compact remediation register for POA&M milestones.
- The assessor's workspace counts evidence by assessment state in one stacked bar whose legend equals the tab counts; PA's assessment campaign could open the same way (not ready, flagged, ready, accepted, not applicable).
