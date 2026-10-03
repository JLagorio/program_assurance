// ledger/no-restyle: a class a product writes on a kit part may not change what the part sets
// itself (decision 7 of the lint hardening plan: a part owns only what it sets itself). What a part
// sets comes from eslint-plugin/parts.json, which the build reads from the kit's source
// (parts.js): the classes its root always carries, the classes each value of a prop puts there,
// and the classes it makes from several props. A class changes one of them when it is in the same
// tailwind-merge group, or in a group cn() lets it replace (categories.js), on the same element or
// pseudo-element. The finding names the prop that sets it, or the part that does; it never offers a
// way around the part.
//
// Each class on a kit part's className is decided in this order:
//   1. a class another Ledger rule reports is that rule's: a class rule's (classify), the padding,
//      gap, display and grid template use-primitives judges on a layout primitive, and the type
//      and neutral colour cell-plain judges on a Table.Cell;
//   2. a class that styles the elements inside (`*:`, `**:`, `[&_svg]:`, `[&>li]:`,
//      `[&:hover_svg]:`) is reported on any element of a product file where it reaches a kit part:
//      the element itself, unless a layout primitive, whose children are the caller's; a kit
//      component inside; a part's own element the selector can name, with more than its placement
//      (`descendant`, naming the part);
//   3. on a focus target (a literal tabIndex={-1}), the outline classes pass (parts.js);
//   4. where a part's className has a contract (an `@accepts` tag in the kit), a class it takes
//      passes and any other is reported (`contract`);
//   5. inside a table cell (a column's cell renderer, or a Table.Cell around the element), the type
//      and the neutral colours cell-plain forbids on the cell are reported: cells are one style;
//   6. a class that changes something the part sets, in force on the element, is reported:
//      anything its root sets, in any state; what a prop sets, in the states the prop sets it (a
//      hover or an aria state no prop sets is the caller's; a width, a media condition and a
//      variant that always holds are no state), a flag's or a given prop's only where it is
//      written; what the part makes from several props, where one is written or, with none, what
//      the build read it sets then (restyleOf). Placement is the exception: where a part sits, how
//      big it is and how it flows stay the caller's, unless a prop does nothing but set that
//      (Button's isFullWidth), the class does not hide or show the part and holds at every width;
//      its interaction, transforms, text flow and overflow are its own (categories.js);
//   7. anything else passes: a border on a Stack, RadioGroup's divide-y, a width on a field.
// The rule runs on product code only (the recommended preset), never on the kit's own source,
// where patterns compose components by design.
import { PRIMITIVES } from "./advice.js";
import { categoriesOf, conflictingGroups, layoutKindOf, variantReach } from "./categories.js";
import { classSites } from "./class-sites.js";
import { classesOf, classify, withVariants } from "./classes.js";
import { lintFacts } from "./data.js";
import { currentValue } from "./deprecations.js";
import { KIT_PARTS, classOwnerOf, isKitSourceFile, kitBindingOf } from "./identity.js";
import {
  accepts,
  acceptsOf,
  focusTargetAllows,
  partData,
  partsSetting,
  settingsChangedBy,
  settingsOf,
} from "./parts.js";
import { defineRules } from "./report.js";
import { unwrap, variableOf } from "./values.js";

const RULE = "no-restyle";

/* ---------- what another rule judges ---------- */

/** The classes use-primitives judges on a layout primitive, with or without a variant: padding,
    gap, display and a grid's template are the primitive's props, or a breakpoint's class those
    props cannot key, which use-primitives leaves to the caller on purpose. */
const PRIMITIVE_LAYOUT =
  /^(?:-?(?:p|px|py|pt|pb|pl|pr|ps|pe)-.+|gap(?:-[xy])?-.+|flex|inline-flex|grid|inline-grid|grid-(?:cols|rows)-.+)$/;

/** The type and neutral colours cell-plain forbids on a Table.Cell (index.js's CELL_FORBIDDEN, the
    same words: test/lint-restyle.test.mjs holds the two rules to one vocabulary). A status colour
    is data, not design. */
export const CELL_STYLE =
  /^(text-(default|subtle|subtlest|brand|selected|inverse|disabled)|font-(body(-large|-small|-xsmall)?|heading-\w+|code|medium|semibold|regular))$/;

/** The parts that draw a table cell, whose content is the cell's one style. */
const CELLS = new Set(["Table.Cell", "Table.Tree"]);

/* ---------- layout the caller keeps ---------- */

/** A class that hides or shows the part, which is where it is, not how it looks. */
const VISIBILITY = /^(?:hidden|invisible|visible|collapse|sr-only|not-sr-only)$/;

/** Props that say what state the part is in, not how it looks: a class in what one of them sets
    is no way to write the prop, and the prop is no advice for a class. */
