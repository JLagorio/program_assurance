// What each kit part sets itself, for a rule that asks whether a class on a part changes something
// the part decides (batch 8's ledger/no-restyle): eslint-plugin/parts.json, which `npm run
// build:lint` writes from the kit's source (build/lint-parts.mjs). Nothing is read at import; the
// file is read the first time a rule asks about a part, and then kept.
//
// A part's record:
//   kind     `layout-primitive` (Box, Stack, Inline, Flex, Grid, Bleed), `type-primitive` (Text,
//            Heading) or `component`
//   file     where the function that renders it is, under the kit's src, and its line
//   root     the classes it always puts on the element a caller's className reaches, by key
//   props    the classes each value of a prop puts there, by prop, key and value (`true` for a
//            flag, `*` for any value given, `!x` for any value but x, unset included, `unset`
//            when it is not given)
//   derived  the classes it puts there through a value made from several props, by key, with the
//            props it is made from, and `unset`, those of them it puts there when the caller
//            writes none of those props (Alert's neutral fill), where the build could tell
//   sets     each category the classes above change, with their keys (categories.js)
//   accepts  its className's contract, from an `@accepts` tag on the prop in the kit's source: the
//            categories and the classes a caller may add there ("layout" for a field whose
//            className places it, "color typography break-all" for Id)
//   className  false for a part whose props take no className: no caller's class meets it
//   unread   where the build's reader stopped: the part may set more there than the data says
// A key is a class's tailwind-merge group (`gap`, `text-color`), `utility:<name>` for a kit
// @utility the merge config does not place with its own kind, or `class:<name>` for a class in no
// group (categories.js's categoriesOf).
//
// A focus target is the one built-in exception: an element the kit moves focus to by script, with
// a literal tabIndex={-1} (a step's heading, a page's main), may drop and redraw its own outline,
// as the kit's own do (preview-sheet.tsx, shell/root.tsx).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CATEGORIES, categoriesOf, conflictingGroups, replaces } from "./categories.js";
import { classesOf, offerReplacement } from "./classes.js";
import { generatedPath, lintFacts } from "./data.js";
import { unwrap } from "./values.js";

const here = path.dirname(fileURLToPath(import.meta.url));
/** Where the build writes the data. */
export const partsPath = path.join(here, "parts.json");

/* ---------- reading ---------- */

let parts;
/** parts.json's parts, read on first use; an error that names the fix when it is missing or
    unreadable. */
function partsOf() {
  if (!parts) {
    let text;
    try {
      text = fs.readFileSync(partsPath, "utf8");
    } catch {
      throw new Error(
        "Ledger lint data is missing: eslint-plugin/parts.json is not there. Run npm run build:lint in @ledger/design-system, or reinstall the package.",
      );
    }
    try {
      parts = JSON.parse(text).parts;
    } catch (error) {
      throw new Error(
        `Ledger lint data is unreadable: eslint-plugin/parts.json (${error.message}). Run npm run build:lint in @ledger/design-system.`,
      );
    }
  }
  return parts;
}

/** Every public part and member the data describes (`Table.Cell`, `Shell.TopNav.Item`), sorted. */
export const partNames = () => Object.keys(partsOf());

/** A part's record as parts.json holds it, or undefined for a name the kit does not export
    (`Shell.Nope`). */
export const partData = (name) => (Object.hasOwn(partsOf(), name) ? partsOf()[name] : undefined);

/* ---------- what a part sets ---------- */

/**
 * Each class a part puts on its element, with how: `{ cls, key, via: "root" }`, `{ cls, key, via:
 * "prop", prop, value }` or `{ cls, key, via: "derived", props }` (with `unset: true` where the
 * part puts it there when none of those props is written), in that order. Empty for a name the
 * data does not describe.
 */
const settingsByPart = new Map();
export function settingsOf(name) {
  let found = settingsByPart.get(name);
  if (found) return found;
  const record = partData(name);
  found = [];
  if (record) {
    for (const [key, classes] of Object.entries(record.root ?? {}))
      for (const cls of classes) found.push({ cls, key, via: "root" });
    for (const [prop, byKey] of Object.entries(record.props ?? {}))
      for (const [key, byValue] of Object.entries(byKey))
        for (const [value, classes] of Object.entries(byValue))
          for (const cls of classes) found.push({ cls, key, via: "prop", prop, value });
    for (const [key, { props, classes, unset = [] }] of Object.entries(record.derived ?? {}))
      for (const cls of classes)
        found.push({
          cls,
          key,
          via: "derived",
          props,
          ...(unset.includes(cls) ? { unset: true } : {}),
        });
  }
  settingsByPart.set(name, Object.freeze(found));
  return found;
}

