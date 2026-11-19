// Screenshot the Before & after pairs: node shoot.mjs <jobs.json> <outDir>
// jobs: [{ file, html, route, click?, panel?: "first", wait?, steps?: [...], page? }] — one PNG a job, 1440 wide, full page up to 1600 tall.
// steps run before the shot: { go: route, wait }, { click: sel, wait }, { fill: [sel, text] }, { repeat: sel, untilHash: route, max }; route null = stay.
// Jobs that share html and page run in one browser page, in order (state carries over); a new page starts clean.
import { createRequire } from "module"; import fs from "fs"; import path from "path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [jobsFile, out] = process.argv.slice(2);
const jobs = JSON.parse(fs.readFileSync(jobsFile, "utf8"));
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const byHtml = {};
for (const j of jobs) { const k = j.html + "|" + (j.page || ""); (byHtml[k] = byHtml[k] || []).push(j); }
const report = [];
for (const [key, list] of Object.entries(byHtml)) {
  const html = key.split("|")[0];
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
  await p.goto("file://" + html + "#home", { waitUntil: "domcontentloaded" }); await p.waitForTimeout(500);
  for (const j of list) {
    errs.length = 0;
    for (const st of j.steps || []) {
      if (st.go) { await p.evaluate((r) => { location.hash = "#" + r; }, st.go); await p.waitForTimeout(st.wait || 500); }
      else if (st.click) { const el = await p.$(st.click); if (el) { await el.click().catch(() => {}); } else errs.push("step: no " + st.click); await p.waitForTimeout(st.wait || 300); }
      else if (st.jsclick) { const ok = await p.evaluate((sel) => { const el = document.querySelector(sel); if (el) el.click(); return !!el; }, st.jsclick); if (!ok) errs.push("step: no " + st.jsclick); await p.waitForTimeout(st.wait || 350); }
      else if (st.fill) { await p.fill(st.fill[0], st.fill[1]).catch(() => errs.push("step: cannot fill " + st.fill[0])); }
      else if (st.repeat) { for (let i = 0; i < (st.max || 8); i++) { if ((await p.evaluate(() => location.hash.slice(1))) === st.untilHash) break; const el = await p.$(st.repeat); if (!el) break; await el.click().catch(() => {}); await p.waitForTimeout(st.wait || 450); } }
    }
    if (j.route) { await p.evaluate((r) => { location.hash = "#__blank"; location.hash = "#" + r; }, j.route); await p.waitForTimeout(j.wait || 350); }
    let opened = null;
    if (j.click || j.panel) {
      const sel = j.click || "#main [data-panel]:not([data-panel=''])";
      const el = await p.$(sel);
      if (el) { await el.scrollIntoViewIfNeeded().catch(() => {}); await el.click().catch(() => {}); await p.waitForTimeout(300); opened = await p.evaluate(() => !document.getElementById("panel").hidden || !document.getElementById("modal").hidden); }
      await p.evaluate(() => { const m = document.getElementById("main"); if (m) m.scrollTop = 0; window.scrollTo(0, 0); });
    }
    const hgt = await p.evaluate(() => Math.min(1600, Math.max(900, ((document.getElementById("main") || {}).scrollHeight || 0) + 64)));
    await p.setViewportSize({ width: 1440, height: hgt });
    await p.waitForTimeout(120);
    const file = path.join(out, j.file);
    await p.screenshot({ path: file });
    await p.setViewportSize({ width: 1440, height: 900 });
    const landed = await p.evaluate(() => location.hash.slice(1));
    report.push({ file: j.file, route: j.route || j.expect, landed, opened, errors: errs.slice() });
  }
  await p.close();
}
await b.close();
fs.writeFileSync(path.join(out, "_report.json"), JSON.stringify(report, null, 1));
console.log(report.filter((r) => r.errors.length || r.landed !== r.route || r.opened === false).map((r) => JSON.stringify(r)).join("\n") || "all clean", "\n", report.length, "shots");
