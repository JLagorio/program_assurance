// Phone: each area page fits, ☰ opens its menu with the current page marked: node phone.mjs <html> <shotsDir>
import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, out] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
const errors = []; p.on("pageerror", (e) => errors.push(String(e).slice(0, 300)));
await p.goto("file://" + path.resolve(html) + "#home"); await p.waitForTimeout(600);
const routes = ["frameworks", "integrations", "data-calls", "reports", "products", "components", "suppliers", "ai-drafts", "ai-drafts-runs", "ai-drafts-agents", "study", "before-after", "nav-options", "deadlines", "notifications-workspace", "permissions", "event-log", "enclaves", "common-controls", "notifications", "risks", "home"];
let bad = 0;
for (const r of routes) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(300);
  const before = await p.evaluate(() => ({ menu: getComputedStyle(document.getElementById("menuBtn")).display, label: document.getElementById("menuBtn").getAttribute("aria-label"), over: document.documentElement.scrollWidth > innerWidth || document.getElementById("main").scrollWidth > document.getElementById("main").clientWidth + 2, mainW: Math.round(document.getElementById("main").getBoundingClientRect().width) }));
  let opened = null;
  if (before.menu !== "none") {
    await p.click("#menuBtn"); await p.waitForTimeout(150);
    opened = await p.evaluate(() => { const n = document.getElementById("nav"), r = n.getBoundingClientRect(); return { w: Math.round(r.width), on: (n.querySelector("a.item.on") || {}).textContent || null, open: document.getElementById("shell").classList.contains("navopen"), exp: document.getElementById("menuBtn").getAttribute("aria-expanded") }; });
    if (r === "frameworks" || r === "deadlines" || r === "ai-drafts") await p.screenshot({ path: `${out}/drawer-390-${r}.png` });
    await p.click("#menuBtn"); await p.waitForTimeout(100);
  }
  const ok = r === "home" || r === "risks" ? !before.over : (before.menu !== "none" && !before.over && opened && opened.open && opened.w > 200 && !!opened.on && before.mainW >= 370);
  if (!ok) bad++;
  console.log(ok ? "PASS" : "FAIL", r.padEnd(24), JSON.stringify({ ...before, opened }));
}
console.log("fails", bad, "errors:", errors.length ? [...new Set(errors)].slice(0, 6).join("\n") : "none");
await b.close();
