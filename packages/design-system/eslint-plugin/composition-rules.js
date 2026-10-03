// Observable, local composition errors. Cross-file workflow behavior belongs in browser tests.
import { classSites } from "./class-sites.js";
import { forwardedTo, kitPartOf, partNameOf } from "./identity.js";
import { defineRules } from "./report.js";

const attribute = (node, name) =>
  node.attributes.find((item) => item.type === "JSXAttribute" && item.name.name === name);
const literal = (node) => {
  if (node?.type === "JSXExpressionContainer") return literal(node.expression);
  return node?.type === "Literal" ? node.value : undefined;
};
/**
 * The name the behaviour rules (text-link-navigation, dialog-footer-order) judge a tag by, since
 * the defect is the same in any part of that name (identity.js): an alias or a namespace member of
 * the kit is the kit's name, a look-alike or another package's part keeps its name as written, and
 * a parameter or a local that shadows an outer name is no part ("").
 */
const kitNames = (context) => ({ name: (node) => partNameOf(context, node) });

// Product policies apply to the actual kit import, including aliases and namespace imports.
// A same-named local component or a shadowed parameter is not a kit component (identity.js).
const importedKitName = kitPartOf;

function unwrap(node) {
  while (
    node &&
    [
      "JSXExpressionContainer",
      "TSAsExpression",
      "TSSatisfiesExpression",
      "TSNonNullExpression",
    ].includes(node.type)
  )
    node = node.expression;
  return node;
}

function explicitProp(node, name, value) {
  const index = node.attributes.findLastIndex(
    (item) => item.type === "JSXAttribute" && item.name.name === name,
  );
  if (
    index < 0 ||
    node.attributes.slice(index + 1).some((item) => item.type === "JSXSpreadAttribute")
  )
    return false;
  const prop = node.attributes[index];
  return prop.value === null ? value === true : literal(unwrap(prop.value)) === value;
}

function tabLayoutOverride(context, node) {
  // Its className, through a const, a map, a helper or a spread too (class-sites.js).
  const sites = classSites(context).classSitesOf(node);
  const forbiddenClass = sites
    .flatMap((site) => site.strings.flatMap(({ text }) => text.split(/\s+/)))
    .find((value) =>
      /^(flex-wrap(?:-reverse)?|(?:min-|max-)?w-fit|overflow(?:-[xy])?-.+)$/.test(
        value.split(":").at(-1).replace(/^!|!$/g, ""),
      ),
    );
  if (forbiddenClass) return { node: sites[0].at, value: forbiddenClass };
  const style = attribute(node, "style");
  const expression = unwrap(style?.value);
  if (expression?.type !== "ObjectExpression") return null;
  for (const property of expression.properties) {
    if (property.type !== "Property") continue;
    const name = property.key.name ?? property.key.value;
    const value = literal(unwrap(property.value));
    if (
      (["overflow", "overflowX", "overflowY"].includes(name) &&
        !(property.value.type === "Identifier" && property.value.name === "undefined")) ||
      (name === "flexWrap" && ["wrap", "wrap-reverse"].includes(value)) ||
      (["width", "minWidth", "maxWidth"].includes(name) && value === "fit-content")
    )
      return { node: property, value: name, style: true };
  }
  return null;
}

/** Footers whose Cancel comes before the primary, and the parts that dismiss. */
const FOOTERS = /^(Dialog|AlertDialog|Sheet|Drawer)Footer$/;
const CLOSES = /^(Dialog|Sheet|Drawer)Close$|^AlertDialogCancel$/;
/** What each footer's cancel dismisses, as a finding names it. */
const SURFACE = { Dialog: "dialog", AlertDialog: "alert dialog", Sheet: "sheet", Drawer: "drawer" };

/** A JSX opening element's tag as written: `DataTable`, `Kit.TabsList`. */
const tagOf = (context, opening) => context.sourceCode.getText(opening.name);

/**
 * How an element writes a prop a product rule needs set to one literal, as a finding says it:
 * `leaves variant to a prop spread` when a spread follows it or stands in for it, `sets
 * variant="default"` or `sets responsive={false}` as written (a long expression by its name alone),
 * and `missing` when neither is there.
 */
function propState(context, node, name, missing) {
  const index = node.attributes.findLastIndex(
    (item) => item.type === "JSXAttribute" && item.name.name === name,
  );
  const spread = node.attributes
    .slice(index + 1)
    .some((item) => item.type === "JSXSpreadAttribute");
  if (spread) return `leaves ${name} to a prop spread`;
  if (index < 0) return missing;
  const written = context.sourceCode.getText(node.attributes[index]).replace(/\s+/g, " ");
  return written.length <= 40 ? `sets ${written}` : `sets ${name} from an expression`;
}

