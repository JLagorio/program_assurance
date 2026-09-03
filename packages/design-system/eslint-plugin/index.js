// @ledger/design-system ESLint plugin. Plain ESM so ESLint loads it without a TypeScript loader.
// The allowlist and deprecation map come from the token build (src/generated/utilities.json).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const generated = JSON.parse(
  fs.readFileSync(path.join(here, "../src/generated/utilities.json"), "utf8"),
);
const tokenClasses = new Set(generated.classes);
const spaceKeys = generated.spaceKeys.join("|");
const deprecated = generated.deprecated;

/* ---------- class extraction ---------- */

const CLASS_FNS = new Set(["cn", "clsx", "twMerge", "cva"]);

/** Collect every static class string reachable from an expression: literals, template quasis,
    conditionals, logicals, arrays, clsx-style objects (keys), and nested cn()/clsx() calls. */
function collect(node, out) {
  if (!node) return;
  switch (node.type) {
    case "Literal":
      if (typeof node.value === "string") out.push({ text: node.value, node });
      return;
    case "TemplateLiteral":
      for (const q of node.quasis) if (q.value.cooked) out.push({ text: q.value.cooked, node: q });
      for (const e of node.expressions) collect(e, out);
      return;
    case "ConditionalExpression":
      collect(node.consequent, out);
      collect(node.alternate, out);
      return;
    case "LogicalExpression":
      collect(node.left, out);
      collect(node.right, out);
      return;
    case "ArrayExpression":
      for (const el of node.elements) collect(el, out);
      return;
    case "ObjectExpression":
      for (const p of node.properties) {
        if (p.type !== "Property") continue;
        if (p.key.type === "Literal" && typeof p.key.value === "string")
          out.push({ text: p.key.value, node: p.key });
        if (p.key.type === "Identifier" && !p.computed) out.push({ text: p.key.name, node: p.key });
      }
      return;
    case "CallExpression":
      if (node.callee.type === "Identifier" && CLASS_FNS.has(node.callee.name))
        for (const a of node.arguments) collect(a, out);
      return;
    case "JSXExpressionContainer":
      collect(node.expression, out);
      return;
    case "TSAsExpression":
    case "TSSatisfiesExpression":
      collect(node.expression, out);
      return;
    default:
      return;
  }
}

/** Split a class string on whitespace, then each class into variants and base (colons outside brackets). */
function classesOf(text) {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((cls) => {
      const parts = [];
      let depth = 0,
        cur = "";
      for (const ch of cls) {
        if (ch === "[") depth++;
        if (ch === "]") depth--;
        if (ch === ":" && depth === 0) {
          parts.push(cur);
          cur = "";
        } else cur += ch;
      }
      parts.push(cur);
      const base = parts.pop();
      return { cls, variants: parts, base };
    });
}

/** Visit every class in className attributes and cn()/clsx() calls. */
function forEachClass(context, cb) {
  const seen = new WeakSet();
  const handle = (node) => {
    const out = [];
    collect(node, out);
    for (const { text, node: n } of out) {
      if (seen.has(n)) continue;
      seen.add(n);
      for (const c of classesOf(text)) cb(c, n);
    }
  };
  return {
    JSXAttribute(node) {
      if (
        node.name.type === "JSXIdentifier" &&
        (node.name.name === "className" || node.name.name === "class")
      )
        handle(node.value);
    },
    CallExpression(node) {
      if (node.callee.type === "Identifier" && CLASS_FNS.has(node.callee.name))
        for (const a of node.arguments) handle(a);
    },
  };
}

/* ---------- what a non-token class may be ---------- */

