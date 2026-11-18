# Managing risks and risk registers

Source: https://help.vanta.com/en/articles/12005142-managing-risks-and-risk-registers
Fetched: 2026-11-17

## Purpose

- The Risks page: add risk scenarios, organize them into risk registers (folders), group them under enterprise risks, and customize fields, categories and scoring.
- Three objects: Risk register (folder; access boundary), Risk scenario (the unit assessed and tracked), Enterprise risk (parent that groups scenarios across registers).

## Layout

- Risks landing page:
  - Section "Enterprise risks" with a "Preview" badge and one sentence; three action cards: "View and manage the enterprise risks you own", "Create a snapshot of the current status of your enterprise risks", "Generate an enterprise risks assessment report"; one folder row "Enterprise risks · 3 enterprise risks".
  - Section "Risk scenarios" with one sentence; four action cards: "View and manage the risk scenarios you own", "View all risk scenarios you have access to", "Create a snapshot of the current status of your risk scenarios", "Generate a risk scenarios assessment report".
  - Register list: one row per register with folder icon, name and count, row "⋯" (Infrastructure & Security 23, Privacy 20, ITRM 10, TPRM 11, AI Risk Register 6 risk scenarios).
  - Header: "⋯" and Add (dropdown): Add enterprise risk manually, Add enterprise risk via import | Add register, Add risk scenario manually, Add risk scenario via Risk library, Add risk scenario via import.
- Register page:
  - Breadcrumb "Risks"; folder icon + register name (Privacy); description line ("Manage risks for Privacy").
  - Header end: "⋯", share (people icon, manage access), and split primary Add scenario.
  - Toolbar: Search; Status, Owner, Categories, Inherent, Residual, Approver; + Add filter; column settings.
  - Selection bar: "1 selected", Deselect, Assign owner, Move to register, Approve all (disabled), Archive all, (one more, cut off).
  - Table: checkbox, ID (R-79), Risk scenario (two lines, cut), Owner (avatar or Unassigned), Inherent risk (info icon; coloured score pill), Residual risk (score pill), Treatment plan (Mitigate or "—"), Treatment status (Incomplete), Approval status (Needs review, Draft, Approved), row "⋯".
  - Footer: "1 to 5 of 20 results", Show per page (5 / 20), previous / next.
  - Register "⋯" menu: Bulk edit scenarios, Create snapshot, Generate report, Export all risk scenarios (.csv), View snapshots, View archived risk scenarios | Register settings, Delete register (red).
- Manage access dialog: title 'Manage access for Risk Register "AI Risk Register"', link "Learn about managing access"; "Direct access (0)" with "Search for users or teams to grant direct access…", "No users or teams yet"; "General access" with "Manage user permissions" link: "Admins, Editors, and custom roles with edit permissions · Can edit", "View-only admins and custom roles with view permissions · Can view".
- Risk scenario page:
  - Breadcrumb "Risks / IT"; title is the full scenario sentence; "⋯" and Manage access.
  - Header facts: Approval status (Draft), Owner (Unassigned), Register (IT).
  - Tabs: Overview, Impacted assets, Approval history (0), Comments.
  - Main column "Context": Description card (Edit, collapse); Controls card (Suggest, + Add control, collapse) with table Control, Status (Needs evidence), Owner, In treatment plan (No), add-to-plan "+" and remove "x" per row.
  - Side column "Details": Risk ID R-10, Identified August 20, 2026, Last updated August 24, 2026 (locked), Categories (search), Source Custom (locked), "+ 1 more"; then Impacted assets (+, "No mapped impacted assets"), Open issues ("No mapped open issues"), Enterprise risk (+, "No mapped enterprise risks").
- Risk settings: tabs General, Scoring; Preferences card with "Configure auditor view" toggle: "Share all risk scenario registers and their associated action trackers with auditors. Only risk scenario data is shared."

## How you get here / where it leads

