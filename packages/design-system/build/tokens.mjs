// @ledger/design-system token build.
// Reads tokens/*.json (DTCG) and writes src/generated/*. Run: npm run build:tokens -w @ledger/design-system
//
// Outputs
//   tokens.css       :root palette + light semantic + non-colour vars; [data-color-mode="dark"] block; prefers-color-scheme fallback
//   theme.css        @theme inline: maps space / radius / shadow / weight / easing tokens onto Tailwind namespaces
//   reset.css        @theme inline: removes Tailwind's default namespaces (a consumer opts in when fully migrated)
//   utilities.css    one @utility per token, on its own property only (bg-*, text-*, icon-*, border-*, font-*, h-*, ...)
//   tokens.ts        the name union, token(), tokenValue(), the utility allowlist
//   merge-config.ts  tailwind-merge class groups for the generated utilities
//   docs.json        name, description, light/dark values (reference and resolved), utility, metadata — for the Storybook sheets
//   tokens.figma.json the merged DTCG source, for Figma / Tokens Studio
//   classes.ts       token name → generated class, for primitive props (backgroundColor, color, size)
//   space.ts         space token → spacing class per property, for Box / Stack / Inline / Bleed props
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import StyleDictionary from "style-dictionary";
import { resolveReferences } from "style-dictionary/utils";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "src/generated");
const PREFIX = "ds";

/* ---------- naming ---------- */

const kebab = (s) =>
  s
    .replace(/^-(\d+)$/, "minus-$1") // darkNeutral.-100
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .toLowerCase();

/** Public path: the `default` segment is a source-only device (SD cannot hold a value on a group). */
const publicPath = (token) => token.path.filter((seg) => seg !== "default");
const dotName = (token) => publicPath(token).join(".");
const cssVar = (token) => `--${PREFIX}-${publicPath(token).map(kebab).join("-")}`;
const cssVarFromPath = (dotted) =>
  `--${PREFIX}-${dotted
    .split(".")
    .filter((s) => s !== "default")
    .map(kebab)
    .join("-")}`;

const rest = (segs, from) => segs.slice(from).map(kebab).join("-");

