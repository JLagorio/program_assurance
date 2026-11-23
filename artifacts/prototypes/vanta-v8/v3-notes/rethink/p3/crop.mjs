// A close look at one list's toolbar: node crop.mjs <build> <out.png> <route> [state: filter|menu]
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const path = await import("path");
const [build, out, route, mode] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1728, height: 964 }, deviceScaleFactor: 2 });
await p.goto("file://" + path.resolve(build) + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); const t = document.getElementById("v2-toast"); if (t) t.remove(); }); await p.waitForTimeout(300);
await p.evaluate((r) => { location.hash = r; }, route); await p.waitForTimeout(400);
if (mode) { await p.evaluate(() => { const ss = [...document.querySelectorAll("#main .k3-tb[data-k3-list] .k3-flt select")]; const s = ss[ss.length - 1]; s.selectedIndex = 1; s.dispatchEvent(new Event("input", { bubbles: true })); }); await p.waitForTimeout(350); }
if (mode === "menu") { await p.click("#main .k3-vbtn"); await p.waitForTimeout(150); }
const box = await p.evaluate(() => { const t = document.querySelector("#main .k3-tb[data-k3-list]").getBoundingClientRect(); return { x: t.left - 12, y: t.top - 12, width: t.width + 24, height: 330 }; });
await p.screenshot({ path: path.resolve(out), clip: box }); await b.close();
