# Version 8: new capabilities (shared rules)

Program Assurance is an RMF/GRC app for assessing and authorizing weapon systems. Josef, its founder, reviews a clickable prototype: one HTML page built from modules, in "Ledger, pushed toward Vanta".

Version 7 is live: every screen is drawn in one calm style, on a shared kit, under canonical routes. Josef then asked for:
- search;
- tickets on records;
- per-person onboarding and offboarding;
- AI agents with an approval queue;
- a risk library;
- permission settings;
- the contingency, incident response and configuration management plans as live documents beside the SSP;
- an interconnection register (CA-3);
- a ports, protocols and services register;
- more DoD and NSA data: STIGs, NIST SP 800-160 for weapon systems, and the ITCSC with its import ("important for program onboarding too").

Four builders work in parallel, each on one area. Your brief names your area.

PROTO = `/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta/proto`
SHOTS = `/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/shots`
REPO = `/Users/joseflagorio/Development/program_assurance-design-system` (read only: never edit, commit or run its scripts)

## Read first, briefly

1. `PROTO/BRIEF.md`: the API (`window.PA`: S, P, M, ROUTE_NAV, h helpers, data). Skip its "register screen" recipe; it is the old pattern.
2. `PROTO/mod-after-0kit.js` and `.css`: **the kit**, `window.PA.AK`. Use its pieces and never draw your own versions. A piece it lacks goes in your module.
3. The style, by example: build the current prototype (below) and look at `home`, `controls`, `control-si2`, `campaign`, `risks`, `people`, `inventory`, `component-mc` and `overview` with `look.mjs`. View a few PNGs; don't read those modules whole.
4. `PROTO/mod-a-ssp-data.js`, header comment only. It is about 450 KB, so never print it. Inspect it with `cd PROTO && node ssp-peek.js`. It gives you:
   - `PA.SSP`: WS-X90's SSP data, with controls, statuses, elements, roles and people;
   - `PA.SSP.ui` (av, c, when, toast, diff);
   - `PA.fullWindow`;
   - `PA.own`, `PA.decorate`, `PA.decoratePanel`.

## How your work joins the prototype

- **Your files:** `PROTO/mod-v8-<area>.js` and `.css`, with your brief's CSS prefix. Edit another file only where your brief says so, and keep its behaviour and checks intact.
- **New routes:** define `S["<route>"]` and call `PA.own([...])` with every route you define. Set `ROUTE_NAV["<sub-route>"] = "<nav item>"` for sub-routes and tabs.
- **The navigation is done.** The integrator added the new nav items to core.js:
  - WS-X90: `itcsc` "ITCSC";
  - System: `stigs` "STIG checklists", `interconnections` "Interconnections", `ppsm` "Ports & protocols";
  - Analysis: `sse` "Security engineering";
  - Settings: `permissions` "Roles & permissions";
  - renamed: `ssps` now reads "Plans", and `ai-drafts` reads "AI agents".
  Don't edit core.js.
- **Adding to a screen another module draws:** `PA.decorate(route, (html, route) => newHtml)`, where route is a name or a RegExp without the g flag. For a panel, use `PA.decoratePanel(key, (html, id, key) => newHtml)`. The last module applies these to the final canonical screens, so write canonical links. Insert by finding a stable marker (a class, a heading) in the html; leave the html unchanged if the marker isn't there.
- **Prefixes:** keys you add to `P` and `M` start with your prefix. Never redefine one you didn't create.

## The style

- **Index pages:** `AK.indexHead` (title, one line, at most one ink primary), then counted tabs (`AK.tabs`) or one banner (`AK.banner`), then filters and a framed table whose rows open a side panel (`P`). Summary cards only where one number genuinely comes first.
- **Record pages:** `AK.recordHead` (crumbs, title, chips, labelled facts with an owner `AK.owner` and a due date `AK.due`, counted tabs). Then the body with `AK.withRail` details, a counted Comments tab (`AK.comments`: oldest first, the composer below) and Activity (`AK.activity`, newest first).
- **Workflow wherever a person acts:**
  - owners with a picker; due dates (red when late, "N days ago");
  - approvals (`AK.approval`); reminders (`AK.remind`);
  - a required reason on a status change (`M["ak-reason"]`); a bulk bar (`AK.bulk`);
  - tasks (`AK.task`); toasts (`PA.SSP.ui.toast` or `AK.toast`).
- **Calm:**
  - white surfaces, thin lines, one ink primary per screen;
  - status pills with glyphs (`h.pill`);
  - sentence case, numbers over prose, one line per table cell.
  - No `AK.co(...)` callouts.
- **RMF's words**, and DoD's where they apply: AO, ISSM, ISSO, SCA, PIT, NSS, CAT I/II/III, ISA, MOU, PPSM, DD Form 2875.

