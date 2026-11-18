# Adaptive Framework Scoping

Source: https://help.vanta.com/en/articles/11345359-adaptive-framework-scoping
Fetched: 2026-11-17

**Purpose**: an admin decides, per framework, which integrations, assets and people count toward it; audits and tests then follow that scope. May need an upgrade or add-on.

## The steps

1. Frameworks page → choose a framework → its **Scope** tab (framework record tabs: Overview, Requirements/Controls, Tests, Scope).
2. Scope tab, **Systems** toggle: switch an integration off to drop the whole system and its assets from the framework.
3. Scope tab, **Configure scope** on an integration card: a full page per integration where single accounts/assets are deselected; **Save changes**. Not every integration offers Configure scope.
4. Same page: tick **Exclude new assets from scope** so assets discovered later start out of scope.
5. Inventory pages: check the **Framework scope** column to see which frameworks each asset counts toward.
6. Scope tab, **People** toggle: choose employee groups or individuals in or out; **Update scope**. Groups come from the Personnel page.
7. Scope tab → People → **Change settings** (Scope Settings page): Devices and Access Accounts each **Automatically scope with owner** or **Set manually**. Vanta Device Monitor computers are not auto-scoped; use **Deactivate monitoring for a Resource on a Test** instead.
8. Audits: **Add a new audit** → pick the framework; the audit filters assets by the scope with no further action.
9. Tests page: each test's **Program mapping** says how many frameworks it serves; a hover card lists resources in scope per framework (test segments).
10. Test detail page: filter results by **Frameworks**; test history is segmented by framework so an auditor sees only that segment.

## Layout

adaptive-framework-scoping-01 (framework record, Scope tab):
- Header: breadcrumb "Frameworks", title "ESG Demo", badge "Custom".
- Tabs: Overview, Requirements, Scope (Scope outlined).
- Segmented choice: Systems (selected), People.
- Section "Configurable integrations", line "Modify which integrations and assets you want to include in your framework."
- Card grid, 2 columns here: logo, name, green "In scope" badge, capability chips (Computers, Inventory / Access, Inventory, Vulnerabilities / Access, Inventory, Task creation +2), footer with "Configure scope" button and an on/off switch.

adaptive-framework-scoping-02 (same, wider, 3 columns): 9 cards visible (Addigy, AWS, Azure, Azure DevOps, Bitbucket, Box, Calendly, Checkr, Cloudflare); arrow points at Addigy's switch, box around its Configure scope.

adaptive-framework-scoping-03 (integration scope page, before):
- Header: breadcrumb "Frameworks / ESG Demo", title "Addigy" + "In scope" badge, subtitle "Configure whether your account is in scope for ESG Demo"; actions Cancel, Save changes (disabled).
- Card: "Addigy" with "In scope" switch on.
- Assets section: "Exclude new assets from scope" checkbox (info icon), "Search by asset name", collapsible group "Addigy Managed Computers — 1 of 1 in scope".

adaptive-framework-scoping-04 (same page, after): badge now "Custom", switch reads "Out of scope", Exclude new assets ticked, group "0 of 1 in scope", Save changes enabled (highlighted).

adaptive-framework-scoping-05 (Inventory page "Autoscale groups"):
- Header: title, line "Seeing some accounts that should not be here? Learn more about scoping out resources.", button "Edit bulk tag".
- Left list "STANDARD" of resource types with counts: Autoscale groups (3), Azure Subscriptions (3), Cluster deployments (0), Compute instances (20), Computers (MDM) (7), Computers (Vanta ag...) (2), Container clusters (1), Container repositories (1), Data warehouses (4), Encryption Keys (8), GCP Organization Pr... (2), Git repositories (23), Kubernetes clusters (3), Load balancers (8), NoSQL databases (2).
- Toolbar: Search, All owners, Frameworks; Export at the end.
- Dismissible info banner about reading cloud tags, with "Edit bulk tag".
- Table columns: checkbox, SERVICE / IDENTIFIER / DETAILS, REGION / ACCOUNT, DESCRIPTION, OWNER, FRAMEWORK SCOPE (highlighted; chips CAIQ, ADG Test Frame, Australian Essential 8, +18), open-in-new icon.
- Footer: "1-3 of 3 results", "Show 20 results per page", Previous / Next.

adaptive-framework-scoping-06: the same image as -02 (reused under the People section).

adaptive-framework-scoping-07 (framework record, Scope → People):
- Header: "Frameworks", "Australian Privacy Principles", "Custom" badge; tabs Overview, Controls, Tests, Scope.
- Systems / People toggle (People selected); "Submit feedback" at the right.
- Section "People", line "The following personnel groups can be modified for your framework scope. Missing a group? Import or create a new group in Personnel"; button "Update scope".
- Banner: "Devices and user access accounts will not be automatically included or excluded from scope." with "Preview" badge and "Change settings" (highlighted).
- Toolbar: Search, Source filter, column settings icon.

adaptive-framework-scoping-08 (Scope Settings page):
- Back link "Back to Personnel scope"; title "Scope Settings"; line "Set whether devices and access accounts should follow their owner's scoping or be managed manually for this framework."
- Devices: radio "Automatically scope with owner" (overrides manual scoping) / "Set manually" (selected).
- Access Accounts: the same two radios, "Set manually" selected; "Existing configurations won't change".

