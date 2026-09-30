// What to write in place of a layout class, a margin, a length in style or an overlay's width: a
// part and its props with their token values, computed from what was written. use-primitives
// names Inline for a flex row, Stack for a flex column, Grid for a grid and Box for padding;
// no-margin a Stack or an Inline with its space, or Bleed; no-style-design-value a padding's or a
// gap's utility and prop; overlay-width-preset the step nearest the width, from each overlay's own
// map (components.json's presets, which build/lint-inventory.mjs reads from the part's source).
//
// A Ledger space key names its token by itself; any other length (a stock step, an arbitrary
// value) goes through nearest.js, which reads the lint data the first time a finding needs it.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SPACE_KEYS } from "./classes.js";
import { bleedSteps, lengthOfKey, lengthPx, nearestSpace } from "./nearest.js";

const here = path.dirname(fileURLToPath(import.meta.url));

/* ---------- a space value ---------- */

/** A px length as a message writes it: `13px`, `1.5px`. */
const px = (value) => `${Number(value.toFixed(2))}px`;

/**
 * The space token a class's key stands for, as a prop value: `{ token, exact, from }` for a Ledger
 * key (`200` is space.200), or for a stock step or an arbitrary length, the step it is or the one
 * nearest it (`from` is the length written, when it is not the step's own); undefined when the key
 * is no length the scale is near (a variable, `auto`) or the data is stale.
 */
export function spaceOfKey(key) {
  if (SPACE_KEYS.has(key)) return { token: `space.${key}`, exact: true };
  const length = lengthOfKey(key);
  const step = length === undefined ? undefined : nearestSpace(length);
  return step && { token: step.token, exact: step.exact, from: step.exact ? "" : px(length) };
}

/** `prop="space.200"`, `prop="space.150"` for the step nearest a length, or `prop="space.…"`. */
const spaceProp = (prop, space) => `${prop}="${space?.token ?? "space.…"}"`;
/** What a list of props says of the lengths it is nearest to: ` (nearest 13px)`, or "". */
const nearestNote = (spaces) => {
  const from = [...new Set(spaces.map((space) => space?.from).filter(Boolean))];
  return from.length ? ` (nearest ${from.join(" and ")})` : "";
};

/** `a` or `a and b`, `a, b and c`. */
const all = (items) =>
  items.length < 2 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
