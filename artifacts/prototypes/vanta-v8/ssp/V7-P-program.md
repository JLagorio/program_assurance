# Builder P: program and system screens

Read `V7-COMMON.md` (same folder) first. Your files are `mod-v7-program.js` and `.css`, with the CSS prefix `v7p-`.

## Routes you own

Keep these names, define every one, and `PA.own` them all. For each, the nav item and where the old version lives now:

| Route | Nav item | Old version |
|---|---|---|
| `overview` | overview | core.js, `S.overview` |
| `composition`, `composition-list`, `composition-config` | composition | mod-system.js |
| `inventory-scans` (tab of Inventory) | inventory | mod-system.js |
| `baseline`, `baseline-params` | baseline | mod-compliance.js |
| `requirements`, `requirements-objectives`, `requirements-compliance` | requirements | mod-compliance.js |
| `authorization` | authorization | mod-risk.js |
| `conmon` | conmon | mod-risk.js |

`inventory-scans` sits beside the promoted Inventory screen. Look at `BA/ours/inventory-scans.png` and `PROTO/out/ba/inventory-after.png`, and draw it to sit with the latter.

## What each needs

### `overview`: WS-X90's home

This is the program's page, like Vanta's framework page.

- **Header** (`AK.recordHead`): WS-X90 Sentinel Mission System and PRG-1090, with chips for its authorization status and its lifecycle. The facts are:
  - the AO and ISSM, from `PA.SSP.roles`;
  - the baseline, 560 controls;
  - the next gate or date, from the old Overview.
- **One completion number** earns its place here: controls satisfied, 176 of 560, from `PA.SSP.counts.controlStatus` (real). Show it with the control status strip or a stacked bar of the six statuses.
- **Open work**: findings, risks, POA&M and tasks, as counted lines linking to `findings`, `risks`, `poam` and `my-work`.
- **An SSP card**: Revision 3 · Draft · 74 placeholder narratives · edited 10:42 AM by Priya Raghavan, with "Open the SSP" (→ `ssp`) and "Version history" (→ `ssp-history`). The counts come from `PA.SSP`.
- **A setup card** linking to `getting-started`.
- **A Team rail**: the real roles.
- **Recent activity** (`AK.activity`).

### `composition`

The system tree (`PA.SSP.elements`, real): 6 subsystems and 20 elements with their LRUs.

- Tabs: Tree, List and Configuration.
- An element's row opens a panel: owner, library component and version, the controls it carries and its requirements.
- Link to the SSP's boundary section: "Shown in SSP section 5", → `ssp`.

### `baseline` and `baseline-params`

- **`baseline`**: the baseline's stack, one line per layer with +added, −removed and the running count, then the resulting baseline by family (Grid or List).
- **`baseline-params`**: the parameter values. WS-X90's tailoring mostly sets none, so they read "Not set". Show that honestly, and link to the SSP check "AC-2(3) names values the baseline doesn't set" (→ `ssp`).
- Each layer has an owner and a "last changed" date.

### `requirements` and its tabs

A register:

- the requirement's code and title, its owner (`AK.owner`), state, the controls it maps and the objectives it covers, and evidence;
- a bulk bar to assign an owner;
- a row opens a record panel with a Comments tab.

The tabs:

- **Objectives**: coverage by control objective.
- **Compliance**: a customer's requirements with each one's answer, as the old tab has it.

### `authorization`

The package and its decision:

- the approval steps (`AK.approval`): ISSM Joel Barrantes, then AO R. Calloway; only the AO signs;
- what is in the package: the SSP (revision 2, published Jul 25, frozen, → `ssp-history`; the revision 3 draft → `ssp-review`), the SAR, the POA&M, and the risk acceptances with their reasons;
- the decision history;
- link to `package-room`.

### `conmon`

Continuous monitoring as recurring checks, as Vanta does it:

- the monthly ACAS scans, STIG checks, the POA&M review and the quarterly reassessment sample;
- each with an owner, a cadence, the last run, the next due (`AK.due`), and a status;
- one banner for what is overdue;
- link to SSP section 13 (→ `ssp`) and to `checks`.

## Vanta references (at most these)

- `VANTA/ux/frameworks/` (a framework's page with completion): pick one or two from index.json.
- `VANTA/ux/controls/` (a control drawer).
- `VANTA/ux/audits/` (audit timeline).
- `VANTA/ux/tests/` (a test's detail with its owner, SLA and remediation).
