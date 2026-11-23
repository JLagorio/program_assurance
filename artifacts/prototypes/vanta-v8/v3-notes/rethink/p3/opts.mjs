import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const path = await import("path");
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1728, height: 964 } });
await p.goto("file://" + path.resolve(process.argv[2]) + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
for (const r of process.argv.slice(3)) { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(300);
  console.log(r, JSON.stringify(await p.evaluate(() => { const t = document.querySelector("#main .k3-tb[data-k3-list]"); if (!t) return null; return { views: [...t.querySelectorAll(".k3-vlist .k3-vi")].map((e) => e.textContent.trim()), filters: [...t.querySelectorAll(".k3-flt select")].map((s) => s.getAttribute("aria-label") + ": " + [...s.options].slice(1, 7).map((o) => o.textContent.trim()).join(" / ")), right: [...t.querySelectorAll(".k3-tools-r > *")].map((e) => e.textContent.trim().slice(0, 30)) }; })).slice(0, 900)); }
await b.close();
