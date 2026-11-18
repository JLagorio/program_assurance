# How will your auditor use Vanta

Source: https://help.vanta.com/en/articles/11345844-how-will-your-auditor-use-vanta
Fetched: 2026-11-17

## Purpose

- Tour of the auditor's view of a customer's Vanta during an audit window: Evidence, Controls, Framework, Risk, Vendors, Assets, Personnel, Integrations.
- The customer sets the audit period and what is shared; the auditor reviews evidence and grants accreditation (SOC 2, ISO 27001).

## Layout

- Audit band (dark, full width, replaces the normal top bar): framework badge, "<Company>, <Framework>" ("Factio, ISO 27001:2022"; "Audit: NoProbllamaDrama, SOC 2 Type I"), a visibility pill (External / Internal), a status pill (Awaiting report, Upcoming), the audit window ("Nov 17 2024 - Nov 30 2024"), and the auditor's name and avatar at the end.
- When a customer previews: a strip above with the Vanta mark, an "Auditor view" pill and "Exit audit view" at the end.
- Audit left nav: Evidence, Controls, Framework | Risk (Risk register, Action tracker, Snapshots, Settings), Vendors (Managed vendors, Security reviews), Assets (Inventory, Vulnerabilities, Alarms, Code changes, Databases, Network config, Subnets, Settings), Personnel | Integrations, Organization settings.
- Evidence page: title "Evidence"; View SLAs and Export (menu) at the end.
  - "Evidence tracker" card: one stacked bar with legend Not ready for audit: 80, Flagged by auditor: 0, Ready for audit: 249, Accepted: 0, Not applicable: 7.
  - Search evidence; Type, Created by.
  - Status tabs with counts: All (336), Not ready for audit (80), Flagged by auditor (0), Ready for audit (249), Accepted (0), Not applicable (7).
  - Table: Evidence, Type (Document), Owner (chip or "—"), Auditor Assessment (status pill), Update evidence (button with open-in-new icon).
- Evidence record (panel): title ("Board of directors CVs"); Description with Guidance and template links; facts Auditor assessment (Ready for audit), Type, Category, Time sensitivity (Upload anytime), Recurrence (Renew annually), Owner; tabs Details, Related controls, Audit activity, Comments; thread with author and time; note "This is an external facing conversation."; composer "Comment or add others with @…".
- Controls page (auditor view): Assignment donut (49% Assigned; Unassigned 63, Assigned 61, Needs reassignment 0) and Completion card (Controls OK 6%, 8 controls); filters Framework, Owner, Domain, Source, Framework code, Status, Trust Center; table ID, Control (title + text), Owner. Control side panel ("Return of assets"): text; ID AST-67, Source Vanta, Domain Asset Management, Owner, Note; tabs Mapped elements, History; Tests card "0 of 3 Accepted" with each test and "Not ready for audit".
- Risk > Snapshots: "Snapshots of the risk register at specific points in time"; Create a snapshot (disabled for the auditor); left list of snapshot dates (Oct 02, 2023); snapshot heading with More, Export, Download files, column toggle; table RISK SCENARIO, INHERENT RISK (1-25) coloured squares (4, 16, 9, 16), TREATMENT (Mitigate / Avoid / Accept, with "Incomplete"), RESIDUAL RISK (2, 12, 9, 8), IDENTIFIED, FILES, EST. COST (2,000,000; 5000), RISK APPETITE.
- Vendors (audit): Export, Intake form, Add vendor (disabled); tab Vendors; Search vendors, Security review status, Inherent risk score, + Add filter, Reset; table Vendor (name + website or "Not available"), State, Inherent risk, Residual risk, Category, Security review (Up to date / Needs review).
- Assets > Alarms: "Monitoring alarms — Review customer monitoring alarms with metrics and configuration information."; Search alarms; collapsible "Cloudwatch Alarms" table (NAMESPACE, NAME, DESCRIPTION, CONFIGURATION LAST UPDATED, ACTIONS ENABLED, METRIC NAME, PERIODINSECONDS, EVALUATION PERIODINSECONDS, THRESHOLD); "1-5 of 55 results", Previous / Next.
- Configure resource scope (dialog): explanation with "Learn about scoping resources"; groups with counts "CloudWatch Log Groups in scope 17 / 18", "AWS CodeCommit Repos in scope 3 / 3", each with Mark all in • Mark all out and a toggle per resource (name over ARN).

## How you get here / where it leads

- → customer adds the auditor and the audit period (Adding and managing auditors, 11345429); preview first (Previewing Vanta as an auditor, 11345983); controlled view or IRL (Managing auditor views, 11565398).
- → Evidence → an evidence record → Comments / Related controls / Audit activity.
- → Evidence → Export: evidence list, policy packet, security awareness training; export from one piece of evidence.
- → Controls / Framework → a control → its tests and documents.
- → Risk → Snapshots (or the full register and action tracker, if the customer enabled auditor view).
- → Integrations → an integration's in-scope and out-of-scope resources (read-only to the auditor).
- → audit end: the auditor issues a report and accreditation (inferred from "generate a report summarizing their findings").

## Actions

- Auditor: review evidence; accept, flag, or mark not required; change control status; comment; add custom audit requests; map / re-map evidence to controls (if permitted); export.
- Auditor cannot: add or delete controls; change scope.
- Customer: Update evidence; Exit audit view; Mark all in / Mark all out on resources.

## States and numbers

- Evidence (auditor assessment): Not ready for audit, Flagged by auditor, Ready for audit, Accepted, Not applicable.
- Counts: All 336 = 80 + 0 + 249 + 0 + 7.
- Audit status: Awaiting report, Upcoming. Visibility: External, Internal.
- Tests on a control: "0 of 3 Accepted".
- Risk snapshot: inherent risk on 1-25; treatment Incomplete.
- Vendor security review: Up to date, Needs review.
- Scope counts: 17 / 18, 3 / 3.

## Vocabulary

- Audit, auditor, audit period / window, auditor view (full or controlled), IRL (information request list), default request list.
- Evidence, Evidence tracker, Auditor assessment, Ready for audit, Flagged by auditor, Accepted, Not applicable, custom audit requests.
- Snapshot, action tracker, security review, managed vendors, monitoring alarms, resource scope, accreditation, attestation.

## Screenshots

- `how-will-your-auditor-use-vanta-01.png`: Auditor's Evidence page with the audit band and Evidence tracker bar.
- `how-will-your-auditor-use-vanta-02.png`: One evidence record with Auditor assessment and a comment thread.
- `how-will-your-auditor-use-vanta-03.png`: Controls in auditor view with a control's panel: tests "0 of 3 Accepted".
- `how-will-your-auditor-use-vanta-04.png`: Risk snapshot (Oct 2, 2023) with inherent / residual scores.
- `how-will-your-auditor-use-vanta-05.png`: Vendors list inside an external SOC 2 audit.
- `how-will-your-auditor-use-vanta-06.png`: Assets > Alarms, Cloudwatch alarms table, internal ISO 27001 audit.
- `how-will-your-auditor-use-vanta-07.png`: Configure resource scope dialog with per-resource toggles.

## For Program Assurance

- A persistent audit band (framework, status, window, who is assessing) frames every page while an assessment is open; fits an SCA's view of one assessment campaign.
- The assessor's evidence statuses (Not ready, Flagged, Ready, Accepted, Not applicable) as one stacked bar and as count tabs give the readiness picture in one row.
- Risk shared as dated snapshots rather than the live register is a clean answer to "what did the AO see at decision time".
