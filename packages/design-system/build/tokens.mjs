// @ledger/design-system token build.
// Reads tokens/*.json (DTCG) and writes src/generated/*. Run: npm run build:tokens -w @ledger/design-system
//
// Outputs
//   tokens.css       :root palette + light semantic + non-colour vars; [data-color-mode="dark"] block; prefers-color-scheme fallback;
//                    increased contrast: prefers-contrast: more, and [data-contrast-mode="more" | "no-preference"]
//   theme.css        @theme inline: maps space / radius / shadow / weight / easing / breakpoint / container tokens onto Tailwind namespaces
//   reset.css        @theme inline: removes Tailwind's default namespaces (a consumer opts in when fully migrated)
//   utilities.css    one @utility per token, on its own property only (bg-*, text-*, icon-*, border-*, font-*, h-*, ...)
//   tokens.ts        the name union, token(), tokenValue(), the utility allowlist
//   merge-config.ts  tailwind-merge class groups for the generated utilities, and the radius and spacing scales
//   docs.json        name, description, light/dark values (reference and resolved), utility, metadata — for the Storybook sheets
//   tokens.figma.json the merged DTCG source, for Figma / Tokens Studio
//   classes.ts       token name → generated class, for primitive props (backgroundColor, color, size)
//   space.ts         space token → spacing class per property, for Box / Stack / Inline / Bleed props
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import StyleDictionary from "style-dictionary";
import { resolveReferences } from "style-dictionary/utils";
import { exportDtcg } from "./dtcg.mjs";

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
    // The negative ramp is a theme key too, so Bleed reads the token (m-negative-200) instead of
    // negating the positive one; the caller still names the positive token.
    if (b === "negative")
      return {
        kind: "theme",
        ns: "spacing",
        key: `negative-${rest(p, 2)}`,
        cls: `m-negative-${rest(p, 2)} · mx-negative-${rest(p, 2)} · my-negative-${rest(p, 2)}`,
      };
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
    // A breakpoint is a Tailwind theme key (`md:`, `panel:` variants; `theme(--breakpoint-panel)` in a
    // media query) written as its literal value, since a media query cannot read a custom property.
    if (b === "breakpoint")
      return { kind: "theme", ns: "breakpoint", key: rest(p, 2), cls: null, literal: true };
    // A container size is the same for a container query: a theme key (`@md:`, `@max-split:`;
    // `theme(--container-split)` in an @container query), written as its literal value.
    if (b === "container")
      return { kind: "theme", ns: "container", key: rest(p, 2), cls: null, literal: true };
    // A part's own size (a popover's width, a menu's narrowest) is read by that part through
    // token() in its style, so it has no class: a caller sizes a part through its props.
    if (b === "part") return null;
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

/** Composite typography → the `font` shorthand, with letter-spacing and the weight carried separately. The weight is repeated as a longhand under the shorthand, read through Tailwind's `--tw-font-weight`, so `font-medium` and `font-semibold` beside a type utility win whatever order the two land in the stylesheet. */
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
  return { shorthand, spacing, weight };
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
const bySourcePath = new Map(all.map((token) => [token.path.join("."), token]));

const lightVars = [];
const darkVars = [];
// Increased contrast. A token with `$extensions.ledger.contrast` ({ light, dark }) carries four
// values. Every scope that sets a mode (:root, [data-color-mode], the prefers-color-scheme block)
// writes the mode's two as `<var>--standard` and `<var>--more`, and every scope that sets the
// contrast ([data-contrast-mode], the prefers-contrast root) flips two flags. The token itself is
// the same expression everywhere, re-declared in both kinds of scope, so the nearest mode and the
// nearest contrast decide it at any nesting. A flag is "on" when it is a space and "off" when it is
// `initial` (guaranteed-invalid, so var() takes its fallback): a space toggle, as custom properties
// resolve where they are declared.
const contrastVars = []; // re-declared in every contrast scope
const contrastNames = new Set(); // public names of tokens with a contrast value, or derived from one
const flag = { more: "--ds-contrast-more", standard: "--ds-contrast-standard" };
const flagsStandard = [
  [flag.more, "initial"],
  [flag.standard, " "],
];
const flagsMore = [
  [flag.more, " "],
  [flag.standard, "initial"],
];
const contrastExpr = (v) =>
  `var(${flag.more}, var(${v}--standard)) var(${flag.standard}, var(${v}--more))`;
