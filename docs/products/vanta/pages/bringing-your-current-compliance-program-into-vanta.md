# Bringing your current compliance program into Vanta

Source: https://help.vanta.com/en/articles/11345361-bringing-your-current-compliance-program-into-vanta
Fetched: 2026-11-17

Note: on 2026-11-17 this URL redirects to the Vanta Agent guided flows article (see `vanta-agent-guided-flows.md`), whose "Compliance program import" replaces it. This note reads the last archived copy, https://web.archive.org/web/20260518123100/https://help.vanta.com/en/articles/11345361-bringing-your-current-compliance-program-into-vanta (2026-05-18). Its 52 images still download from Vanta's attachment host.

**Purpose**: for a team with an established program, the manual route in: import controls, a custom framework, map tests and documents, custom tests, custom documents, policies, and the risk register. Times are given per step.

## The steps

1. Controls (5–7 h): Compliance → **Controls** → **Add control** → Import custom controls → **Download Excel template** → fill Control Summary (optional), Control ID (e.g. TEST-01), Control Description, Domain (optional, one of 38 listed values: 33 topic domains such as ASSET_MANAGEMENT, IDENTIFICATION_AUTHENTICATION, CONTINUOUS_MONITORING, INCIDENT_RESPONSE, RISK_MANAGEMENT, THIRD-PARTY_MANAGEMENT, VULNERABILITY_PATCH_MANAGEMENT, then ADMINISTRATIVE, PHYSICAL, TECHNICAL, BASIC, DERIVED), and one column per framework with comma-separated criteria (e.g. "CC 1.1,CC 1.2") → upload in "What data do you want to upload?" → **Review & finalize** (fix errors) → **Import** → toast "Successfully uploaded X controls"; filter Source = Custom.
2. Custom framework (3–5 h): Compliance → **Frameworks** → **Add framework** → "Import custom framework" (Framework name, description, short name, parent/child section labels) → **Import sections** → Download Excel template → rows of Section ID, Section Name, Section Description, Parent Section ID, Control IDs (comma-separated), Section Type (P or C) → upload → Review & finalize → Import.
3. Map tests (10–20 h): open a control in the custom framework → Vanta AI suggests tests and documents from the control description → accept with the check mark, or **+** to search and add manually.
4. Custom tests: Tests → **+ Create custom test** (Test name, Description, "How to fix" instructions, integration, logic builder) → **Create**. Then Tests → **Custom** tab → the test → **Controls** tab → **Add control** → choose → **Add**.
5. Custom documents: Documents → **+ Add document** → fill fields → **Create document** → "Add document to control" (search, Framework filter) → **Add**. On the document: **Upload** (file, description, effective date) or **Add link**. Edit via **More** → Edit custom document → **Save**.
6. Policies: Policies → **Start** on a policy → create from scratch (template in the policy editor) or import → edit → **Submit for approval** → choose approver (or approve yourself) → assign to employees in onboarding settings; reaccept prompt if already assigned. **Create new version** later. Upload .docx/.pdf ≤ 50 MB or sync from Confluence, SharePoint, Google Drive. Custom policy: Policies → **+ Custom Policies** → title, description → **Create** → draft/upload/sync → submit → approve the employee assignment. Each custom policy gets 2 tests (approved annually; accepted by employees) under the Policies category. Map to controls: policy → **Controls** tab → **Add control** / **Remove**.
7. Deactivate unused policy tests: Tests → search "Company has an approved <policy name>" → test → ⋯ → **Deactivate**; the template leaves Policies and the test leaves its controls; reverse under All deactivated → reactivate monitoring.
8. Risk register: **+ Add scenario** → manual (Description, Category, Likelihood, Impact, Notes, Is sensitive) → **Create risk scenario**; or **Via Import** with the template (Risk Scenario, Risk ID, Inherent Likelihood/Impact 1–5, Residual Likelihood/Impact 1–5, Note, Risk Treatment, Categories, Owner email, Risk Type (CIA), Additional notes, custom columns, Controls as control IDs) → **Import**; or Risk → **Risk library** → **Add** per scenario.

