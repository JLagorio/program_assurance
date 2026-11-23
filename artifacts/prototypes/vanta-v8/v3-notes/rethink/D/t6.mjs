export default async ({ p, go, shot, ok, wait, ev }) => {
  await go("requirements");
  const code = await ev(() => PA.v3.fact("createRequirement", { title: "T", statement: "S", controls: ["AC-2"], components: ["CN-109101"] }));
  await ev(() => PA.v2.redraw()); await wait(300);
  await ev((c) => { PA.v3.fact("linkEvidence", c, "e6"); PA.v3.fact("mapControl", c, "AC-3"); }, code); await ev(() => PA.v2.redraw()); await wait(300);
  await ev(() => PA.v3k.openPanel("k3c-control", "AC-3")); await wait(450);
  await ev((c) => PA.v3k.openPanel("k3d-req", c), code); await wait(400);
  console.log("panel:", await ev(() => document.querySelector("#panel").innerText.replace(/\s+/g, " ").slice(0, 200)));
  console.log(await ev(() => [...document.querySelectorAll("#panel .k3-sec")].map((s) => s.querySelector("h2").childNodes[0].textContent + ":" + s.querySelectorAll("tbody tr").length + ":" + [...s.querySelectorAll("button")].map((b) => b.innerText.trim()).join("/")).join(" | ")));
};
