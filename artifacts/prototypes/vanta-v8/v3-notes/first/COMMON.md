# Prototype V3: shared brief

## What and why
Josef (product owner, DoD program assurance) had three agents walk the clickable prototype (v2) end to end. They logged 82 findings: 27 blockers, 39 major, 16 minor. A created program is a shell. Gate decisions rewrite their own deliverables. The same fact disagrees across two to five pages. The menu is not in the order the work is done. His words now: "fix all of these findings but do it in a V3 … in the Before and after so I can see what you're recommending before folding into the main prototype … and anything else that was uncovered bake that in."

**V3 is a layer over v2 that does nothing until the reader switches it on.** Off is the default, and v2 stays the main prototype until Josef approves. The Before & after page gets a V3 tab, built by the lead from your notes: walks through each fix, v2 and V3 screenshots, and a ledger of every finding. While V3 is on, the top bar has a switch, and **Compare with v2** draws v2's version of the current page beside it.

## Paths (SP = /private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad)
- **Source:** `SP/vanta/proto/`. Modules load in name order:
  - `core.js`, then the v1/v2 modules;
  - the v2 layers `mod-zzzz-v2-*.js`;
  - `mod-zzzz-v3-0core.js` (the lead's V3 core; **read its header first**, it is the API);
  - the V3 lanes' modules, `mod-zzzz-v3-<n><name>.js` + `.css`.
- **Build:** other lanes edit their modules in the same folder at the same time, so build with theirs left out and yours last. In `SP/vanta/proto`:
  ```sh
  python3 -I build.py v3-<YOU> $(ls mod-*.js | grep -v '^mod-zzzz-v3-[1-9]') <your module>.js
  ```
  This writes `out/v3-<YOU>.html`. Never write `out/prototype*.html`. The lead puts the lanes together.
- **The findings:**
  - `SP/vanta/review/A/findings.json` (create a program), `B/` (run and assess WS-X90), `C/` (duplication and the menu): `what`, `why`, `fix`, `evidence`.
  - The paths each reviewer took: `SP/vanta/review/<X>/path.json`. Their click scripts are in the same folders; `SP/vanta/review/B/lib.mjs` is a working helper.
  - The proposed menu and merges: `SP/vanta/review/C/order.json`.
  - The ground rules they walked by, with WS-X90's facts on Nov 17: `SP/vanta/review/REVIEW.md`.
- **Context:**
  - `SP/vanta/v2/COMMON.md`: which module draws which screen, and the visual budget. Ignore its build and editing rules; these replace them.
  - `SP/vanta/v2/GH.md`: the story (WS-X90, its increments, host systems).
  - The v2 layers' headers name their state and APIs: `PA.v2` in `-0core`, `PA.v2.chain` in `-1chain`, `PA.v2hubs` (current program, created programs) in `-2hubs`, `PA.v2reqs` in `-3reqs`, `PA.v2life` in `-8life`, `PA.v2host` in `-8host`, `PA.sctm` in `-7sctm`.
- **Your folder:** `SP/vanta/v3/<YOU>/`, for notes, scripts and screenshots.
- **Playwright:** `createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json")`, then `require("playwright")`. Open builds as `file://`. At the start: `sessionStorage.clear()`, `PA.v2.reset()`, then `PA.v3.set(true)`. Keep one page open for a whole flow; `page.goto` to a hash reloads the file and loses the session.

## How V3 code works
- **Wrap, don't edit.**
  - `PA.v3.S(route|RegExp, (orig, route) => html)` is V3's version of a screen; `orig()` draws it as before. `PA.v3.P(kind, (orig, id) => obj)` and `PA.v3.M(key, (orig, id) => obj)` do the same for previews and dialogs.
  - `PA.v3.screen(route, fn, nav)` adds a page only V3 has. `PA.v3.redirect(from, to)` folds a merged page into its new home.
  - With V3 off, all of these are inert. **Every document listener you add returns at once when `PA.v3.on()` is false.**
- **Composition.** Later lanes wrap earlier ones (name order), so your `orig()` may already be another lane's V3 page. Change what your findings need and pass the rest through.
- **Created programs belong to lane P.** A wrapper whose page depends on the program handles WS-X90 (`PA.v3.wsx()`) and returns `orig()` for any other program, unless your brief says the fix is for every program.
- **State.**
  - Write V3's new data in v2's session state (`PA.v2.set/get`) under `v3.<YOU>.…`, so `PA.v2.reset()` clears it and a reload keeps it.
  - Read v2's existing state for every fact (chain, life, hosts, requirements). Write to a v2 path only the shape v2 itself writes there.
  - Derive counts at draw time from the records they count, never from a stored number.
- **Facts for other lanes.** Register `PA.v3.facts.<name> = (…) => value`; read another lane's with `PA.v3.fact("<name>", …)`, which is undefined until registered. Your brief lists the facts you publish.
- **The menu.**
  - The V3 program menu is `PA.v3.menu`, from `review/C/order.json`: Overview and Lifecycle, then Prepare, Categorize & select, Implement, Assess, Authorize, Monitor, 27 entries.
  - Merged pages already redirect to their new home's main page (`PA.v3.MERGED`). The lane that owns the new home points the redirect at the right tab with `PA.v3.redirect(from, "<home>-<tab>")` and draws that tab.
  - Do not edit the menu. Ask in `asks.json` if it must change.
- **Never edit** `core.js`, `core.css`, any v1/v2 module, `mod-zzzz-v3-0core.*` or another lane's files.
  - If a hook is missing, work from outside: wrap a function on `PA`, patch the drawn DOM in `PA.v3.navDrawn(fn)`, or use a MutationObserver.
  - Write what you needed in `SP/vanta/v3/<YOU>/asks.json` (`[{ "need", "why", "workaround" }]`).
- **Look.**
  - V3 markup is not passed through v2's visual layer: write it in v2's look (`PA.AK` kit helpers, `PA.h`, the classes the screen around it uses).
  - The budget in `v2/COMMON.md` holds: one primary, one tone per status word, no tinted banners, no new gadgets in rows. Every page you change works at 390px with no sideways scroll.
  - Vocabulary is the app's: Operational issue, Assessment finding, the six control status words. Judge as an SSE, ISSM, SCA and AO would (DoDI 8510.01 RMF on a DoD acquisition life cycle).
- **No fake success.**
  - A dialog V3 offers changes the records, and every page that shows them follows.
  - A page you change keeps every working link and filter v2 had.
  - Prefer the smallest change that makes a finding convincingly gone over a redesign.
- **Scope.** Nothing outside `SP/vanta/proto/` (your files only) and `SP/vanta/v3/<YOU>/`. No git, no repo files, no servers, no network.

## Notes for the Before & after page
Keep `SP/vanta/v3/<YOU>/notes.json` current from your first fix, with a first version within 20 minutes:
```json
{ "findings": [{ "id": "A03", "status": "fixed|partly|not", "text": "what V3 does, plain words, ≤30 words", "why": "for partly or not: why, ≤25 words",
                 "see": { "route": "lifecycle", "prog": "wsx|created", "open": { "kind": "<preview kind>", "id": "<id>" }, "modal": "<dialog key>" } }],
  "extra": [{ "id": "<YOU>-x1", "text": "a change no finding named, ≤30 words", "see": { … } }],
  "walks": [{ "id": "<YOU>-w1", "title": "≤8 words", "findings": ["A01"], "prog": "wsx|created",
              "steps": [{ "route": "<route, or null to stay>", "do": "what to do, ≤25 words", "see": "what to look for, ≤25 words", "v2": "what v2 did instead, ≤20 words" }] }],
  "shots": [{ "id": "<YOU>-s1", "title": "≤8 words", "findings": ["B02"], "caption": "≤25 words", "v2": "v3/<YOU>/shots/<id>-v2.png", "v3": "v3/<YOU>/shots/<id>-v3.png" }] }
```
- **Findings.** Every finding your brief gives you gets an entry, including those you could only partly fix or not fix.
- **Walks.** One or two, each 5 to 10 steps, are what Josef follows with V3 on. A guide card shows him each step's `do` and `see` and opens its route.
- **Screenshots.** 2 to 4 scenes at a 1440×900 viewport: the same state drawn with V3 off and with V3 on, saved as the paths above. Take them in your walk script.

## Checks before you finish
1. Run `node --check` on your JS, then build.
2. Run `node SP/vanta/v3/offcheck.mjs SP/vanta/proto/out/v3-<YOU>.html`. It must say **0 differences and 0 page errors**: with V3 off, every screen, preview, dialog and the menu match the frozen v2 build. It takes about 15 seconds.
3. Write `SP/vanta/v3/<YOU>/walk.mjs`. With V3 on, it walks each fix through the UI and asserts what the user would see (values, rows, links landing where they say, state surviving a redraw), and reports page errors. Every assertion passes.
4. Open every route you touched with V3 on at 1440 and at 390 wide: no page errors, no sideways scroll.
- If the harness blocks writing a `.md`, write `.json` or `.txt`.
- Final message, at most 300 words: what you fixed, by finding id; what you fixed partly or not at all, and why; asks; check results. It is data for the lead, not prose for Josef.
