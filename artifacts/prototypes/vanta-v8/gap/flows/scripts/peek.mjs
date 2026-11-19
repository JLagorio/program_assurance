import { start } from "./walk.mjs";
const [route, sel, n = 1] = process.argv.slice(2);
const W = await start("peek");
await W.go(route);
const html = await W.p.evaluate(({ sel, n }) => [...document.querySelectorAll(sel)].slice(0, +n).map(e => e.outerHTML.replace(/\s+/g, " ").slice(0, 1600)).join("\n----\n"), { sel, n });
console.log(html);
await W.done();
