# V3, rethought: the model every lane builds to

Read `SP/vanta/v3r/CONTEXT.md` first (who Josef is, his feedback verbatim, where things are), then this, then your lane's brief.
SP = /private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad

## The decision
The first V3 arranged the program by process step: 27 pages, each a facet of something, most of them read-only, joined by "Open in …" links. Josef rejected it. V3 is now arranged by **record**: a program has ten places, each a kind of record; everything else is a tab, a rail category, a view or a section of one of them, and **the work is done on the record**.

Two independent readings agree on this model (the lead's, and `SP/vanta/v3r/ia/proposal.md`); Vanta's structure is in `SP/vanta/v3r/vanta/anatomy.md` (read its sections 3, 4, 5 and 8, and its twelve rules). What the last V3 does to a person doing a job is in `SP/vanta/v3r/walk/walk.json` and `inventory.json` when present.

## The program menu (already live in the build with V3 on)
Overview · System · Controls · Requirements · Evidence · Documents · Assessments · Findings · Risks · Authorization.

| Old page | New home | Lane |
|---|---|---|
| Lifecycle, Security engineering, Getting started | Overview: the strip opens in place; a gate opens in a panel | O |
| People & roles, Activity | Overview's tabs Team and Activity | O |
| Boundary | System, the Boundary view | S |
| Interconnections; Ports & protocols | System's Connections tab; a connection's rows | S |
| Composition, Inventory | System's Components tab; assets are a component's hardware rows | S |
| Host & providers, Inheritance | System's rail (Host system, Providers); a provider is a component outside the boundary | S |
| Baseline | Controls: a Baseline card, a Source on each control, Tailored out in the rail | C |
| Cyber resiliency, Posture | Controls: a Technique filter; a coverage view | C |
| Plans, Policies, ITCSC | Documents (rail: Plans, Policies, Categorization, Packages); a row opens the editor at once | D |
| STIG checklists, Evidence sources | Evidence (rail by kind; Sources) | D |
| Traceability | Requirements | D |
| Cyber T&E, Continuous monitoring, Checks, Schedule | Assessments (rail: Control assessments, Cyber tests, Monitoring checks) | E |
| POA&M | Findings: a finding owns its plan and milestones; the POA&M is the findings that have one (a chip and an export) | E |
| Threats | Risks' Threats tab | E |
| Package room | Authorization | E |

Lane letters: O overview, S system, C controls (the first wave); D documents, requirements and evidence, E assessments, findings, risks and authorization (the second wave).

## The rules (each one answers something Josef said)
1. **Do it here.** A record shows its related things as rows with their own Add, and a row is worked where it is shown. No "Open in Controls", no "Take it on Host & providers", no summary whose items open a page that redraws it. The only hop allowed is a record's name, which goes to that record.
2. **One click to the work.** A row opens the record's work surface: no preview, then ↗, then a page. A document's row opens its editor.
3. **Page or panel.** A record that holds lists to work through is a **page** with counted tabs (component, document, assessment, authorization, the program). A record that mostly links things is a **side panel** over whatever list shows it (control, requirement, evidence, connection, finding, risk, gate), and everything in the panel is doable there. A panel may have an Open button to a fuller page when one exists.
4. **Tabs split objects, a rail splits kinds, chips split states.** A page's tabs are different record kinds it owns (a component's Software & firmware, Connections, Controls, Requirements). A rail's categories are kinds or containers of one record (families, subsystems, document kinds). Chips are states (No evidence 185). Never a second level of tabs.
5. **Every number is a filter.** A count opens its list on exactly those records, on the same page when the list is there.
6. **One home a fact.** Elsewhere the fact is the record's name, opening its panel. What is added or changed in one place shows everywhere that reads it, at once (derive at draw time).
7. **One next step, doable.** Each record and each gate says the one thing that moves it forward, with the button that does it (`K.next`).
8. **A way back.** Work that starts from a gate's deliverable or from My work opens with the return bar (`K.task.start`): "Back to PDR · 2 connections without an agreement · 1 of 2 · Next".
9. **One word.** "Component", never "element" (subsystems and LRUs are components; so are the host, a provider and a connected system, outside the boundary). "Connection" for an interconnection. "Document" for a plan or a policy.
10. **Calm.** One primary a page. Statuses in words, one tone each. No tiles of controls, no tinted banners, no second summary of the same numbers, no count badges in the menu. Rows read name over one grey line.

