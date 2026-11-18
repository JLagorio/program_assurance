# Prototype v9 (2026-11-18)

- `prototype.html`: the page published as artifact version 10 (v9: Experiments › Navigation options, five working navigation wireframes). Open it in any browser; it runs from the file.
- `src/`: its source. `python3 -I build.py <name>` joins `core.js`, `shell.html` and every `mod-*.js`/`.css` into `out/<name>.html`.
- `ssp/`: the data generator (`sspdata.py`), the builders' briefs and the checks (`final9.sh`, `probe-v9.mjs`, `final8.sh`, `flows7.mjs`, `flows8.mjs`, `audit7.mjs`, `sweep.mjs`). The scripts still name the session scratch folder they ran from.
- `dod/`: the public DISA STIG files and the AF ITCSC v2.0 form the DoD screens were built from.

Copied out of the session scratch folder, which is temporary. `artifacts/` stays gitignored on design-system; this folder is committed on the `prototype-v9` branch so it can be checked out on another machine.
