import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("file://" + path.resolve(html) + "#home"); await p.waitForTimeout(600);
const items = await p.evaluate(() => window.PA.navItems().map(([r]) => r));
const withFacts = [];
for (const r of items) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(250);
  const f = await p.evaluate(() => { const ph = document.querySelector("#main .ph .facts, #main .facts"); if (!ph) return null; const t = ph.innerText.replace(/\s+/g, " ").trim(); return { t: t.slice(0, 110), digits: /\d/.test(t) }; });
  if (f) withFacts.push([r, f.digits, f.t]);
}
console.log(withFacts.length, "pages with a facts line;", withFacts.filter((x) => x[1]).length, "with numbers");
for (const x of withFacts) console.log(x[0].padEnd(18), x[1] ? "#" : " ", x[2]);
// does the program menu collapse?
await p.evaluate(() => { location.hash = "overview"; }); await p.waitForTimeout(300);
const col = await p.evaluate(() => [...document.querySelectorAll("#nav button, #nav [role=button], #rail button")].map((e) => (e.getAttribute("aria-label") || e.textContent).trim().slice(0, 40)));
console.log("nav buttons:", JSON.stringify(col));
await b.close();