// Structure, not design: display, position, alignment, overflow, text flow, interaction. No colour, size, space, type, radius, shadow.
const structural = [
  /^(block|inline-block|inline|flex|inline-flex|grid|inline-grid|contents|hidden|flow-root|table|table-(row|cell|caption|header-group|row-group|footer-group|column|column-group)|list-item)$/,
  /^(static|relative|absolute|fixed|sticky)$/,
  /^-?(inset|inset-x|inset-y|top|right|bottom|left|start|end)-(0|full|auto|px|1\/2)$/,
  /^z-(0|10|20|30|40|50|auto)$/,
  /^(isolate|isolation-auto)$/,
  /^flex-(row|col|row-reverse|col-reverse|wrap|nowrap|wrap-reverse|1|auto|initial|none)$/,
  /^(grow|grow-0|shrink|shrink-0)$/,
  /^basis-(0|full|auto|1\/2|1\/3|2\/3|1\/4|3\/4)$/,
  /^(items|self|justify|justify-items|justify-self|content|place-items|place-content|place-self)-(start|end|center|stretch|baseline|between|around|evenly|normal|auto|first-baseline|last-baseline)$/,
  /^order-(first|last|none|\d+)$/,
  /^(col|row)-(span-(\d+|full)|start-(\d+|auto)|end-(\d+|auto)|auto)$/,
  /^grid-(cols|rows)-(\d+|none|subgrid)$/,
  /^grid-flow-(row|col|dense|row-dense|col-dense)$/,
  /^auto-(cols|rows)-(auto|min|max|fr)$/,
  /^overflow(-x|-y)?-(auto|hidden|visible|scroll|clip)$/,
  /^(truncate|text-ellipsis|text-clip)$/,
  /^whitespace-(normal|nowrap|pre|pre-line|pre-wrap|break-spaces)$/,
  /^(break-normal|break-words|break-all|break-keep|hyphens-(none|manual|auto))$/,
  /^text-(wrap|nowrap|balance|pretty)$/,
  /^line-clamp-(\d+|none)$/,
  /^text-(left|center|right|start|end|justify)$/,
  /^(uppercase|lowercase|capitalize|normal-case)$/,
  /^(underline|overline|line-through|no-underline)$/,
  /^underline-offset-(auto|\d+)$/,
  /^decoration-(solid|double|dotted|dashed|wavy|auto|from-font|\d+)$/,
  /^(italic|not-italic|antialiased|subpixel-antialiased)$/,
  /^(tabular-nums|proportional-nums|lining-nums|oldstyle-nums|normal-nums|slashed-zero)$/,
  /^align-(baseline|top|middle|bottom|text-top|text-bottom|sub|super)$/,
  /^list-(none|disc|decimal|inside|outside)$/,
  /^select-(none|text|all|auto)$/,
  /^pointer-events-(none|auto)$/,
  /^cursor-(auto|default|pointer|wait|text|move|not-allowed|grab|grabbing|col-resize|row-resize|ns-resize|ew-resize|help|progress|zoom-in|zoom-out)$/,
  /^resize(-none|-x|-y)?$/,
  /^appearance-(none|auto)$/,
  /^(outline-none|outline-hidden)$/,
  /^(sr-only|not-sr-only|invisible|visible|collapse)$/,
  /^border(-(x|y|t|b|l|r|s|e))?$/, // 1px, the default width token
  /^border-(none|solid|dashed|dotted|double|hidden|collapse|separate)$/,
  /^divide-(x|y)(-reverse)?$/,
  /^rounded-none$/,
  /^shadow-none$/,
  /^border(-(x|y|t|b|l|r|s|e))?-0$/,
  /^-?(m|mx|my|mt|mb|ml|mr|ms|me)-auto$/,
  /^(w|h|size)-(full|auto|fit|min|max|screen|px|0|dvh|dvw|svh|lvh|1\/2|1\/3|2\/3|1\/4|3\/4)$/,
  /^min-(w|h)-(0|full|fit|min|max|px|screen|dvh)$/,
  /^max-(w|h)-(full|none|fit|min|max|px|screen|dvh)$/,
  /^aspect-(auto|square|video)$/,
  /^object-(contain|cover|fill|none|scale-down|center|top|bottom|left|right)$/,
  /^transition(-(none|all|colors|opacity|shadow|transform|discrete))?$/,
  /^animate-(none|spin|ping|pulse|bounce)$/,
  /^(transform|transform-none|transform-gpu|will-change-(auto|scroll|contents|transform))$/,
  /^-?rotate-(0|45|90|180)$/,
  /^-?translate-(x|y)-(0|full|1\/2)$/,
  /^scale-(0|50|75|90|95|100|105|110|125|150)$/,
  /^origin-(center|top|bottom|left|right|top-left|top-right|bottom-left|bottom-right)$/,
  /^backdrop-blur(-(none|xs|sm|md|lg|xl|2xl|3xl))?$/,
  /^blur(-(none|xs|sm|md|lg|xl|2xl|3xl))?$/,
  /^(group|peer)(\/[\w-]+)?$/,
  /^(box-border|box-content)$/,
  /^(float|clear)-(left|right|none|start|end|both)$/,
  /^columns-\d+$/,
  /^scroll-(auto|smooth)$/,
  /^snap-(start|end|center|align-none|normal|always|none|x|y|both|mandatory|proximity)$/,
  /^touch-(auto|none|pan-x|pan-y|manipulation)$/,
  /^bg-(none|fixed|local|scroll|clip-border|clip-padding|clip-content|clip-text|origin-border|origin-padding|origin-content|cover|contain|auto|center|top|bottom|left|right|repeat|no-repeat|repeat-x|repeat-y)$/,
  /^ring-inset$/,
  /^forced-color-adjust-(auto|none)$/,
  /^field-sizing-(content|fixed)$/,
  /^(inert)$/,
  /^gap(-x|-y)?-px$/, // a hairline gutter between tiles, painted with the border token
  /^animate-(rise|enter|exit|fade-in|fade-out|slide-(in|out)-(start|end|top|bottom))$/, // motion.css, on the motion tokens
  /^(grid-cols-main-rail|grid-cols-list-detail|sticky-rail|min-h-work|shell-(root|banner|topnav|topnav-start|sidenav|sidenav-overlay|main|panel))$/, // layout.css, on the layout dimension tokens
  /^table-(auto|fixed)$/, // column algorithm, not a design value
  /^opacity-(0|100)$/, // hidden and shown; the design opacities are opacity-disabled and opacity-loading
  /^(bg|border)-transparent$/, // no paint, which is structure: a placeholder border that holds layout, a row that must not light up
  /^(fill|stroke)-(none|current)$/, // SVG paint from the text colour, which is a token
  /^divide-(x|y)-0$/,
  /^grid-cols-\(--ds-grid-(base|sm|md|lg|xl)\)$/, // Grid's responsive templateColumns, read from a CSS variable
];
const spacing = new RegExp(
  `^-?(p|px|py|pt|pb|pl|pr|ps|pe|m|mx|my|mt|mb|ml|mr|ms|me|gap|gap-x|gap-y|space-x|space-y|w|h|size|min-w|min-h|max-w|max-h|inset|inset-x|inset-y|top|right|bottom|left|start|end|translate-x|translate-y|indent|scroll-m|scroll-mx|scroll-my|scroll-mt|scroll-mb|scroll-p|scroll-px|scroll-py|scroll-pt|scroll-pb)-(${spaceKeys})$`,
);
const sideRadius = /^rounded-(t|b|l|r|s|e|tl|tr|bl|br|ss|se|es|ee)-(.+)$/;
const isKnown = (base) => {
  if (tokenClasses.has(base) || spacing.test(base) || structural.some((r) => r.test(base)))
    return true;
  const side = base.match(sideRadius); // rounded-s-medium: one side of a radius token, generated by Tailwind from the @theme mapping
  return Boolean(side && tokenClasses.has(`rounded-${side[2]}`));
};

