export default async ({ p, go, shot, ok, wait, ev }) => {
  await go("requirements"); await shot("requirements");
  await ev(() => { const b = [...document.querySelectorAll("#main .k3-rail-i")].find((x) => /CUSA/.test(x.innerText)); b.click(); }); await wait(300); await shot("requirements-cust");
  await ev(() => { const b = [...document.querySelectorAll("#main .k3-rail-i")].find((x) => /All req/.test(x.innerText)); b.click(); }); await wait(300);
  await p.click("#main .k3-table tbody tr td:first-child"); await wait(350);
  await p.click('#panel [data-k3="k3d.req.link"]'); await wait(300); await shot("pick-ev");
  await p.keyboard.press("Escape");
  await go("evidence"); await shot("evidence");
  await ev(() => { const b = [...document.querySelectorAll("#main .k3-rail-i")].find((x) => /STIG/.test(x.innerText)); b.click(); }); await wait(300); await shot("evidence-stig");
  await go("evidence-sources"); await shot("evidence-sources");
  await p.setViewportSize({ width: 390, height: 800 });
  await go("documents"); await shot("m-documents", true);
  await go("requirements"); await shot("m-requirements");
  await p.click("#main .k3-table tbody tr td:first-child"); await wait(350); await shot("m-req-panel");
};
