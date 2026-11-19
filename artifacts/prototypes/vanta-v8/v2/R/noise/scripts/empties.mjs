// Empty values drawn as glyph + word: dashed rings and words like None / Not recorded / No owner, above the fold, per page.
import { createRequire } from "node:module"; import path from "node:path"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("file://" + path.resolve(process.argv[2]) + "#home"); await p.waitForTimeout(600);
const nav = await p.evaluate(() => PA.navItems().map(([r]) => r).filter((r) => !["study", "before-after", "nav-options"].includes(r)));
const res = {};
for (const r of [...nav, "campaign", "control-si2", "component-mc", "stigs-mission-computer-rhel9"]) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(400);
  res[r] = await p.evaluate(() => {
    const W = /^(none|none yet|not recorded|no owner|unassigned|not requested|not set|nobody yet|no due date|not scheduled|no document|no evidence|not listed|not reminded yet)$/i;
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.top < innerHeight && r.bottom > 64; };
    const rings = [...document.querySelectorAll("#main .gl.ring, #main .v7a-ring")].filter(vis).length;
    const words = [...document.querySelectorAll("#main *")].filter((e) => e.children.length <= 2 && W.test((e.textContent || "").trim()) && vis(e) && ![...e.children].some((c) => W.test((c.textContent || "").trim()))).length;
    return { rings, words };
  });
}
fs.writeFileSync(process.argv[3], JSON.stringify(res, null, 1));
for (const [r, v] of Object.entries(res).sort((a, b) => b[1].rings + b[1].words - a[1].rings - a[1].words).slice(0, 22)) console.log(r.padEnd(30), "dashed rings", String(v.rings).padStart(3), " empty words", v.words);
await b.close();
