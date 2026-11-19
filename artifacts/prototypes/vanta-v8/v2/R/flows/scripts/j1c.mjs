import { start } from "./walk.mjs";
const W = await start("j1c");
await W.go("program-new");
await W.click("From an ITCSC"); await W.click("Drop a completed AF ITCSC here");
for (let i = 0; i < 5; i++) await W.click("Continue", { exact: true });
await W.click("Create program", { exact: true, wait: 4500 });
const st = await W.p.evaluate(() => ({ hash: location.hash, inprog: document.getElementById("shell").classList.contains("inprog"), sw: (document.getElementById("swBtn") || {}).innerText, navOn: (document.querySelector("#nav a.item.on") || {}).innerText, railOn: (document.querySelector("#rail a.ri.on") || {}).getAttribute?.("href") }));
console.log("LANDED STATE", JSON.stringify(st));
await W.shot("04-getting-started-new");
const btns = ["Invite people", "View", "Import", "Open requirements", "Connect", "Open the SSP", "Upload", "Open assessments"];
const res = [];
for (const b of btns) {
  // come back to the landing page each time
  await W.go(st.hash.slice(1));
  const s = await W.click(b, { exact: true, why: "starter guide step" , wait: 600});
  const where = await W.p.evaluate(() => ({ hash: location.hash, sw: (document.getElementById("swBtn") || {}).innerText?.replace(/\s+/g, " "), h1: (document.querySelector("#main h1") || {}).innerText, txt: document.getElementById("main").innerText.slice(0, 160).replace(/\s+/g, " ") }));
  res.push([b, s && s.effect, JSON.stringify(where)]);
}
for (const r of res) console.log("STEP-BTN", r.join(" | "));
// the rest of the page text
await W.go(st.hash.slice(1));
const t = await W.text("#main", 6000); console.log("TAIL:", t.slice(2400, 4200));
// Does Programs list the new program?
await W.go("portfolio");
const pt = await W.text("#main", 3000); console.log("PORTFOLIO has PRG-2301:", /PRG-2301|Eject Launch · Customer D/.test(pt), "| All count:", (pt.match(/All\s*\n?\s*(\d+)/) || [])[1]);
await W.go("home"); const ht = await W.text("#main", 3000); console.log("HOME has new program:", /PRG-2301|Customer D/.test(ht));
await W.p.evaluate(() => { location.hash = "overview"; }); await W.p.waitForTimeout(400);
const swm = await W.p.evaluate(() => [...document.querySelectorAll("#nav a")].slice(0, 7).map(a => a.innerText.trim().replace(/\s+/g, " ")));
console.log("SWITCHER LIST:", swm);
await W.done();
