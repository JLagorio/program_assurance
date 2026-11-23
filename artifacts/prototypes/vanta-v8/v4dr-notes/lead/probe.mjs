import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("file://" + process.argv[2] + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); });
await p.evaluate(() => { location.hash = "dr-import--poam"; }); await p.waitForTimeout(600);
console.log(await p.evaluate(() => {
  const t = document.querySelector("#main table.drb-map") || document.querySelector("#main .drb-map table") || document.querySelector("#main .drb-map");
  if (!t) return "no table";
  const tab = t.tagName === "TABLE" ? t : t.querySelector("table");
  const cs = getComputedStyle(tab);
  const cols = [...tab.querySelectorAll("col")].map((c) => c.getAttribute("style") || c.className);
  const ths = [...tab.querySelectorAll("thead th")].map((th) => `${th.className}|${th.getAttribute("style")}|${Math.round(th.getBoundingClientRect().width)}`);
  const td = tab.querySelector("tbody td:nth-child(2)");
  return JSON.stringify({ tag: t.tagName, cls: tab.className, layout: cs.tableLayout, width: Math.round(tab.getBoundingClientRect().width), cols, ths, td2: td && td.outerHTML.slice(0, 200), td2w: td && getComputedStyle(td).width });
}));
await b.close();
