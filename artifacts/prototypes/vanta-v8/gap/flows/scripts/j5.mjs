import { start } from "./walk.mjs";
const W = await start("j5");
await W.go("findings", "Findings › By issue");
let e = await W.click("Payload arm and release commands signed", { why: "open an operational issue", wait: 500 });
console.log("ROW →", e && e.effect);
console.log("PANEL:", (await W.text("#panel", 2500)).replace(/\s+/g, " ").slice(0, 1400));
console.log("PANEL CONTROLS:", (await W.see("panel")).join(" ‖ "));
await W.shot("01-issue-panel");
await W.done();
