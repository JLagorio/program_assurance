export default async ({ p, go, shot, ok, wait, ev }) => {
  await go("documents");
  console.log(await ev(() => [...document.querySelectorAll("#nav .on, #nav [aria-current]")].map((x) => x.tagName + "." + x.className + "[" + (x.getAttribute("aria-current") || "") + "]=" + x.innerText.trim().slice(0, 30)).join(" | ")));
  await go("after-policy-page-ac-1", 600); await shot("policy-page"); console.log(await ev(() => location.hash));
};
