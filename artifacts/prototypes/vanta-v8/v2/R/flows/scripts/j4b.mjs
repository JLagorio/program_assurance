import { start } from "./walk.mjs";
const W = await start("j4b");
await W.go("evidence");
const before = await W.p.evaluate(() => document.getElementById("main").innerText.match(/All\s*(\d+)/)?.[1]);
await W.click("Add evidence", { within: "#main", wait: 400 });
await W.click("Upload a file", { wait: 500 });
// try submitting empty
let e = await W.click("Add evidence", { within: "#modal", why: "submit with nothing chosen", wait: 600 });
console.log("SUBMIT EMPTY →", e && e.effect, "| modal text:", (await W.text("#modal", 600)).replace(/\s+/g, " ").slice(0, 300));
// choose a file if there's a drop zone button
const dz = await W.p.evaluate(() => { const m = document.getElementById("modal"); const d = m.querySelector(".drop, [class*=drop], label, input[type=file]"); return d ? d.outerHTML.slice(0, 200) : null; });
console.log("DROPZONE:", dz);
const ok2 = await W.click("Drop a file", { within: "#modal", why: "choose a file", wait: 500 });
console.log("DROP →", ok2 && ok2.effect, (await W.text("#modal", 800)).replace(/\s+/g, " ").slice(0, 400));
e = await W.click("Add evidence", { within: "#modal", why: "submit", wait: 800 });
console.log("SUBMIT →", e && e.effect);
const after = await W.p.evaluate(() => document.getElementById("main").innerText.match(/All\s*(\d+)/)?.[1]);
console.log("ALL count before/after:", before, after, "| hash", await W.p.evaluate(() => location.hash));
console.log("MAIN:", (await W.text("#main", 800)).replace(/\s+/g, " ").slice(0, 500));
await W.shot("03-after-add");
await W.done();
