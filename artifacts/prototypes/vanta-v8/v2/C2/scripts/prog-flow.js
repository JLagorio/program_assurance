const out = {};
const go = async (r, w = 450) => { await page.evaluate((x) => { location.hash = x; }, r); await page.waitForTimeout(w); };
const hash = () => page.evaluate(() => location.hash.slice(1));
const navInfo = () => page.evaluate(() => ({
  sw: (document.querySelector("#swBtn .pn-swt") || {}).textContent || null,
  facts: (document.querySelector("#nav .pn-facts") || {}).textContent || null,
  on: [...document.querySelectorAll("#nav a.item.on")].map((a) => a.textContent.trim()),
  badges: [...document.querySelectorAll("#nav a.item")].filter((a) => a.querySelector(".c") && a.querySelector(".c").textContent).map((a) => a.textContent.replace(/\s+/g, " ").trim()),
  menu: [...document.querySelectorAll("#swMenu a")].map((a) => a.textContent.replace(/\s+/g, " ").trim() + (a.getAttribute("aria-current") ? " *" : "")),
  rail: [...document.querySelectorAll("#rail .ri")].map((a) => a.textContent.replace(/\s+/g, " ").trim()),
}));
await go("overview");
out.wsxNav = await navInfo();
await go("program-new", 700);
for (let i = 0; i < 8 && (await hash()) !== "program-new-review"; i++) { await page.click('[data-pn="next"]'); await page.waitForTimeout(450); }
await page.click('[data-pn="create"]');
await page.waitForTimeout(3800);
out.landed = await hash();
out.newNav = await navInfo();
out.state = await page.evaluate(() => ({ cur: PA.v2.get("prog.cur"), made: (PA.v2.get("prog.made") || []).map((d) => d.code + " " + d.name) }));
out.title = await page.$eval("#main h1, #main h2, #main h3", (x) => x.textContent.trim()).catch(() => null);
// the starter guide's links open the new program's own pages
out.guideLinks = await page.$$eval("#main .pn-trow [data-go]", (b) => b.map((x) => x.textContent.trim() + " → " + x.dataset.go));
for (const r of ["requirements", "sources", "ssp", "assessments", "authorization", "controls", "evidence"]) {
  await go(r);
  out["page-" + r] = await page.$eval("#main", (m) => m.textContent.replace(/\s+/g, " ").trim().slice(0, 140));
}
await go("portfolio");
out.portfolio = await page.$$eval("#main tbody tr", (t) => t.map((r) => r.textContent.replace(/\s+/g, " ").trim()).filter((x) => /PRG-23|Customer D|X800/.test(x)).slice(0, 3));
out.portfolioAll = await page.$$eval("#main .qv", (q) => q.map((x) => x.textContent.replace(/\s+/g, " ").trim()));
await go("home");
out.homeCards = await page.$$eval("#main .pcard", (c) => c.map((x) => x.textContent.replace(/\s+/g, " ").trim().slice(0, 60)));
// switch back to WS-X90 from the switcher
await go("program-start");
await page.click("#swBtn"); await page.waitForTimeout(200);
await page.click('#swMenu a[data-v2prog="PRG-1090"]'); await page.waitForTimeout(500);
out.back = { hash: await hash(), nav: await navInfo(), main: await page.$eval("#main", (m) => m.textContent.replace(/\s+/g, " ").trim().slice(0, 80)) };
// and to the new program again
await page.click("#swBtn"); await page.waitForTimeout(200);
const madeLink = await page.$('#swMenu a[href="#program-start"]');
if (madeLink) { await madeLink.click(); await page.waitForTimeout(500); }
out.again = { hash: await hash(), sw: (await navInfo()).sw };
// assessment mode: the menu holds the campaign's pages
await go("campaign");
out.campMenu = await page.$eval("#nav", (n) => n.textContent.replace(/\s+/g, " ").trim());
await page.click('#nav a[href="#campaign-findings"]'); await page.waitForTimeout(450);
out.campFindings = { hash: await hash(), on: await page.$$eval("#nav a.item.on", (a) => a.map((x) => x.textContent.trim())), moded: await page.evaluate(() => document.getElementById("proto").classList.contains("moded")) };
await page.click('#nav a[href="#campaign-controls"]'); await page.waitForTimeout(450);
out.campControls = { hash: await hash(), on: await page.$$eval("#nav a.item.on", (a) => a.map((x) => x.textContent.trim())), moded: await page.evaluate(() => document.getElementById("proto").classList.contains("moded")), main: await page.$eval("#main", (m) => m.textContent.replace(/\s+/g, " ").trim().slice(0, 80)) };
return out;