## Layout

bringing-…-01 / -08 (empty Home): nav Home, Starter guide "23%", Tests, Reports, Compliance (Frameworks, Controls, Policies, Documents, Audits), Trust Center >, Risk >, Vendor, Assets >, Personnel >, Integrations; body "Welcome to Vanta!", "Get started by connecting your identity provider to import your company's personnel.", "If you do not have the appropriate credentials, add the team member who does as an admin."; buttons Connect identity provider (primary), Invite another admin; illustration.

bringing-…-02 (Controls register):
- Header "Controls"; More; primary "Add control" (menu).
- Card "Assignment": ring "0% Assigned"; Unassigned 4825, Assigned 1, Needs reassignment 0.
- Card "Completion": "Controls OK 2%", bar, "85 controls / 4826 total"; side bars Test 11/128 9%, Document 1/3033 0%.
- Toolbar: Search controls; Framework, Owner, Domain, Source, Framework code, Status, Trust Center, Risk; column settings.
- Table: ID (AAT-1…), Control (name + one-line description), Owner (Unassigned), Source (Vanta), Frameworks (chip "SOX ITGC · JP.01", "NIST 800-53 · SI-6(2)"), Tests ("0/4", "0/14"), row menu.

bringing-…-03 / -05 (Upload a File modal, controls): left "Make sure your file includes the following required columns": REQUIRED Control ID, Control Description; OPTIONAL Control Summary, Control Note, Domain, EIDAS…; right drop zone "What data do you want to upload? Upload a CSV or Excel file to begin the import process"; footer "Download Excel template", "Powered by OneSchema". (-05 is identical to -03.)

bringing-…-04 (Excel template): columns Control Summary, Control ID, Control Description, Control Note, Domain, SOC 2, ISO 27001:2013, ISO 27001:2022, ISO 27017…; 2 example rows (TEST-01 "CC 1.1,CC 1.2" / "A.5.1,A.5.2,C.5.2").

bringing-…-06 (Review & finalize): tabs All rows 2, Clean rows 2, Rows with issues 0; tools Map columns, Find and replace, Export; grid with column headers and info icons; footer Previous, Import.

bringing-…-07 (Controls after import, `?source=CUSTOM`): Source (1) filter, Clear; rows TEST-01, TEST-02, Owner Unassigned, Source "Custom", Frameworks "—", Tests "—"; "1 to 2 of 2 results", Show per page 100; toast "Successfully uploaded 2 controls!".

bringing-…-09 (Frameworks page): title, "Add framework", "View audits"; tabs All, Custom; Search; card grid: framework name, seal, progress ring with % (Essential 8 Level 2 0%, AWS FTR 2%, CCPA 7%, CIS v8.1 5%, CPS 234 0%, DORA 0%), "Snooze" button.

bringing-…-10 (Import custom framework modal): Framework name, Framework description (Optional), Short name (Optional), Parent section label (placeholder "Requirement Category"), Child section label ("Requirement"); Cancel, Import sections.

bringing-…-11 / -13 (Upload a File, framework): REQUIRED Section ID, Section Name, Section Description, Parent Section ID, Section Type; OPTIONAL Control IDs; drop zone; Download Excel template.

bringing-…-12 (framework template): rows PARENT-1 (P), CHILD-1 (C, parent PARENT-1, control TEST-01), PARENT-2 (P), CHILD-2 (C, TEST-02,TEST-03).

bringing-…-14 (Review & finalize, framework): All rows 4 / Clean rows 4 / Rows with issues 0; Section Type shown as P/C chips; Import.

