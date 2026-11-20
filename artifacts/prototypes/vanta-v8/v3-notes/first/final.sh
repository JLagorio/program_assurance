#!/bin/zsh
# Put V3 together: generate the Before & after data, check every module, build, then: V3 off is v2 (offcheck), every screen with V3 on
# (sweep3), the v7/v8 flows and the shell probe with V3 off, and each lane's walk on the whole build.
SP=/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad
V=$SP/vanta; P=$V/proto; NAME=${1:-prototype-v3}; OUT=$P/out/$NAME.html; LOG=$V/v3/final
mkdir -p $LOG
cd $P && for m in mod-*.js core.js; do node --check $m 2>/dev/null || echo "SYNTAX $m"; done
python3 -I $V/v3/gen-ba3.py
cd $P && python3 -I build.py $NAME | cut -c1-80
echo "== offcheck (V3 off is v2)"; node $V/v3/offcheck.mjs $OUT $LOG/offcheck.json 2>&1 | tail -8
echo "== sweep3 (V3 on)"; node $V/v3/sweep3.mjs $OUT $LOG/sweep3.json 2>&1 | tail -14
echo "== flows7 (V3 off)"; node $V/ssp/flows7.mjs $OUT 2>&1 | grep -v "^PASS" | tail -6
echo "== flows8 (V3 off)"; node $V/ssp/flows8.mjs $OUT 2>&1 | grep -v "^PASS" | tail -6
echo "== probe-v9 (V3 off)"; node $V/ssp/probe-v9.mjs $OUT $LOG/probe 2>&1 | grep -v "^PASS" | tail -6
for L in P G F R W X; do
  [ -f $V/v3/$L/walk.mjs ] || continue
  echo "== walk $L"; (cd $V/v3/$L && node walk.mjs $OUT 2>&1 | grep -E "FAIL|passed|failed|of [0-9]+|errors" | tail -8)
done
du -sh $OUT
