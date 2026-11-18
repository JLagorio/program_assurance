// Exercise the Navigation options page: node probe-v9.mjs <prototype.html> <shotsDir>
import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const file = "file://" + path.resolve(process.argv[2]), out = process.argv[3];
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = []; p.on("pageerror", (e) => errors.push(String(e)));
const res = []; const ok = (n, c, x = "") => res.push(`${c ? "PASS" : "FAIL"} ${n}${x ? " · " + x : ""}`);
const q = (sel) => p.evaluate((s) => !!document.querySelector(s), sel);
const click = async (sel) => { await p.click(sel); await p.waitForTimeout(120); };
const frame = (sel) => `#v9n-box ${sel}`;
await p.goto(file + "#nav-options"); await p.waitForTimeout(700);
ok("nav item drawn", await q('#nav a[href="#nav-options"]'));
ok("page drawn", await q("#v9n-root .v9n-opt"));
await p.screenshot({ path: `${out}/page-1440.png`, fullPage: true });
// Where a program page's content starts, unzoomed, in each option (on Risks)
const Y = {};
for (let i = 0; i < 5; i++) {
  await click(`.v9n-opt[data-v9n-opt="${i}"]`);
  Y[i] = await p.evaluate(() => { const s = document.querySelector("#v9n-box .v9n-scr"), z = s.style.zoom; s.style.zoom = "1"; const f = s.querySelector(".v9n-tool2"); const y = f ? Math.round(f.getBoundingClientRect().top - s.getBoundingClientRect().top) : -1; s.style.zoom = z; return y; });
  await p.locator("#v9n-box").screenshot({ path: `${out}/opt${i + 1}.png` });
}
ok("content start measured", Object.values(Y).every((y) => y > 0), JSON.stringify(Y));
// 1 nested
await click('.v9n-opt[data-v9n-opt="0"]');
ok("1: program nested under Programs", await q(frame(".v9n-side .v9n-nest [data-v9n-to='p:risks'].on")));
await click(frame('[data-v9n-to="w:my-work"]'));
ok("1: leaving the program folds it", !(await q(frame(".v9n-nest"))));
await click(frame('.v9n-side [data-v9n-to="w:programs"]'));
await click(frame('.v9n-row[data-v9n-prog="1"]'));
ok("1: choosing a program opens it", await q(frame(".v9n-nest [data-v9n-to='p:overview'].on")) && /Customer A/.test(await p.locator(frame(".v9n-sw")).innerText()));
await click(frame("[data-v9n-sw]"));
ok("1: switcher opens", await q(frame(".v9n-menu")));
await p.keyboard.press("Escape"); await p.waitForTimeout(120);
ok("1: Esc closes the switcher", !(await q(frame(".v9n-menu"))));
await click(frame("[data-v9n-sw]")); await click(frame('.v9n-menu [data-v9n-prog="0"]'));
ok("1: switch back to WS-X90", /WS-X90/.test(await p.locator(frame(".v9n-sw")).innerText()));
await click('[data-v9n-v1="inplace"]');
const pushed = await p.evaluate(() => { const s = document.querySelector("#v9n-box .v9n-side"), st = s.querySelector('[data-v9n-to="w:settings"]'); return st.offsetTop > s.clientHeight; });
ok("1b: in place pushes Settings below the fold", pushed);
await click('[data-v9n-v1="last"]');
// 2 drill
await click('.v9n-opt[data-v9n-opt="1"]');
ok("2: program level shows ‹ Workspace", await q(frame('[data-v9n-level="workspace"]')));
await click(frame('[data-v9n-level="workspace"]'));
ok("2: workspace level keeps the page and offers the program", await q(frame('[data-v9n-level="program"]')) && await q(frame(".v9n-pg .v9n-h")));
await click(frame('[data-v9n-level="program"]'));
ok("2: back into the program", await q(frame('[data-v9n-level="workspace"]')));
// 3 rail
await click('.v9n-opt[data-v9n-opt="2"]');
ok("3: rail and program menu", await q(frame(".v9n-rail")) && await q(frame(".v9n-pside")));
await click(frame('.v9n-rail [data-v9n-to="w:home"]'));
ok("3: outside a program only the rail", await q(frame(".v9n-rail")) && !(await q(frame(".v9n-pside"))));
await click(frame('.v9n-card[data-v9n-prog="0"]'));
ok("3: a Home card opens the program", await q(frame(".v9n-pside [data-v9n-to='p:overview'].on")));
// 4 top
await click('.v9n-opt[data-v9n-opt="3"]');
ok("4: links in the top bar, program sidebar", await q(frame(".v9n-top .v9n-tl")) && await q(frame(".v9n-pside")));
await click(frame('.v9n-tl [data-v9n-to="w:library"]'));
ok("4: elsewhere no sidebar", !(await q(frame(".v9n-side"))));
// 5 tabs
await click('.v9n-opt[data-v9n-opt="4"]');
await click(frame('.v9n-side [data-v9n-to="w:programs"]')); await click(frame('.v9n-row[data-v9n-prog="0"]'));
await click(frame('.v9n-tabs [data-v9n-to="p:baseline"]'));
ok("5: Compliance tab shows its pages", /Evidence/.test(await p.locator(frame(".v9n-sub2")).innerText()));
// Phone
await click('[data-v9n-scr="phone"]');
for (let i = 0; i < 5; i++) {
  await click(`.v9n-opt[data-v9n-opt="${i}"]`);
  const burger = await q(frame(".v9n-burger"));
  if (burger) await click(frame(".v9n-burger"));
  await p.locator("#v9n-box").screenshot({ path: `${out}/phone${i + 1}.png` });
  if (burger) { ok(`phone ${i + 1}: drawer opens`, await q(frame(".v9n-drw"))); await p.keyboard.press("Escape"); await p.waitForTimeout(100); }
}
await click('[data-v9n-scr="desktop"]');
// 390 wide
await p.setViewportSize({ width: 390, height: 844 }); await p.goto("about:blank"); await p.goto(file + "#nav-options"); await p.waitForTimeout(600);
const ov = await p.evaluate(() => ({ doc: document.documentElement.scrollWidth > innerWidth, main: (() => { const m = document.getElementById("main"); return m.scrollWidth > m.clientWidth + 2; })(), phone: !!document.querySelector("#v9n-box .v9n-p") }));
ok("390: no overflow, phone frame by default", !ov.doc && !ov.main && ov.phone, JSON.stringify(ov));
await p.screenshot({ path: `${out}/page-390.png`, fullPage: true });
for (const r of res) console.log(r);
console.log("errors:", errors.length ? [...new Set(errors)].slice(0, 5).join(" | ") : "none");
await b.close();
