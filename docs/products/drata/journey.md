# Drata: the end-to-end journey

Read 2026-11-22 from the downloaded help center, for Program Assurance. Sources in `help-center/articles/`: the Rollout Toolkit (sections 1, 2, 5, 6), the Quick Start guide, the migration and pre-audit checklists, and the audit articles (creating an audit, auditors, packages, the Audit Portal, date ranges and sampling). The screens are in `help-center/notes/getting-started-settings-workflow-audit.md`.

## Timeline

From the toolkit's roadmap (Section 6). The audit itself is not dated there. It follows the pre-audit check, after Phase 4 (inferred).

- **Weeks 0–1, Phase 0: align.** Map stakeholders, confirm an executive sponsor and the GRC admin, name and brief an owner per integration, record baseline metrics.
- **Weeks 1–2, Phase 1: kick off.** Agree frameworks, key dates, in-scope systems, the integration order and response SLAs. Decide when Sales and employees will be briefed.
- **Weeks 3–8, Phase 2: connect and assign.** Connect IdP → HRIS and background checks → cloud → ticketing → MDM → VCS/CI/CD → custom connections. Map frameworks, controls and owners, route notifications, and pilot inside GRC.
- **Weeks 9–12, Phase 3: enable.** Train each team, validate personnel flows, then invite employees. Brief Sales once the Trust Center is nearly live, and track completion by department.
- **Weeks 13+, Phase 4: tune.** Separate noise from real failures, record exceptions, score against the baseline, and move to a weekly, then monthly, then quarterly cadence.

## Stages

| # | Stage | Where in the product | Done when |
|---|---|---|---|
| 1 | Sign in | auth.drata.com: email code or SSO, account selector | the Admin is in; GRC confirmed as primary admin |
| 2 | Basic info | Quick Start › Provide basic info → Settings › Organization details (Org info, Key personnel) | every field filled, optional ones included ("1 of 1") |
| 3 | Connect | Quick Start › Make connections → Connections (identity, infrastructure, version control, ticketing) | "4 of 4"; people synced from the IdP; tests run nightly |
| 4 | Roles and workspaces | Settings › Role administration (Users, Guests, IdP Group Mappings); Settings › Workspaces | owners hold roles (the IdP must come first); extra workspaces only where scope or access truly differ |
| 5 | Scope | Quick Start › Establish continuous compliance → Frameworks, Controls | requirements scoped; out-of-scope controls justified; owners and approvers named |
| 6 | Personnel | Quick Start › Ensure your personnel… → HRIS, Personnel, Settings › Personnel compliance (Internal Security, Training, Human Resources) | "5 of 5"; statuses accurate; employees invited to My Drata |
| 7 | Policies | Quick Start › Set up your policies → Policy Center | each policy approved and published; acknowledged by in-scope people |
| 8 | Readiness | Monitoring, Controls, Evidence Library, Tasks, Notification rules | tests near 100% passing; every control Ready, with manual evidence where a policy alone makes it look Ready |
| 9 | Pre-audit check | Monitoring, Controls, Personnel, Policy Center, Vendors | failing tests fixed; personnel green; key vendors reviewed; period agreed with the auditor |
| 10 | Create the audit | Compliance › Audits › Create Audit: type, how conducted, framework, period, pre-audit package, auditors | an Active card; auditors invited |
| 11 | Fieldwork | the audit page (Request Summary, requests), each request (status, Evidence, Controls, Messages), Package downloads | every request Prepared by the team, then Completed by the auditor; the donut reads 100% |
| 12 | Close and repeat | Complete audit; Annual Compliance Review | the card reads Completed; the yearly cycle starts (reminder at 9 months) |

Quick Start carries stages 2 to 7, each section linking out to the page that does the work. Stages 8 and 9 have no single page. A customer moving from another tool adds an import step between stages 4 and 5.

## Hand-offs between roles

- **Champion (GRC) → executive sponsor:** the business case. Sponsorship is secured before any technical work.
- **Champion → integration owners (IT, Engineering, HR):** the briefs go out before kickoff. Each owner is asked for one short session to connect one system.
- **Admin → control, policy and evidence owners:** roles assigned and personal notifications switched on. First actions: Controls filtered to "Owner = you", then Monitoring, then Tasks.
- **Admin and HR → all employees:** only after the IdP, HRIS and MDM are stable and the personnel flows have been tested. The invitation email opens My Drata.
- **GRC → Sales:** when the Trust Center is close to publishing.
- **Admin → auditor:** a profile on the Auditors tab grants nothing; assigning the auditor to an audit sends the magic link. Read-only access and downloads are separate grants, and the audit's dates and samples decide what evidence shows.
- **Team ↔ auditor:** the team moves a request New → Prepared, which releases its evidence; the auditor moves it to Completed or Changes Requested. Each request has its own message thread, and both sides download packages built from the same data.
- **Optional parties:** a guest administrator (a consultant or MSSP); Drata Support, through time-limited Account access; Fieldguide, which holds the requests while the evidence stays in Drata.

## Shapes repeated across the journey

- Checklists that only point elsewhere: Quick Start, the pre-audit checklist, My Drata.
- Full-page wizards with a vertical numbered stepper: Create Audit, Change email domain.
- Progress as "N of M" plus one percentage.
