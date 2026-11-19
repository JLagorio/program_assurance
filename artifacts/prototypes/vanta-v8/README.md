# Prototype v2 (2026-11-19)

- `prototype.html`: v2, the page published as artifact version 15. About › Before & after compares Before (version 5), v1 and v2 screen by screen. Open it in any browser; it runs from the file. `ba/` holds the screenshots Before & after shows, all of them our own prototype's screens (no Vanta images).
- `prototype-v1.html`: v1, the v9.1 page (artifact version 11) as the gap review of 18 November read it.
- `src/`: v2's source. `python3 -I build.py <name>` joins `core.js`, `shell.html` and every `mod-*.js`/`.css` into `out/<name>.html`; `python3 -I build.py prototype` rebuilds `prototype.html` byte for byte. The SCTM workbook's engine (`mod-zzzz-v2-7sctm-engine.js`) bundles the repo's `packages/spreadsheet-core` with `@ironcalc/wasm` 0.8.4 (MIT/Apache-2.0); `v2/S/build-engine.mjs` rebuilds it. No source from `docs/examples/macro-main` (AGPL-3.0) is in it.
- `src-v1/`: v1's source.
- `v2/`: how v2 was made: the briefs (`COMMON.md`, `V.md`, `L.md`, `C.md`, `VERIFY.md`, `N.md`, `S.md`, `F.md`, and for the lifecycle and host systems `GH.md`, `G.md` and `H.md`), each agent's notes (`*/notes.json`), the re-review (`R/review.json`, `R/numbers.json`), the Before & after generators (`ba/`: `jobs2.py`, `shoot.mjs`, `badata2.py`, `v2sum.json`) and the checks (`final-v2.sh`, `audit7v2.mjs`, and the walks in `C1/`, `C2/`, `F/`, `S/`, `G/` and `H/`). Agents' screenshots and page snapshots are left out.
- `ssp/`: the data generator (`sspdata.py`), the earlier briefs and the checks v2 still runs (`flows7.mjs`, `flows8.mjs`, `probe-v9.mjs`, `sweep.mjs`). The scripts still name the session scratch folder they ran from.
- `gap/`: the gap review of 18 November.
- `dod/`: the public DISA STIG files and the AF ITCSC v2.0 form the DoD screens were built from.

Copied out of the session scratch folder, which is temporary. `artifacts/` stays gitignored on design-system. This folder is committed on the `prototype-v9` branch: v9.1 on 18 November, and v2 as artifact version 15 on 19 November.
