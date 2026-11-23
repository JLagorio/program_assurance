export default async ({ p, go, shot, ok, wait, ev }) => {
  await go("policy-page-ac-1", 600);
  console.log("policy crumbs:", await ev(() => (document.querySelector("#main .ak-crumbs") || {}).innerText));
  await ev(() => { const b = document.querySelector("#main .ak-crumbs [data-go], #main .ak-crumbs a"); if (b) b.click(); }); await wait(500);
  console.log("→", await ev(() => location.hash + " | " + (document.querySelector("#main nav.k3-rtabs .k3-rail-i.on .x") || {}).innerText));
  await go("plan-cp", 700); console.log("plan back:", await ev(() => (document.querySelector("#main .ak-back, .se-head .ak-back, [data-go='documents']") || {}).innerText));
  await go("requirements"); await shot("requirements");
  await p.setViewportSize({ width: 390, height: 800 });
  await go("requirement--REQ-001"); await shot("m-requirement");
  await go("evidence"); await shot("m-evidence");
  await go("documents"); await shot("m-documents");
};
