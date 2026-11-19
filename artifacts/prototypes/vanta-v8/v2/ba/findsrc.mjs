// For each record page C1 added, find the v1 route whose screen holds that preview's row: node findsrc.mjs <v1.html> <newscreens.json>
import { createRequire } from "module"; import fs from "fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, list] = process.argv.slice(2);
const want = JSON.parse(fs.readFileSync(list, "utf8")).filter((s) => s.route.startsWith("rec--")).map((s) => { const m = s.route.match(/^rec--(.+?)--(.+)$/); return { id: s.id, kind: m[1], rid: decodeURIComponent(m[2]) }; });
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("file://" + html + "#home", { waitUntil: "domcontentloaded" }); await p.waitForTimeout(400);
const routes = (await p.evaluate(() => window.PA.navItems().map(([k]) => k))).concat(["control-si2", "campaign", "people-access", "inventory-changes", "findings-vulns", "products", "ai-drafts", "authorization", "schedule", "review-queue", "composition", "interconnections", "threats", "suppliers", "risks", "poam", "findings", "requirements", "controls", "inventory"]);
const found = {};
for (const r of [...new Set(routes)]) {
  await p.evaluate((r) => { location.hash = "#" + r; }, r); await p.waitForTimeout(200);
  const hits = await p.evaluate((want) => want.filter((w) => document.querySelector(`#main [data-panel="${CSS.escape(w.kind)}"][data-id="${CSS.escape(w.rid)}"]`)).map((w) => w.id), want);
  for (const id of hits) if (!found[id]) found[id] = r;
}
const out = want.map((w) => ({ ...w, v1route: found[w.id] || null }));
console.log(JSON.stringify(out, null, 0).replace(/\},\{/g, "},\n{"));
fs.writeFileSync("findsrc.json", JSON.stringify(out));
await b.close();
