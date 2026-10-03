// A title is a Heading at the size it matches, or the kit part that draws it (PageHeader.Title,
// Section.Title, an overlay's title). A raw h1–h6 that carries type classes copies a title's look by
// hand, and drifts from the ramp the next time the ramp changes.
import { categoriesOf, variantReach } from "./categories.js";
import { classSites } from "./class-sites.js";
import { classesOf } from "./classes.js";
import { PACKAGE, isKitSourceFile, jsxTag, kitPartOf } from "./identity.js";
import { categoriesSetBy } from "./parts.js";
import { defineRules } from "./report.js";

/** The heading elements, by tag. */
const HEADING = /^h[1-6]$/;

/**
 * The tailwind-merge groups that set a title's type: the type style (`font-heading-page`,
 * `font-body`, `font-code`), the weight, the size (`text-xl`, `text-[20px]`), the line height and
 * the tracking. Colour, layout, `sr-only` and a focus target's `outline-none` are not type.
 */
const TYPE_GROUPS = new Set(["font-family", "font-weight", "font-size", "leading", "tracking"]);
/** Whether a parsed class sets the heading's own type, under any variant but one that reaches the
    elements inside it (`[&_svg]:`, `*:`), whose type is theirs. */
const isType = ({ cls, variants }) =>
  TYPE_GROUPS.has(categoriesOf(cls).group) &&
  !variants.some((variant) => variantReach(variant).reach === "inside");

/**
 * The Heading size a title's classes match, or undefined when they match none: the type style
 * names it (`font-heading-page` is page), and a body style at semibold is a section's title. The
 * earlier ramp's classes name the size that replaced them (no-deprecated-name's Heading sizes); its
 * `small`, which was both a page title and a section's, is a page title only at semibold.
 */
function sizeOf(bases) {
  const has = (base) => bases.has(base);
  if (has("font-heading-display") || has("font-heading-large")) return "display";
  if (
    has("font-heading-page") ||
    has("font-heading-medium") ||
    (has("font-heading-small") && has("font-semibold"))
  )
    return "page";
  if (has("font-heading-overlay") || has("font-heading-xsmall")) return "overlay";
  if (has("font-heading-section") || (has("font-body") && has("font-semibold"))) return "section";
  return undefined;
}

/** The kit part whose `render` holds the element, as `{ part, tag }`, or undefined. */
function renderHolder(context, node) {
  let value = node.parent;
  while (
    [
      "ConditionalExpression",
      "LogicalExpression",
      "TSAsExpression",
      "TSSatisfiesExpression",
    ].includes(value?.parent?.type)
  )
    value = value.parent;
  const container = value?.parent;
  const attribute = container?.type === "JSXExpressionContainer" ? container.parent : undefined;
  if (attribute?.type !== "JSXAttribute" || attribute.name.name !== "render") return undefined;
  const owner = attribute.parent;
  const part = kitPartOf(context, owner.name);
  return part ? { part, tag: jsxTag(owner.name) } : undefined;
}

/** The class string of the element's last `className`, when it is one plain JSX string that no
    spread after it can replace, else undefined: only then can a suggestion rewrite it in place. */
function plainClassName(node) {
  const index = node.attributes.findLastIndex(
    (item) => item.type === "JSXAttribute" && item.name.name === "className",
  );
  if (index < 0) return undefined;
  if (node.attributes.slice(index + 1).some((item) => item.type === "JSXSpreadAttribute"))
    return undefined;
  const attribute = node.attributes[index];
  return attribute.value?.type === "Literal" && typeof attribute.value.value === "string"
    ? attribute
    : undefined;
}

/** The fixes that take the type classes out of a plain className, dropping it when nothing else is
    left, or undefined when the string holds an entity a rewrite could split. */
