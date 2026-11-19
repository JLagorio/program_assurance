// R's spot checks of the remaining job breaks on v2, by the words a reader sees.
import { start } from "./walk.mjs";
const W = await start("checks");
const p = W.p;
const fresh = async (r) => { await p.evaluate(() => { try { sessionStorage.clear(); } catch (e) {} }); await p.goto("about:blank"); await p.goto(process.env.WALK_URL + "#" + r); await p.waitForTimeout(600); };
const fillModal = async (txt = "Reviewer R's test entry") => p.evaluate((txt) => {
  const md = document.getElementById("modal"); const fire = (c) => { c.dispatchEvent(new Event("input", { bubbles: true })); c.dispatchEvent(new Event("change", { bubbles: true })); };
  md.querySelectorAll("select").forEach((s) => { if (!s.value) { const o = [...s.options].find((o) => o.value); if (o) { s.value = o.value; fire(s); } } });
  md.querySelectorAll("input[type=text], input:not([type]), input[type=email], textarea").forEach((c) => { if (!c.value && !c.closest(".dlg-f")) { c.value = c.type === "email" ? "new.person@example.test" : txt; fire(c); } });
  md.querySelectorAll("input[type=date]").forEach((c) => { if (!c.value) { c.value = "2026-12-01"; fire(c); } });
}, txt);
const press = async (why) => { const lab = await p.evaluate(() => { const bs = [...document.querySelectorAll("#modal .dlg-f button, #modal .dlg-f .btn")].filter((x) => x.getBoundingClientRect().height > 0 && !/^(Cancel|Close|Back|Keep editing)$/i.test(x.innerText.trim())); const b = bs.pop(); return b ? b.innerText.trim() : null; }); return lab ? W.click(lab, { within: "#modal", exact: true, why, wait: 700 }) : null; };
const T = (s = "#main") => p.evaluate((s) => (document.querySelector(s) || {}).innerText?.replace(/\s+/g, " ") || "", s);
const out = (k, v) => console.log("CHECK", k, "::", typeof v === "string" ? v.slice(0, 380) : JSON.stringify(v).slice(0, 380));
// (a) Plan an assessment: which opener sits where; fill and press each
await fresh("assessments");
out("a.openers", await p.evaluate(() => [...document.querySelectorAll("#main [data-modal=v2k-plan], #main [data-modal=a-tests-plan]")].map((e) => e.dataset.modal + " in " + (e.closest(".ph, .ak-ph, header, .page-head") ? "header" : (e.closest("[class*=empty], .card, .ak-card, section") || {}).className || "body") + " visible=" + (e.getBoundingClientRect().height > 0) + " text=" + e.innerText.trim())));
for (const key of ["v2k-plan", "a-tests-plan"]) {
  await fresh("assessments");
  await p.click(`#main [data-modal="${key}"]`).catch(() => {}); await p.waitForTimeout(400);
  await fillModal("Reviewer R campaign"); const e = await press("plan " + key);
  out("a.plan." + key, (e && e.effect) + " | tabs: " + ((await T()).match(/Active \d+ Completed \d+/) || [""])[0] + " | listed: " + /Reviewer R campaign/.test(await T()));
}
// (b) Home: Create program, Open offer
await fresh("home");
out("b.home.header", ((await T()).match(/^Home.{0,60}/) || [""])[0]);
let e = await W.click("Open offer", { within: "#main", wait: 600 }); out("b.home.openoffer", (e && e.effect) + " | " + (await T()).slice(0, 160));
// (c) SI-2 Open assessment campaign
await fresh("control-si2");
e = await W.click("Open assessment campaign", { within: "#main", wait: 600 }); out("c.si2.campaign", (e && e.effect) + " | h1 " + (e && e.h1));
await fresh("control-si2");
out("c.si2.top", (await T()).slice(0, 700));
// (d) Evidence review: Accept then Save review
await fresh("evidence");
await W.click("Time source comparison test report", { wait: 500 });
e = await W.click("Accept", { within: "#panel", exact: true, wait: 500 });
await W.click("Accept It meets", { within: "#modal", wait: 300 });
e = await press("save review"); out("d.evidence.accept", (e && e.effect) + " | " + ((await T()).match(/Pending review \d+|Needs revision \d+/g) || []).join(", "));
out("d.evidence.panel", (await T("#panel")).slice(0, 300));
await W.go("review-queue"); out("d.queue.after", ((await T()).match(/All \d+/) || [""])[0]);
// (e) Access review: Keep on the undecided account; Complete review
await fresh("people-access");
await W.click("Quarterly privileged account review (AC-2, AC-6)", { wait: 500 });
const dec = async () => ((await T("#panel")).match(/Keep, revoke or change each account (\d+ of \d+)/) || [])[1];
out("e.decided.before", await dec());
await p.evaluate(() => { const row = [...document.querySelectorAll("#panel tr, #panel li, #panel .row, #panel [class*=acct]")].find((r) => /svc-maint-07/.test(r.innerText)); const k = row && [...row.querySelectorAll("span, button")].find((x) => x.innerText.trim() === "Keep"); if (k) k.click(); });
await p.waitForTimeout(400); out("e.decided.after-keep-svc-maint-07", await dec());
e = await W.click("Complete review", { within: "#panel", exact: true, wait: 600 }); out("e.complete", (e && e.effect) + " | " + (await T("#panel")).slice(0, 420));
// (f) People: Add person → onboarding
await fresh("people");
e = await W.click("Add person", { within: "#main", exact: true, wait: 500 }); out("f.addperson.open", e && e.effect);
out("f.addperson.form", (await T("#modal")).slice(0, 300));
await press("empty submit"); out("f.addperson.empty", (await T("#modal")).slice(0, 200));
await fillModal("Reviewer Newperson"); e = await press("add"); out("f.addperson.submit", (e && e.effect) + " | " + ((await T()).match(/People \d+|All \d+/g) || []).join(", ") + " | listed " + /Reviewer Newperson/.test(await T()));
await fresh("person-local-developer-onboarding");
out("f.onboarding.top", (await T()).slice(0, 400));
e = await W.click("Mark complete", { within: "#main", wait: 500 }); out("f.onboarding.mark1", e && e.effect);
const firstTask = await p.evaluate(() => { const r = [...document.querySelectorAll("#main table tbody tr")][0]; return r ? r.innerText.replace(/\s+/g, " ").slice(0, 60) : null; });
if (firstTask) { e = await W.click(firstTask.slice(0, 25), { within: "#main", wait: 500 }); out("f.onboarding.row", (e && e.effect) + " | " + (await T("#panel")).slice(0, 200)); e = await W.click("Mark complete", { within: "#panel", wait: 500 }); out("f.onboarding.markInPanel", (e && e.effect) + " | " + ((await T()).match(/\d+ of \d+/) || [""])[0]); }
// (g) Wizard step references
await fresh("program-new");
await W.click("From an ITCSC"); await W.click("Drop a completed AF ITCSC here");
for (let i = 0; i < 4; i++) { await W.click("Continue", { exact: true }); const t = await T(); const m = t.match(/[^.]{0,80}step \d[^.]{0,60}/gi); out("g.step" + (i + 2) + " " + (await p.evaluate(() => location.hash)), m ? m.join(" ‖ ") : "(no step reference)"); }
// (h) Review queue lists SSP 3 after submit
await fresh("ssp-review");
await p.fill("#main textarea", "R's review comment.").catch(() => {});
await W.click("Submit for review", { within: "#main", exact: true, wait: 700 });
await W.click("Submit anyway as a draft for ISSM review", { within: "#main", wait: 800 });
await W.go("review-queue"); const rqt = await T(); out("h.queue", (rqt.match(/All \d+/) || [""])[0] + " | SSP row: " + ((rqt.match(/[^|]{0,60}SSP[^|]{0,80}/) || [""])[0]));
await W.go("my-work"); const mwt = await T(); out("h.mywork", ((mwt.match(/Waiting on others.{0,240}/) || [""])[0]));
// (i) My work: Resolve 17 operational issues
await fresh("my-work");
e = await W.click("Resolve 17 operational issues", { wait: 600 }); out("i.resolve17", (e && e.effect) + " | on: " + (await p.evaluate(() => [...document.querySelectorAll("#main .on, #main [aria-pressed=true]")].map((x) => x.innerText.trim().replace(/\s+/g, " ")).filter((t) => t && t.length < 40).join(", "))) + " | rows " + (await p.locator("#main table tbody tr").count()));
await fresh("my-work");
e = await W.click("Treat 2 critical risks", { wait: 600 }); out("i.treat2", (e && e.effect) + " | on: " + (await p.evaluate(() => [...document.querySelectorAll("#main .on, #main [aria-pressed=true]")].map((x) => x.innerText.trim().replace(/\s+/g, " ")).filter((t) => t && t.length < 40).join(", "))) + " | rows " + (await p.locator("#main table tbody tr").count()) + " | panel " + (await T("#panel")).slice(0, 80));
// (j) Requirement preview: Map control
await fresh("requirements");
e = await W.click("REQ-001", { wait: 500 }); out("j.req.preview", e && e.effect);
e = await W.click("Map control", { within: "#panel", exact: true, wait: 500 }); out("j.mapcontrol.open", e && e.effect);
e = await press("map control"); out("j.mapcontrol.press", e && e.effect);
// (k) Campaign request: Accept with a justification
await fresh("campaign-r2");
e = await W.click("Accept", { within: "#main", exact: true, wait: 500 }); await fillModal("Meets the statement."); e = await press("accept"); out("k.accept", (e && e.effect) + " | " + ((await T()).match(/Status \w+/) || [""])[0]);
await W.go("campaign"); out("k.campaign", ((await T()).match(/Ready \d+ Flagged \d+ Accepted \d+/) || [""])[0]);
await W.done();
