import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
await p.goto("file://" + path.resolve(process.argv[2]) + "#home"); await p.waitForTimeout(400);
const recs = await p.evaluate(() => Object.keys(window.PA.S).filter((k) => /^stigs-[a-z0-9-]+$/.test(k) && !/-(comments|activity|open)$/.test(k)));
for (const r of recs) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(250);
  const links = await p.evaluate(() => [...document.querySelectorAll("#main .ak-desc button")].map((x) => x.textContent.trim()));
  for (const l of links) {
    await p.evaluate((l) => { [...document.querySelectorAll("#main .ak-desc button")].find((x) => x.textContent.trim() === l).click(); }, l); await p.waitForTimeout(300);
    const st = await p.evaluate(() => ({ panel: !document.getElementById("panel").hidden, modal: !document.getElementById("modal").hidden }));
    console.log(r, "·", l, "→", JSON.stringify(st));
    await p.evaluate(() => { const c = document.getElementById("closePanel"); if (c) c.click(); const m = document.querySelector("#modal [data-close-modal]"); if (m && !document.getElementById("modal").hidden) m.click(); }); await p.waitForTimeout(150);
  }
}
console.log("records", recs.length, "errors:", errs.length ? errs.join(" | ") : "none");
await b.close();
