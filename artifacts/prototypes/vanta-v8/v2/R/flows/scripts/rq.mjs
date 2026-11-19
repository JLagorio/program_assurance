import { start } from "./walk.mjs";
const W = await start("rq");
await W.go("review-queue");
const w0 = await W.p.evaluate(() => (document.getElementById("main").innerText.match(/Waiting\s*(\d+)/) || [])[1]);
const row0 = await W.p.evaluate(() => document.querySelector("#main table tbody tr").innerText.replace(/\s+/g, " ").slice(0, 90));
await W.p.click("#main table tbody tr:nth-child(1) td:nth-child(2)"); await W.p.waitForTimeout(400);
const e = await W.click("Accept evidence", { within: "#panel", exact: true, wait: 600 });
const w1 = await W.p.evaluate(() => (document.getElementById("main").innerText.match(/Waiting\s*(\d+)/) || [])[1]);
const row1 = await W.p.evaluate(() => document.querySelector("#main table tbody tr").innerText.replace(/\s+/g, " ").slice(0, 90));
console.log("ACCEPT →", e && e.effect, "| waiting", w0, "→", w1, "| first row same:", row0 === row1, "| panel:", (await W.text("#panel", 600)).replace(/\s+/g, " ").slice(0, 250));
await W.shot("after-accept");
// requirement preview Map control
await W.go("requirements");
await W.click("REQ-001", { wait: 400 });
let e2 = await W.click("Map control", { within: "#panel", exact: true, wait: 400 });
console.log("MAP CONTROL →", e2 && e2.effect, "|", (await W.text("#modal", 600)).replace(/\s+/g, " ").slice(0, 300));
const prim = await W.p.evaluate(() => { const b = [...document.querySelectorAll("#modal .dlg-f button")].pop(); return b ? b.innerText + " closer=" + b.hasAttribute("data-close-modal") : null; });
console.log("PRIMARY:", prim);
await W.done();