const STATE_PROPS = new Set([
  "isActive",
  "isCurrent",
  "isDisabled",
  "isDragging",
  "isExpanded",
  "isInvalid",
  "isLoading",
  "isOpen",
  "isPending",
  "isPressed",
  "isSelected",
  "active",
  "checked",
  "current",
  "disabled",
  "disabledReason",
  "expanded",
  "invalid",
  "loading",
  "open",
  "pressed",
  "selected",
]);

/** Whether a prop does nothing but set one thing (Button's isFullWidth sets its width): a layout
    class in that thing is the prop's. The element a part renders as (`as`) is no style prop, and
    a state is no style. */
const singlePurpose = (part, prop) =>
  prop !== "as" &&
  !STATE_PROPS.has(prop) &&
  Object.keys(partData(part)?.props?.[prop] ?? {}).length === 1;

/** Whether a class is placement only: where the part sits, how big it is and how it flows, which
    a part leaves to its caller (decision 7), unlike its interaction, transforms, text flow and
    overflow (categories.js's layoutKindOf). */
const isPlacement = (cls) => {
  const { categories, key } = categoriesOf(cls);
  return (
    categories.length > 0 &&
    categories.every((category) => category === "layout") &&
    layoutKindOf(key) === "placement"
  );
};

/* ---------- states and conditions ---------- */

/** Media conditions that hold for the whole of a reader's visit, as a width does: a preference,
    an output, a pointer, a direction. */
const MEDIA = new Set([
  "motion-safe",
  "motion-reduce",
  "contrast-more",
  "contrast-less",
  "portrait",
  "landscape",
  "ltr",
  "rtl",
  "print",
  "forced-colors",
  "inverted-colors",
  "pointer-none",
  "pointer-coarse",
  "pointer-fine",
  "any-pointer-none",
  "any-pointer-coarse",
  "any-pointer-fine",
  "noscript",
]);
/** An arbitrary variant whose selector is the element itself, wherever it is: `[&]`,
    `[:root_&]`, `[:where(&)]`. */
const ALWAYS_SELF =
  /^(?:(?:html|body|:root|\*)_)*(?:&|:where\(&\)|:is\(&\))(?::(?:where|is)\(\*\))*$/;

let breakpoints;
const conditions = new Map();
/**
 * What a variant is a condition of, rather than a state: `width` for a breakpoint or a container
 * size (`md:`, `max-sm:`, `min-[0px]:`, `@3xl:`), `media` for a preference, an output, a pointer
 * or a direction (`motion-safe:`, `not-print:`, `supports-[…]:`), `self` for one that holds
 * wherever the part is drawn (`[&]:`, `[:root_&]:`, `data-[slot=button]:`, `enabled:`, and the
 * negation of a state, which holds at rest: `not-hover:`); undefined for a state of the element
 * or of what is around it (`hover:`, `aria-expanded:`, `data-[state=open]:`, `group-hover:`), a
 * pseudo-element, or a reach.
 */
function conditionOf(variant) {
  let kind = conditions.get(variant);
  if (kind !== undefined) return kind || undefined;
  breakpoints ??= new Set(Object.keys(lintFacts().variants?.breakpoints ?? {}));
  const negated = variant.startsWith("not-");
  const bare = negated ? variant.slice(4) : variant;
  if (bare.startsWith("@") || breakpoints.has(bare) || /^(?:max|min)-/.test(bare)) kind = "width";
  else if (MEDIA.has(bare) || bare.startsWith("supports-")) kind = "media";
  else if (bare.startsWith("[") && bare.endsWith("]")) {
    const selector = bare.slice(1, -1);
    if (/^@(?:container|min|max)/.test(selector)) kind = "width";
    else if (selector.startsWith("@media"))
      kind = /width|height/.test(selector) ? "width" : "media";
    else if (selector.startsWith("@supports")) kind = "media";
    else if (ALWAYS_SELF.test(selector)) kind = "self";
  } else if (/^data-(?:slot$|slot-|\[slot(?:[=\]]))/.test(bare) || bare === "enabled")
    kind = "self";
  if (!kind && negated && !bare.startsWith("[")) kind = "self";
  conditions.set(variant, kind ?? "");
  return kind;
}
/** The states a class's variants name, as one key: its variants less its conditions. A prop sets
    its classes in the states it names, so a class in the same states changes them. */
const stateOf = (variants) =>
  variants
    .filter((variant) => !conditionOf(variant))
    .sort()
    .join(":");
