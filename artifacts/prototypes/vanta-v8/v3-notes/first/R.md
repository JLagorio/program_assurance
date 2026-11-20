# V3 lane R: assess and test by the book

Read `SP/vanta/v3/COMMON.md` first and follow it. Your files:
- `SP/vanta/proto/mod-zzzz-v3-5assess.js` and `.css`
- `SP/vanta/v3/R/`

Wave 1 has landed (all three), and its modules are in the folder:
- `mod-zzzz-v3-2program` (P: created programs);
- `-3gates` (G: Lifecycle, Authorization, decisions);
- `-4facts` (F: one source per fact, `PA.v3.facts`).

Read their `SP/vanta/v3/<P|G|F>/notes.json` and the facts they publish. **Build with them included**: leave out only the modules after yours.
```sh
python3 -I build.py v3-R $(ls mod-*.js | grep -v '^mod-zzzz-v3-[6-9]') mod-zzzz-v3-5assess.js
```
(Make sure yours is not listed twice.)

## Your findings (11)
B16, B17, B18, B19, B20, B21, B22, B24, B25, B28 and C13, in `SP/vanta/review/{B,C}/findings.json`. Reviewer B's walk is in `review/B/path.json`; its scripts, in `review/B/`, reproduce the assessment chain.

1. **Assessing by objective** (B18, B19, B20, B21)
   - A campaign lists each assessment objective with its methods (examine, interview, test).
   - A determination is recorded per objective, and the control's status is derived from its objectives. Not assessed holds until all are judged, as the app's contract says.
   - Evidence requests and determinations wait on the plan's approval (SCA, with the AO's concurrence). Controls are added through a plan revision.
   - Only the lead assessor publishes; others draft, and a draft recorded for someone says "recorded as D. Okafor".
   - One publish rule: each determination short of satisfied opens an operational issue, whichever campaign it belongs to.
2. **Names and lookups** (B16, B17)
   - Result batches are named by set or date ("Expanded set 1"), never "Increment"; Increment stays for acquisition increments. Fix every page that says it (wording only on pages other lanes own).
   - A control's page reads its campaign from every campaign's requests and plans, and offers Open assessment campaign when one holds it.
3. **Risks and their verbs** (B22, C13)
   - Create risk asks the response (Mitigate, Accept, Transfer). It defaults to Mitigate when a POA&M item answers the issue, and a risk can be created before its POA&M item.
   - Wire the verbs that answered "Not saved": Assign owner (risks, operational issues, POA&M items), Deactivate finding, Change planned date, Link ATT&CK technique.
   - An assigned owner shows wherever that record's owner shows. Check what F's people facts read; register `PA.v3.facts.ownerOf(kind, id)` if F reads it, or make F's counts follow by the route F documents in its notes.
4. **Cyber T&E** (B24, B25, B28)
   - Adversarial cybersecurity DT&E and the SA-24 resiliency exercise are scheduled after the IATT that authorizes the test configuration, or show that IATT as a prerequisite, with a warning.
   - Plan the test runs the same command Assessments' Plan an assessment runs.
   - A deliverable's owner is read from its campaign (SVR names Ingrid Solberg, as Cyber T&E does).

## Routes you own
- Your own: `assessments*`, `campaign*`, `cyber-te*`, `risks*`, `poam*`, and their dialogs.
- Shared with earlier lanes (compose on theirs, change only what your findings need):
  - `threats*` and `findings*` (F counts them);
  - `rec--a-tests-control--*` and the `a-tests-control` preview (F);
  - `lifecycle-svr-*` (G, B28's owner);
  - `authorization*` (G, B16's wording).
- Shared with lane W, working at the same time: `review-queue` (W adds paging). Change only the wording there.

Publish `PA.v3.facts.campaignOf(code)` and `fact("results")`.

## Walk and screenshots
- **Walk:** "Assess AC-2 by objective and publish as the lead assessor". Plan, approve the plan, judge each objective with its method, publish, then see the operational issue and the control's status move.
- **Scenes:**
  - Record determination: v2 one value per control, V3 per objective;
  - the campaign's objectives;
  - Create risk;
  - Cyber T&E's schedule.

## From lane F (landed)
- Read control status counts from `PA.v3.fact("controls", prog)` or `fact("status", code)`, never `PA.v2.chain.counts()`. chain.counts() over-counts increment 2 by 2 (39/68 against 37/70).
- F publishes `controls`, `status`, `objectives`, `finding`, `issues`, `risks`, `poam`, `evidence`, `requirements`, `setup`, `people`, `snapshots`, `techniques` and `customer`. Their shapes are in `SP/vanta/v3/F/notes.json` and the header of `mod-zzzz-v3-4facts.js`.
- WS-X90's customer is now "F-16 SPO" (C22): use F's `customer()`.

## From lanes P and G (landed)
- **P** (`-2program`): created programs. It publishes `PA.v3.facts.program(code)` and `lifeDue(code, step)`. Once every lane has loaded, F's facts answer created programs from P's records.
- **G** (`-3gates`): Lifecycle, decisions, Authorization. It publishes `authorizations(prog)`, `conditions(prog)`, `gate(id)` and `outcome(code, inc)`.
  - Security engineering redirects to `lifecycle-outcomes`, Package room to Authorization's Sharing tab.
  - Decisions are recorded one step at a time, each naming its holder.
- Their notes are in `SP/vanta/v3/<P|G>/notes.json`.
- **G asks you:** when Increment 2's CVI is planned, offer SSP 3. Plan an assessment's SSP choice still offers SSP 2 (B15).