/** Which generated class reaches this token, and through which mechanism. */
function utilityFor(token) {
  const p = publicPath(token);
  const [a, b] = p;
  if (a === "color") {
    if (["neutral", "darkNeutral", "blue", "green", "orange", "red", "teal", "purple"].includes(b))
      return null; // palette: unreachable by design
    if (b === "background")
      return { kind: "utility", cls: `bg-${rest(p, 2)}`, prop: "background-color" };
    if (b === "blanket") return { kind: "utility", cls: "bg-blanket", prop: "background-color" };
    if (b === "skeleton")
      return {
        kind: "utility",
        cls: `bg-skeleton${p[2] ? "-" + rest(p, 2) : ""}`,
        prop: "background-color",
      };
    if (b === "text")
      return {
        kind: "utility",
        cls: `text-${p.length > 2 ? rest(p, 2) : "default"}`,
        prop: "color",
      };
    if (b === "icon")
      return {
        kind: "utility",
        cls: `icon-${p.length > 2 ? rest(p, 2) : "default"}`,
        prop: "color",
      };
    if (b === "border")
      return {
        kind: "utility",
        cls: `border-${p.length > 2 ? rest(p, 2) : "default"}`,
        prop: "border-color",
      };
    if (b === "chart")
      return {
        kind: "svg",
        cls: `fill-chart-${rest(p, 2)}`,
        strokeCls: `stroke-chart-${rest(p, 2)}`,
        bgCls: `bg-chart-${rest(p, 2)}`,
      }; // an SVG series paints fill or stroke; a legend swatch paints background
  }
  if (a === "elevation" && b === "surface")
    return {
      kind: "utility",
      cls: `bg-surface${p[2] ? "-" + rest(p, 2) : ""}`,
      prop: "background-color",
    };
  if (a === "utility")
    return { kind: "utility", cls: "bg-surface-current", prop: "background-color" };
  if (a === "elevation" && b === "shadow")
    return { kind: "theme", ns: "shadow", key: rest(p, 2), cls: `shadow-${rest(p, 2)}` };
  if (a === "opacity") return { kind: "utility", cls: `opacity-${rest(p, 1)}`, prop: "opacity" };
  if (a === "font") {
    if (b === "weight")
      return { kind: "theme", ns: "font-weight", key: rest(p, 2), cls: `font-${rest(p, 2)}` };
    if (b === "family" || b === "letterSpacing") return null;
    return { kind: "typography", cls: `font-${rest(p, 1)}` };
  }
  if (a === "space") {
    if (b === "negative") return null;
    return {
      kind: "theme",
      ns: "spacing",
      key: rest(p, 1),
      cls: `p-${rest(p, 1)} · gap-${rest(p, 1)} · m-${rest(p, 1)} · w-${rest(p, 1)} …`,
    };
  }
  if (a === "radius")
    return { kind: "theme", ns: "radius", key: rest(p, 1), cls: `rounded-${rest(p, 1)}` };
  if (a === "border" && b === "width")
    return {
      kind: "utility",
      cls: `border-w-${p.length > 2 ? rest(p, 2) : "default"}`,
      prop: "border-width",
    };
  if (a === "dimension") {
    if (b === "icon") return { kind: "size", cls: `size-icon-${rest(p, 2)}` };
    if (b === "control")
      return {
        kind: "control",
        cls: `h-control-${rest(p, 2)}`,
        sizeCls: `size-control-${rest(p, 2)}`,
      };
    if (b === "layout") {
      if (p[2] === "measure")
        return { kind: "utility", cls: "max-w-layout-measure", prop: "max-width" };
      return {
        kind: "utility",
        cls: `${/^(topbar|topnav|banner)$/.test(p[2]) ? "h" : "w"}-layout-${rest(p, 2)}`,
        prop: /^(topbar|topnav|banner)$/.test(p[2]) ? "height" : "width",
      };
    }
    return { kind: "utility", cls: `h-${b}${p[2] ? "-" + rest(p, 2) : ""}`, prop: "height" };
  }
  if (a === "motion") {
    if (b === "duration")
      return { kind: "utility", cls: `duration-${rest(p, 2)}`, prop: "transition-duration" };
    if (b === "easing")
      return { kind: "theme", ns: "ease", key: rest(p, 2), cls: `ease-${rest(p, 2)}` };
  }
  return null;
}

/* ---------- values ---------- */

const isRef = (v) => typeof v === "string" && /^\{[^}]+\}$/.test(v.trim());
const refPath = (v) => v.trim().slice(1, -1);

/** CSS text for a value: a single reference becomes var(--ds-…), anything else its literal. */
function cssValue(original, resolved, type) {
  if (isRef(original)) return `var(${cssVarFromPath(refPath(original))})`;
  return literal(resolved, type);
}

function literal(v, type) {
  if (type === "fontFamily" && Array.isArray(v))
    return v.map((f) => (/^[a-z-]+$/.test(f) ? f : `"${f}"`)).join(", ");
  if (type === "cubicBezier" && Array.isArray(v)) return `cubic-bezier(${v.join(", ")})`;
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}

/** Composite typography → the `font` shorthand, with letter-spacing carried separately. */
function typographyCss(token) {
  const o = token.original.$value;
  const r = token.$value;
  const fam = isRef(o.fontFamily)
    ? `var(${cssVarFromPath(refPath(o.fontFamily))})`
    : literal(r.fontFamily, "fontFamily");
  const weight = isRef(o.fontWeight)
    ? `var(${cssVarFromPath(refPath(o.fontWeight))})`
    : r.fontWeight;
  const shorthand = `${weight} ${r.fontSize}/${r.lineHeight} ${fam}`;
  const spacing = isRef(o.letterSpacing)
    ? `var(${cssVarFromPath(refPath(o.letterSpacing))})`
    : r.letterSpacing;
  return { shorthand, spacing };
}

function prettyRef(v) {
  return isRef(v) ? refPath(v) : typeof v === "object" ? JSON.stringify(v) : String(v);
}

/* ---------- build ---------- */

const sd = new StyleDictionary({
  usesDtcg: true,
  source: [path.join(root, "tokens/*.json")],
  log: { verbosity: "silent" },
  platforms: { web: { buildPath: outDir + "/", files: [] } },
});
await sd.hasInitialized;
const dictionary = await sd.getPlatformTokens("web");
const all = dictionary.allTokens;
const tokenMap = dictionary.tokenMap;
const resolveDark = (v) => (isRef(v) ? resolveReferences(v, tokenMap, { usesDtcg: true }) : v);

