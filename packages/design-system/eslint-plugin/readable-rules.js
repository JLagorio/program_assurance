// Rules that ask the class reader (class-sites.js) what it could not read. A class the reader
// cannot see is a class no Ledger rule checks, so on a kit part, where the classes restyle the
// kit, it is a finding of its own. Ported from @shadcn/lint's require-static-classes, with the
// shapes the kit writes readable rather than turned off: a Base UI className callback, a map keyed
// by a typed prop, a forwarded className, a merge helper, a cva or tv recipe, a same-file
// function, and a value imported from the kit itself or from another package.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CLASS_KEY, SLOT_MAP_KEY, classSites } from "./class-sites.js";
import { PACKAGE, kitSrcOf } from "./identity.js";
import { defineRules } from "./report.js";
import {
  bindingOf,
  importOf,
  importedChain,
  keyName,
  memberKey,
  objectsOf,
  unwrap,
  variableOf,
} from "./values.js";

const here = path.dirname(fileURLToPath(import.meta.url));
/** Each part's own styling props (components.json's `styleProps`, from the build's TypeScript
    program): what a finding offers before it offers a class. */
const STYLE_PROPS =
  JSON.parse(fs.readFileSync(path.join(here, "components.json"), "utf8")).styleProps ?? {};
/** The props a finding names at most, in the order the inventory gives them. */
const SHOWN_PROPS = 3;

/** The reader's reasons, by the message id a finding says them with; any other is `expression`. */
const REASONS = {
  imported: "imported",
  "imported-call": "importedCall",
  call: "call",
  "tagged-template": "call",
  prop: "prop",
  reassigned: "reassigned",
  member: "member",
  spread: "spread",
};

/** The origins of a class site that land on an element: its attribute, a readable object spread
    onto it, and a slot map (react-day-picker's `classNames`) it is given. */
const ORIGINS = new Set(["attribute", "spread", "slot-map"]);

/** Whether a call along an import's chain is given something to work on: arguments, or a tagged
    template's holes. */
const takesArguments = (call) =>
  call.type === "TaggedTemplateExpression"
    ? call.quasi.expressions.length > 0
    : call.arguments.length > 0;

/**
 * Where a value is imported from, when it starts from an import, through the consts that hold it
 * (values.js's importedChain): `kit` for the kit (the package, or in the kit's own source a
 * relative import that stays inside its src), `package` for another package named by a bare
 * specifier (react-day-picker), whose classes are not the kit's vocabulary, and `local` for the
 * product's own modules (a relative, `@/`, `~/` or `#` path). `called` says whether a call along
 * the way reads the value, and `given` whether one is handed arguments, which the file writes and
 * no rule reads inside another package.
 */
