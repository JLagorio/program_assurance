# Adding and managing vendors

Source: https://help.vanta.com/en/articles/11345559-adding-and-managing-vendors
Fetched: 2026-11-17

## Purpose

- The Vendors page (part of Third Party Risk Management): one inventory of every vendor in audit scope, feeding vendor assessments and continuous risk monitoring.
- Each vendor has a profile with tabs for assessments, findings, evidence and details.

## Layout

- Page header: title "Vendors"; at the end "⋯", split button Edit intake form, split primary Add vendor (arrow: Import vendor).
- Tabs (line): Vendors, Discovery.
- Status chips with counts, one selected: Procurement 63, Active 160, Archived 53, All 276.
- Toolbar: Search vendors; applied filters shown in colour with a count: Vendor status 1, Assessment status 2, Inherent risk score 2; + Add filter; Reset; table settings.
- Table settings popover: Density (Dense, Regular, Comfortable); Columns with drag handles and toggles (Vendor (locked), Vendor status, Monitoring, Inherent risk score, Residual risk score, Category, Assessment status, Data agreements (off), Security owner, Business owner).
- Table columns: Vendor (logo + name, sorted ascending; a shield or "V" badge beside some names), Vendor status (Active), Monitoring (On / Off), Inherent risk score (Critical, High), Residual risk score (Medium, High, Low, Unscored; info icon), Category, Assessment status (Due soon, Complete), Security owner, Business owner (avatar or empty person), row "⋯".
- Footer: "1 to 10 of 13 results", Show per page 10, previous / next.
- Vendor profile:
  - Breadcrumb "Vendors"; logo + name ("Atlassian"); subtitle "Collaboration vendor".
  - Header end: "⋯" and primary Make decision.
  - Fact row: state dropdown "Active", "High vendor inherent risk score", "Medium vendor residual risk score".
  - Tabs: Overview, Assessments, Findings, Evidence, Linked apps, About (others by plan: Monitoring, Subprocessors, Intake).
  - About tab: card "General" (Vendor name, State, Website, Category, Security owner, Business owner, Segment scope "All segments", Auth method "Not specified", Vendor headquarters); cards "Services provided" and "Additional notes", each "Not set".
- Merge with another vendor dialog: "Which vendor is this being merged with?": This vendor (Asana RW) → To merge into (Asana dropdown); checkboxes Migrate all assessments (with note), Migrate all documents (locked on), Migrate all vendor findings; notice "Assessment in progress on Asana — Complete or delete the assessment to continue…" with View assessments and Refresh; "What information should be preserved from each vendor?" table FIELD / ASANA RW (THIS VENDOR) / ASANA (TO MERGE INTO) with a radio per field (Name, Website); Cancel, Confirm merge (disabled).

## How you get here / where it leads

- → Vendors in the left nav (seen in the Policies screenshot).
- → Integrations page: connected vendors are added automatically.
- → Add vendor (modal: name, status, website) → open the vendor → About tab.
- → Add vendor ▼ > Import vendor → Import vendors page → CSV template → map columns → review → Import.
- → Discovery tab → add to list / procurement / ignore / reject (Managing Vendor Procurement, article 13688317).
- → row "⋯" → Merge with another vendor / Archive / Unarchive.
- → vendor profile → Assessments (Managing vendor assessments, 11345893); Findings (can map to risk scenarios); Monitoring (12524282).
- → Settings > Features > Vendors > Vendor customization; inherent risk scoring (11345560).

## Actions

- Add vendor; Import vendor (100 per file); Edit intake form.
- Search, filter, Reset, choose density and columns.
- Merge with another vendor; Confirm merge; Archive vendor; Unarchive.
- Make decision (profile primary).
- Edit vendor details in About; add custom fields (Date, Multi-select, Number, Text) and custom categories (up to 100).

## States and numbers

- Vendor status: Active (approved), Procurement (being evaluated), Archived (no longer used; read-only).
- Counts: Procurement 63, Active 160, Archived 53, All 276; "1 to 10 of 13 results" with three filters applied.
- Inherent risk: Critical, High. Residual risk: High, Medium, Low, Unscored.
- Monitoring: On, Off. Assessment status: Due soon (amber), Complete (green).
- Unset fields read "Not set" / "Not specified" / "Unassigned".
- Merge is permanent; Password configuration details, Services provided and Additional notes are discarded.

## Vocabulary

- Vendor, vendor list (formerly Managed vendors), vendor profile, vendor details, Third Party Risk Management (TPRM).
- Procurement, Discovery, intake form, Linked apps, subprocessors.
- Inherent risk score, residual risk score, inherent risk rubric, category, Security owner, Business owner, Point of contact, Segment scope.
- Vendor assessment (security assessment), assessment status, vendor findings, evidence, monitoring.

## Screenshots

- `adding-and-managing-vendors-01.png`: Vendors list on Active (160) with three filters applied.
- `adding-and-managing-vendors-02.png`: Same list with the Density and Columns settings open.
- `adding-and-managing-vendors-03.png`: Merge with another vendor dialog blocked by an assessment in progress.
- `adding-and-managing-vendors-04.png`: Atlassian vendor profile, About tab with General, Services provided, Additional notes.

## For Program Assurance

- Status chips with counts above the table (Procurement 63, Active 160 …) give a register its lifecycle split in one row; fits suppliers and component versions.
- Inherent and residual risk side by side in the list, and again as the profile's fact row, keep the "before and after controls" story visible.
- A merge dialog that blocks on work in progress and says how to clear it (View assessments, Refresh) is a pattern for refusals that name the fix.
