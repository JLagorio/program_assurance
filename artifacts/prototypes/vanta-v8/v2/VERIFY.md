# Agent R: re-review v2 against the gap review

Read `SP/vanta/v2/COMMON.md` (paths, rules) first; ignore its "Your files" parts: you change no prototype file. Your folder is `SP/vanta/v2/R/`.

## What and why
The gap review of 18 November (`SP/vanta/gap/SUMMARY.md`; findings A1–A22 in `gap/distance/findings.json`, B1–B17 in `gap/flows/findings.json`, N01–N19 in `gap/noise/findings.json`) found v1 3.4/5 from Vanta, with broken workflows and too many marks. Five agents then built v2 to answer it (their notes: `SP/vanta/v2/*/notes.json`; reports: `SP/vanta/v2/WAVE1.md`, and C1's and C2's final notes). Josef will judge v2 by whether it actually closed what the review found. You are the independent check: re-run the review's own measurements on v2 and say, finding by finding, what is fixed, what only partly, what is not, and what v2 broke. Report what you observe in the build, not what the notes claim.

## Inputs
- v2 build: `SP/vanta/proto/out/prototype.html`. v1: `SP/vanta/proto/out/prototype-v1.html`.
- The review's scripts, to re-run on v2 with the same settings (copy them into your folder and point them at v2; never edit the originals): `gap/flows/scripts/` (the eight jobs j1–j8 and their variants, the dialog sweep, the preview sweep, the facts and counts checks), `gap/noise/scripts/` (the per-route metrics: colours, pills, gadgets, banners, empty values, toned cells a row, type pairs; outputs like `gap/noise/raw/*.json`), `gap/distance/*.mjs` (columns, facts, navigation, interactions).
- Vanta's side is unchanged: use the review's Vanta numbers as they are (no new Vanta image reading).

## Do
1. Re-run the eight jobs (B findings) on v2. For each break the review logged, say whether it still happens, with the step.
2. Re-run the dialog sweep (74 dialogs) and the preview sweep (54 previews): how many change state, how many say they are not wired, how many still toast or close for nothing; how many ↗ open a page.
3. Re-run the noise metrics on all 65 product routes at 1440 (and the phone metrics if quick): banners, toned pills, words per tone, dashed rings, toned cells a row, gadgets in rows, type pairs, cues above the fold; rank the ten heaviest pages again, v1 against v2.
4. Re-check the distance findings that are about page shape (A1, A3, A5, A6, A7, A11, A12, A15, A18, A22) on v2.
5. Look for regressions: page errors, sideways scroll at 390, a link or button that worked in v1 and does not in v2, a page that lost information it needs (for example a count or a status the reader acts on), duplicated or contradictory numbers v2 introduced.

## Output
- `SP/vanta/v2/R/review.json`: one entry per original finding `{ "id", "status": "fixed" | "partly" | "not fixed" | "regressed", "v1": "<the measure in v1>", "v2": "<the measure in v2>", "evidence": "<route, step or file>" }`, and a list `new` of problems v2 introduced `{ "where", "what", "severity": "high" | "medium" | "low", "how to see it" }`.
- `SP/vanta/v2/R/numbers.json`: the before/after numbers (dialogs, previews, the noise metrics, the ten heaviest pages).
- Write a first review.json within 20 minutes and keep it updated.
- Final message, at most 300 words: counts by status, the five most important things still wrong, the regressions.
