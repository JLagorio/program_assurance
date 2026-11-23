// usage: node shots.mjs <build> <outdir> [routes…]   (route "x!views" opens the views menu; "x!eye" opens the first eye)
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const path = await import("path"); const fs = await import("fs");
const build = path.resolve(process.argv[2]), out = path.resolve(process.argv[3]); fs.mkdirSync(out, { recursive: true });
const W = +(process.env.W || 1728), H = +(process.env.H || 964);
const routes = process.argv.slice(4);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: H } });
p.on("pageerror", (e) => console.log("PAGEERROR", e.message));
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
for (const r0 of routes) {
  const [r, mod] = r0.split("!");
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(350);
  if (mod === "views") { await p.click(".k3-vbtn"); await p.waitForTimeout(150); }
  if (mod === "eye") { await p.evaluate(() => { const e = document.querySelector("#main .k3-eye"); if (e) e.click(); }); await p.waitForTimeout(350); }
  if (mod === "manage") { await p.click(".k3-vbtn"); await p.evaluate(() => { const b = [...document.querySelectorAll(".k3-vcmd")].find((x) => /Manage/.test(x.textContent)); b && b.click(); }); await p.waitForTimeout(200); }
  const f = path.join(out, r0.replace(/[^a-z0-9]+/gi, "_") + (W === 1728 ? "" : "-" + W) + ".jpg");
  await p.screenshot({ path: f, type: "jpeg", quality: 60 }); console.log(f);
  await p.keyboard.press("Escape"); await p.evaluate(() => { document.querySelectorAll("details[open]").forEach((d) => (d.open = false)); const c = document.querySelector("#panel [data-close]"); if (c) c.click(); });
}
await b.close();