export const compositionRules = defineRules({
  "product-responsive-table": {
    description:
      "A product DataTable stays responsive: it never turns responsive off, nor leaves it to a spread.",
    messages: {
      // `state` is how the prop is written (propState): `sets responsive={false}`.
      off: "<{{tag}}> {{state}}, so a narrow frame scrolls it sideways instead of folding lower-priority columns into More fields. A DataTable is responsive by default: remove the prop.{{note}}",
      spread:
        "<{{tag}}> leaves responsive to a prop spread, which can turn it off and scroll the table sideways instead of folding lower-priority columns into More fields. Write responsive after the spread.{{note}}",
    },
    create: (context) => ({
      JSXOpeningElement(node) {
        if (importedKitName(context, node.name) !== "DataTable") return;
        const index = node.attributes.findLastIndex(
          (item) => item.type === "JSXAttribute" && item.name.name === "responsive",
        );
        const spread = node.attributes
          .slice(index + 1)
          .some((item) => item.type === "JSXSpreadAttribute");
        const tag = tagOf(context, node);
        if (spread) context.report({ node, messageId: "spread", data: { tag } });
        else if (index >= 0 && !explicitProp(node, "responsive", true))
          context.report({
            node,
            messageId: "off",
            data: { tag, state: propState(context, node, "responsive", "") },
          });
      },
    }),
  },
  "product-line-tabs": {
    description: "Product tabs use the full-width line variant and the kit's single-row scroller.",
    messages: {
      // `state` is how the prop is written (propState).
      variant:
        '<{{tag}}> {{state}}. Product tabs are the line variant, whose underline spans the content width: write variant="line" after any prop spreads.{{note}}',
      // `subject` is the class ("flex-wrap") or the style property (style.overflowX).
      override:
        "{{subject}} on <{{tag}}> changes how the tab strip wraps, sizes or scrolls, which the kit owns: one row that scrolls, under a line across the content width. Drop it.{{note}}",
    },
    create: (context) => ({
      JSXOpeningElement(node) {
        if (importedKitName(context, node.name) !== "TabsList") return;
        const tag = tagOf(context, node);
        if (!explicitProp(node, "variant", "line"))
          context.report({
            node,
            messageId: "variant",
            data: { tag, state: propState(context, node, "variant", "takes the default variant") },
          });
        const override = tabLayoutOverride(context, node);
        if (override)
          context.report({
            node: override.node,
            messageId: "override",
            data: {
              tag,
              value: override.value,
              subject: override.style ? `style.${override.value}` : `"${override.value}"`,
            },
          });
      },
    }),
  },
  "no-native-confirm": {
    description: "Use an in-app AlertDialog for a decision.",
    messages: {
      // `call` is the call as the browser's global names it: window.confirm(), confirm().
      confirm:
        "{{call}} opens the browser's own dialog, which blocks the page and cannot show a pending state, keep a draft or say that the command failed. Ask in an AlertDialog: AlertDialogCancel first as the safe answer, then an AlertDialogAction named for the command.{{note}}",
    },
    create: (context) => ({
      CallExpression(node) {
        const callee = node.callee;
        let native = false;
        if (callee.type === "MemberExpression") {
          const name = callee.computed ? literal(callee.property) : callee.property.name;
          native =
            name === "confirm" &&
            callee.object.type === "Identifier" &&
            ["window", "globalThis", "self"].includes(callee.object.name);
        } else if (callee.type === "Identifier" && callee.name === "confirm") {
          let scope = context.sourceCode.getScope(node);
          while (scope && !scope.set.has("confirm")) scope = scope.upper;
          native = !scope || scope.set.get("confirm").defs.length === 0;
        }
        if (native)
          context.report({
            node,
            messageId: "confirm",
            data: {
              call:
                callee.type === "MemberExpression"
                  ? `${callee.object.name}.confirm()`
                  : "confirm()",
            },
          });
      },
    }),
  },
  "text-link-navigation": {
    description: "TextLink renders navigation; actions use Button.",
    messages: {
      destination:
        "TextLink needs a destination: an href, or a router link in render. An action that reads as text is a Button.{{note}}",
      anchor: "TextLink must render an anchor or a router link. Use Button for an action.{{note}}",
      // `wrapper` is the component of this file that hands its props on to the TextLink.
      forwardedDestination:
        "<{{wrapper}}> forwards its props to <TextLink>, which needs a destination: an href, or a router link in render. An action that reads as text is a Button.{{note}}",
      forwardedAnchor:
        "<{{wrapper}}> forwards render to <TextLink>, which must render an anchor or a router link. Use Button for an action.{{note}}",
    },
    create(context) {
      const names = kitNames(context);
      const spreads = (node) => node.attributes.some((item) => item.type === "JSXSpreadAttribute");
      /** The TextLink a component of this file hands `prop` on to, as its element. */
      const textLinkFor = (node, prop) => {
        const forwarded = forwardedTo(context, node, prop);
        return forwarded && names.name(forwarded.element.name) === "TextLink"
          ? forwarded
          : undefined;
      };
      return {
        JSXOpeningElement(node) {
          const render = attribute(node, "render");
          let wrapper;
          if (names.name(node.name) !== "TextLink") {
            // A component of this file that hands its props on to a TextLink, which sets no
            // destination of its own, needs one from its caller.
            if (!/^[A-Z]/.test(node.name.name ?? "")) return;
            if (render) {
              const forwarded = textLinkFor(node, "render");
              if (!forwarded) return;
              wrapper = forwarded.wrapper;
            } else {
              const forwarded = textLinkFor(node, "href");
              const own = forwarded?.element;
              if (
                own &&
                !attribute(own, "href") &&
                !attribute(own, "render") &&
                own.attributes.filter((item) => item.type === "JSXSpreadAttribute").length === 1 &&
                !attribute(node, "href") &&
                !spreads(node)
              )
                context.report({
                  node,
                  messageId: "forwardedDestination",
                  data: { wrapper: forwarded.wrapper },
                });
              return;
            }
          }
          if (!wrapper && !render && !attribute(node, "href") && !spreads(node)) {
            context.report({ node, messageId: "destination" });
            return;
          }
          const element = render?.value?.expression;
          if (element?.type !== "JSXElement") return;
          const rendered = names.name(element.openingElement.name);
          // Custom router components are allowed; their ref/anchor contract is verified in browser tests.
          if (
            /^[a-z]/.test(rendered) ? rendered !== "a" : ["Button", "IconButton"].includes(rendered)
          )
            context.report({
              node: render,
              ...(wrapper
                ? { messageId: "forwardedAnchor", data: { wrapper } }
                : { messageId: "anchor" }),
            });
        },
      };
    },
  },
  "dialog-footer-order": {
    description: "Cancel precedes the primary action in a dialog footer.",
    messages: {
      // `tag` is the late cancel as written, `footer` the footer, `surface` what it closes.
      order:
        "<{{tag}}> dismisses the {{surface}} but comes after the primary action in <{{footer}}>. Put it first: the safe answer leads, and the primary ends the footer, where a keyboard reader reaches it last.{{note}}",
      // `footer` is a component of this file that hands its children on to `part`.
      forwarded:
        "<{{tag}}> dismisses the {{surface}} but comes after the primary action in <{{footer}}>, which forwards its children to <{{part}}>. Put it first: the safe answer leads, and the primary ends the footer.{{note}}",
    },
    create(context) {
      const names = kitNames(context);
      return {
        JSXElement(node) {
          let part = names.name(node.openingElement.name);
          let forwarded;
          if (!FOOTERS.test(part)) {
            // A component of this file that hands its children on to a footer.
            if (!/^[A-Z]/.test(node.openingElement.name.name ?? "")) return;
            if (!node.children.some((child) => child.type !== "JSXText")) return;
            forwarded = forwardedTo(context, node.openingElement, "children");
            part = forwarded ? names.name(forwarded.element.name) : "";
            if (!FOOTERS.test(part)) return;
          }
          const buttons = [];
          const visit = (child) => {
            if (!child) return;
            if (child.type === "JSXElement") {
              const name = names.name(child.openingElement.name);
              if (name === "Button" || name === "AlertDialogAction" || CLOSES.test(name)) {
                const text = child.children
                  .map((part) => (part.type === "JSXText" ? part.value : (literal(part) ?? "")))
                  .join("")
                  .trim();
                // A close part rendered as a kit Button carries its variant on the render element.
                const rendered = unwrap(attribute(child.openingElement, "render")?.value);
                const variant =
                  literal(attribute(child.openingElement, "variant")?.value) ??
                  (rendered?.type === "JSXElement"
                    ? literal(attribute(rendered.openingElement, "variant")?.value)
                    : undefined);
                buttons.push({
                  node: child,
                  cancel: text === "Cancel" || (CLOSES.test(name) && variant !== "primary"),
                  primary: variant === "primary" || name === "AlertDialogAction",
                });
              } else if (!/^(Dialog|AlertDialog|Sheet|Drawer)/.test(name))
                child.children.forEach(visit);
            } else if (child.type === "JSXFragment") child.children.forEach(visit);
            else if (child.type === "JSXExpressionContainer") visit(child.expression);
            else if (child.type === "LogicalExpression") visit(child.right);
            // Branches are mutually exclusive; don't infer order across conditional alternatives.
          };
          node.children.forEach(visit);
          const firstPrimary = buttons.findIndex((button) => button.primary);
          if (firstPrimary < 0) return;
          for (const [index, button] of buttons.entries())
            if (button.cancel && index > firstPrimary)
              context.report({
                node: button.node,
                messageId: forwarded ? "forwarded" : "order",
                data: {
                  tag: tagOf(context, button.node.openingElement),
                  footer: tagOf(context, node.openingElement),
                  surface: SURFACE[/^(\w+?)Footer$/.exec(part)[1]],
                  ...(forwarded ? { part } : {}),
                },
              });
        },
      };
    },
  },
});