/** A part's settings by the keys and merge groups of their classes, so a class meets only those it
    could change. */
const settingsByKey = new Map();
function indexOf(name) {
  let index = settingsByKey.get(name);
  if (!index) {
    index = new Map();
    const add = (at, setting) => {
      const list = index.get(at);
      if (!list) index.set(at, [setting]);
      else if (!list.includes(setting)) list.push(setting);
    };
    for (const setting of settingsOf(name)) {
      add(setting.key, setting);
      const { group } = categoriesOf(setting.cls);
      if (group) add(group, setting);
    }
    settingsByKey.set(name, index);
  }
  return index;
}

/** A class as classesOf reads it and what its variants style, kept by class. */
const readings = new Map();
function readingOf(cls) {
  let found = readings.get(cls);
  if (!found) {
    if (readings.size > 20_000) readings.clear();
    const [parsed] = classesOf(cls);
    found = parsed ? { parsed, target: targetOf(parsed.variants) } : { parsed: undefined };
    readings.set(cls, found);
  }
  return found;
}

/** The pseudo-elements a variant can style instead of the element (`before:`, `placeholder:`). */
const PSEUDO_ELEMENTS = new Set([
  "before",
  "after",
  "backdrop",
  "details-content",
  "file",
  "first-letter",
  "first-line",
  "marker",
  "placeholder",
  "selection",
]);
/** What a class's variants style: the element itself (""), or its pseudo-element (`after`,
    `[&::-webkit-scrollbar]`). */
const targetOf = (variants) =>
  variants
    .filter(
      (variant) =>
        PSEUDO_ELEMENTS.has(variant) || (variant.startsWith("[") && variant.includes("::")),
    )
    .join(":");

/**
 * What a part sets that a caller's class would change, whatever the states and conditions on
 * either: each of its settings on the same element or pseudo-element whose class is in the class's
 * key, or in a group the class replaces where cn() merges (`py-200` on a part that sets `pt-150`;
 * `gap-150` on Tabs, whose gap is `data-[orientation=vertical]:gap-100`). A part's `after:` border
 * is no setting a caller's `border-*` changes. Empty when the part sets nothing there, or the data
 * does not describe it.
 */
export function settingsChangedBy(name, cls) {
  const { parsed, target } = readingOf(cls);
  if (!parsed) return [];
  const { key, group } = categoriesOf(cls);
  const index = indexOf(name);
  // Only a setting in the class's key, its group or a group it replaces can be one it changes.
  const near = new Set(index.get(key));
  if (group)
    for (const at of [group, ...conflictingGroups(group, true)])
      for (const setting of index.get(at) ?? []) near.add(setting);
  return settingsOf(name).filter((setting) => {
    if (!near.has(setting)) return false;
    const own = readingOf(setting.cls);
    if (!own.parsed || own.target !== target) return false;
    return setting.key === key || replaces(parsed.base, own.parsed.base);
  });
}

/** The categories a part's classes change (its record's `sets`), in CATEGORIES order. */
export const categoriesSetBy = (name) =>
  CATEGORIES.filter((category) => partData(name)?.sets?.[category]?.length);

/* ---------- which part sets a class ---------- */

let byClass;
const KIND_ORDER = ["type-primitive", "layout-primitive", "component"];
const VIA_ORDER = ["prop", "root", "derived"];
/**
 * Every part that puts a class, as written, on its element, with how (settingsOf's, with `part`
 * and `kind`): the primitives first, then the components; a prop's value before a part's root
 * (`font-body-small` is Text size="small" first). Empty for a class no part sets.
 */