/** stateOf of a class a part sets, kept by class: the same few settings meet class after class. */
const settingStates = new Map();
const stateOfSetting = ({ cls }) => {
  let state = settingStates.get(cls);
  if (state === undefined) {
    if (settingStates.size > 20_000) settingStates.clear();
    settingStates.set(cls, (state = stateOf(classesOf(cls)[0]?.variants ?? [])));
  }
  return state;
};
/** Whether a class holds only at some widths: a breakpoint or a container size. */
const atWidth = (variants) => variants.some((variant) => conditionOf(variant) === "width");

/** A prop's value that names one value (`small`, `true`), not every value given (`*`), every
    value but one (`!xsmall`), its absence (`unset`) or false. */
const isValue = (value) => value !== "*" && value !== "unset" && !value.startsWith("!");

/** Whether a prop's value puts `cls` alone on the part, and no class the part makes from several
    props reads that prop: writing the prop renders what the class did, and nothing else. */
function onlyClass(part, prop, value, cls) {
  const record = partData(part);
  const classes = Object.values(record?.props?.[prop] ?? {}).flatMap(
    (byValue) => byValue[value] ?? [],
  );
  const derived = Object.values(record?.derived ?? {}).some(({ props }) => props.includes(prop));
  return !derived && classes.length === 1 && classes[0] === cls;
}

/* ---------- words ---------- */

/** What a key sets, as a finding names it: "padding", "text colour". */
const KEY_WORDS = [
  [/^(?:p|px|py|pt|pb|pl|pr|ps|pe)$/, "padding"],
  [/^gap(?:-[xy])?$/, "gap"],
  [/^text-color$/, "text colour"],
  [/^bg-color$/, "background"],
  [/^border-color/, "border colour"],
  [/^outline-color$/, "outline colour"],
  [/^divide-color$/, "divider colour"],
  [/^(?:fill|stroke)$/, "fill"],
  [/^icon$/, "icon colour"],
  [/^font-family$/, "type"],
  [/^font-weight$/, "weight"],
  [/^fvn-/, "numerals"],
  [/^(?:text-decoration|underline-offset)/, "underline"],
  [/^rounded/, "radius"],
  [/^border-w/, "border"],
  [/^border-style$/, "border style"],
  [/^(?:outline-|utility:outline-)/, "outline"],
  [/^divide-/, "dividers"],
  [/^shadow/, "shadow"],
  [/^opacity$/, "opacity"],
  [/^(?:transition|duration|ease|delay|animate)/, "motion"],
  [/^(?:w|min-w|max-w)$/, "width"],
  [/^(?:h|min-h|max-h)$/, "height"],
  [/^size$/, "size"],
  [/^(?:justify-content|align-items|text-alignment|vertical-align)$/, "alignment"],
  [/^(?:whitespace|text-overflow|line-clamp|break|hyphens|text-wrap|wrap)$/, "wrapping"],
  [/^pointer-events$/, "pointer behaviour"],
  [/^select$/, "text selection"],
  [/^cursor$/, "cursor"],
  [/^(?:appearance|touch(?:-.+)?|resize)$/, "interaction"],
  [/^(?:rotate|scale|translate|skew|transform|perspective|backface|zoom)/, "transform"],
  [/^overflow/, "overflow"],
];
const CATEGORY_WORDS = {
  layout: "layout",
  spacing: "spacing",
  color: "colour",
  typography: "type",
  shape: "shape",
  effects: "effects",
  motion: "motion",
};
const wordFor = (key, category) =>
  KEY_WORDS.find(([pattern]) => pattern.test(key))?.[1] ?? CATEGORY_WORDS[category] ?? "style";

/** A prop as a caller writes it: `numeric`, `wrap={false}`, `maxLines={1}`, `size="small"`. */
function written(prop, value) {
  if (value === "true") return prop;
  if (value === "false" || /^\d+$/.test(value)) return `${prop}={${value}}`;
  return `${prop}="${value}"`;
}

/** The family a part's change belongs to: a member's root (`Section.Title` is Section's), else the
    part its file is named for (`TabsContent` is in tabs.tsx, Tabs'), else the part itself. */