const publicRef = (v) =>
  refPath(v)
    .split(".")
    .filter((seg) => seg !== "default")
    .join(".");
const themeLines = [];
const utilityBlocks = [];
const docs = [];
const names = {}; // dotName -> cssVar
const literals = {}; // dotName -> the light value as a literal, for a document without the stylesheet
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
  "min-h": [],
  w: [],
  "min-w": [],
  "max-w": [],
  size: [],
  opacity: [],
  duration: [],
  ease: [],
};
const allClasses = [];
const classByToken = {};
const spaceKeys = [];
// The positive tokens that have a negative in the source: the scale a Bleed may escape by.
const negativeKeys = [];

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
    const { shorthand, spacing, weight } = typographyCss(token);
    lightCss = shorthand;
    extraLight.push([`${v}-letter-spacing`, spacing], [`${v}-weight`, weight]);
  } else {
    lightCss = cssValue(token.original.$value, token.$value, type);
  }
  literals[name] = type === "typography" ? lightCss : literal(token.$value, type);
  const contrast = token.original?.$extensions?.ledger?.contrast ?? null;
  if (contrast === null) {
    lightVars.push([v, lightCss], ...extraLight);
    if (darkOriginal !== null) darkVars.push([v, cssValue(darkOriginal, darkResolved, type)]);
  } else {
    if (type === "typography") throw new Error(`${name}: a typography token has no contrast value`);
    const darkCss = darkOriginal !== null ? cssValue(darkOriginal, darkResolved, type) : lightCss;
    // Each of the four values must name a mode-independent token (a palette step) or a literal:
    // a `--more` written in a mode scope resolves there, before any nested contrast scope.
    for (const original of [token.original.$value, darkOriginal, contrast.light, contrast.dark]) {
      if (!isRef(original)) continue;
      const target = bySourcePath.get(refPath(original));
      const targetExt = target?.original?.$extensions?.ledger ?? {};
      if (!target || targetExt.dark !== undefined || targetExt.contrast !== undefined)
        throw new Error(
          `${name}: a contrast token's values must reference palette steps, not ${original}`,
        );
    }
    const lightMore = contrast.light
      ? cssValue(contrast.light, resolveDark(contrast.light), type)
      : lightCss;
    const darkMore = contrast.dark
      ? cssValue(contrast.dark, resolveDark(contrast.dark), type)
      : darkCss;
    lightVars.push([`${v}--standard`, lightCss], [`${v}--more`, lightMore], [v, contrastExpr(v)]);
    darkVars.push([`${v}--standard`, darkCss], [`${v}--more`, darkMore], [v, contrastExpr(v)]);
    contrastVars.push([v, contrastExpr(v)]);
    contrastNames.add(name);
  }

  const u = utilityFor(token);
  if (u) {
    if (u.kind === "theme" && u.ns === "spacing")
      (u.key.startsWith("negative-") ? negativeKeys : spaceKeys).push([
        u.key.startsWith("negative-") ? name.replace(".negative", "") : name,
        u.key,
      ]);
    else if (u.cls) classByToken[name] = u.cls;
    allClasses.push(
      ...(u.kind === "theme" && u.ns === "spacing"
        ? u.key.startsWith("negative-")
          ? u.cls.split(" · ") // Bleed's classes are literal in the allowlist; the positive ramp is a regex
          : []
        : u.cls
          ? [u.cls]
          : []),
    );
    if (u.kind === "theme") {
      themeLines.push(`  --${u.ns}-${u.key}: ${u.literal ? lightCss : `var(${v})`};`);
      if (u.ns === "shadow") groups.shadow.push(u.key);
      if (u.ns === "radius") groups.rounded.push(u.key);
      if (u.ns === "font-weight") groups["font-weight"].push(u.key);
      if (u.ns === "ease") groups.ease.push(u.key);
    } else if (u.kind === "typography") {
      utilityBlocks.push(
        `@utility ${u.cls} {\n  font: var(${v});\n  font-weight: var(--tw-font-weight, var(${v}-weight));\n  letter-spacing: var(${v}-letter-spacing);\n}`,
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
      groups["min-w"].push(minW.slice(6));
      groups.h.push(u.cls.slice(2));
      groups.size.push(u.sizeCls.slice(5));
    } else {
      utilityBlocks.push(`@utility ${u.cls} {\n  ${u.prop}: var(${v});\n}`);
      // The group is the class's prefix: a two-word one (border-w, max-w, min-w) before the first word.
      const key =
        ["border-w", "max-w", "min-w"].find((p) => u.cls.startsWith(`${p}-`)) ??
        u.cls.split("-")[0];
      if (groups[key]) groups[key].push(u.cls.slice(key.length + 1));
    }
  }

  // Content-rich rows retain a token minimum while growing for descriptions and avatars; the
  // shell's bars the same (a panel header level with the top nav that grows when its title wraps).
  if (
    u &&
    (/^dimension\.(control|row)(\.|$)/.test(name) ||
      (u.prop === "height" && /^dimension\.layout\./.test(name)))
  ) {
    const suffix = u.cls.slice(2);
    const cls = `min-h-${suffix}`;
    utilityBlocks.push(`@utility ${cls} {\n  min-height: var(${v});\n}`);
    allClasses.push(cls);
    groups["min-h"].push(suffix);
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
    // Increased contrast, each mode: the reference and the literal, or null when the token has none.
    contrast: contrast
      ? {
          light: prettyRef(contrast.light ?? token.original.$value),
          dark: prettyRef(contrast.dark ?? darkOriginal ?? token.original.$value),
          lightResolved: literal(resolveDark(contrast.light ?? token.original.$value), type),
          darkResolved: literal(
            resolveDark(contrast.dark ?? darkOriginal ?? token.original.$value),
            type,
          ),
        }
      : null,
    introduced: ext.introduced ?? null,
    deprecated: ext.deprecated ?? null,
    utility: u ? u.cls : null,
  });
}

