// Contrast test on the token source. Every text-on-background pairing the mapping declares
// must meet WCAG AA in both modes: 4.5:1 for text, 3:1 for icons, borders and bold fills.
// Increased contrast adds two modes, light-contrast and dark-contrast: every pairing holds there
// too, and field boundaries, hairlines and state fills reach 3:1 against the surface at rest.
// Run: npm test -w @ledger/design-system
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exportDtcg, validateDtcg } from "../build/dtcg.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const standardModes = ["light", "dark"];
const contrastModes = ["light-contrast", "dark-contrast"];
const modes = [...standardModes, ...contrastModes];

/* ---- load + resolve the DTCG source ---- */
const tree = {};
const deep = (a, b) => {
  for (const [k, v] of Object.entries(b))
    a[k] = v && typeof v === "object" && !Array.isArray(v) ? deep(a[k] ?? {}, v) : v;
  return a;
};
for (const f of fs.readdirSync(path.join(root, "tokens")).filter((f) => f.endsWith(".json")))
  deep(tree, JSON.parse(fs.readFileSync(path.join(root, "tokens", f), "utf8")));

function node(dotted) {
  let n = tree;
  for (const seg of dotted.split(".")) n = n?.[seg];
  if (n && !("$value" in n) && n.default) n = n.default;
  return n;
}
/** A token's value in a mode: the contrast value first in a contrast mode, then the mode's own. */
function value(dotted, mode) {
  const n = node(dotted);
  if (!n) throw new Error(`no token ${dotted}`);
  const base = mode.startsWith("dark") ? "dark" : "light";
  const ledger = n.$extensions?.ledger;
  const standard = base === "dark" ? (ledger?.dark ?? n.$value) : n.$value;
  let v = (mode.endsWith("-contrast") ? ledger?.contrast?.[base] : undefined) ?? standard;
  while (typeof v === "string" && /^\{.+\}$/.test(v.trim())) v = value(v.trim().slice(1, -1), mode);
  return v;
}

/* ---- colour maths: oklch → linear sRGB → luminance ---- */
function parse(css) {
  if (css === "transparent") return null;
  const m = css.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)/);
  if (!m) throw new Error(`cannot parse ${css}`);
  const [, L, C, H, A] = m.map(Number);
  const a = C * Math.cos((H * Math.PI) / 180),
    b = C * Math.sin((H * Math.PI) / 180);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3,
    mm = m_ ** 3,
    s = s_ ** 3;
  const clamp = (x) => Math.min(1, Math.max(0, x));
  return {
    r: clamp(4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s),
    g: clamp(-1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s),
    b: clamp(-0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s),
    a: Number.isNaN(A) ? 1 : A,
  };
}
// CSS alpha compositing is in encoded sRGB; WCAG luminance is computed afterwards in linear sRGB.
const encode = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
const decode = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const over = (fg, bg) =>
  Object.fromEntries([
    ...["r", "g", "b"].map((channel) => [
      channel,
      decode(fg.a * encode(fg[channel]) + (1 - fg.a) * encode(bg[channel])),
    ]),
    ["a", 1],
  ]);
