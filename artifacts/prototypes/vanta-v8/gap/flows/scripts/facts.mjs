import { start } from "./walk.mjs";
const W = await start("facts");
const routes = ["home", "overview", "getting-started", "my-work", "my-work-mine", "review-queue", "portfolio", "controls", "baseline", "evidence", "findings", "poam", "risks", "assessments", "authorization", "conmon", "posture", "traceability", "requirements", "ssps", "schedule", "people", "checks", "package-room", "reports"];
const out = {};
for (const r of routes) {
  await W.p.evaluate((r) => { location.hash = r; }, r); await W.p.waitForTimeout(350);
  out[r] = await W.p.evaluate(() => ({ text: document.getElementById("main").innerText.replace(/\s+/g, " ").slice(0, 1400), nav: [...document.querySelectorAll("#nav a.item")].map(a => a.innerText.trim().replace(/\s+/g, " ")).filter(t => /\d/.test(t)), rail: [...document.querySelectorAll("#rail a.ri")].map(a => a.innerText.trim().replace(/\s+/g, " ")).filter(t => /\d/.test(t)) }));
}
await W.done();
import fs from "node:fs"; fs.writeFileSync("../facts.json", JSON.stringify(out, null, 1));
for (const r of routes) console.log("==", r, "| NAV", out[r].nav.join(", "), "| RAIL", out[r].rail.join(", "), "\n   ", out[r].text.slice(0, 700));
