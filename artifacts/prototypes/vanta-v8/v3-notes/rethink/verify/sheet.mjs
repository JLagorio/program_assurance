import { createRequire } from "module"; import fs from "fs"; import path from "path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const dir = process.argv[2], per = Number(process.argv[3] || 4), w = Number(process.argv[4] || 320);
const files = fs.readdirSync(dir).filter((f) => /\.jpg$/.test(f) && !/^sheet/.test(f)).sort();
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: per * w, height: 800 } });
for (let i = 0; i < files.length; i += per) {
  const set = files.slice(i, i + per);
  const html = `<body style="margin:0;display:flex;background:#888">` + set.map((f) => `<div style="width:${w}px;position:relative"><img src="data:image/jpeg;base64,${fs.readFileSync(path.join(dir, f)).toString("base64")}" style="width:${w}px;display:block"><div style="position:absolute;left:0;bottom:0;background:#000;color:#fff;font:11px sans-serif;padding:2px 4px">${f}</div></div>`).join("") + `</body>`;
  await page.setContent(html); await page.waitForTimeout(200);
  const h = await page.evaluate(() => document.body.scrollHeight);
  await page.setViewportSize({ width: per * w, height: h });
  await page.screenshot({ path: path.join(dir, `sheet-${String(i / per + 1).padStart(2, "0")}.jpg`), type: "jpeg", quality: 55 });
}
await b.close(); console.log("sheets:", Math.ceil(files.length / per));
