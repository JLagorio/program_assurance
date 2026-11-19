// C2's walk of prototype v2: node walk.mjs <build.html> — hubs, state across screens, a new program, people, assessment mode, counts.
// Each step asserts what a reader would see. Writes walk.log beside this file.
import { createRequire } from "node:module"; import path from "node:path"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const html = path.resolve(process.argv[2] || "out/v2-C2.html");
const here = path.dirname(new URL(import.meta.url).pathname);
const lines = []; let pass = 0, fail = 0;
const ok = (label, cond, detail = "") => { lines.push(`${cond ? "PASS" : "FAIL"}  ${label}${detail ? "  · " + String(detail).slice(0, 220) : ""}`); cond ? pass++ : fail++; };
const b = await chromium.launch();

async function session(width) {
  const p = await b.newPage({ viewport: { width, height: width > 600 ? 900 : 844 } });
  const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
  await p.goto("file://" + html + "#home"); await p.waitForTimeout(500);
  await p.evaluate(() => { try { sessionStorage.clear(); } catch (e) {} });
  await p.reload(); await p.waitForTimeout(500);
  return { p, errs };
}
const go = async (p, r, w = 450) => { await p.evaluate((x) => { location.hash = x; }, r); await p.waitForTimeout(w); };
const hash = (p) => p.evaluate(() => location.hash.slice(1));
const text = (p, sel) => p.$eval(sel, (x) => x.textContent.replace(/\s+/g, " ").trim()).catch(() => "");
const panel = (p) => p.evaluate(() => { const x = document.getElementById("panel"); return x.hidden ? "" : x.textContent.replace(/\s+/g, " ").trim(); });
const qvOn = (p) => p.$$eval("#main .qv.on, #main .qv[aria-pressed=true]", (q) => q.map((x) => x.textContent.replace(/\s+/g, " ").trim()));
const visRows = (p) => p.$$eval("#main tbody tr", (t) => t.filter((r) => !r.hidden && r.offsetParent).map((r) => r.textContent.replace(/\s+/g, " ").trim()));
const noSideways = (p) => p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1 && (document.getElementById("main").scrollWidth <= document.getElementById("main").clientWidth + 1));
async function clickRow(p, title) {
  await go(p, "my-work");
  const rows = await p.$$("#main a.a-work-mw");
  for (const r of rows) if ((await r.textContent()).includes(title)) { await r.click(); await p.waitForTimeout(750); return true; }
  return false;
}

