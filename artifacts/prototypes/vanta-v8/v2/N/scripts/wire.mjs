import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, out] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = []; p.on("pageerror", (e) => errors.push(String(e)));
await p.goto("file://" + path.resolve(html) + "#nav-options"); await p.waitForTimeout(600);
await p.click('.v9n-opt[data-v9n-opt="2"]'); await p.waitForTimeout(150);
await p.click('#v9n-box .v9n-rail [data-v9n-to="w:library"]'); await p.waitForTimeout(150);
await p.locator("#v9n-box").screenshot({ path: `${out}/wire-opt3-library.png` });
await p.click('[data-v9n-scr="phone"]'); await p.waitForTimeout(150);
const burger = await p.$("#v9n-box .v9n-burger"); if (burger) { await burger.click(); await p.waitForTimeout(150); }
await p.locator("#v9n-box").screenshot({ path: `${out}/wire-opt3-library-phone.png` });
console.log("burger", !!burger, "errors", errors);
await b.close();
