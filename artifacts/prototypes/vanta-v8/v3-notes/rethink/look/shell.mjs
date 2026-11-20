import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const build = process.argv[2], out = process.argv[3];
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(300);
const go = async (r) => { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(400); };
const ok = (n, c) => console.log(c ? "ok  " : "FAIL", n);
const menu = () => p.evaluate(() => [...document.querySelectorAll("#nav a.item")].map((a) => a.innerText.trim() + (a.classList.contains("on") ? "*" : "")).join(" | "));
console.log("menu:", await menu());
for (const [r, want] of [["system", "System*"], ["documents", "Documents*"], ["ssp", "Documents*"], ["sctm", "Controls*"], ["baseline", "Controls*"], ["poam", "Findings*"], ["lifecycle", "Overview*"], ["k3-demo--a", "Controls*"], ["itcsc", "Documents*"]]) {
  await go(r); const m = await menu(); ok(`${r} → ${await p.evaluate(() => location.hash)} marks ${want}`, m.includes(want) || (await p.evaluate(() => document.getElementById("proto").classList.contains("fullwin"))));
}
await go("k3-demo");
await p.evaluate(() => PA.v3k.task.start({ from: { label: "PDR", route: "overview" }, steps: [{ label: "2 connections without an agreement", route: "k3-demo" }, { label: "1 mapping to review", route: "requirements" }] }));
await p.waitForTimeout(400);
ok("return bar on a kit page", await p.evaluate(() => /Back to PDR/.test((document.getElementById("k3task") || {}).innerText || "")));
await p.screenshot({ path: `${out}/shell-bar.jpg`, type: "jpeg", quality: 70 });
await p.click("#k3task .k3-task-n"); await p.waitForTimeout(500);
ok("Next goes to the next step on an old page, bar stays", await p.evaluate(() => location.hash === "#requirements" && /2 of 2/.test((document.getElementById("k3task") || {}).innerText || "")));
await p.click("#k3task .k3-task-b"); await p.waitForTimeout(500);
ok("Back returns and ends", await p.evaluate(() => location.hash === "#overview" && !document.getElementById("k3task")));
await p.evaluate(() => PA.v3.set(false)); await p.waitForTimeout(300);
console.log("off menu:", (await menu()).slice(0, 120));
console.log("errors", errs.slice(0, 6));
await b.close();