/** A sentence's first letter in capitals. */
const sentence = (text) => `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
/** `<Part a="b">`, or `<Part>` with no props. */
const tag = (part, props) => `<${[part, ...props].join(" ")}>`;

/* ---------- use-primitives: the part and its props ---------- */

/** Box's padding prop for each padding utility; the physical sides take the logical prop. */
const PADDING_PROP = {
  p: "padding",
  px: "paddingInline",
  py: "paddingBlock",
  pt: "paddingBlockStart",
  pb: "paddingBlockEnd",
  ps: "paddingInlineStart",
  pl: "paddingInlineStart",
  pe: "paddingInlineEnd",
  pr: "paddingInlineEnd",
};
/** Each part's prop for a gap on each axis (`gap`, `gap-x`, `gap-y`). A Stack's space is its row
    gap, so a column gap has no Stack prop. */
const GAP_PROP = {
  Stack: { "": "space", y: "space" },
  Inline: { "": "space", x: "space", y: "rowSpace" },
  Flex: { "": "gap", x: "columnGap", y: "rowGap" },
  Grid: { "": "gap", x: "columnGap", y: "rowGap" },
};
/** The window breakpoints Grid's templateColumns takes a template for (grid.tsx's
    ResponsiveTemplate), `base` the one with no breakpoint. */
export const GRID_BREAKPOINTS = ["base", "sm", "md", "lg", "xl"];
/** What each layout primitive already is, as a finding says it. */
const IS = {
  Stack: "a Stack is already a flex column",
  Inline: "an Inline is already a flex row",
  Flex: "a Flex is already flex",
  Grid: "a Grid is already a grid",
};
const LAYOUT = new Set(["Stack", "Inline", "Flex", "Grid"]);
/** The layout primitives use-primitives reads classes against. */
export const PRIMITIVES = new Set(["Box", ...LAYOUT]);
/** The plain elements use-primitives reads, whose layout is a primitive's. */
export const PLAIN_LAYOUT =
  /^(div|span|section|article|aside|header|footer|main|nav|ul|ol|li|form|fieldset|p|label|h[1-6])$/;
/** An article for a part: `an Inline`, `a Stack`. */
const a = (part) => `${/^[AEIOU]/.test(part) ? "an" : "a"} ${part}`;

/** What a layout class sets that a primitive's prop should, with no variant but a window
    breakpoint on a grid template: padding, gap, display, grid, or undefined. */
export function layoutKind({ base, variants }) {
  if (variants.some((variant) => variant.startsWith("@"))) return undefined;
  if (/^-?(p|px|py|pt|pb|pl|pr|ps|pe)-/.test(base)) return variants.length ? undefined : "padding";
  if (/^gap(-x|-y)?-/.test(base) && base !== "gap-px") return variants.length ? undefined : "gap";
  if (/^(flex|inline-flex|grid|inline-grid)$/.test(base))
    return variants.length ? undefined : "display";
  return /^grid-(cols|rows)-/.test(base) ? "grid" : undefined;
}

/**
 * The prop a layout primitive takes for one padding or gap class, `{ name, on }`, as the value
 * advice names it where use-primitives reports the class: a padding is Box's (`paddingBlock`, on a
 * Box unless the element is one), a gap the prop of the part the element is or becomes (a flex
 * column is a Stack, a flex row an Inline, a grid a Grid; a gap alone a Stack, or an Inline for a
 * column gap), and a column gap on a Stack an Inline's space, since a Stack has none.
 */
export function layoutProp({ part, base, classes = [] }) {
  const [, utility] = /^(p[xytblrse]?|gap(?:-[xy])?)-/.exec(base) ?? [];
  if (!utility) return undefined;
  if (utility.startsWith("p"))
    return { name: PADDING_PROP[utility] ?? "padding", on: part === "Box" ? "" : " on a Box" };
  const axis = utility === "gap-x" ? "x" : utility === "gap-y" ? "y" : "";
  const bases = classes.filter(({ variants }) => !variants.length).map((found) => found.base);
  const target = LAYOUT.has(part)
    ? part
    : bases.some((found) => /^(inline-)?grid$|^grid-(cols|rows)-/.test(found))
      ? "Grid"
      : bases.some((found) => /^flex-col/.test(found))
        ? "Stack"
        : bases.some((found) => /^(inline-)?flex$/.test(found)) || axis === "x"
          ? "Inline"
          : "Stack";
  const name = GAP_PROP[target][axis];
  if (!name) return { name: "space", on: " on an Inline, since a Stack has no column gap" };
  return { name, on: target === part ? "" : ` on ${a(target)}` };
}

/** A grid template class's value as Grid's prop takes it: `repeat(3, minmax(0, 1fr))`, the
    tracks of an arbitrary template, or undefined (none, subgrid). */
function template(value) {
  if (/^\d+$/.test(value)) return `repeat(${value}, minmax(0, 1fr))`;
  const tracks = /^\[(.+)\]$/.exec(value)?.[1];
  return tracks?.replace(/_/g, " ");
}

/**
 * The advice for layout classes, as one sentence richest first, for fitted(): the part the classes
 * make (a grid template or a grid display is a Grid, flex a Stack with flex-col and an Inline
 * without it, a gap alone a Stack, or an Inline for a column gap alone, padding alone a Box) and
 * its props with their token values, on `part` (a primitive) or in place of a plain element
 * (`part` undefined). `classes` are the layout classes found, each with its `kind` (layoutKind);
 * `column` says the element also has flex-col.
 */
export function layoutAdvice({ part, classes, column }) {
  const of = (kind) => classes.filter((found) => found.kind === kind);
  const paddings = of("padding").map(({ base }) => {
    const [, minus, utility, key] = /^(-?)(p[xytblrse]?)-(.+)$/.exec(base) ?? [];
    const space = minus || !utility ? undefined : spaceOfKey(key);
    return { prop: PADDING_PROP[utility] ?? "padding", space };
  });
  const gaps = of("gap").map(({ base }) => {
    const [, axis = "", key] = /^gap(?:-([xy]))?-(.+)$/.exec(base) ?? [];
    return { axis, base, space: key === undefined ? undefined : spaceOfKey(key) };
  });
  const displays = of("display").map(({ base }) => base);
  const templates = of("grid").map(({ base, variants }) => {
    const [, axis, value] = /^grid-(cols|rows)-(.+)$/.exec(base) ?? [];
    // Only a window breakpoint Grid keys: any other variant (a Ledger breakpoint such as aside:,
    // a state such as hover:, two at once) is none of templateColumns' keys.
    const breakpoint = variants.length === 0 ? "base" : variants.length === 1 ? variants[0] : "";
    return { axis, breakpoint, value: template(value ?? "") };
  });

  const grid = templates.length > 0 || displays.some((display) => /grid$/.test(display));
  const flex = displays.some((display) => /flex$/.test(display));
  const target = grid
    ? "Grid"
    : flex
      ? LAYOUT.has(part) && part !== "Grid"
        ? part
        : column
          ? "Stack"
          : "Inline"
      : gaps.length
        ? LAYOUT.has(part)
          ? part
          : gaps.every(({ axis }) => axis === "x")
            ? "Inline"
            : "Stack"
        : LAYOUT.has(part)
          ? part
          : "Box";

  // The target's props, with values and without.
  const props = [];
  const bare = [];
  const add = (prop, value) => {
    props.push(value === undefined ? prop : `${prop}=${value}`);
    bare.push(prop);
  };
  if (target === "Grid")
    for (const axis of ["cols", "rows"]) {
      const written = templates.filter((found) => found.axis === axis);
      if (!written.length) continue;
      const prop = axis === "cols" ? "templateColumns" : "templateRows";
      const values = written.filter(({ value }) => value !== undefined);
      const responsive = written.some(({ breakpoint }) => breakpoint !== "base");
      const unkeyed = written.some(({ breakpoint }) => !GRID_BREAKPOINTS.includes(breakpoint));
      // templateRows takes one template; templateColumns one per window breakpoint, and only those
      // GRID_BREAKPOINTS names.
      if (unkeyed && axis === "cols") add(`${prop} (it keys ${all(GRID_BREAKPOINTS)} only)`);
      else if (!values.length || (responsive && axis === "rows")) add(prop);
      else if (!responsive) add(prop, `"${values[0].value}"`);
      else
        add(
          prop,
          `{{ ${values.map(({ breakpoint, value }) => `${breakpoint}: "${value}"`).join(", ")} }}`,
        );
    }
  // The gap that sets a prop's axis itself (gap-y for a Stack's space) wins over one that sets
  // both (gap); a gap the target has no prop for (a column gap on a Stack) is dropped.
  const dropped = [];
  if (target !== "Box")
    for (const { axis, space, base } of [...gaps].sort(
      (one, other) => (one.axis ? 0 : 1) - (other.axis ? 0 : 1),
    )) {
      const prop = GAP_PROP[target][axis];
      if (!prop) dropped.push(base);
      else if (!bare.includes(prop)) add(prop, `"${space?.token ?? "space.…"}"`);
    }
  if (target === "Inline" && displays.includes("inline-flex")) add("display", '"inline-flex"');
  const padding = paddings.map(({ prop, space }) => spaceProp(prop, space));
  const paddingBare = paddings.map(({ prop }) => prop);
  const near = nearestNote(
    [...paddings, ...gaps.filter(({ base }) => !dropped.includes(base))].map(({ space }) => space),
  );

  const words = (withValues) => {
    const shown = withValues ? props : bare;
    const pad = withValues ? padding : paddingBare;
    const note = withValues ? near : "";
    if (target === part) {
      const clauses = [];
      // A display the part has already, or one it has no prop for (inline-flex is Inline's).
      const drop = displays.filter((display) => !(part === "Inline" && display === "inline-flex"));
      if (drop.length && part !== "Box") clauses.push(`drop ${all(drop)} (${IS[part]})`);
      if (dropped.length) clauses.push(`drop ${all(dropped)} (${a(part)} has no column gap)`);
      if (shown.length) clauses.push(`use ${all(shown)}`);
      if (pad.length)
        clauses.push(
          part === "Box"
            ? `use ${all(pad)}`
            : `wrap it in ${tag("Box", pad)} (${a(part)} has no padding)`,
        );
      return sentence(`${all(clauses)}${note}`);
    }
    const layout = tag(target, shown);
    if (target === "Box") return sentence(`use ${tag("Box", pad)}${note}`);
    if (part === "Box")
      return sentence(
        pad.length
          ? `use ${all(pad)}, and put its children in ${layout} inside it${note}`
          : `use ${layout} in its place: a Box is a block${note}`,
      );
    if (pad.length) return sentence(`use ${layout} inside ${tag("Box", pad)}${note}`);
    return sentence(`use ${layout}${part ? " in its place" : ""}${note}`);
  };
  return [words(true), words(false)];
}

/* ---------- no-margin: the parent's space, or Bleed ---------- */

/** A margin utility's axis: block, inline, or all sides. */
const AXIS = { m: "all", mx: "inline", ms: "inline", me: "inline", ml: "inline", mr: "inline" };

/**
 * A margin's advice, richest first, for fitted(), and whether it is negative: `{ negative, words }`.
 * A margin between siblings is the parent's space, on a Stack for the block axis and an Inline for
 * the inline axis, at the margin's step (`mt-4` is space.200); a negative margin (`-mt-4`,
 * `mt-negative-200`, `mt-[-4px]`) pulls a child out to its parent's edge, which is Bleed on that
 * axis, at a step Bleed takes (space.025 to space.400, the negative space tokens).
 */
export function marginAdvice(base) {
  const [, minus, utility, rest] = /^(-?)(m[xytblrse]?|mbs|mbe)(?:-(.+))?$/.exec(base) ?? [];
  const bracketed = /^\[\s*-/.test(rest ?? "");
  const negative = minus === "-" || /^negative-/.test(rest ?? "") || bracketed;
  // The step at the margin's size, whichever way it pulls.
  const key = bracketed ? rest.replace(/^\[\s*-/, "[") : rest?.replace(/^negative-/, "");
  const space = key === undefined ? undefined : spaceOfKey(key);
  const axis = AXIS[utility] ?? "block";
  const near = nearestNote([space]);
  if (negative) {
    const prop = axis === "all" ? "all" : axis;
    const bleed = space && bleedStep(space.token);
    if (space && !bleed)
      return {
        negative,
        words: [
          `A child pulled out to its parent's edge is <Bleed ${prop}>, which goes to ${BLEED_WIDEST()}${near}; a wider pull is the parent's layout.`,
          `A child pulled out to its parent's edge is <Bleed ${prop}>, which goes to ${BLEED_WIDEST()}.`,
        ],
      };
    return {
      negative,
      words: [
        `A child pulled out to its parent's edge is <Bleed ${spaceProp(prop, space)}>${near}, at the parent's padding.`,
        `A child pulled out to its parent's edge is <Bleed ${prop}>.`,
      ],
    };
  }
  const value = spaceProp("space", space);
  const lead = "Space between siblings belongs to their parent:";
  return {
    negative,
    words:
      axis === "inline"
        ? [`${lead} an Inline with ${value}${near}.`, `${lead} an Inline's space.`]
        : axis === "all"
          ? [
              `${lead} a Stack with ${value}${near}, or an Inline for a row.`,
              `${lead} a Stack's or an Inline's space.`,
            ]
          : [`${lead} a Stack with ${value}${near}.`, `${lead} a Stack's space.`],
  };
}