bringing-…-15 (framework record "Test Framework", Custom badge):
- Breadcrumb Frameworks; More; "+ Create new control"; filters Search, Control status, Owner.
- Left rail "REQUIREMENT CATEGORIES" (+, collapse): PARENT-1…, PARENT-2….
- Card "Completion": Controls OK 100%, "2 controls / 2 total", Test 0/0, Document 0/0.
- Card "Audit timeline": "No audit scheduled. Contact your auditor to enter a date.", dots Now, Dec, Feb, Apr, Jun, Aug; "View audits".
- Section "PARENT-1 Parent Section Name - 1" with description, ⋯ and collapse; nested card "CHILD-1 Child Section Name - 1 →" with "Add control"; table CONTROL, EVIDENCE READINESS ("0/0"), OWNER (Unassigned), unlink icon. Toast "Framework successfully imported!".

bringing-…-16 / -17 (control side panel over the framework):
- Panel header: title "This is a test summary", description; ⋯, close.
- Properties: ID TEST-01, Source Custom, Domain "Select an option", Owner "Assign owner", Note "Add a note...".
- Tabs: Mapped elements, History.
- "Tests" (+): purple strip "Vanta AI suggests 5 tests for this control" with "Add all" / "Ignore all"; rows (e.g. "Company has an approved FedRAMP Access Control policy") each with accept ✓ and reject ✕; "Show more"; "No tests associated with this control".
- "Documents" (+): "Vanta AI suggests 20 documents" with the same pattern; "No documents associated with this control".
- "Mapped frameworks" with Add: chip "Test Framework · CHILD-1".
- "Risk scenarios" (+): "No risk scenarios associated with this control".
- Section "PARENT-2 …" badge "1/1 control OK". -17 adds arrows at the two + buttons.

bringing-…-18 (Tests page header): "+ Create custom test" (highlighted), "Edit SLAs"; left CATEGORY with counts All 3019, HR 131, IT 202, Policy 1952, Engineering 364, Risks 47, Custom 323; DEACTIVATED; card "OK 255 · 7% · 255 OK / 3274 total"; card "Needs attention 3019": Overdue 185, Due soon 33, Needs remediation (no SLA assigned) 2801; filters Search, Framework, Control, Integration, Owner, Type, Status, Rollout.

bringing-…-19 (Create a custom test modal): Test name; Description; "How to fix" instructions (Optional); "Select an integration"; link "Need help creating a custom test? Learn more"; Cancel, Create (disabled).

bringing-…-20 ("Tests: Custom"): category Custom 1; OK 0 · 0%; Needs attention 1 (Due soon 1); search "jira"; table Name (Jira Test), Category (Custom), Owner (avatar), Type (Automated test), Status (Due soon), Due date (Jul 12, 2024).

bringing-…-21 (test record "Jira Test"): breadcrumb Tests / Jira Test; "Custom" badge; description; meta Unassigned (edit), Jira, "Last refreshed 1 minute ago" + refresh; tabs Results, Source data, History, Tasks (0), Controls (0), Notes; empty card "No related controls — This test helps enforce a good security practice, but is not associated with any controls." with primary "Add control →".

bringing-…-22 (Add test to control modal): Search controls, Framework filter; left list CONTROLS (selected row bar; "✓ Added" chips on mapped ones); right detail: name, full-width primary "Add" + open-in-new, Description, Domain chip, Frameworks chips, Related sections chips.

bringing-…-23 (Documents: All): "Export all", primary "Add document" (menu); left CATEGORY All, HR, IT, Policy…; filters Status, Subcategory, Frequency, Framework, Priority, Owner, Time sensitivity; table NAME (+ chips Sensitive, ISO 27001:2022, +2), CATEGORY ("Human resources / Employees"), OWNER, STATUS ("Needs document since May 25 2023").

bringing-…-24 (New custom document modal): Document name (placeholder "Clear Desk Policy Enforced"), Description, "This is a sensitive document", Recurrence ("Select how often the document needs to be renewed since the most recent upload", Annually), Time sensitivity (Optional; "applies when you map this document to a control used by SOC2": Upload anytime / Upload during SOC 2 observation window); footer View N/A documents, Cancel, Create document.

bringing-…-25 (document header menu): "Needs document" status, Pause, Mark as not relevant, More ▾ → Mark as sensitive, Add control (arrow), Delete (red); "No files yet".

