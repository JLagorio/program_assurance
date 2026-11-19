import { start } from "./walk.mjs";
const W = await start("topbar");
await W.go("overview");
const items = await W.p.evaluate(() => [...document.querySelectorAll("#proto .top button, #proto .top a, #proto .top [role=button], #proto .top .search")].filter(e => e.getBoundingClientRect().height > 0).map((e, i) => { e.setAttribute("data-top", i); return i + ":" + (e.getAttribute("aria-label") || e.innerText.trim().replace(/\s+/g, " ").slice(0, 40) || e.className); }));
console.log("TOP:", items);
for (let i = 0; i < items.length; i++) {
  await W.go("home"); await W.go("overview");
  await W.p.evaluate((i) => { const e = [...document.querySelectorAll("#proto .top button, #proto .top a, #proto .top [role=button], #proto .top .search")].filter(e => e.getBoundingClientRect().height > 0)[i]; e.setAttribute("data-top-hit", "1"); }, i);
  const before = await W.p.evaluate(() => ({ hash: location.hash, html: document.body.innerHTML.length }));
  await W.p.click("[data-top-hit]").catch(() => {}); await W.p.waitForTimeout(400);
  const after = await W.p.evaluate(() => ({ hash: location.hash, html: document.body.innerHTML.length, dlg: [...document.querySelectorAll('[role="dialog"],[role="menu"],.menu,[aria-modal="true"]')].filter(e => e.getBoundingClientRect().height > 0).map(e => e.innerText.replace(/\s+/g, " ").slice(0, 90)) }));
  console.log(items[i], "→", before.hash === after.hash ? "" : "nav " + after.hash, JSON.stringify(after.dlg), after.html !== before.html ? "(DOM changed)" : "(no change)");
  await W.p.keyboard.press("Escape");
}
await W.done();