/** Whether Bleed takes a space step: one with a negative token (space.negative.*), which the lint
    data holds; true while the data cannot say. */
const bleedStep = (token) => {
  const steps = bleedSteps();
  return !steps || steps.includes(token);
};
/** Bleed's widest step, as a finding names it. */
const BLEED_WIDEST = () => bleedSteps()?.at(-1) ?? "space.400";

/* ---------- no-style-design-value: a padding's or a gap's class and prop ---------- */

/** Each padding or gap property in style, with its utility and the prop that takes its step. */
const STYLE_SPACE = {
  padding: ["p", 'padding="…" on a Box'],
  paddingTop: ["pt", 'paddingBlockStart="…" on a Box'],
  paddingBlockStart: ["pt", 'paddingBlockStart="…" on a Box'],
  paddingBottom: ["pb", 'paddingBlockEnd="…" on a Box'],
  paddingBlockEnd: ["pb", 'paddingBlockEnd="…" on a Box'],
  paddingBlock: ["py", 'paddingBlock="…" on a Box'],
  paddingLeft: ["pl", 'paddingInlineStart="…" on a Box'],
  paddingInlineStart: ["ps", 'paddingInlineStart="…" on a Box'],
  paddingRight: ["pr", 'paddingInlineEnd="…" on a Box'],
  paddingInlineEnd: ["pe", 'paddingInlineEnd="…" on a Box'],
  paddingInline: ["px", 'paddingInline="…" on a Box'],
  gap: ["gap", 'space="…" on a Stack or an Inline'],
  rowGap: ["gap-y", 'space="…" on a Stack'],
  columnGap: ["gap-x", 'space="…" on an Inline'],
};

