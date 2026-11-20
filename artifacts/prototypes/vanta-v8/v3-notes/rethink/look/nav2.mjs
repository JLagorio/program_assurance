import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [build, out] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("file://" + build + "#overview"); await p.waitForTimeout(700);
await p.evaluate(() => { sessionStorage.clear(); PA.v2.reset(); PA.v3.set(true); }); await p.waitForTimeout(400);
const st = () => p.evaluate(() => ({ hash: location.hash, h1: (document.querySelector("#main h1") || {}).innerText, level: PA.v3nav.level(), nav: [...document.querySelectorAll("#nav .item, #nav .v3n-back, #nav .v3n-ws")].map((e) => (e.classList.contains("on") ? "*" : "") + e.innerText.replace(/\s+/g, " ").trim()).join(" | ").slice(0, 330), cols: getComputedStyle(document.getElementById("shell")).gridTemplateColumns, rail: getComputedStyle(document.getElementById("rail")).display }));
let ok = 0, bad = 0; const t = (name, cond, extra) => { cond ? ok++ : bad++; console.log(cond ? "ok  " : "FAIL", name, extra === undefined ? "" : JSON.stringify(extra).slice(0, 420)); };
let s = await st(); t("in a program: ‹ Workspace, then the program's ten places", s.level === "inside" && /^\S?\s*Workspace \|/.test(s.nav) && /\*Overview/.test(s.nav) && /^240px/.test(s.cols) && s.rail === "none", s);
await p.click("#nav [data-v3n=up]"); await p.waitForTimeout(250); s = await st();
t("‹ Workspace: the sidebar goes up a level, the page stays", s.hash === "#overview" && s.level === "workspace" && /Home \| My work/.test(s.nav) && /\*WS-X90/.test(s.nav), s);
await p.screenshot({ path: `${out}/nav2-up.jpg`, type: "jpeg", quality: 60 });
await p.click("#nav [data-v3n=in]"); await p.waitForTimeout(250); s = await st();
t("WS-X90 ›: back into the program's menu", s.level === "inside" && /\*Overview/.test(s.nav), s);
await p.click("#nav [data-v3n=up]"); await p.waitForTimeout(200);
for (const label of ["Library", "Settings", "Products", "AI agents", "About", "My work", "Review queue", "Programs", "Home"]) {
  if ((await st()).level === "inside") { await p.click("#nav [data-v3n=up]"); await p.waitForTimeout(200); }
  await p.click(`#nav a.item:has-text("${label}")`); await p.waitForTimeout(500); s = await st();
  console.log("  ", label.padEnd(13), JSON.stringify({ hash: s.hash, h1: s.h1, level: s.level, nav: s.nav.slice(0, 200) }));
  if (label === "Library") await p.screenshot({ path: `${out}/nav2-library.jpg`, type: "jpeg", quality: 60 });
}
await p.click("#nav [data-v3n=in]"); await p.waitForTimeout(500); s = await st();
t("from Home, WS-X90 › opens the program", s.hash === "#overview" && s.level === "inside", s);
await p.evaluate(() => { location.hash = "controls"; }); await p.waitForTimeout(500); s = await st();
t("moving inside the program keeps its menu", s.level === "inside" && /\*Controls/.test(s.nav), s);
await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(400);
t("a phone keeps its bottom bar", await p.evaluate(() => getComputedStyle(document.getElementById("bottom")).display !== "none" && document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1));
await p.screenshot({ path: `${out}/nav2-phone.jpg`, type: "jpeg", quality: 60 });
console.log(ok, "ok,", bad, "failed; errors", errs.slice(0, 4));
await b.close();
