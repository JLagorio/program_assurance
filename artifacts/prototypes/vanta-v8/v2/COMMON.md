# Prototype v2: shared brief

## What and why
Josef (product owner) reviewed the clickable prototype (a single HTML file built from modules) against Vanta. A three-agent gap review found it 3.4/5 from Vanta: the workflows break down (52 of 74 dialogs change nothing, links land unfiltered, dead ↗ buttons, counts that disagree), and the screens add too many marks (dashed rings for empty values, one fact drawn up to four times, tinted banners, pre-ticked rows, gadgets in rows, one tone meaning many things). His words now: "make these changes … v2 … and then any missing screens obviously add." The current prototype becomes **v1**; you are building **v2**: the same prototype with the review's changes applied. A Before & after page will show each screen as Before / v1 / v2.

The repo's CLAUDE.md and docs/guides/product-patterns.md describe the real app. This prototype is a separate HTML mock-up that follows Vanta's look. Follow this brief and the budget below, not the app's pattern contract; keep the app's vocabulary (Operational issue, Assessment finding, Control status words, etc.).

## Paths (SP = /private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad)
- Source: `SP/vanta/proto/` — `core.js`, `core.css`, `mod-*.js` + matching `.css`, `shell.html`, `build.py`. Modules load in name order; `mod-zzz-canon.js` turns the old `after-*` routes into canonical names and wraps every screen, panel and dialog with a link rewrite.
- Build: `cd SP/vanta/proto && python3 -I build.py v2-<YOU>` writes `out/v2-<YOU>.html` (every `mod-*.js` included). Never write `out/prototype.html` or `out/prototype-v1.html`.
- v1 for comparison: `SP/vanta/proto/out/prototype-v1.html` (frozen) and its source `SP/vanta/proto-v1-src/`.
- Registries in `window.PA`: `S[route]()` returns a screen's HTML, `P[kind](id)` a preview `{label, body}`, `M[key](id)` a dialog `{title, body, footer}`; `PA.h` holds helpers (pill, tag, who, header, table…); `PA.navItems()` lists the 53 nav destinations. The core router (end of `core.js`) draws `#main`, `#panel` (preview, with a ↗ button) and `#modal`.
- Gap review (read the parts your brief names): `SP/vanta/gap/SUMMARY.md`; findings with screens, routes and fixes in `SP/vanta/gap/distance/findings.json` (A1–A22), `SP/vanta/gap/flows/findings.json` (B1–B17), `SP/vanta/gap/noise/findings.json` (N01–N19, plus `budget`, `ranking_top10`, `gadget_inventory`). Screenshots of v1 in each folder's `shots/`; the flows agent's click scripts and sweeps (dialogs, previews) in `SP/vanta/gap/flows/`.
- Your folder for notes and scratch files: `SP/vanta/v2/<YOU>/`.
- Playwright: `createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json")` then `require("playwright")`; open builds as `file://`. A screenshot helper: `node SP/vanta/ssp/shot9.mjs <html> <outDir> <width> route…`.

## Which module draws which screen (traced)
- `mod-after-work.js`: home, my-work, review-queue, reports, notifications, getting-started, schedule
- `mod-after-tests.js`: controls, checks, frameworks, assessments, control-si2, campaign
- `mod-after-docs.js`: evidence, policies, integrations, sources
- `mod-after-risk.js`: risks, findings, poam, suppliers, data-calls, package-room
- `mod-after-people.js`: people, inventory
- `mod-v7-org.js`: portfolio (Programs), products, components, deadlines, event-log, enclaves, common-controls
- `mod-v7-program.js`: overview, composition, baseline, requirements, authorization, conmon
- `mod-v7-analysis.js`: threats, posture, resiliency, traceability, inheritance, cyber-te
- `mod-v8-platform.js`: permissions, ai-drafts; `mod-v8-plans.js`: ssps; `mod-v8-boundary.js`: itcsc, interconnections, ppsm; `mod-v8-dod.js`: stigs, sse
- `mod-ssp-editor.js`: ssp (the SSP editor); `mod-program-new.js`: program-new (the Create program wizard), program-start
- `mod-v9-navlab.js`: the shell's rail, program menu and switcher (Josef chose this navigation, "option 3"), and the Navigation options page
A later module may wrap an earlier one's screen; check before editing.

## The budget (from the noise review)
- register: at most 2 summary cards and only where there is a completion measure; no banner; no per-row gadgets; at most 2 toned cells a row; empty prints "—"; at most 5 quick views and 4 filters on one line; 1 primary + at most 1 secondary + ⋯
- record: title + at most 1 status pill + at most 6 facts; at most 1 card above the tabs; no tinted callouts; at most 7 tabs in one strip; 1 primary; each fact once
- overview: one band of at most 4 numbers or 2 cards, plus one chart; colour only inside that chart
- home: one card a program (%, green bar, N of M); at most 1 grey callout; no pills
- inbox (My work, notifications): rows only: icon, title, grey meta, avatar; one state word; ticket keys grey
- editor: colour only for save state, open comments and sections that need action; 1 primary
- settings: lists and rules; On/Off the only pills; no charts
- panel: 1 pill in the header, 1 primary, at most 4 tabs, at most 3 cards
- everywhere: one tone per status word; blue only for links and selection; tinted fills only inside pills; 8 type size/weight pairs

## Rules
- Edit only the files your brief gives you. Other agents edit other files in the same folder at the same time. On an existing file use the Edit tool (exact replacements); never overwrite a whole existing file (no Write, `sed -i` or scripted rewrites of it).
- New screens and routes you add go through `PA.canon.rewrite(html)` (your module loads after the canon layer) and, if defined at draw time, `PA.v2clean(html, route)` (the visual layer, see below).
- Nothing outside `SP/vanta/proto/` (your files) and `SP/vanta/v2/<YOU>/`. No git, no repo files, no servers, no network.
- The data is synthetic; EXAMPLE tags stay (styled grey by the visual layer).
- Every screen you change works at 390px wide with no sideways page scroll.
- Before you finish: `node --check` your JS; build; open your build and every route you touched with no page errors (`page.on("pageerror")`); then run `node SP/vanta/ssp/flows7.mjs <build>`, `node SP/vanta/ssp/flows8.mjs <build>` and `node SP/vanta/ssp/probe-v9.mjs <build> SP/vanta/v2/<YOU>/probe`. For each failure say whether it is an intended v2 change (name the finding) or a break you caused (fix it).
- Notes for the Before & after page: keep `SP/vanta/v2/<YOU>/notes.json` up to date from your first change: a list of `{"route": "<canonical route>", "finding": "<id>", "text": "<what changed, plain words, at most 25 words>"}`, one entry per change per screen (a preview or dialog change uses the route it opens from plus `"where": "preview: <kind>"` or `"where": "dialog: <key>"`). Write a first version within 15 minutes.
- If the harness blocks writing a `.md`, write `.json` or `.txt`.
- Final message, at most 250 words: what changed, what is left undone and why, check results. It is data for the lead, not prose for Josef.
