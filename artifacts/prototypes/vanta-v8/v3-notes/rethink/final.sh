#!/bin/zsh
# Put the rethought V3 together: Before & after data, syntax, build, V3 off is v2 (offcheck), the rethink's sweep, v2's own flows
# with V3 off, and each rethink lane's walk on the whole build. usage: final.sh [name] [lanes…]
SP=/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad
V=$SP/vanta; P=$V/proto; R=$V/v3r; NAME=${1:-prototype-v3r}; OUT=$P/out/$NAME.html; LOG=$R/final; mkdir -p $LOG
cd $P && for m in mod-*.js core.js; do node --check $m 2>/dev/null || echo "SYNTAX $m"; done
python3 -I $V/v3/gen-ba3.py | tail -1; python3 -I $R/gen-ba3r.py
cd $P && python3 -I build.py $NAME $(ls mod-*.js | grep -v -E "${EXCL:-^$}") | cut -c1-60
echo "== offcheck (V3 off is v2)"; node $V/v3/offcheck.mjs $OUT $LOG/offcheck.json 2>&1 | tail -6
echo "== sweepr (V3 on, the rethink)"; node $R/sweepr.mjs $OUT $LOG/sweepr.json 2>&1 | tail -30
echo "== sweep3 (V3 on, every screen)"; node $V/v3/sweep3.mjs $OUT $LOG/sweep3.json 2>&1 | tail -12
echo "== flows7 (V3 off)"; node $V/ssp/flows7.mjs $OUT 2>&1 | grep -v "^PASS" | tail -5
echo "== flows8 (V3 off)"; node $V/ssp/flows8.mjs $OUT 2>&1 | grep -v "^PASS" | tail -5
for L in ${=LANES:-O S C D E}; do
  [ -f $R/$L/walk.mjs ] || continue
  echo "== walk $L"; (cd $R/$L && node walk.mjs $OUT 2>&1 | grep -E "FAIL|pass|fail|of [0-9]+|errors" | tail -10)
done
du -sh $OUT
