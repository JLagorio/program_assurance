// node shot.mjs <outdir> <route>[@390] …   screenshots of routes, V3 on
import { open, SP } from "./lib.mjs";
const [out, ...routes] = process.argv.slice(2);
const { b, p, errs, go } = await open();
for (const spec of routes) {
  const [r, w] = spec.split("@");
  await p.setViewportSize({ width: +w || 1440, height: w ? 800 : 900 });
  await go(r, 600);
  const info = await p.evaluate(() => ({ hash: location.hash, h: document.documentElement.scrollHeight, sw: document.documentElement.scrollWidth, title: (document.querySelector("#main h1") || {}).innerText, nav: ((document.querySelector("#nav .on, #nav [aria-current]") || {}).innerText || "").trim() }));
  await p.screenshot({ path: `${SP}/vanta/v3r/D/${out}/${spec.replace(/[^a-z0-9-]/gi, "_")}.jpg`, type: "jpeg", quality: 60, fullPage: process.env.FULL === "1" });
  console.log(spec, "->", JSON.stringify(info));
}
console.log("errors", errs.slice(0, 5));
await b.close();
