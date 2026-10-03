// What a class changes about the element it is on, by category, so a rule can ask whether a class
// changes something a kit part sets itself (batch 8's ownership data, eslint-plugin/parts.js):
//
//   layout      where the box is and how big: display, position, flex and grid, size, overflow,
//               text flow (wrapping, truncation, clamping), interaction; anything no other
//               category names (layoutKindOf tells placement from the part's own behaviour)
//   spacing     padding and gap: the space a part keeps inside itself and between its children
//   color       fill, text, border, outline, icon and SVG paint colour
//   typography  the type: family and size, weight, tracking, leading, numerals, decoration
//   shape       border and outline width and style, radius, dividers
//   effects     shadow, opacity, filters, blend modes, masks, a background's image and its
//               placement
//   motion      transition and animation
//
// A class's categories come from what the token build wrote into lint.json (`categories`, through
// data.js), never from Tailwind or tailwind-merge at lint time:
// 1. a kit @utility is the categories of the CSS properties it sets (a mixed one is all of them);
// 2. the hook class a library reads is layout, by name (classes.js's hookClasses);
// 3. any other class is its tailwind-merge group's category, found in the grammar the kit's cn()
//    merges by: tailwind-merge's default config with the kit's merge config (build/lint-data.mjs
//    serialises it, validators by name, and this file builds the lookup the first time it is
//    asked); an arbitrary property (`[mask-type:alpha]`) is its property's;
// 4. a class Tailwind lists that the grammar does not place (`w-compact`, `contain-paint`, newer
//    than tailwind-merge's config or a theme value it does not know) is the categories of the CSS
//    Tailwind writes for it, which the build asked;
// 5. a name marker (group, peer/field) is layout.
// A class none of these place has no category (`none`): it is no class Tailwind or the kit knows,
// which is no-non-token-class's to say, and no rule should read it as the part's.
import { classesOf, hookClasses, markers } from "./classes.js";
import { lintFacts } from "./data.js";

/** The categories, in the order a finding lists them. */
export const CATEGORIES = Object.freeze([
  "layout",
  "spacing",
  "color",
  "typography",
  "shape",
  "effects",
  "motion",
]);

/* ---------- a CSS property's category ---------- */

/** A border or outline shorthand sets a width, a style and a colour at once. */
const BORDER_SHORTHAND =
  /^(?:border|border-(?:top|right|bottom|left|inline|block)(?:-(?:start|end))?|outline|column-rule)$/;

/** Each category's properties, the first match deciding; a property none names is layout. */
const PROPERTY_CATEGORIES = [
  [/(?:^|-)colou?r$|^(?:background|fill|stroke)$/, "color"],
  [/^(?:padding(?:-.+)?|gap|row-gap|column-gap|border-spacing)$/, "spacing"],
  [
    /^(?:font(?:-.+)?|letter-spacing|line-height|text-transform|text-decoration(?:-line|-style|-thickness)?|text-underline-offset|text-underline-position|text-indent|word-spacing|list-style(?:-.+)?|-webkit-font-smoothing|-moz-osx-font-smoothing)$/,
    "typography",
  ],
  [
    /^(?:border(?:-(?:top|right|bottom|left|inline|block)(?:-(?:start|end))?)?-(?:width|style)|border-(?:.+-)?radius|border-style|border-width|outline-(?:width|style|offset)|column-rule-(?:width|style))$/,
    "shape",
  ],
  [
    /^(?:box-shadow|text-shadow|opacity|filter|backdrop-filter|-webkit-backdrop-filter|mix-blend-mode|background-blend-mode|background-(?:image|position|size|repeat|attachment|clip|origin)|(?:-webkit-)?mask(?:-.+)?)$/,
    "effects",
  ],
  [/^(?:transition(?:-.+)?|animation(?:-.+)?)$/, "motion"],
];

/**
 * The categories a CSS property sets: one for most, `shape` and `color` for a border or outline
 * shorthand (`border-block-end`, `outline`: a width, a style and a colour; `outline` counts as the
 * shape it draws), none for a custom property, which only hands a value on, and `layout` for any
 * property no category names.
 */
