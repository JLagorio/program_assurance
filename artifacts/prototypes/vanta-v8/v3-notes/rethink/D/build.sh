#!/bin/sh
# Lane D build: the module is put together from src/*.js, then the whole prototype is built, every module in name order:
#   out/v3r2-D.html
D=/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta/v3r/D
cd /private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta/proto || exit 1
cat $D/src/[0-9]*.js > mod-zzzz-v3-8d-docs.js
cp $D/src/docs.css mod-zzzz-v3-8d-docs.css
node --check mod-zzzz-v3-8d-docs.js || exit 1
python3 -I build.py v3r2-D | cut -c1-60
