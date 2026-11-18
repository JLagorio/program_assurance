# Builder 2: plans as live documents, and people's onboarding and offboarding

Read `V8-COMMON.md` (same folder) first. Your files are `mod-v8-plans.js` and `.css`, with the CSS prefix `v8d-`.

## 1. The contingency, incident response and configuration management plans, as live documents

Version 6 drew the SSP as a live, Google Docs-like document:
- `ssp`: the editor, in `PROTO/mod-ssp-editor.js`. It is full window, with presence, comments, AI suggestions and data-backed sections.
- `ssp-history` and `ssp-review`: version history with redlines, and submit for review, in `mod-ssp-history.js`.
- `ssps`: its register, also in `mod-ssp-history.js`.

Josef wants the other plans "in the SSP editor, with the same history, comments and AI".

**How:**
- Build three plan documents in your module, reusing the SSP editor's look and helpers:
  - its `sd-` document classes (`mod-a-ssp-data.css`) and `se-` editor classes (`mod-ssp-editor.css`);
  - `PA.fullWindow`, and `PA.SSP.ui` (av, diff for word redlines, toast, when).
  - Read the editor's source for its structure (grep, don't print it whole), and view `ssp` and `ssp-history` with look.mjs.
- **Don't rewrite or break the SSP editor.** You may add one small hook to it: a document switcher in its header listing the four plans. Run `node PROTO/../ssp/flows7.mjs PROTO/out/v8-plans.html` and keep every check passing.

**Routes:**
- `plan-cp`, `plan-irp` and `plan-cmp`: full-window editors.
- `plan-cp-history`, `plan-irp-history` and `plan-cmp-history`: version history with redlines between versions and a restore action.
- `ssps`, now **Plans**: own it and its tabs. Redraw the register with four rows: SSP 3 (keep its panel `P["ssp"]` working), then CP, IRP and CMP. Each row shows the revision, status, owner, who is editing now, last edit, open comments and AI suggestions waiting.

**Each editor has what the SSP's has:**
- people present, with avatars and a live block one of them is editing;
- comments anchored to a passage (oldest first, with replies and resolve);
- AI suggestions to accept or reject, credited to the agent ("Narrative drafter") and the person;
- autosave ("Saved · version 14");
- a version history button;
- submit for review with its approval steps (`AK.approval`).

**Data-backed sections** draw from the program's records and say where each comes from:
- **Contingency plan (NIST SP 800-34 Rev 1 structure):**
  - introduction and scope; concept of operations; roles from the program's roles and people;
  - activation and notification, recovery and reconstitution.
  - Recovery priorities: WS-X90's elements, from the composition data, with their mission functions and an RTO and RPO each (Example).
  - Contact lists and the alternate site (Example).
  - The plan's test: the real ConMon check "Contingency plan test on a whole article (CP-4)", due Apr 12, 2027. Grep `mod-v7-program.js` for the ConMon checks.
- **Incident response plan (NIST SP 800-61 structure):**
  - preparation; detection and analysis; containment, eradication and recovery; post-incident;
  - roles (ISSM, ISSO, and the CSSP, Example).
  - Reporting timelines: say which are proposed and mark them.
  - Playbooks linked to the ATT&CK techniques the program's threats and risks name (the `threats` data).
  - The tabletop test: the real ConMon check "Incident response tabletop (IR-3)", due Mar 13, 2027.
- **Configuration management plan (NIST SP 800-128 structure):**
  - the configuration control board: chair and members from the program's roles;
  - configuration items: WS-X90's elements and their firmware pins, from the composition data;
  - baselines: link the STIG-hardened builds to `stigs`;
  - change control: the scope changes on `inventory-changes`;
  - security impact analysis (CM-4) per change, and which changes are significant: link the ConMon reauthorization triggers on `conmon`.
- **Linked from the SSP:** where the SSP already says it (the system description, the boundary), show the SSP's text as a linked block with "Edit in the SSP".

**Content:** write the plans' prose in the program's terms, short and plausible. Mark invented values. Each plan's history needs two or three earlier versions, with a real redline built by `PA.SSP.ui.diff`.

## 2. People: onboarding and offboarding, per person

Today People (`people`, promoted from `mod-after-people.js`) lists 11 people with work in WS-X90, their roles, and role task sets (`people-task-sets`). There is no page per person.

**Routes:** `person-<slug>` for each of the 11 people (for example `person-joel-barrantes`), with tabs `-onboarding`, `-access`, `-training` and `-offboarding`. Own them all, and set `ROUTE_NAV` to `people`.

**Linking:** link from the People register with `PA.decorate` or `PA.decoratePanel`: each name or panel gets "Open person". Find the right marker by grep.

**Overview:**
- the person's roles (RMF roles with their periods), programs, and the records they own (risks, evidence, POA&M items, tasks), counted from `PA.data` and `PA.SSP` where owners exist;
- their open tasks.

**Onboarding:** one checklist, the union of their roles' task sets. Reuse the role task sets' real items. Rows can include:
- a DD Form 2875 (System Authorization Access Request) for each system account (eMASS, the program's Jira and GitLab, the mission network);
- rules of behavior acknowledged (PL-4);
- SF-312 nondisclosure for classified access;
- background investigation status;
- CAC or token issued;
- training (below).

Each row has an owner (the person, the ISSM, the security office), a due date, a status, "Last reminded on…", and evidence.

**Access:** one row per account, with:
- the system and the role held;
- how it was granted (DD 2875, with its approver);
- "Verified via integration on Nov 12, 14:02" for accounts an integration reads (Entra ID, GitLab, Jira), or "Manual check" with its date;
- last used.

**Training:**
- the annual DoD Cyber Awareness Challenge;
- role-based training (AT-3), with its due date;
- DoD 8140 qualification: link to `people-8140`.

**Offboarding:**
- Pick one person who leaves on Dec 1 (Example). Draw their offboarding as a stepper:
  1. notice (end date, reason, requested by);
  2. reassign work: the records and tasks they own, counted, each with a new-owner picker;
  3. remove access: each account with "Verified via integration" or a manual check;
  4. return equipment;
  5. security debrief (SF-312 debriefing);
  6. close, with the AC-2(3) evidence that every account was disabled within the window.
- Everyone else's Offboarding tab offers "Start offboarding" (a dialog with a date and reason).