/* ---------- rules ---------- */

const rule = (description, create, extra = {}) => ({
  meta: { type: "problem", docs: { description }, schema: [], ...extra },
  create,
});

const jsxTag = (n) =>
  n.type === "JSXIdentifier"
    ? n.name
    : n.type === "JSXMemberExpression"
      ? `${jsxTag(n.object)}.${n.property.name}`
      : "";
const jsxAttr = (node, name) =>
  node.attributes.find((a) => a.type === "JSXAttribute" && a.name.name === name);
const attrIsTrue = (a) =>
  a &&
  (a.value === null ||
    (a.value.type === "JSXExpressionContainer" &&
      a.value.expression.type === "Literal" &&
      a.value.expression.value === true));

/** Parts that were renamed. `fix` marks a one-to-one rename the rule can apply; `props` renames attributes with it. */
const deprecatedNames = {
  "Shell.Sidebar": {
    to: "Shell.SideNav",
    note: "with Header, Body and Footer; the brand moves to Shell.TopNav.Start",
  },
  "Shell.TopBar": { to: "Shell.TopNav", note: "with Start, Middle and End" },
  "Shell.Brand": {
    to: "Shell.AppLogo",
    note: "detail is secondaryName",
    fix: true,
    props: { detail: "secondaryName" },
  },
  "Shell.NavGroup": {
    to: "Shell.SideNav.Section",
    note: "label is heading",
    fix: true,
    props: { label: "heading" },
  },
  "Shell.NavItem": { to: "Shell.SideNav.Item", fix: true },
  "Shell.User": { to: "Shell.Profile", fix: true },
};

