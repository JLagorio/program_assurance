import { start } from "./walk.mjs";
const W = await start("j2e");
await W.go("findings-vulns");
await W.p.click("#main table tbody tr:nth-child(1) td:nth-child(2)"); await W.p.waitForTimeout(500);
console.log("CVE row real click → panel hidden?", await W.p.evaluate(() => document.getElementById("panel").hidden), await W.p.evaluate(() => location.hash));
await W.p.click("#main table tbody tr:nth-child(1) td:nth-child(3)"); await W.p.waitForTimeout(500);
console.log("CVE title cell → panel hidden?", await W.p.evaluate(() => document.getElementById("panel").hidden), await W.p.evaluate(() => location.hash));
await W.done();
