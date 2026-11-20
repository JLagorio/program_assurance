# Pass 2: three changes from Josef (20 Nov, after seeing the five lanes together)

His words:

> lets actually move to navigation 2 instead of 3.
> also I dont like these vertical tabs I think we can use horizontal. also the preview should be an on hover eye icon on table rows and clicking the row takes you to the show page

The lead has made all three in the shared layer. Your pages already draw with them. Your job is to make your lane right
on top of them, and to make your walk pass on the whole build.

## What the shared layer does now

**1. Navigation option 2** (`mod-zzzz-v3-8a-shell.js/.css`). One 240px sidebar with two levels, no icon rail. Inside a
program: `‹ Workspace` on top, the switcher, the ten places. `#nav a.item.on` still marks the place. Main is 64px wider.
Nothing for you to do unless a selector of yours read `#rail`.

**2. No vertical tabs** (`K.rail`, `K.split` in the kit). `K.split(rail, body)` stacks. `K.rail(...)` draws:
- up to 7 items with no nesting: a row of horizontal tabs over the body (`nav.k3-rail.k3-rtabs > button.k3-rail-i.k3-tab`,
  the current one `.on`). Under a page's own `K.tabs` it draws as a segmented switch, never a second row of tabs.
- more than 7 items, or nested ones: one dropdown put beside the page's other filters, after the search
  (`label.k3-flt.k3-rsel > select[data-k3-railsel]`; group heads are optgroups; choosing an option runs the item's act or go).
Look at every page of yours that had a rail. Fix what reads badly: the wrong first tab, a label that needed its group head,
a dropdown that lands on the wrong toolbar, a title that said "categories". You may pass fewer items, reorder them, or drop
the rail for a filter of your own. Never draw a list of categories down the side again.

**3. A row opens the record's page; an eye opens its preview** (`K.table`, `K.panel`, `K.record` in the kit).
- Every kind drawn with `K.panel(kind, fn)` now has a page at `<noun>--<id>`: control, requirement, artifact (evidence),
  finding, risk, technique, connection, gate. The kit draws it from your panel's own definition: title, code, chip and
  actions in the page header, `sections` in the body, `facts` as a Details card on the right. The program menu stays, your
  place marked. `K.recRoute(kind, id)` gives the address. `k3s-comp` goes to `component--<code>`.
- Your `fn` is called as `fn(id, { page: true })` for the page. Use it to give the page what a 520px panel could not hold
  (wider tables, a section left out of the preview, a better order). The result may add `crumbs`, `sub` and `side`
  (cards under Details).
- A `K.table` row `{ panel, id }` of such a kind is now `tr[data-go][data-id][data-rec=kind]`: a click goes to the page. An
  eye (`button.k3-eye[data-panel][data-id]`) sits at the end of the row's first value, shown on hover and focus, always on
  touch: it opens the preview. A row that already goes to a page (`go`) can name its preview: `peek: { panel, id }`.
- In the preview, v2's ↗ goes to the record's page (`data-v2r-full`). An "Open …" button shows only when your definition
  returns `page`.
- To draw the page yourself: call `K.record(kind, { noun, home: [label, route], nav })` before `K.panel` and register your
  own `K.lazy` route; or `K.record(kind, { route: (id) => "…" })` to send the row to a page you already have.

What that means for you:
- Anything you drew outside `K.table` that opens a preview on click (a name button, a card, a chip, a custom row) follows the
  same rule: the name goes to the page, the preview is an eye or nothing. Old v2 preview kinds with no page stay as they are.
- A flow that counted on the preview opening over the list (work through 14 controls, a return bar that reopens a panel)
  must read well with pages: the reader lands on the record's page, does the work there, and comes back by the breadcrumb,
  Back, or the return bar (`K.task`). Check each of your flows by hand.
- Make each record's page good as a page, not a stretched panel. The one primary action is in its header. Related rows have
  their own Add. No "Open in …".
- Rows inside a preview follow the same rule (click: page; eye: the nested preview).

## Rules that still hold

MODEL.md's ten rules. Edit only your own module, its CSS, your walk and your notes. Do not edit the kit, the shell, the
core or another lane's files: ask the lead in your hand-back (one line each). Other lanes are editing their own modules
while you work: if a build fails on a file that is not yours, wait a minute and build again.

## Build, check, hand back

- Build the whole thing, every module: `cd SP/vanta/proto && python3 -I build.py v3r2-<L>` → `out/v3r2-<L>.html`
  (SP = the scratchpad path in CONTEXT.md).
- `node SP/vanta/v3/offcheck.mjs out/v3r2-<L>.html` must still say differences 0.
- Your `walk.mjs` must pass on that build at 1440 and 390 (it now clicks an eye where it meant the preview, a row where it
  meant the page). Add steps for the three changes on your pages. The lead already adapted parts of your walk to the whole
  build (comments say where); keep those.
- Retake your scenes: "was" from `out/prototype-v19.html` with V3 on (the published version), "now" from your whole build.
  Same file names in `v3r/<L>/shots/`.
- Update `v3r/<L>/notes.json` (pages now include the record pages; walks' steps still work in the guide; what is open).
- Hand back in under 250 words: what you changed for each of the three, the checks' numbers, what you could not do.
