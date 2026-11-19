// The banners each register draws without the visual layer: text, and whether its action is wired.
import { createRequire } from "module";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const [, , build] = process.argv;
const b = await chromium.launch(); const p = await b.newPage();
await p.goto("file://" + build + "#home"); await p.waitForTimeout(300);
console.log(await p.evaluate(() => {
  const PA = window.PA, out = [];
  PA.v2clean.off = true;
  for (const r of Object.keys(PA.S)) {
    if (r.startsWith("after-") || PA.v2clean.typeOf(r) !== "register") continue;
    const t = document.createElement("template"); t.innerHTML = PA.S[r]();
    t.content.querySelectorAll(".ak-banner, .next, .ak-await, .a-docs-bwrap").forEach((el) => {
      const acts = [...el.querySelectorAll(".btn, a[href], [role=button], button")].map((a) => `${a.textContent.trim()}${a.getAttribute("data-go") || a.getAttribute("data-modal") || a.getAttribute("href") || [...a.attributes].some((x) => /^data-/.test(x.name)) ? "→" : " (dead)"}`);
      out.push(`${r} :: ${el.className} :: ${el.textContent.replace(/\s+/g, " ").trim().slice(0, 90)} :: ${acts.join(", ")}`);
    });
  }
  PA.v2clean.off = false;
  return out.join("\n");
}));
await b.close();
