// Print a short view of PA.SSP for module authors: node ssp-peek.js [code ...]
global.window = { PA: {}, addEventListener() {} }; global.location = { hash: "" }; global.document = { getElementById() { return null; } };
require("./mod-a-ssp-data.js");
const D = window.PA.SSP, args = process.argv.slice(2);
if (args.length) { for (const c of args) console.log(JSON.stringify(D.ctl(c), null, 1)); process.exit(0); }
const short = (o) => JSON.stringify(o).slice(0, 300);
for (const [k, v] of Object.entries(D)) if (typeof v !== "function") console.log(k.padEnd(16), Array.isArray(v) ? `[${v.length}] ` + short(v[0]) : short(v));
