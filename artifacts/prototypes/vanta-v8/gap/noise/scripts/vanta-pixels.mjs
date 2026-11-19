// node vanta-pixels.mjs <out.json>: pixel colour load of chosen Vanta whole-page screenshots (same function as ours).
import { createRequire } from "node:module"; import fs from "node:fs";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const V = "/Users/joseflagorio/Development/program_assurance-ux-proposal/docs/products/vanta/images/ux/";
const LIST = [
 ["home","home/home-page--01.png"],["home","home/getting-started-with-workspaces--02.png"],["my work","my-work/my-work-page--01.png"],
 ["register","controls/controls-page--01.png"],["record","controls/managing-common-controls--02.png"],
 ["register","tests/deactivated-tests--01.png"],["record","tests/automated-test-history--01.png"],
 ["register","documents/documents-page--01.png"],["record","documents/managing-documents--15.png"],
 ["register","policies/the-policies-page--01.png"],["record","policies/bringing-your-current-compliance-program-into-vanta--42.png"],
 ["register","risk/managing-risks-and-risk-registers--01.png"],["record","risk/completing-risk-assessments--02.png"],["overview","risk/managing-risks-and-risk-registers--02.png"],
 ["register","vendors/adding-and-managing-vendors--01.png"],["record","vendors/adding-and-managing-vendors--04.png"],
 ["register","personnel/getting-started-personnel-hub--01.png"],["register","audits/creating-an-audit--05.png"],["register","audits/how-will-your-auditor-use-vanta--03.png"],
 ["record","frameworks/iso-27701--01.png"],["register","frameworks/framework-control-sets-soc-2-trust-services-criteria--01.png"],
 ["overview","access/access-reviews--01.png"],["register","vulnerabilities/the-vulnerabilities-page--01.png"],["register","issues/issue-management-in-vanta--01.png"],
 ["editor","policies/using-ai-change-summaries-in-vanta--01.png"],["editor","documents/system-description-generator--03.png"]];
const lib = fs.readFileSync(new URL("./measure-lib.js", import.meta.url), "utf8");
const b = await chromium.launch(); const p = await b.newPage(); await p.goto("about:blank"); await p.evaluate(lib);
const res = [];
for (const [type, f] of LIST) { const u = "data:image/png;base64," + fs.readFileSync(V + f).toString("base64"); const r = await p.evaluate((u) => window.__pixels(u), u); res.push({ type, file: "V/images/ux/" + f, ...r }); process.stdout.write("."); }
fs.writeFileSync(process.argv[2], JSON.stringify(res, null, 1)); await b.close();
for (const r of res) console.log(r.type.padEnd(9), r.colourfulPct.toString().padStart(6), r.strongPct.toString().padStart(6), r.families.join(","), r.file.split("/").slice(-1)[0]);