bringing-…-26 / -27 (Add document to control modal): search + Framework; left CONTROLS list; right detail with "Add" + open-in-new, Description.

bringing-…-28 (document page): close, "Document Name", chip "ISO 27017" with red dot, More; drop zone "Add a new document — Drag and drop, or select a file", Upload (highlighted), Add link; "Upload files up to 50 MB of the following types: .docx, .jpg, .pdf, .ai, .png, .webp, .xlsx, .csv, .txt, .xls, .zip".

bringing-…-29 (upload modal): title = file name; Filename ("Provide a friendly filename to your auditor."), Description (optional), Effective date ("When did this document go into effect? This will help keep your documents updated."); Cancel, Upload.

bringing-…-30 (document "Board of directors charter"): header status "Needs document", Snooze document, Mark as not relevant, More (highlighted); drop zone; "Details" disclosure: Description with Guidance links (Google docs / Docx templates), "Add note (optional)" with "This is visible to all Vanta users within your company." and Save note; "Time sensitivity & recurrence: Renew annually".

bringing-…-31 (Edit custom document request): Existing Standard, Existing Control (disabled until standard), New Standard, New Control, Title, Description; Cancel, Save.

bringing-…-32 (Policies rows): AIMS Performance Evaluation / Risk Management Policy / Scope Policy / Support and Operations Policy, each chip "ISO 42001", status "Not started", "—", primary "Start".

bringing-…-33 ("Start a new version" card): radios Create policy from scratch (selected) / Import an existing policy; "What language(s) does this policy support?" chip English; link Download template; primary "Create in policy editor".

bringing-…-34 (policy editor): close, "Access Control Policy", chips CCPA, GDPR, +4; "Delete and reset" (highlighted); status "Pending approval"; Close (primary), ⋯; rich-text toolbar; "Auto-save enabled"; page with the company logo and title.

bringing-…-35 (Assign an approver, Step 2 of 2): note "The policy approver is often the person responsible for this policy's enforcement (e.g. Secure Development Policy should be approved by your CTO)… assign the user as an admin or editor."; Approver select (Krista Panda); info "… will receive an email about this approval request… To change the approver or make edits to this policy, cancel the approval request."; Back, Assign approver.

bringing-…-36 (Step 1 of 2): "Do you want employees to reaccept Anti-Discrimination and Harassment Policy after it is approved?"; card radios "Yes, ask employees to reaccept this policy — You have made some major changes…" / "No, don't ask… — only minor changes… fixing some typos"; "Employee groups subject to acceptance of this policy:" list of 12 groups; Next.

bringing-…-37: card with "Create new version" button over a vertical timeline line.

bringing-…-38 ("Create a new version"): Template language English; option cards "Use the policy editor — Keep editing the policy with the editor", "Or", "Upload a file from computer — Supported formats: .pdf .docx", "Sync a file — Supported apps: Confluence, Google Drive, Sharepoint"; Cancel.

bringing-…-39 ("Upload a file"): language select English; "Drag & drop new document", Upload; ".docx, .pdf" up to 50 MB; Cancel.

bringing-…-40 ("Sync from Confluence"): Filter by name; row "Test policy — Last modified: 25 days ago" >; Cancel.

bringing-…-41 (Create new policy modal): info "Custom policy test creation — For each custom policy, we will create two new policy tests… revised and approved annually, and that each approved version is accepted by all relevant employees. All new tests appear on the Monitoring page under the Policies category."; Policy title, Description; Cancel, Create.

bringing-…-42 / -43 (custom policy page "Help Center Review"): card "Draft — Last edited by Shannon D • a few seconds ago", chips "Needs approval", "Created with policy editor"; actions Submit for approval (primary), Edit, ⋯; editor preview; Details: Description; "Time sensitivity & recurrence: Renew annually". (-43 is identical to -42.)

bringing-…-44 (Employee assignment, Step 2 of 2): "All employees in the following groups will be asked to accept the policy in the upcoming employee reminders email." link Settings > Notifications; 15 groups; Back, Approve.

