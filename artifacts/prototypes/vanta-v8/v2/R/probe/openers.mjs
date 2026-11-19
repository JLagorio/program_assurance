// List every visible opener on a route whose words match, with its data attributes: node openers.mjs <html> <route> <regex>
import { createRequire } from "node:module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [html, route, rx] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("file://" + html + "#" + route); await p.waitForTimeout(700);
const out = await p.evaluate((rx) => [...document.querySelectorAll("#main *")].filter((e) => e.children.length < 4 && new RegExp(rx, "i").test((e.innerText || "").trim()) && e.getBoundingClientRect().height > 0 && (e.matches("button,a,[role=button],[data-modal],[data-go],[data-v2k],.btn") )).map((e) => e.tagName + " | " + (e.innerText || "").trim().replace(/\s+/g, " ").slice(0, 50) + " | " + [...e.attributes].filter((a) => a.name.startsWith("data-") || a.name === "href").map((a) => a.name + "=" + a.value.slice(0, 40)).join(" ")), rx);
console.log(out.join("\n")); await b.close();
