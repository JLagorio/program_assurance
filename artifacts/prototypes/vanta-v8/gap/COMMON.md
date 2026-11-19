# Gap review: shared brief (read first, then your own section below)

## Josef's question (2026-11-18, his words cleaned up)
"How far are we off from Vanta, where does the workflow break down, and where have we added too much:
colours, widgets and gadgets? It looks good, but some of the UI is a little overwhelming with visual cues."
He reads a screen by its shape first. He likes numbers over prose and one line per row. He wants
"Ledger pushed toward Vanta", bold, while keeping Ledger's feel. Earlier misses he named: "stat cards on
every register", "the same pattern everywhere", "no comments or workflow". Earlier he called the result
"world's better" and "looking much better". This is research: find what to cut, merge or change.

## What you are judging
- Our prototype, v9.1: `/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta/proto/out/prototype.html` (one file, hash routes; Josef reviews exactly this).
  `window.PA.navItems()` → [route, label] for all 53 nav pages; `PA.navKey(route)`.
  Program pages (WS-X90) show a second menu beside the icon rail; workspace pages show the rail only.
  Source to read: `/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta/proto/*.js|*.css` (`core.css` holds the tokens; `mod-zzz-canon.js` loads last).
- Screenshot helper: `node /private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta/ssp/shot9.mjs <html> <outDir> <width> route…` (Playwright is resolved
  from `/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json`; copy its two
  require lines into your own scripts). Click-through examples: `/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta/ssp/flows7.mjs`, `flows8.mjs`,
  `probe-v9.mjs`. In a script, change routes with `location.hash = …` inside the page; `page.goto` to
  a new hash reloads the file and wipes in-page state.

## Vanta, as researched (V = /Users/joseflagorio/Development/program_assurance-ux-proposal/docs/products/vanta)
- `V/README.md`: what makes Vanta feel simple, and the page map. `V/journey.md`: the end-to-end path.
- `V/style.md`: §1 Vanta's visual language, §2 us vs Vanta, §3 the direction we chose.
- `V/help-center/notes/*.md`: four deep notes (grc-core, platform-trust-team-risk, optimizing-your-workflow,
  integrations). `V/pages/*.md`: 29 page notes. Notes name the screenshots they describe.
- `V/images/ux/<area>/`: 1,424 product screenshots by area (home 10, my-work 5, controls 17, tests 97,
  documents 59, policies 86, risk 23, vendors 50, personnel 119, audits 41, frameworks 46, settings 115,
  integrations 426 …). `V/images/index.json` and `V/images/README.md` help find one. Look with Read.
- Prior verified comparison (v5 Before & after, 184 changes citing Vanta images):
  `/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta/ba/dev/{docs,people,risk,tests,work}.final.json`. Reuse it; don't redo it.

## Rules
- Read-only research. Write only under `/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta/gap/<your-folder>/`. Never edit the prototype, the
  repo, the Vanta folder or anything else; no git command that writes; no servers (file:// only, and
  never ports 3000, 8080, 6007 or 5432).
- Vanta's screenshots stay on this machine: cite them by path, never copy them into anything published.
- Budget: look at about 40 of our screenshots and about 40 Vanta images at most. Write a first complete
  draft of your findings file within your first ten minutes, then refine it. Stop when the findings
  stop changing; do not polish.
- Evidence: every finding names our screen (nav label and route, plus a screenshot path) and, for a
  Vanta comparison, a Vanta image path or note line. Mark anything you inferred as "judgment".
- Plain words, screen names as the nav reads them ("WS-X90 › Risk › Findings"), no jargon.

## Output
1. `/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta/gap/<your-folder>/report.md`: the detail, in your section's structure.
2. `/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta/gap/<your-folder>/findings.json`:
   `{ "findings": [ { "id", "screens": [], "routes": [], "kind", "we_do", "vanta_does", "severity":
   "high|medium|low", "fix": "one line, a verb first: cut / merge / move / restyle / rebuild",
   "ours": [paths], "vanta": [paths or note refs], "judgment": true|false } ], ...your extras }`
3. Your final message to the lead: at most 250 words. The five findings that matter most, in order,
   then anything you could not check.
