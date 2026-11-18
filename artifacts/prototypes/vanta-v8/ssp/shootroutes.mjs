// Shoot the named routes at 1440x900 and lay them out as contact sheets: node shootroutes.mjs <prototype.html> <outDir> <prefix> route...
import { createRequire } from "node:module"; import path from "node:path"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, out, prefix, ...routes] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const file = "file://" + path.resolve(html);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = []; p.on("pageerror", (e) => errors.push(String(e)));
await p.route("**/*", (r) => (/fonts\.(googleapis|gstatic)\.com/.test(r.request().url()) ? r.abort() : r.continue()));
await p.goto(file + "#home"); await p.waitForTimeout(400);
const shots = [];
for (const r of routes) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(300);
  const f = path.join(out, r + ".png"); await p.screenshot({ path: f }); shots.push([r, f]);
}
const per = 9;
for (let s = 0; s * per < shots.length; s++) {
  const cells = shots.slice(s * per, s * per + per).map(([r, f]) => `<figure><img src="data:image/png;base64,${fs.readFileSync(f).toString("base64")}"><figcaption><code>#${r}</code></figcaption></figure>`).join("");
  await p.setContent(`<style>body{margin:0;font:13px system-ui;background:#fff}main{display:grid;grid-template-columns:repeat(3,480px);gap:8px;padding:8px}figure{margin:0}img{width:480px;height:300px;border:1px solid #ddd;display:block}figcaption{padding:3px 0}code{color:#555}</style><main>${cells}</main>`);
  await p.setViewportSize({ width: 1480, height: 900 });
  await p.screenshot({ path: path.join(out, `${prefix}-sheet-${s + 1}.png`), fullPage: true });
  await p.setViewportSize({ width: 1440, height: 900 });
}
console.log("shot", shots.length, "routes into", out, "| errors:", errors.length ? [...new Set(errors)].slice(0, 5).join(" | ") : "none");
await b.close();
