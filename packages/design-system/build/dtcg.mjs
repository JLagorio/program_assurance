// Explicit boundary from Ledger's CSS-oriented source dialect to DTCG Format/Color 2025.10.
export const DTCG_VERSION = "2025.10";
const ref = (value) => typeof value === "string" && /^\{[^}]+\}$/.test(value);
const dimension = (value) => {
  const match = String(value).match(/^(-?[\d.]+)(px|rem)$/);
  if (!match) throw new Error(`Unsupported DTCG dimension: ${value}`);
  return { value: Number(match[1]), unit: match[2] };
};
const color = (value) => {
  if (value === "transparent") return { colorSpace: "srgb", components: [0, 0, 0], alpha: 0 };
  const match = String(value).match(/^oklch\(([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)$/);
  if (!match) throw new Error(`Unsupported DTCG color: ${value}`);
  return {
    colorSpace: "oklch",
    components: match.slice(1, 4).map(Number),
    ...(match[4] ? { alpha: Number(match[4]) } : {}),
  };
};
const shadow = (value) =>
  String(value)
    .split(/,\s*(?![^()]*\))/)
    .map((layer) => {
      const match = layer.match(/^(.*?)\s+(oklch\(.+\))$/);
      if (!match) throw new Error(`Unsupported DTCG shadow: ${layer}`);
      const lengths = match[1]
        .trim()
        .split(/\s+/)
        .map((v) => dimension(v === "0" ? "0px" : v));
      return {
        offsetX: lengths[0],
        offsetY: lengths[1],
        blur: lengths[2] ?? dimension("0px"),
        spread: lengths[3] ?? dimension("0px"),
        color: color(match[2]),
      };
    });

/** Preserve source token paths and aliases. Each mode is a complete, independently importable document. */
export function exportDtcg(source, mode = "light") {
  const tokens = new Map();
  function collect(group, path = [], inherited) {
    const type = group.$type ?? inherited;
    if ("$value" in group) {
      tokens.set(path.join("."), { ...group, $type: type });
      return;
    }
    for (const [key, value] of Object.entries(group))
      if (!key.startsWith("$")) collect(value, [...path, key], type);
  }
  collect(source);
  const original = (token) =>
    mode === "dark" ? (token.$extensions?.ledger?.dark ?? token.$value) : token.$value;
  const resolve = (value, seen = new Set()) => {
    if (!ref(value)) return value;
    const name = value.slice(1, -1);
    if (seen.has(name) || !tokens.has(name)) throw new Error(`Invalid token reference ${value}`);
    return resolve(original(tokens.get(name)), new Set([...seen, name]));
  };
  const out = {
    $extensions: {
      "org.ledger.interchange": { format: DTCG_VERSION, mode, sourceDialect: "ledger-css-v1" },
    },
  };
  for (const [path, token] of tokens) {
    const input = original(token);
    let type = token.$type;
    let value = input;
    const extensions = { ...token.$extensions };
    // CSS em tracking is a font-relative ratio. DTCG dimensions admit px/rem only, so retain
    // the ratio as a number token and materialize each typography's tracking at its font size.
    if (type === "dimension" && /em$/.test(String(input)) && !/rem$/.test(String(input))) {
      type = "number";
      value = parseFloat(input);
      extensions["org.ledger.css"] = { unit: "em", sourceType: "dimension" };
    } else if (!ref(input)) {
      if (type === "color") value = color(input);
      else if (type === "dimension") value = dimension(input === 0 ? "0px" : input);
      else if (type === "duration") {
        const match = String(input).match(/^([\d.]+)(ms|s)$/);
        if (!match) throw new Error(`Invalid duration ${input}`);
        value = { value: Number(match[1]), unit: match[2] };
      } else if (type === "shadow") value = shadow(input);
      else if (type === "typography") {
        const size = dimension(resolve(input.fontSize));
        const sizePx = size.value * (size.unit === "rem" ? 16 : 1);
        const line = dimension(resolve(input.lineHeight));
        const tracking = resolve(input.letterSpacing);
        const em = /^(-?[\d.]+)em$/.exec(tracking);
        value = {
          ...input,
          fontSize: ref(input.fontSize) ? input.fontSize : size,
          lineHeight: (line.value * (line.unit === "rem" ? 16 : 1)) / sizePx,
          letterSpacing: em
            ? { value: Number(em[1]) * sizePx, unit: "px" }
            : ref(input.letterSpacing)
              ? input.letterSpacing
              : dimension(tracking),
        };
        extensions["org.ledger.css"] = {
          sourceLineHeight: input.lineHeight,
          sourceLetterSpacing: input.letterSpacing,
        };
      }
    }
    // The separate documents represent mode values; no vendor-only dark override is needed by readers.
    if (extensions.ledger) {
      extensions.ledger = { ...extensions.ledger };
      delete extensions.ledger.dark;
    }
    const parts = path.split(".");
    let group = out;
    for (const part of parts.slice(0, -1)) group = group[part] ??= {};
    group[parts.at(-1)] = {
      $type: type,
      $value: value,
      ...(token.$description ? { $description: token.$description } : {}),
      ...(Object.keys(extensions).length ? { $extensions: extensions } : {}),
    };
  }
  validateDtcg(out);
  return out;
}

/** Conformance checks for the emitted 2025.10 type subset, including aliases and composites. */
export function validateDtcg(document) {
  const tokens = new Map();
  function walk(group, path = []) {
    if ("$value" in group) {
      tokens.set(path.join("."), group);
      return;
    }
    for (const [key, value] of Object.entries(group))
      if (!key.startsWith("$")) walk(value, [...path, key]);
  }
  walk(document);
  const number = (value) => typeof value === "number" && Number.isFinite(value);
  const distance = (v) => v && number(v.value) && ["px", "rem"].includes(v.unit);
  function resolve(value, seen = new Set()) {
    if (!ref(value)) return value;
    const path = value.slice(1, -1);
    if (!tokens.has(path) || seen.has(path)) throw new Error(`Invalid alias ${value}`);
    return resolve(tokens.get(path).$value, new Set([...seen, path]));
  }
  function valid(value, type) {
    const v = resolve(value);
    if (type === "dimension") return distance(v);
    if (type === "duration") return v && number(v.value) && ["ms", "s"].includes(v.unit);
    if (type === "number") return number(v);
    if (type === "fontFamily")
      return typeof v === "string" || (Array.isArray(v) && v.every((s) => typeof s === "string"));
    if (type === "fontWeight") return number(v) && v >= 1 && v <= 1000;
    if (type === "cubicBezier")
      return (
        Array.isArray(v) &&
        v.length === 4 &&
        v.every(number) &&
        [v[0], v[2]].every((n) => n >= 0 && n <= 1)
      );
    if (type === "color")
      return (
        v &&
        ["oklch", "srgb"].includes(v.colorSpace) &&
        Array.isArray(v.components) &&
        v.components.length === 3 &&
        v.components.every(number) &&
        (v.alpha === undefined || (number(v.alpha) && v.alpha >= 0 && v.alpha <= 1))
      );
    if (type === "shadow")
      return (Array.isArray(v) ? v : [v]).every(
        (s) =>
          s &&
          ["offsetX", "offsetY", "blur", "spread"].every((key) => valid(s[key], "dimension")) &&
          valid(s.color, "color"),
      );
    if (type === "typography")
      return (
        v &&
        valid(v.fontFamily, "fontFamily") &&
        valid(v.fontWeight, "fontWeight") &&
        valid(v.fontSize, "dimension") &&
        valid(v.letterSpacing, "dimension") &&
        number(resolve(v.lineHeight))
      );
    return false;
  }
  for (const [path, token] of tokens)
    if (!valid(token.$value, token.$type)) throw new Error(`Invalid DTCG ${token.$type}: ${path}`);
  return tokens.size;
}
