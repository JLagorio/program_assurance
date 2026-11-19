// Walk the version 6 and 7 flows in the assembled prototype: node flows7.mjs <prototype.html>
import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const file = "file://" + path.resolve(process.argv[2]);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = []; p.on("pageerror", (e) => errors.push(String(e)));
const res = []; const ok = (name, cond, extra = "") => res.push(`${cond ? "PASS" : "FAIL"} ${name}${extra ? " · " + extra : ""}`);
const hash = () => p.evaluate(() => location.hash.slice(1));
const full = () => p.evaluate(() => document.getElementById("proto").classList.contains("fullwin"));

// 1. The program switcher's Create program opens the walkthrough, full window (the switcher heads the program's menu)
await p.goto(file + "#overview"); await p.waitForTimeout(500);
await p.click("#swBtn"); await p.waitForTimeout(200);
await p.click('#swMenu a[href="#program-new"]'); await p.waitForTimeout(500);
ok("Switcher > Create program", (await hash()) === "program-new" && (await full()), await hash());
// 2. Walk every step with Continue, then create
const seen = [];
for (let i = 0; i < 8 && (await hash()) !== "program-new-review"; i++) { seen.push(await hash()); await p.click('[data-pn="next"]'); await p.waitForTimeout(450); }
ok("Wizard reaches review", (await hash()) === "program-new-review", seen.join(" > "));
await p.click('[data-pn="create"]'); await p.waitForTimeout(3500);
ok("Create lands on Getting started in the shell", (await hash()) === "program-start" && !(await full()), await hash());
ok("Program created shows", await p.evaluate(() => /just now|Program created/i.test(document.body.innerText)));
// 3. The switcher offers Create program
ok("Switcher has Create program", await p.evaluate(() => !!document.querySelector('#swMenu a[href="#program-new"]')));
// 4. Nav SSP > register > panel > document (Plans is in the program's menu)
await p.goto(file + "#overview"); await p.waitForTimeout(300);
await p.evaluate(() => { const a = document.querySelector('#nav a[href="#ssps"]'); if (a && (a.hidden || !a.offsetParent)) { const g = [...document.querySelectorAll('#nav [data-group]')].find((x) => x.dataset.group === 'Compliance'); if (g) g.click(); } }); await p.waitForTimeout(200);
await p.click('#nav a[href="#ssps"]'); await p.waitForTimeout(500);
ok("Nav SSP opens the register", (await hash()) === "ssps");
await p.locator('#main [data-panel="ssp"]').first().click(); await p.waitForTimeout(400);
ok("Register row opens its panel", await p.evaluate(() => !document.getElementById("panel").hidden));
await p.click('#panel [data-go="ssp"]'); await p.waitForTimeout(1500);
ok("Open document opens the editor, full window", (await hash()) === "ssp" && (await full()));
// 5. Accept the AI draft on AC-2: it lands in the record and the session
await p.evaluate(() => document.getElementById("se-c-AC-2").scrollIntoView({ block: "center" })); await p.waitForTimeout(400);
await p.locator('#se-c-AC-2 [data-act="accept"][data-id="g1"]').first().click(); await p.waitForTimeout(700);
const ac2 = await p.evaluate(() => ({ n: window.PA.SSP.ctl("AC-2").n, ph: window.PA.SSP.ctl("AC-2").ph, rv: window.PA.SSP.ctl("AC-2").rv, s: window.PA.SSP.session.length, saved: document.body.innerText.match(/Saved[^\n]{0,60}/)?.[0] }));
ok("Accept writes AC-2's narrative", /exist only through the account service/.test(ac2.n), `rv ${ac2.rv} · placeholder ${ac2.ph ? "yes" : "no"} · ${ac2.saved}`);
ok("Accept is logged to the session", ac2.s >= 1, `${ac2.s} entries`);
// 6. Version history shows the session's edit
// Opened from inside the app: page.goto would reload the page and end the editing session.
if (await p.$('[data-go="ssp-history"]')) await p.click('[data-go="ssp-history"]'); else await p.evaluate(() => { location.hash = "ssp-history"; });
await p.waitForTimeout(800);
ok("Version history lists the session edit", await p.evaluate(() => /AC-2 · AI draft accepted by Ingrid Solberg/.test(document.getElementById("main").innerText)), await p.evaluate(() => (document.getElementById("main").innerText.match(/AC-2 · AI draft accepted[^\n]*/) || [""])[0]));
// 7. Review: submitting with the categorization blocker says so
await p.goto(file + "#ssp-review"); await p.waitForTimeout(600);
await p.locator("button", { hasText: "Submit for review" }).first().click(); await p.waitForTimeout(500);
ok("Submit shows the blocker or the submitted state", await p.evaluate(() => /rationale|Pending approval|Submitted/i.test(document.getElementById("main").innerText)));
// 7b. Portfolio's Create program and Overview's SSP card lead where they say
await p.goto(file + "#portfolio"); await p.waitForTimeout(400);
ok("Portfolio offers Create program", await p.evaluate(() => !!document.querySelector('#main [data-go="program-new"], #main a[href="#program-new"]')));
await p.goto(file + "#overview"); await p.waitForTimeout(400);
ok("Overview links to the SSP", await p.evaluate(() => !!document.querySelector('#main [data-go="ssp"], #main a[href="#ssp"]')));
// 8. Leaving a full-window route restores the shell
await p.goto(file + "#controls"); await p.waitForTimeout(400);
ok("Shell is back after leaving", !(await full()) && (await p.evaluate(() => getComputedStyle(document.getElementById("nav")).display !== "none")));
console.log(res.join("\n")); console.log("errors:", errors.length ? [...new Set(errors)].join(" | ") : "none");
await b.close();
