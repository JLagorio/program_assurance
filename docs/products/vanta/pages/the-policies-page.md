# The Policies page

Source: https://help.vanta.com/en/articles/11345377-the-policies-page
Fetched: 2026-11-17

## Purpose

- Register of the company's security policies, with the tests that enforce their approval and acceptance.
- New accounts start from Vanta's policy templates; existing accounts see every policy in use.

## Layout

- Page header: title "Policies"; at the end Add custom policy, Edit SLAs, More (dropdown). In the newer screenshots: an overflow "⋯", "Vanta Agent", and the primary Add policy (dropdown).
- Alert band (newer screenshots): warning "Some policies require approval from someone who no longer has the permission to approve. Please cancel the approval requests, and assign another approver." with a View button.
- Filter row: Search by name; Framework, Overall status, Latest status, Type (and Approver in the newer screenshots); checkbox "Require my approval"; Sort by "Recommended order" with a sort-direction button; column-settings icon.
- Table columns (older): Name, Frameworks (chips, "+N"), Overall policy status (info icon), Latest policy version status (info icon), Renew by, Personnel acceptance (info icon), row "⋯".
- Table columns (newer): Name, Overall policy status, Latest policy version status, Renew by, Approval status, Personnel acceptance, Frameworks, row "⋯".
- Row "⋯" menu: View details; Reset policy content; Delete policy (red).
- SLA settings (full-screen editor): Close "x" and title "SLA settings" at the top, Save changes at the end (disabled until a change). Left list "SLA CATEGORIES - ACTIVE", each category with its days. Right: "SLA RESPONSE" with the category title, a one-paragraph description, an "SLA deadline" card (number field + unit dropdown "days", "Vanta's recommendation: 1 - 7 days", note "Changes will be applied to new items, not historical or currently open items", View history), and a "Tests referencing this SLA" card with Search and a list of linked tests, each with its frameworks under it.

## How you get here / where it leads

- → Compliance > Policies in the left nav.
- → Add custom policy / Create new policy (separate article 11345492).
- → Add policy > Add from policy library (re-add a template).
- → Edit SLAs → SLA settings → each test referencing the SLA (links).
- → More > Bulk update policies (separate article 11345495).
- → Row "⋯" > View details (the policy's page, inferred).
- → Row chevron ">" on a Not started policy (opens the policy to start it, inferred).

## Actions

- Add custom policy; Add policy > Add from policy library / Create new policy.
- Edit SLAs; Save changes; View history.
- More: Bulk update policies, Download all templates (article: Download Vanta's policy templates), Download policy packet, Download policy acceptance history, Download editable policies from before July 2021.
- Row: View details, Reset policy content, Delete policy.
- Vanta Agent (newer header).
- Alert: View.

## States and numbers

- Latest policy version status: Not Started, Draft, Pending approval, Approved, Renew soon (approved, expires within 6 weeks), Expired.
- Overall policy status: OK (an approved, unexpired version exists), Needs remediation.
- Personnel acceptance as a fraction with a dashed ring: 0/23, 0/25, 0/20, 0/3, 0/101, 0/115.
- Approval status as a fraction: 0/1.
- Renew by: Oct 18, 2025; Feb 21, 2026; Aug 25, 2026; "—" when no approved version.
- SLA categories and days: Account access revocation 7, Account setup 7, Infrastructure monitoring: Low 20, Onboarding 7, Security tickets: P0 14, P1 14, P2 14, P3+ 14, Vulnerabilities: Critical 3.
- Deleting: a library policy can be re-added without customizations; custom policies and drafts cannot be restored.

## Vocabulary

- Policy, policy template, policy library, custom policy, policy version.
- Overall policy status, Latest policy version status, Renew by, Personnel acceptance, Approval status, Approver.
- SLA, SLA category, SLA deadline, SLA response.
- Policy packet, policy acceptance history, Bulk update.

## Screenshots

- `the-policies-page-01.png`: Policies register (older header: Add custom policy, Edit SLAs, More) with four rows.
- `the-policies-page-02.png`: SLA settings editor, Account access revocation at 7 days with the tests referencing it.
- `the-policies-page-03.png`: More menu open: Bulk update policies and three downloads.
- `the-policies-page-04.png`: Newer Policies register with the approver alert; a row's "⋯" menu showing Delete policy.
- `the-policies-page-05.png`: Add policy menu: Add from policy library, Create new policy.

## For Program Assurance

- Two statuses side by side (overall standing vs the latest version's workflow state) map to an RMF artifact's standing vs its draft/published revision.
- Acceptance and approval as "0/25" fractions in the row, not prose, fit control and objective counts.
- A deadline editor that lists every test using the deadline makes the blast radius of a change visible before saving.
