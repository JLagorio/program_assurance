export default async ({ p, go, shot, ok, wait, ev }) => {
  await go("requirements");
  await p.click("#main .k3-table tbody tr td:first-child"); await wait(400);
  console.log(await ev(() => { const b = [...document.querySelectorAll("#panel .k3d-rowact button")]; return b.map((x) => x.innerText + "|" + x.getAttribute("data-k3")).join(", "); }));
  await ev(() => { const b = [...document.querySelectorAll("#panel .k3d-rowact button")].find((x) => x.innerText.trim() === "Unmap"); b.click(); }); await wait(300);
  console.log("modal after programmatic click:", await ev(() => !document.getElementById("modal").hidden), "panel:", await ev(() => document.querySelector("#panel .k3-pn-h").innerText.slice(0, 60)));
  await p.keyboard.press("Escape"); await wait(200);
  await ev(() => PA.v3k.openPanel("k3c-control", "AC-3")); await wait(400);
  await ev(() => PA.v3k.openPanel("k3d-req", "REQ-001")); await wait(400);
  console.log("panel:", await ev(() => document.querySelector("#panel .k3-pn-h").innerText.slice(0, 60)));
  await ev(() => { const b = [...document.querySelectorAll("#panel .k3d-rowact button")].find((x) => x.innerText.trim() === "Unmap"); b.click(); }); await wait(300);
  console.log("modal after reopen:", await ev(() => !document.getElementById("modal").hidden));
  await shot("dbg");
};