export function propertyCategories(property) {
  if (property.startsWith("--")) return [];
  if (property === "outline") return ["shape"];
  if (BORDER_SHORTHAND.test(property)) return ["shape", "color"];
  for (const [pattern, category] of PROPERTY_CATEGORIES)
    if (pattern.test(property)) return [category];
  return ["layout"];
}

/** The categories of a set of properties, in CATEGORIES order; layout when none sets one (a
    utility that only sets custom properties is layout). */
export function propertiesCategories(properties) {
  const found = new Set(properties.flatMap(propertyCategories));
  const ordered = CATEGORIES.filter((category) => found.has(category));
  return ordered.length ? ordered : ["layout"];
}

/* ---------- tailwind-merge's validators, which the grammar names ---------- */

// A port of tailwind-merge 3's validators (src/lib/validators.ts), which its config names and the
// token build writes by name; test/lint-categories.test.mjs holds each to tailwind-merge's own.
const arbitraryValue = /^\[(?:(\w[\w-]*):)?(.+)\]$/i;
const arbitraryVariable = /^\((?:(\w[\w-]*):)?(.+)\)$/i;
const fraction = /^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/;
const tshirtUnit = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/;
const lengthUnit =
  /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/;
const colorFunction = /^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix)\(.+\)$/;
const shadowValue = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/;
const imageValue =
  /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/;
const isNumber = (value) => !!value && !Number.isNaN(Number(value));
const isLengthOnly = (value) => lengthUnit.test(value) && !colorFunction.test(value);
const isNever = () => false;
const isAny = () => true;
const label = {
  position: (name) => name === "position" || name === "percentage",
  image: (name) => name === "image" || name === "url",
  size: (name) => name === "length" || name === "size" || name === "bg-size",
  length: (name) => name === "length",
  number: (name) => name === "number",
  familyName: (name) => name === "family-name",
  weight: (name) => name === "number" || name === "weight",
  shadow: (name) => name === "shadow",
};
const ofArbitraryValue = (testLabel, testValue) => (value) => {
  const found = arbitraryValue.exec(value);
  if (!found) return false;
  return found[1] ? testLabel(found[1]) : testValue(found[2]);
};
const ofArbitraryVariable =
  (testLabel, noLabel = false) =>
  (value) => {
    const found = arbitraryVariable.exec(value);
    if (!found) return false;
    return found[1] ? testLabel(found[1]) : noLabel;
  };
const isArbitraryValue = (value) => arbitraryValue.test(value);
const isArbitraryVariable = (value) => arbitraryVariable.test(value);

/** Every validator tailwind-merge's config can name, by the name it exports it under. */
export const VALIDATORS = Object.freeze({
  isAny,
  isAnyNonArbitrary: (value) => !isArbitraryValue(value) && !isArbitraryVariable(value),
  isArbitraryFamilyName: ofArbitraryValue(label.familyName, isNever),
  isArbitraryImage: ofArbitraryValue(label.image, (value) => imageValue.test(value)),
  isArbitraryLength: ofArbitraryValue(label.length, isLengthOnly),
  isArbitraryNumber: ofArbitraryValue(label.number, isNumber),
  isArbitraryPosition: ofArbitraryValue(label.position, isNever),
  isArbitraryShadow: ofArbitraryValue(label.shadow, (value) => shadowValue.test(value)),
  isArbitrarySize: ofArbitraryValue(label.size, isNever),
  isArbitraryValue,
  isArbitraryVariable,
  isArbitraryVariableFamilyName: ofArbitraryVariable(label.familyName),
  isArbitraryVariableImage: ofArbitraryVariable(label.image),
  isArbitraryVariableLength: ofArbitraryVariable(label.length),
  isArbitraryVariablePosition: ofArbitraryVariable(label.position),
  isArbitraryVariableShadow: ofArbitraryVariable(label.shadow, true),
  isArbitraryVariableSize: ofArbitraryVariable(label.size),
  isArbitraryVariableWeight: ofArbitraryVariable(label.weight, true),
  isArbitraryWeight: ofArbitraryValue(label.weight, isAny),
  isFraction: (value) => fraction.test(value),
  isInteger: (value) => !!value && Number.isInteger(Number(value)),
  isNamedContainerQuery: (value) =>
    value.startsWith("@container") &&
    ((value[10] === "/" && value[11] !== undefined) ||
      (value[11] === "s" && value[16] !== undefined && value.startsWith("-size/", 10)) ||
      (value[11] === "n" && value[18] !== undefined && value.startsWith("-normal/", 10))),
  isNumber,
  isPercent: (value) => value.endsWith("%") && isNumber(value.slice(0, -1)),
  isTshirtSize: (value) => tshirtUnit.test(value),
});

