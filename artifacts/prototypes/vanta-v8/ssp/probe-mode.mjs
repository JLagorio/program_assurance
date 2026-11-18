import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("file://" + path.resolve(process.argv[2]) + "#home"); await p.waitForTimeout(500);
console.log("moded routes:", await p.evaluate(() => [...window.PA.MODED].join(", ") || "none"));
await p.evaluate(() => { location.hash = "assessments-assessor"; }); await p.waitForTimeout(400);
console.log("assessor view:", await p.evaluate(() => ({ moded: document.getElementById("proto").classList.contains("moded"), head: document.querySelector("#main h1, #main .ak-title-row")?.textContent.trim().slice(0, 80), text: document.getElementById("main").innerText.replace(/\s+/g, " ").slice(0, 300) })));
await b.close();