function familyOf(part) {
  if (part.includes(".")) return part.split(".")[0];
  const file = partData(part)?.file ?? "";
  const named = (file.split("/").at(-1) ?? "")
    .replace(/\.[cm]?[jt]sx?$/, "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
  return named && KIT_PARTS.has(named) ? named : part;
}

/** A class as a finding quotes it: a bracket longer than a word stands as `[…]`, and a class
    still longer than 40 characters keeps its last variant and its base (`…:hover:bg-input`). */
const shortened = (cls) => {
  const [parsed] = classesOf(cls);
  if (!parsed || cls.length <= 40) return cls;
  const variants = parsed.variants.map((variant) =>
    variant.length > 16 ? variant.replace(/\[.*\]/, "[…]") : variant,
  );
  const short = withVariants({ variants, important: parsed.important }, parsed.base);
  return short.length <= 40
    ? short
    : withVariants(
        { variants: ["…", ...variants.slice(-1)], important: parsed.important },
        parsed.base,
      );
};
/** The classes a part sets that a finding quotes: those in the class's own states first, then
    those with no variant, at most 48 characters of them and at least one, with "…" for more. */
function quoted(settings, states) {
  const classes = [...new Set(settings.map(({ cls }) => cls))]
    .map((cls) => ({ cls, variants: classesOf(cls)[0]?.variants ?? [] }))
    .sort(
      (a, z) =>
        Number(stateOf(z.variants) === states) - Number(stateOf(a.variants) === states) ||
        a.variants.length - z.variants.length ||
        a.cls.length - z.cls.length,
    )
    .map(({ cls }) => shortened(cls));
  const shown = [];
  for (const cls of classes) {
    if (shown.length && [...shown, cls].join(" ").length > 48) break;
    shown.push(cls);
  }
  return shown.join(" ") + (shown.length < classes.length ? " …" : "");
}

/** What a part's className contract takes, as a finding names it: "layout", "colour, type and
    break-all". */
function takesOf(part) {
  const { categories, classes } = acceptsOf(part);
  const words = [...categories.map((category) => CATEGORY_WORDS[category]), ...classes];
  return words.length > 1 ? `${words.slice(0, -1).join(", ")} and ${words.at(-1)}` : words[0];
}

/* ---------- a table cell ---------- */

/** Whether `fn` is a column's cell renderer: the value of `cell` in the options a column builder
    is handed (`c.custom("id", { cell: (row) => … })`), where the builder is the parameter of the
    function the kit's defineColumns is given, or a parameter typed ColumnKinds. */
function isCellRenderer(context, fn) {
  const property = fn.parent;
  if (property?.type !== "Property" || property.value !== fn) return false;
  const key = property.key.type === "Identifier" ? property.key.name : property.key.value;
  if (key !== "cell" || property.parent?.type !== "ObjectExpression") return false;
  const call = property.parent.parent;
  if (call?.type !== "CallExpression" || !call.arguments.includes(property.parent)) return false;
  const callee = unwrap(call.callee);
  if (callee?.type !== "MemberExpression") return false;
  const builder = unwrap(callee.object);
  if (builder?.type !== "Identifier") return false;
  const def = variableOf(context, builder)?.defs?.[0];
  if (def?.type !== "Parameter") return false;
  const annotation = def.name.typeAnnotation?.typeAnnotation;
  if (annotation && /\bColumnKinds\b/.test(context.sourceCode.getText(annotation))) return true;
  const owner = def.node;
  const given = owner?.parent;
  return (
    given?.type === "CallExpression" &&
    given.arguments[0] === owner &&
    unwrap(given.callee)?.type === "Identifier" &&
    kitBindingOf(context, unwrap(given.callee)) === "defineColumns"
  );
}

/** Whether a JSX element is drawn inside a table cell: a column's cell renderer holds it, or a
    Table.Cell (or Table.Tree) is around it. */
function inCell(context, opening) {
  for (let node = opening.parent?.parent; node; node = node.parent) {
    if (node.type === "JSXElement" && CELLS.has(classOwnerOf(context, node.openingElement).part))
      return true;
    if (
      (node.type === "ArrowFunctionExpression" || node.type === "FunctionExpression") &&
      isCellRenderer(context, node)
    )
      return true;
  }
  return false;
}

/* ---------- the verdict ---------- */

/** Each part's keys and merge groups, of every class it sets: a class in none of them, and in no
    group that replaces one, changes nothing the part sets, with no need to ask parts.js. */
const setKeys = new Map();
function keysSetBy(part) {
  let keys = setKeys.get(part);
  if (!keys) {
    keys = new Set();
    for (const setting of settingsOf(part)) {
      keys.add(setting.key);
      const { group } = categoriesOf(setting.cls);
      if (group) keys.add(group);
    }
    setKeys.set(part, keys);
  }
  return keys;
}

/** parts.js's settingsChangedBy, remembered, and skipped for a class in no key the part sets: the
    answer is the data's, and a product writes the same few classes on the same parts in file
    after file. */
const changes = new Map();
function changedBy(part, cls) {
  const id = `${part}\u0000${cls}`;
  let found = changes.get(id);
  if (!found) {
    if (changes.size > 20_000) changes.clear();
    const { key, group } = categoriesOf(cls);
    const keys = keysSetBy(part);
    const near =
      keys.has(key) ||
      (group && (keys.has(group) || conflictingGroups(group, true).some((g) => keys.has(g))));
    changes.set(id, (found = near ? settingsChangedBy(part, cls) : []));
  }
  return found;
}

/** Whether a prop's setting is in force on an element: a flag's or a given prop's (`*`) where the
    element writes the prop, an absent prop's (`unset`) where it does not, and a value's, every
    other value's (`!x`) or false's always, since an unwritten prop takes its default. */
function propTakes(setting, has, writes) {
  if (setting.value === "true" || setting.value === "*") return has(setting.prop);
  if (setting.value === "unset") return !writes(setting.prop);
  return true;
}

/**
 * What a class on a kit part changes that the part sets, as the finding's message id and data (and,
 * for a prop that renders the class alone, that prop's setting as `same`), or undefined when it
 * changes nothing the part owns. `has(prop)` says whether the element writes a prop, or may through
 * a spread; `writes(prop)` whether it writes it as an attribute.
 *
 * A class changes a setting in force on the element (propTakes; what the part makes from several
 * props where one is written or, by `unset`, where none is) in the same states. A part's root
 * classes are set in every state they name, so a class under any variant changes them. A prop sets
 * its classes in the states it names: a hover or an aria state the prop never sets is the
 * caller's (Box's backgroundColor sets no hover background), while a width, a media condition and
 * a variant that always holds on the part (`sm:`, `motion-safe:`, `[&]:`, `data-[slot=button]:`)
 * are no state, so a colour or a type under them changes what the prop sets. Placement is the
 * caller's, at a width always, and otherwise unless a prop does nothing but set it.
 */
function restyleOf(part, parsed, has, writes) {
  const found = changedBy(part, parsed.cls);
  if (!found.length) return undefined;
  const { categories, key } = categoriesOf(parsed.cls);
  if (!categories.length) return undefined;
  const placement = isPlacement(parsed.cls);
  const states = stateOf(parsed.variants);
  const bare = parsed.cls.replace(/^!|!$/g, "");
  const claimable = (setting) =>
    !placement ||
    (setting.via === "prop" &&
      setting.key === key &&
      singlePurpose(part, setting.prop) &&
      !VISIBILITY.test(parsed.base) &&
      !atWidth(parsed.variants));
  const takes = (setting) =>
    setting.via === "root" ||
    (stateOfSetting(setting) === states &&
      (setting.via === "prop"
        ? propTakes(setting, has, writes)
        : setting.props.some((prop) => has(prop)) || setting.unset));
  const owned = found.filter((setting) => claimable(setting) && takes(setting));
  // The prop and value that put this very class there, under the same variants: writing the prop
  // renders it, whether or not the element writes the prop now. A state is no way to write a look.
  const exact = found.find(
    (setting) =>
      setting.via === "prop" &&
      setting.cls === bare &&
      isValue(setting.value) &&
      !STATE_PROPS.has(setting.prop) &&
      claimable(setting),
  );
  if (!owned.length && !exact) return undefined;
  const word = (setting) => wordFor(setting.key, categories[0]);
  // The class is all that value sets, and nothing the part makes from several props reads it: the
  // prop and the class render the same.
  if (exact && onlyClass(part, exact.prop, exact.value, bare))
    return {
      messageId: "prop",
      data: { prop: exact.prop, written: written(exact.prop, exact.value) },
      same: exact,
    };
  const record = partData(part);
  const at = `${record.file}:${record.line}`;
  const family = familyOf(part);
  // A class the part already sets, in the same states: by itself, or from props none of which
  // the element writes (one written may pick another class of the same setting).
  if (
    owned.some(
      (setting) =>
        setting.cls === parsed.cls &&
        (setting.via === "root" ||
          (setting.via === "derived" && setting.unset && !setting.props.some((prop) => has(prop)))),
    )
  )
    return { messageId: "repeats", data: { at } };
  const byProp = exact ?? owned.find((setting) => setting.via === "prop");
  if (byProp) {
    const what = word(byProp);
    // For a type, the primitive whose prop puts this class on its element, when one does: the part
    // the words belong in (`font-heading-page` is Heading size="page"). A component's prop sets
    // more than the one class, so it is never offered. A retired value is named by the value that
    // replaces it (`font-heading-large` is Heading size="display"), and one with no one-to-one
    // replacement is not named.
    const typeOf = categories.includes("typography");
    const elsewhere = [
      ...new Set(
        (typeOf ? partsSetting(parsed.base) : [])
          .filter(
            (setting) =>
              setting.part !== part &&
              setting.kind !== "component" &&
              setting.via === "prop" &&
              isValue(setting.value),
          )
          .flatMap((setting) => {
            const value = currentValue(setting.part, setting.prop, setting.value);
            return value === undefined ? [] : [`${setting.part} ${written(setting.prop, value)}`];
          }),
      ),
    ].slice(0, 2);
    // A class under a width or a condition, or beside the prop it changes, cannot become the prop:
    // a different look there is a change to the part.
    const changesPart = parsed.variants.length > 0 || writes(byProp.prop);
    return {
      messageId: "propKey",
      data: {
        what,
        prop: byProp.prop,
        advice: exact
          ? `Drop it; it is what ${written(exact.prop, exact.value)} sets.`
          : changesPart
            ? `Drop it; a different ${what} is a change to ${family}.`
            : elsewhere.length
              ? `Drop it; "${parsed.base}" is ${elsewhere.join(" or ")}.`
              : `Drop it and set ${byProp.prop}.`,
      },
    };
  }
  const roots = owned.filter((setting) => setting.via === "root");
  if (roots.length)
    return {
      messageId: "own",
      data: { what: word(roots[0]), own: quoted(roots, states), at, family },
    };
  const derived = owned.find((setting) => setting.via === "derived");
  return {
    messageId: "derived",
    data: { what: word(derived), props: derived.props.join(" and "), at, family },
  };
}

/**
 * The editor suggestion that writes the prop in the class's place, when that is certain: the class
 * is written once, with no variant, in a plain className string on the element itself, the
 * element sets that prop nowhere (and spreads nothing that could), and the prop's value puts this
 * class alone on the part (onlyClass). The string loses the class and the whitespace after it (or
 * before it, at the end); a string left empty takes its attribute with it. Never under --fix.
 */
function propSuggestion(context, opening, node, parsed, prop, writtenProp) {
  if (parsed.variants.length || parsed.important) return undefined;
  const attribute = node.parent;
  if (
    node.type !== "Literal" ||
    typeof node.value !== "string" ||
    attribute?.type !== "JSXAttribute" ||
    attribute.value !== node ||
    attribute.parent !== opening ||
    attribute.name.name !== "className"
  )
    return undefined;
  if (
    opening.attributes.some(
      (item) =>
        item.type === "JSXSpreadAttribute" ||
        (item.type === "JSXAttribute" && item.name.name === prop),
    )
  )
    return undefined;
  const raw = context.sourceCode.getText(node);
  const inner = raw.slice(1, -1);
  // An entity can hide a class's spelling, and the value is what the reader read.
  if (inner !== node.value || /&/.test(inner)) return undefined;
  const parts = inner.split(/(\s+)/);
  const at = parts.flatMap((part, index) =>
    index % 2 === 0 && part === parsed.cls ? [index] : [],
  );
  if (at.length !== 1) return undefined;
  const [index] = at;
  if (index + 1 < parts.length) parts.splice(index, 2);
  else parts.splice(Math.max(0, index - 1), index > 0 ? 2 : 1);
  const rest = parts.join("");
  return {
    messageId: "useProp",
    data: { cls: parsed.cls, written: writtenProp },
    fix: rest.trim()
      ? (fixer) => [
          fixer.insertTextBefore(attribute, `${writtenProp} `),
          fixer.replaceText(node, `${raw[0]}${rest}${raw[0]}`),
        ]
      : (fixer) => fixer.replaceText(attribute, writtenProp),
  };
}

/* ---------- the elements inside ---------- */

/** Whether a class's variants style the elements inside the one it is on: `*:` (each child), `**:`
    (every descendant), or an arbitrary variant that steps from `&` to a descendant or a child at
    depth 0, after a state or an attribute of the element too (`[&_svg]:`, `[&>li]:`,
    `[&:hover_svg]:`, `[&[data-state=open]>svg]:`, `[:where(&)_svg]:`; categories.js's
    variantReach). A state or a pseudo-element of the element itself does not. */
export const reachesInside = (variants) =>
  variants.some((variant) => variantReach(variant).reach === "inside");

/** The tag a layout or type primitive renders when no `as` says otherwise. */
const PRIMITIVE_TAG = {
  Box: "div",
  Stack: "div",
  Inline: "div",
  Flex: "div",
  Grid: "div",
  Bleed: "div",
  Text: "span",
};

/** Whether a selector's last compound can name a part's own element: anything but a tag does (`*`,
    `[data-slot=x]`, `.x`), and a tag names a primitive's element only where it renders that tag
    (its `as`, else its default; a Heading any of h1 to h6). A component's element may be any. */
function namesRoot(part, opening, target) {
  const tag = /^[a-z][a-z0-9]*/.exec(target)?.[0];
  if (!tag) return true;
  if (partData(part)?.kind === "component") return true;
  const as = opening.attributes.findLast(
    (item) => item.type === "JSXAttribute" && item.name.name === "as",
  );
  const value =
    as?.value &&
    unwrap(as.value.type === "JSXExpressionContainer" ? as.value.expression : as.value);
  if (as) return value?.type === "Literal" ? value.value === tag : true;
  return part === "Heading" ? /^h[1-6]$/.test(tag) : PRIMITIVE_TAG[part] === tag;
}

/** The JSX elements a node holds at its top: an element itself, the elements of a fragment, and
    those an expression gives (a condition's branches, a list's map), never what one holds. */
function topElements(node, keys, out = []) {
  if (!node || typeof node.type !== "string") return out;
  if (node.type === "JSXElement") {
    out.push(node);
    return out;
  }
  if (node.type === "JSXFragment") {
    node.children.forEach((child) => topElements(child, keys, out));
    return out;
  }
  if (node.type === "JSXText") return out;
  for (const key of keys[node.type] ?? [])
    for (const child of [node[key]].flat()) topElements(child, keys, out);
  return out;
}

/**
 * The kit part a class that styles the inside of an element reaches, or undefined: the element
 * itself when it is a kit part other than a layout primitive, whose inside is the kit's (a Text
 * that clamps draws a Truncate); else, among the elements the selector steps to in this file (the
 * children for `*:` and `>`, every descendant for `**:` and `_`), a kit component's inside, or a
 * part's own element where the selector's last compound can name it and the class is more than
 * its placement, which a part leaves to its caller (decision 7). A layout primitive's children,
 * and those of a primitive written inside, are the caller's, written here, and judged as such.
 */
function reachedPart(context, opening, parsed) {
  const step = parsed.variants.map(variantReach).find(({ reach }) => reach === "inside");
  const self = classOwnerOf(context, opening).part;
  if (self && partData(self)?.kind !== "layout-primitive") return self;
  const element = opening.parent;
  if (element?.type !== "JSXElement") return undefined;
  const keys = context.sourceCode.visitorKeys;
  const children = element.children.flatMap((child) => topElements(child, keys));
  const placement = isPlacement(parsed.cls);
  const visit = (candidates, deep) => {
    for (const candidate of candidates) {
      const part = classOwnerOf(context, candidate.openingElement).part;
      if (part) {
        if (deep && partData(part)?.kind === "component") return part;
        if (!placement && namesRoot(part, candidate.openingElement, step.target)) return part;
      }
      if (deep) {
        const found = visit(
          candidate.children.flatMap((child) => topElements(child, keys)),
          true,
        );
        if (found) return found;
        // What an attribute holds (a render prop, an icon) is inside too.
        for (const attribute of candidate.openingElement.attributes) {
          const held = visit(topElements(attribute, keys), true);
          if (held) return held;
        }
      }
    }
    return undefined;
  };
  return visit(children, step.combinator === "descendant");
}

/* ---------- one class on one element ---------- */

/**
 * What no-restyle says of one class on one JSX element, as `{ messageId, data, same? }`, or
 * undefined when it says nothing: the order at the head of this file, from step 1 on (a class
 * that styles the inside is the element's, not the part's, and is judged where the rule reads
 * sites). `memo` keeps the element's answers between its classes.
 */
function judge(context, opening, parsed, memo) {
  if (reachesInside(parsed.variants) || classify(parsed).owner) return undefined;
  const owner = (memo.owner ??= classOwnerOf(context, opening));
  const { part } = owner;
  if (!part || !partData(part) || partData(part).className === false) return undefined;
  if (PRIMITIVES.has(part) && PRIMITIVE_LAYOUT.test(parsed.base)) return undefined;
  if (CELLS.has(part) && CELL_STYLE.test(parsed.base)) return undefined;
  if (focusTargetAllows(opening, parsed.cls)) return undefined;
  const on =
    owner.via === "render"
      ? `the <${part}> <${owner.wrapper}> renders`
      : owner.via === "wrapper"
        ? `<${owner.wrapper}>, which forwards className to <${part}>,`
        : `<${part}>`;
  // A className contract takes what it names and nothing else.
  const taken = accepts(part, parsed.cls);
  if (taken) return undefined;
  if (taken === false)
    return {
      messageId: "contract",
      data: { cls: parsed.cls, on, takes: takesOf(part), family: familyOf(part) },
    };
  if (CELL_STYLE.test(parsed.base) && (memo.cell ??= inCell(context, opening)))
    return { messageId: "cell", data: { cls: parsed.cls, on } };
  const spread = opening.attributes.some((item) => item.type === "JSXSpreadAttribute");
  const writes = (prop) =>
    opening.attributes.some((item) => item.type === "JSXAttribute" && item.name.name === prop);
  const has = (prop) => spread || writes(prop);
  const found = restyleOf(part, parsed, has, writes);
  return found && { ...found, data: { cls: parsed.cls, on, ...found.data } };
}

/**
 * Whether no-restyle would report `cls` written in the string `node`, where that string is the
 * className of a JSX element (directly, or through a condition, a template or a helper call in
 * the attribute): for another rule's editor suggestion, which writes only a class every rule
 * passes where it is written (`bg-surface` on a Box is its backgroundColor). False in the kit's own
 * source, where the rule does not run, and for a string held anywhere else.
 */
export function restylesAt(context, node, cls) {
  if (isKitSourceFile(context)) return false;
  let at = node;
  while (at && at.type !== "JSXAttribute") {
    if (/Function|Statement|Declaration|Program|JSXElement/.test(at.type)) return false;
    at = at.parent;
  }
  if (at?.name?.type !== "JSXIdentifier" || at.name.name !== "className") return false;
  const [parsed] = classesOf(cls);
  return Boolean(parsed && judge(context, at.parent, parsed, {}));
}

export const restyleRules = defineRules({
  [RULE]: {
    description:
      "A class on a kit part does not change what the part sets itself; the part's prop does, or the part changes.",
    hasSuggestions: true,
    messages: {
      // `on` is the part the class lands on: `<Text>`, `the <Button> <DialogTrigger> renders`, or
      // `<Pad>, which forwards className to <TabsContent>,` for a component of the file.
      prop: '"{{cls}}" on {{on}} is its {{prop}} prop. Write {{written}} and drop the class.{{note}}',
      propKey:
        '"{{cls}}" on {{on}} changes the {{what}} its {{prop}} prop sets. {{advice}}{{note}}',
      own: '"{{cls}}" on {{on}} changes the {{what}} it sets itself ({{own}}, {{at}}). Drop it; a different {{what}} is a change to {{family}}.{{note}}',
      // A class the part already sets, in the same states: it changes nothing.
      repeats:
        '"{{cls}}" on {{on}} repeats what it sets itself ({{at}}). Drop it; it changes nothing.{{note}}',
      derived:
        '"{{cls}}" on {{on}} changes the {{what}} it sets from {{props}} ({{at}}). Drop it; a different {{what}} is a change to {{family}}.{{note}}',
      // `takes` is what the part's @accepts contract names: "layout", "colour, type and break-all".
      contract:
        '"{{cls}}" on {{on}} is outside what its className takes ({{takes}}). Drop it; anything else is a change to {{family}}.{{note}}',
      cell: '"{{cls}}" on {{on}} restyles the table cell it is drawn in. Cells are one style: drop "{{cls}}".{{note}}',
      // The editor suggestion that writes the prop in the class's place (propSuggestion).
      useProp: '"{{cls}}" becomes {{written}}.{{note}}',
      // `part` is the kit part it reaches: the element itself, or one written inside it.
      descendant:
        '"{{cls}}" styles the elements inside the one it is on and reaches <{{part}}>, a kit part this file does not own. Drop it; set each part through its own props.{{note}}',
    },
    create(context) {
      if (isKitSourceFile(context)) return {};
      const reader = classSites(context);
      const said = new Set();
      /** One report per string, class, message and part, however many sites reach the string. */
      const reportOnce = (node, messageId, data, suggest) => {
        const key = `${node.range}|${messageId}|${JSON.stringify(data)}`;
        if (said.has(key)) return;
        said.add(key);
        context.report({ node, messageId, data, ...(suggest ? { suggest } : {}) });
      };
      // A class that styles the inside of an element and reaches a kit part, on any element,
      // reported at the string, once however many elements it reaches.
      const descendants = reader.visitors((site) => {
        if (!site.element) return;
        for (const { text, node } of site.strings) {
          if (!text.includes(":")) continue;
          for (const parsed of classesOf(text))
            if (reachesInside(parsed.variants) && !classify(parsed).owner) {
              const part = reachedPart(context, site.element, parsed);
              if (part) reportOnce(node, "descendant", { cls: parsed.cls, part });
            }
        }
      });
      return {
        ...descendants,
        JSXOpeningElement(opening) {
          // Only a className, or a spread that may carry one, gives the element classes.
          if (
            !opening.attributes.some(
              (item) =>
                item.type === "JSXSpreadAttribute" ||
                (item.name.type === "JSXIdentifier" && item.name.name === "className"),
            )
          )
            return;
          const owner = classOwnerOf(context, opening);
          if (!owner.part || !partData(owner.part)) return;
          const memo = { owner };
          for (const site of reader.classSitesOf(opening))
            for (const { text, node } of site.strings)
              for (const parsed of classesOf(text)) {
                const found = judge(context, opening, parsed, memo);
                if (!found) continue;
                const suggestion =
                  found.same &&
                  owner.via === "self" &&
                  propSuggestion(
                    context,
                    opening,
                    node,
                    parsed,
                    found.same.prop,
                    found.data.written,
                  );
                reportOnce(
                  node,
                  found.messageId,
                  found.data,
                  suggestion ? [suggestion] : undefined,
                );
              }
        },
      };
    },
  },
});
