import { start } from "./walk.mjs";
const W = await start("j8b");
const prim = async () => { const b = await W.see("#modal"); const p = b.filter(x => /^button/.test(x) && !/Cancel|✕|Back/.test(x)).pop(); return p ? p.split(": ").slice(1).join(": ") : null; };
await W.go("overview");
await W.click("People", { within: "#nav", why: "program menu People" });
let e = await W.click("Victor Amsel", { why: "open the leaver", wait: 500 });
console.log("ROW →", e && e.effect, "|", (await W.text("#panel", 1200)).replace(/\s+/g, " ").slice(0, 500));
console.log("PANEL CONTROLS:", (await W.see("panel")).join(" ‖ "));
// onboarding a new person
await W.go("people");
e = await W.click("Assign a role", { within: "#main", why: "onboard a newcomer?", wait: 500 });
console.log("ASSIGN →", e && e.effect, "|", (await W.text("#modal", 1500)).replace(/\s+/g, " ").slice(0, 700));
console.log("DIALOG CONTROLS:", (await W.see("#modal")).join(" ‖ "));
await W.shot("03-assign-role");
let p = await prim(); e = await W.click(p, { within: "#modal", exact: true, why: "submit", wait: 700 });
console.log("SUBMIT (" + p + ") →", e && e.effect, "| people count:", await W.p.evaluate(() => (document.getElementById("main").innerText.match(/People\s*(\d+)/) || [])[1]));
// access review
await W.go("people-access");
e = await W.click("Quarterly privileged account review (AC-2, AC-6)", { why: "open the review", wait: 500 });
console.log("REVIEW →", e && e.effect, "|", (await W.text("#panel", 2500)).replace(/\s+/g, " ").slice(0, 1200));
console.log("REVIEW CONTROLS:", (await W.see("panel")).join(" ‖ "));
await W.shot("04-access-review");
await W.done();
