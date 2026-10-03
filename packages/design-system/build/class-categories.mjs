// The class categories the token build writes into lint.json (build/lint-data.mjs): the grammar
// the kit's cn() merges classes by (tailwind-merge's default config with src/generated's merge
// config), each of its groups' category, and each kit @utility's categories from the CSS it sets.
// eslint-plugin/categories.js reads them; nothing loads tailwind-merge at lint time.
//
// Every group is listed below by name, layout included, so a group a new tailwind-merge adds, or
// one the merge config adds, stops the build until it is placed. The table starts from
// @shadcn/lint's GROUP_CATEGORY (lint/src/grammar/categories.ts), with the kit's own `icon` group
// as colour and the text-flow groups (truncation, clamping, wrapping, hyphens) as layout: where a
// line breaks is the caller's, as `whitespace` and `break` already are.
import {
  CATEGORIES,
  VALIDATORS,
  groupInGrammar,
  propertiesCategories,
} from "../eslint-plugin/categories.js";
import { hookClasses, markers } from "../eslint-plugin/classes.js";

/** Each category's tailwind-merge groups. */
export const GROUP_CATEGORIES = {
  layout: [
    ...["aspect", "container", "container-type", "container-named", "columns"],
    ...["break-after", "break-before", "break-inside", "box-decoration", "box", "display", "sr"],
    ...["float", "clear", "isolation", "object-fit", "object-position"],
    ...["overflow", "overflow-x", "overflow-y", "overscroll", "overscroll-x", "overscroll-y"],
    ...["position", "inset", "inset-x", "inset-y", "start", "end", "inset-bs", "inset-be"],
    ...["top", "right", "bottom", "left", "visibility", "z"],
    ...["basis", "flex-direction", "flex-wrap", "flex", "grow", "shrink", "order"],
    ...["grid-cols", "col-start-end", "col-start", "col-end"],
    ...["grid-rows", "row-start-end", "row-start", "row-end"],
    ...["grid-flow", "auto-cols", "auto-rows"],
    ...["justify-content", "justify-items", "justify-self"],
    ...["align-content", "align-items", "align-self", "place-content", "place-items", "place-self"],
    ...["m", "mx", "my", "ms", "me", "mbs", "mbe", "mt", "mr", "mb", "ml"],
    ...["size", "inline-size", "min-inline-size", "max-inline-size"],
    ...["block-size", "min-block-size", "max-block-size"],
    ...["w", "min-w", "max-w", "h", "min-h", "max-h"],
    ...["text-alignment", "tab-size", "vertical-align", "whitespace", "break", "wrap", "content"],
    // Text flow: where a line breaks, cuts or clamps.
    ...["text-overflow", "text-wrap", "line-clamp", "hyphens"],
    ...["border-collapse", "table-layout", "caption"],
    ...["backface", "perspective", "perspective-origin"],
    ...["rotate", "rotate-x", "rotate-y", "rotate-z"],
    ...["scale", "scale-x", "scale-y", "scale-z", "scale-3d", "skew", "skew-x", "skew-y"],
    ...["transform", "transform-origin", "transform-style"],
    ...["translate", "translate-x", "translate-y", "translate-z", "translate-none", "zoom"],
    ...["appearance", "color-scheme", "cursor", "field-sizing", "pointer-events", "resize"],
    ...["scroll-behavior", "scrollbar-gutter", "scrollbar-w"],
    ...["scroll-m", "scroll-mx", "scroll-my", "scroll-ms", "scroll-me", "scroll-mbs", "scroll-mbe"],
    ...["scroll-mt", "scroll-mr", "scroll-mb", "scroll-ml"],
    ...["scroll-p", "scroll-px", "scroll-py", "scroll-ps", "scroll-pe", "scroll-pbs", "scroll-pbe"],
    ...["scroll-pt", "scroll-pr", "scroll-pb", "scroll-pl"],
    ...["snap-align", "snap-stop", "snap-type", "snap-strictness"],
    ...["touch", "touch-x", "touch-y", "touch-pz", "select", "will-change", "forced-color-adjust"],
  ],
  spacing: [
    ...["gap", "gap-x", "gap-y", "p", "px", "py", "ps", "pe", "pbs", "pbe"],
    ...["pt", "pr", "pb", "pl", "space-x", "space-x-reverse", "space-y", "space-y-reverse"],
    ...["border-spacing", "border-spacing-x", "border-spacing-y"],
  ],
  color: [
    ...["placeholder-color", "text-color", "text-decoration-color", "bg-color", "icon"],
    ...["gradient-from", "gradient-via", "gradient-to"],
    ...["border-color", "border-color-x", "border-color-y", "border-color-s", "border-color-e"],
    ...["border-color-bs", "border-color-be", "border-color-t", "border-color-r"],
    ...["border-color-b", "border-color-l", "divide-color", "outline-color", "shadow-color"],
    ...["inset-shadow-color", "ring-color", "ring-offset-color", "inset-ring-color"],
    ...["text-shadow-color", "drop-shadow-color", "accent", "caret-color"],
    ...["scrollbar-thumb-color", "scrollbar-track-color", "fill", "stroke"],
    ...["linear", "t", "r", "b", "l", "x", "y", "radial", "conic"].flatMap((side) => [
      `mask-image-${side}-from-color`,
      `mask-image-${side}-to-color`,
    ]),
  ],
  typography: [
    ...["font-size", "font-smoothing", "font-style", "font-weight", "font-stretch"],
    ...["font-family", "font-features", "fvn-normal", "fvn-ordinal", "fvn-slashed-zero"],
    ...["fvn-figure", "fvn-spacing", "fvn-fraction", "tracking", "leading"],
    ...["list-image", "list-style-position", "list-style-type"],
    ...["text-decoration", "text-decoration-style", "text-decoration-thickness"],
    ...["underline-offset", "text-transform", "indent"],
  ],
  shape: [
    ...["rounded", "rounded-s", "rounded-e", "rounded-t", "rounded-r", "rounded-b", "rounded-l"],
    ...["rounded-ss", "rounded-se", "rounded-ee", "rounded-es"],
    ...["rounded-tl", "rounded-tr", "rounded-br", "rounded-bl"],
    ...["border-w", "border-w-x", "border-w-y", "border-w-s", "border-w-e", "border-w-bs"],
    ...["border-w-be", "border-w-t", "border-w-r", "border-w-b", "border-w-l"],
    ...["divide-x", "divide-x-reverse", "divide-y", "divide-y-reverse"],
    ...["border-style", "divide-style", "outline-style", "outline-offset", "outline-w"],
    ...["ring-w", "ring-w-inset", "ring-offset-w", "inset-ring-w", "stroke-w"],
  ],
  effects: [
    ...["bg-attachment", "bg-clip", "bg-origin", "bg-position", "bg-repeat", "bg-size"],
    ...["bg-image", "gradient-from-pos", "gradient-via-pos", "gradient-to-pos"],
    ...["shadow", "inset-shadow", "text-shadow", "opacity", "mix-blend", "bg-blend"],
    ...["mask-clip", "mask-composite", "mask-image-linear-pos"],
    ...["linear", "t", "r", "b", "l", "x", "y", "radial", "conic"].flatMap((side) => [
      `mask-image-${side}-from-pos`,
      `mask-image-${side}-to-pos`,
    ]),
    ...["mask-image-radial", "mask-image-radial-shape", "mask-image-radial-size"],
    ...["mask-image-radial-pos", "mask-image-conic-pos"],
    ...["mask-mode", "mask-origin", "mask-position", "mask-repeat", "mask-size", "mask-type"],
    ...["mask-image", "filter", "blur", "brightness", "contrast", "drop-shadow", "grayscale"],
    ...["hue-rotate", "invert", "saturate", "sepia", "backdrop-filter", "backdrop-blur"],
    ...["backdrop-brightness", "backdrop-contrast", "backdrop-grayscale", "backdrop-hue-rotate"],
    ...["backdrop-invert", "backdrop-opacity", "backdrop-saturate", "backdrop-sepia"],
  ],
  motion: ["transition", "transition-behavior", "duration", "ease", "delay", "animate"],
};