## Data: real first, examples marked

- **Sources, in order:**
  - the prototype's own data: `PA.data` (TODAY, PROGRAMS, CONTROLS, REQS, EVIDENCE, ISSUES, RISKS, POAM, ASSETS, CAMPAIGNS) and `PA.SSP`;
  - the v7 modules' data (grep them);
  - the local database, SELECT only and never a write: `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -At -F'|' -c "select …"`. WS-X90's program id is `5b834025-4245-5e6b-81a0-98538930a36c`, in tenant `80ad4373-c1c2-4f1a-b9f1-cbb63980459d`. If it doesn't answer, carry on without it;
  - public reference data your brief points to.
- **Invented things:** mark them with `<span class="ex">Example</span>`, and put one `AK.note("…")` line on each screen saying what is invented.
- **Today and the user:** today is **Tuesday, Nov 17, 2026**. The user is **Ingrid Solberg**, security engineer on WS-X90. People's names come from `PA.SSP` (R. Calloway AO, Joel Barrantes ISSM, Priya Raghavan ISSO, Ray Colston system owner, D. Okafor lead assessor, Nadia Fournier assessor).
- **Weapon system context:** WS-X90 is a Platform IT system and an NSS, categorized C High · I High · A Moderate. Its baseline is NIST SP 800-53 Rev 5 High plus CNSSI 1253, Mission Assurance, Deployed Platform and Customer A layers, then the program's tailoring (560 controls). It has 27 elements (`PA.SSP` elements) and is authorized with conditions until Sep 17, 2029.

## Canonical routes to link to

- **Work:** `home`, `getting-started`, `my-work`, `review-queue`, `schedule`, `notifications`, `reports`, `ai-drafts`
- **Program:** `overview`, `composition`, `inventory`, `sources`, `baseline`, `controls`, `control-si2`, `requirements`, `evidence`, `checks`, `policies`
- **Assess and authorize:** `assessments`, `campaign`, `cyber-te`, `authorization`, `package-room`, `conmon`
- **Risk:** `findings`, `poam`, `risks`, `threats`
- **Analysis:** `posture`, `resiliency`, `traceability`, `inheritance`
- **Organization:** `portfolio`, `products`, `components`, `component-mc`, `suppliers`, `people`, `people-roles`
- **Library and settings:** `frameworks`, `integrations`, `data-calls`, `deadlines`, `event-log`, `enclaves`, `common-controls`
- **Documents and creation:**
  - `ssps` (Plans) and `ssp` (the SSP editor, full window);
  - `ssp-history` and `ssp-review`;
  - `program-new` (Create program) and `program-start`.
- **New in version 8, by builder:**
  - **Platform:** `permissions`, `ai-drafts` (AI agents), `risks-library`; ⌘K search; tickets.
  - **Plans and people:** `ssps`, `plan-cp`, `plan-irp`, `plan-cmp` (+ `-history`); person pages `person-<slug>`.
  - **Boundary:** `itcsc`, `itcsc-import`, `interconnections`, `ppsm`.
  - **DoD data:** `stigs` (+ checklist pages), `sse`.

  Link to them freely: their names are stable, even before they draw.

## Check

- `node --check PROTO/mod-v8-<area>.js`.
- **Build with your module and every finished module.** Other builders' v8 files may be half-written, so leave them out:
  `cd PROTO && python3 -I build.py v8-<area> $( (ls mod-*.js | grep -v '^mod-v8-'; echo mod-v8-<area>.js) | sort )`
- `cd PROTO && node look.mjs v8-<area> <route> …` saves `out/v8-<area>-<route>.png` at 1440×900 and reports script errors, placeholders and overflow at 390. **View the PNGs.**
- Taller shots: `node PROTO/../ba/tools/shoot.mjs PROTO/out/v8-<area>.html <route> SHOTS/<name>.png <width> <height>`. It prints `overflowX`, which must be false. Shoot at 1440 and 390.
- `node PROTO/../ssp/audit7.mjs PROTO/out/v8-<area>.html`: none of your routes may show a placeholder, a dead link or a visible callout.
- Click through your panels, tabs and dialogs with a short Playwright script; copy look.mjs's first lines for the require.
- No script errors, and no horizontal overflow at 1440 or 390.

## Budget

Josef's usage credits have run out before on large runs. Work efficiently:
- don't print big files, and grep for what you need;
- view at most about 12 images in all;
- don't re-read what you've read;
- check with scripts before screenshots.

Depth on each main view beats extra tabs. Every route in your brief must draw, but a minor tab may be simpler.

## Final reply

Under 220 words:
- the routes drawn and what you added to others' screens;
- what is real (and its source) and what is marked Example;
- what you couldn't do;
- any piece beyond the kit.