const lightVars = [];
const darkVars = [];
const themeLines = [];
const utilityBlocks = [];
const docs = [];
const names = {}; // dotName -> cssVar
const groups = {
  bg: [],
  text: [],
  icon: [],
  border: [],
  "border-w": [],
  font: [],
  "font-weight": [],
  rounded: [],
  shadow: [],
  h: [],
  size: [],
  opacity: [],
  duration: [],
  ease: [],
};
const allClasses = [];
const classByToken = {};
const spaceKeys = [];

const groupOf = (token) => {
  const p = publicPath(token);
  if (
    p[0] === "color" &&
    ["neutral", "darkNeutral", "blue", "green", "orange", "red"].includes(p[1])
  )
    return "palette";
  if (p[0] === "color") return p[1];
  if (p[0] === "elevation") return p[1];
  if (p[0] === "utility") return "surface";
  if (p[0] === "border") return "border-width";
  return p[0];
};

for (const token of all) {
  const name = dotName(token);
  const v = cssVar(token);
  names[name] = v;
  const type = token.$type;
  const ext = token.$extensions?.ledger ?? {};
  const darkOriginal = token.original?.$extensions?.ledger?.dark ?? ext.dark ?? null;
  const darkResolved = darkOriginal !== null ? resolveDark(darkOriginal) : null;

  let lightCss;
  let extraLight = [];
  if (type === "typography") {
    const { shorthand, spacing } = typographyCss(token);
    lightCss = shorthand;
    extraLight.push([`${v}-letter-spacing`, spacing]);
  } else {
    lightCss = cssValue(token.original.$value, token.$value, type);
  }
  lightVars.push([v, lightCss], ...extraLight);
  if (darkOriginal !== null) darkVars.push([v, cssValue(darkOriginal, darkResolved, type)]);

  const u = utilityFor(token);
  if (u) {
    if (u.kind === "theme" && u.ns === "spacing") spaceKeys.push([name, u.key]);
    else classByToken[name] = u.cls;
    allClasses.push(...(u.kind === "theme" && u.ns === "spacing" ? [] : [u.cls]));
    if (u.kind === "theme") {
      themeLines.push(`  --${u.ns}-${u.key}: var(${v});`);
      if (u.ns === "shadow") groups.shadow.push(u.key);
      if (u.ns === "radius") groups.rounded.push(u.key);
      if (u.ns === "font-weight") groups["font-weight"].push(u.key);
      if (u.ns === "ease") groups.ease.push(u.key);
    } else if (u.kind === "typography") {
      utilityBlocks.push(
        `@utility ${u.cls} {\n  font: var(${v});\n  letter-spacing: var(${v}-letter-spacing);\n}`,
      );
      groups.font.push(u.cls.slice(5));
    } else if (u.kind === "svg") {
      utilityBlocks.push(`@utility ${u.cls} {\n  fill: var(${v});\n}`);
      utilityBlocks.push(`@utility ${u.strokeCls} {\n  stroke: var(${v});\n}`);
      utilityBlocks.push(`@utility ${u.bgCls} {\n  background-color: var(${v});\n}`);
      allClasses.push(u.strokeCls, u.bgCls);
    } else if (u.kind === "size") {
      utilityBlocks.push(`@utility ${u.cls} {\n  width: var(${v});\n  height: var(${v});\n}`);
      groups.size.push(u.cls.slice(5));
    } else if (u.kind === "control") {
      utilityBlocks.push(`@utility ${u.cls} {\n  height: var(${v});\n}`);
      utilityBlocks.push(`@utility ${u.sizeCls} {\n  width: var(${v});\n  height: var(${v});\n}`);
      allClasses.push(u.sizeCls);
      const minW = `min-w-${u.cls.slice(2)}`; // a control that grows with its content but never below square
      utilityBlocks.push(`@utility ${minW} {\n  min-width: var(${v});\n}`);
      allClasses.push(minW);
      groups.h.push(u.cls.slice(2));
      groups.size.push(u.sizeCls.slice(5));
    } else {
      utilityBlocks.push(`@utility ${u.cls} {\n  ${u.prop}: var(${v});\n}`);
      const [head, ...tail] = u.cls.split("-");
      const key = u.cls.startsWith("border-w-") ? "border-w" : head;
      const val = u.cls.startsWith("border-w-") ? u.cls.slice(9) : tail.join("-");
      if (groups[key]) groups[key].push(val);
    }
  }

  docs.push({
    name,
    cssVar: v,
    type,
    group: groupOf(token),
    description: token.$description ?? "",
    light: type === "typography" ? lightCss : prettyRef(token.original.$value),
    dark: darkOriginal !== null ? prettyRef(darkOriginal) : null,
    lightResolved: type === "typography" ? lightCss : literal(token.$value, type),
    darkResolved: darkResolved !== null ? literal(darkResolved, type) : null,
    introduced: ext.introduced ?? null,
    deprecated: ext.deprecated ?? null,
    utility: u ? u.cls : null,
  });
}

