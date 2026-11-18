#!/bin/zsh
# Assemble version 6: SSP data, build every module, prove the existing screens unchanged, sweep every route, shoot the new ones.
set -e
SP=/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad
V=$SP/vanta; P=$V/proto; SH=$SP/shots/final
cd $V/ssp && python3 -I sspdata.py | tail -1
cd $P && for m in mod-a-ssp-data.js mod-ssp-editor.js mod-ssp-history.js mod-program-new.js; do node --check $m; done
cd $P && python3 -I build.py prototype
cd $V/ba && node tools/checkmain2.mjs $P/out/prototype-v5.html $P/out/prototype.html
cd $P && node sweep.mjs
mkdir -p $SH
for r in ssp ssp-history ssp-review ssps program-new program-new-details program-new-systems program-new-baseline program-new-team program-new-review program-start home; do
  node $V/ba/tools/shoot.mjs $P/out/prototype.html $r $SH/$r-1440.png 1440 1800
  node $V/ba/tools/shoot.mjs $P/out/prototype.html $r $SH/$r-390.png 390 2400
done
du -sh $P/out/prototype.html
