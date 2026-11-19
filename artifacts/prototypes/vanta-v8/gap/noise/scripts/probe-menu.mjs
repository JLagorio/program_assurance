import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("file://" + path.resolve(process.argv[2]) + "#home"); await p.waitForTimeout(600);
for (const [r, sel] of [["checks", ".a-tests-menu"], ["inventory", ".ak-pop"], ["inventory", ".a-people-menu"], ["portfolio", ".v7o-menu"]]) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(500);
  console.log(r, sel, JSON.stringify(await p.evaluate((sel) => [...document.querySelectorAll("#main " + sel)].slice(0, 2).map((e) => { const cs = getComputedStyle(e); const rc = e.getBoundingClientRect(); let anc = []; for (let q = e.parentElement; q && q.id !== "main"; q = q.parentElement) { const c = getComputedStyle(q); if (c.opacity === "0" || c.visibility === "hidden" || c.display === "none" || q.hidden || c.clipPath !== "none" || c.overflow !== "visible") anc.push(`${q.className}|op${c.opacity}|vis${c.visibility}|ovf${c.overflow}|h${q.hidden}`); } return { hidden: e.hidden, disp: cs.display, vis: cs.visibility, op: cs.opacity, rect: [rc.x, rc.y, rc.width, rc.height].map(Math.round), anc: anc.slice(0, 3) }; }), sel)));
}
await b.close();
