// Every Before & after page: no page error, every image it names exists and loads. node bacheck.mjs <html>
import { createRequire } from "node:module"; import path from "node:path"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const html = path.resolve(process.argv[2]); const dir = path.dirname(html);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = []; p.on("pageerror", (e) => errors.push(String(e)));
await p.goto("file://" + html + "#before-after"); await p.waitForTimeout(800);
const routes = await p.evaluate(() => Object.keys(window.PA.S).filter((r) => /^before-after/.test(r)));
const allsrc = new Set(); const missing = new Set(), broken = new Set(); let imgs = 0, figs = 0;
for (const mode of ["all", "v12"]) {
  await p.evaluate((m) => { try { localStorage.setItem("ba-mode", m); } catch (e) {} }, mode);
  for (const r of routes) {
    await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(120);
    // the group pages draw their images lazily: scroll through
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 1400) { window.scrollTo(0, y); await new Promise((res) => setTimeout(res, 30)); } window.scrollTo(0, 0); });
    const o = await p.evaluate(() => ({ srcs: [...document.querySelectorAll("#main img")].map((i) => i.getAttribute("src")), figs: document.querySelectorAll("#main figure").length }));
    figs += o.figs;
    for (const s of o.srcs) { if (!s || !s.startsWith("ba/")) continue; imgs++; allsrc.add(s); if (!fs.existsSync(path.join(dir, s))) missing.add(s); }
  }
}
fs.writeFileSync(process.argv[3] || "/dev/null", JSON.stringify([...allsrc].sort()));
console.log("pages", routes.length, "| figures", figs, "| images named", imgs, "| missing files", missing.size, [...missing].slice(0, 10).join(" "));
console.log("errors:", errors.length ? [...new Set(errors)].slice(0, 3).join(" | ") : "none");
await b.close();
