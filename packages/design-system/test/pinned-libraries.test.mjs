// The libraries whose markup the kit reads are pinned to one exact version (audit CHF-17). Base UI
// draws the popups, fields and menus whose data attributes the kit's classes and plays select;
// recharts draws the charts, and chart.css and the chart parts select its class names (the
// layers a legend dims, the tooltip that stands down while a card is open, the svg that takes the
// focus ring and gives the PNG). A minor release may rename any of these and nothing would say
// so, so an upgrade is a deliberate change of the pin, and this test holds it: the pin is exact,
// it is what is installed, and every recharts class the kit names is one the installed recharts
// still writes. A class the kit stops naming leaves this list by itself.
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE = path.join(here, "..");
const SOURCE = path.join(PACKAGE, "src");
const require = createRequire(path.join(PACKAGE, "package.json"));
const manifest = JSON.parse(fs.readFileSync(path.join(PACKAGE, "package.json"), "utf8"));

const PINNED = ["@base-ui/react", "recharts"];

const filesUnder = (dir, keep) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return filesUnder(full, keep);
    return keep(full) ? [full] : [];
  });

for (const name of PINNED) {
  test(`${name} is pinned to the one version installed`, () => {
    const spec = manifest.dependencies?.[name];
    assert.match(
      spec ?? "",
      /^\d+\.\d+\.\d+$/,
      `package.json pins ${name} to an exact version, not "${spec}": the kit reads its markup`,
    );
    const installed = require(`${name}/package.json`).version;
    assert.equal(
      installed,
      spec,
      `${name} ${installed} is installed for the pin ${spec}: run npm install`,
    );
  });
}

test("every recharts class the kit names is one the installed recharts writes", () => {
  // What the kit names: its stylesheets and its source, not the stories, whose plays fail on
  // their own when a class they query is gone.
  const named = new Map();
  const kit = filesUnder(SOURCE, (file) => {
    const rel = path.relative(SOURCE, file);
    if (rel.startsWith(`stories${path.sep}`) || rel.startsWith(`generated${path.sep}`))
      return false;
    return /\.(css|tsx?)$/.test(file);
  });
  for (const file of kit) {
    for (const [cls] of fs
      .readFileSync(file, "utf8")
      .matchAll(/recharts-[A-Za-z0-9-]*[A-Za-z0-9]/g)) {
      const files = named.get(cls) ?? new Set();
      files.add(path.relative(PACKAGE, file));
      named.set(cls, files);
    }
  }
  assert.ok(named.size > 0, "the kit names recharts classes in chart.css and the chart parts");

  // What recharts writes: the ES build, which the kit bundles.
  const recharts = path.dirname(require.resolve("recharts/package.json"));
  const build = filesUnder(path.join(recharts, "es6"), (file) => file.endsWith(".js"))
    .map((file) => fs.readFileSync(file, "utf8"))
    .join("\n");

  const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const missing = [];
  for (const [cls, files] of named) {
    // A class that ends in a number is written as a prefix and the number (recharts-treemap-depth-1
    // is "recharts-treemap-depth-" and the node's depth).
    const numbered = /^(.*-)\d+$/.exec(cls);
    const written = numbered
      ? new RegExp(`${escape(numbered[1])}(?:["'\`]|\\$\\{)`)
      : new RegExp(`(?<![A-Za-z0-9-])${escape(cls)}(?![A-Za-z0-9-])`);
    if (!written.test(build)) missing.push(`${cls} (named in ${[...files].join(", ")})`);
  }
  assert.deepEqual(
    missing,
    [],
    `recharts ${manifest.dependencies.recharts} no longer writes these classes; update the selectors before the pin`,
  );
});