function importedFrom(context, node) {
  const chain = importedChain(context, node);
  const binding = chain && importOf(variableOf(context, chain.root));
  if (!binding) return undefined;
  const { source } = binding;
  const called = chain.calls.length > 0;
  const given = chain.calls.some(takesArguments);
  const found = (from) => ({ source, from, called, given, root: chain.root });
  if (source === PACKAGE || source.startsWith(`${PACKAGE}/`)) return found("kit");
  if (source.startsWith(".")) {
    const src = kitSrcOf(context);
    if (src) {
      const inside = path.relative(src, path.resolve(path.dirname(context.filename), source));
      if (!inside.startsWith("..") && !path.isAbsolute(inside)) return found("kit");
    }
    return found("local");
  }
  return found(/^(\/|@\/|~\/|#)/.test(source) ? "local" : "package");
}

/** The prop a "prop" entry reads: a destructured parameter's key, the slot a const destructures
    from the props object, or the first member read off the props object (`props.cls`,
    `props["cls"]`, `props.classNames.root` is classNames). */
function propName(context, node) {
  const value = unwrap(node);
  const chain = [];
  let root = value;
  while (root?.type === "MemberExpression") {
    chain.unshift(root);
    root = unwrap(root.object);
  }
  if (root?.type !== "Identifier") return context.sourceCode.getText(value);
  const found = bindingOf(context, root);
  const own = found.parameter?.key ?? found.steps?.[0]?.key;
  // A destructured prop, or a slot of the props object, is the prop itself.
  if (own !== undefined && own !== null) return own;
  if (!chain.length) return root.name;
  // The whole props object: the first member read off it.
  return memberKey(chain[0]) ?? context.sourceCode.getText(chain[0].property);
}

/** What a finding leads with: the part and the attribute, or the element that renders the part. */
const subjectOf = (site) =>
  site.owner.via === "render"
    ? `<${site.owner.wrapper}> renders <${site.owner.part}>, whose ${site.attribute}`
    : `<${site.owner.part}> ${site.attribute}`;

/** What to write instead: the part's own styling props first, then the classes where they are
    read. When the element renders the part, the subject has named both, so the advice is short. */
function adviceFor(site) {
  const part = site.owner.part;
  const props = Object.hasOwn(STYLE_PROPS, part) ? STYLE_PROPS[part].slice(0, SHOWN_PROPS) : [];
  if (!props.length) return "Write the classes here, or in a map in this file.";
  if (site.owner.via === "render")
    return `Use its prop (${props.join(", ")}), or write layout classes here or in a map in this file.`;
  return `Use ${/^[AEIOU]/.test(part) ? "an" : "a"} ${part} prop (${props.join(", ")}); for layout the part leaves to its caller, write the classes here or in a map in this file.`;
}

const UNREAD = "so no Ledger rule can check it. {{advice}}{{note}}";

export const readableRules = defineRules({
  "readable-classes": {
    description:
      "A className on a kit part is one the class rules can read: written in the file, or in a map, a helper or a recipe the file declares or imports from the kit.",
    messages: {
      imported: `{{subject}} is imported from "{{source}}", ${UNREAD}`,
      importedCall: `{{subject}} comes from a function imported from "{{source}}", ${UNREAD}`,
      call: `{{subject}} comes from a call the lint cannot follow, ${UNREAD}`,
      prop: `{{subject}} comes from the prop "{{prop}}", ${UNREAD}`,
      reassigned: `{{subject}} comes from a variable written again after its first value, ${UNREAD}`,
      member: `{{subject}} comes from a member the lint cannot find, ${UNREAD}`,
      spread: `{{subject}} sits behind a spread the lint cannot read, ${UNREAD}`,
      expression: `{{subject}} comes from an expression the lint cannot read, ${UNREAD}`,
    },
    create(context) {
      // A value two sites read is reported once, at the first.
      const reported = new WeakSet();
      const reader = classSites(context);
      /** The class values a kit recipe's call is handed (`buttonVariants({ className: cls })`),
          which land on the part with the recipe's classes: each is a key site of its own. */
      const recipeEntries = (call) =>
        call.type !== "CallExpression"
          ? []
          : call.arguments.flatMap((argument) =>
              objectsOf(context, argument).flatMap((object) =>
                object.properties
                  .filter((property) => CLASS_KEY.test(keyName(property) ?? ""))
                  .flatMap((property) => reader.sitesAt(property)),
              ),
            );
      const check = (site, unresolved) => {
        for (const entry of unresolved) {
          const { node, reason } = entry;
          // A class glued together at runtime is no-non-token-class's (its runtime cause).
          if (reason === "glued-template" || reported.has(node)) continue;
          // The import the reader followed, held in a const or not.
          const imported =
            importedFrom(context, entry.at ?? node) ??
            (entry.at ? importedFrom(context, node) : undefined);
          if (imported?.from === "kit") {
            // The kit's classes are read where the kit declares them; a class value handed to
            // one of its recipes lands here and is read as this site's.
            reported.add(node);
            for (const inner of recipeEntries(unwrap(node))) check(site, inner.unresolved);
            continue;
          }
          // Another package's classes are not the kit's vocabulary, unless the file hands its
          // function what it returns (`join([cls, "…"], " ")`).
          if (imported?.from === "package" && !imported.given) continue;
          reported.add(node);
          const messageId = imported
            ? imported.called
              ? "importedCall"
              : "imported"
            : Object.hasOwn(REASONS, reason)
              ? REASONS[reason]
              : "expression";
          context.report({
            node,
            messageId,
            data: {
              subject: subjectOf(site),
              advice: adviceFor(site),
              ...(imported ? { source: imported.source } : {}),
              ...(messageId === "prop" ? { prop: propName(context, node) } : {}),
            },
          });
        }
      };
      return reader.visitors((site) => {
        if (!ORIGINS.has(site.origin)) return;
        if (!CLASS_KEY.test(site.attribute) && !SLOT_MAP_KEY.test(site.attribute)) return;
        if (!site.unresolved.length || !site.owner.part) return;
        check(site, site.unresolved);
      });
    },
  },
});
