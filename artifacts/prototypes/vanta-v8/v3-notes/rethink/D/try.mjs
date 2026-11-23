// node try.mjs <script.js>   runs steps: export default async ({ p, go, shot, ok, errs }) => { … }
import { open, SP } from "./lib.mjs";
const mod = await import(process.argv[2].startsWith("/") ? process.argv[2] : "./" + process.argv[2]);
const ctx = await open({ w: +process.env.W || 1440, h: +process.env.H || 900 });
let fails = 0;
ctx.ok = (name, cond, extra) => { if (!cond) fails++; console.log(cond ? "ok  " : "FAIL", name, cond ? "" : extra === undefined ? "" : JSON.stringify(extra).slice(0, 300)); };
ctx.wait = (ms) => ctx.p.waitForTimeout(ms);
ctx.ev = (fn, a) => ctx.p.evaluate(fn, a);
try { await mod.default(ctx); } catch (e) { fails++; console.log("THROW", String(e.stack || e).slice(0, 900)); }
console.log("page errors", ctx.errs.length, ctx.errs.slice(0, 4).map((e) => String(e).slice(0, 300)));
console.log(fails ? `${fails} FAILED` : "all passed");
await ctx.b.close();