export function partsSetting(cls) {
  if (!byClass) {
    byClass = new Map();
    for (const name of partNames()) {
      const kind = partData(name).kind;
      for (const setting of settingsOf(name)) {
        const list = byClass.get(setting.cls) ?? [];
        list.push(Object.freeze({ part: name, kind, ...setting }));
        byClass.set(setting.cls, list);
      }
    }
    for (const list of byClass.values())
      list.sort(
        (a, z) =>
          KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(z.kind) ||
          VIA_ORDER.indexOf(a.via) - VIA_ORDER.indexOf(z.via) ||
          (a.part < z.part ? -1 : a.part > z.part ? 1 : 0),
      );
  }
  return byClass.get(cls) ?? [];
}

/* ---------- a part's className contract ---------- */

/** A part's `@accepts` entries as `{ categories, classes }`, or undefined when its className has
    no contract. */
export function acceptsOf(name) {
  const entries = partData(name)?.accepts;
  if (!entries?.length) return undefined;
  return {
    categories: entries.filter((entry) => CATEGORIES.includes(entry)),
    classes: entries.filter((entry) => !CATEGORIES.includes(entry)),
  };
}

/**
 * Whether a part's contract takes a class: its base is one the contract lists (`break-all`, under
 * any variant), or every category it changes is one the contract names. Undefined for a part
 * whose className has no contract.
 */
export function accepts(name, cls) {
  const contract = acceptsOf(name);
  if (!contract) return undefined;
  const [parsed] = classesOf(cls);
  if (!parsed) return false;
  if (contract.classes.includes(parsed.base)) return true;
  const { categories } = categoriesOf(cls);
  return (
    categories.length > 0 && categories.every((category) => contract.categories.includes(category))
  );
}

/** The edit distance between two words, for "did you mean". */
function distance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const next = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = next;
    }
  }
  return row[b.length];
}

/** The categories and the class names an entry could have meant: the kit's @utility names and
    its token classes. */
let spellings;
function spellingsOf() {
  if (!spellings) {
    const at = generatedPath("utilities.json");
    const classes = at ? JSON.parse(fs.readFileSync(at, "utf8")).classes : [];
    spellings = [...CATEGORIES, ...new Set([...lintFacts().utilities, ...classes])];
  }
  return spellings;
}

/**
 * Why a part's `@accepts` entry is no contract, as a sentence, or undefined when it is one: an
 * entry is a category or one class no Ledger class rule reports. The build stops on it
 * (build/lint-parts.mjs), naming the nearest category or class.
 */
export function acceptsProblem(name, entry) {
  if (CATEGORIES.includes(entry)) return undefined;
  const [parsed] = classesOf(entry);
  if (parsed && parsed.cls === entry && parsed.variants.length === 0 && offerReplacement(entry))
    return undefined;
  let best;
  for (const candidate of spellingsOf()) {
    const far = distance(entry, candidate);
    if (far <= Math.max(1, Math.floor(entry.length / 3)) && (!best || far < best.far))
      best = { candidate, far };
  }
  return `${name}: @accepts "${entry}" is not a category (${CATEGORIES.join(", ")}) or a class the kit knows.${best ? ` Did you mean "${best.candidate}"?` : ""}`;
}

/* ---------- a focus target ---------- */

/** The outline classes a focus target may carry: it drops the browser's ring and draws the kit's
    on keyboard focus. */
export const FOCUS_TARGET_CLASSES = Object.freeze([
  "outline-none",
  "outline-hidden",
  "outline-focused",
]);

/** Whether a JSX opening element is a focus target: it carries a literal tabIndex={-1} (or
    "-1"), so script moves focus to it and Tab never reaches it. */
export function isFocusTarget(opening) {
  const attribute = opening?.attributes?.findLast(
    (candidate) => candidate.type === "JSXAttribute" && candidate.name.name === "tabIndex",
  );
  if (!attribute?.value) return false;
  const value = unwrap(attribute.value);
  if (value?.type === "Literal") return String(value.value).trim() === "-1";
  return (
    value?.type === "UnaryExpression" &&
    value.operator === "-" &&
    value.argument.type === "Literal" &&
    value.argument.value === 1
  );
}

/** Whether a class on an element is one a focus target may carry (FOCUS_TARGET_CLASSES, under
    any variant) and the element is one. */
export function focusTargetAllows(opening, cls) {
  const [parsed] = classesOf(cls);
  return Boolean(parsed) && FOCUS_TARGET_CLASSES.includes(parsed.base) && isFocusTarget(opening);
}