/* ---------- how a product assembles the kit ---------- */

/** Every component the kit exports, read from the package's own layers so the list never drifts. */
function kitNames() {
  const names = new Set();
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (/\.tsx?$/.test(p))
        for (const m of fs
          .readFileSync(p, "utf8")
          .matchAll(/^export (?:function|const) ([A-Z]\w*)/gm))
          names.add(m[1]);
    }
  };
  for (const layer of ["primitives", "components", "patterns", "shapes", "shell", "mode"]) {
    const dir = path.join(here, "../src", layer);
    if (fs.existsSync(dir)) walk(dir);
  }
  return names;
}
const KIT = kitNames();
/** Names a product used before the vocabulary; a local component under one of these is a copy of the kit part named. */
const LEGACY = {
  Dash: "Absent",
  Notice: "Alert",
  Modal: "Dialog",
  Menu: "DropdownMenu",
  Meter: "Progress",
  EmptyState: "Empty",
  SegmentedControl: "ToggleGroup",
  Disclosure: "Collapsible",
  Radio: "RadioGroup",
  Mono: "Id",
  IdList: "Id.List",
  IdCell: "Table.Id",
  Severity: "Indicator",
  Label: "Eyebrow",
  Tile: "Stat.Tile",
  Tiles: "Tiles",
  TabStrip: "Tabs",
  RailGroup: "Inspector.Group",
  CardHeader: "Card.Header",
  StackedBar: "Progress.Stacked",
  AvatarStack: "Avatar.Stack",
  MenuItem: "DropdownMenu.Item",
  MenuLabel: "DropdownMenu.Label",
  RelatedCard: "Related",
  RelatedRow: "Related.Row",
  WorkPaneRow: "WorkPane.Row",
  TreeCell: "Table.Tree",
  Facts: "Fact.Group",
  Sidebar: "Shell.SideNav",
  TopBar: "Shell.TopNav",
  NavItem: "Shell.SideNav.Item",
  PreviewSplit: "PreviewSplit",
  CommandPalette: "CommandPalette",
  RecordPicker: "RecordPicker",
};
/** Neutral colour, weight and type tokens a table cell may not carry; a status colour (text-danger, text-warning) is data, not design. */
const CELL_FORBIDDEN =
  /^(text-(default|subtle|subtlest|brand|selected|inverse|disabled)|font-(body(-large|-small|-xsmall)?|heading-\w+|code|medium|semibold|regular))$/;
/** Every string literal reachable inside an attribute value: "a b", cn("a", x && "b"), `a ${b}`. */
function stringLiterals(node, out = []) {
  if (!node) return out;
  switch (node.type) {
    case "Literal":
      if (typeof node.value === "string") out.push(node.value);
      break;
    case "TemplateLiteral":
      for (const q of node.quasis) out.push(q.value.cooked ?? "");
      for (const e of node.expressions) stringLiterals(e, out);
      break;
    case "JSXExpressionContainer":
      stringLiterals(node.expression, out);
      break;
    case "CallExpression":
      for (const a of node.arguments) stringLiterals(a, out);
      break;
    case "ConditionalExpression":
      stringLiterals(node.consequent, out);
      stringLiterals(node.alternate, out);
      break;
    case "LogicalExpression":
      stringLiterals(node.right, out);
      break;
    case "ArrayExpression":
      for (const el of node.elements) stringLiterals(el, out);
      break;
    default:
      break;
  }
  return out;
}

