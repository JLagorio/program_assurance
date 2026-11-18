# Builder 4: DoD assurance data (STIG checklists, NIST SP 800-160 for weapon systems)

Read `V8-COMMON.md` (same folder) first. Your files are `mod-v8-dod.js` and `.css`, with the CSS prefix `v8g-`. Keep the module under about 450 KB: embed only the reference data you draw.

## 1. STIG checklists (route `stigs`, System › STIG checklists)

DISA's STIGs harden each asset, and checklists record each rule's answer:
- CKL from STIG Viewer 2, CKLB from STIG Viewer 3 or Evaluate-STIG;
- SCAP XCCDF results from SCC or OpenSCAP.

A rule has:
- a Vuln ID (V-…) and rule ID (SV-…_rule);
- a title and a severity: CAT I high, CAT II medium, CAT III low;
- a status: Open, Not a Finding, Not Applicable or Not Reviewed;
- finding details and comments;
- CCIs, which map it to NIST SP 800-53 controls.

**Real data to use:**
- REPO `tests/fixtures/legacy-poc/src/lib/ingestion.ts`:
  - `nativeResults` has real-format RHEL 9 STIG rows (V-IDs, rule IDs, titles, severities, CCIs, finding details);
  - `scanRuns` has imports from STIG Viewer, Evaluate-STIG, SCC and OpenSCAP.
  - They were another program's (PRG-1041). Reuse the rules' definitions, and give WS-X90's assets their own statuses, marked Example.
- REPO `supabase/reference/U_CCI_List_2024.xml.gz`: DISA's CCI list. Read it with node or python to map each rule's CCIs to 800-53 Rev 5 controls, and link those controls (`control-si2` for SI-2; `controls` otherwise).
- **DISA's public STIG library.** Try to download two to four STIGs for WS-X90's kinds of assets (scratch folder `PROTO/../dod/stig/`):
  - Red Hat Enterprise Linux 9 for the mission computer;
  - a network device STIG for the internal Ethernet switch and the gateway;
  - the Application Security and Development STIG for the mission software;
  - Windows 11 for the depot maintenance laptop.
  - Find each zip's current name with one web search (DISA publishes them under `dl.dod.cyber.mil`). Parse the manual XCCDF for exact rule counts by severity, and for rule rows.
  - If the download fails, use the fixture's rules and mark totals Example.
- WS-X90's assets: the composition elements and `PA.data.ASSETS`.

**Screens:**
- **`stigs`: tabs Checklists · Open rules · Benchmarks · Imports.**
  - **Checklists:** one row per asset and STIG. Columns: the asset (→ `inventory`), the STIG and its version and release (e.g. V2R3), the source tool, the last import (date, by), open CAT I, CAT II and CAT III, Not Reviewed, and a compliance share. A banner for open CAT I.
  - **Open rules:** every open rule across assets, by CAT, with its control and its POA&M item (→ `poam`) or "No POA&M item". Show the deadline as `deadlines-stig` sets it (link there).
  - **Benchmarks:** the STIG versions in use, with "a newer release is available" where DISA has published one (quarterly), and what changed.
  - **Imports:** the history of checklist files, with tool, hash, rules read and what each superseded.
- **A checklist page per asset and STIG** (routes `stigs-<slug>`, owned, `ROUTE_NAV` `stigs`):
  - the record header;
  - the rules table (V-ID, title, CAT, status, control, finding details);
  - filters by status and CAT;
  - a rule's panel with check and fix text where you have it, CCIs and controls, comments, and Create POA&M item.
- **Import a checklist:** a dialog. Choose CKL, CKLB or XCCDF results for an asset, then preview what changed since the last import (Open → Not a Finding, new rules from a new release, rules held back for missing CCIs), then apply.
- **On a control's record:** with `PA.decorate("control-si2", …)`, add the STIG rules that map to SI-2 through their CCIs, with their open counts, if your mapping finds any.

## 2. Security engineering for a weapon system (route `sse`, Analysis › Security engineering)

NIST SP 800-160 Vol. 1 Rev. 1 sets systems security engineering across the system life cycle processes, each with security outcomes. Vol. 2 (cyber resiliency) is drawn already on `resiliency`.

**Real data:**
- REPO `supabase/reference/NIST_SP-800-160v1r1_life-cycle-processes.json.gz`: the processes, their groups and their outcomes. Read it with node or python, and use the outcomes' sentences as printed.
- WS-X90's lifecycle gates and technical reviews: grep `schedule`'s source and the portfolio data (its next gate is CDR, Oct 1). Use the database if it answers: `lifecycle_gates`, `gate_criteria`, and outcomes via `gate_criterion_rows`. A gate criterion drawn from a security outcome names its process.

**Tabs: Technical reviews · Processes · Cyber survivability.**
- **Technical reviews:** WS-X90's reviews and milestones in order (e.g. SRR, PDR, Milestone B, CDR, TRR, Milestone C). For each:
  - the security outcomes it holds as gate criteria, with their status (met, partly met, not met, not assessed) and evidence;
  - counts;
  - "Add security outcomes", a picker over the outcomes.
- **Processes:** the four process groups and their processes, each with its outcomes and where WS-X90 applies them (the reviews), filterable.
- **Cyber survivability:** the Joint Staff Cyber Survivability Endorsement's ten cyber survivability attributes under their pillars (prevent, mitigate, recover), as the System Survivability KPP sets them.
  - Verify the attributes' names and pillars with one web search, and use them exactly.
  - Per attribute: WS-X90's requirement statement (Example), threshold and objective, the controls and resiliency techniques behind it (→ `resiliency`), and the cyber T&E events that test it (→ `cyber-te`), with status.
- **Links:** to `resiliency` ("Vol. 2: cyber resiliency"), `cyber-te`, `traceability` and `schedule`.
