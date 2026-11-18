# Version 7: redraw the remaining screens (shared rules)

Program Assurance is an RMF/GRC app for assessing and authorizing weapon systems. Josef, its founder, reviews a clickable prototype: one HTML page built from modules, in "Ledger, pushed toward Vanta".

Version 5 added a Before & after page. It redrew 39 screens closer to Vanta, as hidden routes `after-*`, on a shared kit. Version 6 added an SSP document editor, its version history and review, and a program creation walkthrough.

Josef's answer: "you cooked with all of this, let's fully refactor the artifact with all of these changes." So in version 7:

- The redrawn after screens become the real screens. The integrator, not you, promotes 23 of the navigation's screens.
- **You redraw the screens that never got an after version, in the same style**, so the whole prototype reads as one product. Three builders work in parallel, each on one area.

PROTO = `/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta/proto`
BA = `PROTO/../ba`
VANTA = `/Users/joseflagorio/Development/program_assurance-ux-proposal/docs/examples/products/vanta/images`. Use `index.json` there (id, file, area, screen, patterns) to find images.

## Read first, briefly

1. `PROTO/BRIEF.md`: the API (`window.PA`: S, P, M, ROUTE_NAV, h helpers, data). Skip its "register screen" recipe: that is the old pattern this version leaves behind.
2. `PROTO/mod-after-0kit.js` and `.css`: **the kit**, `window.PA.AK`. Use its pieces, and never draw your own versions. If you need a piece it lacks, build it in your module.
3. The after style, by example. View these images and skip their source:
   - `PROTO/out/ba/risk-register-after.png`
   - `controls-index-after.png`
   - `control-record-after.png`
   - `audit-record-after.png`
   - `people-register-after.png`
   - `inventory-after.png`
   - `getting-started-after.png`
   - `component-record-after.png`
4. Your screens as they are now (version 5). View `BA/ours/<route>.png` and `BA/ours/full/<route>.png`; some also have `--panel.png` or `--modal.png`. Their source is in the module your brief names. Those files are large, so grep for the parts you need (the data and the real values) and never print them whole.
5. `PROTO/mod-a-ssp-data.js`, header comment only. It is about 450 KB, so never print it. Inspect it with `cd PROTO && node ssp-peek.js`. It gives you:
   - `PA.SSP`: WS-X90's SSP data, including control statuses, elements, roles and people;
   - `PA.SSP.ui.toast`;
   - `PA.fullWindow`;
   - **`PA.own`**.

## How your screens replace the old ones

- **Keep the existing route names**, listed in your brief, so every link elsewhere keeps working. Define `S["<route>"]` in your module. It loads after the old modules, so it replaces them.
- **Call `PA.own([...])` with every route you define.** The integrator's last module then won't alias anything over yours.
- Set `ROUTE_NAV["<sub-route>"] = "<nav item>"` for your sub-routes and tabs.
- Your files: `PROTO/mod-v7-<area>.js` and `.css`, with your brief's CSS prefix.
  - Don't edit any other file.
  - Don't redefine `P` or `M` keys you didn't create; prefix yours.
  - Redraw what the old screen showed: the same real content and numbers, so nothing is lost.

## The style: what the 184 checked changes taught

- **Summary cards only where they earn their place.** Vanta puts cards on only eight pages: Tests, Controls, vulnerability deadlines, access reviews, a framework's page, the auditor's audit list, the Trust Center overview and Home. Elsewhere it opens on **counted tabs** (`AK.tabs`), or **one banner** (`AK.banner`), or goes **straight to the table**.
  - Our old card pair (`h.completion` + `h.attention`) is gone unless a screen genuinely needs one number first.
- **Index pages:** `AK.indexHead` (title, a one-line description, at most one ink primary), then tabs or filters, then a framed table whose rows open a side panel (`P`).
- **Record pages:**
  - `AK.recordHead`: crumbs, title, a chip row, labelled facts and counted tabs. The facts include an owner chip (`AK.owner`, with Unassigned) and a due date (`AK.due`), plus status.
  - The body with `AK.withRail` details.
  - A counted **Comments** tab (`AK.comments`: oldest first, the composer below; split Internal and Assessor where an assessor reads it).
  - **Activity** (`AK.activity`).