## The page shapes: use the kit, write no page chrome of your own
`SP/vanta/proto/mod-zzzz-v3-1kit.js` is the API (**read its header**); `SP/vanta/proto/demo-k3.js` is a working page, record and panel in 50 lines; `SP/vanta/v3r/look/kit-1.jpg` is how it draws.
- **List:** `K.page({ head: K.head({ title, actions }), tabs?, body: K.split(K.rail(…), [K.cards(K.completion(…), K.attention(…)), K.chips(…), K.toolbar(…), K.table(…)]) })`. Not every list needs every part: a rail only where there are kinds, cards only where the numbers lead somewhere.
- **Record page:** `K.head` with `crumbs` to its list and its container, title, code, status chip, one primary and `K.menu("More", …)`; `K.tabs` with counts; on its Overview `K.aside([…], [K.details("Details", …)])`; on every other tab a toolbar and a table with that tab's Add.
- **Related things** on a record: `K.related({ title, add, cols, rows, empty })`, the same card everywhere.
- **Side panel:** `K.panel(kind, id => ({ label, title, code, chip, actions, page, facts, sections }))`; rows open it with `{ panel: kind, id }`.
- **Adding and linking:** rows the record owns (firmware, a port, a milestone) through `K.form`; records it links (controls, requirements, evidence, components) through `K.pick`, whose first line is `create` (Create requirement), and whose items already linked say `held: "Added"`; removing through `K.confirm` naming what else it touches. After each: the data changes, `K.redraw()`, a toast, the same place.
- **Addresses:** `K.screen(route, draw, navEntry)` for a page, `K.lazy(/^component--([\w-]+)(?:--(\w+))?$/, draw, "system")` for records and their tabs. Filters, the rail choice and the view live in `K.get/K.set` so a redraw and Back keep them.
- **Data you create** lives under `K.get/K.set/K.push/K.drop/K.patch` (session; Reset clears it). Seed nothing there: read WS-X90's records from where they are and overlay what the reader added, changed or removed.
- If the kit lacks a part, write it in your own CSS with the kit's look and say so in `asks.json`; do not fork the kit.

## Where the data is
Read it; do not copy it into your module. Open the build and inspect before you write.
- `PA.SSP`: `controls` (560: code, title, family, status, narrative, …), `families`, `elements` (27), `interconnections`, `ppsm`, `sections`, `revisions`; `PA.SSP.ctl(code)`.
- `PA.v7p`: `EBY` (every component by code), `COMP`, `REQS`, `ctlOf`, `cover`, `owner`.
- `PA.v8bIC` (the nine interconnections, with flows, encryption, agreement), `PA.v2host` (providers, `responsibility(code)`, `offersOf`, `takes`, `counts()`), `PA.v2life` (`steps`, `step`, `stage`), `PA.v2reqs`, `PA.sctm`, `PA.v2hubs` (the current program), `PA.v8people`.
- `PA.v3.fact(name, …)`: the first V3's one-source-per-fact registry: program, lifeDue, authorizations, conditions, gate, outcome, controls, status, objectives, finding, issues, risks, poam, evidence, requirements, setup, people, snapshots, techniques, customer, campaignOf, results, ownerOf, mc2, imports, checks, inbox, workspaceSetup. Shapes: the headers of `mod-zzzz-v3-2program.js` … `-7more.js` and `SP/vanta/v3/<P|G|F|R|W|X>/notes.json`. **Counts come from these, never from a number typed in markup.**
- The existing previews (`PA.P` kinds such as `v7p-req`, `a-tests-control`, `v7p-el`) and dialogs (`PA.M`) still work: a row may open one where it already does the job; where it has an "Open in …" hop or is read-only, replace it with a kit panel.
- The earlier V3 lanes' fixes (gates read their deliverables, assessment by objective, one inbox, created programs) stay loaded under you. Your page **replaces** the pages it folds, so anything those lanes did on a folded page that still matters must be on your page (their `notes.json` lists what they did, by finding id).

