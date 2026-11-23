export default async ({ p, go, shot, ok, wait, ev }) => {
  await go("requirements");
  console.log(await ev(() => [...document.querySelectorAll("#nav .on, #nav [aria-current]")].map((x) => x.tagName + "." + x.className + "=" + x.innerText.trim().slice(0, 30)).join(" | ")));
  console.log(await ev(() => document.querySelector("#main .k3-table tbody tr").outerHTML.slice(0, 400)));
  await p.hover("#main .k3-table tbody tr"); await p.click("#main .k3-table tbody tr .k3-eye"); await wait(400);
  console.log("eye → panel:", await ev(() => !document.getElementById("panel").hidden && document.querySelector("#panel .k3-pn-h").innerText.replace(/\s+/g, " ")));
  await shot("eye-panel");
  await ev(() => document.getElementById("closePanel").click());
  await p.click("#main .k3-table tbody tr td:nth-child(2)"); await wait(500);
  console.log("row →", await ev(() => location.hash));
};
