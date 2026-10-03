// The nearest Ledger token to a value written some other way: a stock Tailwind class, an arbitrary
// value, a numeric utility, a literal in style, or a misspelt token class. By value first, and only
// from the family the property's role names: space.* for padding, gap and inset; border.width.* for
// border and outline widths; radius.*; font.* for type; motion.duration.*, opacity.* and
// elevation.shadow.* for their utilities. Never a container or breakpoint threshold, a layout width
// or a part's own size: a width or a height is a layout part's, a preset's or computed, and the
// advice says so with no token name. By spelling second, when one token class is nearest.
//
// A colour (decision 8) gets the roles its hue plays in the property's family, at most two, each
// with its purpose; a single replacement only when a token of that role is within ΔE 0.02 of the
// colour in both modes. A class and its dark: sibling on the same site are one colour in two modes
// and are ranked together; a dark: colour alone is ranked by its dark value and never picked.
//
// Nothing here fixes: a single pick becomes an editor suggestion through fixes.js (with the
// closure check), never --fix. The values are lint-values.json's, read through data.js the first
// time a finding needs one, so a clean file reads nothing; while the data is stale nothing is
// named, since stale data is no guide to what the CSS generates today.
import { SPACING, isKnown, withVariants } from "./classes.js";
import { colourDistance, parseColour } from "./colours.js";
import { lintFacts, lintValues, staleness } from "./data.js";
import { editDistance } from "./variants.js";

/** The most characters a finding's words may run to before its note (report.js, 7). */
export const MESSAGE_LIMIT = 300;
/** Colours closer than this in OKLab are the same colour to a reader. */
export const SAME_COLOUR = 0.02;
/** How much further than the nearest grey a second grey may be and still be offered. */
const GREY_REACH = 0.1;
/** A radius from which an element's ends round as a pill's: rounded-full. */
const PILL = 32;

/* ---------- words ---------- */

/** A length as a finding writes it: `16px`, `1.5px`. */
const px = (value) => `${Number(value.toFixed(2))}px`;
/** A token's purpose for a message: its short label, without an unclosed parenthesis a cut left,
    and lower case unless its first word is an acronym or a name (`UI`, `Tailwind's`). */
function purpose(short) {
  let text = String(short ?? "").trim();
  const open = text.lastIndexOf("(");
  if (open >= 0 && text.indexOf(")", open) < 0) text = `${text.slice(0, open).trimEnd()}…`;
  text = text.replace(/[,;:]…$/, "…");
  return /^(?:[A-Z]{2,}|Tailwind|Ledger)\b/.test(text)
    ? text
    : text.charAt(0).toLowerCase() + text.slice(1);
}
/** `a`, `a or b`, as a list of options reads. */
const either = (items) => items.join(" or ");

/**
 * The first of `choices` whose words fit a message: `render(choice)` is the whole message without
 * its note, which must be at most MESSAGE_LIMIT characters. The last choice is taken when none
 * fits, so a caller ends the list with its shortest words.
 */
export function fitted(choices, render) {
  for (const choice of choices) if (render(choice).length <= MESSAGE_LIMIT) return choice;
  return choices.at(-1);
}

/* ---------- the scales, built once from lint-values.json ---------- */

/** The utilities whose value is a space: padding, gap and inset, and the offsets the kit gives the
    space scale too (translate, scroll padding and margin, text indent; classes.js's SPACING). */
const SPACE_UTILITIES =
  /^(?:p[xytblrse]?|gap(?:-[xy])?|space-[xy]|inset(?:-[xy])?|top|right|bottom|left|start|end|translate-[xy]|scroll-[mp][xytblrse]?|indent)$/;
/** The utilities whose value is a size: a width or a height, which no token names. */
const SIZE_UTILITIES = /^(?:w|h|size|min-w|min-h|max-w|max-h|basis)$/;
/** What a size utility sets, as its advice names it. */
const DIMENSION = { w: "width", "min-w": "width", "max-w": "width", basis: "width" };
const dimensionOf = (utility) => DIMENSION[utility] ?? (/h$/.test(utility) ? "height" : "size");

/** The prefixes a colour token class is written with, each over the token families it reaches. */
const COLOUR_PREFIXES = ["bg", "text", "icon", "border", "fill", "stroke"];

let scales;
/** Every scale the advice ranks within, built on the first finding that needs one; null while the
    lint data is stale. */
function scalesNow() {
  if (staleness()) return null;
  const values = lintValues();
  if (!values) return null;
  if (scales?.values === values) return scales;
  const live = Object.entries(values.tokens)
    .filter(([, token]) => !token.deprecated)
    .map(([name, token]) => ({ name, ...token }));
  const family = (name, predicate = () => true) =>
    live.filter((token) => token.family === name && predicate(token));
  const specialised = new Set(values.specialised);
  const colours = Object.fromEntries(COLOUR_PREFIXES.map((prefix) => [prefix, []]));
  for (const [cls, name] of Object.entries(values.classes)) {
    const token = values.tokens[name];
    const prefix = cls.slice(0, cls.indexOf("-"));
    if (!colours[prefix] || token?.kind !== "colour" || token.deprecated || specialised.has(cls))
      continue;
    const suffix = cls.slice(prefix.length + 1).replace(/^chart-/, "");
    colours[prefix].push({ cls, token: name, oklab: token.oklab, short: token.short, suffix });
  }
  // The hue each accent family is drawn in, light mode, which an arbitrary colour is sorted by.
  const anchors = Object.keys(HUES)
    .filter((hue) => hue !== "grey")
    .flatMap((hue) => {
      const lab = values.tokens[`color.background.accent.${hue}.bolder`]?.oklab.light;
      return lab ? [{ hue, angle: angleOf(lab) }] : [];
    });
  scales = {
    values,
    space: family("space", (token) => token.px >= 0)
      .map((token) => ({ key: token.name.slice("space.".length), px: token.px, token }))
      .map((step) => ({ ...step, key: step.key === "space" ? "0" : step.key }))
      .sort((a, z) => a.px - z.px),
    border: family("border.width", (token) => token.class).sort((a, z) => a.px - z.px),
    radius: family("radius", (token) => token.class && token.class !== "rounded-full").sort(
      (a, z) => a.px - z.px,
    ),
    // A pill's radius, outside the scale: rounded-full is 9999px, and any radius past PILL rounds
    // an element as fully as it.
    full: family("radius", (token) => token.class === "rounded-full")[0],
    // A type step the tokens say is replaced (its description opens "Replaced by", kept for one
    // version under a renamed Heading size) is never advised: its successor is.
    type: live
      .filter((token) => token.kind === "type" && token.family === "font")
      .filter((token) => token.class && token.name !== "font.code")
      .filter((token) => !/^Replaced by\b/.test(token.short ?? ""))
      .sort((a, z) => a.size - z.size || a.weight - z.weight),
    weight: family("font.weight", (token) => token.class).sort((a, z) => a.weight - z.weight),
    regular: values.tokens["font.weight.regular"]?.weight ?? 400,
    duration: family("motion.duration", (token) => token.class).sort((a, z) => a.ms - z.ms),
    opacity: family("opacity", (token) => token.class).sort((a, z) => z.value - a.value),
    // An edge shadow (overflow) marks scrolled content; a drop shadow is never nearest to it.
    shadow: family("elevation.shadow", (token) => token.class && token.class !== "shadow-overflow"),
    surface: values.tokens["elevation.surface"]?.oklab,
    colours,
    anchors,
    stock: values.stock,
  };
  return scales;
}

/* ---------- ranking by value ---------- */

/**
 * The steps of a scale nearest to `value`, as `{ exact, near }`: every step with exactly that
 * value, else the one or two nearest within max(`floor`, a quarter of the value), ties kept.
 * Nothing is near a value further than that from every step.
 */
function nearestSteps(value, steps, of, floor) {
  const exact = steps.filter((step) => of(step) === value);
  if (exact.length) return { exact, near: [] };
  const reach = Math.max(floor, Math.abs(value) * 0.25);
  const ranked = steps
    .map((step) => ({ step, delta: Math.abs(of(step) - value) }))
    .filter(({ delta }) => delta <= reach)
    .sort((a, z) => a.delta - z.delta || of(a.step) - of(z.step));
  return { exact: [], near: ranked.slice(0, 2).map(({ step }) => step) };
}

/* ---------- lengths, by the role the property gives them ---------- */

/** A CSS length in px (`13px`, `0.75rem`, `1em` at 16px), or undefined. */
export function lengthPx(text) {
  const match = /^(-?(?:\d*\.)?\d+)(px|rem|em)?$/.exec(String(text).trim());
  if (!match) return undefined;
  const number = Number(match[1]);
  return match[2] === "rem" || match[2] === "em" ? number * 16 : number;
}

/**
 * A length's advice for a space utility: `{ kind: "space", value, exact?, options, range? }`, the
 * classes on the space scale with its value (exact, one), else the two nearest, else the scale's
 * range. `negative` writes each class with its minus, where the utility takes one.
 */