// A token that names a contrast token (`{color.border.input}`) resolves where it is declared, so
// it is re-declared in every contrast scope too, and in the dark scopes when it has no dark value
// of its own. It must name the same token in both modes; otherwise it needs a contrast value.
for (let grew = true; grew;) {
  grew = false;
  for (const token of all) {
    const name = dotName(token);
    if (contrastNames.has(name) || token.$type === "typography") continue;
    const light = token.original.$value;
    const dark = token.original?.$extensions?.ledger?.dark ?? null;
    const refs = [light, dark].filter((o) => o !== null && isRef(o));
    if (!refs.some((o) => contrastNames.has(publicRef(o)))) continue;
    if (dark !== null && dark !== light)
      throw new Error(
        `${name} references a contrast token with a different value per mode; give it a contrast value`,
      );
    const v = cssVar(token);
    const css = `var(${cssVarFromPath(refPath(light))})`;
    contrastVars.push([v, css]);
    if (dark === null) darkVars.push([v, css]);
    contrastNames.add(name);
    grew = true;
  }
}

/* ---------- emit ---------- */

const header = (what) =>
  `/* Generated by build/tokens.mjs — ${what}. Do not edit; edit tokens/*.json and rebuild. */\n`;
const block = (sel, vars) =>
  `${sel} {\n${vars.map(([k, val]) => `  ${k}: ${val};`).join("\n")}\n}\n`;

fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(
  path.join(outDir, "tokens.css"),
  header("custom properties, both modes, standard and increased contrast") +
    block(":root", [...flagsStandard, ...lightVars]) +
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
    "}\n" +
    // Increased contrast: the reader's setting, unless the page pins standard contrast; then a pin
    // either way on any element, which re-declares every contrast token for its subtree.
    "\n/* Increased contrast. prefers-contrast: more turns it on for the document unless the root pins\n" +
    '   data-contrast-mode="no-preference"; data-contrast-mode="more" or "no-preference" pins it on\n' +
    "   any element. The flags are internal: read the tokens, never the flags. */\n" +
    "@media (prefers-contrast: more) {\n" +
    block('  :root:not([data-contrast-mode="no-preference"])', flagsMore).replace(
      /^ {2}(?=\s*--)/gm,
      "    ",
    ) +
    "}\n\n" +
    block('[data-contrast-mode="more"]', [...flagsMore, ...contrastVars]) +
    "\n" +
    block('[data-contrast-mode="no-preference"]', [...flagsStandard, ...contrastVars]),
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
   After it, bg-blue-500, text-sm, font-medium (Tailwind's), rounded-md and p-4 no longer exist.
   The breakpoints (md:, panel:, xl:) and the container sizes (@md, @3xl) come back from
   theme.css, where each is a token; Tailwind's 2xl: breakpoint does not. */
@theme inline {
  --breakpoint-*: initial;
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
  --container-*: initial;
}
`,
);

const composed = [
  `/* Composed from border.width.focused, color.border.focused and space.025: the offset focus indicator. */
@utility outline-focused {
  outline: var(--ds-border-width-focused) solid var(--ds-color-border-focused);
  outline-offset: var(--ds-space-025);
}`,
  `/* The danger-state counterpart to outline-focused, using the same token geometry. */
@utility outline-danger {
  outline: var(--ds-border-width-focused) solid var(--ds-color-border-danger);
  outline-offset: var(--ds-space-025);
}`,
  `/* Fields overlay their border with one 2px edge without moving their content. */
@utility outline-field-focused {
  outline: var(--ds-border-width-focused) solid var(--ds-color-border-focused);
  outline-offset: calc(-1 * var(--ds-border-width-focused));
}
@utility outline-field-danger {
  outline: var(--ds-border-width-focused) solid var(--ds-color-border-danger);
  outline-offset: calc(-1 * var(--ds-border-width-focused));
}`,
];
allClasses.push(
  "outline-focused",
  "outline-danger",
  "outline-field-focused",
  "outline-field-danger",
);
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

/** Each token's light value as written in the tokens: what tokenValue() returns without a document or before the stylesheet loads. */
export const tokenLiterals = ${JSON.stringify(literals, null, 2)} as const satisfies Record<TokenName, string>;

/** The computed value of a token in the current mode, for canvas, SVG and media queries. Without a document, or while the stylesheet is not loaded, the token's light value. */
export function tokenValue(name: TokenName, el?: Element): string {
  if (typeof document === "undefined") return tokenLiterals[name];
  const computed = getComputedStyle(el ?? document.documentElement)
    .getPropertyValue(tokens[name])
    .trim();
  return computed || tokenLiterals[name];
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
// The theme scales reach every class group that reads them, the side radii (rounded-t-medium) and
// the spacing keys on padding, gap, inset and sizing (p-200, w-400) included.
const themeScales = {
  radius: [...new Set(groups.rounded)],
  spacing: [...new Set([...spaceKeys, ...negativeKeys].map(([, key]) => key))],
};
fs.writeFileSync(
  path.join(outDir, "merge-config.ts"),
  tsHeader +
    `/** Pass to tailwind-merge's extendTailwindMerge so generated utilities merge as their real property groups, and a consumer's className (w-full, min-w-0, rounded-t-none) wins over the kit's token class. */
export const mergeConfig = {
  extend: {
    theme: {
${Object.entries(themeScales)
  .map(([scale, keys]) => `      "${scale}": ${JSON.stringify(keys)},`)
  .join("\n")}
    },
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
const bleedProps = { m: "m", mx: "mx", my: "my" };
spaceKeys.sort((a, b) => Number(a[1]) - Number(b[1]));
const mapFor = (prefix) =>
  Object.fromEntries(spaceKeys.map(([name, key]) => [name, `${prefix}-${key}`]));
negativeKeys.sort((a, b) => Number(a[1].replace(/\D/g, "")) - Number(b[1].replace(/\D/g, "")));
const bleedFor = (prefix) =>
  Object.fromEntries(negativeKeys.map(([name, key]) => [name, `${prefix}-${key}`]));
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

/** The tokens a Bleed may escape by: those with a negative in the source, space.negative.*. */
export const bleedTokens = ${JSON.stringify(negativeKeys.map(([n]) => n))} as const;

export type BleedToken = (typeof bleedTokens)[number];

/** Bleed's classes, keyed by the positive token the caller names; each reads the negative token (m-negative-200 is margin: var(--spacing-negative-200)). */
export const bleedClasses = {
${Object.entries(bleedProps)
  .map(([k, prefix]) => `  ${k}: ${JSON.stringify(bleedFor(prefix))},`)
  .join("\n")}
} as const;
`,
);

// Legacy CSS-oriented source export retained for existing consumers.
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
for (const mode of ["light", "dark", "light-contrast", "dark-contrast"])
  fs.writeFileSync(
    path.join(outDir, `tokens.dtcg.${mode}.json`),
    JSON.stringify(exportDtcg(merged, mode), null, 2) + "\n",
  );

console.log(
  `tokens: ${all.length} · dark values: ${darkVars.length} · utilities: ${allClasses.length} · theme keys: ${themeLines.length}`,
);