/* ---------- the grammar: tailwind-merge's class map, from the lint data ---------- */

/** tailwind-merge's prefix for an arbitrary property's group (`[mask-type:alpha]`). */
export const ARBITRARY_PROPERTY = "arbitrary..";

/** A node of the class map: the next parts by name, the validators the rest may meet, the group a
    class ending here is in. */
const node = () => ({ next: new Map(), validators: [], group: undefined });

/**
 * The class map a serialised grammar describes, built as tailwind-merge's createClassMap builds
 * it: `"$v:<name>"` is a validator of the rest of the class, `"$t:<key>"` the theme's values for
 * its key, any other string a path from where it is written ("" the place itself), and an object a
 * path per key.
 */
export function classMap({ theme, classGroups }) {
  const root = node();
  const at = (from, path) => {
    let current = from;
    for (const part of path.split("-")) {
      let next = current.next.get(part);
      if (!next) current.next.set(part, (next = node()));
      current = next;
    }
    return current;
  };
  const add = (definitions, where, group) => {
    for (const definition of definitions) {
      if (typeof definition !== "string")
        for (const [path, inner] of Object.entries(definition)) add(inner, at(where, path), group);
      else if (definition.startsWith("$t:")) add(theme[definition.slice(3)] ?? [], where, group);
      else if (definition.startsWith("$v:")) {
        const name = definition.slice(3);
        if (!Object.hasOwn(VALIDATORS, name))
          throw new Error(
            `Ledger lint data names the tailwind-merge validator ${name}, which eslint-plugin/categories.js does not port; add it there.`,
          );
        where.validators.push({ validator: VALIDATORS[name], group });
      } else (definition === "" ? where : at(where, definition)).group = group;
    }
  };
  for (const [group, definitions] of Object.entries(classGroups)) add(definitions, root, group);
  return root;
}

/** The group of a class's parts from `start` on, as tailwind-merge's getGroupRecursive finds it:
    the longest path first, then the validators where it stops. */
function walk(parts, start, from) {
  if (start === parts.length) return from.group;
  const next = from.next.get(parts[start]);
  if (next) {
    const found = walk(parts, start + 1, next);
    if (found) return found;
  }
  if (!from.validators.length) return undefined;
  const rest = parts.slice(start).join("-");
  return from.validators.find(({ validator }) => validator(rest))?.group;
}

/** A base's group (no variants, no `!`), as tailwind-merge's getClassGroupId finds it: an
    arbitrary property by its property, a minus skipped. */
function groupIdOf(map, base) {
  if (base.startsWith("[") && base.endsWith("]")) {
    const content = base.slice(1, -1);
    const colon = content.indexOf(":");
    return colon > 0 ? `${ARBITRARY_PROPERTY}${content.slice(0, colon)}` : undefined;
  }
  const parts = base.split("-");
  return walk(parts, parts[0] === "" && parts.length > 1 ? 1 : 0, map);
}

/** Where a base's postfix modifier starts (`bg-x/50`, `leading` in `text-lg/7`): its last slash
    outside brackets and parentheses, or -1. */
function postfixAt(base) {
  let depth = 0;
  let at = -1;
  for (let index = 0; index < base.length; index++) {
    const ch = base[index];
    if (ch === "[" || ch === "(") depth++;
    else if (ch === "]" || ch === ")") depth--;
    else if (ch === "/" && depth === 0) at = index;
  }
  return at;
}

