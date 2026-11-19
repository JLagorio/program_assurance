import { start } from "./walk.mjs";
const W = await start("navgroups");
await W.go("overview");
const g = await W.p.evaluate(() => { const out = []; let cur = "(top)"; for (const e of document.querySelectorAll("#nav [data-group], #nav a.item")) { if (e.matches("[data-group]")) cur = e.innerText.trim().replace(/\s+/g, " "); else out.push(cur + " › " + e.innerText.trim().replace(/\s+\d+%?$/, "").replace(/\s+/g, " ")); } return out; });
console.log(g.join("\n"));
await W.done();