bringing-…-45 (policy record "Third-Party Management Policy"): breadcrumb Policies; status "OK"; description; meta "AWS FTR +12 more", "Renew annually"; Edit details, ⋯; tabs Policy versions, Controls (107), Audits, Notes; "Add control"; table Framework, Section Code, Control, Owner (AWS FTR IAM-005; DORA Article 19, 26, 27 …; all Unassigned).

bringing-…-46 / -47 (Add controls modal from a policy): info "Adding a control to this policy will automatically link it to the Company has an approved Data Management Policy test. Newly added controls can only be in a passing state after the policy is approved."; search + Framework; list with "✓ Added" chips; detail with primary "Add" (or "Remove" for an added one), Description, Domain (Endpoint Security), Frameworks (ISO 27001:2022), Related sections (A.8.7 / A.8.1).

bringing-…-48 (Tests search "asset management"): OK 0, Needs attention 4 (Needs remediation 4); rows of Policy/IT tests, Type Automated test or Document, Status "Needs remediati…", Due date "—", Frameworks.

bringing-…-49 (test record "Company has an approved Asset Management Policy"): description with link; meta Unassigned, Vanta, Last refreshed 2 hours ago; tabs Results, Source data, History, Tasks (0), Controls (58), Audits, Notes; ⋯ menu Manage subscribers, Deactivate (highlighted), Submit feedback; result "Needs attention — You don't have an approved Asset Management Policy yet." with Create task, How to remediate.

bringing-…-50 (Tests, All deactivated): columns Name, Category, Owner, Type, Deactivated until ("Indefinitely"), Frameworks.

bringing-…-51 (Add risk scenario modal, scrolled): Is sensitive; Likelihood slider 1–5 "No score"; Impact slider 1–5 "No score"; Notes (Optional); Cancel, Create risk scenario.

bringing-…-52 (Vanta risk library): Risk nav expanded: Overview, Risk register, Risk library (current), Action tracker, Snapshots, Settings; title "Vanta risk library", "Select the risks that apply to your business and track them on your risk register. For SOC 2, scenarios that consider fraud are required."; Search, Categories, Register filters; table SCENARIO, CATEGORY (chips, +N), ADD TO REGISTER ("Add" per row).

## Flow edges

- Home (empty) → Connect identity provider / Invite another admin
- Controls → Add control → Upload a File → Review & finalize → Import → Controls (Source = Custom)
- Frameworks → Add framework → Import custom framework → Upload a File → Review & finalize → framework record
- framework record → control side panel → accept AI-suggested tests/documents, Mapped frameworks, Risk scenarios
- Tests → Create custom test → Tests: Custom → test record → Controls tab → Add test to control
- Documents → Add document → New custom document → Add document to control → document page → Upload / Add link
- Policies → Start → Start a new version → policy editor → Submit for approval → reaccept (Step 1) → Assign an approver (Step 2)
- Policies → + Custom Policies → Create new policy → draft → Submit for approval → Employee assignment → Approve
- policy record → Controls tab → Add controls
- Tests → policy test → ⋯ → Deactivate → All deactivated
- Risk → Risk register → Add scenario (manual / Via Import); Risk → Risk library → Add

## Actions

Connect identity provider · Invite another admin · Add control · Import custom controls · Download Excel template · Map columns · Find and replace · Export · Import · Add framework · Import sections · View audits · Snooze · Create new control · Add all / Ignore all (AI suggestions) · accept ✓ / reject ✕ · Assign owner · Create custom test · Edit SLAs · Add document · Create document · Upload · Add link · Pause · Mark as not relevant · Mark as sensitive · Delete · Snooze document · Save note · Start · Create in policy editor · Delete and reset · Submit for approval · Assign approver · Approve · Create new version · Sync a file · Edit details · Deactivate · Manage subscribers · reactivate monitoring · Add scenario · Via Import · Create risk scenario · Add (to register)

## Vocabulary

