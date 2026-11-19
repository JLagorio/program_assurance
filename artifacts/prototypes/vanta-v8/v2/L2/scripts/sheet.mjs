// node sheet.mjs <out.png> <img>… : a contact sheet of screenshots side by side.
import { createRequire } from "node:module"; import path from "node:path"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [out, ...imgs] = process.argv.slice(2);
const html = `<body style="margin:0;display:flex;gap:8px;background:#ccc">${imgs.map((f) => `<img src="data:image/png;base64,${fs.readFileSync(f).toString("base64")}" style="width:390px">`).join("")}</body>`;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: imgs.length * 398, height: 844 } });
await p.setContent(html); await p.waitForTimeout(300); await p.screenshot({ path: out, fullPage: true }); await b.close();