function spaceAdvice(utility, value, negative) {
  const found = scalesNow();
  if (!found) return undefined;
  const minus = negative ? "-" : "";
  const option = (step) => ({
    cls: `${minus}${utility}-${step.key}`,
    token: `space.${step.key === "0" ? "0" : step.key}`,
    value: step.px,
  });
  const steps = found.space.filter((step) => step.px > 0);
  const hint = { kind: "space", scale: "space", value: px(Math.abs(value)) };
  // Zero is space.0 (`top-0`), with no minus.
  const zero = value === 0 && found.space.find((step) => step.px === 0);
  if (zero) {
    const exact = { ...option(zero), cls: `${utility}-0` };
    return { ...hint, exact, options: [exact] };
  }
  const { exact, near } = nearestSteps(Math.abs(value), steps, (step) => step.px, 4);
  if (exact.length) return { ...hint, exact: option(exact[0]), options: [option(exact[0])] };
  if (near.length) return { ...hint, options: near.map(option) };
  return { ...hint, options: [], range: [option(steps[0]), option(steps.at(-1))] };
}

/** A token scale's advice: the class with that value, or the one or two nearest, or its range. */
function scaleAdvice(kind, scale, value, of, floor, show) {
  const { exact, near } = nearestSteps(value, scale, of, floor);
  const option = (token) => ({
    cls: token.class,
    token: token.name,
    value: of(token),
    token_: token,
  });
  const hint = { kind, scale: kind, value: show(value) };
  // Two tokens with one value are two roles (border.width.selected and .focused): no single pick.
  if (exact.length === 1)
    return { ...hint, exact: option(exact[0]), options: [option(exact[0])], show };
  if (exact.length > 1) return { ...hint, options: exact.slice(0, 2).map(option), show };
  if (near.length) return { ...hint, options: near.map(option), show };
  return { ...hint, options: [], range: [option(scale[0]), option(scale.at(-1))], show };
}

/** The type token nearest a font size: equal sizes are one step, its regular weight first (a
    stock text size sets no weight). */
function typeAdvice(size) {
  const found = scalesNow();
  if (!found) return undefined;
  const bySize = [];
  for (const token of found.type)
    if (!bySize.some((kept) => kept.size === token.size)) bySize.push(token);
  const hint = scaleAdvice("type", bySize, size, (token) => token.size, 2, px);
  // A step with no regular weight sets a weight the size did not (font-heading-small is 500): it
  // is named with its weight, and never picked for a size alone.
  const weighted = (option) =>
    option && option.token_.weight !== found.regular
      ? { ...option, extra: `weight ${option.token_.weight}` }
      : option;
  const options = hint.options.map(weighted);
  const exact = hint.exact && weighted(hint.exact);
  if (exact?.extra) return { ...hint, exact: undefined, options };
  return { ...hint, exact, options };
}

/** A radius's advice: its step on the radius scale; a pill's radius (radius.full, 9999px), the one
    pick for 9999px and named for any radius from PILL up, which rounds an element's ends as fully. */
function radiusAdvice(value) {
  const found = scalesNow();
  if (!found) return undefined;
  const { full } = found;
  if (full && value >= PILL) {
    const option = { cls: full.class, token: full.name, value: full.px, token_: full };
    const hint = { kind: "radius", scale: "radius", value: px(value), show: px };
    return value === full.px
      ? { ...hint, exact: option, options: [option] }
      : { ...hint, options: [option], pill: true };
  }
  return scaleAdvice("radius", found.radius, value, (token) => token.px, 1, px);
}
const borderAdvice = (value) =>
  scalesNow() && scaleAdvice("border width", scalesNow().border, value, (token) => token.px, 1, px);
const weightAdvice = (value) =>
  scalesNow() &&
  scaleAdvice("weight", scalesNow().weight, value, (token) => token.weight, 300, String);
const durationAdvice = (ms) =>
  scalesNow() &&
  scaleAdvice(
    "duration",
    scalesNow().duration,
    ms,
    (token) => token.ms,
    20,
    (v) => `${v}ms`,
  );

/** The words of a scale's advice: `16px is p-200 (space.200).`, `Nearest: p-150 (12px) or p-200
    (16px).`, or the range; with each option's purpose where `labels` asks for it, and the hint's
    `tail` before the period where it names options. */
function scaleWords(hint, { labels = false, tokenNames = false } = {}) {
  const show = hint.show ?? px;
  const named = (option) => (tokenNames ? option.token : option.cls);
  const detail = (option, withValue = true) => {
    const parts = [];
    if (withValue) parts.push(show(option.value));
    if (option.extra) parts.push(option.extra);
    if (labels && option.token_?.short) parts.push(purpose(option.token_.short));
    return parts.length ? ` (${parts.join(", ")})` : "";
  };
  const tail = hint.tail ?? "";
  if (hint.pill)
    return `${hint.value} rounds its ends as a pill: ${either(hint.options.map((option) => `${named(option)}${detail(option, false)}`))}.`;
  if (hint.exact) {
    const token = hint.kind === "space" && !tokenNames ? ` (${hint.exact.token})` : "";
    return `${hint.value} is ${named(hint.exact)}${token}.`;
  }
  if (hint.options.length && hint.options.every((option) => show(option.value) === hint.value))
    return `${hint.value} is ${either(hint.options.map((option) => `${named(option)}${detail(option, false)}`))}${tail}.`;
  if (hint.options.length)
    return `Nearest: ${either(hint.options.map((option) => `${named(option)}${detail(option)}`))}${tail}.`;
  const [first, last] = hint.range;
  return `The ${hint.scale} scale runs from ${named(first)} (${show(first.value)}) to ${named(last)} (${show(last.value)}).`;
}

/**
 * A border width's advice on a border utility (`border`, `border-t`, `border-x`): 1px is the
 * default width, which the utility itself writes (`border`, `border-t`), so that is the one class;
 * Ledger's other widths are classes that set every side, so on one side they are named, with that
 * said, and never offered in its place.
 */
function borderHint(utility, value) {
  const hint = borderAdvice(value);
  if (!hint) return hint;
  const side = utility.slice("border".length);
  const [only] = hint.exact ? [hint.exact] : hint.options.length === 1 ? hint.options : [];
  if (value === 1 && only?.value === 1) {
    const exact = { ...only, cls: `border${side}` };
    return { ...hint, exact, options: [exact] };
  }
  if (!side) return hint;
  return {
    ...hint,
    exact: undefined,
    options: hint.exact ? [hint.exact] : hint.options,
    tail:
      hint.exact || hint.options.length === 1
        ? ", which sets every side"
        : ", which set every side",
  };
}

/** The advice for a size: no token names a width or a height. Its example is of its dimension. */
const SIZE_EXAMPLE = {
  width: "w-full, a grid track",
  height: "h-full, a grid track",
  size: "size-full",
};
const sizeWords = (dimension) =>
  `A ${dimension} is a layout part's, a part's preset or computed from its container (${SIZE_EXAMPLE[dimension]}).`;

/* ---------- colours ---------- */

/** The roles each hue plays, by the class after its prefix (`danger-bold`, `accent-red-bolder`,
    `surface-raised`); each group is one option, its nearest token the one offered. */
const HUES = {
  red: [/^danger(?:-|$)/, /^accent-red(?:-|$)/],
  orange: [/^warning(?:-|$)/, /^accent-orange(?:-|$)/],
  green: [/^success(?:-|$)/, /^accent-green(?:-|$)/],
  teal: [/^accent-teal(?:-|$)/],
  blue: [/^information(?:-|$)/, /^brand(?:-|$)/, /^accent-blue(?:-|$)/],
  purple: [/^accent-purple(?:-|$)/],
  grey: [
    /^surface(?:-hovered|-pressed)?$/,
    /^surface-raised/,
    /^surface-sunken/,
    /^surface-overlay/,
    /^neutral(?:-|$)/,
    /^track$/,
    /^default(?:-|$)/,
    /^subtle(?:-|$)|^subtlest(?:-|$)/,
    /^bold(?:-|$)/,
    /^inverse(?:-|$)/,
  ],
};
/** Tailwind's palette families by the hue whose roles they take. */
const PALETTE_HUES = {
  grey: ["slate", "gray", "zinc", "neutral", "stone", "mauve", "olive", "mist", "taupe"],
  red: ["red", "rose", "pink"],
  orange: ["orange", "amber", "yellow"],
  green: ["lime", "green", "emerald"],
  teal: ["teal", "cyan"],
  blue: ["sky", "blue", "indigo"],
  purple: ["violet", "purple", "fuchsia"],
};
const hueOfFamily = (name) =>
  name === "white" || name === "black"
    ? "grey"
    : Object.keys(PALETTE_HUES).find((hue) => PALETTE_HUES[hue].includes(name.split("-")[0]));
const angleOf = ([, a, b]) => (Math.atan2(b, a) * 180) / Math.PI;
/** The chroma under which a colour of lightness L reads as grey: 0.03 up to L 0.85, falling to
    0.01 at L 0.97, since a pale tint has little chroma to show (Tailwind's red-50 is 0.013, Ledger's
    own danger, success and information tints 0.020), while a grey as pale as it has none (slate-100
    0.007, slate-200 0.013 at L 0.93). */
const greyBelow = (L) => 0.03 - 0.02 * Math.min(1, Math.max(0, (L - 0.85) / 0.12));
/** The hue an OKLab colour takes its roles from: grey below a little chroma for its lightness,
    else the accent family drawn nearest its angle. */
function hueOfLab(lab, anchors) {
  if (Math.hypot(lab[1], lab[2]) < greyBelow(lab[0])) return "grey";
  const angle = angleOf(lab);
  const turn = (a, z) => Math.min(Math.abs(a - z) % 360, 360 - (Math.abs(a - z) % 360));
  return anchors.reduce((best, anchor) =>
    turn(angle, anchor.angle) < turn(angle, best.angle) ? anchor : best,
  ).hue;
}

