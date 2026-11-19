// R's own walk of the chain, clicking by the words a reader sees (no data-v2k selectors), then reading every screen that counts it.
import { start } from "./walk.mjs";
const W = await start("chain");
const p = W.p;
const fillModal = async () => p.evaluate(() => {
  const md = document.getElementById("modal"); const fire = (c) => { c.dispatchEvent(new Event("input", { bubbles: true })); c.dispatchEvent(new Event("change", { bubbles: true })); };
  md.querySelectorAll("select").forEach((s) => { if (!s.value || /^(choose|select|—)/i.test(s.options[s.selectedIndex]?.text || "")) { const o = [...s.options].find((o) => o.value && !/^(choose|select)/i.test(o.text)); if (o) { s.value = o.value; fire(s); } } });
  md.querySelectorAll("input[type=text], input:not([type]), textarea").forEach((c) => { if (!c.value && !c.closest(".dlg-f")) { c.value = "Reviewer R's test entry"; fire(c); } });
  const groups = new Set(); md.querySelectorAll("input[type=radio]").forEach((r) => groups.add(r.name)); groups.forEach((g) => { const rs = [...md.querySelectorAll(`input[type=radio][name="${g}"]`)]; if (rs.length && !rs.some((r) => r.checked)) rs[0].click(); });
  return [...md.querySelectorAll("select")].map((s) => s.name + "=" + s.value).join(", ");
});
const press = async (why) => { const lab = await p.evaluate(() => { const bs = [...document.querySelectorAll("#modal .dlg-f button, #modal .dlg-f .btn")].filter((x) => x.getBoundingClientRect().height > 0 && !/^(Cancel|Close|Back|Keep editing)$/i.test(x.innerText.trim())); const b = bs.pop(); return b ? b.innerText.trim() : null; }); if (!lab) { W.note("no primary in dialog"); return null; } return W.click(lab, { within: "#modal", exact: true, why, wait: 700 }); };
const read = async (label, route, rx) => { await W.go(route); const t = await p.evaluate(() => document.getElementById("main").innerText.replace(/\s+/g, " ")); const m = rx ? (t.match(rx) || [])[0] : t.slice(0, 300); W.note(`${label}: ${m}`); console.log(`READ ${label}: ${m}`); return m; };
const rowOf = async (code) => p.evaluate((c) => { const tr = [...document.querySelectorAll("#main table tbody tr")].find((x) => x.innerText.trim().startsWith(c + " ") || x.innerText.includes(c + " Design")); return tr ? tr.innerText.replace(/\s+/g, " ").slice(0, 160) : null; }, code);
const before = {};
before.controls = await read("Controls quick views (start)", "controls", /All \d+ Needs evidence \d+ Not assessed \d+ Short of satisfied \d+ No owner \d+/);
console.log("SA-24 row (start):", await rowOf("SA-24"));
before.overview = await read("Overview open work (start)", "overview", /Open work.{0,260}/);
before.mywork = await read("My work (start)", "my-work", /Urgent.{0,400}/);
before.home = await read("Home WS-X90 card (start)", "home", /WS-X90 Sentinel Mission System PRG-1090 \d+% \d+ of \d+ controls satisfied/);
// 1. Map a requirement from SA-24's preview
await W.go("controls");
await W.click("SA-24 Design For Cyber Resiliency", { why: "open SA-24", wait: 500 });
let e = await W.click("Map a requirement", { within: "#panel", why: "the preview's next step", wait: 500 });
console.log("MAP →", e && e.effect, "| filled:", await fillModal());
e = await press("map"); console.log("MAP PRESS →", e && e.effect);
await W.go("controls"); console.log("SA-24 after map:", await rowOf("SA-24"));
// 2. Link evidence
await W.click("SA-24 Design For Cyber Resiliency", { why: "open SA-24", wait: 500 });
e = await W.click("Link evidence", { within: "#panel", why: "next step", wait: 500 }); console.log("LINK →", e && e.effect, "| filled:", await fillModal());
e = await press("link"); console.log("LINK PRESS →", e && e.effect);
await W.go("controls"); console.log("SA-24 after link:", await rowOf("SA-24"));
// 3. Add to assessment campaign
await W.click("SA-24 Design For Cyber Resiliency", { why: "open SA-24", wait: 500 });
e = await W.click("Add to assessment campaign", { within: "#panel", why: "next step", wait: 500 }); console.log("ADD →", e && e.effect, "| filled:", await fillModal());
e = await press("add"); console.log("ADD PRESS →", e && e.effect);
await W.go("controls"); console.log("SA-24 after add:", await rowOf("SA-24"));
// 4. The campaign: follow SA-24's next step by its words
await W.click("SA-24 Design For Cyber Resiliency", { why: "open SA-24", wait: 500 });
console.log("PREVIEW now:", (await W.text("#panel", 700)).replace(/\s+/g, " ").slice(0, 400));
e = await W.click("Set Ready", { within: "#panel", why: "the preview's next step", wait: 600 });
if (!e || !/campaign/.test(e.hash || "")) { e = await W.click("Open assessment campaign", { within: "#panel", why: "fall back", wait: 600 }); }
console.log("TO CAMPAIGN →", e && e.effect, await p.evaluate(() => location.hash));
e = await W.click("Set Ready", { within: "#main", why: "the request", wait: 500 }); console.log("SET READY →", e && e.effect); await fillModal(); e = await press("ready"); console.log("READY PRESS →", e && e.effect);
e = await W.click("Record determination", { within: "#main", why: "assessor judges", wait: 500 }); console.log("DET →", e && e.effect);
await p.evaluate(() => { const r = [...document.querySelectorAll('#modal input[type=radio]')].find((x) => /other/i.test(x.value + (x.closest("label") || {}).innerText)); if (r) r.click(); });
await fillModal(); e = await press("det"); console.log("DET PRESS →", e && e.effect);
e = await W.click("Publish assessment results", { within: "#main", why: "publish", wait: 500 }); console.log("PUBLISH →", e && e.effect); await fillModal(); e = await press("publish"); console.log("PUBLISH PRESS →", e && e.effect);
await W.go("controls"); console.log("SA-24 after publish:", await rowOf("SA-24"));
const after = {};
after.controls = await read("Controls quick views (after publish)", "controls", /All \d+ Needs evidence \d+ Not assessed \d+ Short of satisfied \d+ No owner \d+/);
after.findings = await read("Findings tabs (after publish)", "findings", /By issue \d+ Vulnerabilities \d+ By asset \d+ Assessment findings \d+/);
// 5. POA&M item from the new issue, by its words
await W.go("findings");
e = await W.click("SA-24", { within: "#main", why: "the issue the publication opened", wait: 500 }); console.log("ISSUE →", e && e.effect, (await W.text("#panel", 400)).replace(/\s+/g, " ").slice(0, 200));
e = await W.click("Create POA&M item", { within: "#panel", why: "remediate", wait: 500 }); console.log("POAM →", e && e.effect); await fillModal(); e = await press("poam"); console.log("POAM PRESS →", e && e.effect);
after.poam = await read("POA&M (after create)", "poam", /Items \d+ Milestones \d+ All \d+/);
e = await W.click("Reviewer R's test entry", { within: "#main", why: "the new item", wait: 500 }); if (!e) e = await W.click("SA-24", { within: "#main", wait: 500 }); console.log("ITEM →", e && e.effect);
e = await W.click("Create risk", { within: "#panel", why: "the risk it carries", wait: 500 }); console.log("RISK →", e && e.effect); await fillModal(); e = await press("risk"); console.log("RISK PRESS →", e && e.effect);
after.risks = await read("Risks (after create)", "risks", /Register \d+ Snapshots \d+ Library \d+ All \d+ Critical or high \d+ No owner \d+ Response date passed \d+ Awaiting acceptance \d+/);
// 6. Request acceptance and the decisions
e = await W.click("Reviewer R's test entry", { within: "#main", why: "the new risk", wait: 500 }); console.log("NEW RISK →", e && e.effect);
e = await W.click("Request acceptance", { within: "#panel", why: "ask", wait: 500 }); console.log("REQ ACC →", e && e.effect); await fillModal(); e = await press("accept"); console.log("REQ ACC PRESS →", e && e.effect);
after.risks2 = await read("Risks (after request)", "risks", /Awaiting acceptance \d+/);
await W.go("authorization");
for (let i = 0; i < 3; i++) { e = await W.click("Record decision", { within: "#main", why: "step " + (i + 1), wait: 500 }); console.log("DECIDE", i + 1, "→", e && e.effect); if (!e || !e.modal) break; await fillModal(); e = await press("decide"); console.log("DECIDE PRESS →", e && e.effect); }
after.auth = await read("Authorization (after decisions)", "authorization", /Residual risk.{0,200}|Accepted by[^.]{0,80}/);
// 7. Every screen that counts it
after.overview = await read("Overview open work (end)", "overview", /Open work.{0,260}/);
after.mywork = await read("My work (end)", "my-work", /Urgent.{0,400}/);
after.home = await read("Home WS-X90 card (end)", "home", /WS-X90 Sentinel Mission System PRG-1090 \d+% \d+ of \d+ controls satisfied/);
after.rail = await p.evaluate(() => [...document.querySelectorAll("#rail a, #nav a")].map((a) => a.innerText.trim().replace(/\s+/g, " ")).filter((t) => /\d/.test(t)).join(" | "));
console.log("RAIL/MENU (end):", after.rail);
console.log("SUMMARY", JSON.stringify({ before, after }, null, 1));
await W.done();
