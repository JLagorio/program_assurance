#!/bin/sh
SP=/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad
cd $SP/vanta/proto && node --check mod-zzzz-v3-8o-overview.js && python3 -I build.py v3r-O $(ls mod-*.js | grep -v '^mod-zzzz-v3-8[b-z]') mod-zzzz-v3-8o-overview.js 2>&1 | tail -1 | cut -c1-60
