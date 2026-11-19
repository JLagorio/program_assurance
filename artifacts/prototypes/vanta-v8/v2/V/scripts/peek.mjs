// node peek.mjs <build> <route> <js-expression-in-page>
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [, , build, route, expr] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("pageerror", (e) => console.log("PAGEERROR", String(e)));
await page.goto("file://" + build + "#" + route);
await page.waitForTimeout(400);
console.log(await page.evaluate(expr));
await browser.close();
