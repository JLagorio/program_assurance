import { start } from "./walk.mjs";
const W = await start("j7");
await W.go("overview");
await W.click("Plans", { within: "#nav", why: "program menu Plans" });
let e = await W.click("System security plan", { why: "open the SSP row", wait: 500 });
console.log("ROW →", e && e.effect, "|", (await W.text("#panel", 1500)).replace(/\s+/g, " ").slice(0, 700));
console.log("PANEL CONTROLS:", (await W.see("panel")).join(" ‖ "));
const open = (await W.see("panel")).find(x => /Open|Edit/.test(x));
console.log("OPEN BTN:", open);
if (open) { e = await W.click(open.split(": ").slice(1).join(": "), { within: "#panel", exact: true, why: "open the editor", wait: 900 }); console.log("OPEN →", e && e.effect); }
await W.shot("01-ssp-editor");
const ce = await W.p.evaluate(() => [...document.querySelectorAll("[contenteditable=true], textarea")].filter(x => x.getBoundingClientRect().height > 0).map(x => (x.getAttribute("aria-label") || x.className) + " :: " + x.innerText.slice(0, 80).replace(/\s+/g, " ")).slice(0, 8));
console.log("EDITABLE:", ce);
console.log("TOP CONTROLS:", (await W.see("#main")).slice(0, 30).join(" ‖ "));
await W.done();
