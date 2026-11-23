#!/bin/zsh
# Put the Drata round together: syntax, data, build, V3 off is v2, every V3 screen, each lane's walk, the tab, shots, rebuild.
# usage: final.sh [name]   (default prototype-v4dr) ; SKIP_SHOTS=1 to reuse the shots
SP=/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad
V=$SP/vanta; P=$V/proto; L=$V/v4dr/lead; NAME=${1:-prototype-v4dr}; OUT=$P/out/$NAME.html; mkdir -p $L/shots $L/final
cd $P && for m in mod-*.js core.js; do node --check $m 2>/dev/null || echo "SYNTAX $m"; done
python3 -I $L/gen.py
cd $P && python3 -I build.py $NAME | cut -c1-60
if [ -z "$SKIP_SHOTS" ]; then
  echo "== shots"; node $L/shoot.mjs $OUT $L/shots 2>&1 | tail -2
  python3 -I $L/gen.py; cd $P && python3 -I build.py $NAME | cut -c1-60
fi
rm -rf $P/out/dr; mkdir -p $P/out/dr; cp $L/shots/*.jpg $P/out/dr/
echo "== tab"; node $L/tabcheck.mjs $OUT $L/final 2>&1 | grep -E "FAIL|passed|pairs|opened" | tail -14
echo "== offcheck (V3 off is v2)"; node $V/v3/offcheck.mjs $OUT $L/final/offcheck.json 2>&1 | tail -6
echo "== sweep3 (V3 on, every screen)"; node $V/v3/sweep3.mjs $OUT $L/final/sweep3.json 2>&1 | tail -8
for LN in K A B C F; do
  [ -f $V/v4dr/$LN/walk.mjs ] || continue
  echo "== walk $LN"; (cd $V/v4dr/$LN && node walk.mjs $OUT 2>&1 | grep -E "^build|FAIL|pass|fail|errors" | tail -8)
done
du -sh $OUT; ls $L/shots | wc -l
