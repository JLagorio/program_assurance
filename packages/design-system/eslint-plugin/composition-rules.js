// Observable, local composition errors. Cross-file workflow behavior belongs in browser tests.
const tag = (node) =>
  node.type === "JSXIdentifier"
    ? node.name
    : node.type === "JSXMemberExpression"
      ? `${tag(node.object)}.${tag(node.property)}`
      : "";
const attribute = (node, name) =>
  node.attributes.find((item) => item.type === "JSXAttribute" && item.name.name === name);
const literal = (node) => {
  if (node?.type === "JSXExpressionContainer") return literal(node.expression);
  return node?.type === "Literal" ? node.value : undefined;
};
function kitNames() {
  const aliases = new Map();
  return {
    import(node) {
      if (node.source.value !== "@ledger/design-system") return;
      for (const item of node.specifiers) {
        if (item.type === "ImportSpecifier") aliases.set(item.local.name, item.imported.name);
        if (item.type === "ImportNamespaceSpecifier") aliases.set(item.local.name, "");
      }
    },
    name(node) {
      const [root, ...parts] = tag(node).split(".");
      return [aliases.get(root) ?? root, ...parts].filter(Boolean).join(".");
    },
  };
}
const rule = (description, create) => ({
  meta: { type: "problem", docs: { description }, schema: [] },
  create,
});

function binding(context, node, name) {
  let scope = context.sourceCode.getScope(node);
  while (scope && !scope.set.has(name)) scope = scope.upper;
  return scope?.set.get(name);
}

// Product policies apply to the actual kit import, including aliases and namespace imports.
// A same-named local component or a shadowed parameter is not a kit component.
function importedKitName(context, node) {
  const [root, ...parts] = tag(node).split(".");
  const imported = binding(context, node, root)?.defs.find(
    (definition) =>
      definition.type === "ImportBinding" &&
      definition.parent.source.value === "@ledger/design-system" &&
      definition.parent.importKind !== "type" &&
      definition.node.importKind !== "type",
  );
  if (!imported) return "";
  const specifier = imported.node;
  if (specifier.type === "ImportNamespaceSpecifier") return parts.join(".");
  if (specifier.type !== "ImportSpecifier") return "";
  return [specifier.imported.name ?? specifier.imported.value, ...parts].join(".");
}

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

function staticClasses(context, node, seen = new Set()) {
  node = unwrap(node);
  if (!node || seen.has(node)) return [];
  seen.add(node);
  const read = (child) => staticClasses(context, child, seen);
  if (node.type === "Literal") return typeof node.value === "string" ? [node.value] : [];
  if (node.type === "TemplateLiteral")
    return [
      ...node.quasis.map((part) => part.value.cooked ?? ""),
      ...node.expressions.flatMap(read),
    ];
  if (node.type === "ConditionalExpression")
    return [...read(node.consequent), ...read(node.alternate)];
  if (node.type === "LogicalExpression") return [...read(node.left), ...read(node.right)];
  if (node.type === "ArrayExpression") return node.elements.flatMap(read);
  if (node.type === "ObjectExpression")
    return node.properties.flatMap((property) =>
      property.type === "Property"
        ? property.computed || property.key.type === "Literal"
          ? read(property.key)
          : [property.key.name]
        : read(property.argument),
    );
  if (node.type === "CallExpression") return node.arguments.flatMap(read);
  if (node.type === "ArrowFunctionExpression" || node.type === "FunctionExpression")
    return read(node.body);
  if (node.type === "BlockStatement")
    return node.body.flatMap((statement) =>
      statement.type === "ReturnStatement" ? read(statement.argument) : [],
    );
  if (node.type === "Identifier") {
    const definitions = binding(context, node, node.name)?.defs;
    if (definitions?.length === 1 && definitions[0].parent?.kind === "const")
      return read(definitions[0].node.init);
  }
  return [];
}

function tabLayoutOverride(context, node) {
  const className = attribute(node, "className");
  const forbiddenClass = staticClasses(context, className?.value)
    .flatMap((value) => value.split(/\s+/))
    .find((value) =>
      /^(flex-wrap(?:-reverse)?|(?:min-|max-)?w-fit|overflow(?:-[xy])?-.+)$/.test(
        value.split(":").at(-1).replace(/^!|!$/g, ""),
      ),
    );
  if (forbiddenClass) return { node: className, value: forbiddenClass };
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
      return { node: property, value: name };
  }
  return null;
}

export const compositionRules = {
  "product-responsive-table": rule(
    "Product DataTable instances explicitly enable responsive column adaptation.",
    (context) => ({
      JSXOpeningElement(node) {
        if (
          importedKitName(context, node.name) !== "DataTable" ||
          explicitProp(node, "responsive", true)
        )
          return;
        context.report({
          node,
          message:
            "Product DataTable must enable responsive columns. Add responsive after any prop spreads.",
        });
      },
    }),
  ),
  "product-line-tabs": rule(
    "Product tabs use the full-width line variant and the kit's single-row scroller.",
    (context) => ({
      JSXOpeningElement(node) {
        if (importedKitName(context, node.name) !== "TabsList") return;
        if (!explicitProp(node, "variant", "line"))
          context.report({
            node,
            message: 'Product TabsList uses variant="line" after any prop spreads.',
          });
        const override = tabLayoutOverride(context, node);
        if (override)
          context.report({
            node: override.node,
            message: `Remove ${override.value} from TabsList. The kit owns its full-width border and single-row scrolling.`,
          });
      },
    }),
  ),
  "no-native-confirm": rule("Use an in-app AlertDialog for a decision.", (context) => ({
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
          message:
            "Use AlertDialog for confirmation; preserve cancellation, drafts and pending guards.",
        });
    },
  })),
  "text-link-navigation": rule("TextLink renders navigation; actions use Button.", (context) => {
    const names = kitNames();
    return {
      ImportDeclaration: names.import,
      JSXOpeningElement(node) {
        if (names.name(node.name) !== "TextLink") return;
        const render = attribute(node, "render");
        const element = render?.value?.expression;
        if (element?.type !== "JSXElement") return;
        const rendered = names.name(element.openingElement.name);
        // Custom router components are allowed; their ref/anchor contract is verified in browser tests.
        if (
          /^[a-z]/.test(rendered) ? rendered !== "a" : ["Button", "IconButton"].includes(rendered)
        )
          context.report({
            node: render,
            message: "TextLink must render an anchor or a router link. Use Button for an action.",
          });
      },
    };
  }),
  "dialog-footer-order": rule(
    "Cancel precedes the primary action in a dialog footer.",
    (context) => {
      const names = kitNames();
      return {
        ImportDeclaration: names.import,
        JSXElement(node) {
          if (names.name(node.openingElement.name) !== "DialogFooter") return;
          const buttons = [];
          const visit = (child) => {
            if (!child) return;
            if (child.type === "JSXElement") {
              const name = names.name(child.openingElement.name);
              if (["Button", "DialogClose"].includes(name)) {
                const text = child.children
                  .map((part) => (part.type === "JSXText" ? part.value : (literal(part) ?? "")))
                  .join("")
                  .trim();
                buttons.push({
                  node: child,
                  cancel: text === "Cancel",
                  primary: literal(attribute(child.openingElement, "variant")?.value) === "primary",
                });
              } else if (!/^(Dialog|AlertDialog|Sheet)/.test(name)) child.children.forEach(visit);
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
                message: "Place Cancel before the primary action in DialogFooter.",
              });
        },
      };
    },
  ),
};
