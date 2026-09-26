// Rules for the mistakes the 24 September audit found repeated across screens: focus that an
// overlay cannot return, a pending flag that disables the focused button, pixel widths and design
// values in style, hand-written alerts, and buttons that navigate. Each rule reads one file; the
// browser suites check what crosses files.
import path from "node:path";

const tag = (node) =>
  node.type === "JSXIdentifier"
    ? node.name
    : node.type === "JSXMemberExpression"
      ? `${tag(node.object)}.${tag(node.property)}`
      : node.type === "JSXNamespacedName"
        ? `${node.namespace.name}:${node.name.name}`
        : "";
const attribute = (node, name) =>
  node.attributes.findLast((item) => item.type === "JSXAttribute" && item.name.name === name);
const unwrap = (node) => {
  while (
    node &&
    [
      "JSXExpressionContainer",
      "TSAsExpression",
      "TSSatisfiesExpression",
      "TSNonNullExpression",
      "ChainExpression",
    ].includes(node.type)
  )
    node = node.expression;
  return node;
};
const literal = (node) => {
  node = unwrap(node);
  return node?.type === "Literal" ? node.value : undefined;
};

function binding(context, node, name) {
  let scope = context.sourceCode.getScope(node);
  while (scope && !scope.set.has(name)) scope = scope.upper;
  return scope?.set.get(name);
}

/** The initialiser of a single-definition const, so `const style = {…}` is read where it is used. */
function constInit(context, node) {
  if (node?.type !== "Identifier") return undefined;
  const definitions = binding(context, node, node.name)?.defs;
  if (definitions?.length !== 1) return undefined;
  const [definition] = definitions;
  if (definition.type !== "Variable" || definition.parent?.kind !== "const") return undefined;
  return definition.node.init ?? undefined;
}

/**
 * The kit name a JSX tag stands for: an alias in `import { Button as Action }` is Button, a
 * namespace member `Kit.Button` is Button, and a relative import inside the package keeps its name.
 */
function kitName(context, nameNode) {
  const [root, ...parts] = tag(nameNode).split(".");
  const imported = binding(context, nameNode, root)?.defs.find(
    (definition) => definition.type === "ImportBinding",
  )?.node;
  if (imported?.type === "ImportNamespaceSpecifier") return parts.join(".");
  if (imported?.type === "ImportSpecifier")
    return [imported.imported.name ?? imported.imported.value, ...parts].join(".");
  return [root, ...parts].join(".");
}

/* ---------- allowances: sites that predate a rule, counted per file, that may only shrink ---------- */

const allowSchema = {
  type: "object",
  properties: {
    allow: { type: "object", additionalProperties: { type: "integer", minimum: 1 } },
  },
  additionalProperties: false,
};

/**
 * Gives a rule an `allow` option: `{ allow: { "src/file.tsx": 2 } }` lets that file keep that
 * many reports. More fails as usual; fewer fails too and says to lower the number, so the list
 * only ever shrinks as sites are fixed. Paths are relative to the directory ESLint runs in.
 */
export function withAllowance(definition) {
  const schema = definition.meta?.schema;
  if (Array.isArray(schema) && schema.length > 0) return definition;
  return {
    ...definition,
    meta: { ...definition.meta, schema: [allowSchema] },
    create(context) {
      const allow = context.options[0]?.allow ?? {};
      const file = path.relative(context.cwd, context.filename).split(path.sep).join("/");
      const allowed = allow[file] ?? 0;
      if (!allowed) return definition.create(context);
      const reports = [];
      const proxy = Object.create(context, {
        report: { value: (descriptor) => reports.push(descriptor) },
        options: { value: [] },
      });
      const listeners = definition.create(proxy);
      const exit = listeners["Program:exit"];
      return {
        ...listeners,
        "Program:exit"(node) {
          exit?.(node);
          if (reports.length > allowed)
            for (const descriptor of reports)
              context.report({
                ...descriptor,
                message: `${descriptor.message} (${reports.length} in this file; its allowance is ${allowed})`,
              });
          else if (reports.length < allowed)
            context.report({
              node,
              loc: { line: 1, column: 0 },
              message: `${file} is allowed ${allowed} report${allowed === 1 ? "" : "s"} of ${context.id} and has ${reports.length}. Lower its allowance to ${reports.length}${reports.length === 0 ? " by deleting the entry" : ""}: the list only shrinks.`,
            });
        },
      };
    },
  };
}

