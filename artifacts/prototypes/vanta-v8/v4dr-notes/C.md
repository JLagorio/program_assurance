# Lane C: sources, after Drata (what feeds automated compliance)

Read `COMMON.md` and `RECS.md` in this folder first. You write `SP/vanta/proto/mod-zzzz-v4-3src.js` and `.css` (prefix `drc-`) and your folder `v4dr/C/`.

Recommendations you own: 11, 13, 14. You also use the kit's 19, 20 and 27. The kit (`PA.drk`, lane K) is ready: read its header comment for any optional arguments it added.

## Start by reading the current screens (V3 on)

- Find where WS-X90's sources live today: scanners, STIG checklist imports, inventory exports, and integrations. Search `mod-zzzz-v3-6work.js` (W's "sources"), `mod-zzzz-v2-5work.js`, the system and component pages (`mod-zzzz-v3-8s-system.js`: the inventory and components) and Settings › Integrations.
- Note the routes, and what a source shows today.
- Find the component inventory, the people and accounts data, and the boundary (`boundary`, interconnections, host and providers). Your matching and your scope rules use them.

## The after screens (new routes, your module)

1. **`dr-sources`: the sources register after.**
   - `K.toolbar` with saved views. The table: Name, Kind (scanner, STIG checklist, inventory, ticketing, identity), Health (Healthy, or Error with the step that failed), Last run, and Evidences (`D.worth`-style counts: objectives of WS-X90's baseline it can evidence, and controls).
   - A source the baseline needs that isn't connected reads "Not connected" with the count it would evidence (rec 11). Derived counts go in `derived`.
2. **`dr-source--<id>`: a source record after.**
   - `D.head` (health in the facts).
   - Tabs: Overview, Scope, Matching, Runs.
   - Overview: `D.worth` ("Evidences 46 objectives · 12 controls · 3 components", each a link), the sync steps with their state, and what it last brought in (rec 11).
   - Scope: rules (regions or enclaves, then tag and name rules, each in or out) that write the authorization boundary as rules, with a live count of resources in and out. Apply runs `D.moving` first: "Moving 147 into scope · Not moving 12", with a consequence line ("findings on the 12 stop counting toward WS-X90") (rec 14, 27).
   - Matching: the scanner's assets against the component inventory (CM-8), or the identity source's accounts against people (AC-2).
     - An unmatched row reads "Not matched", with a picker in the cell (a component, or a person).
     - One line above the table names the consequence: "9 assets not matched · CM-8 objective b stays unevidenced". It is a warning line, not a tinted banner.
     - An account deleted at the source stays, with its "Access revoked" date (rec 13).
   - Pick a scanner source for the record pair, and show the identity source's Matching as a second pair if it reads well.
3. **The pairs in your notes.**
   - Sources register: current is where sources are listed today, after `dr-sources`.
   - Source record: current is today's source preview or page, after `dr-source--<id>`.
   - Scope rules: current is the boundary page today, after `dr-source--<id>` on Scope with the `D.moving` step open.
   - Matching: current is the inventory or people page today, after the Matching tab.
   - Each pair has numbered changes, citing Drata images (`images/ux/connections/`, and `images/ux/personnel/` for accounts and devices: search `screen` for "Connections", "Manage", "Benefits", "Link personnel", "scope").

## Checks

COMMON's checks. Your walk also:
- changes a scope rule and sees the counts move;
- applies through the counts step;
- matches one asset with the picker and sees the consequence line count fall.

Hand back as COMMON says.
