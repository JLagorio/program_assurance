// Inline data.json into the module template: node assemble.js <template> <data.json> <out.js>
const fs = require("fs");
const [tpl, dat, out] = process.argv.slice(2);
const src = fs.readFileSync(tpl, "utf8"), data = fs.readFileSync(dat, "utf8").trim();
if (!src.includes("__DATA__")) throw new Error("no placeholder");
fs.writeFileSync(out, src.replace("__DATA__", () => data));
console.log("wrote", out, fs.statSync(out).size, "bytes");
