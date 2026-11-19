const out = [];
const n = await page.$$eval("#main a.a-work-mw", (t) => t.length);
for (let i = 0; i < n; i++) {
  await page.evaluate(() => { location.hash = "my-work"; });
  await page.waitForTimeout(350);
  const rows = await page.$$("#main a.a-work-mw");
  const title = (await rows[i].textContent()).replace(/\s+/g, " ").trim().slice(0, 60);
  await rows[i].click();
  await page.waitForTimeout(700);
  const r = await page.evaluate(() => {
    const m = document.getElementById("main"), p = document.getElementById("panel");
    const on = [...m.querySelectorAll(".qv.on, .qv[aria-pressed=true]")].map((x) => x.textContent.replace(/\s+/g, " ").trim());
    const vis = [...m.querySelectorAll("tbody tr")].filter((tr) => !tr.hidden && tr.offsetParent).length;
    const kept = m.querySelector(".v2-kept"); const pager = m.querySelector(".pager");
    return { route: location.hash, on, vis, kept: kept ? kept.textContent.replace(/\s+/g, " ") : "", pager: pager ? pager.textContent.replace(/\s+/g, " ").slice(0, 30) : "", panel: p.hidden ? "" : (p.querySelector(".bar-top span") || {}).textContent + " · " + p.querySelector(".pbody").textContent.replace(/\s+/g, " ").slice(0, 70) };
  });
  out.push({ title, ...r });
}
return out;
