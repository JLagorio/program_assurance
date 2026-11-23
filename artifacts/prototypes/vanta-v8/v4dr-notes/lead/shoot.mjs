// Shoot every Drata pair, current and after, as the tab's Open buttons open them: node shoot.mjs <build.html> <outdir> [pair-id …]
// Needs a build whose PA.DRBA lists the pairs (run gen.py, then build). Writes <outdir>/cur-<id>.jpg and aft-<id>.jpg, 1440×900, q60.
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [build, out, ...only] = process.argv.slice(2);
console.log("build", build);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));
await page.goto("file://" + build + "#overview"); await page.waitForTimeout(800);
await page.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); });
await page.waitForTimeout(4500); // the reset's toast fades
await page.addStyleTag({ content: "#v2-toast { display: none !important; }" });
const pairs = await page.evaluate(() => (PA.DRBA.pairs || []).map((p) => ({ id: p.id, cur: !!(p.current && p.current.route && !p.new), aft: !!(p.after && p.after.route) })));
let n = 0;
for (const p of pairs) {
  if (only.length && !only.includes(p.id)) continue;
  for (const side of ["cur", "aft"]) {
    if (!p[side]) continue;
    await page.evaluate(() => { const m = document.querySelector("[data-close-modal]"); if (m) m.click(); document.querySelectorAll("#panel .k3-x, #panel [data-close-panel]").forEach((b) => b.click()); location.hash = "before-after-drata"; });
    await page.waitForTimeout(350);
    await page.evaluate(([id, s]) => PA.drba.open(id, s), [p.id, side]);
    await page.waitForTimeout(1300);
    await page.mouse.move(5, 895);
    await page.screenshot({ path: `${out}/${side}-${p.id}.jpg`, type: "jpeg", quality: 60 });
    n++;
  }
}
console.log(`${n} shots; page errors: ${errs.length}${errs.length ? " " + errs.slice(0, 3).join(" | ") : ""}`);
await browser.close();
