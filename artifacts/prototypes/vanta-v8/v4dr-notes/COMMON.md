# Drata round (v4dr): shared brief for every lane

SP = /private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad
The folder for this round is `SP/vanta/v4dr/`. The recommendations are in `RECS.md` there. Read it first: it is the job.

## Who and what

Josef owns Program Assurance, a GRC product for DoD programs: weapon systems under RMF and NIST SP 800-53. Its daily user is the system security engineer of one program, WS-X90: a mission system on an F-16. The design lives in one clickable prototype, a single HTML file made of plain JS modules, drawn on WS-X90's real data. It has two states:
- **v2**, the default;
- **V3**, a switchable layer arranged by record. V3 is the latest direction and has Josef's three rounds of feedback in it. "Current" in this round always means **the prototype with V3 on**.

Josef now wants a **Drata** tab in About › Before & after. For each recommendation it shows the current screen beside the screen after the recommendation, and it shows the new screens and new components, so he can see what is recommended. Your lane draws the "after" screens as **new, working routes** in the prototype. You change no existing screen.

## Josef's standing rules for any screen (do not break them)

- Numbers over prose. One line per table cell, rows about 40px, and no second line inside a cell.
- One toolbar row over every table: search, a saved-view menu, the filters, then the list's actions. A list's kinds are filters, never tabs or chips. Use `K.toolbar` from the V3 kit, which does all of this.
- Pages use the window's full width.
- A row click goes to the record's page. An eye on hover opens the preview, and a preview lists what its page lists.
- Horizontal line tabs only, never vertical tabs or a side rail of categories. One sidebar for navigation.
- Say "component", never "element". One primary per page. Statuses in words, one tone each. Calm: no tinted banners, no zero tiles, no count badges in the menu.
- A problem is loud: a warning word, or the one next step (`K.next`). An absence is silent.
- Where a Drata pattern conflicts with a rule here, the rule wins. Say how you resolved it in your notes (`conflicts`). The known case is the filter panel (rec 21) against the one-row toolbar. The resolution: the toolbar row stays, its Filter button opens and closes the panel beside the table, and there is no "Filters applied" chip row.

## The look

The prototype's V3 kit already draws "Ledger, pushed toward Vanta". Keep that. Take Drata's patterns, not Drata's brand:
- **No:** Drata's blue-outlined secondaries, gradients, magenta, seven pill tints, or illustrations.
- **AI:** marked the way the prototype already marks it. Find it in the build (`ai-drafts`, or the SSP editor's AI) and match it.
- **Read:** `docs/products/drata/style.md`, sections 1 and 3 ("For Ledger"). It is our study of Drata's look.
- **Screenshots:** Drata's own are in `docs/products/drata/images/ux/<area>/`, and `images/index.json` says what each shows. Before viewing one, downscale it into your own folder: `sips -Z 1400 -s format jpeg -s formatOptions 55 <png> --out SP/vanta/v4dr/<L>/<name>.jpg`, then Read the jpg. Never copy a Drata image anywhere else, and never into `SP/vanta/proto`. View at most 15.

## Where things are

- Source modules: `SP/vanta/proto/`.
  - `core.js`, and `mod-*.js` loaded in name order.
  - The V3 kit is `mod-zzzz-v3-1kit.js` and `.css` (`window.PA.v3k`, usually `K`). Its header comment is its API; read it.
  - V3's core is `mod-zzzz-v3-0core.js` (`PA.v3`). The V3 lanes are `mod-zzzz-v3-8*.js`: controls `-8c-controls`, documents/requirements/evidence `-8d-docs`, assessments/findings/risks/authorization `-8e-assure`, system `-8s-system`, overview `-8o-overview`. Sources and checks are in `-6work` (and v2's `mod-zzzz-v2-5work`).
  - Read the module for your area to reuse its data accessors. Never change it.
- Build everything: `cd SP/vanta/proto && python3 -I build.py v4dr-<L>`, which writes `out/v4dr-<L>.html`.
- Playwright, opening the build as `file://`:
  ```js
  import { createRequire } from "module";
  const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
  const { chromium } = require("playwright");
  // goto("file://…/out/v4dr-<L>.html#overview"), wait 700 ms, then
  // page.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); })
  // Move with page.evaluate(r => { location.hash = r }, route) and wait 450 ms. page.goto to a hash reloads and loses the session.
  ```
  - Working examples: `SP/vanta/v3r/look/shots.mjs` and `SP/vanta/v3r/p3/shots.mjs`.
  - Your screenshots: JPEG, quality 60, 1440×900, in your folder.
