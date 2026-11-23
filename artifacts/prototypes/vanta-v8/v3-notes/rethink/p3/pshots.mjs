// Pass 3's scenes for the Before & after page: version 21 beside the build. usage: node pshots.mjs <was.html> <now.html>
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const path = await import("path"); const fs = await import("fs");
const R = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const [was, now] = process.argv.slice(2).map((x) => path.resolve(x));
const SCENES = [
  ["P1", "s1", "evidence", "", 1440, 900], ["P1", "s2", "findings", "views", 1440, 900], ["P1", "s3", "requirements", "manage", 1440, 900], ["P1", "s4", "controls", "", 1440, 900],
  ["P2", "s1", "requirements", "", 1728, 964], ["P2", "s2", "system", "", 1728, 964], ["P2", "s3", "risks", "", 1728, 964],
  ["P3", "s1", "system", "eye", 1440, 900], ["P3", "s2", "findings", "eye", 1440, 900], ["P3", "s3", "documents", "eye", 1440, 900],
];
const b = await chromium.launch();
for (const [which, file] of [["was", was], ["now", now]]) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  p.on("pageerror", (e) => console.log("PAGEERROR", which, e.message));
  await p.goto("file://" + file + "#overview"); await p.waitForTimeout(700);
  await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(400);
  await p.addStyleTag({ content: "#v2-toast, .toast { display: none !important; }" }); // the reset's toast is not part of a scene
  for (const [lane, id, route, mod, w, h] of SCENES) {
    await p.setViewportSize({ width: w, height: h });
    await p.evaluate(() => { document.querySelectorAll("details[open]").forEach((d) => (d.open = false)); const c = document.querySelector("#panel [data-close], #panel .bar-top button:last-child"); if (c) c.click(); const m = document.querySelector("#modal [data-k3-close]"); if (m) m.click(); });
    await p.evaluate((r) => { location.hash = "overview"; setTimeout(() => { location.hash = r; }, 30); }, route); await p.waitForTimeout(420);
    if (mod === "views" && which === "now") { await p.click("#main .k3-vbtn"); await p.waitForTimeout(150); }
    if (mod === "manage" && which === "now") { await p.click("#main .k3-vbtn"); await p.evaluate(() => { const x = [...document.querySelectorAll("#main .k3-vcmd")].find((e) => /Manage/.test(e.textContent)); x && x.click(); }); await p.waitForTimeout(200); }
    if (mod === "eye") { await p.evaluate(() => { const e = document.querySelector("#main .k3-eye"); if (e) e.click(); }); await p.waitForTimeout(380); }
    fs.mkdirSync(path.join(R, lane, "shots"), { recursive: true });
    const f = path.join(R, lane, "shots", `${lane}-${id}-${which}.jpg`);
    await p.screenshot({ path: f, type: "jpeg", quality: 72 }); console.log(f.replace(R + "/", ""));
  }
  await p.close();
}
await b.close();
