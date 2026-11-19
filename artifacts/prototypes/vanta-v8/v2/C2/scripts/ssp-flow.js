const out = {};
const go = async (r) => { await page.evaluate((x) => { location.hash = x; }, r); await page.waitForTimeout(500); };
await go("ssp-review");
// a readiness fix opens the editor at its section, focused
const fix = await page.$("#main .sh-rd button[data-v2go]");
out.fixLabel = fix ? (await fix.textContent()).trim() : null;
const fixes = await page.$$eval("#main .sh-rd button[data-v2go]", (b) => b.map((x) => x.textContent.trim() + " → " + x.dataset.v2q));
out.fixes = fixes;
const k7 = await page.$("#main .sh-rd button[data-v2q*='s2']");
if (k7) { await k7.click(); await page.waitForTimeout(900); out.afterFix = await page.evaluate(() => ({ route: location.hash, active: document.activeElement ? (document.activeElement.closest("[id^='se-s-']") || {}).id + " " + document.activeElement.tagName + " " + (document.activeElement.className || "") : "", top: (() => { const s = document.getElementById("se-s-s2"), sc = document.getElementById("se-scroll"); return s && sc ? Math.round(s.getBoundingClientRect().top - sc.getBoundingClientRect().top) : null; })() })); }
await go("ssp-review");
await page.fill("#sh-rc", "Section 2 and the six control changes are ready for the ISSM.");
await page.click('#main [data-sh-act="submit"]');
await page.waitForTimeout(400);
const draftBtn = await page.$('#main [data-sh-act="submit-draft"]');
if (draftBtn) { await draftBtn.click(); await page.waitForTimeout(400); }
out.reviewTitle = await page.$eval("#main h1", (x) => x.textContent);
out.state = await page.evaluate(() => window.PA.v2.get("ssp.rev3"));
await go("my-work");
out.myWork = await page.$$eval("#main a.a-work-mw", (t) => t.map((r) => r.textContent.replace(/\s+/g, " ").trim()).filter((x) => /SSP/.test(x)));
out.groups = await page.$$eval("#main details.a-work-mwg", (g) => g.map((x) => x.querySelector("summary").textContent.replace(/\s+/g, " ").trim()));
await go("review-queue");
out.rqHead = await page.$eval("#main .ph", (x) => x.textContent.replace(/\s+/g, " "));
out.rqSsp = await page.$$eval("#main tbody tr", (t) => t.map((r) => r.textContent.replace(/\s+/g, " ").trim()).filter((x) => /system security plan/i.test(x)));
await go("authorization");
out.auth = await page.$$eval("#main tbody tr", (t) => t.map((r) => r.textContent.replace(/\s+/g, " ").trim()).filter((x) => /Revision 3/.test(x)));
return out;
