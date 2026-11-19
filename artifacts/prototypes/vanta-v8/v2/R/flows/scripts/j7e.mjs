import { start } from "./walk.mjs";
const W = await start("j7e");
await W.go("ssp-review");
await W.p.fill("#main textarea", "AC-2(1) narrative now names the 30-day account review.");
await W.click("Submit for review", { within: "#main", exact: true, wait: 800 });
let e = await W.click("Submit anyway as a draft for ISSM review", { within: "#main", wait: 900 });
console.log("SUBMIT ANYWAY →", e && e.effect, "|", (await W.text("#main", 1500)).replace(/\s+/g, " ").slice(0, 700));
await W.shot("08-submitted-anyway");
// Does Plans show it in review? (in-page state survives hash routes)
await W.p.evaluate(() => { location.hash = "ssps"; }); await W.p.waitForTimeout(500);
console.log("PLANS:", (await W.text("#main", 1200)).replace(/\s+/g, " ").slice(0, 600));
await W.p.evaluate(() => { location.hash = "authorization"; }); await W.p.waitForTimeout(500);
console.log("AUTH SSP ROW:", await W.p.evaluate(() => { const r = [...document.querySelectorAll("#main table tbody tr")].find(x => /System security plan Revision 3/.test(x.innerText)); return r ? r.innerText.replace(/\s+/g, " ") : null; }));
e = await W.click("Submit for approval", { within: "#main", exact: true, why: "send the package to the AO", wait: 600 });
console.log("SUBMIT PKG →", e && e.effect, "|", (await W.text("#modal", 2500)).replace(/\s+/g, " ").slice(0, 1200));
console.log("DIALOG CONTROLS:", (await W.see("#modal")).join(" ‖ "));
await W.shot("09-submit-package");
const b = await W.see("#modal"); const p = b.filter(x => /^button/.test(x) && !/Cancel|✕|Back/.test(x)).pop();
if (p) { e = await W.click(p.split(": ").slice(1).join(": "), { within: "#modal", exact: true, why: "confirm", wait: 900 }); console.log("CONFIRM (" + p + ") →", e && e.effect); }
console.log("AUTH AFTER:", (await W.text("#main", 900)).replace(/\s+/g, " ").slice(0, 500));
await W.done();