/** A group's category, from GROUP_CATEGORIES. */
const categoryByGroup = new Map(
  Object.entries(GROUP_CATEGORIES).flatMap(([category, groups]) =>
    groups.map((group) => [group, category]),
  ),
);

/**
 * The problems with a grammar's groups against the table, as sentences: a group the table does
 * not place, a group placed twice, a category that is none of CATEGORIES, and a group the table
 * places that the grammar no longer has.
 */
export function groupProblems(groupIds) {
  const problems = [];
  const seen = new Map();
  for (const [category, groups] of Object.entries(GROUP_CATEGORIES)) {
    if (!CATEGORIES.includes(category))
      problems.push(`"${category}" is no category (${CATEGORIES.join(", ")})`);
    for (const group of groups) {
      if (seen.has(group))
        problems.push(`group "${group}" is under both ${seen.get(group)} and ${category}`);
      seen.set(group, category);
    }
  }
  const ids = new Set(groupIds);
  for (const id of groupIds)
    if (!categoryByGroup.has(id))
      problems.push(
        `tailwind-merge group "${id}" has no category in build/class-categories.mjs; add it (layout if it only places or sizes the box)`,
      );
  for (const group of seen.keys())
    if (!ids.has(group))
      problems.push(`group "${group}" in build/class-categories.mjs is no tailwind-merge group`);
  return problems;
}

