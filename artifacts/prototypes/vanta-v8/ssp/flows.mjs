// Walk the new flows in the assembled prototype: node flows.mjs <prototype.html>
import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const file = "file://" + path.resolve(process.argv[2]);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = []; p.on("pageerror", (e) => errors.push(String(e)));
const res = []; const ok = (name, cond, extra = "") => res.push(`${cond ? "PASS" : "FAIL"} ${name}${extra ? " · " + extra : ""}`);
const hash = () => p.evaluate(() => location.hash.slice(1));
const full = () => p.evaluate(() => document.getElementById("proto").classList.contains("fullwin"));

// 1. Home's Create program opens the walkthrough, full window
await p.goto(file + "#home"); await p.waitForTimeout(500);
await p.click('#main [data-go="program-new"]'); await p.waitForTimeout(500);
ok("Home > Create program", (await hash()) === "program-new" && (await full()), await hash());
// 2. Walk every step with Continue, then create
const seen = [];
for (let i = 0; i < 8 && (await hash()) !== "program-new-review"; i++) { seen.push(await hash()); await p.click('[data-pn="next"]'); await p.waitForTimeout(450); }
ok("Wizard reaches review", (await hash()) === "program-new-review", seen.join(" > "));
await p.click('[data-pn="create"]'); await p.waitForTimeout(3500);
ok("Create lands on Getting started in the shell", (await hash()) === "program-start" && !(await full()), await hash());
ok("Program created shows", await p.evaluate(() => /just now|Program created/i.test(document.body.innerText)));
// 3. The switcher offers Create program
ok("Switcher has Create program", await p.evaluate(() => !!document.querySelector('#swMenu a[href="#program-new"]')));
// 4. Nav SSP > register > panel > document
await p.goto(file + "#home"); await p.waitForTimeout(300);
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
await p.goto(file + "#ssp-history"); await p.waitForTimeout(800);
ok("Version history lists the session edit", await p.evaluate(() => /AC-2/.test(document.querySelector(".sh-side, [class*=sh-v]")?.innerText || document.body.innerText)), await p.evaluate(() => (document.body.innerText.match(/(This session|Today)[\s\S]{0,120}/) || [""])[0].replace(/\s+/g, " ")));
// 7. Review: submitting with the categorization blocker says so
await p.goto(file + "#ssp-review"); await p.waitForTimeout(600);
await p.locator("button", { hasText: "Submit for review" }).first().click(); await p.waitForTimeout(500);
ok("Submit shows the blocker or the submitted state", await p.evaluate(() => /rationale|Pending approval|Submitted/i.test(document.getElementById("main").innerText)));
// 8. Leaving a full-window route restores the shell
await p.goto(file + "#controls"); await p.waitForTimeout(400);
ok("Shell is back after leaving", !(await full()) && (await p.evaluate(() => getComputedStyle(document.getElementById("nav")).display !== "none")));
console.log(res.join("\n")); console.log("errors:", errors.length ? [...new Set(errors)].join(" | ") : "none");
await b.close();
