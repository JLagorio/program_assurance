import { start } from "./walk.mjs";
const W = await start("j8");
await W.go("person-victor-amsel-offboarding", "offboard Victor");
console.log("OFFB:", (await W.text("#main", 3500)).replace(/\s+/g, " ").slice(500, 2200));
await W.shot("01-offboarding-before", true);
const closeState = () => W.p.evaluate(() => { const b = [...document.querySelectorAll("#main button")].find(x => /Close offboarding/.test(x.innerText)); return b ? { disabled: b.disabled || b.getAttribute("aria-disabled"), title: b.title } : null; });
console.log("CLOSE btn:", JSON.stringify(await closeState()));
for (const t of ["Reassign all to Nadia Fournier", "Disable now", "Disable now", "Record manual check", "Record manual check", "Mark returned", "Mark returned", "Record debrief"]) {
  const e = await W.click(t, { within: "#main", exact: true, why: "offboarding step", wait: 400 });
  console.log(`"${t}" →`, e && e.effect);
}
console.log("CLOSE btn after:", JSON.stringify(await closeState()));
console.log("OFFB AFTER:", (await W.text("#main", 3500)).replace(/\s+/g, " ").slice(500, 1800));
await W.shot("02-offboarding-after", true);
const e = await W.click("Close offboarding", { within: "#main", exact: true, why: "finish", wait: 700 });
console.log("CLOSE →", e && e.effect, "|", (await W.text("#modal", 1200)).replace(/\s+/g, " ").slice(0, 500));
await W.done();
