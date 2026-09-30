// What a colour is, as the lint reads one: the CSS named colours, a parser for the literal forms
// (hex, the named colours, rgb(), hsl(), hwb(), oklch(), oklab() and color(srgb …)) into OKLab, and
// the test the style and SVG rules share for a colour written as a literal. Ported from @shadcn/lint
// (MIT): grammar/colors.ts, and the colour reading of rules/no-inline-styles.ts.

/** The 148 CSS named colours, as sRGB hex. `transparent` and `currentColor` are keywords, not
    named colours: they defer to the cascade. */
export const NAMED_COLOURS = Object.freeze({
  aliceblue: "#f0f8ff",
  antiquewhite: "#faebd7",
  aqua: "#00ffff",
  aquamarine: "#7fffd4",
  azure: "#f0ffff",
  beige: "#f5f5dc",
  bisque: "#ffe4c4",
  black: "#000000",
  blanchedalmond: "#ffebcd",
  blue: "#0000ff",
  blueviolet: "#8a2be2",
  brown: "#a52a2a",
  burlywood: "#deb887",
  cadetblue: "#5f9ea0",
  chartreuse: "#7fff00",
  chocolate: "#d2691e",
  coral: "#ff7f50",
  cornflowerblue: "#6495ed",
  cornsilk: "#fff8dc",
  crimson: "#dc143c",
  cyan: "#00ffff",
  darkblue: "#00008b",
  darkcyan: "#008b8b",
  darkgoldenrod: "#b8860b",
  darkgray: "#a9a9a9",
  darkgreen: "#006400",
  darkgrey: "#a9a9a9",
  darkkhaki: "#bdb76b",
  darkmagenta: "#8b008b",
  darkolivegreen: "#556b2f",
  darkorange: "#ff8c00",
  darkorchid: "#9932cc",
  darkred: "#8b0000",
  darksalmon: "#e9967a",
  darkseagreen: "#8fbc8f",
  darkslateblue: "#483d8b",
  darkslategray: "#2f4f4f",
  darkslategrey: "#2f4f4f",
  darkturquoise: "#00ced1",
  darkviolet: "#9400d3",
  deeppink: "#ff1493",
  deepskyblue: "#00bfff",
  dimgray: "#696969",
  dimgrey: "#696969",
  dodgerblue: "#1e90ff",
  firebrick: "#b22222",
  floralwhite: "#fffaf0",
  forestgreen: "#228b22",
  fuchsia: "#ff00ff",
  gainsboro: "#dcdcdc",
  ghostwhite: "#f8f8ff",
  gold: "#ffd700",
  goldenrod: "#daa520",
  gray: "#808080",
  green: "#008000",
  greenyellow: "#adff2f",
  grey: "#808080",
  honeydew: "#f0fff0",
  hotpink: "#ff69b4",
  indianred: "#cd5c5c",
  indigo: "#4b0082",
  ivory: "#fffff0",
  khaki: "#f0e68c",
  lavender: "#e6e6fa",
  lavenderblush: "#fff0f5",
  lawngreen: "#7cfc00",
  lemonchiffon: "#fffacd",
  lightblue: "#add8e6",
  lightcoral: "#f08080",
  lightcyan: "#e0ffff",
  lightgoldenrodyellow: "#fafad2",
  lightgray: "#d3d3d3",
  lightgreen: "#90ee90",
  lightgrey: "#d3d3d3",
  lightpink: "#ffb6c1",
  lightsalmon: "#ffa07a",
  lightseagreen: "#20b2aa",
  lightskyblue: "#87cefa",
  lightslategray: "#778899",
  lightslategrey: "#778899",
  lightsteelblue: "#b0c4de",
  lightyellow: "#ffffe0",
  lime: "#00ff00",
  limegreen: "#32cd32",
  linen: "#faf0e6",
  magenta: "#ff00ff",
  maroon: "#800000",
  mediumaquamarine: "#66cdaa",
  mediumblue: "#0000cd",
  mediumorchid: "#ba55d3",
  mediumpurple: "#9370db",
  mediumseagreen: "#3cb371",
  mediumslateblue: "#7b68ee",
  mediumspringgreen: "#00fa9a",
  mediumturquoise: "#48d1cc",
  mediumvioletred: "#c71585",
  midnightblue: "#191970",
  mintcream: "#f5fffa",
  mistyrose: "#ffe4e1",
  moccasin: "#ffe4b5",
  navajowhite: "#ffdead",
  navy: "#000080",
  oldlace: "#fdf5e6",
  olive: "#808000",
  olivedrab: "#6b8e23",
  orange: "#ffa500",
  orangered: "#ff4500",
  orchid: "#da70d6",
  palegoldenrod: "#eee8aa",
  palegreen: "#98fb98",
  paleturquoise: "#afeeee",
  palevioletred: "#db7093",
  papayawhip: "#ffefd5",
  peachpuff: "#ffdab9",
  peru: "#cd853f",
  pink: "#ffc0cb",
  plum: "#dda0dd",
  powderblue: "#b0e0e6",
  purple: "#800080",
  rebeccapurple: "#663399",
  red: "#ff0000",
  rosybrown: "#bc8f8f",
  royalblue: "#4169e1",
  saddlebrown: "#8b4513",
  salmon: "#fa8072",
  sandybrown: "#f4a460",
  seagreen: "#2e8b57",
  seashell: "#fff5ee",
  sienna: "#a0522d",
  silver: "#c0c0c0",
  skyblue: "#87ceeb",
  slateblue: "#6a5acd",
  slategray: "#708090",
  slategrey: "#708090",
  snow: "#fffafa",
  springgreen: "#00ff7f",
  steelblue: "#4682b4",
  tan: "#d2b48c",
  teal: "#008080",
  thistle: "#d8bfd8",
  tomato: "#ff6347",
  turquoise: "#40e0d0",
  violet: "#ee82ee",
  wheat: "#f5deb3",
  white: "#ffffff",
  whitesmoke: "#f5f5f5",
  yellow: "#ffff00",
  yellowgreen: "#9acd32",
});

