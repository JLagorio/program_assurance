import { start } from "./walk.mjs";
const W = await start("j3c");
await W.go("control-si2", "the one control with a full record");
await W.shot("04-si2");
for (const tab of ["control-si2-requirements", "control-si2-evidence", "control-si2-assessment", "control-si2-findings"]) {
  await W.go(tab);
  console.log("=== TAB", tab, "|", (await W.text("#main", 3000)).replace(/\s+/g, " ").slice(0, 900));
  console.log("CONTROLS:", (await W.see()).slice(0, 40).join(" ‖ "));
}
await W.done();
