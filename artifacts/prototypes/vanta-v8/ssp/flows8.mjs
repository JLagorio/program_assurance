// Walk the version 8 capabilities in the assembled prototype: node flows8.mjs <prototype.html>
// Text-based checks, so they hold whatever markup each builder chose.
import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const file = "file://" + path.resolve(process.argv[2]);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = []; p.on("pageerror", (e) => errors.push(String(e)));
const res = []; const ok = (name, cond, extra = "") => res.push(`${cond ? "PASS" : "FAIL"} ${name}${extra ? " · " + extra : ""}`);
const go = async (r, wait = 350) => { await p.evaluate((r) => { location.hash = r; }, r); await p.waitForTimeout(wait); };
const hash = () => p.evaluate(() => location.hash.slice(1));
const mainText = () => p.evaluate(() => document.getElementById("main").innerText);
const drawn = async (r, re) => { await go(r); const t = await mainText(); return !/Not drawn yet/.test(t) && (!re || re.test(t)); };
const palette = () => p.evaluate(() => { const d = [...document.querySelectorAll('[role="dialog"], [aria-modal="true"]')].find((e) => e.offsetParent !== null && e.querySelector("input")); return !!d; });

await p.goto(file + "#home"); await p.waitForTimeout(500);
// 1. Search: ⌘K and the box open the palette; a control is found and opens; Esc closes
await p.keyboard.press("Meta+k"); await p.waitForTimeout(300);
ok("⌘K opens search", await palette());
await p.keyboard.type("AC-2"); await p.waitForTimeout(300);
const hits = await p.evaluate(() => { const d = [...document.querySelectorAll('[role="dialog"], [aria-modal="true"]')].find((e) => e.offsetParent !== null && e.querySelector("input")); return d ? (d.innerText.match(/AC-2\b/g) || []).length : 0; });
ok("Search finds AC-2", hits > 0, `${hits} mentions`);
await p.keyboard.press("Enter"); await p.waitForTimeout(500);
ok("Enter opens the result", (await hash()) !== "home" && !(await palette()), await hash());
await go("home"); await p.keyboard.press("Control+k"); await p.waitForTimeout(300); await p.keyboard.press("Escape"); await p.waitForTimeout(200);
ok("Esc closes search", !(await palette()));
await p.click("#proto .top .search"); await p.waitForTimeout(300);
ok("The search box opens search", await palette()); await p.keyboard.press("Escape"); await p.waitForTimeout(200);
// 2. AI agents, permissions, risk library, tickets
ok("AI agents: needs approval", await drawn("ai-drafts", /Needs approval/i));
ok("Roles & permissions", await drawn("permissions", /authorizing official|AO\b/i));
await go("risks"); const lib = await p.evaluate(() => !!document.querySelector('#main [data-go="risks-library"], #main a[href="#risks-library"]'));
ok("Risks has a Library tab", lib);
ok("Risk library draws techniques", await drawn("risks-library", /T\d{4}/));
ok("A check shows tickets", await drawn("check-scan", /Tickets?/));
// 3. Plans and people
await go("ssps"); const plans = await mainText();
ok("Plans lists the four plans", /contingency/i.test(plans) && /incident response/i.test(plans) && /configuration management/i.test(plans));
await go("plan-cp", 900); ok("Contingency plan opens full window", await p.evaluate(() => document.getElementById("proto").classList.contains("fullwin")));
await go("home", 400);
ok("Contingency plan history", await drawn("plan-cp-history", /version/i));
for (const t of ["", "-onboarding", "-access", "-training", "-offboarding"]) ok(`Person page${t || " overview"}`, await drawn("person-joel-barrantes" + t));
// 4. Boundary
ok("ITCSC record", await drawn("itcsc", /categoriz/i));
ok("ITCSC import", await drawn("itcsc-import", /ITCSC/));
const rows = async (r) => { await go(r); return p.evaluate(() => document.querySelectorAll("#main table tbody tr").length); };
const ic = await rows("interconnections"); ok("Interconnections register", ic >= 5, `${ic} rows`);
const pp = await rows("ppsm"); ok("Ports & protocols register", pp >= 5, `${pp} rows`);
await go("program-new", 700); ok("Create program offers an ITCSC start", /ITCSC/.test(await mainText()));
await go("home", 400);
// 5. DoD data
ok("STIG checklists", await drawn("stigs", /CAT I/));
ok("Security engineering", await drawn("sse", /surviv/i));
for (const r of res) console.log(r);
console.log("errors:", errors.length ? [...new Set(errors)].slice(0, 5).join(" | ") : "none");
await b.close();
