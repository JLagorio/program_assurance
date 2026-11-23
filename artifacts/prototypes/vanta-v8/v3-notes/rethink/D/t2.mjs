export default async ({ p, go, shot, ok, wait, ev }) => {
  await go("evidence"); await p.click("#main .k3-table tbody tr"); await wait(350);
  console.log(await ev(() => { const b = document.querySelector("#panel .k3-pn-a .btn.ink"); const cs = getComputedStyle(b); const rules = []; for (const sh of document.styleSheets) for (const r of sh.cssRules) { try { if (r.selectorText && b.matches(r.selectorText) && /background/.test(r.cssText)) rules.push(r.cssText.slice(0, 160)); } catch (e) {} } return cs.backgroundColor + " " + cs.color + "\n" + rules.join("\n"); }));
};
