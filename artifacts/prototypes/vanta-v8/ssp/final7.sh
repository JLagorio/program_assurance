#!/bin/zsh
# Assemble version 7: data, build every module, audit that every reachable screen is redrawn, sweep, walk the flows, shoot every nav screen.
set -e
SP=/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad
V=$SP/vanta; P=$V/proto; SH=$SP/shots/v7
cd $V/ssp && python3 -I sspdata.py | tail -1
cd $P && for m in mod-*.js; do node --check $m; done
cd $P && python3 -I build.py prototype | cut -c1-200
node $V/ssp/audit7.mjs $P/out/prototype.html
cd $P && node sweep.mjs
node $V/ssp/flows7.mjs $P/out/prototype.html
mkdir -p $SH && node $V/ssp/shootnav.mjs $P/out/prototype.html $SH
du -sh $P/out/prototype.html