/** A variant as its state reads: a named group or peer (`group-hover/row`) is the same state, and
    a bracketed data or ARIA attribute (`data-[disabled]`, `aria-[disabled=true]`) is its bare form
    (`data-disabled`), as Base UI's parts are styled. */
const stateVariant = (variant) =>
  variant
    .replace(/\/[\w-]+$/, "")
    .replace(/((?:^|-)(?:data|aria))-\[([\w-]+)(?:=[^\]]*)?\]$/, "$1-$2");

/** The state a class's variants ask a colour for. */
function stateOf(variants) {
  const named = variants.map(stateVariant);
  if (named.some((variant) => /(?:^|-)disabled\b|^disabled$/.test(variant))) return "disabled";
  if (named.some((variant) => /(?:^|-)active$|pressed/.test(variant))) return "pressed";
  if (named.some((variant) => /(?:^|-)hover$/.test(variant))) return "hovered";
  return "rest";
}
const stateOfToken = (suffix) =>
  /-hovered$/.test(suffix)
    ? "hovered"
    : /-pressed$/.test(suffix)
      ? "pressed"
      : /(?:^|-)disabled$/.test(suffix)
        ? "disabled"
        : "rest";

/** OKLab to gamma-encoded sRGB and back, as the token build composites a translucent colour. */
const gammaEncode = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const gammaDecode = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
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
/** A colour's alpha as written, 1 when it has none: `#0000001a`, `rgb(0 0 0 / 10%)`,
    `rgba(0,0,0,.1)`. */
function alphaOf(text) {
  const value = String(text).trim().toLowerCase();
  const hex = /^#([0-9a-f]{4}|[0-9a-f]{8})$/.exec(value)?.[1];
  if (hex) return Number.parseInt(hex.length === 4 ? hex[3] + hex[3] : hex.slice(6), 16) / 255;
  const slash = /\/\s*(\d*\.?\d+)(%?)\s*\)$/.exec(value);
  if (slash) return Number(slash[1]) / (slash[2] ? 100 : 1);
  const comma = /^(?:rgba|hsla)\((?:[^,]*,){3}\s*(\d*\.?\d+)(%?)\s*\)$/.exec(value);
  return comma ? Number(comma[1]) / (comma[2] ? 100 : 1) : 1;
}
/** A written colour as a reader sees it in each mode: over that mode's page when translucent. */
function seenColour(lab, alpha, surface) {
  if (alpha >= 1 || !surface) return { light: lab, dark: lab };
  const over = (page) => {
    const [fg, bg] = [toSrgb(lab), toSrgb(page)];
    return fromSrgb(fg.map((channel, i) => alpha * channel + (1 - alpha) * bg[i]));
  };
  return { light: over(surface.light), dark: over(surface.dark) };
}

/**
 * The colour a class writes, as `{ prefix, light, dark, hue, fixed }`: its prefix (bg, text, icon,
 * border, fill or stroke; a border on one side is a border), what it looks like in each mode, the
 * hue whose roles it takes, and `fixed` when it is the same colour whatever the mode (a palette
 * colour, a literal); undefined for any other class. A token class is its token in each mode.
 */
export function colourOfClass(base) {
  const found = scalesNow();
  if (!found) return undefined;
  const match = /^(bg|text|icon|border(?:-[xytblrse])?|fill|stroke)-(.+)$/.exec(base);
  if (!match) return undefined;
  const prefix = match[1].startsWith("border") ? "border" : match[1];
  const rest = match[2];
  const token = found.values.classes[base] && found.values.tokens[found.values.classes[base]];
  if (token?.kind === "colour" && prefix === match[1]) {
    const hue = hueOfLab(token.oklab.light, found.anchors);
    return { prefix, light: token.oklab.light, dark: token.oklab.dark, hue, fixed: false };
  }
  const stock = Object.hasOwn(found.stock.palette, rest) ? found.stock.palette[rest] : undefined;
  if (stock) return { prefix, light: stock, dark: stock, hue: hueOfFamily(rest), fixed: true };
  // A palette colour with alpha (`bg-black/50`) is what it makes over each mode's page.
  const [, colour, percent] = /^([a-z]+(?:-\d+)?)\/(\d+)$/.exec(rest) ?? [];
  const tinted =
    colour && Object.hasOwn(found.stock.palette, colour) && found.stock.palette[colour];
  if (tinted) {
    const seen = seenColour(tinted, Math.min(1, Number(percent) / 100), found.surface);
    return { prefix, ...seen, hue: hueOfFamily(colour), fixed: true };
  }
  const arbitrary = /^\[(?:color:)?(.+)\]$/.exec(rest)?.[1]?.replace(/_/g, " ");
  const lab = arbitrary && parseColour(arbitrary);
  if (!lab) return undefined;
  const seen = seenColour(lab, alphaOf(arbitrary), found.surface);
  return { prefix, ...seen, hue: hueOfLab(lab, found.anchors), fixed: true };
}

/**
 * The tokens a colour is nearest to, in its prefix's family and its hue's roles, as `{ hue,
 * options, single }`: at most two options, one per role, ranked by distance, and `single`, the one
 * pick (decision 8), only for a colour one role holds within SAME_COLOUR in both modes. `modes`
 * says what the site states: "both" for a class with its dark: sibling (`light` and `dark` are the
 * two), "fixed" for a colour that is the same in both modes (ranked by the light page, picked only
 * when a token matches it in both), "dark" for a dark: class alone (ranked by its dark value, never
 * picked). `named` is a token class the site already writes for the colour (a pair's token twin),
 * which names its role. Two roles that hold the colour are both named, never one; and a grey is
 * picked only where the site names its role, since greys differ by elevation, not by value (a white
 * page is the surface, and a grey as pale is sunken or raised).
 */
export function nearestColour({ prefix, light, dark, hue, modes, state = "rest", named }) {
  const found = scalesNow();
  const pool = found?.colours[prefix];
  if (!pool?.length || !HUES[hue]) return undefined;
  const inState = (candidates) => {
    const wanted = candidates.filter((option) => stateOfToken(option.suffix) === state);
    return wanted.length || state === "disabled"
      ? wanted
      : candidates.filter((option) => stateOfToken(option.suffix) === "rest");
  };
  const groups =
    state === "disabled"
      ? [pool.filter((option) => stateOfToken(option.suffix) === "disabled")]
      : HUES[hue].map((role) =>
          inState(
            pool.filter((option) => role.test(option.suffix.replace(/-(hovered|pressed)$/, ""))),
          ),
        );
  const same = (option) => option.dl <= SAME_COLOUR && option.dd <= SAME_COLOUR;
  const score = (option) => {
    const dl = colourDistance(light, option.oklab.light);
    const dd = colourDistance(dark, option.oklab.dark);
    // A pair is judged in both modes alike; a colour alone by the mode it is written for.
    const rank = modes === "both" ? (dl + dd) / 2 : modes === "dark" ? dd : dl;
    return { ...option, dl, dd, rank };
  };
  // Each role's nearest token, and each role's nearest token the colour is in both modes.
  const scored = [];
  const matching = [];
  for (const group of groups) {
    const all = group.map(score).sort((a, z) => a.rank - z.rank);
    const [best] = all;
    const match = all.find(same);
    if (best && !scored.some((kept) => kept.cls === best.cls)) scored.push(best);
    if (match && !matching.some((kept) => kept.cls === match.cls)) matching.push(match);
  }
  const ranked = scored.sort((a, z) => a.rank - z.rank);
  if (!ranked.length) return undefined;
  matching.sort((a, z) => a.rank - z.rank);
  const [first] = ranked;
  // A hue's roles are alternatives whatever their distance (danger or a red with no meaning); a
  // grey's are shades, so one much further than the nearest is no option.
  const options = ranked
    .slice(0, 2)
    .filter((option) => hue !== "grey" || option.rank <= first.rank + GREY_REACH);
  if (modes === "dark") return { hue, options, single: undefined };
  // The role the site names, when the colour is its token in both modes.
  const own = named && pool.find((option) => option.cls === named);
  const pick = own && same(score(own)) ? score(own) : undefined;
  if (pick)
    return {
      hue,
      options: [pick, ...options.filter((option) => option.cls !== pick.cls)].slice(0, 2),
      single: pick,
    };
  // Two roles hold the colour: both are named, and the reader tells them apart.
  if (matching.length > 1) return { hue, options: matching.slice(0, 2), single: undefined };
  const single = matching.length === 1 && hue !== "grey" ? matching[0] : undefined;
  if (!single) return { hue, options, single };
  return {
    hue,
    options: [single, ...options.filter((option) => option.cls !== single.cls)].slice(0, 2),
    single,
  };
}

/** A class's dark: sibling on its site, or the light class a dark: class pairs with: the colour
    class of the same prefix under the same other variants, with dark: on the other side. Only a
    pair the site makes plain: none when either side has two such classes (a `cn` over branches),
    since which goes with which is then a guess. */
export function siblingOf(parsed, siblings = []) {
  const dark = parsed.variants.includes("dark");
  const others = (variants) =>
    variants
      .filter((variant) => variant !== "dark")
      .sort()
      .join(":");
  const own = colourOfClass(parsed.base);
  if (!own) return undefined;
  const alike = siblings.filter(
    (other) =>
      others(other.variants) === others(parsed.variants) &&
      colourOfClass(other.base)?.prefix === own.prefix,
  );
  const across = alike.filter((other) => other.variants.includes("dark") !== dark);
  const beside = alike.filter(
    (other) => other.variants.includes("dark") === dark && other.cls !== parsed.cls,
  );
  return across.length === 1 && beside.length === 0 ? across[0] : undefined;
}