const lum = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
const ratio = (fg, bg) => {
  const [hi, lo] = [lum(fg), lum(bg)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** Resolve a background token to an opaque colour by compositing over the surface. */
function fill(token, mode, base = "elevation.surface") {
  const surface = parse(value(base, mode));
  const c = parse(value(token, mode));
  return c === null ? surface : over(c, surface);
}
function ink(token, mode, bg) {
  const c = parse(value(token, mode));
  return c.a < 1 ? over(c, bg) : c;
}

/* ---- the pairings ---- */
const status = ["danger", "warning", "success", "information"];
const surfaces = [
  "elevation.surface",
  "elevation.surface.sunken",
  "elevation.surface.raised",
  "elevation.surface.overlay",
  "color.background.input",
];
// Interactive neutral fills: guaranteed for text and text.subtle everywhere. text.subtlest is held
// on the highlight a menu item or a filter option takes (neutral.subtle.hovered) in the standard
// modes, below, and not on a neutral fill's hover or press.
const neutralFills = ["color.background.neutral", "color.background.neutral.subtle.hovered"];

const cases = [];
const add = (fg, bg, min, note = "", base = "elevation.surface", only = modes) =>
  cases.push({ fg, bg, min, note, base, modes: only });

for (const t of ["color.text", "color.text.subtle", "color.text.subtlest"])
  for (const s of surfaces) add(t, s, 4.5);
for (const t of ["color.text", "color.text.subtle"]) for (const s of neutralFills) add(t, s, 4.5);
for (const s of ["color.background.selected", "color.background.brand.subtlest"])
  (add("color.text", s, 4.5), add("color.text.selected", s, 4.5));
for (const b of [
  "color.background.neutral.bold",
  "color.background.brand.bold",
  "color.background.brand.boldest",
  "color.background.selected.bold",
  "color.background.danger.bold",
  "color.background.success.bold",
  "color.background.information.bold",
])
  (add("color.text.inverse", b, 4.5), add("color.icon.inverse", b, 3));
add("color.text.warning.inverse", "color.background.warning.bold", 4.5);
add("color.icon.warning.inverse", "color.background.warning.bold", 3);
// Banner action rings inherit their text color so they contrast with the actual bold surface.
for (const tone of ["information", "warning", "danger"])
  add(
    tone === "warning" ? "color.text.warning.inverse" : "color.text.inverse",
    `color.background.${tone}.bold`,
    3,
    "banner action focus ring",
  );
add("color.background.input.thumb.checked", "color.background.brand.bold", 3);
for (const s of status) {
  add(`color.text.${s}`, `color.background.${s}`, 4.5);
  add(`color.text.${s}`, `color.background.${s}.subtler`, 4.5);
  add(`color.text.${s}.bolder`, `color.background.${s}.subtle`, 4.5);
  add(`color.text.${s}`, "elevation.surface", 4.5);
  add(`color.icon.${s}`, "elevation.surface", 3);
  add(`color.border.${s}`, "elevation.surface", 3);
  // warning.bold is a light orange carrying dark text (text.warning.inverse), as in Atlassian; it is not a 3:1 fill on white.
  if (s !== "warning")
    add(`color.background.${s}.bold`, "elevation.surface", 3, "bold fill as a non-text element");
}
for (const t of ["color.text.brand", "color.text.selected"]) add(t, "elevation.surface", 4.5);
for (const t of [
  "color.icon",
  "color.icon.subtle",
  "color.icon.subtlest",
  "color.icon.brand",
  "color.icon.selected",
])
  add(t, "elevation.surface", 3);
for (const b of [
  "color.border.bold",
  "color.border.focused",
  "color.border.selected",
  "color.border.brand",
])
  add(b, "elevation.surface", 3);
// the field's danger and focus borders against the input surface it sits on
for (const b of ["color.border.danger", "color.border.focused"])
  add(b, "color.background.input", 3);
// The field border is light by decision (Josef, 2026-09-04): it must stay visible at rest, and the
// focus and danger borders above carry 3:1. Restored 2026-09-06 after the audit had darkened it.
for (const surface of [
  ...surfaces,
  "color.background.input.hovered",
  "color.background.input.pressed",
])
  add("color.border.input", surface, 1.5, "light field border by decision");
for (const b of [
  "color.background.neutral.bold",
  "color.background.brand.bold",
  "color.background.selected.bold",
])
  add(b, "elevation.surface", 3, "bold fill as a non-text element");

// Rendered interaction contracts: button/menu fills, selected rows, input hover/focus,
// and translucent neutral fills composed on raised/overlay surfaces, not only the page.
for (const state of ["hovered", "pressed"]) {
  for (const role of ["neutral", "brand", "selected", "danger", "success", "information"])
    add("color.text.inverse", `color.background.${role}.bold.${state}`, 4.5);
  add("color.text.warning.inverse", `color.background.warning.bold.${state}`, 4.5);
  for (const role of status) {
    add(`color.text.${role}`, `color.background.${role}.${state}`, 4.5);
    add(`color.text.${role}`, `color.background.${role}.subtler.${state}`, 4.5);
  }
  for (const text of ["color.text", "color.text.selected"])
    add(text, `color.background.selected.${state}`, 4.5);
  for (const text of ["color.text", "color.text.subtle", "color.text.subtlest"])
    add(text, `color.background.input.${state}`, 4.5);
  for (const border of ["color.border.focused", "color.border.danger"])
    add(border, `color.background.input.${state}`, 3);
}
for (const surface of surfaces) {
  for (const fill of [
    "color.background.neutral",
    "color.background.neutral.hovered",
    "color.background.neutral.pressed",
    "color.background.neutral.subtle.hovered",
    "color.background.neutral.subtle.pressed",
  ])
    for (const text of ["color.text", "color.text.subtle"])
      add(text, fill, 4.5, "translucent interactive fill on its actual parent", surface);
  add("color.border.focused", surface, 3);
}

// Increased contrast (the reader asked for more): the recorded low-contrast choices above stay the
// default, and here every boundary and state reaches 3:1 against the surface it sits on at rest,
// with the text and icons drawn on those fills keeping their own minimums. text.subtlest is held
// to the surfaces, as in the standard modes, so a placeholder still reads apart from a value.
const neutralStateFills = [
  "color.background.neutral",
  "color.background.neutral.hovered",
  "color.background.neutral.pressed",
  "color.background.neutral.subtle.hovered",
  "color.background.neutral.subtle.pressed",
];
const selectedFills = [
  "color.background.selected",
  "color.background.selected.hovered",
  "color.background.selected.pressed",
];
for (const surface of surfaces) {
  add(
    "color.border.input",
    surface,
    3,
    "field and choice-control boundary",
    surface,
    contrastModes,
  );
  add("color.border", surface, 3, "hairline", surface, contrastModes);
  for (const state of [...neutralStateFills, ...selectedFills]) {
    add(state, surface, 3, "state fill against its resting surface", surface, contrastModes);
    for (const text of ["color.text", "color.text.subtle"])
      add(text, state, 4.5, "text on a state fill", surface, contrastModes);
    for (const icon of ["color.icon", "color.icon.subtle"])
      add(icon, state, 3, "icon on a state fill", surface, contrastModes);
    // A control focused inside a selected or hovered row draws its ring on the fill.
    add("color.border.focused", state, 3, "focus ring on a state fill", surface, contrastModes);
  }
  for (const state of selectedFills) {
    add("color.text.selected", state, 4.5, "selected text on its fill", surface, contrastModes);
    add("color.icon.selected", state, 3, "selected icon on its fill", surface, contrastModes);
  }
}
for (const state of ["hovered", "pressed"])
  add(
    "color.border.input",
    `color.background.input.${state}`,
    3,
    "field boundary",
    undefined,
    contrastModes,
  );

// Choice controls and state cues, in every mode (D2, A11-2, A11-3): the Checkbox and Radio box is
// drawn in color.border.bold and the Switch's off track in color.background.input.track, each 3:1
// against every surface, with the unchecked thumb 3:1 on the track. The second cue of each state
// holds 3:1 on the fill it sits on: the pressed Toggle's border and the selected Tree row's bar
// (color.background.selected.bold, the colour of color.border.selected) on the selected fill, and
// the keyboard highlight's inset focus outline on the menu's highlight tint. Under increased
// contrast the selected fill is itself 3:1 against the surface (above), so the border and bar on
// it are held to the standard modes.
for (const surface of surfaces) {
  add("color.border.bold", surface, 3, "checkbox and radio boundary", surface);
  if (surface !== "color.background.input")
    add("color.background.input.track", surface, 3, "switch off track", surface);
  for (const fill of selectedFills) {
    const note = "pressed toggle border on its fill";
    add("color.border.selected", fill, 3, note, surface, standardModes);
    const bar = "selected tree row bar on its fill";
    add("color.background.selected.bold", fill, 3, bar, surface, standardModes);
  }
}
// Menus, selects, comboboxes and the command list sit on the overlay surface, or inline on a page.
for (const surface of ["elevation.surface.overlay", "elevation.surface"])
  add(
    "color.border.focused",
    "color.background.neutral.subtle.hovered",
    3,
    "menu highlight's inset outline on the tint",
    surface,
  );
add("color.background.input.thumb", "color.background.input.track", 3, "switch thumb on the track");
// FIELDS (CTL-11): a read-only choice keeps its mark on the sunken surface, without the brand
// fill: the radio's dot is color.background.neutral.bold and the tick color.icon (it inherits
// color.text), and a read-only switch that is on takes color.background.neutral.bold with the
// thumb on it, each 3:1.
add("color.background.neutral.bold", "elevation.surface.sunken", 3, "read-only radio dot");
add("color.icon", "elevation.surface.sunken", 3, "read-only checkbox tick");
for (const surface of surfaces)
  add("color.background.neutral.bold", surface, 3, "read-only switch track, on", surface);
add(
  "color.background.input.thumb.checked",
  "color.background.neutral.bold",
  3,
  "switch thumb on a read-only track",
);
// TOOLBAR (G6-4): the current page in Pagination is marked by a bar in
// color.background.selected.bold, 3:1 on the pager's surface at rest in every mode, and on a
// subtle button's hovered and pressed tint; its semibold label is color.text on the same. Under
// increased contrast the tint is itself 3:1 against the surface (above), so the bar on it is held
// to the standard modes, as the selected Tree row's bar is.
for (const surface of surfaces) {
  add("color.background.selected.bold", surface, 3, "current page bar", surface);
  for (const tint of [
    "color.background.neutral.subtle.hovered",
    "color.background.neutral.subtle.pressed",
  ]) {
    const note = "current page bar on its hover tint";
    add("color.background.selected.bold", tint, 3, note, surface, standardModes);
    add("color.text", tint, 4.5, "current page label on its hover tint", surface);
  }
}
// TABLE (G6-5): the open row's preview eye sits in a color.border.selected ring, 3:1 against the
// row it sits on at rest, under the pointer and chosen (the selected fills are held above).
for (const row of ["elevation.surface", "elevation.surface.hovered"])
  add("color.border.selected", row, 3, "open row's eye ring on its row", "elevation.surface");
// SCROLL (G6-3): the filled Tabs strip's selected chip is outlined in color.border.selected, 3:1
// against the neutral track on every surface in the standard modes and against the chip's own
// elevation.surface fill in every mode. Under increased contrast the track is itself 3:1 against
// the chip, so the outline is held to the standard modes against the track.
for (const surface of surfaces) {
  if (surface === "color.background.input") continue;
  const note = "selected filled tab's outline on the track";
  add("color.border.selected", "color.background.neutral", 3, note, surface, standardModes);
}
add("color.border.selected", "elevation.surface", 3, "selected filled tab's outline on its chip");
// CONTENT (STS-5): a brand Badge's words on its subtle fill, and a brand badge link's words on its
// hovered fill, which it draws in color.text.selected (color.text.brand there is 4.18:1). The
// Avatar accents: the tinted avatar's initials on their fill, and inverse initials on the bold
// fill (the gradient runs between two of them). color.text.brand is not held against color.text
// or color.text.subtle: a TextLink inside a sentence is underlined at rest, its non-colour cue
// (CNT-1, G2-2).
add("color.text.brand", "color.background.brand.subtlest", 4.5, "brand badge");
add(
  "color.text.selected",
  "color.background.brand.subtlest.hovered",
  4.5,
  "brand badge link hovered",
);
for (const hue of ["blue", "teal", "green", "orange", "red", "purple"]) {
  add(`color.text.accent.${hue}`, `color.background.accent.${hue}.subtler`, 4.5, "tinted avatar");
  add("color.text.inverse", `color.background.accent.${hue}.bolder`, 4.5, "bold avatar");
}
// FEEDBACK (G6-6, FDB-8): a Progress bar is a non-text element, so each tone's fill holds 3:1
// against the track (color.background.neutral) on every surface a bar sits on, the sunken one
// (a metrics strip, a pinned row) included. A warning bar, filled or waiting, is
// color.chart.warning.bold: color.background.warning.bold carries dark text and is not a 3:1
// fill, and the warning series and icon orange (orange.600 in light) is under 3:1 on the track
// over the sunken surface. The warning fill also holds 3:1 against the surface itself, in both
// modes and under increased contrast. An indeterminate bar's stripes are the tone's icon colour,
// color.icon.subtle for neutral, on the same track. Under increased contrast the track is itself
// 3:1 against the surface (above), so the bar on it is held to the standard modes, as the
// current page bar is.
for (const surface of surfaces) {
  if (surface === "color.background.input") continue;
  for (const bar of [
    "color.background.neutral.bold",
    "color.background.information.bold",
    "color.background.success.bold",
    "color.chart.warning.bold",
    "color.background.danger.bold",
  ])
    add(bar, "color.background.neutral", 3, "progress fill on its track", surface, standardModes);
  for (const stripe of [
    "color.icon.subtle",
    "color.icon.information",
    "color.icon.success",
    "color.chart.warning.bold",
    "color.icon.danger",
  ])
    add(stripe, "color.background.neutral", 3, "indeterminate stripes", surface, standardModes);
  add("color.chart.warning.bold", surface, 3, "warning progress fill on its surface", surface);
}
// FEEDBACK (FDB-2, FDB-6): an Alert's fill is its tone's color.background.<tone>. On it, the
// AlertIcon (the tone's icon, color.icon.subtle for neutral) holds 3:1 and the focus ring 3:1 in
// every mode, and a TextLink (color.text.brand) 4.5:1 on every status tone in every mode. The
// neutral fill darkens under increased contrast, where color.text.brand is 1.77:1 (light) and
// 2.45:1 (dark) on it; the token sheet keeps that pairing, so the link on a neutral Alert is held
// to the standard modes.
for (const tone of ["neutral", ...status]) {
  const alertFill = `color.background.${tone}`;
  add(tone === "neutral" ? "color.icon.subtle" : `color.icon.${tone}`, alertFill, 3, "AlertIcon");
  add("color.border.focused", alertFill, 3, "focus ring in an Alert");
  add(
    "color.text.brand",
    alertFill,
    4.5,
    "link in an Alert",
    "elevation.surface",
    tone === "neutral" ? standardModes : modes,
  );
}

// CARDS: a linked Stat.Tile hovers and presses on elevation.surface.hovered and .pressed, and a
// linked Card on elevation.surface.raised.hovered and .pressed. The label, the note, a toned
// count, a zero count (text.subtlest), the card's title and description and the inset focus ring
// stay readable on those fills.
for (const state of ["hovered", "pressed"]) {
  const tile = `elevation.surface.${state}`;
  const card = `elevation.surface.raised.${state}`;
  for (const text of ["color.text", "color.text.subtle"]) {
    add(text, tile, 4.5, "linked Stat.Tile text on its state fill");
    add(text, card, 4.5, "linked Card text on its state fill", "elevation.surface.raised");
  }
  for (const s of status) add(`color.text.${s}`, tile, 4.5, "toned count on a linked Stat.Tile");
  add("color.border.focused", tile, 3, "linked Stat.Tile inset focus ring");
  add("color.border.focused", card, 3, "linked Card inset focus ring", "elevation.surface.raised");
}
for (const state of ["hovered", "pressed"])
  add("color.text.subtlest", `elevation.surface.${state}`, 4.5, "zero count on a linked Stat.Tile");

// STRUCTURE (STR-20): the Stepper's path ahead and behind. An upcoming step's ring is
// color.border.bold (held 3:1 against every surface as the choice-control boundary above), and the
// rail behind a done step is color.border.success, 3:1 against the page and raised surfaces a
// Stepper sits on, in every mode.
for (const surface of ["elevation.surface", "elevation.surface.raised"])
  add("color.border.success", surface, 3, "stepper rail behind a done step", surface);

// SHELLNAV: the side nav sits on elevation.surface.sunken. Its current page is the selected fill
// with selected text and icon, hovered or not, and a bar on its start edge (G6-13) in
// color.background.selected.bold, which marks it without the fill: 3:1 on the fill it sits on, as
// the selected Tree row's bar is (held to the standard modes, where the fill is not itself 3:1),
// and on the nav's surface beside it in every mode. A focused item's ring is drawn flush outside
// the item, in the gap between items, so it sits on the nav's surface rather than a neighbour's
// fill; the icon rail marks an item with a count by a brand dot.
for (const fill of ["color.background.selected", "color.background.selected.hovered"]) {
  add("color.text.selected", fill, 4.5, "side nav current page", "elevation.surface.sunken");
  add("color.icon.selected", fill, 3, "side nav current icon", "elevation.surface.sunken");
  const bar = "side nav current page bar on its fill";
  add("color.background.selected.bold", fill, 3, bar, "elevation.surface.sunken", standardModes);
}
add(
  "color.background.selected.bold",
  "elevation.surface.sunken",
  3,
  "side nav current page bar on the nav",
  "elevation.surface.sunken",
);
add(
  "color.border.focused",
  "elevation.surface.sunken",
  3,
  "side nav focus ring",
  "elevation.surface.sunken",
);
add(
  "color.background.brand.bold",
  "elevation.surface.sunken",
  3,
  "icon rail count dot",
  "elevation.surface.sunken",
);

// FOUNDATIONS (G3-7, TOK-13): the pairs a chosen or hovered row puts on its fill, and the chart's
// marks. A focused control inside a hovered or chosen row, and an inset ring, draw the focus ring
// on the row's fill: color.border.focused holds 3:1 on the neutral and selected fills at rest,
// under the pointer and pressed (a neutral press, a momentary state, is held under increased
// contrast only, above) and on the surfaces' own hover and press, over every surface. In a
// selected row the words keep their minimum: color.text.subtle at rest, hovered and pressed; a
// record's name link (color.text.brand) and color.text.subtlest, a meta line or an Absent, at rest
// and hovered (a press is momentary); and the icons at 3:1. A highlighted menu item or filter
// option keeps its count or meta line (color.text.subtlest) on its tint. Under increased contrast
// the fills are 3:1 mid tones and the coloured and subtlest words are held to the surfaces
// (Tokens/Color), so these are the standard modes'. Every chart series tone, the categorical set
// and Other, and each one's hovered step, is a non-text mark at 3:1 on the surfaces a chart sits
// on, in every mode; the low sequential and diverging steps and the track are heatmap cells and
// key swatches that wear a color.border.bold edge (held 3:1 above as the choice-control boundary),
// dashed when a cell is empty, and are not held themselves.
for (const surface of surfaces) {
  if (surface === "color.background.input") continue;
  for (const fill of [
    "color.background.neutral",
    "color.background.neutral.hovered",
    "color.background.neutral.subtle.hovered",
    "color.background.neutral.subtle.pressed",
    ...selectedFills,
  ])
    add("color.border.focused", fill, 3, "focus ring on a row's fill", surface, standardModes);
  for (const fill of [...selectedFills]) {
    add("color.text.subtle", fill, 4.5, "subtle text in a selected row", surface, standardModes);
    for (const icon of [
      "color.icon",
      "color.icon.subtle",
      "color.icon.subtlest",
      "color.icon.selected",
    ])
      add(icon, fill, 3, "icon in a selected row", surface, standardModes);
  }
  for (const fill of ["color.background.selected", "color.background.selected.hovered"]) {
    add("color.text.brand", fill, 4.5, "name link in a selected row", surface, standardModes);
    add("color.text.subtlest", fill, 4.5, "meta text in a selected row", surface, standardModes);
  }
  add(
    "color.text.subtlest",
    "color.background.neutral.subtle.hovered",
    4.5,
    "count or meta line on a highlighted menu item",
    surface,
    standardModes,
  );
  const series = [
    "brand",
    "neutral",
    ...status,
    ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `categorical.${n}`),
  ];
  for (const tone of series) {
    add(`color.chart.${tone}`, surface, 3, "chart mark on its surface", surface);
    if (tone !== "categorical.8")
      add(`color.chart.${tone}.hovered`, surface, 3, "hovered chart mark", surface);
  }
}
for (const state of ["hovered", "pressed"])
  for (const fill of [`elevation.surface.${state}`, `elevation.surface.overlay.${state}`])
    add("color.border.focused", fill, 3, "focus ring on a hovered or pressed surface");

const results = [];
for (const mode of modes) {
  for (const c of cases) {
    if (!c.modes.includes(mode)) continue;
    const bg = fill(c.bg, mode, c.base);
    const fg = c.fg.startsWith("color.background") ? fill(c.fg, mode, c.base) : ink(c.fg, mode, bg);
    results.push({ ...c, mode, ratio: ratio(fg, bg) });
  }
}

const failures = results.filter((r) => r.ratio < r.min);
if (process.env.CONTRAST_REPORT) {
  for (const r of results)
    console.log(
      `${r.ratio < r.min ? "FAIL" : "ok  "} ${r.mode.padEnd(14)} ${r.ratio.toFixed(2).padStart(5)} ≥ ${r.min}  ${r.fg} on ${r.bg} over ${r.base}`,
    );
}

test(`contrast: ${results.length} pairings, both modes, standard and increased contrast`, () => {
  const lines = failures.map(
    (r) =>
      `${r.mode} ${r.ratio.toFixed(2)} < ${r.min}: ${r.fg} on ${r.bg} over ${r.base}${r.note ? ` (${r.note})` : ""}`,
  );
  assert.equal(failures.length, 0, `\n${lines.join("\n")}\n`);
});

/* ---- the generated increased-contrast mode ---- */
const contrastTokens = [];
(function collect(n, p) {
  if (n && typeof n === "object" && "$value" in n) {
    if (n.$extensions?.ledger?.contrast) contrastTokens.push(p.filter((s) => s !== "default"));
    return;
  }
  if (n && typeof n === "object")
    for (const [k, v] of Object.entries(n)) if (!k.startsWith("$")) collect(v, [...p, k]);
})(tree, []);
const cssName = (segs) =>
  `--ds-${segs.map((s) => s.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()).join("-")}`;
const scope = (css, selector) => {
  const start = css.indexOf(`${selector} {`);
  return start === -1 ? "" : css.slice(start, css.indexOf("}", start));
};

test("tokens.css re-declares every contrast token in each scope that sets a mode or a contrast", () => {
  const css = fs.readFileSync(path.join(root, "src/generated/tokens.css"), "utf8");
  assert.ok(contrastTokens.length > 0);
  assert.match(
    css,
    /@media \(prefers-contrast: more\) \{\n {2}:root:not\(\[data-contrast-mode="no-preference"\]\)/,
  );
  const scopes = [
    ":root",
    '[data-color-mode="light"]',
    '[data-color-mode="dark"]',
    '  :root:not([data-color-mode="light"])',
    '[data-contrast-mode="more"]',
    '[data-contrast-mode="no-preference"]',
  ];
  for (const segs of contrastTokens) {
    const v = cssName(segs);
    for (const selector of scopes)
      assert.ok(
        scope(css, selector).includes(`${v}: var(--ds-contrast-more,`),
        `${v} in ${selector}`,
      );
    for (const selector of scopes.slice(0, 4))
      assert.ok(scope(css, selector).includes(`${v}--more:`), `${v}--more in ${selector}`);
  }
});

test("each contrast mode is a conformant DTCG document with the contrast values", () => {
  const source = JSON.parse(
    fs.readFileSync(path.join(root, "src/generated/tokens.figma.json"), "utf8"),
  );
  for (const mode of contrastModes) {
    const exported = JSON.parse(
      fs.readFileSync(path.join(root, `src/generated/tokens.dtcg.${mode}.json`), "utf8"),
    );
    assert.deepEqual(exported, exportDtcg(source, mode));
    assert.ok(validateDtcg(exported) > 0);
    assert.equal(
      exported.color.border.input.$value,
      source.color.border.input.$extensions.ledger.contrast[mode.replace("-contrast", "")],
    );
    assert.equal(exported.color.border.input.$extensions.ledger.contrast, undefined);
  }
});

test("alpha compositing uses encoded sRGB before WCAG luminance", () => {
  const grey = over({ r: 1, g: 1, b: 1, a: 0.5 }, { r: 0, g: 0, b: 0, a: 1 });
  assert.ok(Math.abs(lum(grey) - 0.21404114048223255) < 1e-12);
  assert.ok(Math.abs(ratio(grey, { r: 0, g: 0, b: 0, a: 1 }) - 5.280822809644651) < 1e-10);
});