/**
 * What to write for a padding or a gap in style whose length is a space step exactly (`16px`), with
 * no period, or undefined for any other property or length, whose words stay the style rule's own.
 * `element` says where the style is written: `{ kit, plain, part }`, the kit's own source, a plain
 * element use-primitives reads, or the layout primitive it is. In a product, a plain element's or a
 * primitive's padding or gap is its primitive's prop alone (`Use padding="space.200" on a Box`),
 * since use-primitives reports the utility there, and a gap on a Box a Stack's or an Inline's in its
 * place; on any other element the prop leads and the utility follows. In the kit, the utility
 * leads (`Use p-200, or padding="space.200" on a Box`).
 */
export function styleSpaceUse(property, value, { kit = false, plain = false, part } = {}) {
  const entry = STYLE_SPACE[property];
  const length = entry && lengthPx(value);
  const step = length === undefined ? undefined : nearestSpace(length);
  if (!step?.exact || length < 0) return undefined;
  const [utility, prop] = entry;
  const cls = `${utility}-${step.token.slice("space.".length)}`;
  const named = prop.replace("…", step.token);
  if (kit) return `Use ${cls}, or ${named}`;
  const gap = utility.startsWith("gap");
  if (plain || PRIMITIVES.has(part)) {
    // A Box is a block, with no gap: the part that has one goes in its place.
    if (gap && part === "Box") return `Use ${named} in the Box's place`;
    const { name, on } = layoutProp({ part, base: cls, classes: [] });
    return `Use ${name}="${step.token}"${on}`;
  }
  return `Use ${named}, or ${cls}`;
}