/** Capitalised: `Red`. */
const title = (word) => word.charAt(0).toUpperCase() + word.slice(1);

/**
 * A colour class's advice, ranked with its dark: sibling on the site when it has one: `{ hue,
 * options, single, sibling }`, or undefined when the class is no colour in a family with
 * tokens.
 */
export function colourAdvice(parsed, siblings) {
  const own = colourOfClass(parsed.base);
  if (!own) return undefined;
  const dark = parsed.variants.includes("dark");
  const pair = siblingOf(parsed, siblings);
  const other = pair && colourOfClass(pair.base);
  const ranked =
    other && dark
      ? { light: other.light, dark: own.dark, hue: other.hue, modes: "both" }
      : other
        ? { light: own.light, dark: other.dark, hue: own.hue, modes: "both" }
        : dark
          ? { light: own.dark, dark: own.dark, hue: own.hue, modes: "dark" }
          : // A token class alone already flips; a written colour is the same in both modes.
            { light: own.light, dark: own.dark, hue: own.hue, modes: "fixed" };
  // A pair with a token on one side names its role: the token, bare of its variants.
  const token = other && (!own.fixed ? parsed.base : !other.fixed ? pair.base : undefined);
  const found = nearestColour({
    prefix: own.prefix,
    ...ranked,
    state: stateOf(parsed.variants),
    named: token,
  });
  return found && { ...found, sibling: pair?.cls };
}

/**
 * What a `dark:` colour class stands for, read with its light sibling on the site (the colour class
 * of the same prefix under the same other variants), for no-dark-variant's words: undefined for a
 * class that is not a dark: colour, or while the lint data is stale; else `{ sibling, flips,
 * options, single, words }`:
 * - `sibling`, the light class as written, when the site has one;
 * - `flips`, true when that class is a token, which changes with the mode by itself, so the dark:
 *   class only goes (`bg-surface dark:bg-gray-900`);
 * - `token`, true when the dark: class is itself a token (`bg-white dark:bg-surface`): it changes
 *   with the mode by itself, and the light class beside it is the literal one;
 * - otherwise `options`, at most two tokens of the pair's roles ranked in both modes (the dark:
 *   class alone, by its dark value), each `{ cls, token, short }` with `cls` under the light
 *   class's other variants; `single`, the one pick, only for a colour one role holds within ΔE 0.02
 *   in both modes (decision 8), never for a dark: class alone;
 * - `words`, the advice richest first, for fitted(): the last names the options bare, without the
 *   twin, so it fits however long the variants.
 */
export function darkPairAdvice(parsed, siblings = []) {
  if (!parsed.variants.includes("dark") || !scalesNow()) return undefined;
  const own = colourOfClass(parsed.base);
  if (!own) return undefined;
  const pair = siblingOf(parsed, siblings);
  const light = pair && colourOfClass(pair.base);
  if (light && !light.fixed)
    return {
      sibling: pair.cls,
      flips: true,
      token: !own.fixed,
      options: [],
      single: undefined,
      words: [`"${pair.cls}" is a token, which changes with the mode by itself.`],
    };
  const found = colourAdvice(parsed, siblings);
  if (!found) return undefined;
  const others = pair ?? { ...parsed, variants: parsed.variants.filter((v) => v !== "dark") };
  const named = (option) => option && { ...option, cls: withVariants(others, option.cls) };
  const options = found.options.map(named);
  const single = named(found.single);
  return {
    sibling: pair?.cls,
    flips: false,
    token: !own.fixed,
    options,
    single,
    words: [
      ...colourWords({ ...found, options, single }).slice(0, -1),
      ...colourWords({ ...found, sibling: undefined }).slice(-1),
    ],
  };
}

/** The words of a colour's advice, richest first: with each role's purpose, then without, then
    with neither the twin's name nor the variants, the shortest, which fitted() falls back to. The
    classes keep the variants of the class they stand for, but never dark:. */
export function colourWords(found, name = (option) => option.cls) {
  const bare = (option) =>
    name({ ...option, cls: option.cls.slice(option.cls.lastIndexOf(":") + 1) });
  if (found.single)
    return [
      `${found.sibling ? `With "${found.sibling}" it` : "It"} is ${name(found.single)} in both modes (${purpose(found.single.short)}).`,
      `${found.sibling ? `With "${found.sibling}" it` : "It"} is ${name(found.single)} in both modes.`,
      `It is ${bare(found.single)} in both modes.`,
    ];
  const lead = found.sibling ? `With "${found.sibling}", ${found.hue}` : title(found.hue);
  return [
    `${lead} is ${either(found.options.map((option) => `${name(option)} (${purpose(option.short)})`))}.`,
    `${lead} is ${either(found.options.map(name))}.`,
    `${title(found.hue)} is ${either(found.options.map(bare))}.`,
  ];
}

/* ---------- a class's value ---------- */

/** The logical utility for a spacing utility that names a physical side. */
const LOGICAL_UTILITY = {
  __proto__: null,
  pl: "ps",
  pr: "pe",
  left: "start",
  right: "end",
  "scroll-pl": "scroll-ps",
  "scroll-pr": "scroll-pe",
  "scroll-ml": "scroll-ms",
  "scroll-mr": "scroll-me",
};

/** A stock text size, radius, weight or shadow, by its Tailwind name. */
const STOCK_TEXT = /^text-(xs|sm|base|lg|[2-9]?xl)$/;
const STOCK_RADIUS = /^rounded(-(?:t|b|l|r|s|e|tl|tr|bl|br|ss|se|es|ee))?-(xs|sm|md|lg|[2-4]?xl)$/;
const STOCK_WEIGHT = /^font-(thin|extralight|light|normal|bold|extrabold|black)$/;
const STOCK_SHADOW = /^shadow(?:-(2xs|xs|sm|md|lg|xl|2xl))?$/;
/** A stock size's value: a number of steps, a fraction, px or a container size. A viewport length
    is the window's own size, structure, so it names no layout part (the lint admits its dvh). */
const STOCK_SIZE = /^(?:\d+(?:\.\d+)?|\d+\/\d+|px|[2-7]?xs|[2-7]?xl|sm|md|lg|3xs|prose|lh)$/;
/** A sizing utility at a viewport length (`min-h-dvw`, `w-screen`), the window's own size. */
const VIEWPORT_SIZE = /^(?:w|h|size|min-w|min-h|max-w|max-h)-(?:[sld]?v[hw]|screen)$/;
/** A key that looks like a Ledger space key but is none: three digits or more, or a leading 0. */
const LEDGER_KEY = /^(?:0\d+|\d{3,})$/;

/** The shadow a stock shadow is nearest, by its widest blur on a log scale, since a reader sees
    depth grow with the log of blur: every drop shadow token, nearest first. */
function shadowAdvice(name) {
  const found = scalesNow();
  if (!found) return undefined;
  const css = found.stock.shadow[name];
  if (css === undefined) return undefined;
  const blur = Math.max(
    0,
    ...css.split(/,(?![^(]*\))/).map(
      (layer) =>
        layer
          .replace(/\([^)]*\)/g, "")
          .trim()
          .split(/\s+/)
          .map(lengthPx)[2] ?? 0,
    ),
  );
  const depth = (value) => Math.log2(1 + value);
  const options = [...found.shadow]
    .sort((a, z) => Math.abs(depth(a.blur) - depth(blur)) - Math.abs(depth(z.blur) - depth(blur)))
    .slice(0, 2)
    .map((token) => ({ cls: token.class, token: token.name, value: token.blur, token_: token }));
  return { kind: "shadow", scale: "shadow", value: `${px(blur)} blur`, options };
}

/** The two opacity tokens, nearest first, each for its role: never one alone by value. */
function opacityAdvice(value) {
  const found = scalesNow();
  if (!found) return undefined;
  const options = [...found.opacity]
    .sort((a, z) => Math.abs(a.value - value) - Math.abs(z.value - value))
    .map((token) => ({ cls: token.class, token: token.name, value: token.value, token_: token }));
  return { kind: "opacity", scale: "opacity", value: String(value), options, show: String };
}

/** Tailwind's stock easings, each with the Ledger easing of its shape: in-out stays on screen,
    out arrives (decelerates), in leaves (accelerates). */
const STOCK_EASE = { "in-out": "ease-standard", out: "ease-enter", in: "ease-exit" };

/** The words of a space value written as a prop (`padding="space.200" on a Box`), for a class a
    layout primitive's prop takes in its place: `prop` is `{ name, on }`. */
function propWords(hint, { name, on }) {
  const value = (option) => `${name}="${option.token}"`;
  if (hint.exact) return [`${hint.value} is ${hint.exact.token}: ${value(hint.exact)}${on}.`];
  if (hint.options.length)
    return [
      `Nearest: ${either(hint.options.map((option) => `${value(option)} (${px(option.value)})`))}${on}.`,
    ];
  const [first, last] = hint.range;
  return [
    `The space scale runs from ${first.token} (${px(first.value)}) to ${last.token} (${px(last.value)}), as ${name}="…"${on}.`,
  ];
}