/** The grammar, built from lint.json the first time a class is asked about. */
let grammar;
function grammarOf() {
  if (!grammar) {
    const data = lintFacts().categories;
    if (!data?.grammar)
      throw new Error(
        "Ledger lint data has no class categories: lint.json was written before they were. Run npm run build:tokens in @ledger/design-system.",
      );
    const byGroup = new Map();
    for (const [category, groups] of Object.entries(data.groups))
      for (const group of groups) byGroup.set(group, [...(byGroup.get(group) ?? []), category]);
    const byUtility = new Map();
    for (const [category, names] of Object.entries(data.utilities))
      for (const name of names) byUtility.set(name, [...(byUtility.get(name) ?? []), category]);
    const byCss = new Map();
    for (const [category, names] of Object.entries(data.css ?? {}))
      for (const name of names) byCss.set(name, [...(byCss.get(name) ?? []), category]);
    const inOrder = (list) => CATEGORIES.filter((category) => list.includes(category));
    grammar = {
      map: classMap(data.grammar),
      postfixLookup: new Set(data.grammar.postfixLookup ?? []),
      conflicts: data.grammar.conflicts ?? {},
      postfixConflicts: data.grammar.postfixConflicts ?? {},
      orderSensitive: new Set(data.grammar.orderSensitive ?? []),
      groups: new Map([...byGroup].map(([group, list]) => [group, inOrder(list)])),
      utilities: new Map([...byUtility].map(([name, list]) => [name, inOrder(list)])),
      css: new Map([...byCss].map(([name, list]) => [name, inOrder(list)])),
    };
  }
  return grammar;
}

/**
 * The tailwind-merge group a class is in, as the kit's cn() merges it (`p-200` is `p`,
 * `hover:bg-brand-bold` is `bg-color`, `text-subtle` is `text-color`, `[mask-type:alpha]` is
 * `arbitrary..mask-type`), or undefined for a class the grammar does not know (a kit @utility
 * outside the merge config, `page-header`). A postfix modifier is read as tailwind-merge reads it:
 * the class without it first.
 */
export function groupOf(cls) {
  const [parsed] = classesOf(cls);
  return parsed ? baseGroup(parsed.base).group : undefined;
}

/** A base's group and whether a postfix modifier stands outside it (`text-lg/7`'s `/7`), as
    tailwind-merge reads it. */
function baseGroup(base, { map, postfixLookup } = grammarOf()) {
  const slash = postfixAt(base);
  if (slash <= 0) return { group: groupIdOf(map, base), postfix: false };
  const without = groupIdOf(map, base.slice(0, slash));
  if (without && postfixLookup.has(without)) {
    const whole = groupIdOf(map, base);
    if (whole && whole !== without) return { group: whole, postfix: false };
  }
  return without
    ? { group: without, postfix: true }
    : { group: groupIdOf(map, base), postfix: false };
}

/** The tailwind-merge group of a class without variants in a serialised grammar (lint.json's
    `categories.grammar`), for the build, before lint.json is written: undefined when it places
    none. */
export function groupInGrammar(grammarData, base) {
  const built = {
    map: classMap(grammarData),
    postfixLookup: new Set(grammarData.postfixLookup ?? []),
  };
  return baseGroup(base, built).group;
}

/** The groups a class of `group` replaces besides its own when cn() merges, as tailwind-merge's
    config says: `p` replaces `px`, `pt` and every other padding; with a postfix modifier
    (`text-lg/7`) the postfix's too (`leading`). */
export function conflictingGroups(group, postfix = false) {
  const { conflicts, postfixConflicts } = grammarOf();
  const own = conflicts[group] ?? [];
  return postfix && postfixConflicts[group] ? [...own, ...postfixConflicts[group]] : own;
}

/** Variants as tailwind-merge compares them: in order around an order-sensitive one (`before`,
    `*`) or an arbitrary one, sorted between them. */
function variantKey(variants) {
  const { orderSensitive } = grammarOf();
  const out = [];
  let run = [];
  for (const variant of variants) {
    if (variant.startsWith("[") || orderSensitive.has(variant)) {
      out.push(...run.sort(), variant);
      run = [];
    } else run.push(variant);
  }
  return [...out, ...run.sort()].join(":");
}

