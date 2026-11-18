# Controls page

Source: https://help.vanta.com/en/articles/11345373-controls-page
Fetched: 2026-11-17

## Purpose

- Every control in the account, mapped to a framework or not; filter, edit, assign, and manage mappings to frameworks, tests, documents, policies and risk scenarios.
- A single control opens in a side panel over the list (URL `app.vanta.com/controls?controlId=…`), shown in the article's GIF.

## Layout

- Page header: title "Controls"; at the end More (or "⋯") and the primary Add control (dropdown).
- Tabs (line): Common controls, Controls.
- Scope selectors (newer): All business units, All frameworks (joined dropdowns).
- Summary cards, side by side:
  - "Assignment": donut with "6% Assigned" in the centre; legend Unassigned 9,861, Assigned 637, Needs reassignment 4.
  - "Controls" (older name "Completion"): "1% Of controls have passing evidence" (older: "Controls OK 4%"), progress bar, "86 controls … 9861 total", "Updated <1m ago" with refresh; two mini-bars: Automated tests 139/288 48%, Documents 878/3799 23% (older: Test 72/181 40%, Document 3/360 1%, each with an open-in-new icon).
- Toolbar: Search controls; Owner, Domain, Source, Framework code, Status; + Add filter (older: Framework, Trust Center, Risk management as fixed filters); "⋯"; Add control; column settings.
- Selection bar (rows checked): "5 selected", Deselect, Assign owner, Deactivate, replacing the filters.
- Table columns: checkbox, ID (info icon), Control (bold name; first line of the requirement text under it, cut with "…"), Owner (avatar + name, "Unassigned" with a dashed person icon, or an amber warning), Status, Frameworks (chips "Framework · requirement", e.g. "SOC 2 · CC 6.1", "+1"), Business unit; other variant shows Source (Vanta logo or wrench "Custom") and Tests ("2/17", "0/18" with a progress ring); row "⋯".
- Row "⋯" menu: View, Manage framework mappings, Remove (red).
- Control side panel (from the GIF): "⋯" and Close at the top; title; requirement text with Show more; facts ID, Source, Domain, Owner, Note ("Add a note…"); tabs Mapped elements, History.
  - Tests section with "+": AI banner "Vanta AI suggests 15 tests for this control" with Add all / Ignore all; each suggestion a link with a check and an x; Show more; empty "No tests associated with this control".
  - Documents section with a "0 / 1 OK" pill, "+" and edit; AI banner "Vanta AI suggests 20 documents for this control"; linked documents with owner and status ring.
  - Mapped frameworks: empty "No frameworks associated with this control" with Add; after mapping, a chip "HIPAA · 164.308(a)(1)(i)" with remove x.
  - Risk scenarios with "+": empty "No risk scenarios associated with this control".
- Modal "Map control to framework requirements": framework select (HIPAA), "Search by code, name, description"; left list REQUIREMENTS (164.308(a)(1)(i), …(ii)(A), …); right pane with the code, Add, open-in-new, Description.
- Modal "Map risk scenario to control": Search risk scenarios, Owner filter; left list RISK SCENARIO with an "Added" mark; right pane: name, Remove, Owner, Categories (chips), Treatment plan, Tasks, Controls. Toast "Successfully mapped risk scenario to control".
- Deactivate controls dialog: "Are you sure you want to deactivate 5 controls from your security program? Deactivated controls can be restored for future use." then "Mapped framework requirements" chips (GDPR · Article 6, SOC 2 · CC 6.1, SOC 2 · CC 1.3); Cancel, Deactivate (red).
- Custom fields for controls (Settings > Features > Compliance): table Field name, Description, Data type (Date, Picklist), Auditor visibility (Private to your team / Shared with auditor), reorder arrows, "⋯"; Add.

## How you get here / where it leads

- → Controls in the left nav (Compliance > Controls in the screenshots).
- → a control row → control side panel (`?controlId=`).
- → panel → Map control to framework requirements; Map risk scenario to control; a test or document link.
- → Common controls tab (Managing Common Controls, article 16894224).
- → Control Implementation Details (article 17602559).
- → More > View deactivated controls → Add Control with an Effective Date.
- → Settings > Features > Compliance > Custom fields for controls.
- → Policy page > Mapped elements tab > Map control (mapping from the policy side).
- → Trust Center: control status is shared there.
- → filter link `controls?evidenceMapping=without-mapped-evidence` (controls without mapped evidence).

## Actions

- Add control; More / "⋯"; View deactivated controls.
- Search controls; + Add filter.
- Assign owner; Deactivate (bulk); Deselect.
- Row: View, Manage framework mappings, Remove (dialog with Effective date, then Delete).
- Panel: Save Changes; Add a note; Add all / Ignore all suggestions; accept or reject one suggestion; Add (framework mapping); Remove (risk scenario).
- Custom fields: + Add, label, description, Share with auditor, data type (fixed once chosen).

## States and numbers

- Control status: Ok (all automated tests and mapped documents passing), Needs evidence (no mapped tests or documents, or one is not passing).
- Control status is not an auditor's assessment and is not visible to auditors.
- Assignment buckets: Unassigned, Assigned, Needs reassignment.
- Counts seen: 6% assigned of 10,502 (9,861 + 637 + 4); 1% passing evidence, 86 of 9861; tests 139/288; documents 878/3799; another account 43% assigned, 100% passing, 7 of 7.
- Tests per control as "passing/total" with a ring: 2/17, 0/18, 0/1.
- Removing a custom control deletes it permanently.

## Vocabulary

- Control, common control, custom control, control status, owner, domain, source (Vanta / Custom), framework code, business unit.
- Mapped elements, mapped tests, mapped documents, mapped frameworks, framework requirements, risk scenarios.
- Implementation details, Note, History, Deactivate, Effective date, custom fields, Auditor visibility.
- Vanta AI suggests, Add all, Ignore all.

## Screenshots

- `controls-page-01.png`: Controls tab with Assignment donut and passing-evidence card over the table (ID, Control, Owner, Status, Frameworks, Business unit).
- `controls-page-02.gif`: Opening control 4.1.1 in the side panel, accepting AI-suggested tests and documents, mapping HIPAA 164.308(a)(1)(i) and a risk scenario (14 s, 420 frames).
- `controls-page-03.png`: Custom fields for controls with data type and auditor visibility per field.
- `controls-page-04.png`: Row "⋯" menu on AC-2: View, Manage framework mappings, Remove.
- `controls-page-05.png`: Five controls selected; selection bar with Assign owner and Deactivate.
- `controls-page-06.png`: Deactivate controls confirmation naming the mapped framework requirements.

## For Program Assurance

- Two counted cards above the register (owners assigned; controls with passing evidence, split by test and document) say where the program stands before the list.
- The control opens beside the list with its mapped elements as sections, each with its own add and empty sentence; an RMF control record can lead the same way (requirements, evidence, findings, risks).
- A confirmation that names what the change touches ("Mapped framework requirements" chips) before a bulk change fits removing controls from a baseline.
