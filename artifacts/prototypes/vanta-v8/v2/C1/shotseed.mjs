// Screenshots with the walk's end state: node shotseed.mjs <html> <width> route…
import { createRequire } from "node:module"; import path from "node:path"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, w, ...routes] = process.argv.slice(2); const file = "file://" + path.resolve(html);
const here = path.dirname(new URL(import.meta.url).pathname);
const src = fs.readFileSync(path.join(here, "widths.mjs"), "utf8"); const STATE = eval("(" + src.match(/const STATE = (\{[\s\S]*?\} \} \});/)[1] + ")");
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: +w > 600 ? 900 : 844 } });
await p.goto(file + "#home"); await p.waitForTimeout(300);
await p.evaluate((s) => sessionStorage.setItem("pa-v2-state", JSON.stringify(s)), STATE); await p.goto("about:blank"); await p.goto(file + "#home"); await p.waitForTimeout(400);
for (const r of routes) { const [route, open] = r.split("@"); await p.evaluate((r) => { location.hash = r; }, route); await p.waitForTimeout(500); if (open) { await p.click(`#main [data-panel][data-id="${open}"]`).catch(() => {}); await p.waitForTimeout(400); } await p.screenshot({ path: path.join(here, "shots", `end-${w}-${route.replace(/[^a-z0-9-]/gi, "_")}${open ? "-open" : ""}.png`) }); }
await b.close(); console.log("ok");