/** What cn() merges a class by: its variants and importance, its group and its postfix; undefined
    for a class in no group, which cn() never drops. */
function mergeKeyOf(cls) {
  const [parsed] = classesOf(cls);
  if (!parsed) return undefined;
  const { group, postfix } = baseGroup(parsed.base);
  if (!group) return undefined;
  return { at: `${variantKey(parsed.variants)}${parsed.important ? "!" : ""}`, group, postfix };
}

/**
 * Whether `later` replaces `earlier` where cn() merges them (`cn(earlier, later)` keeps only
 * `later`): under the same variants and importance, `earlier` is in `later`'s group or one it
 * replaces (`py-200` replaces `pt-150`; `md:p-200` does not replace `p-100`). A class of a kit
 * @utility the merge config does not place replaces nothing.
 */
export function replaces(later, earlier) {
  const a = mergeKeyOf(later);
  const b = mergeKeyOf(earlier);
  if (!a || !b || a.at !== b.at) return false;
  return a.group === b.group || conflictingGroups(a.group, a.postfix).includes(b.group);
}

/* ---------- a class's categories ---------- */

/** The categories of a tailwind-merge group (`gap` is spacing), from the lint data; empty for a
    group it does not place. */
export const groupCategories = (group) => grammarOf().groups.get(group) ?? [];

/** categoriesOf's answers, by class as written. */
const answers = new Map();
const answer = (categories, group, via, key) =>
  Object.freeze({ categories: Object.freeze([...categories]), group, via, key });

/**
 * What a class changes, as `{ categories, group, via, key }`: its categories in CATEGORIES order,
 * its tailwind-merge group (groupOf), what placed it (`utility`, `hook`, `grammar`, `property`,
 * `css`, `marker`, or `none` with no category), and the key ownership data files it under
 * (eslint-plugin/parts.js): its group, or `utility:<name>` for a kit @utility the grammar does not
 * place or places with another kind than its CSS (`fill-window` is layout, which cn() merges as a
 * fill colour), or `class:<name>` for a class in no group. Variants and `!` do not change a
 * class's categories (`focus-visible:outline-focused` is the shape `outline-focused` draws).
 * Memoised and frozen.
 */
export function categoriesOf(cls) {
  let found = answers.get(cls);
  if (found) return found;
  if (answers.size > 50_000) answers.clear();
  answers.set(cls, (found = placed(cls)));
  return found;
}
function placed(cls) {
  const [parsed] = classesOf(cls);
  if (!parsed) return answer([], undefined, "none", `class:${cls}`);
  const { base } = parsed;
  const { groups, utilities, css } = grammarOf();
  const group = groupOf(cls);
  const own = `class:${base}`;
  const utility = utilities.get(base);
  if (utility) {
    const agrees = group && (groups.get(group) ?? []).some((c) => utility.includes(c));
    return answer(utility, group, "utility", agrees ? group : `utility:${base}`);
  }
  if (hookClasses.has(base)) return answer(["layout"], group, "hook", group ?? own);
  if (group?.startsWith(ARBITRARY_PROPERTY))
    return answer(
      propertiesCategories([group.slice(ARBITRARY_PROPERTY.length)]),
      group,
      "property",
      group,
    );
  const categories = group && groups.get(group);
  if (categories) return answer(categories, group, "grammar", group);
  const fromCss = css.get(base);
  if (fromCss) return answer(fromCss, group, "css", own);
  if (markers.test(base)) return answer(["layout"], group, "marker", group ?? own);
  return answer([], group, "none", group ?? own);
}

/* ---------- what kind of layout ---------- */

/** The layout keys that are a part's own behaviour or look, not where it sits, how big it is and
    how it flows among its siblings, by kind; any other layout key is `placement`. */
