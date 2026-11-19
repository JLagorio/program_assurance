# Prototype modules: shared brief

Program Assurance is an RMF/GRC app for assessing and authorizing weapon systems and other assets. Its founder, Josef, will review this prototype as a whole and give feedback. It is a full-window clickable mock-up of the app in a new direction, "Ledger, pushed toward Vanta". Ledger is the app's design system and Vanta is a commercial GRC product he admires. The prototype must reach parity with Vanta's important product areas and keep everything Program Assurance has that Vanta lacks.

## Files (folder: this BRIEF's folder, `.../scratchpad/vanta/proto/`)

- `core.css`, `core.js`, `shell.html`, `meta.html`, `study.html`: the core. **Read them, never edit them.**
- Your module: `mod-<name>.js`, and optionally `mod-<name>.css`. Write only your own files. Prefix your CSS classes with your module name.
- Build your module alone: `python3 -I build.py <name> mod-<name>.js` writes `out/<name>.html`.
- Look: `node look.mjs <name> <route> [<route> …]` saves `out/<name>-<route>.png` at 1440px. It also reports a placeholder, any overflow at 390px, and script errors. Read some of the PNGs to check your work.
- Syntax: the build fails loudly if your JS doesn't parse. Also run `node --check mod-<name>.js`.

## The API (`window.PA`, set by core.js before modules run)

```js
const { S, P, M, MODED, ROUTE_NAV, icons, data, h } = window.PA;
```

- **Screens:** `S["route"] = () => html`. The nav already lists every route (see NAV in core.js). A route with no screen shows "Not drawn yet".
- **Sub-pages and tabs:** give each one its own route (`S["findings-vulns"]`) and set `ROUTE_NAV["findings-vulns"] = "findings"` so the nav marks the parent. Link a tab with `<span data-go="findings-vulns">…</span>`. Route names use ASCII letters, digits and hyphens only.
- **Side panels:** `P["kind"] = (id) => ({ label: "Risk preview", body: html })`. Any element with `data-panel="kind" data-id="…"` opens one. `h.table(…, panelKey)` wires its rows.
- **Dialogs:** `M["key"] = (id) => ({ title, body, footer })`. Any element with `data-modal="key" data-id="…"` opens one. Footer buttons with `data-close-modal` close it. The default footer is Cancel.
- **Assessment mode** (the deep blue band replaces the top bar): `MODED.add("route")`.
- **Helpers** (`h`):
  - `page(...parts)`, `header(title, factsHtml, actionsHtml)`, `pair(a, b)`;
  - `completion({ title, total, done, unit, minis: [[label, n, of]], note, color })`;
  - `attention([[glyph, label, count, muted]], title)`;
  - `tools(search, [filters], extraHtml)`, `views([[label, count]])`, `table(cols, [{ id, cells: [html…] }], total, panelKey)`;
  - `pill(kind, text)`, where kind is ok, bad, warn, part, none or info;
  - `gl(glyph)`, where glyph is check, ring, clock, diamond, part or info;
  - `tag(text)`, `who(name | null)`, `bar(pct, color)`, `lane(title, status, startISO, endISO)`;
  - `sevPill(severity)`, `dueOf(openedISO, severity)`, `dueCell(date)`, `esc`, `fmt`, `pct`, `day(iso)`, `icon(route)`.
- **CSS classes ready in core.css:**
  - layout: `card`, `pcard`, `grid2`, `grid3`;
  - lists: `rows`/`row`, `next`, `sect`/`sh`/`sb`, `kv` (a dl);
  - navigation: `tabsx` (span.on, `.ct` counts), `wiz` (span.on and i), `lane`;
  - charts: `stack` + `legend` (spans with `--c`);
  - text: `ex` (the Example badge), `note-p`, `subhead`;
  - groups: `mwg`/`mwrow`, `chain`/`step`;
  - tables and controls: `frame` (tables), `btn`, `btn ink`, `btn sm`, `tag`, `pill`, `qv`, `flt`;
  - colour tokens: `var(--ok)`, `--bad`, `--warn`, `--info`, `--ink…`, `--line`, `--band`, `--mode`.
- **Data already loaded:** `data.TODAY` (2026-11-17), `PROGRAMS`, `CONTROLS`, `REQS`, `EVIDENCE`, `ISSUES`, `RISKS`, `POAM`, `ASSETS`, `CAMPAIGNS`, `SLA`.

## The look (follow it; it is what Josef liked)

- Read `../../` → `/Users/joseflagorio/Development/program_assurance-ux-proposal/docs/examples/products/vanta/style.md` §3. Look at `out/core-controls.png` for the finished register shape.
- **A register screen** has these parts, in order:
  1. a header (title, a facts line, at most one ink primary);
  2. a pair of cards: completion (one big %, a green bar, N of M) and Needs attention (lines by when or by gap, each with its glyph);
  3. quick views or tabs, then filters;
  4. a framed table whose rows open a side panel.
- **A record** opens beside the list first, as a panel whose sections are bordered cards. A full page is only for deep work.
- **Statuses** are round pills with glyphs, and the dashed ring means "nothing yet".
- **Words:** sentence case, RMF's vocabulary, numbers over prose, one line per table cell. Don't add new colours.

## Data: real first, examples marked

- The local database, read-only: `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -At -F'|' -c "select …"`. Run SELECT only, never anything that writes.
- WS-X90's program id is `5b834025-4245-5e6b-81a0-98538930a36c`, in tenant `80ad4373-c1c2-4f1a-b9f1-cbb63980459d`. CLAUDE.md in `/Users/joseflagorio/Development/program_assurance-ux-proposal/` describes the schema and its views. `src/` shows how the app reads them.
- Use real names and numbers. Where the data holds nothing for a feature the prototype proposes, draw a few plausible rows marked with `<span class="ex">Example</span>`, and say so in one `note-p` line on that screen. Never present an invented number as WS-X90's.
- RMF and DoD terms are welcome where real: eMASS, ACAS, STIG CAT I/II/III, IAVA/IAVB, SCA, CSSP, DoD 8140, CUI, cyber T&E phases, CVPA/AA, SCRM, SBOM/HBOM, CMMC, reciprocity, DATO.

## Done

- Every route you own draws, and has at least one panel or dialog where a reader would expect one.
- No overflow at 390px, no script errors, and `node --check` passes.
- Your final reply, under 200 words: the routes built, the data each read, what is marked Example, and anything you couldn't do.