adaptive-framework-scoping-09 (modal "Add a new audit"):
- Title + close; section "Define audit scope": "Your audit's framework, visibility and auditor cannot be edited once the audit is created. Make sure to discuss with your auditor first."
- Fields: Framework (select, highlighted), Audit type radio External (selected) / Internal, Audit firm (optional) select, link line "Don't see your auditor? Invite them to Vanta", Auditor select (disabled until a firm).
- Footer: "Step 1 of 3", Back, Next (disabled).
- Behind it: an evidence status list (Not ready, Flagged, Ready for…, Accepted, Not appl…).

adaptive-framework-scoping-10 (Tests page with Program mapping hover card):
- Two summary cards: "Tests passing 15" — 44%, "15 of 34 passing", bar; sub-cards Automated tests 44% 15/34 passing, Documents 0/0 passing. "Tests that need attention 19" with rows 2, "…diation (no SLA assigned)" 12, 5.
- Toolbar: Search, Category, Framework, Type, Status, Rollout, Clear, settings icon.
- Table: checkbox, Name (automated tests marked with a bolt), Type, Program mapping ("14 frameworks", "15 frameworks", underlined, segment icon), Status (Overdue red, Due soon amber, warning icon), row menu.
- Hover card "Program mapping — Inventory items have active owners": note "This test evaluates different resources based on the framework"; two columns Framework / Resources in scope: Australian Essential 8 129, CIS v8.1 129, FedRAMP Moderate Rev. 4 129, GCP 129, GDPR 100, HITRUST e1 129, ISO 27001:2022 99, ISO 27017 129, NIST 800-171 129, NIST CSF 2.0 100, Open Finance DSS 129, PCI DSS 4.0.1 SAQ-D SP 128, UK Cyber Essentials 129, US Data Privacy 129.

adaptive-framework-scoping-11 (test detail "Inventory items have active owners"):
- Header: breadcrumb "Tests", title, one-line description; meta row: "Needs reassignment", "Azure, Azure DevOps +15", "Last refreshed 8 hours ago", "Task automation enabled"; actions "About this test", people icon, overflow.
- Tabs: Results, Source data, History, Tasks (13), Controls (44), Audits, Notes.
- Body: "Test results" + Frameworks filter dropdown (search, All frameworks, Internal only, ADG Test Frame, Australian Essential 8, AWS FTR, CAIQ, CIS v8.1, COSO, DORA…); actions "Create task" (menu) and primary "How to remediate".
- Results list: a red alert "8 items r…", Select all, rows (device name, owner, Jira link), red due date (Jan 7, 2025 … 1 day ago), scope chip "All frameworks", row menu; footer "1 to 8 of 8 results", Show per page 20, pager.
- Right rail: Status "Overdue"; Frameworks chips (14 frameworks).

## Flow edges

- Frameworks → framework record (Overview / Requirements or Controls / Tests / Scope)
- Scope (Systems) → integration Configure scope page → Save changes → Scope
- Scope (People) → Scope Settings (Change settings) → Back to Personnel scope
- Scope (People) → Personnel (to create a missing group)
- Inventory → asset (open-in-new icon)
- Audits → Add a new audit modal (3 steps)
- Tests → Program mapping hover card → test detail → Results filtered by framework

## Actions

Configure scope · toggle integration in/out of scope · Exclude new assets from scope · Save changes · Cancel · Update scope · Change settings · Automatically scope with owner · Set manually · Deactivate monitoring for a Resource on a Test · Edit bulk tag · Export · Add a new audit · Create task · How to remediate · About this test · Submit feedback

## Vocabulary

Framework Scoping / Adaptive Scoping · Scope (tab) · Systems · People · Configurable integrations · In scope / Out of scope · Custom (badge) · Assets · Inventory · Framework scope (column) · Auto Scoping · Scope Settings · Devices · Access Accounts · Personnel scope · employee groups · test segment · Program mapping · Resources in scope · Internal only · Audit type External / Internal · Audit firm · Auditor

## Screenshots

- adaptive-framework-scoping-01.png: framework record's Scope tab, Systems, integration cards with In scope badge, Configure scope and switch.
- adaptive-framework-scoping-02.png: same grid wider, arrow at the switch, box at Configure scope.
- adaptive-framework-scoping-03.png: Addigy scope page, in scope, 1 of 1 assets in scope, Save changes disabled.
- adaptive-framework-scoping-04.png: same page switched Out of scope, new assets excluded, 0 of 1, Save changes enabled.
- adaptive-framework-scoping-05.png: Inventory "Autoscale groups" table with the Framework scope column.
- adaptive-framework-scoping-06.png: duplicate of -02.
- adaptive-framework-scoping-07.png: Scope tab, People, with the auto-scoping banner and Change settings.
- adaptive-framework-scoping-08.png: Scope Settings page, Devices and Access Accounts radios.
- adaptive-framework-scoping-09.png: Add a new audit modal, step 1 of 3, Framework select.
- adaptive-framework-scoping-10.png: Tests page, Program mapping hover card with resources in scope per framework.
- adaptive-framework-scoping-11.png: test detail, Frameworks filter on results, Status and Frameworks rail.

## For Program Assurance

- An RMF authorization boundary is this Scope tab: a per-program list of systems/elements with an in/out switch, a per-asset drill-in with "N of M in scope", and an "exclude new assets" default.
- One evidence source can count differently per baseline: show "Resources in scope" per program/baseline on a control's or test's row, as the Program mapping card does.
- Audit/assessment creation should take its scope from the boundary already set, not ask again (Vanta: "no further action is needed").