const LAYOUT_KINDS = [
  ["interaction", /^(?:appearance|cursor|pointer-events|resize|select|touch(?:-x|-y|-pz)?)$/],
  [
    "transform",
    /^(?:(?:rotate|scale|translate|skew)(?:-.+)?|transform(?:-origin|-style)?|perspective(?:-origin)?|backface|zoom)$/,
  ],
  ["text-flow", /^(?:whitespace|text-overflow|line-clamp|break|hyphens|text-wrap|wrap|tab-size)$/],
  ["overflow", /^overflow(?:-[xy])?$/],
  ["presentation", /^(?:color-scheme|forced-color-adjust)$/],
];

/**
 * What a layout class decides, by its key (categoriesOf's): `interaction` (pointer events,
 * selection, the cursor, native appearance, touch action, resizing), `transform`, `text-flow`
 * (wrapping, truncation, clamping, breaking), `overflow`, `presentation` (colour scheme, forced
 * colours), or `placement`, where the element sits, how big it is and how it flows, which is
 * every other layout key. ledger/no-restyle leaves a part's placement to its caller (decision 7)
 * and judges the other kinds as it judges colour and type.
 */
export const layoutKindOf = (key) =>
  LAYOUT_KINDS.find(([, pattern]) => pattern.test(key))?.[0] ?? "placement";

/* ---------- variants that style another element ---------- */

/** Where a selector's `&` ends: after it, or after the `:where(…)` or `:is(…)` that holds it
    (`[:where(&)_svg]`), at bracket and parenthesis depth 0; -1 for a selector with none. */
function selfEnd(selector) {
  const at = selector.indexOf("&");
  if (at < 0) return -1;
  let depth = 0;
  for (let index = 0; index < at; index++) {
    const ch = selector[index];
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
  }
  let index = at + 1;
  while (depth > 0 && index < selector.length) {
    const ch = selector[index++];
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
  }
  return index;
}

/**
 * Which element a variant styles, as `{ reach, combinator, target }`: `reach` is `self` for the
 * element itself (a state, a condition, a pseudo-element, an ancestor's state), `inside` for its
 * children (`*:`, `[&>li]:`, combinator `child`) or descendants (`**:`, `[&_svg]:`,
 * `[&:hover_svg]:`, `[&[data-state=open]>svg]:`, `[:where(&)_svg]:`, combinator `descendant`),
 * and `sibling` for a sibling (`[&+div]:`, `[&~*]:`). An arbitrary variant's combinator is the
 * first one after its `&` at depth 0, so a selector inside `:has(>svg)` or `[data-x]` is no step
 * of its own; `target` is the compound the selector ends on (`svg`, `li`, `*`,
 * `[data-slot=button]`).
 */
export function variantReach(variant) {
  if (variant === "*") return { reach: "inside", combinator: "child", target: "*" };
  if (variant === "**") return { reach: "inside", combinator: "descendant", target: "*" };
  if (!variant.startsWith("[") || !variant.endsWith("]")) return { reach: "self" };
  const selector = variant.slice(1, -1);
  const from = selfEnd(selector);
  if (from < 0 || selector.startsWith("@")) return { reach: "self" };
  let depth = 0;
  let found;
  let last = from;
  for (let index = from; index < selector.length; index++) {
    const ch = selector[index];
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    else if (depth === 0 && "_>+~".includes(ch)) {
      found ??= ch;
      last = index + 1;
    }
  }
  if (!found) return { reach: "self" };
  const target = selector.slice(last).replace(/^[_>+~]+/, "") || "*";
  if (found === "+" || found === "~") return { reach: "sibling", target };
  return { reach: "inside", combinator: found === ">" ? "child" : "descendant", target };
}

/**
 * Whether a class's variants make it style another element than the one it is written on: `*:`
 * (each child), `**:` (every descendant), or an arbitrary variant whose selector steps from `&` to
 * a descendant, a child or a sibling (`[&_svg]:`, `[&>li]:`, `[&+div]:`, `[&:hover_svg]:`,
 * `[&[data-state=open]>svg]:`, `[:where(&)_svg]:`). A state or a pseudo element of the element
 * itself (`hover:`, `data-[open]:`, `group-hover:`, `before:`, `[&:hover]:`, `[&:has(>svg)]:`)
 * does not.
 */
export const reachesOthers = (variants) =>
  variants.some((variant) => variantReach(variant).reach !== "self");