const rule = (description, create) => ({
  meta: { type: "problem", docs: { description }, schema: [] },
  create,
});

/* ---------- overlays ---------- */

const OVERLAY =
  /^(Dialog|Sheet|AlertDialog|Drawer|Popover|HoverCard|DropdownMenu|ContextMenu|Command)(Content|Popup)$|^(PickerSheet|RecordBrowser|PreviewSheet|CommandDialog|CommandPalette)$/;

function insideOverlay(context, node) {
  for (let parent = node.parent; parent; parent = parent.parent)
    if (parent.type === "JSXElement" && OVERLAY.test(kitName(context, parent.openingElement.name)))
      return true;
  return false;
}

/** The names of the function components around a node, innermost first. */
function componentsOf(node) {
  const names = [];
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (parent.type === "FunctionDeclaration" && parent.id) names.push(parent.id.name);
    if (
      parent.type === "VariableDeclarator" &&
      parent.id.type === "Identifier" &&
      /Function|Call/.test(parent.init?.type ?? "")
    )
      names.push(parent.id.name);
  }
  return names.filter((name) => /^[A-Z]/.test(name));
}

const autoFocusMessage =
  "autoFocus inside overlay content takes over where focus returns when the overlay closes. Give the content initialFocus (DialogContent, SheetContent, PopoverContent) and pass finalFocus where the opener goes away.";

/* ---------- a pending flag in disabled ---------- */

/** What an expression reads: whole member chains (`save.isPending`) and bare identifiers. */
function references(context, node, out = new Set()) {
  node = unwrap(node);
  if (!node) return out;
  switch (node.type) {
    case "Identifier":
      if (node.name !== "undefined") out.add(node.name);
      return out;
    case "MemberExpression":
      out.add(context.sourceCode.getText(node).replace(/\?\./g, ".").replace(/\s+/g, ""));
      return out;
    case "UnaryExpression":
      return references(context, node.argument, out);
    case "LogicalExpression":
    case "BinaryExpression":
      references(context, node.left, out);
      return references(context, node.right, out);
    case "ConditionalExpression":
      references(context, node.test, out);
      references(context, node.consequent, out);
      return references(context, node.alternate, out);
    case "CallExpression":
      for (const argument of node.arguments) references(context, argument, out);
      return out;
    default:
      return out;
  }
}

const loadingMessage = (shared) =>
  `disabled reuses the pending flag ${shared}, which isLoading already carries. isLoading blocks a repeat activation and keeps focus on the button; a disabled button drops focus to the page. Keep disabled for reasons unrelated to the save, or use disabledReason.`;

/* ---------- widths and design values in style ---------- */

const WIDTH_PROPS = new Set([
  "width",
  "minWidth",
  "maxWidth",
  "inlineSize",
  "minInlineSize",
  "maxInlineSize",
]);
const SIZED_OVERLAY = /^(Dialog|Sheet|AlertDialog|Drawer)Content$/;
const WIDTH_CLASS = /^-?(w|min-w|max-w|size)-/;

const LENGTH_PROPS =
  /^(width|height|(min|max)(Width|Height)|(min|max)?(Inline|Block)Size|inlineSize|blockSize|padding(Top|Right|Bottom|Left|Inline|Block|InlineStart|InlineEnd|BlockStart|BlockEnd)?|gap|rowGap|columnGap|top|right|bottom|left|inset(Inline|Block)?(Start|End)?|fontSize|letterSpacing|borderRadius|border(Top|Bottom|Start|End)(Left|Right|Start|End)Radius|border(Top|Right|Bottom|Left|Inline|Block)?Width|outlineWidth|outlineOffset|flexBasis|textIndent|gridTemplateColumns|gridTemplateRows|gridAutoRows|gridAutoColumns)$/;