const rules = {
  "prefer-text-link": rule(
    "Navigation that reads as text is TextLink; the classes that fake it are not written by hand.",
    (context) => ({
      JSXOpeningElement(node) {
        const name = jsxTag(node.name);
        if (/^(a|Link|NavLink)$/.test(name)) {
          const attr = jsxAttr(node, "className");
          if (!attr) return;
          const out = [];
          collect(attr.value, out);
          if (/(^|\s)(hover:underline|text-brand)(\s|$)/.test(out.map((o) => o.text).join(" ")))
            context.report({
              node: attr,
              message: `<${name}> carries the text-link classes. Wrap it in TextLink and drop text-brand and hover:underline.`,
            });
        } else if (name === "Button") {
          const variant = jsxAttr(node, "variant");
          if (
            variant?.value?.type === "Literal" &&
            variant.value.value === "link" &&
            attrIsTrue(jsxAttr(node, "asChild"))
          )
            context.report({
              node,
              message:
                'A Button that wraps a link is TextLink. variant="link" is for an action that reads as text.',
            });
        }
      },
    }),
  ),
  "no-colgroup": rule(
    "Column widths are content decisions and go on Table.Header width, not in a colgroup.",
    (context) => ({
      JSXOpeningElement(node) {
        if (jsxTag(node.name) === "colgroup")
          context.report({
            node,
            message:
              "<colgroup> fixes widths away from the header. Put width on each Table.Header instead.",
          });
      },
    }),
  ),
  "no-arbitrary-value": rule(
    "Arbitrary values (text-[13px], w-[240px]) bypass the tokens.",
    (context) =>
      forEachClass(context, ({ cls, base }, node) => {
        if (/^\[|-\[|\/\[/.test(base))
          context.report({
            node,
            message: `"${cls}" is an arbitrary value. Use a token utility or a primitive prop.`,
          });
      }),
  ),
  "no-alpha-token": rule("A state is a token, never alpha on a base token.", (context) =>
    forEachClass(context, ({ cls, base }, node) => {
      if (
        /^(bg|text|icon|border|shadow|ring|outline|decoration|divide|fill|stroke|from|via|to|accent|caret)-[a-z0-9-]+\/\d+$/.test(
          base,
        )
      )
        context.report({
          node,
          message: `"${cls}" applies alpha to a token. Use the hovered, pressed, subtle or disabled token instead.`,
        });
    }),
  ),
  "no-dark-variant": rule("A dark: class means a token is missing.", (context) =>
    forEachClass(context, ({ cls, variants }, node) => {
      if (variants.includes("dark"))
        context.report({
          node,
          message: `"${cls}" uses the dark variant. Every colour is a token that flips by itself; add the token.`,
        });
    }),
  ),
  "no-margin": rule(
    "Spacing between siblings comes from Stack, Inline and Bleed, not margins.",
    (context) =>
      forEachClass(context, ({ cls, base }, node) => {
        if (
          (/^-?(m|mx|my|mt|mb|ml|mr|ms|me)-/.test(base) && !/-auto$/.test(base)) ||
          /^-?(m|mx|my|mt|mb|ml|mr|ms|me)$/.test(base)
        )
          context.report({
            node,
            message: `"${cls}" is a margin. Use Stack or Inline space, or Bleed.`,
          });
      }),
  ),
  "no-static-design-value": rule(
    "Static Tailwind utilities that encode a design value the tokens own.",
    (context) =>
      forEachClass(context, ({ cls, base }, node) => {
        const hit =
          (/^rounded(-(t|b|l|r|tl|tr|bl|br|s|e|ss|se|es|ee))?$/.test(base) &&
            "a fixed 4px radius; use rounded-small…rounded-full") ||
          (/^opacity-\d+$/.test(base) &&
            !/^opacity-(0|100)$/.test(base) &&
            "a numeric opacity; use opacity-disabled or opacity-loading") ||
          (/^(duration|delay)-\d+$/.test(base) &&
            "a numeric duration; use duration-fast or duration-medium") ||
          (/^border(-(x|y|t|b|l|r|s|e))?-[1-9]\d*$/.test(base) &&
            "a numeric border width; use border-w-selected or border-w-focused") ||
          (/^ring(-\d+)?$/.test(base) && "a ring width; use outline-focused") ||
          (/^((bg|text|border)-(white|black|current|inherit)|text-transparent)$/.test(base) &&
            "a literal colour; use a token");
        if (hit) context.report({ node, message: `"${cls}" is ${hit}.` });
      }),
  ),
  "no-non-token-class": rule(
    "Every class is a token utility or a structural utility from the documented list.",
    (context) =>
      forEachClass(context, ({ cls, base }, node) => {
        if (/^\[|-\[/.test(base)) return; // no-arbitrary-value reports these
        if (!isKnown(base))
          context.report({
            node,
            message: `"${cls}" is neither a token utility nor a documented structural utility.`,
          });
      }),
  ),
  "no-deprecated-token": rule(
    "A deprecated token, with its replacement.",
    (context) =>
      forEachClass(context, ({ cls, base }, node) => {
        const dep = Object.values(deprecated).find((d) => d.class === base);
        if (dep)
          context.report({
            node,
            message: `"${cls}" is deprecated${dep.replacementClass ? `; use "${dep.replacementClass}"` : ""}.`,
            fix:
              dep.replacementClass && node.type === "Literal"
                ? (fixer) =>
                    fixer.replaceText(
                      node,
                      JSON.stringify(node.value.replace(base, dep.replacementClass)),
                    )
                : null,
          });
      }),
    { fixable: "code" },
  ),
  "no-deprecated-name": rule(
    "A part that was renamed, with its replacement; one-to-one renames are fixed.",
    (context) => {
      const sourceText = (n) => context.sourceCode.getText(n).replace(/\s+/g, "");
      // `import { Shell as DsShell }` is still Shell.
      const aliases = new Map();
      const canonical = (text) => {
        const [root, ...restOf] = text.split(".");
        return [aliases.get(root) ?? root, ...restOf].join(".");
      };
      return {
        ImportDeclaration(node) {
          if (!/design-system|\/shell$/.test(String(node.source.value))) return;
          for (const s of node.specifiers)
            if (s.type === "ImportSpecifier" && s.imported.name !== s.local.name)
              aliases.set(s.local.name, s.imported.name);
        },
        JSXOpeningElement(node) {
          const name = canonical(jsxTag(node.name));
          const dep = deprecatedNames[name];
          if (!dep) return;
          context.report({
            node: node.name,
            message: `${name} is deprecated; use ${dep.to}${dep.note ? ` (${dep.note})` : ""}.`,
            fix: dep.fix
              ? (fixer) => {
                  const fixes = [fixer.replaceText(node.name, dep.to)];
                  for (const a of node.attributes)
                    if (a.type === "JSXAttribute" && dep.props?.[a.name.name])
                      fixes.push(fixer.replaceText(a.name, dep.props[a.name.name]));
                  if (node.parent.closingElement)
                    fixes.push(fixer.replaceText(node.parent.closingElement.name, dep.to));
                  return fixes;
                }
              : null,
          });
        },
        MemberExpression(node) {
          if (node.parent.type === "MemberExpression" && node.parent.object === node) return;
          const name = canonical(sourceText(node));
          const dep = deprecatedNames[name];
          if (dep) context.report({ node, message: `${name} is deprecated; use ${dep.to}.` });
        },
      };
    },
    { fixable: "code" },
  ),
  "cell-plain": rule(
    "A Table.Cell carries no neutral colour, weight or type token; only a status colour may differ.",
    (context) => ({
      JSXOpeningElement(node) {
        if (jsxTag(node.name) !== "Table.Cell") return;
        const attr = jsxAttr(node, "className");
        if (!attr) return;
        const bad = stringLiterals(attr.value)
          .flatMap((s) => s.split(/\s+/))
          .filter((t) => CELL_FORBIDDEN.test(t));
        if (bad.length)
          context.report({
            node: attr,
            message: `Table.Cell is one style. Drop ${bad.join(", ")}; only Badge, Dot, Indicator or a status colour may differ.`,
          });
      },
    }),
  ),
  "id-not-blue": rule("An Id is blue only inside a link or a button.", (context) => ({
    JSXOpeningElement(node) {
      if (jsxTag(node.name) !== "Id") return;
      const attr = jsxAttr(node, "className");
      if (!attr) return;
      if (!stringLiterals(attr.value).some((s) => /(^|\s)text-brand(\s|$)/.test(s))) return;
      for (let p = node.parent; p; p = p.parent)
        if (
          p.type === "JSXElement" &&
          /^(Link|a|button|Button|TextLink)$/.test(jsxTag(p.openingElement.name))
        )
          return;
      context.report({
        node: attr,
        message:
          "A bare Id is never blue. Blue means link: wrap it in a link or a button, or drop text-brand.",
      });
    },
  })),
  "no-kit-shadow": rule(
    "Product code imports kit parts instead of declaring its own.",
    (context) => {
      const check = (id) => {
        if (!id) return;
        if (KIT.has(id.name))
          context.report({
            node: id,
            message: `${id.name} is a kit part. Import it from @ledger/design-system instead of declaring a local copy.`,
          });
        else if (LEGACY[id.name])
          context.report({
            node: id,
            message: `${id.name} is ${LEGACY[id.name]} in the kit. Import that instead of declaring a local copy.`,
          });
      };
      const topLevel = (n) => n.type === "Program" || n.type === "ExportNamedDeclaration";
      return {
        FunctionDeclaration(node) {
          if (topLevel(node.parent)) check(node.id);
        },
        VariableDeclarator(node) {
          if (
            node.id.type === "Identifier" &&
            node.init &&
            /FunctionExpression$/.test(node.init.type) &&
            node.parent.parent &&
            topLevel(node.parent.parent)
          )
            check(node.id);
        },
      };
    },
  ),
  "use-primitives": rule(
    "Layout in product code goes through Box, Stack, Inline, Flex and Grid.",
    (context) => ({
      JSXOpeningElement(node) {
        if (
          node.name.type !== "JSXIdentifier" ||
          !/^(div|span|section|article|aside|header|footer|main|nav|ul|ol|li|form|fieldset)$/.test(
            node.name.name,
          )
        )
          return;
        const attr = node.attributes.find(
          (a) => a.type === "JSXAttribute" && a.name.name === "className",
        );
        if (!attr) return;
        const out = [];
        collect(attr.value, out);
        const text = out.map((o) => o.text).join(" ");
        if (
          /(^|\s)(flex|inline-flex|grid|inline-grid)(\s|$)/.test(text) ||
          /(^|\s)-?(p|px|py|pt|pb|ps|pe|gap|gap-x|gap-y)-/.test(text)
        )
          context.report({
            node,
            message: `<${node.name.name}> carries layout classes. Use Box for padding and background, Stack or Inline for a row or column, Flex or Grid otherwise.`,
          });
      },
    }),
  ),
};

/* ---------- configs ---------- */

const portability = {
  "no-restricted-imports": [
    "error",
    {
      patterns: [
        {
          group: ["@/*"],
          message:
            "The package imports nothing from a consumer. Use a relative path inside the package.",
        },
        {
          group: ["**/src/**", "../../../src/*"],
          message: "The package imports nothing from the prototype.",
        },
        {
          group: [
            "@tanstack/react-router",
            "@tanstack/react-router/*",
            "react-router*",
            "next/link",
          ],
          message: "No router dependency. A link is a slot the consumer fills (asChild).",
        },
      ],
    },
  ],
};

const plugin = {
  meta: { name: "@ledger/design-system/eslint", version: "0.1.0" },
  rules,
  configs: {},
};

/** The package's own code: everything is an error, and nothing outside the package may be imported. */
plugin.configs.package = [
  {
    plugins: { ledger: plugin },
    rules: {
      "ledger/no-arbitrary-value": "error",
      "ledger/no-alpha-token": "error",
      "ledger/no-dark-variant": "error",
      "ledger/no-margin": "error",
      "ledger/no-static-design-value": "error",
      "ledger/no-non-token-class": "error",
      "ledger/no-deprecated-token": "error",
      "ledger/no-deprecated-name": "error",
      "ledger/prefer-text-link": "error",
      "ledger/no-colgroup": "error",
      ...portability,
    },
  },
  {
    // Bleed is the one place negative margins are written.
    files: ["**/primitives/bleed.tsx"],
    rules: { "ledger/no-margin": "off" },
  },
  {
    // Stories are documentation: their own layout may use arbitrary widths; the token rules still apply to what they demonstrate.
    files: ["**/stories/**"],
    rules: { "ledger/no-arbitrary-value": "off", "ledger/no-non-token-class": "warn" },
  },
];

/** A consumer: token rules as errors, layout-through-primitives as a warning to turn up later. */
plugin.configs.recommended = [
  {
    plugins: { ledger: plugin },
    rules: {
      "ledger/no-arbitrary-value": "error",
      "ledger/no-alpha-token": "error",
      "ledger/no-dark-variant": "error",
      "ledger/no-margin": "error",
      "ledger/no-static-design-value": "error",
      "ledger/no-non-token-class": "error",
      "ledger/no-deprecated-token": "error",
      "ledger/no-deprecated-name": "error",
      "ledger/cell-plain": "error",
      "ledger/id-not-blue": "error",
      "ledger/no-kit-shadow": "error",
      "ledger/prefer-text-link": "error",
      "ledger/no-colgroup": "error",
      "ledger/use-primitives": "warn",
    },
  },
];

export default plugin;
