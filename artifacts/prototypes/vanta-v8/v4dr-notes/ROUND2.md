# Drata round, pass two: close the "Not done" list (version 24)

Josef read the Drata tab's **Not done** list (13 items, each lane's `open` in notes.json) and asked to have them built so he can see them in the tab. `SP` = `/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad`.

Read first: `SP/vanta/v4dr/COMMON.md` (the rules, the files you own, the checks; all still hold), your lane brief(s) `SP/vanta/v4dr/<L>.md`, your lane's `notes.json`, and the header comment of the module(s) you own. Version 23's modules and notes are backed up in `SP/vanta/v4dr/lead/v23bak/`; never edit the backup.

## The hard rule

**Josef wants additions under About only. Never change the app, v2, V3, `core.js`, any `mod-*.js` outside the Drata ones, or `mod-zz-compare.js`.** Where an item says "V3's own pages don't read it", the answer is that the Drata screens (`dr-*`) read each other, never that V3 changes. `offcheck` must stay 0 differences and V3's own screens must render exactly as before.

## Who does what (each agent edits only its own files)

### Agent 1: lanes K and A (`mod-zzzz-v4-0drk.*`, `mod-zzzz-v4-1ctl.*`, `v4dr/K/`, `v4dr/A/`)
1. **K, dock in the address.** The dock's open pane goes into the hash as a trailing `--dock-<pane>` (only `#name` hashes, letters, digits and hyphens), handled once in the kit so every lane gets it: opening a pane writes it (use `history.replaceState` so it does not stack history), loading a route with the suffix opens that pane, closing removes it. Lanes must not need to change.
2. **K, every drawer walks.** A drawer whose lane never called `D.walkable` still shows its position and Previous / Next, from the rows of the list it was opened from (in their drawn order). Check every `D.drawer` call in lanes A, B, C and F works with it, without editing their files.
3. **A, a control judged in part.** WS-X90 has no partly judged control at reset. Give the Drata screens one (a control with at least four objectives, chosen deterministically), as Drata-only demo state in lane A's data, so the controls register and that control's record show "3 of 5 judged" with the rest to plan. List it under `derived`. AC-17(4) stays as it is.
4. **A, Compare with Parameters.** Find a WS-X90 control whose program tailoring sets a parameter (read the data; if none is set, derive one deterministically and list it under `derived`) and make Compare show its Parameters field beside the other two. It must be reachable from the controls register and the record.
5. **A, the title ask.** Already fixed by the lead (`.drk-title { max-width: none }` in the kit). Remove it from `open`.
6. **A reads B.** `dr-control--<code>`'s evidence shows the links lane B's screens made, through `PA.drB.linksFor(code)` (see the interface below; guard with `if (PA.drB)` since agent 2 is writing it at the same time). Linking evidence from the control record writes through `PA.drB.link(code, evidenceId)`, so the evidence record shows it too.

### Agent 2: lanes B and C (`mod-zzzz-v4-2evi.*`, `mod-zzzz-v4-3src.*`, `v4dr/B/`, `v4dr/C/`)
1. **B, STIG checklist runs in the register.** V3's checklist kind joins `dr-evidence` as evidence (fixed evidence from a source, with its run date and open rules), with its own record or its preview.
2. **B, the POA&M import's own steps.** The import draws the POA&M's own columns and sample rows (weakness, control, milestones, scheduled completion, status), not the SCTM's.
3. **B, the shared store.** Export `PA.drB` (below) and use it for every link, unlink and renewal lane B's screens make. Then lanes A and F show them.
4. **C, a checklist's Scope and Matching.** A STIG checklist source gets Scope (its one component, its rules) and Matching (the host it ran on matched to that component), so every source has the same tabs.
5. **C, runs that finish.** Connect, import a file and Run now queue a run that moves Queued, then Running, then Done within a few seconds, with counts read from the data V3 already holds (the source's last run). The source's Last run, health and the register update. Keep it with `K.set`, so it survives moving between pages.

### Agent 3: lane F (`mod-zzzz-v4-4chk.*`, `v4dr/F/`)
1. **F, what the check checks.** A check record shows the check's own rules text (for a STIG check, each rule's check and fix text as V3 holds it; for the others, the rule as one line), and a finding row's eye can open the rule in the kit's drawer as well as V3's finding preview.
2. **F, evidence renewed before it expires.** Add the check (V3's 54-failing test) to the register and give it a record. Its failing resources come from `PA.drB.renewalCheck()` when it exists (guard it; fall back to V3's own numbers), so renewing evidence in lane B's screens lowers the count.
3. **F, privileged account review.** Add it as a check that has never run. Run now gives a result derived from the identity provider's accounts V3 holds (the privileged ones), listed under `derived`, with its failing resources and a record.

## The interface between the lanes: `PA.drB` (agent 2 writes it; agents 1 and 3 read it)

```js
PA.drB = {
  linksFor(code),        // → [{ id, title, kind, state }] evidence linked to that control: V3's links plus the session's adds, minus removals
  link(code, id),        // adds one in the session (K.set under dr.B.); returns true
  unlink(code, id),      // removes one; returns true
  renewalCheck(),        // → { total, failing: [{ id, title, expires }] } evidence past or near its renewal, with the session's renewals applied
};
```

## What each agent writes in notes.json

For every item closed:
- add a numbered change to the pair that shows it (its `rec` number, `title`, `text`, `drata`, and `ev` where a Drata image applies), or a new pair if it is a new screen;
- remove the line from `open`;
- add an entry to a new list `added`: `{ "text": "≤20 words: what is new", "pair": "<pair id>", "route": "dr-…", "click": "css selector (optional)", "scroll": "css selector (optional)" }`. The tab draws these under "New in version 24", each with an Open button that goes straight to `route`.
- Anything you still cannot do stays in `open` with one line saying why.

## Checks before you hand back

- `node --check` on your modules; build `cd SP/vanta/proto && python3 -I build.py v4dr-<L>` (your own output name; if another agent's file breaks the build, wait a minute and build again, never edit it).
- Extend your lane's `walk.mjs` to reach the new things, and run it: 0 failures at 1440 and 390.
- `node SP/vanta/v3/offcheck.mjs <build>` once, at the end: 0 differences. Do **not** run sweep3; the lead runs it.
- Screenshot the new states at 1440 into your folder and view at most six. They have to look finished and calm.

## Hand-back (under 150 words)

The items closed, any left open with why, your walk's numbers, the offcheck count, and asks to the lead.