/** The words of a delay's advice: a delay has no class, so its value is a duration token in style. */
function delayWords(hint) {
  const call = (option) => `token("${option.token}")`;
  const named = hint.exact
    ? `${hint.value} is ${call(hint.exact)}`
    : hint.options.length
      ? `the nearest ${hint.options.length > 1 ? "are" : "is"} ${either(hint.options.map((option) => `${call(option)} (${option.value}ms)`))}`
      : `a duration token is token("motion.duration.…")`;
  return [`A delay has no class; in style, ${named}.`];
}

/** The words of an outline width: the border widths hold it, and the focus outline sets its own. */
function outlineWords(hint) {
  const tail = " A focus outline is outline-focused, which sets its width.";
  return [
    `${scaleWords(hint, { labels: true, tokenNames: true })}${tail}`,
    `${scaleWords(hint, { tokenNames: true })}${tail}`,
  ];
}

/**
 * What a class is worth and the Ledger token nearest it, by the role its utility plays: `{ kind,
 * what, value, words, replacement? }`, or undefined when its value plays no role a token owns.
 * `what` names what the class is in Tailwind's words (`spacing step 4 (16px)`), `words` the
 * advice, richest first (fitted() picks), and `replacement` the one class that may stand for it,
 * with its variants: only an exact value on a scale that holds it once, or a colour that matches a
 * token of its role in both modes. `arbitrary` reads the value inside brackets instead of Tailwind's
 * stock scales. `prop(utility)` is the prop a layout primitive takes for a padding or a gap on this
 * element, `{ name, on }`, where use-primitives reports the class: the advice then names the prop
 * and its token, and no class stands for it.
 */