- Checks that already exist:
  - `node SP/vanta/v3/offcheck.mjs <build>`: V3 off must equal v2. Expect 0 differences from your module; the Before & after pages are the lead's.
  - `node SP/vanta/v3/sweep3.mjs <build> <json>`: every screen with V3 on, plus overflow at 390.

## Files you own (and nothing else)

| Lane | Module (in `SP/vanta/proto/`) | Folder |
|---|---|---|
| K, the kit and the components gallery | `mod-zzzz-v4-0drk.js` / `.css` | `v4dr/K/` |
| A, controls | `mod-zzzz-v4-1ctl.js` / `.css` | `v4dr/A/` |
| B, evidence | `mod-zzzz-v4-2evi.js` / `.css` | `v4dr/B/` |
| C, sources: what feeds automated compliance | `mod-zzzz-v4-3src.js` / `.css` | `v4dr/C/` |
| F, checks and findings: what it finds | `mod-zzzz-v4-4chk.js` / `.css` | `v4dr/F/` |
| lead, the Drata tab | `mod-zzzz-v4-9drba*.js` / `.css` | `v4dr/lead/` |

- Prefix every CSS class with your lane's prefix: `drk-`, `dra-`, `drb-`, `drc-`, `drf-`.
- Change nothing else: not the kit, the core, another lane's module, or anything of v2 or V3. If you need a change elsewhere, ask the lead in your hand-back, one line each.
- Other lanes are building at the same time. If the build breaks on a file that is not yours, wait a minute and build again. No git, no servers, no network.

## The Drata kit: `window.PA.drk` (written by lane K; A, B, C and F use it)

Every function returns an HTML string unless it says otherwise. The names and arguments are fixed, so lanes can call them before K has finished styling.
- **Routes**
  - `D.route(name, draw, { nav })`: an exact route.
  - `D.routeLike(prefix, draw(id), { nav })`: a record route, `<prefix>--<id>`.
  - Both register the route so that opening it with V3 off first switches V3 on with WS-X90 as the program. `nav` is the program menu key to highlight ("controls", "evidence", "sources", "checks", "findings" and so on).
- **`D.review({ title, current, back })`**: one neutral line at the top of every after page: "After · <title>", then "See current" (opens the `current` route with V3 on) and "Back to the Drata tab" (`back`, by default `before-after-drata`).
- **Identity and header**
  - `D.idChip(code, tone, { title, go })`: the code in monospace inside a round pill tinted by tone (ok, bad, warn, none, inh), with a glyph.
  - `D.tone(status)` maps the prototype's control status words or keys to a tone.
  - `D.head({ crumbs, id: { code, tone }, title, facts: [[label, html, editAct]], actions: { more, secondary, primary }, tabs })`: the header shape (rec 20). `tabs` is `D.tabs(...)` output.
  - `D.tabs([{ label, count, problem, route, act, on }])`: line tabs. A `problem` count shows as a pale red badge; a plain count is grey; a zero shows nothing.
- **Status and counts**
  - `D.stages({ done, total, unit, tip: [[label, n, of]], cards, uncounted })`: the bar ("6 of 11", tooltip from `tip`) over the cards.
    - `cards = [{ title, state, tone, legend: [{ label, n, tone, go, act }], empty: { line, label, go, act } }]`.
    - `uncounted = { n, label, go }` is the "not counted" line.
  - `D.stats([{ label, n, problem, go }])`: up to four plain tiles.
  - `D.numbers([{ label, metric, n, tone, since, links: [{ label, go, act }] }])`: Track / Fix / Manage.
  - `D.worth([{ label, n, go }], { title })`: what a source feeds, each number a link.
- **Registers**
  - `D.facets({ id, groups: [{ key, label, type: "radio"|"check", options: [[value, label, count]], value }], act })`: the panel, with `act(key, value)` called when a choice changes.
  - `D.withFacets(id, panel, body)` lays the panel beside the body. The toolbar's button that opens and closes it is `D.facetToggle(id)`: put it in `K.toolbar`'s `right`. The panel's state is kept per id, and it is closed by default below 1180px.
  - `D.selbar({ n, total, all, clear, verbs: [{ label, act, danger }] })`: the floating bar. Lanes draw it while rows are chosen.
