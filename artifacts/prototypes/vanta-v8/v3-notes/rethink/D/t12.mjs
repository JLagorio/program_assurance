export default async ({ p, go, shot, ok, wait, ev }) => {
  await go("documents");
  const out = await ev(() => {
    const d = PA.v3d.docs().filter((x) => x.kind === "policy");
    const no = d.filter((x) => !x.route);
    const r = { n: d.length, no: no.map((x) => [x.id, x.name, x.state, x.panel]) };
    if (no[0]) { const pv = PA.P["a-docs-pol"](no[0].panel[1]); r.pv = pv.label + " | " + String(pv.body).replace(/<svg.*?<\/svg>/g, "").slice(0, 1500); }
    r.routes = Object.keys(PA.S).filter((k) => /policy-page|policy-record|policy-editor/.test(k)).join(" ");
    return r;
  });
  console.log(JSON.stringify(out, null, 1).slice(0, 3500));
};
