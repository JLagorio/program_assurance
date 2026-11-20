# V3 rethink: shared context

SP = /private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad

## Who and what
Josef is the product owner of Program Assurance: a GRC product for DoD programs (weapon systems under RMF, DoDI 8510.01, NIST SP 800-53/800-160). Its daily user is the system security engineer of one program (WS-X90, a mission system installed on an F-16), beside the ISSM, the assessor (SCA) and the authorizing official. Josef's reference for how a GRC product should look and move is **Vanta**.

The design lives in one clickable prototype (a single HTML file, plain JS modules, WS-X90's real data). It has two states: v2 (the main prototype) and **V3**, a switchable layer that fixed 82 walkthrough findings and reordered the program menu by RMF step (27 entries in six groups). Josef has just rejected V3.

## Josef's feedback on V3, verbatim (2026-11-20)
> oooo you made it worse. theres still no conitnuity. I cant edit the SSP or the workbook is gone. there are too many tabs doing simliar things instead of starting with higher level records and then diving into record details to do things with those. a good example is the lifecycle stages. why do we have a tab? if the stages show on the overview and clikcing them takes you to the lifecycle tab thats stupid and pointless. I get that we have all of this rich information to show but I dont think thats the right approach. maybe im wrong
>
> another issue is we have boundary, interconnections, ports & protocols, composition, host & proivders all kind of saying and doing similar things. then we have an element show page? like is that supposed to be a compoennt? and then when i view an element which should be called compoennt and lets say i want ot add software or firmare, i cant. if i want to edit the controls i cant. theres an open in controls button which is stupid. i add controls here. i add requimenets here.
>
> baseline makes sense but i hate the pill layout of all these controls. there has to be a more VANTA way to present this data. if im at the baseline and i click a family it takes me ot the controls page. idk i feel like controls + baseline are one in the same.
>
> idk these issues are everywhere. I need you to use agents. go back to vanta and really think thorugh v3.

## Things he said earlier that still hold
- "ideally a program is just a record you do a lot of things in."
- "I like the way their [Vanta's] product looks": push the style hard toward Vanta "while still keeping this feeling that we have with Ledger" (our design system).
- An earlier version "doesn't look like Vanta and we're using the same pattern everywhere" (every page was the same register).
- "looks good but some of the UI is a little overwhelming with visual cues."
- He liked: the SSP as a live document editor (Google Docs-like), the program creation wizard, the SCTM workbook (a full-window spreadsheet of controls, implementation, requirements, evidence, findings, risk).
- A requirement's chain belongs in the requirement, not in its own record page ("it's part of the requirements").
- The lifecycle: DoD phases and gates (milestones, engineering reviews, RMF actions) with deliverables that are the program's own records. Host systems (the F-16) give inherited controls; the authorization boundary is "whatever is in the bubble".

## What the lead saw in V3 today (facts, not conclusions to adopt)
- Program menu, V3 on: Overview, Lifecycle; Prepare: People & roles, Boundary, Interconnections, Ports & protocols, Composition, Host & providers; Categorize & select: ITCSC, Baseline, Threats, Cyber resiliency; Implement: Requirements, Evidence, Controls, Plans, Policies, STIG checklists; Assess: Assessments, Cyber T&E, Findings; Authorize: POA&M, Risks, Authorization; Monitor: Continuous monitoring, Posture, Activity.
- Overview's stage strip links to the Lifecycle page, which draws the same strip again above a table.
- Plans: clicking "System security plan" opens a side preview; the editor (route `ssp`) is one more click behind a ↗.
- The SCTM workbook (route `sctm`) left the menu; it is a secondary button, "Open as spreadsheet", on Controls.
- An element's page (`rec--v7p-el--CN-109101`, titled "Element") lists its software and firmware read-only, "Controls it carries 98 · Open in Controls", "Requirements 102 · Open in Requirements". Its only actions are Edit element and Review version 2.
- Baseline: a stack table, then a grid of 18 family tiles; a tile opens the Controls page.

## Where things are
- The prototype build: `SP/vanta/proto/out/prototype.html`. Open it as `file://` with Playwright:
  ```js
  import { createRequire } from "module";
  const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
  const { chromium } = require("playwright");
  // goto("file://…/prototype.html#overview"), wait 700 ms, then:
  // page.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); })
  // Move with page.evaluate(r => { location.hash = r }, route) and wait 450 ms. page.goto to a hash reloads the file and loses the session.
  // Rows that open a side preview carry data-panel="<kind>" data-id="<id>"; the preview draws in #panel; a record page is #rec--<kind>--<id>. The page is #main, the program menu #nav.
  ```
  Working examples: `SP/vanta/v3r/look/shots.mjs`, `probe.mjs`, `el.mjs`.
- Source modules (read-only for you): `SP/vanta/proto/` (`core.js`, `mod-*.js`).
- Vanta research (our own notes on Vanta's public help center, plus its screenshots): `/Users/joseflagorio/Development/program_assurance-ux-proposal/docs/products/vanta/`: `README.md` (start here), `pages/*.md` (29 page notes), `journey.md`, `style.md`, `help-center/notes/*.md` (four long notes), `images/ux/<area>/*.png` (1,424 product screenshots by area; `images/README.md`, `images/index.json`).
  - **Before reading a screenshot, downscale it** into your own folder: `sips -Z 1400 -s format jpeg -s formatOptions 55 <png> --out <your folder>/<name>.jpg`, then Read the jpg.
  - Vanta's screenshots never leave this machine: do not copy them anywhere but your folder, and never into `SP/vanta/proto`.
- The domain, if you need it: the repo's `docs/products.md`, `docs/system-assurance-workflow.md`, `docs/control-baseline.md` (in `/Users/joseflagorio/Development/program_assurance-design-system`).

## Rules
- Write only inside your own folder under `SP/vanta/v3r/`. Change nothing in `SP/vanta/proto`, nothing in any git repository. No git, no servers, no ports.
- Screenshots you take of the prototype: JPEG, quality 60, 1440×900.
- Your final message is data for the lead designer, not prose for Josef. Keep to the word limit in your brief. Say what you could not determine.
