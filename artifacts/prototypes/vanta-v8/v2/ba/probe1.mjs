import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, route, sel] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("file://" + html + "#" + route, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(600);
console.log(await p.evaluate((sel) => [...document.querySelectorAll(sel)].slice(0, 8).map((e) => ({ tag: e.tagName, panel: e.dataset.panel, id: e.dataset.id, go: e.dataset.go, txt: e.textContent.trim().slice(0, 50), vis: !!e.offsetParent })), sel));
await b.close();