const COLOR_PROPS =
  /^(color|background|backgroundColor|backgroundImage|border(Top|Right|Bottom|Left|Inline|Block)?(Color)?|outline(Color)?|fill|stroke|boxShadow|textShadow|caretColor|accentColor|textDecorationColor|columnRuleColor)$/;
const MARGIN_PROPS = /^margin/;
const LITERAL_LENGTH =
  /(?:^|[^\w-])(-?(?:\d*\.)?\d+(?:px|rem|em|vh|vw|dvh|dvw|svh|svw|lvh|lvw|vmin|vmax|ch|ex|pt|pc|cm|mm|in|q))\b/i;
const LITERAL_COLOR =
  /#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|hwb|oklch|oklab|lab|lch|color)\(|\b(white|black|red|green|blue|gray|grey|silver|yellow|orange|purple|pink|navy|teal)\b/i;

/** A literal design value in a style value, or undefined when it is a token, structure or computed. */
function styleProblem(name, value) {
  const node = unwrap(value);
  if (!node) return undefined;
  if (node.type === "ConditionalExpression")
    return styleProblem(name, node.consequent) ?? styleProblem(name, node.alternate);
  if (node.type === "LogicalExpression") return styleProblem(name, node.right);
  const margin = MARGIN_PROPS.test(name);
  if (node.type === "Literal" && typeof node.value === "number") {
    if (node.value === 0) return undefined;
    if (margin) return "a margin";
    if (name === "fontWeight") return "a literal font weight";
    if (LENGTH_PROPS.test(name) && name !== "lineHeight")
      return `a literal length (${node.value}px)`;
    return undefined;
  }
  const text =
    node.type === "Literal" && typeof node.value === "string"
      ? node.value
      : node.type === "TemplateLiteral"
        ? node.quasis.map((part) => part.value.cooked ?? "").join(" ")
        : undefined;
  if (text === undefined) return undefined;
  // A custom property is a token reference and url(#id) names a pattern or gradient; strip both
  // before looking for literals.
  const bare = text.replace(/var\(--[\w-]+(,[^()]*)?\)/g, "var").replace(/url\([^)]*\)/g, "url");
  if (margin && !/^\s*(0|0px|auto)?\s*$/.test(bare)) return "a margin";
  if (name === "fontFamily" && bare.trim()) return "a literal font family";
  if (name === "fontWeight" && /\d/.test(bare)) return "a literal font weight";
  if ((LENGTH_PROPS.test(name) || COLOR_PROPS.test(name)) && LITERAL_LENGTH.test(bare))
    return `a literal length (${bare.match(LITERAL_LENGTH)[1]})`;
  if (COLOR_PROPS.test(name) && LITERAL_COLOR.test(bare))
    return `a literal colour (${bare.match(LITERAL_COLOR)[0]})`;
  return undefined;
}

function styleObject(context, attributeNode) {
  const value = unwrap(attributeNode?.value);
  if (value?.type === "ObjectExpression") return value;
  const init = unwrap(constInit(context, value));
  return init?.type === "ObjectExpression" ? init : undefined;
}

const propertyName = (property) =>
  property.type === "Property" && !property.computed
    ? (property.key.name ?? property.key.value)
    : undefined;

/* ---------- navigation from a button ---------- */