/** Whether a value is one of the CSS named colours (`fill="red"`), as a whole word in any case. */
export const isNamedColour = (value) =>
  Object.hasOwn(NAMED_COLOURS, String(value).trim().toLowerCase());

/* ---------- parsing into OKLab ---------- */

function linear(channel) {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function fromRgb(r, g, b) {
  const lr = linear(r);
  const lg = linear(g);
  const lb = linear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function hslToRgb(h, s, l) {
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0), f(8), f(4)];
}

function fromHwb(h, w, b) {
  if (w + b >= 1) {
    const gray = w / (w + b);
    return fromRgb(gray, gray, gray);
  }
  const [r, g, bl] = hslToRgb(h, 1, 0.5);
  const scale = (c) => c * (1 - w - b) + w;
  return fromRgb(scale(r), scale(g), scale(bl));
}

function fromHex(hex) {
  let digits = hex.slice(1);
  if (digits.length === 3 || digits.length === 4)
    digits = [...digits].map((digit) => digit + digit).join("");
  if (digits.length !== 6 && digits.length !== 8) return null;
  if (!/^[0-9a-f]+$/i.test(digits)) return null;
  const n = Number.parseInt(digits.slice(0, 6), 16);
  return fromRgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

/** A colour function's channels, its alpha dropped, in the space or the comma syntax. */
function args(inner) {
  const [channels] = inner.split("/");
  return channels
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 3);
}

/** A channel as a number or a percentage: a number over `scale`, a percentage over 100 times
    `percentScale`; CSS `none` is a missing channel, computed as zero. */
function channel(raw, scale, percentScale = 1) {
  if (raw === "none") return 0;
  if (raw.endsWith("%")) {
    const value = Number(raw.slice(0, -1));
    return Number.isFinite(value) ? (value / 100) * percentScale : null;
  }
  const value = Number(raw.replace(/deg$/, ""));
  return Number.isFinite(value) ? value / scale : null;
}

/**
 * A CSS colour written as a literal, in OKLab (`[l, a, b]`), or null for anything else: a
 * variable, color-mix(), a keyword such as currentColor, or a function whose channels are not all
 * written (`hsl(${hue} 50% 50%)`).
 */
