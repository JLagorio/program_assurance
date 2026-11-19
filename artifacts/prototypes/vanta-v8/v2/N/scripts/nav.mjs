// Check the shell's menus: node nav.mjs <html> [width]
import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, w = "1440"] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: +w > 600 ? 900 : 844 } });
const errors = []; p.on("pageerror", (e) => errors.push(String(e).slice(0, 300)));
await p.goto("file://" + path.resolve(html) + "#home"); await p.waitForTimeout(600);
const routes = ["home", "frameworks", "integrations", "integration-acas", "data-calls", "data-calls-fisma", "reports", "frameworks-high", "products", "components", "component-mc", "suppliers", "suppliers-sbom", "ai-drafts", "ai-drafts-runs", "ai-drafts-agents", "study", "before-after", "nav-options", "deadlines", "deadlines-vuln", "notifications-workspace", "notifications", "event-log", "event-log-imports", "enclaves", "common-controls", "permissions", "permissions-matrix", "overview", "requirements", "sctm", "portfolio", "my-work", "review-queue", "campaign"];
for (const r of routes) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(250);
  const d = await p.evaluate(() => {
    const nav = document.getElementById("nav"), sh = document.getElementById("shell");
    const on = nav.querySelector("a.item.on");
    return {
      cls: [sh.classList.contains("inprog") ? "prog" : "", sh.classList.contains("inarea") ? "area" : ""].join(""),
      head: (nav.querySelector(".pn-area, .pn-swt b, .v2c-campt b") || {}).textContent || "",
      on: on ? on.getAttribute("href") + " " + on.textContent.trim() : null,
      items: [...nav.querySelectorAll("a.item")].filter((a) => !a.hidden).map((a) => a.textContent.trim()).join(" | ").slice(0, 200),
      navW: Math.round(nav.getBoundingClientRect().width),
      sectabs: document.querySelectorAll("#main .sectabs").length,
      inpage: document.querySelectorAll("#main .v2-set-nav").length,
      title: ((document.querySelector("#main .ph h3, #main .ak-title") || {}).textContent || "").trim().slice(0, 40),
      railOn: (document.querySelector("#rail a.ri.on") || { getAttribute: () => null }).getAttribute("href"),
      over: document.documentElement.scrollWidth > innerWidth,
    };
  });
  console.log(r.padEnd(24), JSON.stringify(d));
}
console.log("errors:", errors.length ? [...new Set(errors)].slice(0, 6).join("\n") : "none");
await b.close();
