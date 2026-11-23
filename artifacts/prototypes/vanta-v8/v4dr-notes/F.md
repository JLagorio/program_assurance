# Lane F: checks and findings, after Drata (what automated compliance finds)

Read `COMMON.md` and `RECS.md` in this folder first. You write `SP/vanta/proto/mod-zzzz-v4-4chk.js` and `.css` (prefix `drf-`) and your folder `v4dr/F/`.

Recommendations you own: 12, 15, 16, 17, 18. You also use the kit's 19, 20 and 24. The kit (`PA.drk`, lane K) is ready: read its header comment for any optional arguments it added.

## Start by reading the current screens (V3 on)

- Find the checks: V3 or v2's Checks or continuous monitoring (`checks`, `conmon`, `-6work`), and STIG checklists (`stigs`).
- Find the findings and POA&M: `mod-zzzz-v3-8e-assure.js` (Findings with its kinds, a finding's page, POA&M as a view of Findings).
- Note the routes, and what a check and a finding show today.

## The after screens (new routes, your module)

1. **`dr-checks`: the checks register after.**
   - `K.toolbar` with saved views. The table: Name, Result (Passed, Failed, Error), Findings (count), Source, Controls (count), and State (Enabled, Draft, Unused, New).
   - A Draft check runs and shows a result, but reads "Doesn't count yet" in its state, and the list says drafts are left out of the program's numbers (rec 15).
   - Unused means the baseline needs it and its source isn't connected; it names the source (rec 17).
   - The list's actions include Library.
2. **`dr-check--<id>`: a check record after.**
   - `D.head`, then `D.numbers` with three tiles:
     - Track: "Days failing 52, since …";
     - Fix: "Failing resources N → View findings";
     - Manage: "POA&M items in progress N → Create POA&M item" (rec 12).
   - Tabs: Overview, Findings, Decisions, Controls, History.
   - Findings: the failing resources.
   - Decisions: an exclusion is a recorded decision, never a free Exclude. It is a false positive (with a reason), an operational requirement, or a risk acceptance, each signed by its role (the AO for a risk acceptance), with who, when and why, and an end date (leave behind Drata's free Exclude; say so in `conflicts`).
   - History: runs over twelve months.
   - A Draft check shows Publish, and editing a published check opens a new draft over it (rec 15).
3. **`dr-library` and `dr-library--<id>`: the checks library, a new screen.**
   - Templates (STIG rules, scanner policies, benchmark checks) with In use, Not in use and a Rating (Essential, Recommended), and Add to program as Draft or Published, with the chosen components.
   - A template's page lists "Checks using this template", with Manage on each copy (rec 16).
   - Use real STIG names from the prototype (`stigs`).
4. **`dr-finding--<id>`: a finding record after.**
   - `D.numbers`:
     - Track: "Days open …";
     - Fix: "Affected items N";
     - Manage: "Milestones in progress n of m" (rec 12).
   - Routing: the POA&M item goes to the owner of the system or component, with a fallback owner, and no second item while one is open for the same weakness. Show the rule and the one item it made (rec 18).
   - `D.dock` on the right with Notes, Tickets and Tasks, each pane docking beside the page (rec 24).
5. **The pairs in your notes.**
   - Checks register: current is today's checks list, after `dr-checks`.
   - Check record: current is today's check page or preview, after `dr-check--<id>`.
   - Library: `new: true`.
   - Finding record: current is V3's finding page, after `dr-finding--<id>`.
   - Exclusions as decisions: after is `dr-check--<id>` on Decisions; current is however V3 accepts a finding today.
   - Each pair has numbered changes, citing Drata images (`images/ux/monitoring/` for tests, the library and custom tests; search `screen` for "Test", "Findings", "Exclusions", "Library", "Next steps").

## Checks

COMMON's checks. Your walk also:
- publishes a draft and sees it start counting;
- records a false-positive decision with a reason;
- opens and closes each docked pane;
- adds a template to the program as a draft.

Hand back as COMMON says.
