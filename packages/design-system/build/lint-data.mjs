// Ledger's lint data: what Tailwind says about the kit's own CSS, asked once when the tokens are
// built, so the ESLint plugin never loads Tailwind. `npm run build:tokens` runs it after
// tokens.mjs, whose output it reads. Run alone: node build/lint-data.mjs
//
// Outputs (src/generated, shipped with the package and copied to dist/generated)
//   lint.json         what a linted file may need, read on the first file (eslint-plugin/data.js):
//                     the Tailwind version the data reflects, the hash of each input it was built
//                     from (utilities.json, docs.json, the kit's stylesheets and the vocabulary
//                     aliases) and of them all, the name of every @utility, the utilities that
//                     take a leading minus, the variant grammar, the ARIA attribute names
//                     (aria-query's, and the ARIA 1.3 names it lacks), shadcn's theme names and
//                     the class categories (build/class-categories.mjs): the grammar the kit's cn()
//                     merges by, tailwind-merge's default config with the kit's merge config, each
//                     of its groups' category and each @utility's, from the CSS it sets
//   lint-values.json  what only a finding's advice needs, read when a rule first asks for it: each
//                     @utility's file, line and properties; each token's value by kind (px, ms, type
//                     metrics, OKLab per mode with alpha composited over the mode's surface), its
//                     family, role and a short label; each token class's token; where a token's
//                     variable written in a class (bg-(--ds-elevation-surface)) declares what a
//                     token class does (varToClass); the utilities that take a space but no minus,
//                     with their properties (unsigned); the specialised colour classes; shadcn's
//                     theme names with the Ledger classes for their jobs (aliases, checked from
//                     build/vocabulary-aliases.json); and Tailwind's stock scales (spacing, text,
//                     radius, weight, shadow, the palette in OKLab)
//
// Nothing here is policy: which classes Ledger admits stays in eslint-plugin/classes.js.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseColour } from "../eslint-plugin/colours.js";
import { inputHashes, inputsHash } from "../eslint-plugin/data.js";
import { classCategories } from "./class-categories.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "src/generated");
const require = createRequire(path.join(root, "package.json"));
const { __unstable__loadDesignSystem } = require("@tailwindcss/node");
// The Tailwind that generates the CSS: @tailwindcss/node's own, which is the version the data
// reflects.
const tailwind = createRequire(require.resolve("@tailwindcss/node"))(
  "tailwindcss/package.json",
).version;
const { aria } = require("aria-query");
/** tailwind-merge, which the kit's cn() merges classes with, and its version: the class categories
    reflect its grammar. Its package.json is not in its exports, so it is read beside its entry. */
const tailwindMerge = require("tailwind-merge");
const tailwindMergeVersion = JSON.parse(
  fs.readFileSync(
    path.join(path.dirname(require.resolve("tailwind-merge")), "../package.json"),
    "utf8",
  ),
).version;
/** WAI-ARIA 1.3 attributes aria-query 5.3 does not list yet, which Tailwind's aria- variants take
    as any other name. Drop one when aria-query lists it (test/lint-data.test.mjs says when). */
export const ARIA_1_3 = ["actions", "colindextext", "rowindextext"];

const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const readJson = (file) => JSON.parse(read(file));

/* ---------- Tailwind, loaded once on the kit's own entry ---------- */

/** Tailwind's design system for the kit, loaded by writeLintData. */
let design;
/** The CSS Tailwind generates for one candidate, or null when it generates none. */
const cssOf = (candidate) => design.candidatesToCss([candidate])[0] ?? null;
const generates = (candidate) => cssOf(candidate) !== null;

/** A length as pixels, at 16px to the rem (a bare 0 is a length too); undefined for anything
    else. */
function px(value) {
  if (/^-?0$/.test(String(value).trim())) return 0;
  const match = /^(-?\d*\.?\d+)(px|rem)$/.exec(String(value).trim());
  if (!match) return undefined;
  const number = Number(match[1]) * (match[2] === "rem" ? 16 : 1);
  return Math.round(number * 100) / 100;
}
const byLength = (entries) =>
  entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, z) => (px(a.entry[1]) ?? 0) - (px(z.entry[1]) ?? 0) || a.index - z.index)
    .map(({ entry }) => entry);

