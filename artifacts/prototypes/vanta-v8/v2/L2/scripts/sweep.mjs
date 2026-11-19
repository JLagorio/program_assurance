// node sweep.mjs <html> : draw every screen function directly (no navigation) and report the ones that throw.
import { createRequire } from "node:module"; import path from "node:path";
const require = createRequire("/Users/joseflagorio/Development/program_assurance-ux-proposal/package.json");
const { chromium } = require("playwright");
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
await p.goto("file://" + path.resolve(process.argv[2]) + "#home"); await p.waitForTimeout(500);
const out = await p.evaluate(() => { const S = window.PA.S, bad = []; let n = 0; for (const k of Object.keys(S)) { if (k === "ssp" || k.startsWith("plan-")) continue; n++; try { const h = S[k](); if (typeof h !== "string") bad.push(k + ": not a string"); } catch (e) { bad.push(k + ": " + e.message); } } const P = window.PA.P, badP = []; for (const k of Object.keys(P)) { try { P[k](); } catch (e) { badP.push(k + ": " + e.message); } } return { n, bad, badP }; });
console.log("screens", out.n, "throwing", out.bad.length, out.bad.slice(0, 10)); console.log("panels throwing", out.badP.length, out.badP.slice(0, 10)); console.log("page errors", errs.length ? errs.slice(0, 5) : "none");
await b.close();
