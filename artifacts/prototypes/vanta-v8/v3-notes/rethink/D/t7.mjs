export default async ({ p, go, shot, ok, wait, ev }) => {
  await go("requirements");
  const code = await ev(() => PA.v3.fact("createRequirement", { title: "T reload", statement: "S", controls: ["AC-2"], components: ["CN-109101"] }));
  await ev(() => PA.v2.redraw()); await wait(300);
  console.log("before", await ev(() => document.querySelector("#main .k3-table tbody tr").innerText.replace(/\s+/g, " ").slice(0, 80)));
  await p.reload(); await wait(1200);
  console.log("after", await ev(() => [location.hash, PA.v3.on(), (document.querySelector("#main .k3-table tbody tr") || document.querySelector("#main")).innerText.replace(/\s+/g, " ").slice(0, 160), JSON.stringify(PA.v3k.get("req.view")), PA.v3.fact("createdRequirements").length]));
  await ev(() => PA.v2.redraw()); await wait(300);
  console.log("after redraw", await ev(() => document.querySelector("#main .k3-table tbody tr").innerText.replace(/\s+/g, " ").slice(0, 80)));
};
