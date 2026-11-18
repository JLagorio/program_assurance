# Builder 1: platform and workflow

Read `V8-COMMON.md` (same folder) first. Your files are `mod-v8-platform.js` and `.css`, with the CSS prefix `v8w-`. You may also edit Jira's entry in `PROTO/mod-after-docs.js`'s integration list (search for `id: "jira"`) so it reads as connected; touch nothing else there.

You build five things.

## 1. Search (⌘K), everywhere

The top bar's search box (`#proto .top .search`) is a static span today.

- **Open it:** make it a button at load (role, tabindex, aria-label "Search", the ⌘K hint kept). Clicking it, or pressing ⌘K or Ctrl+K anywhere (also inside the full-window SSP editor), opens a command palette over the page.
- **The palette:** an input, then results grouped and counted. Arrow keys move, Enter opens, Esc closes and returns focus. Mouse works too. With an empty query it shows Recent (what you opened this session) and Suggested commands.
- **What it finds:**
  - pages (every nav item);
  - controls (`PA.SSP` controls: code and title, with status);
  - requirements, evidence, risks, operational issues, POA&M items, assets and campaigns (`PA.data`);
  - people (`PA.SSP` people, with role);
  - programs;
  - the plans (SSP, contingency, incident response, configuration management: `ssp`, `plan-cp`, `plan-irp`, `plan-cmp`);
  - commands: Create program (→ `program-new`), Import an ITCSC (→ `itcsc-import`), Import a STIG checklist (→ `stigs`), Open the SSP, Create risk from the library (→ `risks-library`), Roles & permissions, Go to my work.
- **A row:** a type glyph, the code or name with the match highlighted, a muted second fact (status, program, role), and where it opens. A record opens its screen. Where a record only has a panel, go to its register route and open the panel (`[data-panel]` keys exist there: find them by grep).
- **Keep it fast:** at most 6 per group, with "N more" leading to the register.

## 2. Tickets on records (Jira and ServiceNow)

Vanta creates tickets from a failing test and lists them on it. Here, a record can be linked to tickets that sync status both ways.

- **Where:** add a "Tickets" section with `PA.decorate` or `PA.decoratePanel` to:
  - the check record (`check` and its tabs);
  - POA&M items (the `poam` panels);
  - operational issues (the `findings` panels);
  - and, where it reads naturally, a task row or panel on `my-work`.
- **The section:** one row per ticket:
  - key (e.g. `WSX-412`, Example), tool glyph, summary;
  - status as the tool says it ("In progress · synced 4 min ago");
  - assignee, and the link "Open in Jira" (inert);
  - a two-way note where the tool's status moved the record ("Done in Jira → milestone completed Nov 14").
- **Create ticket:** a dialog with the tool (Jira or ServiceNow), the project, the issue type and a summary prefilled from the record. It also asks what syncs: status, assignee and comments. On create, toast and show the new row.
- **Integration:** Jira reads as connected for the WSX project, two-way, with POA&M milestones ↔ issues. ServiceNow stays available but not connected.
- All tickets are Example; say so in one note per section.

## 3. AI agents with an approval queue (route `ai-drafts`, nav "AI agents")

Redraw `ai-drafts` as AI agents and `PA.own` it with its tabs. Keep what today's AI drafts screen holds, real counts included: the 74 placeholder narratives in SSP 3, its runs and its templates. Grep the current module for it.

- **Tabs: Needs approval · Runs · Agents.**
- **Needs approval:** agent runs whose results wait for a person, each a card or row. A row names:
  - the agent and who started it;
  - what it proposes, with its items counted;
  - the record it lands in, opened in place: the SSP editor's suggestions, a data call's answers, an ITCSC import, a STIG checklist.
  - Actions: approve all, review items one by one, reject with a reason. AI never writes a determination, a risk acceptance or a signature: say so once.
  - Examples: "Narrative drafter: 14 implementation narratives for AC in SSP 3"; "Evidence mapper: link 6 artifacts to 11 controls"; "POA&M milestone writer: milestones for 3 items"; "STIG triage: 23 CAT II open rules matched to existing POA&M items"; "ITCSC reader: 37 fields read from the uploaded checklist"; "Questionnaire answerer: 41 answers in Customer A's data call".
- **Runs:** a history table: agent, started by, started, duration, items, outcome (Approved, Partly approved, Rejected, Waiting), and the record.
- **Agents:** the catalog. Each agent shows:
  - what it reads, and what it may write (always suggestions);
  - its triggers (manual, scheduled, or an event such as "when a STIG checklist is imported");
  - its owner, last run and an on/off switch.
  - An agent's panel shows its permissions and recent runs.

## 4. Roles and permissions (route `permissions`, Settings › Roles & permissions)

- **Tabs: Roles · Permissions · Members · Changes.**
- **Roles:** workspace roles (Admin, Member, Viewer, and Assessor for an outside SCA). Then the RMF roles a program records: authorizing official, lead assessor, assessor, ISSM (security manager), ISSO (security officer) and system owner, with today's holders on WS-X90 from `PA.SSP`.
  - The real database rules (REPO `CLAUDE.md`, program roles): where a program records an AO or a lead assessor, only today's holder records an authorization decision or publishes assessment results. A viewer can't write. One AO and one lead assessor at a time.
  - Check the workspace role names with a SELECT if the database answers (`select distinct role from tenant_memberships`, or find the table).
- **Permissions:** a matrix. Rows are objects: programs, plans (SSP and others), controls and requirements, evidence, risks and risk acceptance, POA&M, assessments and results, authorization packages, settings. Columns are actions: view, create, edit, approve, sign or decide, publish.
  - Each cell is allowed, allowed with a condition (a tooltip such as "only today's AO"), or not allowed, per role, chosen by a role selector.
  - Mark which rules are the database's (real) and which are proposed (Example).
- **Members:** people, their workspace role, their program roles with periods, and last active. Invite and Change role open dialogs with a required reason.
- **Changes:** who changed a role or permission, when, and why: a register.

## 5. Risk library (route `risks-library`, a tab on Risks)

- **The Library tab:** add it to the Risks screens' tab bar with `PA.decorate` (match `/^risks(-|$)/` and insert into the `AK.tabs` bar). Own `risks-library`, which draws the same header with Library selected.
- **Scenarios to start a risk from**, grouped:
  1. **ATT&CK techniques, real.** REPO `supabase/reference/NIST_SP-800-160v2r1_appendix-f.json.gz` (Enterprise) and `appendix-g.json.gz` (ICS) are gzipped JSON. Read them with node or python and embed what you need. Use the technique by ID and name, its tactics, mitigations and countering controls.
  2. **Weapon system scenarios, Example.** For example: firmware tampered during depot maintenance, GPS spoofing of the navigation subsystem, tactical data link jamming, a counterfeit part in the supply chain, a mission data load from an untrusted planning system. Each names its ATT&CK techniques and the WS-X90 elements it touches.
- **A scenario's panel:** threat source, event, the predisposing condition, suggested likelihood and impact, countering controls (with their WS-X90 status from `PA.SSP`), and "In use by N risks".
- **Use this scenario:** opens Create risk prefilled (title, threat, techniques, controls, owner Unassigned). On create, toast and link to `risks`.
- **Library management:** add a custom scenario, and "N techniques in Appendix F and G" counted.