- → Risk in the left nav (Overview, Risk register, Risk library, Action tracker, Snapshots, Settings, seen in the Controls GIF).
- → Risks page → a register row → register page → a scenario → scenario page.
- → Risk library → Add to register.
- → Add > Import → import page → CSV template → map columns → review → Import.
- → register "⋯" → View snapshots / View archived risk scenarios → Restore / Delete.
- → Completing Risk Assessments (article 15089313); Risk scoring (15089318); Risk snapshots and reports (11345504); User permissions (11345590).
- → Settings > Features > Risk: Preferences, Custom fields, Custom categories, Scoring.
- → scenario's Controls card → a control (inferred).

## Actions

- Add register; Add scenario / Add risk scenario manually / via Risk library / via import; Add enterprise risk manually / via import.
- Manage access (Viewer / Manager); Register settings; Delete register.
- Assign owner (single from the Owner field, or bulk); add manager from row "⋯".
- Move to register; Approve all; Archive / Archive all; Restore; Delete / Delete all (only after archive).
- Bulk edit scenarios; Create snapshot; Generate report; Export all risk scenarios (.csv).
- Scenario: Edit description; Suggest controls; Add control; add a control to the treatment plan; remove control.
- Settings: Always / Ask me every time / Never add recommended controls; add custom field (Currency, Date, Number, Multi-select, Text, User); add category; Configure auditor view.

## States and numbers

- Inherent / residual score pills: 15 red, 12 orange, 10 orange, 6 and 5 orange, 4 and 3 green, "?" grey when not scored.
- Treatment plan: Mitigate; "—" when none. Treatment status: Incomplete.
- Approval status: Draft, Needs review, Approved.
- Control status inside a risk: Needs evidence.
- Paging: "1 to 5 of 20 results", "1 to 6 of 6 results".
- Empty sentences: "No mapped impacted assets", "No mapped open issues", "No mapped enterprise risks", "No users or teams yet".
- Deleting a register deletes all its scenarios; deleting a scenario deletes its details, assessment history and tasks.
- Archived risks drop out of future snapshots and reports but stay in the register.
- Auditor view off: auditors see shared snapshots only; on: also view-only registers, action trackers and archived risks.

## Vocabulary

- Risk register, risk scenario, enterprise risk, risk library, Risk ID.
- Inherent risk, residual risk, treatment plan, treatment status, approval status, Approver.
- Risk Scenario Owner, Risk Scenario Manager, Risk Register Manager; Viewer, Manager; Direct access, General access.
- Snapshot, assessment report, action tracker, archived, impacted assets, open issues, categories, recommended controls.

## Screenshots

- `managing-risks-and-risk-registers-01.png`: Privacy register with filters highlighted and scored scenarios.
- `managing-risks-and-risk-registers-02.png`: Risks landing page: Enterprise risks and Risk scenarios sections, register folders, Add menu open.
- `managing-risks-and-risk-registers-03.png`: Register with one row selected (selection bar) and the register "⋯" menu open.
- `managing-risks-and-risk-registers-04.png`: Manage access dialog for the AI Risk Register.
- `managing-risks-and-risk-registers-05.png`: AI Risk Register with six unscored, unassigned scenarios; Add scenario highlighted.
- `managing-risks-and-risk-registers-06.png`: Risk scenario page: Overview tab with Description, Controls table and the Details side column.
- `managing-risks-and-risk-registers-07.png`: Enterprise risks section alone.
- `managing-risks-and-risk-registers-08.png`: Risk settings General tab, Configure auditor view toggle.

## For Program Assurance

- A risk record whose Overview lists the controls that treat it, each with its status and "In treatment plan", ties a risk to the control ladder in one table; fits risk → POA&M.
- Inherent and residual scores as coloured number pills, "?" when not assessed, keep the register numeric.
- An account-wide "auditor view" toggle (live registers vs shared snapshots only) maps to what an SCA or AO may see of the risk register.