export function valueAdvice(parsed, { siblings = [], arbitrary = false, prop } = {}) {
  const found = scalesNow();
  if (!found) return undefined;
  const { base } = parsed;
  const replace = (cls) => withVariants(parsed, cls);
  const lengthHint = (hint, what, extra = {}) =>
    hint && {
      what,
      value: hint.value,
      words: [scaleWords(hint, { labels: true }), scaleWords(hint)],
      ...(hint.exact ? { replacement: replace(hint.exact.cls), same: hint.value } : {}),
      kind: hint.kind,
      ...extra,
    };

  // A colour, palette or arbitrary, ranked with its dark: sibling.
  const colour = colourAdvice(parsed, siblings);
  if (colour && (arbitrary ? /-\[/.test(base) : !/-\[/.test(base))) {
    const name = /^(?:bg|text|icon|border(?:-[xytblrse])?|fill|stroke)-(.+)$/.exec(base)[1];
    return {
      kind: "colour",
      what: arbitrary ? "colour" : `palette colour ${name}`,
      value: name,
      words: colourWords(colour),
      ...(colour.single
        ? { replacement: replace(colour.single.cls), same: "colour in both modes" }
        : {}),
      options: colour.options,
    };
  }

  const bracket = /^(-?)([a-z][a-z-]*?)-\[([^\]]+)\]$/.exec(base);
  const stockLength = /^(-?)([a-z][a-z-]*?)-(\d+(?:\.\d+)?|px)$/.exec(base);
  if (arbitrary ? bracket : stockLength) {
    const [, minus, utility, raw] = arbitrary ? bracket : stockLength;
    const value = arbitrary
      ? lengthPx(raw)
      : raw === "px"
        ? 1
        : // An outline's number is its width in px (outline-2); any other, a spacing step.
          Number(raw) * (utility === "outline" ? 1 : (lengthPx(found.stock.spacing) ?? 4));
    const what = arbitrary
      ? "value"
      : `spacing step ${raw} (${value === undefined ? raw : px(value)})`;
    if (value === undefined) {
      if (arbitrary && SIZE_UTILITIES.test(utility) && /^\d/.test(raw)) return undefined;
    } else if (/^space-[xy]$/.test(utility)) {
      // space-x and space-y set margins on the children: the parent's space says it without. A
      // negative one overlaps them, which is a part's own layout.
      if (minus === "-" || value < 0)
        return {
          kind: "space",
          what,
          value: px(Math.abs(value)),
          words: [
            "A negative space overlaps the children with margins; an overlap is a part's own layout, as AvatarGroup's is.",
          ],
        };
      const hint = spaceAdvice(utility, value, false);
      const part = utility === "space-y" ? "Stack" : "Inline";
      return (
        hint && {
          kind: "space",
          what,
          value: hint.value,
          words: propWords(hint, {
            name: "space",
            on: ` on ${part === "Stack" ? "a Stack" : "an Inline"}, which spaces its children without margins`,
          }),
        }
      );
    } else if (SPACE_UTILITIES.test(utility) && SPACING.includes(utility)) {
      const negative = value !== 0 && (minus === "-" || value < 0);
      // A minus only where Tailwind negates the utility (lint.json's negatable).
      if (negative && !lintFacts().negatable.includes(utility)) return undefined;
      // A physical side is named by its logical twin, which mirrors with the page (pl-4 is
      // ps-200), as the class rule asks of the side itself.
      const hint = spaceAdvice(LOGICAL_UTILITY[utility] ?? utility, value, negative);
      const owned = !negative && prop?.(utility);
      if (hint && owned)
        return { kind: "space", what, value: hint.value, words: propWords(hint, owned) };
      return lengthHint(hint, what);
    } else if (SIZE_UTILITIES.test(utility)) {
      const dimension = dimensionOf(utility);
      // 1px has its own spelling, which the lint admits (h-px, w-px): the same 1px.
      const hairline = value === 1 && !minus && isKnown(`${utility}-px`) && `${utility}-px`;
      return {
        kind: "size",
        what: arbitrary ? dimension : `${dimension} step ${raw} (${px(value)})`,
        dimension,
        value: px(value),
        words: hairline ? [`1px is ${hairline}.`] : [sizeWords(dimension)],
        ...(hairline ? { replacement: replace(hairline), same: "1px" } : {}),
      };
    } else if (arbitrary && /^rounded(-(?:t|b|l|r|s|e|tl|tr|bl|br|ss|se|es|ee))?$/.test(utility)) {
      const side = /^rounded(-.+)?$/.exec(utility)[1] ?? "";
      const hint = radiusAdvice(value);
      return lengthHint(sided(hint, side), "radius");
    } else if (arbitrary && utility === "text") {
      return lengthHint(typeAdvice(value), "text size");
    } else if (arbitrary && /^border(-[xytblrse])?$/.test(utility)) {
      return lengthHint(borderHint(utility, value), "border width");
    } else if (utility === "outline" && !minus && value === 0) {
      return {
        kind: "border width",
        what: arbitrary ? "outline width" : `outline width ${raw} (0px)`,
        value: "0px",
        words: ["An outline of no width is outline-none."],
      };
    } else if (utility === "outline" && !minus) {
      const hint = borderAdvice(value);
      return (
        hint && {
          kind: "border width",
          what: arbitrary ? "outline width" : `outline width ${raw} (${px(value)})`,
          value: hint.value,
          words: outlineWords(hint),
        }
      );
    } else if (arbitrary && utility === "ring") {
      return {
        kind: "ring",
        what: "ring width",
        value: px(value),
        words: ["A ring width is a focus ring: use outline-focused."],
      };
    }
  }
  if (arbitrary) {
    const [, , utility, raw] = bracket ?? [];
    if (!utility) return undefined;
    if (/^(duration|delay)$/.test(utility) && /^\d+(?:\.\d+)?m?s$/.test(raw)) {
      const ms = Number.parseFloat(raw) * (raw.endsWith("ms") ? 1 : 1000);
      const hint = durationAdvice(ms);
      if (utility === "delay")
        return (
          hint && { kind: "duration", what: "delay", value: hint.value, words: delayWords(hint) }
        );
      return lengthHint(hint, "duration");
    }
    if (utility === "font" && /^\d{3}$/.test(raw)) {
      const hint = weightAdvice(Number(raw));
      return lengthHint(hint, "font weight", hint?.exact ? { same: `weight ${raw}` } : {});
    }
    if (utility === "opacity" && /^(?:\d*\.)?\d+%?$/.test(raw)) {
      const value = raw.endsWith("%") ? Number.parseFloat(raw) / 100 : Number(raw);
      const hint = opacityAdvice(value);
      return (
        hint && {
          kind: "opacity",
          what: "opacity",
          value: String(value),
          words: opacityWords(hint),
        }
      );
    }
    return undefined;
  }

  // Tailwind's stock scales, by name.
  const size = /^(-?)(w|h|size|min-w|min-h|max-w|max-h|basis)-(.+)$/.exec(base);
  if (size && !size[1] && STOCK_SIZE.test(size[3])) {
    const dimension = dimensionOf(size[2]);
    return {
      kind: "size",
      what: `${dimension} ${size[3]}`,
      dimension,
      value: size[3],
      words: [sizeWords(dimension)],
    };
  }
  let match;
  if ((match = STOCK_TEXT.exec(base))) {
    const stock = found.stock.text[match[1]];
    return stock && lengthHint(typeAdvice(stock.px), `text size ${match[1]} (${px(stock.px)})`);
  }
  if ((match = STOCK_RADIUS.exec(base))) {
    const value = found.stock.radius[match[2]];
    return (
      value !== undefined &&
      lengthHint(sided(radiusAdvice(value), match[1] ?? ""), `radius ${match[2]} (${px(value)})`)
    );
  }
  if ((match = STOCK_WEIGHT.exec(base))) {
    const value = found.stock.weight[match[1]];
    return (
      value !== undefined && lengthHint(weightAdvice(value), `font weight ${match[1]} (${value})`)
    );
  }
  if ((match = STOCK_SHADOW.exec(base))) {
    const name = match[1] ?? "sm";
    const hint = shadowAdvice(name);
    return (
      hint && {
        kind: "shadow",
        what: `shadow ${name}`,
        value: hint.value,
        words: [
          `Nearest: ${either(hint.options.map((option) => `${option.cls} (${purpose(option.token_.short)})`))}.`,
          `Nearest: ${either(hint.options.map((option) => option.cls))}.`,
        ],
      }
    );
  }
  // A stock stacking order. Between the page's regions a layer token stacks it, and the layer of
  // that number stands for it; a part's own stacking inside itself keeps z-0, z-10 or z-20.
  if ((match = /^z-(\d+)$/.exec(base))) {
    const value = Number(match[1]);
    const layers = Object.values(found.values.tokens)
      .filter((token) => token.family === "layer" && !token.deprecated)
      .sort((a, z) => a.value - z.value);
    if (!layers.length) return undefined;
    const exact = layers.find((token) => token.value === value);
    const use = exact ? `Use ${exact.class}, the layer at ${value}. ` : "";
    const inside = "a part's own stacking inside itself takes z-0, z-10 or z-20";
    return {
      kind: "layer",
      what: `z-index ${value}`,
      value: String(value),
      words: [
        `${use}Layers stack the page's regions (${layers.map((token) => `${token.class} ${token.value}`).join(", ")}); ${inside}.`,
        `${use}Layers stack the page's regions (${layers.map((token) => token.class).join(", ")}); ${inside}.`,
      ],
      ...(exact ? { replacement: replace(exact.class), same: "z-index" } : {}),
    };
  }
  if ((match = /^ease-(in-out|out|in)$/.exec(base))) {
    const easing = Object.values(found.values.tokens).find(
      (token) => token.class === STOCK_EASE[match[1]] && !token.deprecated,
    );
    const others = Object.values(STOCK_EASE).filter((cls) => cls !== STOCK_EASE[match[1]]);
    return (
      easing && {
        kind: "easing",
        what: `easing ${match[1]}`,
        value: match[1],
        words: [
          `Its Ledger curve is ${easing.class} (${purpose(easing.short)}); ${others.join(" and ")} are for other motion.`,
          `Its Ledger curve is ${easing.class}.`,
        ],
      }
    );
  }
  return undefined;
}

/** A radius hint's classes on one side (`rounded-t-medium`), as Tailwind generates them. */
function sided(hint, side) {
  if (!hint || !side) return hint;
  const on = (option) =>
    option && { ...option, cls: option.cls.replace(/^rounded-/, `rounded${side}-`) };
  return {
    ...hint,
    exact: on(hint.exact),
    options: hint.options.map(on),
    ...(hint.range ? { range: hint.range.map(on) } : {}),
  };
}
/** The words of the opacity advice: both tokens, nearest first, each for its role. */
const opacityWords = (hint) => [
  `Ledger has ${either(hint.options.map((option) => `${option.cls} (${option.value}, ${purpose(option.token_.short)})`))}.`,
  `Ledger has ${either(hint.options.map((option) => `${option.cls} (${option.value})`))}.`,
];

/**
 * The advice for a class no-static-design-value owns, by its message id: `{ words, replacement?,
 * value? }`, or undefined. A fixed radius and a numeric border width by their value, a numeric
 * opacity by the two opacity roles, a numeric duration by the duration scale (a delay by the
 * duration tokens, which no delay class takes), and a literal colour by the roles of its hue,
 * ranked with its dark: sibling.
 */
export function staticAdvice(parsed, cause, siblings = []) {
  const found = scalesNow();
  if (!found) return undefined;
  const { base } = parsed;
  const replace = (cls) => withVariants(parsed, cls);
  const withLength = (hint, extra) =>
    hint && {
      value: hint.value,
      words: [scaleWords(hint, { labels: true }), scaleWords(hint)],
      ...(hint.exact ? { replacement: replace(hint.exact.cls), same: hint.value } : {}),
      ...extra,
    };
  if (cause === "fixedRadius") {
    const side = /^rounded(-.+)?$/.exec(base)?.[1] ?? "";
    return withLength(sided(radiusAdvice(4), side));
  }
  if (cause === "numericBorder") {
    const [, utility, width] = /^(border(?:-[xytblrse])?)-(\d+)$/.exec(base) ?? [];
    return utility && withLength(borderHint(utility, Number(width)));
  }
  if (cause === "numericOpacity") {
    const value = Number(/^opacity-(\d+)$/.exec(base)?.[1]) / 100;
    const hint = opacityAdvice(value);
    return hint && { value: String(value), words: opacityWords(hint) };
  }
  if (cause === "numericDuration") {
    const [, kind, ms] = /^(duration|delay)-(\d+)$/.exec(base) ?? [];
    const hint = kind && durationAdvice(Number(ms));
    if (!hint) return undefined;
    // A delay has no class of its own: its value is a duration token, in style.
    if (kind === "delay") return { value: hint.value, words: delayWords(hint) };
    return withLength(hint);
  }
  if (cause === "literalColour") {
    const advice = colourAdvice(parsed, siblings);
    if (!advice) return undefined;
    return {
      value: /-(white|black)$/.exec(base)?.[1],
      words: colourWords(advice),
      ...(advice.single
        ? { replacement: replace(advice.single.cls), same: "colour in both modes" }
        : {}),
    };
  }
  return undefined;
}

/* ---------- spelling ---------- */

let spellings;
/** A class's utility, what comes before its value: a token class's is what its token's last
    segments do not spell (`bg` of bg-neutral-hovered, `border-w` of border-w-focused, `min-h` of
    min-h-row); a kit @utility's, all but its last segment (`stat-grid` of stat-grid-2). */
function utilityOf(cls, tokenName) {
  const segments = tokenName ? tokenName.split(".") : [];
  for (let take = segments.length; take > 0; take -= 1) {
    const value = segments.slice(-take).join("-");
    if (cls.endsWith(`-${value}`) && cls.length > value.length + 1)
      return cls.slice(0, -(value.length + 1));
  }
  return cls.slice(0, Math.max(0, cls.lastIndexOf("-")));
}

/** The classes a misspelling is compared with, each with its utility: the token classes and the
    kit's @utility names, each one the lint admits. The structural spellings are not among them: a
    stock class two edits from one (`cursor-cell` from `cursor-help`, `flex-grow` from `flex-row`)
    is a real Tailwind utility, not a slip. */
function spellingsNow() {
  const found = scalesNow();
  if (!found) return null;
  if (spellings?.values === found.values) return spellings;
  const { classes, tokens } = found.values;
  const utilities = new Map();
  for (const cls of Object.keys(classes))
    if (!tokens[classes[cls]]?.deprecated) utilities.set(cls, utilityOf(cls, classes[cls]));
  for (const cls of lintFacts().utilities)
    if (!utilities.has(cls)) utilities.set(cls, utilityOf(cls));
  const names = [...utilities].filter(([cls, utility]) => utility && isKnown(cls));
  spellings = {
    values: found.values,
    names,
    // Longest first, so a class's utility is the longest one it starts with (`border-w` before
    // `border`).
    utilities: [...new Set(names.map(([, utility]) => utility))].sort(
      (a, z) => z.length - a.length,
    ),
    memo: new Map(),
  };
  return spellings;
}

/** The words that name a token's emphasis or state: two classes that differ only in one of them
    are two values of one role (bg-danger-bold and bg-danger-bolder), never a slip. */
const EMPHASIS_WORDS = new Set([
  "subtlest",
  "subtler",
  "subtle",
  "bold",
  "bolder",
  "boldest",
  "hovered",
  "pressed",
]);
/** Tailwind's value keywords (`min-h-dvw`, `w-screen`, `max-h-fit`): a class that ends in one is a
    real utility, never a misspelt token class. */
const VALUE_KEYWORDS = new Set([
  "auto",
  "full",
  "screen",
  "svh",
  "lvh",
  "dvh",
  "svw",
  "lvw",
  "dvw",
  "min",
  "max",
  "fit",
  "px",
  "none",
]);
/** Whether two classes differ only in one segment that names an emphasis or a state in both. */
function emphasisSwap(a, z) {
  const [left, right] = [a.split("-"), z.split("-")];
  if (left.length !== right.length) return false;
  const differ = left.flatMap((segment, index) => (segment === right[index] ? [] : [index]));
  return (
    differ.length === 1 &&
    EMPHASIS_WORDS.has(left[differ[0]]) &&
    EMPHASIS_WORDS.has(right[differ[0]])
  );
}

/** The one admitted class nearest a misspelt one, within its utility only (`bg-surfce` is
    `bg-surface`; `w-row` is never h-row, nor `border-w-bold` border-bold): one edit under six
    letters, else two. Undefined when none is that near or two are equally near, which was meant
    being then the reader's call; for a value Tailwind names (`min-h-dvw`); and for another
    emphasis or state of the same token (`bg-danger-bolder`), a value rather than a slip. */
export function respelled(base) {
  if (base.length < 3 || base.startsWith("-")) return undefined;
  const found = spellingsNow();
  if (!found) return undefined;
  if (found.memo.has(base)) return found.memo.get(base);
  const utility = found.utilities.find((known) => base.startsWith(`${known}-`));
  const value = base.slice(base.lastIndexOf("-") + 1);
  let meant;
  if (utility && !VALUE_KEYWORDS.has(value)) {
    const budget = base.length < 6 ? 1 : 2;
    let best = Infinity;
    let hits = [];
    for (const [candidate, own] of found.names) {
      if (own !== utility || Math.abs(candidate.length - base.length) > budget) continue;
      if (emphasisSwap(base, candidate)) continue;
      const distance = editDistance(base, candidate);
      if (distance > budget || distance > best) continue;
      if (distance < best) [best, hits] = [distance, []];
      hits.push(candidate);
    }
    meant = hits.length === 1 ? hits[0] : undefined;
  }
  if (found.memo.size > 10_000) found.memo.clear();
  found.memo.set(base, meant);
  return meant;
}

/** A numbered token series a class steps past (`fill-chart-categorical-9`): `{ series, range }`,
    or undefined. The number is a value, not a spelling, so it is never respelled. */
export function seriesOf(base) {
  const found = scalesNow();
  const match = /^(.*-)(\d+)$/.exec(base);
  if (!found || !match) return undefined;
  const steps = Object.keys(found.values.classes)
    .filter((cls) => cls.startsWith(match[1]) && /^\d+$/.test(cls.slice(match[1].length)))
    .filter((cls) => !found.values.tokens[found.values.classes[cls]]?.deprecated)
    .map((cls) => Number(cls.slice(match[1].length)))
    .sort((a, z) => a - z);
  if (steps.length < 2 || steps.includes(Number(match[2]))) return undefined;
  return { series: `${match[1]}*`, range: `${steps[0]} to ${steps.at(-1)}` };
}

/* ---------- a class no-non-token-class calls unknown ---------- */

/**
 * The layout rules the kit keeps inside its parts, which were once classes a product could write:
 * each base class (or prefix, for the Shell's regions) with the part that owns it and what to write
 * instead. A variant is a breakpoint the part takes as a prop, where it takes one (StickyRail's
 * `from`).
 */
const PART_OWN = [
  {
    test: (base) => base === "sticky-rail",
    owner: "StickyRail's",
    advice: (variants) =>
      variants.length === 1 && variants[0] === "lg"
        ? 'Wrap the column in <StickyRail from="lg">.'
        : 'Wrap the column in <StickyRail>; from="lg" sticks it from the large breakpoint.',
  },
  {
    test: (base) => /^shell-[a-z]/.test(base),
    owner: "the Shell's",
    advice: () => "Compose the Shell's parts, which place and style themselves.",
  },
  {
    test: (base) => base === "grid-cols-main-rail",
    owner: "the Shell's",
    advice: () => "Render the rail as Shell.Aside beside Main.",
  },
  {
    test: (base) => base === "min-h-work" || base === "grid-cols-list-detail",
    owner: "WorkPane's",
    advice: () =>
      "Use a WorkPane for a list beside its detail, or min-h-dvh for a region as tall as the window.",
  },
  {
    test: (base) => base === "sticky-bar",
    owner: "ActionBar's",
    advice: () => "Put a record's actions in PageHeader.Actions.",
  },
];

/** The part that keeps an unknown class's rule inside itself, and what to write instead. */
function partOwnOf(parsed) {
  const own = PART_OWN.find(({ test }) => test(parsed.base));
  return own && { owner: own.owner, advice: own.advice(parsed.variants) };
}

/**
 * What the lint can say of a class no-non-token-class calls unknown, as `{ messageId, data,
 * replacement?, same? }`, or undefined when nothing more:
 * - `partOwn`: a layout rule the kit keeps inside a part, once a class (`sticky-rail`,
 *   `shell-panel`), with the part to use instead;
 * - `spaceKey`: a Ledger-shaped space key that is no key (`p-210`), with the keys either side of
 *   it, never one;
 * - `stock`: a Tailwind stock value (`p-4`, `text-sm`, `bg-red-500`), with the Ledger token nearest
 *   it in the family its utility's role names, and `replacement`, the one class that may stand for
 *   it, only for an exact value or a colour that matches a token in both modes (`same` says what
 *   is the same);
 * - `size`: a stock width or height, which no token names;
 * - `series`: a step past a numbered token series (`fill-chart-categorical-9`);
 * - `typo`: a misspelt token class (`bg-surfce`), when one class is nearest, as the replacement.
 * `render(messageId, data)` is the message's words, which the advice is fitted to.
 */
export function explainUnknown(parsed, siblings = [], render = () => "", prop) {
  const { base } = parsed;
  const own = partOwnOf(parsed);
  if (own) return { messageId: "partOwn", data: own };
  if (!scalesNow()) return undefined;
  // A viewport length on a sizing utility (min-h-dvw) is the window's size, a real Tailwind
  // utility: nothing more to say, and never a misspelling.
  if (VIEWPORT_SIZE.test(base)) return undefined;
  const key = /^(-?)([a-z][a-z-]*?)-(\d+)$/.exec(base);
  const spaced =
    key &&
    SPACE_UTILITIES.test(key[2]) &&
    SPACING.includes(key[2]) &&
    (!key[1] || lintFacts().negatable.includes(key[2]));
  if (spaced && LEDGER_KEY.test(key[3])) {
    const steps = scalesNow().space.filter((step) => step.px > 0);
    const value = Number(key[3]);
    const keyOf = (step) => Number(step.key);
    const below = steps.filter((step) => keyOf(step) < value).at(-1);
    const above = steps.find((step) => keyOf(step) > value);
    const around = [below, above]
      .filter(Boolean)
      .map((step) => `${key[1]}${key[2]}-${step.key} (${px(step.px)})`);
    if (around.length)
      return {
        messageId: "spaceKey",
        data: {
          advice:
            around.length === 2
              ? `${key[3]} falls between ${around.join(" and ")}.`
              : `The nearest key is ${around[0]}.`,
        },
      };
  }
  const advice = valueAdvice(parsed, { siblings, prop });
  if (advice) {
    const messageId = advice.kind === "size" ? "size" : "stock";
    const data = { what: advice.what };
    data.advice = fitted(advice.words, (words) => render(messageId, { ...data, advice: words }));
    return { messageId, data, replacement: advice.replacement, same: advice.same };
  }
  const series = seriesOf(base);
  if (series) return { messageId: "series", data: series };
  const meant = respelled(base);
  if (!meant) return undefined;
  const replacement = withVariants(parsed, meant);
  return { messageId: "typo", data: { meant: replacement }, replacement };
}

/* ---------- style ---------- */

/** The token family a style property's length plays, by its name. A width or a height has many
    roles (a popup, a measure, a control, a container threshold), so none names one. */
const STYLE_ROLES = [
  {
    props:
      /^(padding|gap$|rowGap$|columnGap$|inset|top$|right$|bottom$|left$|scroll(Padding|Margin)|textIndent$)/,
    role: "space",
  },
  { props: /^(border\w*Width|outlineWidth)$/, role: "border width" },
  { props: /^border\w*Radius$/, role: "radius" },
  { props: /^fontSize$/, role: "type" },
  {
    props:
      /^(width|height|(min|max)(Width|Height)|(min|max)?(Inline|Block)Size|inlineSize|blockSize|flexBasis)$/,
    role: "size",
  },
];

/** The negative utility a negative offset in style is, by its property. */
const NEGATIVE_OFFSETS = {
  top: "top",
  right: "right",
  bottom: "bottom",
  left: "left",
  inset: "inset",
  insetInline: "inset-x",
  insetBlock: "inset-y",
  insetInlineStart: "start",
  insetInlineEnd: "end",
  textIndent: "indent",
};

/**
 * The sentence a literal length in style ends with, by the role its property plays: the token on
 * that scale with the value (` On the spacing scale 16px is space.200: token("space.200").`), the
 * one or two nearest, a size's statement with no token name, or "" for a property no scale owns, a
 * value that is not one length, or a length off its scale. `render(words)` is the message with
 * them, which they are fitted to: the longest that keeps it within the limit, else "".
 */
export function styleLengthHint(property, value, render = (words) => words) {
  const role = STYLE_ROLES.find(({ props }) => props.test(property))?.role;
  // Half an element's size rounds it into a circle or a pill: radius.full.
  const length = role === "radius" && String(value).trim() === "50%" ? 9999 : lengthPx(value);
  if (!role || length === undefined || !scalesNow()) return "";
  if (role === "size") {
    const dimension = /Height|^height|Block/.test(property) ? "height" : "width";
    return fitted(
      [` A ${dimension} is a layout part's, a part's preset or computed from its container.`, ""],
      render,
    );
  }
  // A negative offset is the negative utility at its step (top: -8 is -top-100), where Tailwind
  // negates one; a negative padding or gap is no CSS, and no hint.
  if (length < 0) {
    const utility = role === "space" && NEGATIVE_OFFSETS[property];
    const hint = utility && spaceAdvice(utility, length, true);
    if (!hint?.exact && !hint?.options.length) return "";
    const words = hint.exact
      ? ` On the spacing scale ${px(length)} is ${hint.exact.cls} (${hint.exact.token}).`
      : ` Nearest on the spacing scale: ${either(hint.options.map((option) => `${option.cls} (-${px(option.value)})`))}.`;
    return fitted([words, ""], render);
  }
  const hint =
    role === "space"
      ? spaceAdvice("p", length, false)
      : role === "border width"
        ? borderAdvice(length)
        : role === "radius"
          ? radiusAdvice(length)
          : typeAdvice(length);
  if (!hint || (!hint.exact && !hint.options.length)) return "";
  const scale = role === "space" ? "spacing" : role;
  // A type token is a class (font-body), which sets the size with its line height and weight.
  const call = (option) =>
    role === "type"
      ? `${option.cls}${option.extra ? `, which also sets ${option.extra}` : ""}`
      : `token("${option.token}")`;
  let words;
  if (hint.pill)
    words = ` ${hint.value} rounds its ends as a pill: ${hint.options[0].token}, ${call(hint.options[0])}.`;
  else if (hint.exact)
    words =
      role === "type"
        ? ` On the type scale ${hint.value} is ${hint.exact.cls}.`
        : ` On the ${scale} scale ${hint.value} is ${hint.exact.token}: ${call(hint.exact)}.`;
  else if (hint.options.every((option) => px(option.value) === hint.value))
    words = ` On the ${scale} scale ${hint.value} is ${either(hint.options.map(call))}.`;
  else
    words = ` Nearest on the ${scale} scale: ${either(hint.options.map((option) => `${call(option)} (${px(option.value)})`))}.`;
  return fitted([words, ""], render);
}

/** The prefix whose tokens a style property's colour takes. */
const STYLE_COLOUR = [
  [/^color$/, "text"],
  [/^(background|backgroundColor)$/, "bg"],
  [/^border(\w*Color)?$/, "border"],
  [/^(fill|stroke)$/, "fill"],
];

/**
 * The sentence a literal colour in style ends with: the roles its hue plays for the property,
 * named as tokens (` Red is token("color.text.danger") or token("color.text.accent.red").`), or
 * the one token it matches in both modes; "" for a colour or a property no role reaches.
 */
export function styleColourHint(property, value, render = (words) => words) {
  const prefix = STYLE_COLOUR.find(([props]) => props.test(property))?.[1];
  const found = scalesNow();
  const lab = prefix && found && parseColour(value);
  if (!lab) return "";
  const seen = seenColour(lab, alphaOf(value), found.surface);
  const advice = nearestColour({
    prefix,
    ...seen,
    hue: hueOfLab(lab, found.anchors),
    modes: "fixed",
  });
  if (!advice) return "";
  const words = colourWords(advice, (option) => `token("${option.token}")`).map(
    (text) => ` ${text}`,
  );
  return fitted([...words, ""], render);
}

/* ---------- a prop's value: the space step, a width, a state for alpha ---------- */

/**
 * The space step a length is, or the one nearest it: `{ token, px, exact }` (`space.200`, 16,
 * true; 0 is space.0), or undefined for no length, a length no step is near, or stale data. A prop
 * takes one step, so a tie goes to the smaller.
 */
export function nearestSpace(value) {
  const found = scalesNow();
  if (!found || !Number.isFinite(value)) return undefined;
  if (value === 0) return { token: "space.0", px: 0, exact: true };
  const steps = found.space.filter((step) => step.px > 0);
  const { exact, near } = nearestSteps(Math.abs(value), steps, (step) => step.px, 4);
  const step = exact[0] ?? near[0];
  return step && { token: `space.${step.key}`, px: step.px, exact: exact.length > 0 };
}

/** The space steps Bleed takes, narrowest first: those with a negative token (space.negative.*,
    which Bleed's classes read); undefined while the data is stale. */
export function bleedSteps() {
  const found = scalesNow();
  if (!found) return undefined;
  return (found.bleed ??= Object.entries(found.values.tokens)
    .filter(([name, token]) => name.startsWith("space.negative.") && !token.deprecated)
    .sort(([, a], [, z]) => z.px - a.px)
    .map(([name]) => `space.${name.slice("space.negative.".length)}`));
}

/**
 * The px a spacing or sizing class's value is, by what follows its utility (`rest`): a token
 * class's own (`base`, max-w-layout-measure), a Ledger space key's (200), a stock step's (96 is
 * 384px), `px`, or an arbitrary length's ([480px]); undefined for any other (full, md, a variable)
 * or while the data is stale.
 */
export function lengthOfKey(rest, base) {
  const found = scalesNow();
  if (!found || !rest) return undefined;
  const token =
    base && Object.hasOwn(found.values.classes, base)
      ? found.values.tokens[found.values.classes[base]]
      : undefined;
  if (token?.kind === "length" && typeof token.px === "number") return token.px;
  const step = found.space.find((space) => space.key === rest);
  if (step) return step.px;
  if (rest === "px") return 1;
  if (/^\d+(?:\.\d+)?$/.test(rest)) return Number(rest) * (lengthPx(found.stock.spacing) ?? 4);
  const bracket = /^\[(.+)\]$/.exec(rest)?.[1];
  return bracket === undefined ? undefined : lengthPx(bracket);
}

/** The px a width class sets (lengthOfKey): w-96, max-w-layout-measure, w-[480px]. */
export const widthOfClass = (base) =>
  lengthOfKey(/^(?:min-w|max-w|w|size)-(.+)$/.exec(base)?.[1], base);

/** A colour token class's emphasis, which its tints are named from (`bg-danger-subtle`). */
const EMPHASIS = /-(?:subtlest|subtler|subtle|bolder|boldest|bold)$/;
/** Where a token's quieter forms are the grey ladder itself (text-subtle, icon-subtlest). */
const GREY_LADDER = new Set(["default", "subtle", "subtlest", "bold"]);

/**
 * The state tokens an alpha on a token colour stands for (`bg-brand-bold/80`), from the tokens
 * that exist in the lint data: `{ token, state, tints, states }`, or undefined while the data is
 * stale or for a class that is no alpha on a colour token. `token` is the class without its alpha,
 * bare. `state` is the one token its variant asks for (`hover:bg-neutral/50` is
 * bg-neutral-hovered), when there is one. Otherwise by the alpha: at /30 or below a tint, the
 * token's subtle, subtler or subtlest form (or the grey ladder's), only one quieter than the token
 * itself, the two nearest the colour the alpha makes over the page in both modes; at /60 or above
 * its own hovered and pressed states, or its quieter tints where it has no state; in between, the
 * nearest tint and the hovered state. A band with nothing names nothing, never the other band's
 * states. Each option is written under the class's variants.
 */
export function alphaStateAdvice(parsed) {
  const found = scalesNow();
  const match = /^([a-z]+)-([a-z0-9-]+)\/(\d+)$/.exec(parsed.base);
  if (!found || !match) return undefined;
  const [, prefix, suffix, percent] = match;
  const bare = `${prefix}-${suffix}`;
  const { classes, tokens, specialised } = found.values;
  const tokenOf = (cls) => {
    const token = Object.hasOwn(classes, cls) ? tokens[classes[cls]] : undefined;
    return token?.kind === "colour" && !token.deprecated && !specialised.includes(cls)
      ? token
      : undefined;
  };
  const own = tokenOf(bare);
  if (!own) return undefined;
  const named = (cls) => withVariants(parsed, cls);
  const stem = suffix.replace(/-(?:hovered|pressed)$/, "");
  const wanted = stateOf(parsed.variants);
  if (wanted === "hovered" || wanted === "pressed") {
    const cls = `${prefix}-${stem}-${wanted}`;
    if (cls !== bare && tokenOf(cls))
      return { token: bare, state: named(cls), tints: [], states: [] };
  }
  const alpha = Number(percent) / 100;
  const states = ["hovered", "pressed"]
    .map((state) => `${prefix}-${stem}-${state}`)
    .filter((cls) => cls !== bare && tokenOf(cls));
  const tone = stem.replace(EMPHASIS, "");
  const ladder = GREY_LADDER.has(stem) || GREY_LADDER.has(tone) ? ["subtle", "subtlest"] : [];
  // What the alpha makes of the token over the page, in each mode.
  const seen = (mode) =>
    found.surface ? seenColour(own.oklab[mode], alpha, found.surface)[mode] : own.oklab[mode];
  const [light, dark] = [seen("light"), seen("dark")];
  // Alpha only ever moves a colour towards the page, so a tint offered for it is one nearer the
  // page than the token itself, in both modes on average (text-subtlest has none; text-subtle is
  // louder than it).
  const fromPage = (oklab) =>
    found.surface
      ? (colourDistance(oklab.light, found.surface.light) +
          colourDistance(oklab.dark, found.surface.dark)) /
        2
      : 0;
  const quieter = (cls) => fromPage(tokenOf(cls).oklab) < fromPage(own.oklab);
  const tints = [
    ...["subtle", "subtler", "subtlest"].map((emphasis) => `${prefix}-${tone}-${emphasis}`),
    ...ladder.map((emphasis) => `${prefix}-${emphasis}`),
  ]
    .filter(
      (cls, index, all) =>
        cls !== bare && all.indexOf(cls) === index && tokenOf(cls) && quieter(cls),
    )
    .map((cls) => {
      const { oklab } = tokenOf(cls);
      const rank = (colourDistance(light, oklab.light) + colourDistance(dark, oklab.dark)) / 2;
      return { cls, rank };
    })
    .sort((a, z) => a.rank - z.rank)
    .map(({ cls }) => cls);
  const pick =
    alpha <= 0.3
      ? { tints: tints.slice(0, 2), states: [] }
      : alpha >= 0.6
        ? { tints: [], states }
        : { tints: tints.slice(0, 1), states: states.slice(0, 1) };
  // A strong alpha on a token with no states of its own (text-default/60) is one of its quieter
  // tints. A faint one with no tint names nothing: a faded colour is no hovered one, and the
  // rule's own words (a tint or a state is its own token) stand.
  if (alpha >= 0.6 && !states.length) pick.tints = tints.slice(0, 2);
  return {
    token: bare,
    state: undefined,
    tints: pick.tints.map(named),
    states: pick.states.map(named),
  };
}
