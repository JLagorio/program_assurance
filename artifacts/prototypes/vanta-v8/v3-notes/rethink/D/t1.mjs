export default async ({ p, go, shot, ok, wait, ev }) => {
  await go("evidence");
  console.log(await ev(() => { const th = [...document.querySelectorAll("#main th")].find((x) => /Renew/.test(x.textContent)); return th ? th.className + " | " + getComputedStyle(th).whiteSpace + " | " + th.offsetWidth : "none"; }));
  await p.click("#main .k3-table tbody tr"); await wait(350); await shot("p-ev");
  await go("requirements"); await p.click("#main .k3-table tbody tr"); await wait(350); await shot("p-req");
  await p.click("#main .k3-head-a .btn.ink"); await wait(250); await shot("f-req");
};