/* ---------- the variant grammar, each flag probed once ---------- */

function variantGrammar() {
  const all = design.getVariants();
  const theme = (namespace, names) =>
    byLength(names.map((name) => [name, design.resolveThemeValue(`--${namespace}-${name}`)]));
  const byName = new Map(all.map((variant) => [variant.name, variant]));
  const breakpoints = Object.fromEntries(theme("breakpoint", byName.get("min")?.values ?? []));
  const containers = Object.fromEntries(theme("container", byName.get("@")?.values ?? []));
  const lengthOrder = (root, values) => {
    const order = ["min", "max"].includes(root)
      ? Object.keys(breakpoints)
      : ["@", "@min", "@max"].includes(root)
        ? Object.keys(containers)
        : null;
    return order && values.every((value) => order.includes(value)) ? order : values;
  };
  const functional = {};
  for (const variant of all.filter(({ isArbitrary, values }) => isArbitrary || values.length)) {
    const join = variant.hasDash ? "-" : "";
    const at = (value) => `${variant.name}${join}${value}`;
    // A compound wraps another variant (not-hover, group-focus): its values are variants.
    const compound = variant.values.includes("hover") && generates(`${at("hover")}:flex`);
    const values = compound ? [] : lengthOrder(variant.name, variant.values);
    functional[variant.name] = {
      join,
      values,
      ...(compound ? { compound: variant.values } : {}),
      arbitrary: ["[.x]", "[400px]", "[x=y]", "[display:grid]", "[2n]"].some((value) =>
        generates(`${at(value)}:flex`),
      ),
      anyName: !compound && generates(`${at("zzqx")}:flex`),
      integer: !compound && generates(`${at("7")}:flex`),
      // Tailwind's variable shorthand as the value (nth-(--n)), which it writes into a selector or
      // a feature query, where var() is never read.
      variable: !compound && generates(`${at("(--x)")}:flex`),
      modifier: generates(`${at(compound ? "hover" : (values[0] ?? "zzqx"))}/zzqx:flex`),
    };
  }
  const statics = all
    .filter(({ isArbitrary, values }) => !isArbitrary && !values.length)
    .map((v) => v.name);
  // A static variant that is an at-rule around a selector (hover is `@media (hover: hover)` around
  // `&:hover`): the compound that negates it makes two rules of it, which nothing wraps again, so
  // not-hover generates CSS and not-not-hover does not (no-unknown-variant, variants.js).
  const split = statics.filter((name) =>
    Object.entries(functional).some(
      ([root, { compound }]) =>
        compound?.includes(root) &&
        compound.includes(name) &&
        generates(`${root}-${name}:flex`) &&
        !generates(`${root}-${root}-${name}:flex`),
    ),
  );
  return { static: statics, functional, breakpoints, containers, split };
}

/* ---------- every @utility, where it is declared and what it sets ---------- */

/** The properties a candidate's CSS declares, in order, without Tailwind's own `--tw-*`. */
function propertiesOf(css) {
  const found = [];
  for (const line of css.split("\n")) {
    const match = /^\s*(--[\w-]+|[a-z][a-z-]*)\s*:.*;\s*$/.exec(line);
    if (match && !match[1].startsWith("--tw-") && !found.includes(match[1])) found.push(match[1]);
  }
  return found;
}

/** The properties Tailwind's own `--tw-*` custom properties in a candidate's CSS feed, by name
    (`--tw-mask-radial-shape` feeds `mask-radial-shape`), for a class that sets nothing else
    (`mask-circle`). */
function tailwindPropertiesOf(css) {
  const found = [];
  for (const [, name] of css.matchAll(/^\s*--tw-([\w-]+)\s*:.*;\s*$/gm))
    if (!found.includes(name)) found.push(name);
  return found;
}

