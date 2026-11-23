// the PDR gate's preview over the Overview, at W (default 1728)
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const W = +(process.env.W || 1728), H = +(process.env.H || 964);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: W, height: H } });
await p.goto("file://" + process.argv[2] + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(2600);
await p.evaluate(() => { const e = [...document.querySelectorAll("#k3o-life tbody tr")].find((r) => /PDR/.test(r.innerText)).querySelector(".k3-eye"); e.click(); }); await p.waitForTimeout(450);
await p.screenshot({ path: process.argv[3], type: "jpeg", quality: 60 }); console.log(process.argv[3]);
await b.close();
