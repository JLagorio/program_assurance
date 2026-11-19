// Survey rail areas: node survey.mjs <html>
import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const file = "file://" + path.resolve(process.argv[2]);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = []; p.on("pageerror", (e) => errors.push(String(e)));
await p.goto(file + "#home"); await p.waitForTimeout(600);
const info = await p.evaluate(() => ({ S: Object.keys(PA.S).filter((k) => !k.startsWith("after-")), nav: PA.navItems() }));
console.log("S count", info.S.length, "nav", info.nav.length);
const groups = {};
for (const k of info.S) { const pre = k.split("-")[0]; (groups[pre] = groups[pre] || []).push(k); }
const areaRoutes = ["home", "my-work", "review-queue", "portfolio", "products", "components", "suppliers", "frameworks", "integrations", "data-calls", "reports", "ai-drafts", "study", "before-after", "nav-options", "deadlines", "notifications", "notifications-workspace", "event-log", "enclaves", "common-controls", "permissions"];
for (const r of areaRoutes) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(250);
  const d = await p.evaluate(() => {
    const main = document.getElementById("main");
    const tabs = [...main.querySelectorAll(".ak-tabs, .tabsx, [role=tablist], .sectabs")].map((s) => ({ cls: s.className, items: [...s.querySelectorAll("a, button, [role=tab], span")].slice(0, 12).map((a) => (a.getAttribute("href") || a.getAttribute("data-go") || "") + ":" + a.textContent.trim().slice(0, 24)) }));
    return { title: (main.querySelector("h1,h2,h3,.ak-title") || {}).textContent, rail: (document.querySelector("#rail a.ri.on") || {}).getAttribute?.("href"), inprog: document.getElementById("shell").classList.contains("inprog"), tabs };
  });
  console.log(r, JSON.stringify(d).slice(0, 900));
}
for (const [k, v] of Object.entries(groups)) if (v.length > 1 && ["portfolio", "ai", "review", "my", "products", "components", "suppliers", "frameworks", "integrations", "data", "reports", "deadlines", "notifications", "event", "enclaves", "common", "permissions", "study", "before", "nav"].includes(k)) console.log("ROUTES", k, v.length, v.slice(0, 40).join(" "));
console.log("errors", errors.slice(0, 3));
await b.close();
