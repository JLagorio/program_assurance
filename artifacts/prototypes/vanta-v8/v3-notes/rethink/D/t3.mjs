export default async ({ p, go, shot, ok, wait, ev }) => {
  await go("documents"); await shot("documents");
  await go("requirements"); await shot("requirements");
  await p.click("#main .k3-head-a .btn.ink"); await wait(250); await shot("f-req");
  await p.keyboard.press("Escape");
  await p.click("#main .k3-table tbody tr"); await wait(300);
  await p.click('#panel [data-k3="k3d.req.link"]'); await wait(250); await shot("pick-ev");
  await p.keyboard.press("Escape");
  await go("evidence"); await shot("evidence");
  await p.click('.k3-rail-i:has-text("STIG")'); await wait(250); await shot("evidence-stig");
  await go("evidence-sources"); await shot("evidence-sources");
  await go("ssp", 900); await shot("ssp");
  await go("ssp--CN-109101", 1400); await shot("ssp-s8");
  await go("ssp--AC-2", 1400); await shot("ssp-ac2");
  console.log(await ev(() => document.activeElement && (document.activeElement.getAttribute("aria-label") || document.activeElement.className)));
};