/** The router or location call a handler consists of, when that is all it does. */
function onlyNavigates(context, handler) {
  let node = unwrap(handler);
  const init = constInit(context, node);
  if (init) node = unwrap(init);
  if (node?.type !== "ArrowFunctionExpression" && node?.type !== "FunctionExpression") return false;
  let body = node.body;
  if (body.type === "BlockStatement") {
    if (body.body.length !== 1) return false;
    const [statement] = body.body;
    if (statement.type === "ExpressionStatement") body = statement.expression;
    else if (statement.type === "ReturnStatement") body = statement.argument;
    else return false;
  }
  body = unwrap(body);
  if (body?.type === "UnaryExpression" && body.operator === "void") body = unwrap(body.argument);
  if (body?.type === "AwaitExpression") body = unwrap(body.argument);
  if (body?.type === "CallExpression") {
    const callee = unwrap(body.callee);
    if (callee.type === "Identifier") return callee.name === "navigate";
    if (callee.type === "MemberExpression" && !callee.computed) {
      const name = callee.property.name;
      const object = context.sourceCode.getText(callee.object);
      return (
        name === "navigate" ||
        (["assign", "replace"].includes(name) && /(^|\.)location$/.test(object)) ||
        (name === "push" && /(^|\.)history$/.test(object))
      );
    }
    return false;
  }
  if (body?.type === "AssignmentExpression") {
    const target = context.sourceCode.getText(body.left);
    return /(^|\.)location(\.href)?$/.test(target);
  }
  return false;
}

/* ---------- the rules ---------- */

