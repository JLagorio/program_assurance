// node tile.mjs <out.png> <scale> img…  — tiles screenshots side by side in a browser canvas
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const fs = await import("fs");
const [, , out, scale, ...imgs] = process.argv;
const b = await chromium.launch(); const p = await b.newPage();
const data = imgs.map((f) => "data:image/png;base64," + fs.readFileSync(f).toString("base64"));
await p.setContent(`<body style="margin:0;background:#fff"><div id=w style="display:flex;gap:8px;align-items:flex-start">${data.map((d) => `<img src="${d}" style="zoom:${scale}">`).join("")}</div></body>`);
await p.waitForTimeout(300);
const el = await p.$("#w"); await el.screenshot({ path: out });
await b.close(); console.log("tiled", imgs.length);
