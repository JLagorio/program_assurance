// What makes a route scroll sideways, or a strip wrap, with the layer on and off.
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [, , build, route, w] = process.argv;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: 844 } });
await p.goto("file://" + build + "#" + route); await p.waitForTimeout(400);
const probe = () => p.evaluate(() => {
  const main = document.getElementById("main"), mw = main.getBoundingClientRect().right;
  const wide = [...main.querySelectorAll("*")].filter((e) => e.getBoundingClientRect().right > mw + 1 && e.getClientRects().length).slice(0, 6).map((e) => `${e.tagName}.${e.className} w=${Math.round(e.getBoundingClientRect().width)} right=${Math.round(e.getBoundingClientRect().right)}`);
  const tabs = [...document.querySelectorAll("#main .se-mtabs")].map((s) => [...s.children].map((k) => Math.round(k.getBoundingClientRect().top)).join(","));
  return { scroll: main.scrollWidth - main.clientWidth, doc: document.documentElement.scrollWidth - innerWidth, wide, tabs };
});
console.log("ON ", JSON.stringify(await probe()));
await p.evaluate((r) => { PA.v2clean.off = true; PA.v2clean.snap(false); document.getElementById("main").innerHTML = PA.S[r](); }, route);
await p.waitForTimeout(200);
console.log("OFF", JSON.stringify(await probe()));
await b.close();
