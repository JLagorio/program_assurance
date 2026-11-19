// node shoot.mjs <html> <outDir> <prefix> <tall:0|1> route…  — screenshots at 1440 and 390, page errors, sideways scroll.
import { createRequire } from "node:module"; import path from "node:path"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, out, prefix, tall, ...routes] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const report = [];
for (const w of [1440, 390]) {
  const p = await b.newPage({ viewport: { width: w, height: w > 600 ? 900 : 844 } });
  const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
  await p.goto("file://" + path.resolve(html) + "#home"); await p.waitForTimeout(400);
  for (const r of routes) {
    errs.length = 0;
    await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(350);
    const m = await p.evaluate(() => {
      const de = document.documentElement, main = document.getElementById("main");
      const wide = [...document.querySelectorAll("#main *")].filter((e) => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 && r.width > 0 && getComputedStyle(e).position !== "fixed"; }).filter((e) => { let a = e.parentElement; while (a && a.id !== "main") { const s = getComputedStyle(a); if (/(auto|scroll|hidden)/.test(s.overflowX)) return false; a = a.parentElement; } return true; }).slice(0, 4).map((e) => e.tagName.toLowerCase() + "." + [...e.classList].join(".") + " r=" + Math.round(e.getBoundingClientRect().right));
      return { docW: de.scrollWidth, vw: innerWidth, mainSW: main.scrollWidth, mainCW: main.clientWidth, mainSH: main.scrollHeight, wide };
    });
    const f = `${out}/${prefix}-${w}-${r}.png`;
    await p.screenshot({ path: f });
    if (tall === "1") {
      const hgt = Math.min(m.mainSH + 80, 6000);
      await p.setViewportSize({ width: w, height: hgt }); await p.waitForTimeout(150);
      await p.screenshot({ path: `${out}/${prefix}-${w}-${r}-tall.png` });
      await p.setViewportSize({ width: w, height: w > 600 ? 900 : 844 }); await p.waitForTimeout(100);
    }
    report.push(`${w} ${r}: ${errs.length ? "ERR " + errs.join(" | ") : "ok"}${m.docW > m.vw + 1 || m.mainSW > m.mainCW + 1 ? ` SIDEWAYS doc=${m.docW} main=${m.mainSW}/${m.mainCW} ${m.wide.join(", ")}` : ""} h=${m.mainSH}`);
  }
  await p.close();
}
await b.close();
console.log(report.join("\n"));
