// List every route with the nav key the option 3 shell would give it: node probe-routes9.mjs <prototype.html>
import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const b = await chromium.launch(); const p = await b.newPage();
await p.goto("file://" + path.resolve(process.argv[2]) + "#home"); await p.waitForTimeout(600);
const { routes, rn, canon } = await p.evaluate(() => ({ routes: Object.keys(PA.S), rn: PA.ROUTE_NAV, canon: Object.keys((PA.canon && PA.canon.CANON) || {}) }));
await b.close();
const P = ["overview","getting-started","itcsc","composition","inventory","stigs","interconnections","ppsm","sources","baseline","controls","ssps","requirements","evidence","checks","policies","assessments","cyber-te","findings","poam","risks","threats","posture","resiliency","sse","traceability","inheritance","authorization","package-room","conmon","schedule","people"];
const W = ["home","my-work","review-queue","portfolio","products","components","suppliers","frameworks","integrations","data-calls","reports","ai-drafts","study","before-after","nav-options","deadlines","notifications","event-log","enclaves","common-controls","permissions"];
const all = [...P, ...W].sort((a, c) => c.length - a.length);
const key = (r) => rn[r] || (P.includes(r) || W.includes(r) ? r : all.find((x) => r.startsWith(x + "-")) || null);
const isAlias = (r) => r.startsWith("after-") || canon.includes(r);
const un = routes.filter((r) => !isAlias(r) && !key(r));
const viaRN = Object.entries(rn).filter(([r, k]) => !P.includes(k) && !W.includes(k));
console.log("routes:", routes.length, "| aliases skipped:", routes.filter(isAlias).length, "| unresolved:", un.length);
const groups = {}; for (const r of un) { const g = r.split("-")[0]; (groups[g] = groups[g] || []).push(r); }
for (const [g, rs] of Object.entries(groups).sort((a, c) => c[1].length - a[1].length)) console.log(`  ${g} (${rs.length}): ${rs.slice(0, 8).join(", ")}${rs.length > 8 ? " …" : ""}`);
console.log("ROUTE_NAV pointing at keys that leave the nav:", viaRN.map(([r, k]) => `${r}→${k}`).join(", ") || "none");
