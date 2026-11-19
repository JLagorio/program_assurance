#!/bin/zsh
# Assemble v2: check every module, build, audit, sweep every route, walk the v7/v8 flows, the shell probe and the v2 walks.
SP=/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad
V=$SP/vanta; P=$V/proto; OUT=$P/out/prototype.html; LOG=$V/v2/final
mkdir -p $LOG
cd $P && for m in mod-*.js core.js; do node --check $m || echo "SYNTAX $m"; done
python3 -I $V/v2/ba/badata2.py $SP | head -3
cd $P && python3 -I build.py prototype | cut -c1-100
echo "== audit7"; node $V/v2/audit7v2.mjs $OUT $P/out/prototype-v1.html 2>&1 | tail -6
echo "== sweep"; cd $P && node sweep.mjs 2>&1 | tail -4
echo "== flows7"; node $V/ssp/flows7.mjs $OUT 2>&1 | grep -v "^PASS" | tail -6
echo "== flows8"; node $V/ssp/flows8.mjs $OUT 2>&1 | grep -v "^PASS" | tail -6
echo "== probe-v9"; node $V/ssp/probe-v9.mjs $OUT $LOG/probe 2>&1 | grep -v "^PASS" | tail -6
echo "== C1 walk"; node $V/v2/C1/walk.mjs $OUT 2>&1 | grep -E "FAIL|passed|PASS [0-9]|of [0-9]+" | tail -6
echo "== C2 walk"; node $V/v2/C2/walk.mjs $OUT 2>&1 | grep -E "FAIL|passed|of [0-9]+" | tail -6
du -sh $OUT
echo "== F walk"; node $V/v2/F/walk.mjs $OUT 2>&1 | grep -E "FAIL|passed|failed" | tail -6
echo "== F sweep"; node $V/v2/F/sweep.mjs $OUT 2>&1 | grep -E "FAIL|passed|failed|problems|errors" | tail -6
echo "== S walk"; node $V/v2/S/walk.mjs $OUT $LOG/sshots 2>&1 | grep -E "FAIL|PASS [0-9]|passed|failed|of [0-9]+" | tail -6
echo "== EXAMPLE sweep"; node $V/v2/N/scripts/exsweep.mjs $OUT $LOG/ex.json 2>&1 | tail -3
echo "== G walk"; [ -f $V/v2/G/walk.mjs ] && node $V/v2/G/walk.mjs $OUT 2>&1 | grep -E "FAIL|PASS [0-9]|passed|failed|of [0-9]+" | tail -6
echo "== H walk"; [ -f $V/v2/H/walk.mjs ] && node $V/v2/H/walk.mjs $OUT 2>&1 | grep -E "FAIL|PASS [0-9]|passed|failed|of [0-9]+" | tail -6
