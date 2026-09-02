// Contrast test on the token source. Every text-on-background pairing the mapping declares
// must meet WCAG AA in both modes: 4.5:1 for text, 3:1 for icons, borders and bold fills.
// Run: npm test -w @ledger/design-system
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/* ---- load + resolve the DTCG source ---- */
const tree = {};
const deep = (a, b) => { for (const [k, v] of Object.entries(b)) a[k] = v && typeof v === "object" && !Array.isArray(v) ? deep(a[k] ?? {}, v) : v; return a; };
for (const f of fs.readdirSync(path.join(root, "tokens")).filter((f) => f.endsWith(".json")))
  deep(tree, JSON.parse(fs.readFileSync(path.join(root, "tokens", f), "utf8")));

function node(dotted) {
  let n = tree;
  for (const seg of dotted.split(".")) n = n?.[seg];
  if (n && !("$value" in n) && n.default) n = n.default;
  return n;
}
function value(dotted, mode) {
  const n = node(dotted);
  if (!n) throw new Error(`no token ${dotted}`);
  let v = mode === "dark" ? (n.$extensions?.ledger?.dark ?? n.$value) : n.$value;
  while (typeof v === "string" && /^\{.+\}$/.test(v.trim())) v = value(v.trim().slice(1, -1), mode);
  return v;
}

/* ---- colour maths: oklch → linear sRGB → luminance ---- */
function parse(css) {
  if (css === "transparent") return null;
  const m = css.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)/);
  if (!m) throw new Error(`cannot parse ${css}`);
  const [, L, C, H, A] = m.map(Number);
  const a = C * Math.cos((H * Math.PI) / 180), b = C * Math.sin((H * Math.PI) / 180);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, mm = m_ ** 3, s = s_ ** 3;
  const clamp = (x) => Math.min(1, Math.max(0, x));
  return {
    r: clamp(4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s),
    g: clamp(-1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s),
    b: clamp(-0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s),
    a: Number.isNaN(A) ? 1 : A,
  };
}
const over = (fg, bg) => ({ r: fg.a * fg.r + (1 - fg.a) * bg.r, g: fg.a * fg.g + (1 - fg.a) * bg.g, b: fg.a * fg.b + (1 - fg.a) * bg.b, a: 1 });
const lum = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
const ratio = (fg, bg) => { const [hi, lo] = [lum(fg), lum(bg)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

/** Resolve a background token to an opaque colour by compositing over the surface. */
function fill(token, mode) {
  const surface = parse(value("elevation.surface", mode));
  const c = parse(value(token, mode));
  return c === null ? surface : over(c, surface);
}
function ink(token, mode, bg) {
  const c = parse(value(token, mode));
  return c.a < 1 ? over(c, bg) : c;
}

/* ---- the pairings ---- */
const status = ["danger", "warning", "success", "information"];
const surfaces = ["elevation.surface", "elevation.surface.sunken", "elevation.surface.raised", "elevation.surface.overlay", "color.background.input"];
// Interactive neutral fills: guaranteed for text and text.subtle. Atlassian does not promise
// text.subtlest on these either (dark DarkNeutral700 on DarkNeutral200A sits near 3.4:1).
const neutralFills = ["color.background.neutral", "color.background.neutral.subtle.hovered"];

const cases = [];
const add = (fg, bg, min, note = "") => cases.push({ fg, bg, min, note });

for (const t of ["color.text", "color.text.subtle", "color.text.subtlest"]) for (const s of surfaces) add(t, s, 4.5);
for (const t of ["color.text", "color.text.subtle"]) for (const s of neutralFills) add(t, s, 4.5);
for (const s of ["color.background.selected", "color.background.brand.subtlest"]) add("color.text", s, 4.5), add("color.text.selected", s, 4.5);
for (const b of ["color.background.neutral.bold", "color.background.brand.bold", "color.background.brand.boldest", "color.background.selected.bold", "color.background.danger.bold", "color.background.success.bold", "color.background.information.bold"])
  add("color.text.inverse", b, 4.5), add("color.icon.inverse", b, 3);
add("color.text.warning.inverse", "color.background.warning.bold", 4.5);
add("color.icon.warning.inverse", "color.background.warning.bold", 3);
for (const s of status) {
  add(`color.text.${s}`, `color.background.${s}`, 4.5);
  add(`color.text.${s}`, `color.background.${s}.subtler`, 4.5);
  add(`color.text.${s}.bolder`, `color.background.${s}.subtle`, 4.5);
  add(`color.text.${s}`, "elevation.surface", 4.5);
  add(`color.icon.${s}`, "elevation.surface", 3);
  add(`color.border.${s}`, "elevation.surface", 3);
  // warning.bold is a light orange carrying dark text (text.warning.inverse), as in Atlassian; it is not a 3:1 fill on white.
  if (s !== "warning") add(`color.background.${s}.bold`, "elevation.surface", 3, "bold fill as a non-text element");
}
for (const t of ["color.text.brand", "color.text.selected"]) add(t, "elevation.surface", 4.5);
for (const t of ["color.icon", "color.icon.subtle", "color.icon.subtlest", "color.icon.brand", "color.icon.selected"]) add(t, "elevation.surface", 3);
for (const b of ["color.border.bold", "color.border.focused", "color.border.input", "color.border.selected", "color.border.brand"]) add(b, "elevation.surface", 3);
for (const b of ["color.background.neutral.bold", "color.background.brand.bold", "color.background.selected.bold"]) add(b, "elevation.surface", 3, "bold fill as a non-text element");

const results = [];
for (const mode of ["light", "dark"]) {
  for (const c of cases) {
    const bg = fill(c.bg, mode);
    const fg = c.fg.startsWith("color.background") ? fill(c.fg, mode) : ink(c.fg, mode, bg);
    results.push({ ...c, mode, ratio: ratio(fg, bg) });
  }
}

const failures = results.filter((r) => r.ratio < r.min);
if (process.env.CONTRAST_REPORT) {
  for (const r of results) console.log(`${r.ratio < r.min ? "FAIL" : "ok  "} ${r.mode.padEnd(5)} ${r.ratio.toFixed(2).padStart(5)} ≥ ${r.min}  ${r.fg} on ${r.bg}`);
}

test(`contrast: ${results.length} pairings, both modes`, () => {
  const lines = failures.map((r) => `${r.mode} ${r.ratio.toFixed(2)} < ${r.min}: ${r.fg} on ${r.bg}${r.note ? ` (${r.note})` : ""}`);
  assert.equal(failures.length, 0, `\n${lines.join("\n")}\n`);
});
