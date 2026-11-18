# Getting started with policies

Source: https://help.vanta.com/en/articles/11345363-getting-started-with-policies
Fetched: 2026-11-17

**Purpose**: set up the Policies page so each policy is drafted or imported, approved, mapped to controls and accepted by the right employees; each policy feeds 2 tests (approved, accepted).

## The steps

1. Policies page: a default list of policies appears, drawn from Vanta's policy library for the enabled frameworks.
2. Per policy, either **use a Vanta template** (Policies → **Add policy** → **Add from policy library**; guided **policy builder** for eligible frameworks, plain **policy editor** otherwise) or **Import an existing policy** (open the policy → upload PDF/DOCX or sync from Confluence, Google Drive, SharePoint). Importing into the matching policy keeps Vanta's structure, mappings and tests.
3. Bulk import of custom policies: Policies → **Add policy** → **Import policies** → upload files; Vanta AI extracts details and suggests control mappings to review. Or ask the Vanta Agent.
4. Imported policies may carry historical approvers and approval dates (AI can extract them).
5. Approve: **Submit** → choose approver (Admin or Editor; recommended: the person who enforces it) → approver gets email → approves in Vanta. Status moves **Pending Approval** → **Approved**; the policy test goes "OK"; the document shows in Monitors and Documents. Plans may allow up to 5 approval steps × 3 approvers.
6. Employee acceptance: set up Personnel, assign tasks incl. accepting policies; watch acceptance per policy on the Policies page. Acceptance turns the acceptance test **OK**. Some controls need both tests (e.g. SOC 2 "Continuity and Disaster Recovery plans established").
7. Reminders: enable employee notifications in settings (cadence, e.g. weekly); or **Remind** one person from People; or send employees to the onboarding page.
8. Groups: onboarding group settings decide which employees accept which policy.
9. Annual renewal: email notice; status **OK** → **Renew soon** (within 6 weeks) → **Expired** if missed. A new version asks whether to send it for re-acceptance ("Yes, ask employees to reaccept this policy").

## Layout

getting-started-with-policies-01 (Policies page):
- Left nav: "Help... ⌘+K"; Home; Tests; Reports; Compliance (expanded): Frameworks, Controls, Policies (current), Documents, Audits, Settings.
- Header: title "Policies"; actions "+ Add custom policy", "Edit SLAs", "More" menu.
- Toolbar: Search by name; filters Framework, Overall status, Latest status, Type; checkbox "Require my approval"; "Sort by: Recommended order"; sort direction; column settings.
- Table columns: Name, Frameworks (chips, e.g. DORA, HITRUST, +8), Overall policy status (info), Latest policy version status (info), Renew by, Personnel acceptance (info, highlighted), row menu.
- Rows: Human Resource Security Policy 1 — OK — Pending approval — Oct 18, 2025 — 0/23; New Policy Name Test — OK — Draft — Oct 9, 2025 — 0/25; Risk Management Policy — OK — Approved — Sep 3, 2025 — 0/20; Data Management Policy — Needs remediation — Draft — "—" — "—".

## Flow edges

- Policies → Add policy → Add from policy library → policy builder / policy editor
- Policies → policy → Import an existing policy → upload / integration sync
- Policies → Add policy → Import policies → AI-suggested control mapping review
- policy → Submit → approver email → Approved → Tests (policy test OK) + Documents
- Personnel → tasks → onboarding page (employee) → acceptance → Policies (Personnel acceptance)
- People → person → Remind

## Actions

Add policy · Add from policy library · Add custom policy · Import an existing policy · Import policies · Submit · approve · Remind · Edit SLAs · Yes, ask employees to reaccept this policy · renew

## Vocabulary

Policies · policy library · policy builder · policy editor · custom policy · approver · Pending Approval · Approved · Draft · OK · Needs remediation · Renew soon · Expired · Renew by · Overall policy status · Latest policy version status · Personnel acceptance · employee acceptance · onboarding page · onboarding group · effective date · onboarding SLA · Monitors · Documents

## Screenshots

- getting-started-with-policies-01.png: Policies register with status columns, Renew by and Personnel acceptance "0/23".

## For Program Assurance

- A policy carries two separate signals in two columns: the record's overall status and the latest version's state (Draft / Pending approval / Approved), plus a "Renew by" date and an "N/M accepted" count.
- The approval is a submit-to-named-approver step whose result flips the dependent check to OK, so the control's standing moves without a manual update.
- "Renew soon" six weeks out and "Expired" after the date is a due-date treatment an RMF tool can reuse for SSP, POA&M and ATO reviews (inferred).
