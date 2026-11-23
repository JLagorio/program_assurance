#!/bin/sh
# Build the whole prototype (every lane) as lane E's pass-2 build.
cd /private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta/proto || exit 1
node --check mod-zzzz-v3-8e-assure.js || exit 1
python3 -I build.py v3r2-E | cut -c1-60
