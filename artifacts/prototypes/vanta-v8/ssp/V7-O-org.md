# Builder O: organization and settings

Read `V7-COMMON.md` (same folder) first. Your files are `mod-v7-org.js` and `.css`, with the CSS prefix `v7o-`.

## Routes you own

Keep these names, define every one, and `PA.own` them all. For each, the nav item and where the old version lives now:

| Route | Nav item | Old version |
|---|---|---|
| `portfolio` | portfolio | mod-system.js |
| `products`, `products-delta` | products | mod-system.js |
| `components` | components | mod-platform.js |
| `component-mc`, `component-mc-assessment`, `component-mc-where`, `component-mc-findings`, `component-mc-sbom`, `component-mc-sbom-v1`, `component-mc-versions` | components | mod-platform.js |
| `component-mc-tasks`, `component-mc-activity`, `component-mc-comments` (new tabs) | components | — |
| `deadlines`, `deadlines-vuln`, `deadlines-stig`, `deadlines-findings`, `deadlines-other` | deadlines | mod-platform.js |
| `event-log`, `event-log-reviews`, `event-log-imports`, `event-log-decisions`, `event-log-system` | event-log | mod-platform.js |
| `enclaves` | enclaves | mod-platform.js |
| `common-controls` | common-controls | mod-platform.js |
| `people-8140` (DoD 8140 workforce qualification, a tab beside the promoted People screen) | people | mod-system.js or mod-platform.js; grep for it |

### Two notes

- **The component record.** A record for the Mission Computer was already drawn in the after style: `after-component-record`, with tasks, activity and comments, in `PROTO/mod-after-people.js`. View `PROTO/out/ba/component-record-after.png`, and read that part of the module's source. **Make `component-mc` that design**: port it into your module as the canonical record. Give it one counted tab bar holding Overview, Assessment, Where used, Findings, SBOM, Versions, Tasks, Activity and Comments. Then draw the old record's tabs (assessment, where used, findings, SBOM version 2 and version 1, versions) in the same style, so nothing the old record held is lost.
- **`people-8140`.** Look at `BA/ours/people-8140.png` and `PROTO/out/ba/people-register-after.png`, and draw it to sit with the latter. Its old version has raw `<span class="ex">` markup showing in card titles; don't repeat that.

## What each needs

### `portfolio`

The programs in the workspace, in a calm list with each one's satisfied share, owner, next date and business line.

- **Create program** is the ink primary (→ `program-new`).
- WS-X90 opens its `overview`.
- Use the real programs: WS-X90, Customer A, B and C, and the other workspace programs, as the old screen and `PA.data.PROGRAMS` hold them.

### `products` and `products-delta`

Products, configurations and variants: X800 Missile, G25, R210 and G40, with their configurations and the programs built from them, as in the old screens.

- **The delta tab** shows what each variant inherits, shares and owes.
- **A row's panel** shows the product version, its assessment, and the programs that are a version behind, with a nudge to take the newer version.

### `components`

The shared library components (Mission Computer, Audit Log Collector and the others), each assessed once and used everywhere. A row shows:

- the version, owner, controls satisfied, consumers and how many are behind;
- open CVEs. CVE-2024-6387 is in the Mission Computer's OpenSSH; version 2, published Nov 12, fixes it, and AC-17(2) and SC-23 are left to review.

### `deadlines` and its tabs

SLA policy by finding type:

- vulnerabilities by severity, STIG categories, findings and other;
- each with its target days, owner and the items at risk;
- Vanta's deadline status cards belong here (it is one of the eight pages that has them).

### `event-log` and its tabs

The audit log as a filterable register: who, what, which record and when, with a reason where one was given.

### `enclaves`

Enclaves and markings (CUI and so on) with what each allows.

### `common-controls`

The common control providers (the corporate identity provider and others): the controls they provide, the programs that inherit from them, and their authorization status.

## Vanta references (at most these)

Pick from index.json:

- `VANTA/ux/vendors/` (a vendor record with risk chips and a profile checklist), for components;
- `VANTA/ux/vulnerabilities/` (deadline status cards and SLA), for deadlines;
- `VANTA/ux/workspaces/` (the workspace console with program health), for the portfolio;
- `VANTA/ux/settings/`, for enclaves and the event log.