export function parseColour(value) {
  const text = String(value).trim().toLowerCase();
  if (!text) return null;
  if (text.startsWith("#")) return fromHex(text);
  const named = NAMED_COLOURS[text];
  if (named) return fromHex(named);
  const match = text.match(/^([a-z]+)\((.*)\)$/s);
  if (!match) return null;
  const [, fn, inner] = match;
  const parts = args(inner);
  if (parts.length < 3) return null;
  switch (fn) {
    case "rgb":
    case "rgba": {
      const [r, g, b] = parts.map((part) => channel(part, 255));
      return r === null || g === null || b === null ? null : fromRgb(r, g, b);
    }
    case "hsl":
    case "hsla": {
      const [h, s, l] = [channel(parts[0], 1), channel(parts[1], 100), channel(parts[2], 100)];
      if (h === null || s === null || l === null) return null;
      const [r, g, b] = hslToRgb(h, s, l);
      return fromRgb(r, g, b);
    }
    case "hwb": {
      const [h, w, b] = [channel(parts[0], 1), channel(parts[1], 100), channel(parts[2], 100)];
      return h === null || w === null || b === null ? null : fromHwb(h, w, b);
    }
    case "oklch": {
      const [l, c, h] = [channel(parts[0], 1), channel(parts[1], 1, 0.4), channel(parts[2], 1)];
      if (l === null || c === null || h === null) return null;
      const rad = (h * Math.PI) / 180;
      return [l, c * Math.cos(rad), c * Math.sin(rad)];
    }
    case "oklab": {
      const [l, a, b] = [
        channel(parts[0], 1),
        channel(parts[1], 1, 0.4),
        channel(parts[2], 1, 0.4),
      ];
      return l === null || a === null || b === null ? null : [l, a, b];
    }
    case "color": {
      if (parts[0] !== "srgb") return null;
      const [r, g, b] = args(inner.replace(/^\s*srgb\s+/, "")).map((part) => channel(part, 1));
      return r == null || g == null || b == null ? null : fromRgb(r, g, b);
    }
    default:
      return null;
  }
}

/** Perceptual distance between two colours in OKLab: under 0.02 is the same colour. */
export const colourDistance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/* ---------- a colour written as a literal, in a CSS value ---------- */

/** A hex colour, or the opening of a colour function, in a value. color-mix() and light-dark()
    are read by their arguments, since they mix what they are given. */
const COLOUR_CALL = /#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|hwb|oklch|oklab|lab|lch|color)\(/i;
/** Where a value splits into words: whitespace, commas, parentheses and the alpha slash. */
const WORDS = /[^\s,()/]+/g;

/**
 * A CSS value with what carries no colour of its own blanked to spaces of the same length, so a
 * match in it is at the same place in the value: comments, quoted strings (a font name, content),
 * url(…) (`url(#hatch)` names a pattern, `url(/icons/red.svg)` a file) and var(--…) without a
 * fallback. A var()'s fallback is read: it is the colour the page shows wherever the variable is
 * not set (`var(--x, #f00)`).
 */
export function colourText(value) {
  const blankAll = (whole) => " ".repeat(whole.length);
  return value
    .replace(/\/\*[\s\S]*?\*\//g, blankAll)
    .replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, blankAll)
    .replace(/\burl\((?:[^()]|\([^()]*\))*\)/gi, blankAll)
    .replace(/var\(--[\w-]+\)/g, blankAll);
}

/**
 * The first colour written as a literal in a CSS value, as it is written, or null: a hex colour,
 * a colour function whole (`hsl(calc(var(--hue) + 180) 80% 50%)`, at any depth), or a named
 * colour as a whole word, never inside another (`white-space`, `url(/icons/red)`). `written`
 * is the value as the code writes it, where it differs from what is read (a template's `${…}`);
 * `read` is the same value with those parts blanked to the same length.
 */
export function literalColour(read, written = read) {
  let text = colourText(read);
  for (let call = COLOUR_CALL.exec(text); call; call = COLOUR_CALL.exec(text)) {
    if (!call[1]) return written.slice(call.index, call.index + call[0].length);
    let depth = 0;
    let end = -1;
    for (let at = call.index + call[0].length - 1; at < text.length && end < 0; at += 1) {
      if (text[at] === "(") depth += 1;
      else if (text[at] === ")" && --depth === 0) end = at + 1;
    }
    // A call that never closes, by its name.
    if (end < 0) return call[1];
    // Relative colour syntax builds on the colour after `from` (`oklch(from var(--ds-…) l c h /
    // 0.5)`): the call is read by that colour and its own arguments, not as a literal.
    const open = call.index + call[0].length;
    const from = /^\s*from\b/i.exec(text.slice(open, end - 1));
    if (!from) return written.slice(call.index, end);
    // Blank the call's name, `from` and its closing parenthesis, and read what is left.
    const after = open + from[0].length;
    text = `${text.slice(0, call.index)}${" ".repeat(after - call.index)}${text.slice(after, end - 1)} ${text.slice(end)}`;
  }
  for (const word of text.matchAll(WORDS))
    if (isNamedColour(word[0])) return written.slice(word.index, word.index + word[0].length);
  return null;
}
