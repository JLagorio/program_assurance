export default async ({ p, go, shot, ok, wait, ev }) => {
  await go("documents");
  console.log(JSON.stringify(await ev(() => (PA.v3.fact("connections") || []).map((x) => ({ id: x.id, name: x.name, agreement: x.agreement, needs: x.needsAgreement })).slice(0, 9))).slice(0, 1800));
  console.log(await ev(() => [...document.querySelectorAll("#main .k3-rail-i")].map((x) => x.innerText.replace(/\s+/g, " ")).join(" | ")));
  await ev(() => { const b = [...document.querySelectorAll("#main .k3-rail-i")].find((x) => /Agreements/.test(x.innerText)); if (b) b.click(); }); await wait(300); await shot("documents-agr");
};
