export default async ({ p, go, shot, ok, wait, ev }) => {
  await go("requirements");
  const code = await ev(() => PA.v3.fact("createRequirement", { title: "T nat", statement: "S", controls: ["AC-2"], components: ["CN-109101"] }));
  await go("component--CN-109101--requirements", 700);
  console.log(await ev((c) => { const r = [...document.querySelectorAll("#main tbody tr")].find((x) => x.innerText.includes(c)); return r ? r.outerHTML.slice(0, 300) : "no row"; }, code));
  await ev((c) => { const r = [...document.querySelectorAll("#main tbody tr")].find((x) => x.innerText.includes(c)); if (r) r.click(); }, code); await wait(500);
  console.log("panel:", await ev(() => document.querySelector("#panel").innerText.replace(/\s+/g, " ").slice(0, 300)));
  console.log("reqPanel fact:", await ev(() => PA.v3.fact("reqPanel")), "P kinds:", await ev(() => Object.keys(PA.P).filter((k) => /k3d|k3s-req|k3e/.test(k)).join(",")));
  await shot("nat-dbg");
};
