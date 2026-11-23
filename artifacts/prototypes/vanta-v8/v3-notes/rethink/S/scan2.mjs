import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const SP = "/private/tmp/claude-501/-Users-joseflagorio-Development-program-assurance-design-system/594d4d59-1431-4a4a-b8c7-702716989aa1/scratchpad/vanta";
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("file://" + SP + "/proto/out/v3r-S.html#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
for (const r of process.argv.slice(2)) {
  await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(2500);
  const t = await p.evaluate(() => document.body.innerText.replace(/[ \t]+/g, " "));
  const lines = t.split("\n").map((x) => x.trim()).filter(Boolean);
  const idx = lines.map((l, i) => (/Mission Computer(?! maintenance| version| Subsystem)|CN-109101|LRU-001/.test(l) ? i : -1)).filter((i) => i >= 0).slice(0, 6);
  console.log("==", r, await p.evaluate(() => location.hash), "lines", lines.length);
  for (const i of idx) console.log("   ", lines.slice(Math.max(0, i - 1), i + 4).join(" | ").slice(0, 300));
  const m = t.match(/[^\n]{0,60}\b(547|640)\b[^\n]{0,60}/g); if (m) console.log("   totals:", m.slice(0, 4).join(" || ").slice(0, 400));
}
await b.close();