export const gateRules = {
  "no-overlay-autofocus": rule(
    "No autoFocus inside overlay content: initialFocus on the content chooses the first field.",
    (context) => {
      const insideRendered = new Set();
      // Which components of this file each component renders, so content two levels down counts.
      const renders = new Map();
      const pending = [];
      return {
        JSXAttribute(node) {
          if (node.name.name !== "autoFocus") return;
          const value = literal(node.value);
          if (value === false) return;
          const element = node.parent;
          if (insideOverlay(context, element)) {
            context.report({ node, message: autoFocusMessage });
            return;
          }
          const components = componentsOf(node);
          if (components.length > 0) pending.push({ node, components });
        },
        JSXOpeningElement(node) {
          const name = tag(node.name);
          if (!/^[A-Z]/.test(name) || name.includes(".")) return;
          if (insideOverlay(context, node)) insideRendered.add(name);
          for (const owner of componentsOf(node)) {
            if (!renders.has(owner)) renders.set(owner, new Set());
            renders.get(owner).add(name);
          }
        },
        "Program:exit"() {
          // A component of this file rendered inside an overlay of this file is overlay content,
          // and so is every component of this file it renders in turn.
          const content = new Set(insideRendered);
          for (const name of content)
            for (const child of renders.get(name) ?? []) content.add(child);
          for (const { node, components } of pending)
            if (components.some((name) => content.has(name)))
              context.report({ node, message: autoFocusMessage });
        },
      };
    },
  ),
  "no-disabled-while-loading": rule(
    "A pending flag goes to isLoading only, never also to disabled.",
    (context) => {
      const check = (loading, disabled, node) => {
        if (!loading || !disabled) return;
        const loads = references(context, loading);
        const shared = [...references(context, disabled)].filter((name) => loads.has(name));
        if (shared.length > 0) context.report({ node, message: loadingMessage(shared.join(", ")) });
      };
      return {
        JSXOpeningElement(node) {
          check(attribute(node, "isLoading")?.value, attribute(node, "disabled")?.value, node);
        },
        ObjectExpression(node) {
          const find = (name) =>
            node.properties.find((property) => propertyName(property) === name)?.value;
          check(find("isLoading"), find("disabled"), node);
        },
      };
    },
  ),
  "overlay-width-preset": rule(
    "Dialog, Sheet, AlertDialog and Drawer content take their width from a preset, not style or a width class.",
    (context) => ({
      JSXOpeningElement(node) {
        const name = kitName(context, node.name);
        if (!SIZED_OVERLAY.test(name)) return;
        const preset =
          name === "AlertDialogContent"
            ? 'size="sm" or the default'
            : 'width="small" | "medium" | "large" | "xlarge" | "fullscreen"';
        const style = styleObject(context, attribute(node, "style"));
        for (const property of style?.properties ?? []) {
          const key = propertyName(property);
          if (!WIDTH_PROPS.has(key)) continue;
          const value = unwrap(property.value);
          if (value?.type === "Identifier" && value.name === "undefined") continue;
          context.report({
            node: property,
            message: `${name} sets ${key} in style. Use ${preset}; the kit owns the steps and their narrowing to the window.`,
          });
        }
        const className = attribute(node, "className");
        const classes = [];
        const collect = (value) => {
          value = unwrap(value);
          if (!value) return;
          if (value.type === "Literal" && typeof value.value === "string")
            classes.push(value.value);
          else if (value.type === "TemplateLiteral")
            classes.push(...value.quasis.map((part) => part.value.cooked ?? ""));
          else if (value.type === "ConditionalExpression") {
            collect(value.consequent);
            collect(value.alternate);
          } else if (value.type === "LogicalExpression") collect(value.right);
          else if (value.type === "CallExpression") value.arguments.forEach(collect);
          else if (value.type === "Identifier") collect(constInit(context, value));
        };
        collect(className?.value);
        const width = classes
          .flatMap((text) => text.split(/\s+/))
          .find((cls) => WIDTH_CLASS.test(cls.split(":").at(-1).replace(/^!|!$/g, "")));
        if (width)
          context.report({
            node: className,
            message: `${name} sets its width with "${width}". Use ${preset}; the kit owns the steps and their narrowing to the window.`,
          });
      },
    }),
  ),
  "no-plain-alert-role": rule(
    'A form or page result is an Alert with an explicit role, never role="alert" on a plain element.',
    (context) => ({
      JSXOpeningElement(node) {
        if (!/^[a-z]/.test(tag(node.name))) return;
        const role = attribute(node, "role");
        if (literal(role?.value) !== "alert") return;
        context.report({
          node: role,
          message:
            'role="alert" on a plain element. Use Alert with role="alert" for a form-level result, FieldError under the field it is about, or ErrorSummary for several issues.',
        });
      },
    }),
  ),
  "link-button-navigation": rule(
    "Navigation that looks like a button is LinkButton or LinkIconButton, not a Button that renders a link or navigates.",
    (context) => ({
      JSXOpeningElement(node) {
        const name = kitName(context, node.name);
        if (name !== "Button" && name !== "IconButton") return;
        const replacement = name === "Button" ? "LinkButton" : "LinkIconButton";
        let rendered = unwrap(attribute(node, "render")?.value);
        // A render function, `(props) => <Link {...props} />`, renders what it returns.
        if (
          rendered?.type === "ArrowFunctionExpression" ||
          rendered?.type === "FunctionExpression"
        ) {
          const body = rendered.body;
          rendered =
            body.type === "BlockStatement"
              ? unwrap(
                  body.body.find((statement) => statement.type === "ReturnStatement")?.argument,
                )
              : unwrap(body);
        }
        if (rendered?.type === "JSXElement") {
          const opening = rendered.openingElement;
          const renderedName = tag(opening.name);
          if (
            renderedName === "a" ||
            /(^|\.)(Link|NavLink)$/.test(renderedName) ||
            attribute(opening, "href") ||
            attribute(opening, "to")
          ) {
            context.report({
              node: attribute(node, "render"),
              message: `${name} renders a link (<${renderedName}>). Use ${replacement} with render={<${renderedName} … />}: Base UI's Button expects a native button, and a link must stay a link.`,
            });
            return;
          }
        }
        const onClick = attribute(node, "onClick");
        if (onClick && onlyNavigates(context, onClick.value))
          context.report({
            node: onClick,
            message: `${name} navigates from onClick. Use ${replacement} with the router Link in render, so the destination can be opened in a new tab, copied and announced as a link.`,
          });
      },
    }),
  ),
  "no-style-design-value": rule(
    "Style carries computed values only: literal lengths, colours, weights and margins are tokens.",
    (context) => {
      // A const style object used by several elements is reported once, where it is written.
      const reported = new WeakSet();
      return {
        JSXAttribute(node) {
          if (node.name.name !== "style") return;
          const style = styleObject(context, node);
          for (const property of style?.properties ?? []) {
            const key = propertyName(property);
            if (!key || reported.has(property)) continue;
            reported.add(property);
            const problem = styleProblem(key, property.value);
            if (problem)
              context.report({
                node: property,
                message: `style.${key} is ${problem}. Use a token utility or a primitive prop; style is for computed values (a measured size, a CSS variable).`,
              });
          }
        },
      };
    },
  ),
};
