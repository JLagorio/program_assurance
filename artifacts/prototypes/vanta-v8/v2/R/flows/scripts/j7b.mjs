import { start } from "./walk.mjs";
const W = await start("j7b");
await W.go("ssp", "SSP editor"); await W.p.waitForTimeout(600);
const target = await W.p.evaluate(() => { const els = [...document.querySelectorAll("[contenteditable=true]")]; const t = els.find(x => /AC-2\b|Account Management/i.test((x.getAttribute("aria-label") || "") + x.innerText)); if (!t) return els.map(x => x.getAttribute("aria-label")).slice(8, 30); t.setAttribute("data-edit-me", "1"); t.scrollIntoView({ block: "center" }); return t.getAttribute("aria-label"); });
console.log("TARGET:", target);
const savedBefore = await W.p.evaluate(() => (document.getElementById("main").innerText.match(/Saved[^\n]*/) || [])[0]);
if (typeof target === "string") {
  await W.p.click("[data-edit-me]"); await W.p.keyboard.press("End"); await W.p.keyboard.type(" Accounts are reviewed every 30 days by the ISSO.");
  await W.p.waitForTimeout(400); await W.p.click("body", { position: { x: 5, y: 5 } }); await W.p.waitForTimeout(800);
  W.note("typed into " + target);
}
const savedAfter = await W.p.evaluate(() => (document.getElementById("main").innerText.match(/Saved[^\n]*/) || [])[0]);
const toasts = await W.p.evaluate(() => [...document.querySelectorAll(".ak-toast")].map(t => t.innerText.replace(/\s+/g, " ")));
console.log("SAVED before/after:", savedBefore, "/", savedAfter, "| toasts", toasts);
await W.shot("02-narrative-edited");
let e = await W.click("Submit for review", { within: "#main", exact: true, why: "header primary", wait: 700 });
console.log("SUBMIT →", e && e.effect);
console.log("REVIEW PAGE:", (await W.text("#main", 3500)).replace(/\s+/g, " ").slice(0, 1600));
const changed = await W.p.evaluate(() => /AC-2/.test(document.getElementById("main").innerText));
console.log("AC-2 listed in change summary:", changed);
await W.shot("03-submit-review-page", true);
e = await W.click("Submit for review", { within: "#main", exact: true, nth: 0, why: "submit on the review page", wait: 800 });
console.log("SUBMIT2 →", e && e.effect, "|", (await W.text("#main", 1200)).replace(/\s+/g, " ").slice(0, 600));
await W.shot("04-after-submit");
await W.done();
