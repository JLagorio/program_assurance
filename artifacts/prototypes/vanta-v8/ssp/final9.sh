#!/bin/zsh
# Assemble version 9: build every module, audit, sweep, walk the v7 and v8 flows, exercise the Navigation options page.
set -e
SP=/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad
V=$SP/vanta; P=$V/proto
cd $P && for m in mod-*.js core.js; do node --check $m; done
cd $P && python3 -I build.py prototype | cut -c1-120
node $V/ssp/audit7.mjs $P/out/prototype.html
cd $P && node sweep.mjs
node $V/ssp/flows7.mjs $P/out/prototype.html
node $V/ssp/flows8.mjs $P/out/prototype.html
node $V/ssp/probe-v9.mjs $P/out/prototype.html $SP/shots/v9
du -sh $P/out/prototype.html