custom controls · Control ID · Domain · Source (Vanta / Custom) · Framework code · Assignment · Completion · Controls OK · Evidence readiness · Requirement categories · parent / child section · Mapped elements · Mapped frameworks · Related sections · Vanta AI suggests · Tests (Automated test, Document) · Needs attention · Overdue · Due soon · Needs remediation (no SLA assigned) · Deactivated until · custom document · Recurrence · Time sensitivity · observation window · effective date · Needs document · policy editor · Pending approval · Needs approval · Policy versions · reaccept · Employee assignment · risk scenario · Inherent / Residual Likelihood and Impact · Risk Treatment · Risk Type (CIA) · Risk library · Action tracker · Snapshots

## Screenshots

- bringing-your-current-compliance-program-into-vanta-01.png: empty Home, "Welcome to Vanta!", Connect identity provider.
- -02.png: Controls register with Assignment and Completion cards.
- -03.png: Upload a File modal for controls with required/optional columns.
- -04.png: custom-controls Excel template with framework criteria columns.
- -05.png: duplicate of -03.
- -06.png: Review & finalize grid, clean rows / rows with issues.
- -07.png: Controls filtered to Source Custom, success toast.
- -08.png: duplicate view of the empty Home.
- -09.png: Frameworks card grid with % rings and Snooze.
- -10.png: Import custom framework modal.
- -11.png: Upload a File modal for framework sections.
- -12.png: custom-framework Excel template, parent/child rows.
- -13.png: framework upload modal, full height.
- -14.png: Review & finalize for sections.
- -15.png: imported framework record: requirement categories rail, Completion, Audit timeline, sections with controls.
- -16.png: control side panel with AI-suggested tests and documents.
- -17.png: same panel, arrows at the manual + buttons.
- -18.png: Tests page header with category counts and OK / Needs attention cards.
- -19.png: Create a custom test modal.
- -20.png: Tests: Custom tab with one test.
- -21.png: custom test record, Controls (0) empty state with Add control.
- -22.png: Add test to control two-pane picker.
- -23.png: Documents: All register header.
- -24.png: New custom document modal (recurrence, time sensitivity).
- -25.png: document More menu with Add control.
- -26.png: Add document to control picker, empty detail.
- -27.png: same picker, a control chosen, Add.
- -28.png: document page drop zone, Upload / Add link.
- -29.png: upload modal: filename, description, effective date.
- -30.png: document page with Details, guidance links and note.
- -31.png: Edit custom document request modal.
- -32.png: Policies rows "Not started" with Start.
- -33.png: Start a new version: from scratch or import.
- -34.png: policy editor, Pending approval, Delete and reset.
- -35.png: Assign an approver, step 2 of 2.
- -36.png: reaccept question, step 1 of 2, groups listed.
- -37.png: Create new version button.
- -38.png: Create a new version: editor, upload, sync.
- -39.png: Upload a file panel.
- -40.png: Sync from Confluence picker.
- -41.png: Create new policy modal, two tests created per policy.
- -42.png: custom policy Draft card, Submit for approval.
- -43.png: duplicate of -42.
- -44.png: Employee assignment, step 2 of 2, Approve.
- -45.png: policy record, Controls (107) tab.
- -46.png: Add controls from a policy, Add.
- -47.png: same, an added control offers Remove.
- -48.png: Tests filtered to policy tests needing remediation.
- -49.png: policy test record, ⋯ menu with Deactivate.
- -50.png: All deactivated tests list.
- -51.png: Add risk scenario modal, likelihood and impact 1–5.
- -52.png: Vanta risk library with Add to register.

## For Program Assurance

- Bulk import is upload → column check → a review grid with "Clean rows / Rows with issues" and Map columns → Import → a toast and the register filtered to what came in; an RMF tool can import requirements, controls, POA&M and risks the same way.
- A control panel shows "Mapped elements" in four stacks (Tests, Documents, Mapped frameworks, Risk scenarios), each with suggested links to accept or reject one by one and a manual +.
- A two-pane picker (list with "Added" chips, detail with one full-width Add/Remove) links controls to tests, documents and policies, and states the consequence above the list ("Newly added controls can only be in a passing state after the policy is approved").
