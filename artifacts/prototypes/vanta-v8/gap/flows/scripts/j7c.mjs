import { start } from "./walk.mjs";
const W = await start("j7c");
await W.go("ssp-review");
const t0 = await W.text("#main", 8000);
await W.click("Submit for review", { within: "#main", exact: true, wait: 800 });
const t1 = await W.text("#main", 8000);
// diff: lines new in t1
const s0 = new Set(t0.split("\n")); console.log("NEW LINES:", t1.split("\n").filter(l => !s0.has(l)).slice(0, 15));
await W.shot("05-submit-blocked");
let e = await W.click("Draft a rationale", { within: "#main", why: "fix the blocker", wait: 900 });
const where = await W.p.evaluate(() => { const a = document.activeElement; const r = [...document.querySelectorAll("[contenteditable=true]")].find(x => /Categorization rationale/.test(x.getAttribute("aria-label") || "")); const rb = r ? r.getBoundingClientRect() : null; return { hash: location.hash, active: a ? (a.getAttribute("aria-label") || a.tagName) : null, rationaleInView: rb ? (rb.top > 0 && rb.top < innerHeight) : null, rationaleText: r ? r.innerText.slice(0, 100) : null }; });
console.log("DRAFT A RATIONALE →", e && e.effect, JSON.stringify(where));
await W.shot("06-draft-rationale-landing");
await W.done();