/* ---------- emit ---------- */

const header = (what) =>
  `/* Generated by build/tokens.mjs — ${what}. Do not edit; edit tokens/*.json and rebuild. */\n`;
const block = (sel, vars) =>
  `${sel} {\n${vars.map(([k, val]) => `  ${k}: ${val};`).join("\n")}\n}\n`;

fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(
  path.join(outDir, "tokens.css"),
  header("custom properties, both modes") +
    block(":root", lightVars) +
    "\n" +
    // an explicit light scope, so a nested light region inside a dark page (a mode-by-mode story) reads light
    block(
      '[data-color-mode="light"]',
      lightVars.filter(([k]) => darkVars.some(([dk]) => dk === k)),
    ) +
    "\n" +
    block('[data-color-mode="dark"]', darkVars) +
    "\n@media (prefers-color-scheme: dark) {\n" +
    block('  :root:not([data-color-mode="light"])', darkVars).replace(/^ {2}(?=\s*--)/gm, "    ") +
    "}\n",
);

fs.writeFileSync(
  path.join(outDir, "theme.css"),
  header("Tailwind theme: token namespaces mapped onto Tailwind's functional utilities") +
    `@theme inline {
${themeLines.join("\n")}
}
`,
);

fs.writeFileSync(
  path.join(outDir, "reset.css"),
  header("Tailwind theme: default namespaces removed so only token utilities exist") +
    `/* A consumer imports this once every class it uses is a token utility.
   After it, bg-blue-500, text-sm, font-medium (Tailwind's), rounded-md and p-4 no longer exist. */
@theme inline {
  --color-*: initial;
  --text-*: initial;
  --font-*: initial;
  --font-weight-*: initial;
  --leading-*: initial;
  --tracking-*: initial;
  --radius-*: initial;
  --shadow-*: initial;
  --inset-shadow-*: initial;
  --spacing: initial;
  --ease-*: initial;
}
`,
);

const composed = [
  `/* Composed from border.width.focused, color.border.focused and space.025: the one focus indicator. */
@utility outline-focused {
  outline: var(--ds-border-width-focused) solid var(--ds-color-border-focused);
  outline-offset: var(--ds-space-025);
}`,
];
allClasses.push("outline-focused");
fs.writeFileSync(
  path.join(outDir, "utilities.css"),
  header("one utility per token, on its own property") +
    utilityBlocks.join("\n") +
    "\n" +
    composed.join("\n") +
    "\n",
);

const tsHeader = "// Generated by build/tokens.mjs. Do not edit; edit tokens/*.json and rebuild.\n";
fs.writeFileSync(
  path.join(outDir, "tokens.ts"),
  tsHeader +
    `export const tokens = ${JSON.stringify(names, null, 2)} as const;

export type TokenName = keyof typeof tokens;

/** The CSS custom property for a token, as a var() expression. */
export function token(name: TokenName): string {
  return \`var(\${tokens[name]})\`;
}

/** The computed value of a token in the current mode, for canvas and SVG. */
export function tokenValue(name: TokenName, el: Element = document.documentElement): string {
  return getComputedStyle(el).getPropertyValue(tokens[name]).trim();
}

/** Every generated class. Space tokens are reachable through Tailwind's spacing utilities (p-100, gap-100 …) and are not listed. */
export const utilities = ${JSON.stringify(allClasses.sort(), null, 2)} as const;
`,
);

