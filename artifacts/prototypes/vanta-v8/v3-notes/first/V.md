# V3 verifier: walk V3 again as the reviewers did

Read `SP/vanta/v3/COMMON.md` for paths and context; you change no code. Your folder: `SP/vanta/v3/V/`.

The build is `SP/vanta/proto/out/prototype-v3.html`: v2 with every V3 lane in it, as published to Josef (version 19). Treat that file as read-only.
- Lanes: P created programs, G gates and decisions, F one source per fact, R assessment, W inbox and merges, X earlier open items.
- Their notes are in `SP/vanta/v3/<lane>/notes.json`.
- The ledger Josef reads is Before & after › V3 (`#before-after-v3`), with its walks, and the V3 line on each card of About › Walkthrough findings.

## Steps
1. With V3 on (`PA.v3.set(true)` after `sessionStorage.clear()` and `PA.v2.reset()`), walk what the three reviewers walked, through the UI, as they did:
   - A: create a blank program and take it as far as it goes;
   - B: run and assess WS-X90 through its gates, assessment and authorization;
   - C: the duplication census.
   Their paths are in `SP/vanta/review/<A|B|C>/path.json`, their scripts in the same folders, and the ground rules in `SP/vanta/review/REVIEW.md`.
2. For each of the 82 findings, judge whether V3 fixes it, from what the screen shows:
   - fixed, partly or not;
   - the evidence: the step you took and the values you saw.
   Also check each lane's claim in its notes against your verdict.
3. Look for what V3 broke or added wrongly:
   - a dead end;
   - a number that disagrees between two V3 pages;
   - a link that lands on the wrong or an unfiltered page;
   - another program's data;
   - a dialog that says it saved and changed nothing;
   - a page that overflows at 390 wide.
   Only what V3 did; v2's own state with V3 off is out of scope.
4. Walk every walk in the lanes' notes, step by step as Josef will through the guide card: Before & after › V3 › Start walk. A step whose `do` cannot be done, or whose `see` is not what shows, is a finding.

## Pace
- Write `verdicts.json` early and keep it current.
- Use the reviewers' and the lanes' scripts (`SP/vanta/review/<X>/`, `SP/vanta/v3/<lane>/walk.mjs`) as starting points rather than writing from scratch.
- Aim to finish within about 75 minutes.

## Report
- `SP/vanta/v3/V/verdicts.json`: `[{ "id", "verdict": "fixed|partly|not", "lane_claim", "evidence" }]` for the 82.
- `SP/vanta/v3/V/new.json`: `[{ "id": "V01", "severity", "where", "what", "fix", "lane" }]`.
- Final message, at most 400 words: counts by verdict; where a lane's claim and your verdict differ; new findings ranked by severity, one line each. It is data for the lead.