function declaredUtilities() {
  const files = [
    ...fs
      .readdirSync(path.join(root, "src/styles"))
      .filter((file) => file.endsWith(".css"))
      .sort()
      .map((file) => `src/styles/${file}`),
    "src/generated/utilities.css",
  ];
  const utilities = {};
  for (const file of files)
    read(file)
      .split("\n")
      .forEach((text, index) => {
        const match = /^\s*@utility\s+(\S+)\s*\{/.exec(text);
        if (!match) return;
        const name = match[1];
        const css = cssOf(name);
        if (!/^[a-z][\w-]*$/.test(name) || css === null)
          throw new Error(
            `${file}:${index + 1} declares @utility ${name}, which Tailwind ${tailwind} does not generate as a class; the lint data cannot describe it.`,
          );
        if (utilities[name])
          throw new Error(
            `@utility ${name} is declared twice: ${utilities[name].file} and ${file}`,
          );
        utilities[name] = { file, line: index + 1, properties: propertiesOf(css) };
      });
  return Object.fromEntries(Object.entries(utilities).sort(([a], [z]) => (a < z ? -1 : 1)));
}

/** The utilities a leading minus negates: every functional root where `-<root>-200` generates. */
const negatableRoots = () =>
  [...design.utilities.keys("functional")].filter((root) => generates(`-${root}-200`)).sort();

/** The properties of a CSS rule, without those of an @property rule Tailwind adds beside it. */
const AT_PROPERTY = new Set(["syntax", "inherits", "initial-value"]);

/** The utilities that take a space but no leading minus, each with the properties it sets, as a
    finding names them ("padding", "width and height"): every functional root where `<root>-200`
    generates and `-<root>-200` does not. */
const unsignedRoots = () =>
  Object.fromEntries(
    [...design.utilities.keys("functional")]
      .filter(
        (root) => !root.startsWith("-") && generates(`${root}-200`) && !generates(`-${root}-200`),
      )
      .sort()
      .map((root) => [
        root,
        propertiesOf(cssOf(`${root}-200`))
          .filter((property) => !AT_PROPERTY.has(property))
          .join(", ")
          .replace(/, ([^,]+)$/, " and $1"),
      ])
      .filter(([, properties]) => properties),
  );

/* ---------- colours: OKLab, with alpha composited over the mode's surface ---------- */

const gammaEncode = (c) =>
  Math.sign(c) *
  (Math.abs(c) <= 0.0031308 ? 12.92 * Math.abs(c) : 1.055 * Math.abs(c) ** (1 / 2.4) - 0.055);
const gammaDecode = (c) =>
  Math.sign(c) *
  (Math.abs(c) <= 0.04045 ? Math.abs(c) / 12.92 : ((Math.abs(c) + 0.055) / 1.055) ** 2.4);

/** OKLab to gamma-encoded sRGB, unclamped. */
function toSrgb([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map(gammaEncode);
}

/** Gamma-encoded sRGB to OKLab. */
function fromSrgb(rgb) {
  const [r, g, b] = rgb.map(gammaDecode);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

const round = (number, places = 4) => Math.round(number * 10 ** places) / 10 ** places || 0;

/** A colour's alpha, 1 when it has none: `oklch(0.22 0.024 258 / 0.06)` is 0.06. */
function alphaOf(value) {
  if (String(value).trim() === "transparent") return 0;
  const match = /\/\s*(\d*\.?\d+)(%?)\s*\)\s*$/.exec(String(value));
  return match ? Number(match[1]) / (match[2] ? 100 : 1) : 1;
}

/** A colour as the reader sees it on `surface` (OKLab), rounded; null when it is no colour. */
function seen(value, surface) {
  const alpha = alphaOf(value);
  const own = String(value).trim() === "transparent" ? [0, 0, 0] : parseColour(value);
  if (!own) return null;
  if (alpha >= 1) return own.map((channel) => round(channel));
  const [fg, bg] = [toSrgb(own), toSrgb(surface)];
  return fromSrgb(fg.map((channel, i) => alpha * channel + (1 - alpha) * bg[i])).map((channel) =>
    round(channel),
  );
}

/* ---------- the tokens ---------- */

const PALETTES = ["neutral", "darkNeutral", "blue", "green", "orange", "red", "teal", "purple"];
/** Each token family, longest first, with the role its values play. */
const FAMILIES = [
  ...PALETTES.map((palette) => [`color.${palette}`, "palette"]),
  ["color.background", "background"],
  ["color.text", "text"],
  ["color.icon", "icon"],
  ["color.border", "border"],
  ["color.chart", "chart"],
  ["color.blanket", "background"],
  ["color.skeleton", "background"],
  ["utility.elevation.surface", "surface"],
  ["elevation.surface", "surface"],
  ["elevation.shadow", "shadow"],
  ["space.negative", "space"],
  ["space", "space"],
  ["radius", "radius"],
  ["border.width", "border-width"],
  ["font.weight", "weight"],
  ["font.family", "family"],
  ["font.letterSpacing", "letter-spacing"],
  ["font", "type"],
  ["opacity", "opacity"],
  ["motion.duration", "duration"],
  ["motion.easing", "easing"],
  ["motion", "duration"],
  ["dimension.breakpoint", "breakpoint"],
  ["dimension.container", "container"],
  ["dimension.query", "query"],
  ["dimension.layout", "layout"],
  ["dimension.part", "part"],
  ["dimension.control", "control"],
  ["dimension.row", "row"],
  ["dimension.icon", "icon-size"],
  ["layer", "layer"],
].sort(([a], [z]) => z.length - a.length);

const familyOf = (name) => {
  const found = FAMILIES.find(([family]) => name === family || name.startsWith(`${family}.`));
  if (!found) throw new Error(`Token ${name} is in no family the lint data knows; add it here.`);
  return found;
};

/** A description's first sentence, at most 48 characters, cut at a word with an ellipsis. */
function shortLabel(description) {
  const text = description.trim().replace(/^Draft\.\s*/, "");
  const first = (/^.*?[.!?](?=\s|$)/.exec(text)?.[0] ?? text)
    .replace(/^Use (?:for|as) (?:the )?/i, "")
    .replace(/[.!?]$/, "");
  const label = first.charAt(0).toUpperCase() + first.slice(1);
  if (label.length <= 48) return label;
  const cut = label.slice(0, 47);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:]$/, "")}…`;
}

/** The widest blur in a shadow, in px: `0 1px 2px …, 0 7px 32px …` is 32. */
function widestBlur(shadow) {
  let widest = 0;
  for (const layer of shadow.split(/,(?![^(]*\))/)) {
    const lengths = layer
      .replace(/\([^)]*\)/g, "")
      .trim()
      .split(/\s+/)
      .map(px);
    const blur = lengths.filter((length) => length !== undefined)[2];
    if (blur !== undefined) widest = Math.max(widest, blur);
  }
  return widest;
}

function tokenValues(docs) {
  const byVar = new Map(docs.map((token) => [token.cssVar, token]));
  const surface = docs.find((token) => token.name === "elevation.surface");
  const surfaces = {
    light: parseColour(surface.lightResolved),
    dark: parseColour(surface.darkResolved ?? surface.lightResolved),
  };
  const weightOf = (value) => {
    const variable = /var\((--[\w-]+)\)/.exec(value)?.[1];
    return Number(variable ? byVar.get(variable)?.lightResolved : value);
  };
  const tokens = {};
  for (const token of docs) {
    const [family, role] = familyOf(token.name);
    const light = token.lightResolved;
    const dark = token.darkResolved ?? light;
    const entry = {};
    switch (token.type) {
      case "color": {
        entry.kind = "colour";
        entry.oklab = { light: seen(light, surfaces.light), dark: seen(dark, surfaces.dark) };
        const alpha = { light: alphaOf(light), dark: alphaOf(dark) };
        if (alpha.light < 1 || alpha.dark < 1) entry.alpha = alpha;
        break;
      }
      case "dimension":
        entry.kind = "length";
        if (/em$/.test(light) && !/rem$/.test(light)) entry.em = Number.parseFloat(light);
        // A part's size in ch or vw has no px value: it is kept as written.
        else if (/^-?[\d.]+(ch|vw)$/.test(light)) entry.css = light;
        else entry.px = px(light);
        break;
      case "duration":
        entry.kind = "duration";
        entry.ms = Number.parseFloat(light) * (/ms$/.test(light) ? 1 : 1000);
        break;
      case "typography": {
        entry.kind = "type";
        const metrics = /(\d*\.?\d+(?:px|rem))\/(\d*\.?\d+(?:px|rem))/.exec(light);
        entry.size = px(metrics?.[1]);
        entry.lineHeight = px(metrics?.[2]);
        entry.weight = weightOf(light.split(/\s+/)[0]);
        break;
      }
      case "fontWeight":
        entry.kind = "weight";
        entry.weight = Number(light);
        break;
      case "fontFamily":
        entry.kind = "family";
        break;
      case "shadow":
        entry.kind = "shadow";
        entry.blur = widestBlur(light);
        break;
      case "number":
        entry.kind = "number";
        entry.value = Number(light);
        break;
      case "cubicBezier":
        entry.kind = "easing";
        entry.value = light;
        break;
      default:
        throw new Error(
          `Token ${token.name} has type ${token.type}, which the lint data does not read.`,
        );
    }
    // The one class that reaches the token, when there is one.
    if (token.utility && !token.utility.includes(" ")) entry.class = token.utility;
    Object.assign(entry, { family, role, short: shortLabel(token.description ?? "") });
    if (token.deprecated) entry.deprecated = true;
    tokens[token.name] = entry;
  }
  return tokens;
}

/** Each token class's token, from the variable its CSS reads: `bg-surface` is elevation.surface. */
function classTokens(classes, docs) {
  const byVar = new Map(docs.map((token) => [token.cssVar, token.name]));
  const out = {};
  for (const cls of classes) {
    const css = cssOf(cls);
    if (css === null) continue;
    const names = new Set(
      [...css.matchAll(/var\((--ds-[\w-]+)/g)].map(([, v]) => byVar.get(v)).filter(Boolean),
    );
    // A composed utility (outline-focused) reads several tokens and stands for none.
    if (names.size === 1) out[cls] = [...names][0];
  }
  return out;
}

/* ---------- a token's variable written as a class: the token class that declares the same ---------- */

/** A class as it is written in a selector: every character but a word character or a dash
    escaped, as Tailwind writes it. */
const selectorOf = (cls) => `.${cls.replace(/[^\w-]/g, (ch) => `\\${ch}`)}`;

/** What each candidate declares, its own selector written as `.§`, so two spellings compare by
    their CSS alone; null for a candidate that generates none. */
function declared(candidates) {
  const css = design.candidatesToCss(candidates);
  return candidates.map((candidate, index) =>
    css[index] === null || css[index] === undefined
      ? null
      : css[index].split(selectorOf(candidate)).join(".§"),
  );
}

/** Whether every class declares exactly what each of its spellings does: `[class, spellings]`. */
function sameCss(pairs) {
  const css = declared(pairs.flatMap(([cls, spellings]) => [cls, ...spellings]));
  let at = 0;
  for (const [, spellings] of pairs) {
    const want = css[at];
    const got = css.slice(at + 1, at + 1 + spellings.length);
    at += 1 + spellings.length;
    if (want === null || got.some((css) => css !== want)) return false;
  }
  return true;
}

/** Each spelling of a token's variable after a prefix: the shorthand and the bracketed var(),
    typed with `hint` or not. */
const spellingsOf = (prefix, variable, hint) =>
  hint
    ? [`${prefix}-(${hint}:${variable})`, `${prefix}-[${hint}:var(${variable})]`]
    : [`${prefix}-(${variable})`, `${prefix}-[var(${variable})]`];

/** The type hint that names a token kind's values (`bg-(color:--ds-…)`, `h-(length:--ds-…)`). */
const HINTS = { colour: "color", length: "length" };

/**
 * Where a Ledger token's variable, written in a class (`bg-(--ds-elevation-surface)`,
 * `bg-[var(--ds-elevation-surface)]`), declares exactly what a token class does, so the lint can
 * write the token class instead. Each pair is checked here: Tailwind generates the same
 * declarations for both.
 * - classes: `<prefix>-(<variable>)` to its token class, for the classes that read one token;
 * - scales: a root that takes every key of the space or radius scale, where `<root>-(--ds-space-200)`
 *   is `<root>-200`;
 * - hints: the type hint each prefix also takes with the same CSS, where the kind of its values
 *   names one.
 */
function variableClasses(classes, tokens, docs, spaceKeys) {
  const variableOf = new Map(docs.map((token) => [token.name, token.cssVar]));
  const found = {};
  /** Each prefix's hint while every class it writes agrees; false once one does not. */
  const hints = {};
  const hintFor = (prefix, hint, pairs) => {
    if (hints[prefix] === false) return;
    if (!hint || (hints[prefix] && hints[prefix] !== hint) || !sameCss(pairs))
      hints[prefix] = false;
    else hints[prefix] = hint;
  };
  for (const [cls, name] of Object.entries(classes)) {
    const variable = variableOf.get(name);
    for (let at = cls.indexOf("-"); at > 0; at = cls.indexOf("-", at + 1)) {
      const prefix = cls.slice(0, at);
      if (!sameCss([[cls, spellingsOf(prefix, variable)]])) continue;
      found[`${prefix}-(${variable})`] = cls;
      const hint = HINTS[tokens[name].kind];
      hintFor(prefix, hint, hint ? [[cls, spellingsOf(prefix, variable, hint)]] : []);
      break;
    }
  }
  const roots = [...design.utilities.keys("functional")].filter((root) => !root.startsWith("-"));
  const scales = [
    { variable: "--ds-space-", keys: spaceKeys },
    {
      variable: "--ds-radius-",
      keys: Object.keys(tokens)
        .filter((name) => name.startsWith("radius."))
        .map((name) => name.slice("radius.".length)),
    },
  ].map(({ variable, keys }) => {
    const pairsOf = (root, hint) =>
      keys.map((key) => [`${root}-${key}`, spellingsOf(root, `${variable}${key}`, hint)]);
    // One key first, which most roots fail, then every key.
    const takes = roots
      .filter((root) => sameCss(pairsOf(root).slice(0, 1)) && sameCss(pairsOf(root)))
      .sort();
    for (const root of takes) hintFor(root, "length", pairsOf(root, "length"));
    return { variable, keys, roots: takes };
  });
  return {
    classes: found,
    scales,
    hints: Object.fromEntries(
      Object.entries(hints)
        .filter(([, hint]) => hint)
        .sort(([a], [z]) => (a < z ? -1 : 1)),
    ),
  };
}

/** Tokens with a narrow purpose, which a suggestion never offers for another. */
const SPECIALISED =
  /^bg-(blanket|skeleton(-[\w-]+)?|surface-current|input-thumb(-[\w-]+)?|input-track|chart-[\w-]+)$/;

/* ---------- the vocabulary agents reach for: shadcn's theme names ---------- */

/** Where the theme names and their Ledger classes are written, and what an entry may hold. */
export const VOCABULARY = "build/vocabulary-aliases.json";
const ALIAS_FIELDS = new Set(["means", "use", "for", "aside", "states", "suggest"]);
/** The state variants an alias may name its own class under (classes.js's aliasState). */
const ALIAS_STATES = new Set(["selected", "placeholder"]);
const words = (value) => typeof value === "string" && value.trim() !== "";

/**
 * shadcn's theme names (VOCABULARY's `aliases`), each with the Ledger classes for its job, as
 * lint-values.json's `aliases` (lint.json lists the names), once every entry is checked: the name
 * is one plain class that generates no CSS here, so it is no Ledger class, kit @utility or
 * structural spelling; it says what the name means; it names one class, or two with `for` saying
 * when each fits, each one utilities.json lists and neither deprecated nor for one purpose only
 * (SPECIALISED); an aside is a sentence; `states` names one such class for each state variant it
 * keys (`selected`, `placeholder`); and `suggest` is only ever false. An entry that fails
 * throws, naming the fix. Tailwind must be loaded (lintData does).
 */
export function vocabularyAliases(aliases, utilitiesJson) {
  const ledger = new Set(utilitiesJson.classes);
  const retired = new Set(Object.values(utilitiesJson.deprecated).map((entry) => entry.class));
  const names = Object.keys(aliases ?? {});
  if (!names.length) throw new Error(`${VOCABULARY} has no aliases.`);
  const css = design.candidatesToCss(names);
  const fail = (name, why) => {
    throw new Error(`${VOCABULARY}: "${name}" ${why}.`);
  };
  names.forEach((name, index) => {
    const entry = aliases[name];
    if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/.test(name))
      fail(name, "is not one plain class; write it with no variant, modifier, ! or minus");
    if (ledger.has(name) || (css[index] ?? null) !== null)
      fail(name, "is a Ledger class, which the lint admits, so it is no alias; drop it");
    const unread = Object.keys(entry).filter((field) => !ALIAS_FIELDS.has(field));
    if (unread.length) fail(name, `has fields no finding reads: ${unread.join(", ")}`);
    if (!words(entry.means)) fail(name, "says nothing in means");
    const { use } = entry;
    if (!Array.isArray(use) || use.length < 1 || use.length > 2)
      fail(name, "names one class or two in use");
    const states = entry.states ?? {};
    if (typeof states !== "object" || Array.isArray(states) || states === null)
      fail(name, "takes states as an object of a state and its class");
    for (const state of Object.keys(states))
      if (!ALIAS_STATES.has(state))
        fail(name, `names the state "${state}"; states takes ${[...ALIAS_STATES].join(" and ")}`);
    for (const cls of [...use, ...Object.values(states)]) {
      if (typeof cls !== "string" || !ledger.has(cls))
        fail(name, `names "${cls}", which utilities.json does not list`);
      if (retired.has(cls)) fail(name, `names "${cls}", which is deprecated`);
      if (SPECIALISED.test(cls)) fail(name, `names "${cls}", which has one purpose only`);
    }
    const labels = entry.for;
    if (use.length === 2 && !(Array.isArray(labels) && labels.length === 2 && labels.every(words)))
      fail(name, "names two classes, so for says when each fits");
    if (use.length === 1 && labels !== undefined) fail(name, "names one class, which needs no for");
    if (entry.aside !== undefined && !(words(entry.aside) && /[^.]\.$/.test(entry.aside)))
      fail(name, "has an aside that is not one sentence ending with a period");
    if (entry.suggest !== undefined && entry.suggest !== false)
      fail(name, "takes suggest only as false");
  });
  return aliases;
}

/* ---------- Tailwind's stock theme, which the reset removes ---------- */

function stockTheme() {
  const css = fs.readFileSync(require.resolve("tailwindcss/theme.css"), "utf8");
  const vars = new Map(
    [...css.matchAll(/--([\w.-]+):\s*([^;]+);/g)].map(([, name, value]) => [
      name,
      value.replace(/\s+/g, " ").trim(),
    ]),
  );
  const pick = (prefix, map = (value) => value) =>
    Object.fromEntries(
      [...vars]
        .filter(([name]) => name.startsWith(prefix) && !name.slice(prefix.length).includes("--"))
        .map(([name, value]) => [name.slice(prefix.length), map(value)]),
    );
  const ratio = (value) => {
    const match = /^calc\((\d*\.?\d+)\s*\/\s*(\d*\.?\d+)\)$/.exec(value);
    return match ? Number(match[1]) / Number(match[2]) : Number(value);
  };
  return {
    spacing: vars.get("spacing"),
    // A text size is the one with a line height beside it (not text-shadow-*).
    text: Object.fromEntries(
      Object.entries(pick("text-"))
        .filter(([key]) => vars.has(`text-${key}--line-height`))
        .map(([key, value]) => [
          key,
          {
            px: px(value),
            lineHeight: round(px(value) * ratio(vars.get(`text-${key}--line-height`)), 2),
          },
        ]),
    ),
    radius: pick("radius-", px),
    weight: pick("font-weight-", Number),
    shadow: pick("shadow-"),
    palette: pick("color-", (value) => parseColour(value)?.map((channel) => round(channel))),
  };
}

/* ---------- write ---------- */

/** JSON at two spaces, as Prettier would print it at 100 columns: a list of plain values (an
    OKLab triple, a utility's properties) on one line when it fits. */
function stringify(value, indent = "") {
  if (Array.isArray(value)) {
    const inline = `[${value.map((item) => JSON.stringify(item)).join(", ")}]`;
    if (
      value.every((item) => item === null || typeof item !== "object") &&
      indent.length + inline.length <= 90
    )
      return inline;
    const inner = `${indent}  `;
    return value.length
      ? `[\n${value.map((item) => `${inner}${stringify(item, inner)}`).join(",\n")}\n${indent}]`
      : "[]";
  }
  if (value && typeof value === "object") {
    const inner = `${indent}  `;
    const entries = Object.entries(value).filter(([, item]) => item !== undefined);
    return entries.length
      ? `{\n${entries.map(([key, item]) => `${inner}${JSON.stringify(key)}: ${stringify(item, inner)}`).join(",\n")}\n${indent}}`
      : "{}";
  }
  return JSON.stringify(value);
}

/**
 * The two files' contents, as text, from Tailwind and the token build's output: `lint.json` and
 * `lint-values.json`. Writes nothing; writeLintData writes them.
 */
export async function lintData() {
  // The kit's Storybook entry is its fully migrated consumer: Tailwind, the reset, the tokens, the
  // kit's utilities and its base layer, in the order a product imports them.
  const entry = path.join(root, "src/styles/storybook.css");
  design = await __unstable__loadDesignSystem(fs.readFileSync(entry, "utf8"), {
    base: path.dirname(entry),
  });
  const utilitiesJson = readJson("src/generated/utilities.json");
  const docs = readJson("src/generated/docs.json");
  const about =
    "Generated by build/lint-data.mjs from Tailwind and the token build; do not edit. Run npm run build:tokens.";
  // What the data is built from, by hash, so the lint can tell when it is stale (data.js); both
  // files carry the build's hash first, where the lint reads it without parsing the values.
  const inputs = inputHashes(root);
  const common = { about, tailwind, inputsHash: inputsHash(inputs) };
  const utilities = declaredUtilities();
  const aliases = vocabularyAliases(readJson(VOCABULARY).aliases, utilitiesJson);
  // Every class Tailwind lists for the kit.
  const tailwindClasses = design.getClassList().map(([name]) => name);
  // The kit's merge config, as cn() extends tailwind-merge with it (src/lib/cn.ts).
  const { mergeConfig } = await import(
    pathToFileURL(path.join(root, "src/generated/merge-config.ts")).href
  );
  const facts = {
    ...common,
    inputs,
    // Every file may need the names (is a class a kit utility?); only advice needs the rest.
    utilities: Object.keys(utilities),
    negatable: negatableRoots(),
    variants: variantGrammar(),
    ariaNames: [...aria.keys().map((name) => name.replace(/^aria-/, "")), ...ARIA_1_3].sort(),
    // A class no rule admits may be one of shadcn's theme names; only its advice is a value.
    aliases: Object.keys(aliases).sort(),
    // What a class changes, which a rule asks of every class on a kit part.
    categories: classCategories({
      tailwindMerge,
      version: tailwindMergeVersion,
      mergeConfig,
      utilities,
      listed: {
        classes: tailwindClasses,
        propertiesOf: (cls) => {
          const css = cssOf(cls);
          if (!css) return null;
          const own = propertiesOf(css);
          return own.length ? own : tailwindPropertiesOf(css);
        },
      },
    }),
  };
  const classes = classTokens(utilitiesJson.classes, docs);
  const tokens = tokenValues(docs);
  const values = {
    ...common,
    utilityDetails: utilities,
    tokens,
    classes,
    varToClass: variableClasses(classes, tokens, docs, utilitiesJson.spaceKeys),
    unsigned: unsignedRoots(),
    specialised: utilitiesJson.classes.filter((cls) => SPECIALISED.test(cls)),
    aliases,
    stock: stockTheme(),
  };
  return {
    facts,
    values,
    files: { "lint.json": `${stringify(facts)}\n`, "lint-values.json": `${stringify(values)}\n` },
    // Every class Tailwind lists for the kit, for the tests that classify each one.
    tailwindClasses,
  };
}

/** Writes lint.json and lint-values.json to src/generated. */
export async function writeLintData() {
  const data = await lintData();
  for (const [file, text] of Object.entries(data.files))
    fs.writeFileSync(path.join(outDir, file), text);
  return data;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const started = performance.now();
  const { facts, values } = await writeLintData();
  const size = (file) => Math.round(fs.statSync(path.join(outDir, file)).size / 1024);
  console.log(
    `lint data: Tailwind ${tailwind} · ${facts.utilities.length} @utility · ${facts.variants.static.length} static and ${Object.keys(facts.variants.functional).length} functional variants · ${facts.negatable.length} negatable · ${Object.keys(values.tokens).length} tokens · lint.json ${size("lint.json")} KB, lint-values.json ${size("lint-values.json")} KB · ${Math.round(performance.now() - started)} ms`,
  );
}