## What the lanes share
A lane publishes what the others read as facts (`PA.v3.facts.<name> = fn`; read with `PA.v3.fact("<name>", …)`, which is undefined when that lane is not in the build: fall back to the source data, never crash).
- **S publishes:** `components()` → `[{ code, name, kind, boundary: "inside|host|provider|connected", parent }]`, the reader's additions included; `component(code)`; `controlsOf(componentCode)` → control codes placed there; `componentsOf(controlCode)`; `place(componentCode, controlCode)` and `unplace(…)`; `connections()`.
- **C publishes:** `baseline()` → `{ total, layers: [{ name, added, removed, count, on }], added: [codes], removed: [codes] }`; `control(code)` → `{ code, title, family, status, source, responsibility, inBaseline }`; `impl(controlCode, componentCode)` → `{ status, text }` and `setImpl(controlCode, componentCode, { status, text })`. C also keeps `fact("controls")` and `fact("status")` true after a control is tailored in or out.
- **O publishes:** `nextGate()` → `{ id, name, due, ready, total }`.
- **The control's side panel is C's:** kind `k3c-control`, id `"AC-2"`, or `"AC-2@CN-109101"` when opened from a component (it then leads with that component's implementation). S opens it from a component's Controls tab; in a build without C, S draws its own small panel instead.
- **The component's page is S's:** `component--<code>`. Any lane naming a component links there (`K.link(name, "component--" + code)`).
- **Opening exactly some records:** to send a person to a list on a filter, set the list's view in the kit's session data and go there; each lane documents its view shape at the top of its module (S: `K.set("sys.view", …)`, C: `K.set("ctl.view", …)`), and takes `PA.v2.take(route)` questions where the old page did.

## How V3 code works
- Your module is `SP/vanta/proto/mod-zzzz-v3-8<letter>-<name>.js` and `.css` (they load after the kit, the earlier lanes and `mod-zzzz-v3-8a-shell.js`). CSS prefix `k3<letter>-`. Everything is inert while V3 is off: pages come from `K.screen`/`K.lazy`, and any document listener of your own returns at once when `PA.v3.on()` is false.
- **Folding a page:** draw the new home, then `PA.v3.redirect("boundary", "system-boundary")` (a RegExp catches its tab addresses: `PA.v3.redirect(/^composition(-|$)/, "system")`), and `PA.v3.compareAs("system", "composition")` so Compare with v2 draws the old page beside yours.
- **Another program than WS-X90** (`!PA.v3.wsx()`; created programs are lane P's, `SP/vanta/v3/P/notes.json`): never show WS-X90's records. Draw the same page from that program's data where it has any, else the page's empty state with its working Add. Store what is added per program (`K.get("p." + PA.v3.prog() + ".…")`).
- Never edit `core.js`, `core.css`, any v1/v2 module, `mod-zzzz-v3-0core.*`, `-1kit.*`, `-8a-shell.*` or another lane's files. If you need a hook, work from outside and write the need in `asks.json`.
- Build, in `SP/vanta/proto` (other lanes are editing their own modules beside you, so leave theirs out):
  ```sh
  python3 -I build.py v3r-<LETTER> $(ls mod-*.js | grep -v '^mod-zzzz-v3-8[b-z]') mod-zzzz-v3-8<letter>-<name>.js
  ```
  It writes `out/v3r-<LETTER>.html`. Never write `out/prototype*.html`.
- No git, no repo files, no servers, no network. Vanta's screenshots stay where they are.

## Pace
- **A first page drawing within 20 minutes** (the list, real data, no actions yet), then actions, then the record, then folding the old pages. Do not explore the old modules for an hour first: read only what you need for the data you are about to draw.
- Look at your own screenshots as you go (1440×900 and 390×800). Compare with `SP/vanta/v3r/ref/*.jpg` (Vanta's framework page, controls page and inventory page, local only). If a page looks busier than those, remove things.

## Checks before you finish
1. `node --check` your JS; build.
2. `node SP/vanta/v3/offcheck.mjs SP/vanta/proto/out/v3r-<LETTER>.html` says 0 differences and 0 page errors (V3 off still equals v2; about 15 s).
3. `SP/vanta/v3r/<LETTER>/walk.mjs`: with V3 on, through the UI, it does every flow in your brief and asserts what a person would see (the row added, the count changed here and on the other pages that show it, the panel's action done, Back returning, state surviving a redraw and a reload of the hash), and reports page errors. Every assertion passes. Recipe and examples: `SP/vanta/v3r/look/kit.mjs`, `shell.mjs`.
4. Every route you own, V3 on, at 1440 and at 390: no page errors, no sideways scroll, the program menu present and its entry marked.
5. Every old address you folded opens its new home.

## Hand back
- `SP/vanta/v3r/<LETTER>/notes.json`:
  ```json
  { "pages": [{ "route": "", "what": "≤20 words" }],
    "folded": [{ "old": "boundary", "now": "system-boundary", "how": "view|tab|rail|section|panel|gone", "kept": "what of the old page is still there, ≤20 words", "dropped": "what is not, and why" }],
    "inplace": [{ "on": "component", "can": "add firmware", "how": "form", "shows": ["System list count", "SSP §8"] }],
    "walks": [{ "id": "<LETTER>-w1", "title": "≤8 words", "steps": [{ "route": "<route or null>", "do": "≤25 words", "see": "≤25 words", "was": "what the last V3 did instead, ≤20 words" }] }],
    "shots": [{ "id": "<LETTER>-s1", "title": "≤8 words", "caption": "≤25 words", "was": "v3r/<LETTER>/shots/<id>-was.png", "now": "v3r/<LETTER>/shots/<id>-now.png" }],
    "open": ["what you could not do or are unsure of"] }
  ```
  Shots: 3 to 5 scenes at 1440×900, the last V3 (`SP/vanta/proto/out/prototype.html`, V3 on) beside yours, as PNG. Walks: one or two, 5 to 9 steps, for Josef to follow.
- Final message, at most 300 words: pages built, what was folded, what a person can now do in place, what is open, check results. Data for the lead, not prose for Josef.
