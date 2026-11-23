// node final-shots.mjs <build>: every after route of lane A at 1440x900 (and the register with rows chosen, the compare dialog).
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const build = process.argv[2]; console.log("build", build);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(2800);
const shot = async (r, name, fn) => { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(500); if (fn) { await fn(); await p.waitForTimeout(350); } await p.screenshot({ path: `after-${name}.jpg`, type: "jpeg", quality: 60 }); console.log(name); };
await shot("dr-controls", "register");
await shot("dr-controls", "register-chosen", () => p.evaluate(() => { [...document.querySelectorAll("input[data-dra-sel]")].slice(2, 5).forEach((x) => x.click()); }));
for (const t of ["", "--requirements", "--evidence", "--assessment", "--findings", "--risks", "--history"]) await shot(`dr-control--AC-17(4)${t}`, "record" + (t || "--overview"));
await shot("dr-control--AC-17(4)", "record-cards", () => p.evaluate(() => document.querySelector(".dra-grid").scrollIntoView()));
await shot("dr-control--AC-17(4)", "compare", () => p.evaluate(() => { document.querySelector(".dra-impl").scrollIntoView(); document.querySelector(".dra-impl tbody tr:first-child button").click(); }));
await b.close();
