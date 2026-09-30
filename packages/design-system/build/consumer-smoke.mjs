// A real tarball installed outside the workspace: no aliases or symlinks, and dist under every
// export condition but the named `@ledger/source`.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = path.resolve(root, "../..");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ledger-consumer-"));
const run = (cmd, args, cwd = dir) =>
  execFileSync(cmd, args, { cwd, stdio: "inherit", env: { ...process.env, NODE_OPTIONS: "" } });
try {
  const packed = JSON.parse(
    execFileSync("npm", ["pack", "--ignore-scripts", "--json", "--pack-destination", dir], {
      cwd: root,
      encoding: "utf8",
    }),
  )[0];
  const version = (name) =>
    JSON.parse(fs.readFileSync(path.join(repo, "node_modules", name, "package.json"), "utf8"))
      .version;
  const deps = Object.fromEntries(
    [
      "react",
      "react-dom",
      "tailwindcss",
      "typescript",
      "@types/react",
      "@types/react-dom",
      "vite",
      "@tailwindcss/vite",
      "eslint",
    ].map((name) => [name, version(name)]),
  );
  fs.writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify({
      private: true,
      type: "module",
      dependencies: { ...deps, "@ledger/design-system": `file:./${packed.filename}` },
    }),
  );
  run("npm", [
    "install",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
    ...(process.argv.includes("--offline") ? ["--offline"] : []),
  ]);
  fs.cpSync(path.join(root, "build/consumer-fixture"), dir, { recursive: true });
  // A bundler or runtime in development mode (webpack, Next.js, Vite's dev server) sets the
  // generic `development` condition. The package answers it with dist, so no consumer is handed
  // TypeScript it would have to compile; only the named `@ledger/source` condition opts into src.
  const resolveWith = (conditions) =>
    execFileSync(
      process.execPath,
      [
        ...conditions.map((condition) => `--conditions=${condition}`),
        "--input-type=module",
        "--eval",
        'console.log(import.meta.resolve("@ledger/design-system"), import.meta.resolve("@ledger/design-system/cn"))',
      ],
      { cwd: dir, encoding: "utf8", env: { ...process.env, NODE_OPTIONS: "" } },
    ).trim();
  for (const conditions of [[], ["development"], ["development", "browser", "import"]])
    if (!/\/dist\/index\.js \S+\/dist\/lib\/cn\.js$/.test(resolveWith(conditions)))
      throw new Error(
        `With ${conditions.join(", ") || "no"} conditions the package resolved to source: ${resolveWith(conditions)}`,
      );
  if (!/\/src\/index\.ts \S+\/src\/lib\/cn\.ts$/.test(resolveWith(["@ledger/source"])))
    throw new Error("The @ledger/source condition no longer resolves the package's source");
  run(process.execPath, ["ssr.mjs"]);
  run(process.execPath, ["node_modules/typescript/bin/tsc", "-p", "tsconfig.json"]);
  run(process.execPath, ["node_modules/vite/bin/vite.js", "build"]);
  const css = fs
    .readdirSync(path.join(dir, "dist/assets"))
    .filter((f) => f.endsWith(".css"))
    .map((f) => fs.readFileSync(path.join(dir, "dist/assets", f), "utf8"))
    .join("\n");
  if (!css.includes("--ds-") || !css.includes(".bg-brand-bold"))
    throw new Error("Consumer CSS is missing Ledger tokens or component utilities");
  if (!css.includes("outline-danger") || !css.includes("data-icon"))
    throw new Error("Consumer CSS is missing Badge danger outlines or icon selectors");
  if (!/\.border-default[^{}]*\{[^}]*border-color:\s*var\(--ds-color-border\)/.test(css))
    throw new Error("Consumer CSS is missing the Separator border token");
  if (!/\.bg-skeleton[^{}]*\{[^}]*background(?:-color)?:\s*var\(--ds-color-skeleton\)/.test(css))
    throw new Error("Consumer CSS is missing the Skeleton fill token");
  if (
    !/\[data-disabled\]:not\(\[data-loading\]\)\{background-color:\s*var\(--ds-color-background-disabled\)/.test(
      css,
    ) ||
    !/\[data-disabled\]:not\(\[data-loading\]\)\{color:\s*var\(--ds-color-text-disabled\)/.test(css)
  )
    throw new Error("Consumer CSS is missing Button's disabled styling with its loading exception");
  if (
    !css.includes(".drawer-popup") ||
    !css.includes("--drawer-swipe-movement-y") ||
    !css.includes(".drawer-overlay")
  )
    throw new Error("Consumer CSS is missing Base UI drawer swipe geometry");
  if (
    !css.includes(".toast-root") ||
    !css.includes(".toast-viewport") ||
    !css.includes("--toast-swipe-movement-y")
  )
    throw new Error("Consumer CSS is missing Base UI toast stack and swipe geometry");
  if (!/@font-face\{[^}]*font-family:\s*["']?Geist Variable/.test(css.replace(/\s*\n\s*/g, "")))
    throw new Error("Consumer CSS is missing the packaged Geist faces from fonts.css");
  // The lint data spells classes no element renders (m-(--ds-space-negative-025) is one of its
  // variable spellings); ledger.css keeps it out of Tailwind's scan.
  if (css.includes("--ds-space-negative-025\\)"))
    throw new Error(
      "Consumer CSS carries classes Tailwind read from the lint data (src/generated/lint*.json)",
    );
  // The ESLint plugin as a consumer loads it: the `./eslint` export of the installed tarball, with
  // the token metadata the tarball carries (src/generated, so it needs no dist) and none of the
  // kit's own allowances, which live in test/lint-allow.json and are not packed.
  const packedFiles = new Set(packed.files.map((file) => file.path));
  const pluginFiles = [
    ...fs
      .readdirSync(path.join(root, "eslint-plugin"), { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) =>
        path.relative(root, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"),
      ),
    "src/generated/utilities.json",
    // The lint data, from src and from dist (eslint-plugin/data.js reads either).
    ...["src", "dist"].flatMap((dir) =>
      ["lint.json", "lint-values.json"].map((file) => `${dir}/generated/${file}`),
    ),
  ];
  const unpacked = pluginFiles.filter((file) => !packedFiles.has(file));
  if (unpacked.length)
    throw new Error(`The tarball is missing ESLint plugin files: ${unpacked.join(", ")}`);
  if ([...packedFiles].some((file) => file.startsWith("test/")))
    throw new Error("The tarball carries test/, so consumers would inherit the kit's allowances");
  const lintDir = path.join(dir, "lint");
  fs.mkdirSync(lintDir);
  fs.writeFileSync(
    path.join(lintDir, "eslint.config.js"),
    `import ledger from "@ledger/design-system/eslint";
export default [
  ...ledger.configs.recommended,
  { files: ["**/*.tsx"], languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } },
];
`,
  );
  fs.writeFileSync(
    path.join(lintDir, "bad.tsx"),
    `export function PageHeader() {
  return null;
}

export function SaveReceipt() {
  return <div className="bg-red-500 mt-200 w-[13px] hovr:bg-surface">Saved</div>;
}
`,
  );
  fs.writeFileSync(
    path.join(lintDir, "clean.tsx"),
    `import { Button, Stack } from "@ledger/design-system";

export function SaveReceipt() {
  return (
    <Stack space="200">
      <p className="font-body text-subtle @split:font-body-large">Your changes are saved.</p>
      <Button>Open workspace</Button>
    </Stack>
  );
}
`,
  );
  fs.writeFileSync(
    path.join(lintDir, "package-preset.mjs"),
    `import ledger from "@ledger/design-system/eslint";
const rules = ledger.configs.package.flatMap(({ rules = {} }) => Object.entries(rules));
const allowing = rules.filter(([, entry]) => [entry].flat().some((option) => option?.allow));
console.log(JSON.stringify({ rules: rules.length, allowing: allowing.map(([name]) => name) }));
`,
  );
  // ESLint exits 1 when it reports problems and 2 when it cannot lint at all.
  const lintFiles = () => {
    const linted = spawnSync(
      process.execPath,
      ["../node_modules/eslint/bin/eslint.js", "--format", "json", "bad.tsx", "clean.tsx"],
      { cwd: lintDir, encoding: "utf8", env: { ...process.env, NODE_OPTIONS: "" } },
    );
    if (linted.status === 2 || !linted.stdout)
      throw new Error(`ESLint could not load the packed plugin:\n${linted.stderr}`);
    return Object.fromEntries(
      JSON.parse(linted.stdout).map(({ filePath, messages }) => [
        path.basename(filePath),
        messages,
      ]),
    );
  };
  const reports = lintFiles();
  const described = (messages) =>
    messages.map(({ ruleId, message }) => `${ruleId}: ${message}`).join("\n");
  const reported = new Set(reports["bad.tsx"].map(({ ruleId }) => ruleId));
  const missed = [
    "ledger/no-non-token-class",
    "ledger/no-margin",
    "ledger/no-arbitrary-value",
    "ledger/no-kit-shadow",
    // The variant grammar, read from the packed lint.json.
    "ledger/no-unknown-variant",
  ].filter((rule) => !reported.has(rule));
  if (missed.length)
    throw new Error(
      `The packed plugin did not report ${missed.join(", ")}:\n${described(reports["bad.tsx"])}`,
    );
  if (
    !reports["bad.tsx"].some(
      ({ ruleId, message }) => ruleId === "ledger/no-margin" && message.includes('"mt-200"'),
    )
  )
    throw new Error("The packed plugin's no-margin report does not name the class mt-200");
  if (reports["clean.tsx"].length)
    throw new Error(`The packed plugin reports a clean file:\n${described(reports["clean.tsx"])}`);
  // A package whose src/generated has no lint data reads dist/generated's, and says the same.
  const installed = path.join(dir, "node_modules/@ledger/design-system/src/generated");
  for (const file of ["lint.json", "lint-values.json"]) fs.rmSync(path.join(installed, file));
  const fromDist = lintFiles();
  for (const file of ["bad.tsx", "clean.tsx"])
    if (described(fromDist[file]) !== described(reports[file]))
      throw new Error(
        `With the lint data in dist only, the packed plugin reports ${file} differently:\n${described(fromDist[file])}`,
      );
  const preset = JSON.parse(
    execFileSync(process.execPath, ["package-preset.mjs"], {
      cwd: lintDir,
      encoding: "utf8",
      env: { ...process.env, NODE_OPTIONS: "" },
    }),
  );
  if (!preset.rules || preset.allowing.length)
    throw new Error(
      `The packed configs.package carries kit allowances for ${preset.allowing.join(", ") || "no rules at all"}`,
    );
  console.log("Packed consumer declarations, Vite bundle, Tailwind CSS and ESLint plugin passed");
} finally {
  if (process.argv.includes("--keep")) console.log(`Consumer fixture: ${dir}`);
  else fs.rmSync(dir, { recursive: true, force: true });
}