const groupEntries = Object.entries(groups)
  .filter(([, v]) => v.length)
  .map(([k, v]) => {
    const id =
      { bg: "bg-color", text: "text-color", border: "border-color", font: "font-family" }[k] ?? k;
    const prefix = k === "font-weight" ? "font" : k;
    return `    "${id}": [{ "${prefix}": ${JSON.stringify([...new Set(v)])} }],`;
  });
fs.writeFileSync(
  path.join(outDir, "merge-config.ts"),
  tsHeader +
    `/** Pass to tailwind-merge's extendTailwindMerge so generated utilities merge as their real property groups. */
export const mergeConfig = {
  extend: {
    classGroups: {
${groupEntries.join("\n")}
    },
  },
} as const;
`,
);

fs.writeFileSync(path.join(outDir, "docs.json"), JSON.stringify(docs, null, 2) + "\n");

// For the ESLint plugin, which runs in plain Node: the class allowlist and the deprecation map.
const deprecated = {};
for (const token of all) {
  const dep = token.$extensions?.ledger?.deprecated;
  if (!dep) continue;
  const name = dotName(token);
  const replacement = typeof dep === "string" ? dep : null;
  deprecated[name] = {
    replacement,
    class: classByToken[name] ?? null,
    replacementClass: replacement ? (classByToken[replacement] ?? null) : null,
  };
}
fs.writeFileSync(
  path.join(outDir, "utilities.json"),
  JSON.stringify(
    {
      classes: [...new Set(allClasses)].sort(),
      spaceKeys: spaceKeys.map(([, k]) => k),
      deprecated,
    },
    null,
    2,
  ) + "\n",
);

fs.writeFileSync(
  path.join(outDir, "classes.ts"),
  tsHeader +
    `/** Token name → the one generated class that reaches it. Primitive props are typed on these keys. */
export const classByToken = ${JSON.stringify(classByToken, null, 2)} as const;

export type ClassToken = keyof typeof classByToken;
`,
);

const spaceProps = {
  p: "p",
  px: "px",
  py: "py",
  pt: "pt",
  pb: "pb",
  ps: "ps",
  pe: "pe",
  gap: "gap",
  gapX: "gap-x",
  gapY: "gap-y",
};
const bleedProps = { m: "-m", mx: "-mx", my: "-my", mt: "-mt", mb: "-mb", ms: "-ms", me: "-me" };
spaceKeys.sort((a, b) => Number(a[1]) - Number(b[1]));
const mapFor = (prefix) =>
  Object.fromEntries(spaceKeys.map(([name, key]) => [name, `${prefix}-${key}`]));
fs.writeFileSync(
  path.join(outDir, "space.ts"),
  tsHeader +
    `/** The space scale as primitive prop values. Every class string is literal so Tailwind's scanner sees it. */
export const spaceTokens = ${JSON.stringify(spaceKeys.map(([n]) => n))} as const;

export type SpaceToken = (typeof spaceTokens)[number];

export const spaceClasses = {
${Object.entries(spaceProps)
  .map(([k, prefix]) => `  ${k}: ${JSON.stringify(mapFor(prefix))},`)
  .join("\n")}
} as const;

/** Negative margins for Bleed, keyed by the positive token the caller names. */
export const bleedClasses = {
${Object.entries(bleedProps)
  .map(([k, prefix]) => `  ${k}: ${JSON.stringify(mapFor(prefix))},`)
  .join("\n")}
} as const;
`,
);

// Figma export: the merged DTCG source, untouched.
const merged = {};
const deep = (a, b) => {
  for (const [k, v] of Object.entries(b))
    a[k] = v && typeof v === "object" && !Array.isArray(v) ? deep(a[k] ?? {}, v) : v;
  return a;
};
for (const f of fs
  .readdirSync(path.join(root, "tokens"))
  .filter((f) => f.endsWith(".json"))
  .sort())
  deep(merged, JSON.parse(fs.readFileSync(path.join(root, "tokens", f), "utf8")));
fs.writeFileSync(path.join(outDir, "tokens.figma.json"), JSON.stringify(merged, null, 2) + "\n");

console.log(
  `tokens: ${all.length} · dark values: ${darkVars.length} · utilities: ${allClasses.length} · theme keys: ${themeLines.length}`,
);