- **Records**
  - `D.drawer({ pos, total, prev, next, status, title, open, facts, body })`: the content of a preview you can walk through. K decides how it sits in the V3 panel (`K.panel`), and says how in the API comment.
  - `D.dock({ id, items: [{ key, icon, label, count, pane }] })`: the right-edge rail. `pane` is a function returning HTML. Choosing an item docks its pane beside the page, and the page narrows.
  - `D.card({ id, title, facts: [[label, html]], fields: [{ key, label, value, type, options }], save })`: a card with its own Edit. `save(values)` is called and the card redraws.
  - `D.sunken(html)`: a record or overview body in the grey well, with white raised cards. Never use it on a register.
- **Flows**
  - `D.steps({ back, title, steps: [label], at, body, foot: { backAct, nextAct, nextLabel, nextDisabled } })`: a full-page flow with a vertical stepper.
  - `D.moving({ title, rows: [{ label, n, locked }], moving, notMoving, consequence })`: the counts shown before a command runs.
  - `D.sheet({ cols, rows: [{ cells, err: { [col]: message }, warn: { [col]: message } }], filter })`: the validation sheet, with All, Valid and Invalid counts.
  - `D.openCompare({ title, rows: [{ field, current, template }], confirm(selections) })` opens the dialog of three columns, with Apply or Reject on each field. It returns nothing.
- **AI**
  - `D.suggest({ confidence, title, rationale, source, actions: [{ label, act, primary }] })`: the confidence chip, the title, a one-line rationale and its source.
  - `D.proposal({ change, reasoning, approve, decline })`: an agent's proposal card.
- **The gallery**
  - `D.COMPONENTS = [{ id, name, rec: [n], what, ledger }]`.
  - `D.demo(id)` returns a live demo of one component.
  - The gallery page is route `dr-components`.

## What each lane writes: `v4dr/<L>/notes.json`

```json
{
  "lane": "A",
  "pairs": [{
    "id": "a-control-record",
    "title": "Control record",
    "group": "controls",
    "new": false,
    "current": { "route": "…", "panel": { "kind": "…", "id": "…" }, "click": "css selector", "scroll": "css selector", "note": "what it is today, one line" },
    "after":   { "route": "dr-…", "click": "css selector", "scroll": "css selector" },
    "changes": [{ "n": 1, "rec": 1, "title": "≤8 words", "text": "≤40 words: what changed on our screen", "drata": "≤30 words: what Drata does, in our words", "ev": ["images/ux/controls/<file>.png"] }]
  }],
  "components": [{ "id": "…", "rec": [1], "used": "where in the after screens" }],
  "derived": ["each value you derived because the prototype lacks it, and how"],
  "conflicts": ["a Drata pattern that met one of Josef's rules, and how you resolved it"],
  "open": ["what you could not do"]
}
```

- **Fields**
  - `group` is `controls`, `evidence`, `automation` or `ui`.
  - `new: true` marks a screen with no current counterpart. Leave out `current`, or point it at the nearest page that would hold it.
  - `current.panel` opens a preview before the shot, `click` clicks something (a dialog's button, say), and `scroll` scrolls something into view.
  - `ev` holds paths from Drata's `images/index.json` (the `file` field). The lead turns them into links to Drata's articles; the images themselves are never published.
- **Coverage.** Every recommendation your lane owns in RECS.md appears in at least one change.
- **Data.** Use WS-X90's real data in the prototype. Where a value does not exist (a renewal date, say), derive it deterministically from what does exist, and list it in `derived`. No `Math.random`. No invented records beyond what a derivation needs.
- **State.** Keep any change the reader makes with `K.set` and `K.get`, under the key `dr.<lane>.`. A button either does something visible, or opens a dialog that says it saves nothing in the prototype. No dead buttons.

## Your checks (all must pass before you hand back)

1. `node --check` on your module, and the build succeeds.
2. Write `v4dr/<L>/walk.mjs <build>`.
   - It opens every route of yours with V3 on, at 1440×900 and at 390×844, and fails on any console error, any page wider than the window, or any table cell taller than one line (except where `K.table` was told `wrap`).
   - It clicks every button and link on your pages once, and fails if a button does nothing at all.
   - Its first line prints the build it opened.
3. `offcheck` prints 0 differences outside the `before-after` routes.
4. Look at your pages. Take screenshots of each after route at 1440 into your folder, and view at most ten. Fix what reads badly. It has to look finished, and calmer than Drata.

## Hand-back

Your final message is data for the lead, under 200 words:
- your routes;
- the pairs and how many changes each has;
- which recommendations you covered;
- your walk's numbers;
- your asks to the lead.

Write the first working version of your module, with routes that draw, within your first 15 minutes, and build often. An earlier round lost 90 minutes to exploring without writing code.