/* ---------- overlay-width-preset: the nearest step of the part's own map ---------- */

/** Each sized overlay's steps (components.json's presets): `{ prop, steps: { name: px | null } }`. */
export const OVERLAY_PRESETS =
  JSON.parse(fs.readFileSync(path.join(here, "components.json"), "utf8")).presets ?? {};

/**
 * What a sized overlay takes in place of a width written by hand, as a sentence: the step of its
 * own map nearest `width` (px, when the lint can read one), both when two are as near, or every
 * step; for a DrawerContent, which takes none, that it spans the window's edge.
 */
export function presetAdvice(part, width) {
  const preset = OVERLAY_PRESETS[part];
  if (!preset) return "A drawer spans the window's edge and takes no width: drop it.";
  const steps = Object.entries(preset.steps);
  const value = (name, size) => `${preset.prop}="${name}"${size === null ? "" : ` (${size}px)`}`;
  const sized = steps.filter(([, size]) => size !== null);
  if (width !== undefined && sized.length) {
    const distance = (size) => Math.abs(size - width);
    const best = Math.min(...sized.map(([, size]) => distance(size)));
    const nearest = sized.filter(([, size]) => distance(size) === best);
    const named = nearest.map(([name, size]) => value(name, size)).join(" or ");
    const which =
      best === 0
        ? "the step of that width"
        : nearest.length > 1
          ? "the nearest steps"
          : "the nearest step";
    return `Use ${named}, ${which}; the kit owns the steps and their narrowing to the window.`;
  }
  const listed = steps.map(([name, size]) => value(name, size));
  return `Use ${listed.slice(0, -1).join(", ")} or ${listed.at(-1)}; the kit owns the steps and their narrowing to the window.`;
}
