# Gap review, 2026-11-18: v9.1 against Vanta

Three agents (distance by screen family, workflows clicked through, colours and widgets measured), then the lead re-checked eight claims; all held.

## How far from Vanta: 3.4 out of 5
| Score | Screens |
|---|---|
| 4.5 | Home, Checks, Controls, Suppliers, Frameworks, the side panel |
| 4 | My work, Evidence, Findings, Policies, People, Integrations, assessment mode |
| 3.5 | Risks, POA&M, Programs |
| 3 | A control's page (two cards before its tabs), Create program, Review queue (seven stacked tables) |
| 2.5 | WS-X90 Overview (nine blocks; Vanta has one card and a list); the SSP editor (different on purpose) |
| 2 | Settings (a register under tabs; Vanta has a list of sections) |

Above Vanta's table we add a count line (19 pages), filter chips (22), a tinted banner (about 20) and pre-ticked rows that put the selection bar where the filters go (11 registers). Stat cards are down to Controls, Checks and Findings, matching Vanta.

## Where the workflow breaks
- 52 of 74 dialogs change nothing (27 toast, 25 just close, 22 close with required fields empty), including Map control, Link evidence, Plan an assessment, Publish results, Create POA&M item and Request acceptance. No control can reach satisfied; the AO step waits on results that never publish.
- My work and Home open lists unfiltered ("Treat 2 critical risks" → Risks, All 40).
- ↗ does nothing on 46 of 54 previews.
- Nine pairs of numbers disagree (Evidence 142 in the menu, 368 in the list; Requests 368 over a table of 14).
- A created program keeps WS-X90's menu and switcher, its Getting started opens WS-X90's pages, and it is gone once you leave.
- Works end to end: the Create program wizard, SSP edit → submit to the ISSM, offboarding.

## Where we've added too much
Not colour (0.46% of pixels against Vanta's 0.64%): marks, and tones without one meaning.
- Empty values as a dashed ring plus a word (34 on Risks above the fold); Vanta prints "—".
- One fact drawn up to four times (Checks: red pill, red flag, red date, red count).
- Tinted banners on 24 of 65 pages; Vanta grey ones on 2 of 13.
- 16 of 44 tables colour three or more cells a row; Vanta one or two.
- 129 progress bars, 54 rings, 40 stacked bars (18 on Baseline), a 0% donut on Controls.
- 190 amber EXAMPLE tags; a typical screen uses 12 type size/weight pairs, Vanta 7–8.
- Blue carries 14 status words; Not assessed is blue, amber or grey by page.
- Heaviest: campaign record, Overview, Controls, Policies, Checks.

Budget (noise/findings.json → budget): register ≤2 summary cards, no banner, ≤2 coloured cells a row, "—" for empty; record nothing between facts and tabs; overview one band and one chart; everywhere one tone per status word, blue only for links and selection.

## Proposed order (prototype only)
1. Cleanup pass (CSS and data). 2. The budget on the ten heaviest pages, Overview and Settings first. 3. Shared state so the chain is walkable; filtered My work rows; one source per count; a new program's own context.

Files: distance/, flows/, noise/ each hold findings.json and shots/; flows/ holds the click logs and the dialog, preview and control sweeps; noise/metrics.json the raw counts; lead/verify.mjs the re-checks.
