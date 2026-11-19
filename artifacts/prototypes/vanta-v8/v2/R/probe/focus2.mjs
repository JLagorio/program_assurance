import { createRequire } from "node:module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const html = process.argv[2];
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.setDefaultTimeout(3000);
const errs = []; p.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
const fresh = async (r) => { await p.goto("file://" + html + "#home"); await p.evaluate(() => sessionStorage.clear()); await p.goto("about:blank"); await p.goto("file://" + html + "#" + r); await p.waitForTimeout(600); };
const toast = () => p.evaluate(() => [...document.querySelectorAll(".ak-toast, #v2-toast:not([hidden])")].map((t) => t.innerText.replace(/\s+/g, " ")).join(" || "));
const modal = () => p.evaluate(() => { const m = document.getElementById("modal"); return m.hidden ? "(closed)" : m.innerText.replace(/\s+/g, " ").slice(0, 500); });
const T = (s = "#main") => p.evaluate((s) => (document.querySelector(s) || {}).innerText?.replace(/\s+/g, " ") || "", s);
const log = (k, v) => console.log("P", k, "::", String(v).slice(0, 500));
const clickText = (root, txt, exact = true, n = 0) => p.evaluate(({ root, txt, exact, n }) => { const els = [...document.querySelectorAll(root + " *")].filter((e) => e.children.length === 0 || e.matches("button,[role=button],.btn")).filter((e) => { const t = (e.innerText || "").trim(); return (exact ? t === txt : t.includes(txt)) && e.getBoundingClientRect().height > 0; }); const e = els[n]; if (!e) return false; (e.closest("button,[role=button],[role=radio],.btn,a,[data-modal],[data-go]") || e).click(); return true; }, { root, txt, exact, n });
// d: evidence review, exact error
await fresh("evidence");
await p.locator("#main table tbody tr").filter({ hasText: "Time source comparison test report" }).first().click(); await p.waitForTimeout(500);
await clickText("#panel", "Accept"); await p.waitForTimeout(400);
await p.locator("#modal .dlg-f button, #modal .dlg-f .btn").last().click(); await p.waitForTimeout(600);
log("d.afterSave", (await modal()) + " | errs: " + (await p.evaluate(() => [...document.querySelectorAll("#modal .v2k-err, #modal [role=alert]")].map((e) => e.innerText).join(" | "))) + " | toast: " + (await toast()));
// v1 for comparison
await p.goto("file://" + process.argv[3] + "#evidence"); await p.waitForTimeout(600);
await p.locator("#main table tbody tr").filter({ hasText: "Time source comparison test report" }).first().click(); await p.waitForTimeout(500);
await clickText("#panel", "Accept"); await p.waitForTimeout(400);
await p.locator("#modal .dlg-f button, #modal .dlg-f .btn").last().click(); await p.waitForTimeout(600);
log("d.v1.afterSave", (await modal()) + " | toast: " + (await toast()) + " | " + ((await T()).match(/Pending review \d+/) || [""])[0]);
// e: access review
await fresh("people-access");
await clickText("#main", "Quarterly privileged account review (AC-2, AC-6)"); await p.waitForTimeout(500);
const dec = async () => ((await T("#panel")).match(/Keep, revoke or change each account\s*(\d+ of \d+)/) || [])[1];
log("e.before", await dec());
const acct = await p.evaluate(() => { const keeps = [...document.querySelectorAll("#panel *")].filter((e) => e.children.length === 0 && e.innerText.trim() === "Keep"); return keeps.map((k) => { let r = k; for (let i = 0; i < 6 && r && !/svc-|adm|tech|field/.test(r.innerText.slice(0, 30)); i++) r = r.parentElement; return (r ? r.innerText.replace(/\s+/g, " ").slice(0, 70) : "?") + " | pressed=" + (k.getAttribute("aria-pressed") || k.className); }); });
log("e.keeps", acct.join(" ¦ "));
await clickText("#panel", "Keep", true, 0); await p.waitForTimeout(400); log("e.afterKeep0", await dec());
await clickText("#panel", "Keep", true, 0); await p.waitForTimeout(400); log("e.afterKeep0again", await dec());
await clickText("#panel", "Revoke", true, 0); await p.waitForTimeout(400); log("e.afterRevoke0", await dec());
// k: campaign request Accept
await fresh("campaign-r2");
log("k.before", ((await T()).match(/Status \w+/) || [""])[0]);
await clickText("#main", "Accept"); await p.waitForTimeout(400);
log("k.dialog", await modal());
await p.evaluate(() => { const t = document.querySelector("#modal textarea"); if (t) { t.value = "Meets the statement."; t.dispatchEvent(new Event("input", { bubbles: true })); } });
await p.locator("#modal .dlg-f button, #modal .dlg-f .btn").last().click(); await p.waitForTimeout(600);
log("k.after", (await modal()) + " | toast: " + (await toast()) + " | " + ((await T()).match(/Status \w+/) || [""])[0]);
await p.evaluate(() => { location.hash = "campaign"; }); await p.waitForTimeout(500);
log("k.campaign", ((await T()).match(/Ready \d+ Flagged \d+ Accepted \d+/) || [""])[0]);
// rail after an SSP submission
await fresh("ssp-review");
await p.fill("#main textarea", "R's comment").catch(() => {});
await clickText("#main", "Submit for review"); await p.waitForTimeout(600);
await clickText("#main", "Submit anyway as a draft for ISSM review", false); await p.waitForTimeout(700);
await p.evaluate(() => { location.hash = "review-queue"; }); await p.waitForTimeout(600);
log("rail.afterSubmit", (await p.evaluate(() => [...document.querySelectorAll("#rail a")].map((a) => a.innerText.trim().replace(/\s+/g, " ")).filter((t) => /\d/.test(t)).join(" | "))) + " | queue " + ((await T()).match(/All \d+/) || [""])[0]);
console.log("errors", errs);
await b.close();