for (const width of [1440, 390]) {
  lines.push(`\n=== ${width}px ===`);
  const { p, errs } = await session(width);
  // ——— 1. Hubs land where they point [B2] ———
  await go(p, "my-work");
  ok(`${width} My work has no sideways scroll`, await noSideways(p));
  await clickRow(p, "Remediate CVE-2024-6387");
  let rows = await visRows(p);
  ok(`${width} CVE row lands on Vulnerabilities with the CVE kept`, (await hash(p)) === "findings-vulns" && rows.length === 1 && rows[0].includes("CVE-2024-6387"), `${await hash(p)} · ${rows.length} rows`);
  ok(`${width} …and its operational issue's preview open`, /Operational issue preview/.test(await panel(p)) && /CVE-2024-6387/.test(await panel(p)));
  await clickRow(p, "past their remediation date");
  const lateCount = +((await text(p, "#main .qv.on")).match(/\d+/) || [0])[0];
  ok(`${width} Past-due row opens Findings on Past due`, (await hash(p)) === "findings" && (await qvOn(p)).some((x) => /^Past due/.test(x)), (await qvOn(p)).join(","));
  await go(p, "my-work");
  const lateRow = (await p.$$eval("#main a.a-work-mw", (a) => a.map((x) => x.textContent))).find((x) => /past their remediation date/.test(x)) || "";
  ok(`${width} …and the row's count is the list's count`, lateRow.includes(`Resolve ${lateCount} operational issues`), `${lateCount} · ${lateRow.slice(0, 60)}`);
  await clickRow(p, "Treat 2 critical risks");
  rows = await visRows(p);
  ok(`${width} Critical risks row keeps exactly the 2 critical risks`, (await hash(p)) === "risks" && rows.length === 2 && rows.every((r) => /Critical/.test(r)), rows.length);
  await clickRow(p, "Remediate 3 operational issues");
  ok(`${width} Due-soon row opens Findings on Due soon 3`, (await qvOn(p)).some((x) => /^Due soon 3/.test(x)) && (await visRows(p)).length === 3);
  await clickRow(p, "quarterly configuration baseline audit");
  ok(`${width} Audit row opens the Schedule with that task's preview`, (await hash(p)) === "schedule" && /Quarterly configuration baseline audit/.test(await panel(p)));
  await clickRow(p, "Give an owner to");
  ok(`${width} No-owner row opens Risks on No owner`, (await qvOn(p)).some((x) => /^No owner 40/.test(x)));
  await clickRow(p, "Revise 54 evidence");
  ok(`${width} Revise row opens Evidence on Needs revision 54`, (await qvOn(p)).some((x) => /^Needs revision 54/.test(x)));
  await clickRow(p, "wait on a reviewer");
  ok(`${width} Waiting row opens Evidence on Pending review 88`, (await qvOn(p)).some((x) => /^Pending review 88/.test(x)));
  await clickRow(p, "An offered finding");
  ok(`${width} Offer row opens the offer`, (await hash(p)) === "component-mc-findings" && /Offer preview/.test(await panel(p)));
  await go(p, "home");
  ok(`${width} Home has no sideways scroll`, await noSideways(p));
  await p.click('#main [data-v2go="component-mc-findings"]'); await p.waitForTimeout(700);
  ok(`${width} Home's Open offer opens the offer`, (await hash(p)) === "component-mc-findings" && /Offer preview/.test(await panel(p)));
  await go(p, "home");
  await p.click('#main .pcard[data-v2go="portfolio"]'); await p.waitForTimeout(700);
  ok(`${width} Home's Customer A card opens Programs with its preview`, (await hash(p)) === "portfolio" && /Program preview/.test(await panel(p)) && /Customer A/.test(await panel(p)));
  if (width === 390) { ok(`${width} no page errors`, !errs.length, errs.join(" | ")); await p.close(); continue; }

  // ——— 2. State reaches every screen [B5, B11] ———
  await go(p, "ssp-review");
  await p.click("#main .sh-rd button[data-v2q*='s2']"); await p.waitForTimeout(900);
  const at = await p.evaluate(() => { const s = document.getElementById("se-s-s2"), sc = document.getElementById("se-scroll"); return { focus: !!(document.activeElement && s && s.contains(document.activeElement)), top: s && sc ? Math.round(s.getBoundingClientRect().top - sc.getBoundingClientRect().top) : null }; });
  ok("Readiness fix opens the editor at section 2, focused", (await hash(p)) === "ssp" && at.focus && at.top !== null && at.top < 120, JSON.stringify(at));
  await go(p, "ssp-review");
  await p.fill("#sh-rc", "Section 2 and the six control changes are ready for the ISSM.");
  await p.click('#main [data-sh-act="submit"]'); await p.waitForTimeout(400);
  if (await p.$('#main [data-sh-act="submit-draft"]')) { await p.click('#main [data-sh-act="submit-draft"]'); await p.waitForTimeout(400); }
  ok("SSP 3 is submitted", /with the ISSM/.test(await text(p, "#main h1")));
  await go(p, "my-work");
  const mw = await p.$$eval("#main details.a-work-mwg", (g) => g.map((x) => x.textContent.replace(/\s+/g, " ")));
  ok("My work says SSP 3 waits on the ISSM, under Waiting on others", mw.some((x) => /^.?Waiting on others/.test(x.trim()) && /SSP 3 waits on Joel Barrantes/.test(x)));
  await go(p, "review-queue");
  ok("Review queue lists SSP 3 as SSP to approve", (await visRows(p)).some((r) => /revision 3/.test(r) && /SSP to approve/.test(r) && /Joel Barrantes/.test(r)));
  const railReview = await text(p, '#rail a[href="#review-queue"]');
  ok("The rail's Review count is the queue's total (149 with SSP 3)", /149/.test(railReview), railReview);
  await p.click("#main .tools .a-work-dd summary"); await p.waitForTimeout(150);
  await p.click('#main [data-aw-kind="evidence"]'); await p.waitForTimeout(350);
  const pager = await text(p, "#main .pager");
  // (the visual layer cuts the Kind column once every row reads the same kind, so the filter's own label says which kind)
  ok("Kind filter keeps one kind, and the pager counts it (96)", (await visRows(p)).length === 5 && /Kind: Evidence to accept/.test(await text(p, "#main .tools .a-work-dd summary")) && /of 96/.test(pager), pager);
  await go(p, "authorization");
  ok("Authorization reads SSP revision 3 In review", (await visRows(p)).some((r) => /Revision 3/.test(r) && /In review/.test(r)));
  await go(p, "person-victor-amsel-offboarding");
  await p.click('#main [data-v8d-act="off-all"]'); await p.waitForTimeout(400);
  await go(p, "people");
  rows = await visRows(p);
  ok("People: after Reassign all, Nadia Fournier holds the quarterly review", rows.some((r) => /Nadia Fournier/.test(r) && /Quarterly privileged account review/.test(r)));
  ok("People: Victor Amsel has no open tasks", rows.some((r) => /Victor Amsel/.test(r) && /No open tasks/.test(r)));
  await go(p, "people-access");
  ok("Access review: the reviewer is Nadia Fournier", (await visRows(p))[0].includes("Nadia Fournier"));

  // ——— 4. People [B13, B14] ———
  await go(p, "people");
  await p.click('#main [data-modal="v2c-add-person"]'); await p.waitForTimeout(250);
  await p.click('#modal [data-v2c-act="add-person"]'); await p.waitForTimeout(200);
  ok("Add person names the missing field and stays open", /Enter the person's name/.test(await text(p, "#v2c-p-name-err")) && await p.$eval("#modal", (m) => !m.hidden));
  await p.fill("#v2c-p-name", "Maya Chen"); await p.selectOption("#v2c-p-role", "SCA");
  await p.click('#modal [data-v2c-act="add-person"]'); await p.waitForTimeout(600);
  const ob = await visRows(p);
  ok("Add person opens the onboarding task set (9 tasks to do)", (await hash(p)) === "person-maya-chen-onboarding" && ob.length === 9 && ob.every((r) => /To do/.test(r)), ob.length);
  await p.click("#main tbody tr[data-panel='v8d-ob']"); await p.waitForTimeout(350);
  ok("An onboarding task opens its preview", /Onboarding task preview/.test(await panel(p)) && /Mark complete/.test(await panel(p)));
  await p.click('#panel [data-v8d-act="ob-done"]'); await p.waitForTimeout(500);
  ok("Mark complete moves the progress to 1 of 9", /1 of 9/.test(await text(p, "#main .v8d-obh")));
  await go(p, "people");
  ok("People lists Maya Chen with her onboarding", (await visRows(p)).some((r) => /Maya Chen/.test(r) && /Onboarding/.test(r)));
  await go(p, "people-access");
  await p.click("#main tbody tr[data-panel='a-people-par']"); await p.waitForTimeout(350);
  const d0 = (await visRows(p))[0].match(/(\d+) of 18/)[1];
  await p.click("#panel [data-apcomplete]"); await p.waitForTimeout(300);
  ok("Complete review says what is still owed", /Still owed: .*not decided/.test(await text(p, "#panel .a-people-owed")), await text(p, "#panel .a-people-owed"));
  await p.click("#panel [data-apshowall]"); await p.waitForTimeout(200);
  const und = await p.$$("#panel .a-people-acct:not(:has(.a-people-sb.on)) [data-apk='keep']");
  if (und[0]) { await und[0].click(); await p.waitForTimeout(250); }
  const d1 = (await visRows(p))[0].match(/(\d+) of 18/)[1];
  ok("Keep moves the decided count", +d1 === +d0 + 1, `${d0} → ${d1}`);
  for (let i = 0; i < 20; i++) { const k = await p.$("#panel .a-people-acct:not(:has(.a-people-sb.on)) [data-apk='keep']"); if (!k) break; await k.click(); await p.waitForTimeout(120); }
  for (let i = 0; i < 4; i++) { const u = await p.$('#panel .a-people-own:has-text("Unassigned")'); if (!u) break; await u.click(); await p.waitForTimeout(200); await p.selectOption("#ap-acct-owner", "Joel Barrantes"); await p.click("#modal [data-apowner-ok]"); await p.waitForTimeout(250); }
  for (let i = 0; i < 4; i++) { const n = await p.$('#panel .a-people-need [data-modal="a-people-task"]'); if (!n) break; await n.click(); await p.waitForTimeout(200); await p.click("#modal [data-aptask-ok]"); await p.waitForTimeout(250); }
  await p.click("#panel [data-apcomplete]"); await p.waitForTimeout(400);
  ok("With nothing owed, Complete review completes it", /Completed/.test(await text(p, "#panel .a-people-rh")) && /Completed/.test((await visRows(p))[0]));
  await go(p, "schedule");
  ok("The Schedule's quarterly review task is completed with it", (await visRows(p)).some((r) => /Quarterly privileged account review/.test(r) && /Completed/.test(r)));

  // ——— 7. Inventory header actions [B9] ———
  await go(p, "inventory");
  await p.click('#main [data-modal="v2c-import-scan"]'); await p.waitForTimeout(250);
  await p.click('#modal [data-v2c-act="not-wired"]'); await p.waitForTimeout(250);
  ok("Import scan says plainly it is not wired", /Not saved: Import scan isn't wired/.test(await text(p, "#v2-toast")));
  await p.click('#main [data-modal="v2c-add-asset"]'); await p.waitForTimeout(250);
  await p.fill("#v2c-a-name", "Ground Test Set"); await p.fill("#v2c-a-lru", "LRU-021");
  await p.click('#modal [data-v2c-act="add-asset"]'); await p.waitForTimeout(700);
  ok("Add asset adds the asset, kept and previewed", (await visRows(p)).some((r) => /AST-109021/.test(r)) && /Ground Test Set/.test(await panel(p)));
  ok("…and the Assets tab counts 21", /Assets\s*21/.test(await text(p, "#main .ak-tabs, #main [role=tablist]")));

  // ——— 3. A new program is a program [B6] ———
  await go(p, "program-new", 700);
  for (let i = 0; i < 8 && (await hash(p)) !== "program-new-review"; i++) { await p.click('[data-pn="next"]'); await p.waitForTimeout(450); }
  await p.click('[data-pn="create"]'); await p.waitForTimeout(3800);
  const sw = await text(p, "#swBtn .pn-swt");
  ok("After Create program the switcher names the new program", (await hash(p)) === "program-start" && /PRG-2301/.test(sw), sw);
  const badges = await p.$$eval("#nav a.item", (a) => a.filter((x) => x.querySelector(".c") && x.querySelector(".c").textContent).map((x) => x.textContent.replace(/\s+/g, " ").trim()));
  ok("…its menu carries no WS-X90 badge", !badges.some((x) => /Evidence|Findings/.test(x)), badges.join(","));
  await p.click('#main .pn-trow [data-go="requirements"]'); await p.waitForTimeout(450);
  ok("Its starter guide's Open requirements opens its own requirements", /No requirements yet/.test(await text(p, "#main")) && /Customer D/.test(await text(p, "#main")));
  await go(p, "portfolio");
  ok("Programs lists it", (await visRows(p)).some((r) => /Customer D/.test(r)) && (await p.$$eval("#main .qv", (q) => q.map((x) => x.textContent))).some((x) => /All\s*10/.test(x)));
  await go(p, "home");
  ok("Home lists it", (await p.$$eval("#main .pcard", (c) => c.map((x) => x.textContent))).some((x) => /PRG-2301/.test(x)));
  await go(p, "program-start");
  await p.click("#swBtn"); await p.waitForTimeout(150);
  ok("The switcher lists it beside WS-X90", (await p.$$eval("#swMenu a", (a) => a.map((x) => x.textContent))).some((x) => /PRG-2301/.test(x)));
  await p.click('#swMenu a[data-v2prog="PRG-1090"]'); await p.waitForTimeout(500);
  ok("Choosing WS-X90 makes it current again", (await hash(p)) === "overview" && /WS-X90/.test(await text(p, "#swBtn .pn-swt")) && /Evidence\s*368/.test(await text(p, "#nav")));
  await clickRow(p, "Give an owner to");
  ok("A My work row still lands on WS-X90's records after visiting the new program", (await qvOn(p)).some((x) => /^No owner 40/.test(x)));

  // ——— 5. Assessment mode [A15] ———
  await go(p, "campaign");
  const navT = await text(p, "#nav");
  ok("In assessment mode the menu holds the campaign's pages", /Requests/.test(navT) && /Findings/.test(navT) && /Controls/.test(navT) && !/Inventory|Baseline|Posture/.test(navT), navT.slice(0, 120));
  await p.click('#nav a[href="#campaign-controls"]'); await p.waitForTimeout(450);
  ok("…and its Controls page stays in the mode", (await hash(p)) === "campaign-controls" && await p.evaluate(() => document.getElementById("proto").classList.contains("moded")));
  ok("1440 no page errors", !errs.length, errs.join(" | "));
  await p.close();
}
await b.close();
lines.unshift(`C2 walk · ${new Date().toISOString()} · ${html}\n${pass} passed, ${fail} failed`);
fs.writeFileSync(path.join(here, "walk.log"), lines.join("\n") + "\n");
console.log(lines.join("\n"));
