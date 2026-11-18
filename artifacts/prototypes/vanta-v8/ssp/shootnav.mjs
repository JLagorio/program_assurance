// Shoot every nav screen at 1440x900 and lay them out as contact sheets: node shootnav.mjs <prototype.html> <outDir>
import { createRequire } from "node:module"; import path from "node:path"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, out] = process.argv.slice(2);
const file = "file://" + path.resolve(html);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.route("**/*", (r) => (/fonts\.(googleapis|gstatic)\.com/.test(r.request().url()) ? r.abort() : r.continue()));
await p.goto(file + "#home"); await p.waitForTimeout(500);
for (let i = 0; i < 12; i++) { const g = await p.$('#nav [data-group][aria-expanded="false"]'); if (!g) break; await g.click(); await p.waitForTimeout(50); }
const nav = await p.evaluate(() => [...document.querySelectorAll("#nav a.item")].map((a) => [a.getAttribute("href").slice(1), a.textContent.trim()]));
const shots = [];
for (const [r, label] of nav) {
  await p.goto(file + "#" + r); await p.waitForTimeout(350);
  const f = path.join(out, r + ".png"); await p.screenshot({ path: f }); shots.push([r, label.replace(/\d+%?$/, "").trim(), f]);
}
const per = 12;
for (let s = 0; s * per < shots.length; s++) {
  const cells = shots.slice(s * per, s * per + per).map(([r, l, f]) => `<figure><img src="data:image/png;base64,${fs.readFileSync(f).toString("base64")}"><figcaption>${l} <code>#${r}</code></figcaption></figure>`).join("");
  await p.setContent(`<style>body{margin:0;font:13px system-ui;background:#fff}main{display:grid;grid-template-columns:repeat(4,360px);gap:8px;padding:8px}figure{margin:0}img{width:360px;height:225px;border:1px solid #ddd;display:block}figcaption{padding:3px 0}code{color:#888}</style><main>${cells}</main>`);
  await p.setViewportSize({ width: 1480, height: 900 });
  await p.screenshot({ path: path.join(out, `sheet-${s + 1}.png`), fullPage: true });
}
console.log("shot", shots.length, "nav screens into", out);
await b.close();
