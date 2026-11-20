# V3 lane W: one inbox, one place for sources, checks and providers

Read `SP/vanta/v3/COMMON.md` first and follow it. Your files:
- `SP/vanta/proto/mod-zzzz-v3-6work.js` and `.css`
- `SP/vanta/v3/W/`

Wave 1 has landed (all three), and its modules are in the folder:
- `mod-zzzz-v3-2program` (P: created programs);
- `-3gates` (G: Lifecycle, Authorization, decisions);
- `-4facts` (F: one source per fact, `PA.v3.facts`).

Read their `SP/vanta/v3/<P|G|F>/notes.json` and the facts they publish. **Build with them included**: leave out lane R, working beside you, and anything after yours.
```sh
python3 -I build.py v3-W $(ls mod-*.js | grep -v '^mod-zzzz-v3-[5-9]') mod-zzzz-v3-6work.js
```

## Your findings (10), and five merges from the menu proposal
C04, C10, C11, C12, C14, C15, C16, C17, C23 and C24, in `SP/vanta/review/C/findings.json`. Reviewer C's census and scripts are in `review/C/`. The merges are in `review/C/order.json`.

1. **One personal inbox** (C04, C14, C15)
   - My work is the reader's one inbox: Assigned to me, Needs my approval (including AI agent runs and Package room access requests), Waiting on others.
   - Review stays the workspace's register.
   - The bell holds mentions only.
   - AI agents' Needs approval page sends the reader to My work's Needs my approval. Its Runs and Agents pages stay.
   - Overview's Your tasks tile counts My work's Assigned to me rows and opens that view. Overview is F's page: compose on it.
   - The Review queue lists every row it counts, with working pages, or counts only what it lists.
   - G and P insert rows into My work: keep them.
2. **Sources, checks and imports** (C10, C11, C17)
   - Continuous monitoring owns each recurring check: Checks merges into it, with one cadence and one state per check. Schedule's runs show as Continuous monitoring's runs, and its personal tasks go to My work.
   - Evidence sources becomes Evidence's Sources tab, which owns a program's sources and imports. Integrations lists connectors only. Import file imports a file into that source.
   - Evidence sources' import history, the STIG checklists, Integrations' counts and Checks' footnote agree: they draw from one list of what was imported.
   - Redirect `checks`, `schedule` and `sources` to their new homes' tabs, and draw those tabs.
3. **Providers and versions** (C12, C16, C23)
   - Inheritance merges into Host & providers: providers and library components, one inherited count and one Add provider. Boundary and Authorization read it.
   - Settings keeps the workspace's catalog only. Redirect `inheritance`.
   - Mission Computer version 2 gets one call to action, on Host & providers or Composition, opening one Take version dialog that works. It moves Components, Inventory, the supplier, the CVE's POA&M item and Checks. Home's banner points to it.
   - Inventory becomes Composition's Assets tab. Redirect `inventory`.
   - A provider with no authorization (the Corporate identity provider) is flagged on Host & providers and on each control that leans on it, and links to its program row.
4. **Setup** (C24)
   - The workspace's setup steps (catalog, roles, deadlines, notifications) are a Workspace setup page in Settings, done once. Use the `PA.v3.areaGroups` and `PA.v3.rail` hooks with `PA.navRegister`.
   - The program keeps F's Overview setup card.
   - Deadlines gains Adopt proposed, which ticks its step.

## Routes you own
- Your own: `my-work*`, `review-queue*`, `notifications*`, `sources*`, `integrations*`, `stigs*`, `checks*`, `conmon*`, `schedule*`, WS-X90's `hosts*`, `inheritance*`, `common-controls*`, WS-X90's `composition*`, `inventory*`, `deadlines*`, the Workspace setup page, the top bar's bell.
- Shared with earlier lanes (compose on theirs, change only what your findings need):
  - `ai-drafts*` (F);
  - `home` (P adds created programs' cards);
  - `overview` (F);
  - the control preview and page (F, for C23's flag);
  - `poam` (lane R, beside you: only the CVE's item, through a fact R can read).
- Shared with lane R, working at the same time: R changes wording on `review-queue`; you add paging.

## Walk and screenshots
- **Walk:** "One inbox and one home for each thing". See My work's Needs my approval, take Mission Computer version 2 from its one place and watch Inventory, POA&M and Checks follow, then open Continuous monitoring's checks.
- **Scenes:**
  - My work;
  - Host & providers with inheritance;
  - Continuous monitoring's checks;
  - Evidence's Sources tab.

## From lane F (landed)
- Read control status counts from `PA.v3.fact("controls", prog)` or `fact("status", code)`, never `PA.v2.chain.counts()`. chain.counts() over-counts increment 2 by 2 (39/68 against 37/70).
- F publishes `controls`, `status`, `objectives`, `finding`, `issues`, `risks`, `poam`, `evidence`, `requirements`, `setup`, `people`, `snapshots`, `techniques` and `customer`. Their shapes are in `SP/vanta/v3/F/notes.json` and the header of `mod-zzzz-v3-4facts.js`.
- WS-X90's customer is now "F-16 SPO" (C22): use F's `customer()`.

## From lanes P and G (landed)
- **P** (`-2program`): created programs. It publishes `PA.v3.facts.program(code)` and `lifeDue(code, step)`. Once every lane has loaded, F's facts answer created programs from P's records.
- **G** (`-3gates`): Lifecycle, decisions, Authorization. It publishes `authorizations(prog)`, `conditions(prog)`, `gate(id)` and `outcome(code, inc)`.
  - Security engineering redirects to `lifecycle-outcomes`, Package room to Authorization's Sharing tab.
  - Decisions are recorded one step at a time, each naming its holder.
- Their notes are in `SP/vanta/v3/<P|G>/notes.json`.
- **G asks you:**
  - Continuous monitoring's significant-change trigger should name Increment 2's own IATT and ATO, not SSP 3 (B15).
  - The Review queue's Waiting on should show the current step's holder, now that decisions are recorded one step at a time.
- **P inserts setup tasks into My work, and G inserts conditions and requested decisions.** Your one inbox keeps them all.