function dropTypeFixes(context, attribute) {
  const raw = context.sourceCode.getText(attribute.value);
  const quote = raw[0];
  const inner = raw.slice(1, -1);
  if (/&(?:#\d+|#x[\da-f]+|[a-z][\da-z]*);/i.test(inner)) return undefined;
  const kept = inner.split(/\s+/).filter((cls) => cls && !classesOf(cls).every(isType));
  return (fixer) => {
    if (kept.length)
      return [fixer.replaceText(attribute.value, `${quote}${kept.join(" ")}${quote}`)];
    const before = context.sourceCode.getTokenBefore(attribute);
    return [fixer.removeRange([before.range[1], attribute.range[1]])];
  };
}

/**
 * How the file can write Heading: `{ name }` when it imports the kit's Heading (by its local name,
 * or as a namespace's member), `{ name: "Heading", add }` when it imports other parts by name from
 * the kit and nothing in it is called Heading yet, where `add` puts Heading in that import; else
 * undefined.
 */
function headingBinding(context) {
  let namespace;
  let named;
  for (const statement of context.sourceCode.ast.body) {
    if (statement.type !== "ImportDeclaration" || statement.source.value !== PACKAGE) continue;
    if (statement.importKind === "type") continue;
    for (const specifier of statement.specifiers) {
      if (
        specifier.type === "ImportSpecifier" &&
        specifier.importKind !== "type" &&
        (specifier.imported.name ?? specifier.imported.value) === "Heading"
      )
        return { name: specifier.local.name };
      if (specifier.type === "ImportNamespaceSpecifier") namespace ??= specifier.local.name;
    }
    const last = statement.specifiers.at(-1);
    if (last?.type === "ImportSpecifier") named ??= last;
  }
  if (namespace) return { name: `${namespace}.Heading` };
  const taken = context.sourceCode.scopeManager?.scopes.some((scope) => scope.set.has("Heading"));
  if (!named || taken) return undefined;
  return { name: "Heading", add: (fixer) => fixer.insertTextAfter(named, ", Heading") };
}

/** The type classes as a finding quotes them: the first three, then how many more. */
function quoted(classes) {
  const shown = classes.slice(0, 3).map((cls) => `"${cls}"`);
  if (classes.length > 3) shown.push(`${classes.length - 3} more`);
  return shown.join(", ");
}

export const headingRules = defineRules({
  "use-heading": {
    description:
      "A title is a Heading at the size it matches, or the kit part that draws it; a raw h1–h6 carries no type classes.",
    hasSuggestions: true,
    messages: {
      // `size` is the Heading size the classes match (sizeOf).
      heading:
        '<{{tag}}> carries type classes ({{classes}}), which copy a title\'s look by hand. Write <Heading size="{{size}}" as="{{tag}}">, or the kit part that draws this title (PageHeader.Title, Section.Title, DialogTitle).{{note}}',
      anySize:
        '<{{tag}}> carries type classes ({{classes}}), which copy a title\'s look by hand. Write a Heading at the title it matches, size="page", "section", "overlay" or "display", with as="{{tag}}", or the kit part that draws the title.{{note}}',
      // `part` is the kit part whose render holds the element, as written; it sets its title's type.
      rendered:
        "<{{tag}}> in {{part}}'s render carries type classes ({{classes}}), which change the type {{part}} sets for its title. Render the bare element, render={<{{tag}} />}, and let the part draw the type.{{note}}",
      // The editor suggestions.
      toHeading:
        '<{{tag}}> becomes <Heading size="{{size}}" as="{{tag}}">, without its type classes.{{note}}',
      dropType: "<{{tag}}> drops its type classes ({{classes}}).{{note}}",
    },
    create(context) {
      // Product code: the kit's own parts draw their titles from its own classes.
      if (isKitSourceFile(context)) return {};
      return {
        JSXOpeningElement(node) {
          if (node.name.type !== "JSXIdentifier" || !HEADING.test(node.name.name)) return;
          const tag = node.name.name;
          // Its className, through a const, a map, a helper or a spread too (class-sites.js).
          const sites = classSites(context).classSitesOf(node);
          const found = [];
          let at;
          for (const site of sites)
            for (const { text } of site.strings)
              for (const parsed of classesOf(text))
                if (isType(parsed)) {
                  found.push(parsed);
                  at ??= site.at;
                }
          if (!found.length) return;
          const classes = quoted(found.map(({ cls }) => cls));
          const attribute = plainClassName(node);
          const holder = renderHolder(context, node);
          if (holder && categoriesSetBy(holder.part).includes("typography")) {
            const fix = attribute && dropTypeFixes(context, attribute);
            context.report({
              node: at ?? node,
              messageId: "rendered",
              data: { tag, part: holder.tag, classes },
              ...(fix ? { suggest: [{ messageId: "dropType", data: { tag, classes }, fix }] } : {}),
            });
            return;
          }
          const size = sizeOf(new Set(found.map(({ base }) => base)));
          if (!size) {
            context.report({ node: at ?? node, messageId: "anySize", data: { tag, classes } });
            return;
          }
          // The suggestion: the element as a Heading of that size and level, its other classes
          // kept, where the class string can be rewritten in place, the file can name Heading and
          // the element sets nothing Heading does not take (a style).
          const styled = node.attributes.some(
            (item) => item.type === "JSXAttribute" && item.name.name === "style",
          );
          const binding = attribute && !styled && headingBinding(context);
          const drop = binding && dropTypeFixes(context, attribute);
          const closing = node.parent.closingElement;
          const fix =
            drop &&
            ((fixer) => [
              fixer.replaceText(node.name, `${binding.name} size="${size}" as="${tag}"`),
              ...(closing ? [fixer.replaceText(closing.name, binding.name)] : []),
              ...drop(fixer),
              ...(binding.add ? [binding.add(fixer)] : []),
            ]);
          context.report({
            node: at ?? node,
            messageId: "heading",
            data: { tag, size, classes },
            ...(fix ? { suggest: [{ messageId: "toHeading", data: { tag, size }, fix }] } : {}),
          });
        },
      };
    },
  },
});
