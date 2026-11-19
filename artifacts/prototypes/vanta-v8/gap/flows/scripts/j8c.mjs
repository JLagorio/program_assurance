import { start } from "./walk.mjs";
const W = await start("j8c");
await W.go("people-access");
await W.click("Quarterly privileged account review (AC-2, AC-6)", { wait: 500 });
const cnt = () => W.p.evaluate(() => (document.getElementById("panel").innerText.match(/Keep, revoke or change each account\s*(\d+ of \d+)/) || [])[1]);
console.log("decided before:", await cnt());
let e = await W.click("Keep", { within: "#panel", exact: true, why: "decide svc-maint-07", nth: 1, wait: 400 });
console.log("KEEP →", e && e.effect, "| decided:", await cnt());
e = await W.click("Complete review", { within: "#panel", exact: true, why: "finish", wait: 500 });
console.log("COMPLETE →", e && e.effect, "| modal:", (await W.text("#modal", 600)).replace(/\s+/g, " ").slice(0, 300));
// Offboarding reassignment vs the review's reviewer
await W.go("person-victor-amsel-offboarding");
await W.click("Reassign all to Nadia Fournier", { within: "#main", exact: true, wait: 400 });
await W.p.evaluate(() => { location.hash = "people-access"; }); await W.p.waitForTimeout(500);
console.log("REVIEWER after reassign:", await W.p.evaluate(() => { const t = document.getElementById("main").innerText; const i = t.indexOf("Quarterly privileged account review"); return t.slice(i, i + 160).replace(/\s+/g, " "); }));
await W.p.evaluate(() => { location.hash = "people"; }); await W.p.waitForTimeout(500);
console.log("PEOPLE Victor row:", await W.p.evaluate(() => { const r = [...document.querySelectorAll("#main tr")].find(x => /Victor Amsel/.test(x.innerText)); return r ? r.innerText.replace(/\s+/g, " ") : null; }));
await W.done();
