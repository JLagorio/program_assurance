# Builder A: analysis and threats

Read `V7-COMMON.md` (same folder) first. Your files are `mod-v7-analysis.js` and `.css`, with the CSS prefix `v7a-`.

## Routes you own

Keep these names, define every one, and `PA.own` them all. For each, the nav item and where the old version lives now:

| Route | Nav item | Old version |
|---|---|---|
| `posture`, `posture-unevidenced`, `posture-issues`, `posture-risks` | posture | mod-system.js |
| `resiliency`, `resiliency-approaches` | resiliency | mod-system.js |
| `traceability`, `traceability-risk`, `traceability-noev`, `traceability-matrix` | traceability | mod-system.js |
| `inheritance`, `inheritance-controls`, `inheritance-sources` | inheritance | mod-system.js |
| `threats`, `threats-controls` | threats | mod-system.js |
| `cyber-te` | cyber-te | mod-compliance.js |
| `frameworks-gap` (a tab beside the promoted Frameworks screen) | frameworks | mod-compliance.js |

For `frameworks-gap`, look at `PROTO/out/ba/frameworks-after.png`, and draw it to sit with it.

## What these are

They are Program Assurance's analytical views. Vanta has nothing like them; they are what the product adds. Keep their substance and real numbers, but draw them with the calm after parts:

- one chart where it earns its place, with its table one toggle away;
- counted tabs, not stat-card pairs;
- tables whose rows open a side panel;
- in the panels, the workflow where people act: owners, due dates, comments and next steps.

## Each

### `posture` and its tabs

The program's elements by control family, counted in assessment objectives: a heatmap. The tabs read Objectives mapped, Without evidence, Open issues and Open risks.

- A cell opens a panel listing what stands there, with links (→ `controls`, `risks`, `findings`).
- Keep the old screen's real numbers.

### `resiliency` and `resiliency-approaches`

NIST SP 800-160 Vol. 2's ladder: goals → objectives → techniques → approaches, with what the baseline holds behind each. Draw it calmly:

- techniques as rows with a small tally of their controls;
- the approaches tab listing the 50 approaches, the ones with nothing behind them first;
- an approach's panel showing its definition and its supporting controls.

Link SA-24 to the SSP's section 12 (→ `ssp`).

### `traceability` and its tabs

The chain is control → requirement → evidence → finding → issue → risk → remediation.

- **Table**: a row per chain, with its gaps visible ("No evidence").
- **Risk** and **No evidence**: filtered views.
- **Matrix**: requirements × controls.
- A row's panel draws the seven stages as a trace, each stage a link, with a gap showing its fix ("Link evidence", "Map a requirement").

### `inheritance` and its tabs

What WS-X90 inherits from shared components and common control providers. Draw it in Vanta's calm:

- **Controls**: the controls inherited, and from where.
- **Sources**: the providers (the corporate identity provider, the Mission Computer component), each with its version, owner, and whether a newer version waits for review. Mission Computer version 2 was published Nov 12 and leaves AC-17(2) and SC-23 to review.

### `threats` and `threats-controls`

ATT&CK techniques that matter to the program's risks, and the controls that counter them.

- A technique's panel shows its tactics, the program's risks that name it, and its countering controls with Baseline and Objectives mapped.

### `cyber-te`

Cyber test and evaluation phases (CVPA, AA and the rest, as the old screen has them): plans, events, findings, owners and dates. It should feel like Vanta's audit list and timeline.

### `frameworks-gap`

A gap analysis between frameworks or baselines, as the old tab has it, in the after style.

## Vanta references (at most these)

Pick from index.json:

- `VANTA/ux/risk/` (risk scenarios with threats);
- `VANTA/ux/vulnerabilities/` (deadline cards, SLA);
- `VANTA/ux/frameworks/` (framework page, completion);
- `VANTA/ux/audits/` (audit timeline).
