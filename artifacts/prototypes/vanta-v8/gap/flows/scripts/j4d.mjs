import { start } from "./walk.mjs";
const W = await start("j4d");
await W.go("evidence");
await W.p.click("#main table tbody tr:nth-child(1) td.nm");
await W.p.waitForTimeout(600);
const st = await W.p.evaluate(() => ({ panelHidden: document.getElementById("panel").hidden, panelTxt: document.getElementById("panel").innerText.slice(0, 200), drawers: [...document.querySelectorAll("#main [class*=drawer], #main [class*=split], #main aside, #main .a-docs-side, #main [class*=panel]")].map(e => e.className + ":" + e.innerText.slice(0, 120).replace(/\s+/g, " ")).slice(0, 5) }));
console.log(JSON.stringify(st, null, 1));
await W.shot("05-evidence-row-click");
await W.done();
