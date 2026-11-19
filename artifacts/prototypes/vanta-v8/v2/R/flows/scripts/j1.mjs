import { start } from "./walk.mjs";
const W = await start("j1");
await W.go("home", "a new engineer starts on Home");
await W.shot("01-home-no-create");
W.note("Home has no Create program; its footnote says Create program sits in the program switcher's menu, which only exists on a program page");
await W.click("Programs", { within: "#rail", why: "look for a create on the Programs register" });
await W.click("Create program", { why: "Programs register primary" });
await W.click("From an ITCSC", { why: "job: categorize from the ITCSC" });
await W.click("Drop a completed AF ITCSC here", { why: "choose the example ITCSC file" });
const t0 = await W.text("#main", 3000); console.log(t0.slice(t0.indexOf("Completed ITCSC"), t0.indexOf("Completed ITCSC") + 900));
await W.shot("02-start-itcsc-read");
for (let i = 0; i < 7; i++) {
  const s = await W.click("Continue", { exact: true, why: "next step" });
  if (!s) break;
  const t = await W.text("#main", 4000);
  console.log("=== STEP", s.hash, "|", t.split("\n").slice(0, 40).join(" ¦ ").slice(0, 1800));
  console.log("CONTROLS:", (await W.see()).slice(0, 45).join(" ‖ "));
  await W.shot(`03-${s.hash}`);
  if (/program-start|getting-started|overview/.test(s.hash)) break;
}
await W.done();