/**
 * A tailwind-merge config as data: every validator by the name tailwind-merge exports it under
 * (`"$v:isNumber"`), every theme getter by its key (`"$t:spacing"`), strings and paths as
 * written, which never start with `$`. `validators` is tailwind-merge's validators export; a
 * function that is neither throws, naming it.
 */
export function serialiseGrammar(config, validators) {
  const names = new Map(Object.entries(validators).map(([name, fn]) => [fn, name]));
  const probe = Object.fromEntries(Object.keys(config.theme).map((key) => [key, [key]]));
  const definition = (value, where) => {
    if (typeof value === "string") {
      if (value.startsWith("$")) throw new Error(`${where}: "${value}" reads as a marker`);
      return value;
    }
    if (typeof value === "function") {
      if (value.isThemeGetter === true) {
        const [key] = value(probe);
        if (typeof key !== "string") throw new Error(`${where}: a theme getter with no key`);
        return `$t:${key}`;
      }
      const name = names.get(value);
      if (!name)
        throw new Error(
          `${where}: a function that is no tailwind-merge validator; the lint data can only name validators.`,
        );
      if (!Object.hasOwn(VALIDATORS, name))
        throw new Error(
          `${where}: tailwind-merge's validator ${name} has no port in eslint-plugin/categories.js; add it there.`,
        );
      return `$v:${name}`;
    }
    if (value && typeof value === "object") {
      const out = {};
      for (const [path, inner] of Object.entries(value)) {
        if (path.startsWith("$")) throw new Error(`${where}: a path "${path}" reads as a marker`);
        out[path] = inner.map((item) => definition(item, `${where} ${path}`));
      }
      return out;
    }
    throw new Error(`${where}: a definition the lint data cannot write (${typeof value})`);
  };
  const each = (record, kind) =>
    Object.fromEntries(
      Object.entries(record).map(([key, list]) => [
        key,
        list.map((item) => definition(item, `${kind} ${key}`)),
      ]),
    );
  return {
    theme: each(config.theme, "theme"),
    classGroups: each(config.classGroups, "group"),
    postfixLookup: [...(config.postfixLookupClassGroups ?? [])],
    // The groups a class of a group replaces besides its own (`p` replaces `pt`), with a postfix
    // modifier too (`text-lg/7` replaces `leading`), and the variants whose order matters.
    conflicts: config.conflictingClassGroups ?? {},
    postfixConflicts: config.conflictingClassGroupModifiers ?? {},
    orderSensitive: [...(config.orderSensitiveModifiers ?? [])],
  };
}

/**
 * lint.json's `categories`: the tailwind-merge version, each category's groups and kit
 * @utility names, the classes Tailwind lists that the grammar does not place (`css`), and the
 * grammar. `tailwindMerge` is the module (getDefaultConfig, mergeConfigs, validators),
 * `mergeConfig` the kit's, `utilities` each @utility's properties (lint-values.json's
 * utilityDetails), `listed` Tailwind's class list and the properties of a class's CSS. A group
 * the table does not place, or one it places twice, throws.
 */
export function classCategories({ tailwindMerge, version, mergeConfig, utilities, listed }) {
  const config = tailwindMerge.mergeConfigs(tailwindMerge.getDefaultConfig(), mergeConfig);
  const problems = groupProblems(Object.keys(config.classGroups));
  if (problems.length) throw new Error(`Class categories: ${problems.join("; ")}.`);
  const byCategory = (entries) =>
    Object.fromEntries(
      CATEGORIES.map((category) => [
        category,
        entries
          .filter(([, categories]) => categories.includes(category))
          .map(([name]) => name)
          .sort(),
      ]),
    );
  const grammar = serialiseGrammar(config, tailwindMerge.validators);
  // The classes Tailwind lists that the grammar does not place, by the CSS it writes for them.
  const unplaced = (listed?.classes ?? []).filter(
    (cls) =>
      !Object.hasOwn(utilities, cls) &&
      !hookClasses.has(cls) &&
      !markers.test(cls) &&
      !groupInGrammar(grammar, cls),
  );
  const css = unplaced.flatMap((cls) => {
    const properties = listed.propertiesOf(cls);
    return properties?.length ? [[cls, propertiesCategories(properties)]] : [];
  });
  return {
    tailwindMerge: version,
    groups: byCategory(
      Object.keys(config.classGroups).map((id) => [id, [categoryByGroup.get(id)]]),
    ),
    utilities: byCategory(
      Object.entries(utilities).map(([name, { properties }]) => [
        name,
        propertiesCategories(properties),
      ]),
    ),
    css: byCategory(css),
    grammar,
  };
}
