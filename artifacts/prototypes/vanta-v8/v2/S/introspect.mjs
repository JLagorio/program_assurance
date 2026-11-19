import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const file = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));
await page.goto("file://" + file + "#home");
await page.waitForTimeout(800);
const out = await page.evaluate(() => {
  const PA = window.PA;
  const d = PA.data;
  const shape = {};
  for (const [k, v] of Object.entries(d)) shape[k] = Array.isArray(v) ? { n: v.length, first: v[0], second: v[1] } : typeof v === "object" ? Object.keys(v).slice(0, 10) : String(v);
  return {
    P: Object.keys(PA.P), M: Object.keys(PA.M).length, S: Object.keys(PA.S).length,
    shape, v2: Object.keys(PA.v2 || {}), chain: PA.v2 && PA.v2.chain ? Object.keys(PA.v2.chain) : null,
    ssp: Object.keys(PA.SSP), sspctl: PA.SSP.controls.length, sspCtl0: PA.SSP.controls[0], sspReqKeys: Object.keys(PA.SSP.requirements).length,
    sspReqSample: Object.entries(PA.SSP.requirements).slice(0, 3), elements: PA.SSP.elements.slice(0, 5), nElements: PA.SSP.elements.length,
    roles: PA.SSP.roles, other: Object.keys(PA).filter((k) => !["S","P","M"].includes(k)),
  };
});
console.log(JSON.stringify(out, null, 1).slice(0, 9000));
console.log("errors", errs);
await browser.close();
