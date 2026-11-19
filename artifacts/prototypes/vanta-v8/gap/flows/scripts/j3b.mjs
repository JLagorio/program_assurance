import { start } from "./walk.mjs";
const W = await start("j3b");
await W.go("controls");
for (const t of ["Map a requirement", "Add a note…", "Where it stands", "History 0"]) {
  await W.go("home"); await W.go("controls");
  await W.click("SA-24 Design For Cyber Resiliency", { wait: 400 });
  const e = await W.click(t, { within: "#panel", why: "panel action", wait: 500 });
  console.log(`PANEL "${t}" →`, e && e.effect, "|", (await W.text("#panel", 300)).replace(/\s+/g, " ").slice(0, 200));
}
// The toolbar Map a requirement on the register
await W.go("home"); await W.go("controls");
let e = await W.click("Map a requirement", { within: "#main", why: "register header action", wait: 500 });
console.log("HEADER Map a requirement →", e && e.effect);
// Select SA-24 then the selection bar's Add to assessment campaign
await W.go("home"); await W.go("controls");
const bar = await W.p.evaluate(() => { const t = document.getElementById("main").innerText; const m = t.match(/(\d+) selected/); return m ? m[0] : "no bar"; });
console.log("SELECTION BAR ON ARRIVAL:", bar);
await W.shot("03-controls-arrival", false);
await W.done();