- **Workflow pieces wherever a person acts:**
  - owners with a picker; due dates (red when late, "N days ago");
  - approval steps (`AK.approval`, "Pending approval from…"); reminders (`AK.remind`, "Last reminded on…");
  - a required reason on a status change (`M["ak-reason"]`); a light bulk bar (`AK.bulk`);
  - tasks (`AK.task`); request states (`AK.request`).
- **Calm:**
  - white surfaces, thin lines, generous spacing;
  - one ink primary per screen, quiet secondary buttons;
  - status pills with glyphs (`h.pill`);
  - sentence case, RMF's words, numbers over prose, one line per table cell.
  - No `AK.co(...)` callouts: they belonged to the comparison page.
- **Keep what Program Assurance has that Vanta lacks** (RMF, control objectives, posture, resiliency, traceability, inheritance, products, shared components, SBOMs and CVEs, eMASS, STIGs, cyber T&E). Draw it with the same calm parts.

## Data: real first, examples marked

- Read real values from the old screens' source.
- Also from `PA.data` (core: TODAY, PROGRAMS, CONTROLS, REQS, EVIDENCE, ISSUES, RISKS, POAM, ASSETS, CAMPAIGNS) and `PA.SSP`.
- The local database is open with SELECT only, never a write: `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -At -F'|' -c "select …"`. WS-X90's program id is `5b834025-4245-5e6b-81a0-98538930a36c`, in tenant `80ad4373-c1c2-4f1a-b9f1-cbb63980459d`.
- Mark invented things with `<span class="ex">Example</span>`, and put one `AK.note("…")` line on each screen saying what is invented.
- Today is **Tuesday, Nov 17, 2026**, and the user is **Ingrid Solberg**, security engineer.

## Link the whole product together

Use the canonical routes. After promotion, these are the after screens:

- **Work:** `home`, `getting-started`, `my-work`, `review-queue`, `schedule`, `notifications`, `reports`, `ai-drafts`
- **Checks and controls:** `checks` (Checks), `controls`, `control-si2` (a control's record)
- **Frameworks and assessments:** `frameworks`, `assessments`, `campaign` (an assessment's record)
- **Evidence and policies:** `evidence`, `policies`, `integrations`, `sources`
- **People and inventory:** `people`, `people-access`, `inventory`, `inventory-changes`
- **Risk and suppliers:** `risks`, `findings`, `poam`, `suppliers`, `package-room`, `data-calls`
- **Version 6 screens:**
  - `ssps` (the SSP register) and `ssp` (the SSP document editor, full window, WS-X90's revision 3);
  - `ssp-history` and `ssp-review`;
  - `program-new` (Create program, a walkthrough) and `program-start`.

The other two builders own the remaining routes; their names are in each brief and are stable. Link to a route with `<span data-go="route">` or `href="#route"`.

## Check

- `node --check PROTO/mod-v7-<area>.js`.
- Build alone: `cd PROTO && python3 -I build.py v7-<area> mod-a-ssp-data.js mod-after-0kit.js mod-compliance.js mod-platform.js mod-risk.js mod-system.js mod-v7-<area>.js`. That includes the old modules, so you can see your screens replace them.
- `cd PROTO && node look.mjs v7-<area> <route> …` saves `out/v7-<area>-<route>.png` at 1440×900 and reports script errors, placeholders and overflow at 390. **View the PNGs.**
- Taller shots: `node BA/tools/shoot.mjs PROTO/out/v7-<area>.html <route> /private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/shots/<name>.png <width> <height>`. It prints `overflowX`, which must be false. Shoot at 1440 and 390.
- Click through panels, tabs and dialogs with a short Playwright script; copy look.mjs's first lines for the require.
- No script errors, and no horizontal overflow at 1440 or 390.

## Budget

Josef's usage credits have run out before on large runs. Work efficiently:

- don't print big files;
- view at most about 10 Vanta images;
- don't re-read what you've read.

Depth on each screen's main view beats extra tabs. Every route in your brief must draw, but a minor tab may be simpler.

## Final reply

Under 200 words:

- the routes drawn;
- what is real and what is marked Example;
- what you couldn't do;
- any piece beyond the kit.
