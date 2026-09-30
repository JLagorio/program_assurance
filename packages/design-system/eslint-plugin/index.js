// @ledger/design-system ESLint plugin. Plain ESM so ESLint loads it without a TypeScript loader.
// What a class is, and the allowlist and deprecation map behind it, live in classes.js; where a
// class enters a file and what it reads as there, in class-sites.js, over the value resolver in
// values.js; which kit part a tag is, in identity.js; `settings.ledger`, in settings.js; fixes that
// rewrite a class in place, in fixes.js; how a rule is defined, worded, noted and counted, and the
// message contract every rule keeps, in report.js; what the token build asked Tailwind, read when a
// rule first needs it, in data.js; the Ledger token nearest a value written some other way, in
// nearest.js; the part and prop values to write in place of layout classes, a margin or a width,
// in advice.js.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { classesOf, classify, closureFailures, deprecatedClass, withVariants } from "./classes.js";
import { builtClass, classSites } from "./class-sites.js";
import { compositionRules } from "./composition-rules.js";
import { configRules } from "./config-rules.js";
import { STALE_MESSAGE, reportingStaleData } from "./data.js";
import { classFix } from "./fixes.js";
import { gateRules } from "./gate-rules.js";
import {
  PLAIN_LAYOUT,
  PRIMITIVES,
  layoutAdvice,
  layoutKind,
  layoutProp,
  marginAdvice,
} from "./advice.js";
import {
  alphaStateAdvice,
  colourAdvice,
  colourOfClass,
  colourWords,
  darkPairAdvice,
  explainUnknown,
  fitted,
  staticAdvice,
  valueAdvice,
} from "./nearest.js";
import {
  KIT_PARTS,
  classOwnerOf,
  isKitHomeBinding,
  isKitSourceFile,
  isKitStoryFile,
  jsxTag,
  kitBindingOf,
  kitPartOf,
  partNameOf,
  renderedElementOf,
} from "./identity.js";
import { readableRules } from "./readable-rules.js";
import { defineRules, render, withAllowance } from "./report.js";
import { settings } from "./settings.js";
import { variantRules } from "./variant-rules.js";

const here = path.dirname(fileURLToPath(import.meta.url));

/* ---------- classes ---------- */

/**
 * Every class the file hands to something, for a rule that judges a class by itself: each string
 * that reaches a class site (class-sites.js), claimed once however many sites reach it, and
 * reported where it is written, with `siblings()`, every class of the site it was claimed at (a
 * `dark:` colour's light twin is one of them). `glued`, when given, hears each template or
 * concatenation that builds a class at runtime, once, with which side of each hole is glued.
 */
function forEachClass(context, cb, { glued } = {}) {
  const claimed = new WeakSet();
  const builds = new WeakSet();
  return classSites(context).visitors((site) => {
    let all;
    const siblings = () => (all ??= site.strings.flatMap(({ text }) => classesOf(text)));
    for (const { text, node } of site.strings) {
      if (claimed.has(node)) continue;
      claimed.add(node);
      for (const c of classesOf(text)) cb(c, node, siblings, site);
    }
    if (glued)
      for (const { node, reason, sides } of site.unresolved)
        if (reason === "glued-template" && !builds.has(node)) {
          builds.add(node);
          glued(node, sides);
        }
  });
}

/**
 * forEachClass for a token rule: each class whose one owner (classify in classes.js) is `rule`,
 * with the message id and data classify gives it, its site's `siblings()` and the site. A class
 * has one owner, so no two rules report it.
 */
const forEachOwnClass = (context, rule, cb, options) =>
  forEachClass(
    context,
    (parsed, node, siblings, site) => {
      const found = classify(parsed);
      if (found.owner === rule) cb(found, parsed, node, siblings, site);
    },
    options,
  );

/**
 * For a padding or a gap class that use-primitives reports on the element it is written on (a
 * plain layout element whose classes it reads, or a layout primitive), in a product's file: the
 * prop that takes the class's step in its place, as advice.js's layoutProp gives it; undefined
 * anywhere else (the kit's own source, where use-primitives does not run; another element; a
 * class under a variant, which no prop keys). The value advice then names the prop, and no class
 * suggestion is offered that use-primitives would report in turn.
 */
function layoutPropOf(context, site, parsed) {
  const opening = site?.element;
  if (!opening || site.attribute !== "className" || isKitSourceFile(context)) return undefined;
  if (parsed.variants.length || !/^(padding|gap)$/.test(layoutKind(parsed) ?? "")) return undefined;
  const plain = opening.name.type === "JSXIdentifier" && PLAIN_LAYOUT.test(opening.name.name);
  const part = plain ? undefined : site.owner.part;
  if (!plain && !PRIMITIVES.has(part)) return undefined;
  const all = classesOf(elementClasses(context, opening).texts.join(" "));
  if (plain && !all.some(({ cls }) => PLAIN_DISPLAY.test(cls) || PLAIN_SPACE.test(cls)))
    return undefined;
  return () => layoutProp({ part, base: parsed.base, classes: all });
}
/** For a report to spread: editor suggestions, by the rule's `replace` message, that each write
    one of `replacements` over the class `cls` where it is written, and pass the closure check
    (classFix); nothing when none can. A suggestion never runs under --fix. */
function suggestionsOf(context, node, cls, replacements = []) {
  const suggest = replacements.flatMap((replacement) => {
    const { fix } = classFix(node, context.sourceCode, cls, replacement);
    return fix ? [{ messageId: "replace", data: { cls, replacement }, fix }] : [];
  });
  return suggest.length ? { suggest } : {};
}

/** For a report to spread: the one editor suggestion that writes `replacement`, the Ledger class
    of the same value that nearest.js names (`same` says what is the same: `16px`, `colour in both
    modes`), over the class `cls` where it is written, by the rule's `sameValue` message; nothing
    when there is none, or it cannot be written in place or would fail the closure check. A
    suggestion never runs under --fix. */
function sameValueOf(context, node, cls, replacement, same) {
  if (!replacement) return {};
  const { fix } = classFix(node, context.sourceCode, cls, replacement);
  return fix
    ? { suggest: [{ messageId: "sameValue", data: { cls, replacement, same }, fix }] }
    : {};
}

/** no-static-design-value's words when the lint data names no nearer token: the scale to pick from. */
const STATIC_ADVICE = {
  fixedRadius: "Use rounded-xsmall…rounded-full.",
  numericOpacity: "Use opacity-disabled or opacity-loading.",
  numericDuration: "Use a duration token, duration-micro…duration-slower.",
  numericBorder: "Use border, border-w-selected or border-w-focused.",
  literalColour: "Use the token for its role.",
};

/** no-non-token-class's words for a palette colour with alpha when no role of its hue is named. */
const PALETTE_ALPHA_ADVICE =
  "Use the Ledger colour token for its role; a shade of it is a state token.";

/** A palette colour with alpha's advice (`bg-black/50`): the roles of its hue as the colour shows
    over each mode's page, ranked with a dark: twin, as nearest.js's colourAdvice gives them;
    undefined for a prefix with no colour tokens (`ring-black/10`) or while the data is stale. */
function colourAlphaAdvice(parsed, siblings) {
  const colour = colourAdvice(parsed, siblings);
  if (!colour) return undefined;
  return {
    words: colourWords(colour),
    ...(colour.single
      ? { replacement: withVariants(parsed, colour.single.cls), same: "colour in both modes" }
      : {}),
  };
}

/** no-alpha-token's words when the lint data names none of the token's states. */
const ALPHA_ADVICE = "A tint or a state is its own token (subtle, hovered, pressed), never alpha.";

/** no-alpha-token's advice from alphaStateAdvice (nearest.js), richest first: the state its
    variant asks for, else the tints and states its alpha stands for; none while the data is
    stale or the token has neither. */
function alphaWords(found) {
  if (!found) return [];
  if (found.state) return [`That state is its own token: ${found.state}.`];
  const tints = found.tints.join(" or ");
  const states = found.states.join(" or ");
  if (tints && states) return [`A tint of it is ${tints}; a state of it is ${states}.`];
  if (tints) return [`A tint of it is ${tints}.`];
  if (states) return [`A state of it is ${states}.`];
  return [];
}

/** A rule's message with `data` and no note, as a finding's words are measured (report.js, 7). */
const wordsOf = (rule, id, data) => render(rules[rule].meta.messages[id], { ...data, note: "" });

/** The classes a JSX element carries in className, from its attribute and any readable spread that
    sets it, and the attribute or spread they are written in (the first, when there are several). */
function elementClasses(context, opening) {
  const sites = classSites(context).classSitesOf(opening);
  return {
    at: sites[0]?.at,
    texts: sites.flatMap((site) => site.strings.map(({ text }) => text)),
  };
}

/* ---------- rules ---------- */

const jsxAttr = (node, name) =>
  node.attributes.find((a) => a.type === "JSXAttribute" && a.name.name === name);
const attrIsTrue = (a) =>
  a &&
  (a.value === null ||
    (a.value.type === "JSXExpressionContainer" &&
      a.value.expression.type === "Literal" &&
      a.value.expression.value === true));

/** A map's own entry for a key read from the source, so `constructor` or `toString` finds none. */
const own = (map, key) => (map && Object.hasOwn(map, key) ? map[key] : undefined);
const literalValue = (attribute) => {
  let value = attribute?.value;
  if (value?.type === "JSXExpressionContainer") value = value.expression;
  return value?.type === "Literal" ? value.value : undefined;
};
/** The JSX element whose attribute holds this element (`render={<a … />}`, also through a
    condition or a fallback: `openLink ?? <Link … />`), and the attribute's name. */
const heldBy = (node) => {
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
  return attribute?.type === "JSXAttribute"
    ? { owner: attribute.parent, attribute: attribute.name.name }
    : undefined;
};

/** Parts that were renamed. `fix` marks a one-to-one rename the rule can apply; `props` renames attributes with it. */
const deprecatedNames = {
  // Looked up by names from the source, so `Kit.constructor` or `toString` is no renamed part.
  __proto__: null,
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
  Tiles: { to: "Stat.Grid", note: "the same row of Stat.Tile cells, under the Stat name" },
  DensityProvider: {
    to: "nothing",
    note: "density is a table's: Table density, or Compact rows in a DataTable's Columns menu; remove the retired provider",
  },
  DensitySwitch: {
    to: "Compact rows in DataTable.Columns",
    note: "or Table density for a table that is compact by design",
  },
  useDensity: {
    to: "table.options.meta.density",
    note: "a DataTable's own; the global hook is removed",
  },
  densityScript: {
    to: "nothing",
    note: "remove the retired script; table density needs no before-paint script",
  },
  "Collapsible.Group": {
    to: "Accordion",
    note: "use multiple, root defaultValue and AccordionItem with explicit stable values; see the disclosure migration guide",
  },
  LegacyCollapsible: {
    to: "Collapsible",
    note: "compose CollapsibleTrigger/CollapsibleContent; grouped sections use Accordion with AccordionItem",
  },
  LegacyAccordion: {
    to: "Accordion",
    note: "use explicit AccordionItem, AccordionTrigger and AccordionContent parts",
  },
  // Kit class helpers, not parts.
  controlBase: {
    to: "Input, Textarea or InputGroup",
    note: "compose the field part, which carries the control's classes",
  },
  controlHeight: { to: "the size prop", note: "give Input, Select or a date field `size`" },
  formatNumber: {
    to: "useLedgerLocale().formatNumber",
    note: "the chart parts format in the reader's locale",
  },
  // Removed page shapes: reported where they are imported, since a local component may share the name.
  IndexPage: {
    to: "PageHeader over a DataTable with fill",
    note: "a register is one PageHeader and a frameless DataTable",
    removed: true,
  },
  ShowPage: {
    to: "PageHeader, Section and Shell.Aside",
    note: "a record page: PageHeader, Section bodies and the Details rail in Shell.Aside",
    removed: true,
  },
  RecordHeader: {
    to: "PageHeader",
    note: "the trail in PageHeader.Lead, the name in PageHeader.Title, actions in PageHeader.Actions",
    removed: true,
  },
  PreviewRail: { to: "Shell.Aside", removed: true },
  PreviewSplit: { to: "Shell.Panel", note: "the preview is the Shell's panel area", removed: true },
  Panel: { to: "Shell.Panel", note: "the panel is an area of the Shell", removed: true },
  Block: { to: "Section", removed: true },
};
/** The last segment of every name a member expression can be reported under (`Sidebar` of
    `Shell.Sidebar`, `Tiles`), built once: no-deprecated-name skips any other member before reading
    its source, the costliest step of the costliest ledger rule. */
const deprecatedMemberEnds = new Set(
  Object.entries(deprecatedNames)
    .filter(([, dep]) => !dep.removed)
    .map(([name]) => name.split(".").at(-1)),
);

/* The layout primitives whose props use-primitives reads classes against, and the plain elements
   it reads, are advice.js's PRIMITIVES and PLAIN_LAYOUT; the advice for their classes is the part
   and props they make (advice.js's layoutAdvice). The layout classes it reports on a plain element: */
const PLAIN_DISPLAY = /(^|\s)(flex|inline-flex|grid|inline-grid)(\s|$)/;
const PLAIN_SPACE = /(^|\s)-?(p|px|py|pt|pb|ps|pe|gap|gap-x|gap-y)-/;
/** use-primitives' words for a plain element whose one layout class is gap-px. */
const HAIRLINE_GAP_ADVICE =
  "A 1px gap is on no space step: give a Stack, an Inline or a Grid a space token, or draw the hairline with a border or a Separator.";
/** A flex column, which makes a flex element a Stack. */
const COLUMN = /^flex-col(-reverse)?$/;

/**
 * Props and values a part renamed. `to` renames the attribute, `values` renames a literal value;
 * both are fixed. `note` alone reports a prop with no one-to-one replacement. Every level is read
 * with names from the source, so none has a prototype: `<Switch toString="x">`, a `size` of
 * "constructor" and a part named `constructor` find no rename.
 */
const deprecatedAttributes = {
  __proto__: null,
  Switch: {
    __proto__: null,
    size: { values: { __proto__: null, sm: "small", default: "medium" } },
  },
  SelectTrigger: {
    __proto__: null,
    size: { values: { __proto__: null, sm: "small", default: "medium" } },
  },
  Card: { __proto__: null, size: { values: { __proto__: null, sm: "small", default: "medium" } } },
  DropdownMenuItem: {
    __proto__: null,
    variant: { values: { __proto__: null, destructive: "danger" } },
  },
  "Item.Group": { __proto__: null, labelledBy: { to: "aria-labelledby" } },
  "Chart.Donut": { __proto__: null, label: { to: "centerLabel" } },
  "Chart.Scatter": { __proto__: null, name: { to: "nameKey" } },
  "Chart.Frame": { __proto__: null, status: { to: "state" } },
  "Chart.Area": {
    __proto__: null,
    baseline: { note: "an Area always starts at zero; remove the prop" },
  },
  "Tree.Item": { __proto__: null, expanded: { to: "isExpanded" } },
};
// The same parts under their named exports.
for (const [compound, named] of [
  ["Item.Group", "ItemGroup"],
  ["Chart.Donut", "ChartDonut"],
  ["Chart.Scatter", "ChartScatter"],
  ["Chart.Frame", "ChartFrame"],
  ["Chart.Area", "ChartArea"],
  ["Tree.Item", "TreeItem"],
])
  deprecatedAttributes[named] = deprecatedAttributes[compound];
// A part renamed with its props: an old prop left on the new name (by hand, or because the element
// already set the new one) is reported there.
for (const dep of Object.values(deprecatedNames))
  if (dep.props)
    deprecatedAttributes[dep.to] = {
      __proto__: null,
      ...deprecatedAttributes[dep.to],
      ...Object.fromEntries(Object.entries(dep.props).map(([from, to]) => [from, { to }])),
    };

/* ---------- how a product assembles the kit ---------- */

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
  Tiles: "Stat.Grid",
  TabStrip: "Tabs",
  RailGroup: "Inspector.Group",
  StackedBar: "ProgressStacked",
  AvatarStack: "AvatarGroup",
  MenuItem: "DropdownMenu.Item",
  MenuLabel: "DropdownMenu.Label",
  RelatedCard: "Related",
  RelatedRow: "Item",
  WorkPaneRow: "WorkPane.Row",
  TreeCell: "Table.Tree",
  Facts: "Fact.Group",
  Sidebar: "Shell.SideNav",
  TopBar: "Shell.TopNav",
  NavItem: "Shell.SideNav.Item",
};
/** Neutral colour, weight and type tokens a table cell may not carry; a status colour (text-danger, text-warning) is data, not design. */
const CELL_FORBIDDEN =
  /^(text-(default|subtle|subtlest|brand|selected|inverse|disabled)|font-(body(-large|-small|-xsmall)?|heading-\w+|code|medium|semibold|regular))$/;
const rules = {
  ...compositionRules,
  ...defineRules({
    "button-icon-slot": {
      description:
        "An icon in a Button goes in iconBefore or iconAfter, and an IconButton takes icon; the button sizes it.",
      // The subject is the icon as written, with the size class it carries.
      messages: {
        button:
          '<{{icon}}> is sized by hand ("{{cls}}") as a Button\'s child, where the Button can neither size it nor swap it for the spinner. Pass it bare: iconBefore={<{{icon}} />} or iconAfter.{{note}}',
        iconButton:
          '<{{icon}}> is sized by hand ("{{cls}}") as an IconButton\'s child. The IconButton sizes its icon and names it from label: pass it bare, icon={<{{icon}} />}.{{note}}',
        renderedButton:
          '<{{icon}}> is sized by hand ("{{cls}}") inside <{{wrapper}}>, which renders a Button that sizes its own icons. Pass it bare in that Button\'s iconBefore or iconAfter.{{note}}',
        renderedIconButton:
          '<{{icon}}> is sized by hand ("{{cls}}") inside <{{wrapper}}>, which renders an IconButton that sizes its own icon. Pass it bare as that IconButton\'s icon.{{note}}',
      },
      create: (context) => ({
        JSXElement(node) {
          // Only an element among the children can be an icon; most elements hold none.
          if (!node.children.some((child) => child.type === "JSXElement")) return;
          // The kit's own Button or IconButton, however it is imported, or one a render prop puts
          // in the element's place, which then holds its children; a look-alike is not.
          const buttons = ["Button", "IconButton"];
          const self = kitPartOf(context, node.openingElement.name);
          const owner = buttons.includes(self)
            ? { part: self, via: "self" }
            : classOwnerOf(context, node.openingElement);
          if (!buttons.includes(owner.part)) return;
          for (const child of node.children) {
            if (child.type !== "JSXElement") continue;
            // The child's className, through a const, a map or a helper too (class-sites.js).
            const { texts } = elementClasses(context, child.openingElement);
            const size = /(?:^|\s)(size-icon-\w+)(?=\s|$)/.exec(texts.join(" "))?.[1];
            if (size) {
              const icon = { icon: jsxTag(child.openingElement.name), cls: size };
              context.report({
                node: child,
                ...(owner.via === "render"
                  ? {
                      messageId: owner.part === "Button" ? "renderedButton" : "renderedIconButton",
                      data: { ...icon, wrapper: owner.wrapper },
                    }
                  : { messageId: owner.part === "Button" ? "button" : "iconButton", data: icon }),
              });
            }
          }
        },
      }),
    },
    "prefer-text-link": {
      description:
        "Navigation that reads as text is TextLink; the classes that fake it are not written by hand, and a link that opens a new tab says so.",
      messages: {
        textLinkTarget:
          'target="_blank" on <{{tag}}> opens a new tab without saying so. Use newTab, which sets rel and says "(opens in a new tab)", and drop target and rel.{{note}}',
        renderTarget:
          'target="_blank" on <{{tag}}> in a TextLink\'s render opens a new tab the TextLink does not announce. Give the TextLink newTab, which sets rel and says "(opens in a new tab)", and drop target.{{note}}',
        newTab:
          '<{{tag}} target="_blank"> opens a new tab without saying so. Use TextLink newTab (render={<{{tag}} … />} for a router link).{{note}}',
        linkClasses:
          "<{{tag}}> carries the text-link classes. Compose it with TextLink render and drop text-brand and hover:underline.{{note}}",
        buttonLink:
          '<{{tag}} variant="link" asChild> wraps a link in a Button styled as text. A link that reads as text is TextLink (render={<Link … />} for a router link); variant="link" is for an action.{{note}}',
      },
      create: (context) => ({
        JSXOpeningElement(node) {
          // A link is known by its tag (a, Link, NavLink); TextLink and Button by the kit's import.
          const name = jsxTag(node.name);
          const part = kitPartOf(context, node.name);
          // A new tab is TextLink newTab, which sets rel and tells a screen reader. A link held by
          // a part's prop (render, openLink) is that part's to announce, unless it is a TextLink
          // without newTab.
          if (literalValue(jsxAttr(node, "target")) === "_blank") {
            const held = heldBy(node);
            const owner = held ? kitPartOf(context, held.owner.name) : "";
            if (part === "TextLink" && !jsxAttr(node, "newTab"))
              context.report({
                node: jsxAttr(node, "target"),
                messageId: "textLinkTarget",
                data: { tag: name },
              });
            else if (/^(a|Link|NavLink)$/.test(name) && held && owner === "TextLink") {
              if (!jsxAttr(held.owner, "newTab"))
                context.report({
                  node: jsxAttr(node, "target"),
                  messageId: "renderTarget",
                  data: { tag: name },
                });
            } else if (/^(a|Link|NavLink)$/.test(name) && !held)
              context.report({
                node: jsxAttr(node, "target"),
                messageId: "newTab",
                data: { tag: name },
              });
          }
          if (/^(a|Link|NavLink)$/.test(name)) {
            const { at, texts } = elementClasses(context, node);
            if (/(^|\s)(hover:underline|text-brand)(\s|$)/.test(texts.join(" ")))
              context.report({ node: at, messageId: "linkClasses", data: { tag: name } });
          } else if (part === "Button") {
            const variant = jsxAttr(node, "variant");
            if (
              variant?.value?.type === "Literal" &&
              variant.value.value === "link" &&
              attrIsTrue(jsxAttr(node, "asChild"))
            )
              context.report({ node, messageId: "buttonLink", data: { tag: name } });
          }
        },
      }),
    },
    "no-colgroup": {
      description:
        "Column widths are content decisions and go on Table.Header width, not in a colgroup.",
      messages: {
        colgroup:
          "<colgroup> fixes widths away from the header. Put width on each Table.Header instead.{{note}}",
      },
      create: (context) => ({
        JSXOpeningElement(node) {
          if (jsxTag(node.name) === "colgroup") context.report({ node, messageId: "colgroup" });
        },
      }),
    },
    "no-arbitrary-value": {
      description: "Arbitrary values (text-[13px], w-[240px]) bypass the tokens.",
      fixable: "code",
      hasSuggestions: true,
      messages: {
        // `advice` is the token of the value's role nearest it (nearest.js), else "Use a token
        // utility or a primitive prop."
        arbitrary: '"{{cls}}" is an arbitrary value. {{advice}}{{note}}',
        variable:
          '"{{cls}}" reads a CSS variable the lint cannot compare with a token. Use a token utility or a primitive prop.{{note}}',
        token:
          '"{{cls}}" writes a token\'s variable by hand. Use "{{replacement}}", the token utility that generates the same CSS.{{note}}',
        tokenByHand:
          '"{{cls}}" writes a token\'s variable by hand. Use "{{replacement}}", the token utility that generates the same CSS. Replace it by hand; {{reason}}, so no automatic fix is offered.{{note}}',
        // The editor suggestion that writes the token class of the same value.
        sameValue: '"{{cls}}" becomes "{{replacement}}", the same {{same}}.{{note}}',
        // Lint data the token build did not write from today's inputs, once per file (data.js).
        stale: STALE_MESSAGE,
      },
      create: (context) =>
        reportingStaleData(
          context,
          forEachOwnClass(
            context,
            "no-arbitrary-value",
            ({ cause, data }, parsed, node, siblings, site) => {
              // A token's variable with a token class that declares the same (classify's `token`) is
              // fixed to that class, under the class's variants and important modifier, in the
              // string's own source; a replacement another rule would report is not asked for.
              const replacement = data.token && withVariants(parsed, data.token);
              if (!replacement || closureFailures(replacement).length) {
                if (cause !== "arbitrary") {
                  context.report({ node, messageId: cause, data: { cls: data.cls } });
                  return;
                }
                // Any other value: the token of its role nearest it, which is an editor suggestion
                // only when it has the same value (nearest.js); a padding or a gap use-primitives
                // reports on this element, the primitive's prop, with no suggestion.
                const advice = valueAdvice(parsed, {
                  siblings: siblings(),
                  arbitrary: true,
                  prop: layoutPropOf(context, site, parsed),
                });
                const words = (text) =>
                  wordsOf("no-arbitrary-value", cause, { ...data, advice: text });
                context.report({
                  node,
                  messageId: cause,
                  data: {
                    cls: data.cls,
                    advice: fitted(
                      [...(advice?.words ?? []), "Use a token utility or a primitive prop."],
                      words,
                    ),
                  },
                  ...sameValueOf(context, node, parsed.cls, advice?.replacement, advice?.same),
                });
                return;
              }
              const { cls } = parsed;
              const { fix, reason } = classFix(node, context.sourceCode, cls, replacement);
              context.report({
                node,
                ...(fix
                  ? { messageId: "token", data: { cls, replacement } }
                  : { messageId: "tokenByHand", data: { cls, replacement, reason } }),
                fix: fix ?? null,
              });
            },
          ),
        ),
    },
    "no-alpha-token": {
      description: "A state is a token, never alpha on a base token.",
      messages: {
        // `advice` names the token's own states that exist, picked by the alpha (nearest.js's
        // alphaStateAdvice), else ALPHA_ADVICE.
        alpha:
          '"{{cls}}" dims {{token}} with alpha, which changes its contrast and its dark value. {{advice}}{{note}}',
      },
      create: (context) =>
        forEachOwnClass(context, "no-alpha-token", ({ data }, parsed, node) => {
          const found = alphaStateAdvice(parsed);
          const token = found?.token ?? parsed.base.replace(/\/\d+$/, "");
          context.report({
            node,
            messageId: "alpha",
            data: {
              cls: data.cls,
              token,
              advice: fitted([...alphaWords(found), ALPHA_ADVICE], (advice) =>
                wordsOf("no-alpha-token", "alpha", { cls: data.cls, token, advice }),
              ),
            },
          });
        }),
    },
    "no-dark-variant": {
      description: "A dark: class means a token is missing.",
      messages: {
        // A class whose colour the lint cannot read (a layout class, stale data).
        dark: '"{{cls}}" uses the dark variant. The colour mode flips every token by itself: drop the class, and give a colour its token.{{note}}',
        // Beside a light twin that is a token, which already changes with the mode.
        flips:
          '"{{cls}}" sets a dark value by hand beside "{{sibling}}", a token that already changes with the mode. Drop the dark: class.{{note}}',
        // A token under dark: with no light twin: the token changes with the mode by itself.
        token:
          '"{{cls}}" sets {{token}} for dark mode alone, and {{token}} is a token that already changes with the mode. Write it without dark:, or drop the class.{{note}}',
        // With a light twin that is no token: one token of their role stands for both.
        pair: '"{{cls}}" sets a dark colour by hand, outside the contrast checks. {{advice}} A token changes with the mode by itself, so it replaces both classes.{{note}}',
        // A token under dark: beside a light twin that is a literal colour: the literal is the
        // class to replace, with a token that changes with the mode by itself.
        literalTwin:
          '"{{cls}}" is a token, which changes with the mode by itself, and the light class beside it is a literal colour. {{advice}} One token replaces both classes, written without dark:.{{note}}',
        // A dark: colour alone, ranked by its dark value.
        colour:
          '"{{cls}}" sets a dark colour by hand, outside the contrast checks. {{advice}} A token changes with the mode by itself: write it without dark:.{{note}}',
      },
      create: (context) =>
        forEachOwnClass(context, "no-dark-variant", ({ data }, parsed, node, siblings) => {
          // Read with its light twin on the site (nearest.js): a token that flips already, or
          // the roles the pair's colour plays, ranked in both modes.
          // A deprecated token is no-deprecated-token's once the dark: class goes.
          const found = !deprecatedClass(parsed.base) && darkPairAdvice(parsed, siblings());
          if (!found) {
            context.report({ node, messageId: "dark", data: { cls: data.cls } });
            return;
          }
          if (found.flips) {
            context.report({
              node,
              messageId: "flips",
              data: { cls: data.cls, sibling: found.sibling },
            });
            return;
          }
          if (!found.sibling && colourOfClass(parsed.base)?.fixed === false) {
            context.report({
              node,
              messageId: "token",
              data: { cls: data.cls, token: parsed.base },
            });
            return;
          }
          const messageId = !found.sibling ? "colour" : found.token ? "literalTwin" : "pair";
          const words = { cls: data.cls, sibling: found.sibling };
          context.report({
            node,
            messageId,
            data: {
              ...words,
              advice: fitted(found.words, (advice) =>
                wordsOf("no-dark-variant", messageId, { ...words, advice }),
              ),
            },
          });
        }),
    },
    "no-margin": {
      description: "Spacing between siblings comes from Stack, Inline and Bleed, not margins.",
      messages: {
        // `advice` is the parent's space at the margin's step, on a Stack or an Inline by its
        // axis, or Bleed for a negative margin (advice.js's marginAdvice).
        margin: '"{{cls}}" is a margin. {{advice}}{{note}}',
        negative: '"{{cls}}" is a negative margin. {{advice}}{{note}}',
      },
      create: (context) =>
        forEachOwnClass(context, "no-margin", ({ data }, parsed, node) => {
          const { negative, words } = marginAdvice(parsed.base);
          const messageId = negative ? "negative" : "margin";
          context.report({
            node,
            messageId,
            data: {
              cls: data.cls,
              advice: fitted(words, (advice) =>
                wordsOf("no-margin", messageId, { cls: data.cls, advice }),
              ),
            },
          });
        }),
    },
    "no-static-design-value": {
      description: "Static Tailwind utilities that encode a design value the tokens own.",
      hasSuggestions: true,
      // By what the class encodes (staticDesignValue in classes.js). `advice` is the token of its
      // role nearest the value (nearest.js), else STATIC_ADVICE's words.
      messages: {
        fixedRadius: '"{{cls}}" is a fixed 4px radius, off the radius scale. {{advice}}{{note}}',
        numericOpacity: '"{{cls}}" is a numeric opacity. {{advice}}{{note}}',
        numericDuration: '"{{cls}}" is a numeric duration. {{advice}}{{note}}',
        numericBorder: '"{{cls}}" is a numeric border width. {{advice}}{{note}}',
        ringWidth: '"{{cls}}" is a ring width; use outline-focused.{{note}}',
        literalColour: '"{{cls}}" is a literal colour. {{advice}}{{note}}',
        // The editor suggestion that writes the token class of the same value.
        sameValue: '"{{cls}}" becomes "{{replacement}}", the same {{same}}.{{note}}',
      },
      create: (context) =>
        forEachOwnClass(
          context,
          "no-static-design-value",
          ({ cause, data }, parsed, node, siblings) => {
            // The value's nearest token, and a literal colour's roles ranked with its dark: twin;
            // an editor suggestion only for the same value (nearest.js).
            const advice = cause !== "ringWidth" && staticAdvice(parsed, cause, siblings());
            const words = (text) =>
              wordsOf("no-static-design-value", cause, { ...data, advice: text });
            context.report({
              node,
              messageId: cause,
              data: {
                cls: data.cls,
                advice: fitted([...(advice?.words ?? []), STATIC_ADVICE[cause] ?? ""], words),
              },
              ...sameValueOf(context, node, parsed.cls, advice?.replacement, advice?.same),
            });
          },
        ),
    },
    "no-non-token-class": {
      description:
        "Every class is a token utility or a structural utility from the documented list.",
      hasSuggestions: true,
      // By cause: a class no other class rule owns (classify in classes.js), and a class built at
      // runtime.
      messages: {
        unknown:
          '"{{cls}}" is neither a token utility nor a documented structural utility.{{note}}',
        // `advice` names the roles of its hue as it shows over each mode's page (nearest.js), else
        // PALETTE_ALPHA_ADVICE.
        paletteAlpha:
          '"{{cls}}" is a Tailwind palette colour with alpha; neither is on the tokens. {{advice}}{{note}}',
        negative:
          '"{{cls}}" generates no CSS: {{property}} cannot be negative. Drop the minus, or pull the content outward with Bleed.{{note}}',
        negativeLength:
          '"{{cls}}" generates no CSS: {{property}} cannot be negative. Drop the minus.{{note}}',
        runtime:
          '"{{built}}" builds a class name at runtime, which Tailwind cannot generate and the lint cannot check. Map each value to a whole class (a Record of full names), or use a part\'s tone prop.{{note}}',
        // A shadcn theme name (build/vocabulary-aliases.json), with the Ledger classes for its job.
        vocabulary:
          '"{{cls}}" is shadcn\'s {{means}}, which generates no CSS in Ledger. Use {{use}}.{{aside}}{{note}}',
        vocabularyAlpha:
          '"{{cls}}" is shadcn\'s {{means}} with alpha, which generates no CSS in Ledger. The colour is {{use}}; a shade of it is a state token, never alpha.{{aside}}{{note}}',
        // An unknown class the lint can say more of (nearest.js): a Tailwind stock value, with the
        // Ledger token nearest it in its role's family; a stock width or height, which no token
        // names; a Ledger-shaped space key that is no key; a step past a numbered token series;
        // and a misspelt token class.
        stock:
          "\"{{cls}}\" is Tailwind's {{what}}, which Ledger's tokens replace. {{advice}}{{note}}",
        size: '"{{cls}}" is Tailwind\'s {{what}}. {{advice}}{{note}}',
        spaceKey:
          '"{{cls}}" names no key on Ledger\'s space scale, so it generates no CSS. {{advice}}{{note}}',
        series:
          '"{{cls}}" steps past {{series}}, which runs {{range}}, so it generates no CSS.{{note}}',
        typo: '"{{cls}}" is "{{meant}}" misspelt, so it generates no CSS.{{note}}',
        // The editor suggestion that writes a Ledger class in the class's place.
        replace: '"{{cls}}" becomes "{{replacement}}".{{note}}',
        // The editor suggestion that writes the token class of the same value.
        sameValue: '"{{cls}}" becomes "{{replacement}}", the same {{same}}.{{note}}',
        // Lint data the token build did not write from today's inputs, once per file (data.js).
        stale: STALE_MESSAGE,
      },
      create: (context) =>
        reportingStaleData(
          context,
          forEachOwnClass(
            context,
            "no-non-token-class",
            // `data` is classify's: the class, the property a minus cannot negate, and the Ledger
            // classes a shadcn theme name stands for, each an editor suggestion (never --fix).
            ({ cause, data }, parsed, node, siblings, site) => {
              // What else an unknown class is, read with its site (a dark: twin), and the one
              // class that may stand for it: a misspelling's, or a stock value's with the same value.
              const known =
                cause === "unknown" &&
                explainUnknown(
                  parsed,
                  siblings(),
                  (id, words) => wordsOf("no-non-token-class", id, { ...data, ...words }),
                  layoutPropOf(context, site, parsed),
                );
              // A palette colour with alpha: the roles of its hue, as it shows over each mode's
              // page, and one pick only where one role holds that colour in both modes.
              if (cause === "paletteAlpha") {
                const colour = colourAlphaAdvice(parsed, siblings());
                context.report({
                  node,
                  messageId: cause,
                  data: {
                    ...data,
                    advice: fitted([...(colour?.words ?? []), PALETTE_ALPHA_ADVICE], (advice) =>
                      wordsOf("no-non-token-class", cause, { ...data, advice }),
                    ),
                  },
                  ...sameValueOf(context, node, parsed.cls, colour?.replacement, colour?.same),
                });
                return;
              }
              if (known) {
                context.report({
                  node,
                  messageId: known.messageId,
                  data: { ...data, ...known.data },
                  ...(known.messageId === "typo"
                    ? suggestionsOf(context, node, parsed.cls, [known.replacement])
                    : sameValueOf(context, node, parsed.cls, known.replacement, known.same)),
                });
                return;
              }
              context.report({
                node,
                messageId: cause,
                data,
                ...suggestionsOf(context, node, parsed.cls, data.replacements),
              });
            },
            {
              // A template or a concatenation that glues a value to a word is one runtime value,
              // reported once here and by no other rule; its fragments are no classes.
              glued: (node, sides) =>
                context.report({
                  node,
                  messageId: "runtime",
                  data: { built: builtClass(node, context.sourceCode, sides) },
                }),
            },
          ),
        ),
    },
    "no-deprecated-token": {
      description: "A deprecated token, with its replacement.",
      fixable: "code",
      messages: {
        deprecated: '"{{cls}}" is deprecated.{{note}}',
        replace: '"{{cls}}" is deprecated; use "{{replacement}}".{{note}}',
        replaceByHand:
          '"{{cls}}" is deprecated; use "{{replacement}}". Replace it by hand; {{reason}}, so no automatic fix is offered.{{note}}',
      },
      create: (context) =>
        forEachOwnClass(context, "no-deprecated-token", ({ data: { entry } }, parsed, node) => {
          const { cls } = parsed;
          // The replacement keeps the class's variants and important modifier, and is written
          // inside the string's own source, so its quotes, entities and line breaks survive. A
          // class this rule owns fails no other rule under its variants (classify), so only a
          // replacement another rule would report is not asked for: the message then names none.
          const replacement =
            entry.replacementClass && withVariants(parsed, entry.replacementClass);
          if (!replacement || closureFailures(replacement).length) {
            context.report({ node, messageId: "deprecated", data: { cls } });
            return;
          }
          const { fix, reason } = classFix(node, context.sourceCode, cls, replacement);
          context.report({
            node,
            ...(fix
              ? { messageId: "replace", data: { cls, replacement } }
              : { messageId: "replaceByHand", data: { cls, replacement, reason } }),
            fix: fix ?? null,
          });
        }),
    },
    "no-deprecated-name": {
      description: "A part that was renamed, with its replacement; one-to-one renames are fixed.",
      fixable: "code",
      messages: {
        renamed: "{{name}} is deprecated; use {{to}}.{{note}}",
        renamedWithDetail: "{{name}} is deprecated; use {{to}} ({{detail}}).{{note}}",
        propValue: '{{part}} {{prop}}="{{value}}" is deprecated; use {{prop}}="{{to}}".{{note}}',
        prop: "{{part}} {{prop}} is deprecated; use {{to}}.{{note}}",
        propRemoved: "{{part}} {{prop}} is deprecated: {{detail}}.{{note}}",
      },
      create(context) {
        // A retired name is judged by what the tag's root is bound to where it is written: an
        // alias or a namespace of the kit, or of the product's shell, is the kit's name
        // (`import { Shell as DsShell }` is still Shell); a local object or another package's part
        // keeps its name as written; a parameter or a local that shadows an outer name is no part.
        const SOURCES = /design-system|\/shell$/;
        const nameOf = (node) => partNameOf(context, node, { sources: SOURCES });
        /** A retired name's report: its replacement, and what else to know when there is more. */
        const renamed = (name, dep) =>
          dep.note
            ? { messageId: "renamedWithDetail", data: { name, to: dep.to, detail: dep.note } }
            : { messageId: "renamed", data: { name, to: dep.to } };
        /** A renamed prop or value on a part imported from the kit, named as the kit names it; the
            import may name a part the public inventory does not list (ChartDonut). The kit's own
            source is read too, on a part imported from its home module, since a part that
            composes another passes the new names; its documentation is not, since a story shows
            the old spelling beside the new while the part still takes it. */
        const kitStory = isKitStoryFile(context);
        const attributes = (node) => {
          if (kitStory) return;
          const part = kitBindingOf(context, node.name);
          const renames = own(deprecatedAttributes, part);
          // In the kit's own source only the part's home module is the part: the chart's private
          // Card, or a local Switch, keeps its own props.
          if (!renames || !isKitHomeBinding(context, node.name, part)) return;
          for (const a of node.attributes) {
            if (a.type !== "JSXAttribute" || typeof a.name.name !== "string") continue;
            const rename = own(renames, a.name.name);
            if (!rename) continue;
            const prop = a.name.name;
            if (rename.values) {
              const value = literalValue(a);
              const to = typeof value === "string" ? own(rename.values, value) : undefined;
              if (!to) continue;
              const target =
                a.value.type === "JSXExpressionContainer" ? a.value.expression : a.value;
              // The new value in the old one's quotes.
              const quote = context.sourceCode.getText(target)[0] === "'" ? "'" : '"';
              context.report({
                node: a,
                messageId: "propValue",
                data: { part, prop, value, to },
                fix: (fixer) => fixer.replaceText(target, `${quote}${to}${quote}`),
              });
            } else if (rename.to) {
              const taken = jsxAttr(node, rename.to);
              context.report({
                node: a.name,
                messageId: "prop",
                data: { part, prop, to: rename.to },
                fix: taken ? null : (fixer) => fixer.replaceText(a.name, rename.to),
              });
            } else
              context.report({
                node: a.name,
                messageId: "propRemoved",
                data: { part, prop, detail: rename.note },
              });
          }
        };
        return {
          ImportDeclaration(node) {
            if (!SOURCES.test(String(node.source.value))) return;
            for (const s of node.specifiers) {
              if (s.type !== "ImportSpecifier") continue;
              // A retired hook or script (useDensity, densityScript) is never JSX, and a removed
              // part may share its name with a local component: report the import.
              const dep = deprecatedNames[s.imported.name];
              if (dep && (dep.removed || !/^[A-Z]/.test(s.imported.name)))
                context.report({ node: s, ...renamed(s.imported.name, dep) });
            }
          },
          JSXOpeningElement(node) {
            const tag = jsxTag(node.name);
            const name = nameOf(node.name);
            attributes(node);
            const dep = deprecatedNames[name];
            if (!dep || dep.removed) return;
            // The fix keeps the local segments that stand for the root (`DsShell` for an alias,
            // `Kit.Shell` for a namespace) and renames what follows. A rename to another root
            // cannot be written that way, and a tag whose root is not the kit's import is only a
            // name that matches, so both are reported without a fix.
            const [root, ...tail] = name.split(".");
            const [toRoot, ...toTail] = dep.to.split(".");
            const local = tag.split(".");
            const renamedTag = [...local.slice(0, local.length - tail.length), ...toTail].join(".");
            context.report({
              node: node.name,
              ...renamed(name, dep),
              fix:
                dep.fix &&
                toRoot === root &&
                kitBindingOf(context, node.name, { sources: SOURCES }) === name
                  ? (fixer) => {
                      const fixes = [fixer.replaceText(node.name, renamedTag)];
                      // A prop whose new name the element already sets keeps its old name, and
                      // is reported on the renamed part until one of the two is removed.
                      for (const a of node.attributes) {
                        const to =
                          a.type === "JSXAttribute" ? own(dep.props, a.name.name) : undefined;
                        if (to && !jsxAttr(node, to)) fixes.push(fixer.replaceText(a.name, to));
                      }
                      if (node.parent.closingElement)
                        fixes.push(fixer.replaceText(node.parent.closingElement.name, renamedTag));
                      return fixes;
                    }
                  : null,
            });
          },
          MemberExpression(node) {
            // Only a member whose own name ends a renamed one can be one; the rest skip the lookup.
            if (!deprecatedMemberEnds.has(node.property.name)) return;
            if (node.parent.type === "MemberExpression" && node.parent.object === node) return;
            const name = nameOf(node);
            const dep = deprecatedNames[name];
            if (dep && !dep.removed) context.report({ node, ...renamed(name, dep) });
          },
        };
      },
    },
    "cell-plain": {
      description:
        "A Table.Cell carries no neutral colour, weight or type token; only a status colour may differ.",
      messages: {
        plain:
          "Table.Cell is one style. Drop {{classes}}; only Badge, Dot, Indicator or a status colour may differ.{{note}}",
        rendered:
          "<{{wrapper}}> renders <Table.Cell>, which is one style. Drop {{classes}}; only Badge, Dot, Indicator or a status colour may differ.{{note}}",
      },
      create: (context) => ({
        JSXOpeningElement(node) {
          // The kit's Table.Cell, however it is imported, or one a render prop puts in its place.
          const owner = classOwnerOf(context, node);
          if (owner.part !== "Table.Cell") return;
          // Its className, through a const, a map, a helper or a spread too (class-sites.js).
          const { at, texts } = elementClasses(context, node);
          const bad = texts.flatMap((s) => s.split(/\s+/)).filter((t) => CELL_FORBIDDEN.test(t));
          if (bad.length)
            context.report({
              node: at,
              ...(owner.via === "render"
                ? {
                    messageId: "rendered",
                    data: { wrapper: owner.wrapper, classes: bad.join(", ") },
                  }
                : { messageId: "plain", data: { classes: bad.join(", ") } }),
            });
        },
      }),
    },
    "id-not-blue": {
      description: "An Id is blue only inside a link or a button.",
      messages: {
        blue: "<{{tag}}> is blue (text-brand) with no link or button around it, and blue means link, so it reads as a link that goes nowhere. Drop text-brand, or make the Id the text of the TextLink that opens its record.{{note}}",
        rendered:
          "<{{wrapper}}> renders <Id> in blue (text-brand) with no link or button around it, and blue means link. Drop text-brand, or make the Id the text of the TextLink that opens its record.{{note}}",
      },
      create: (context) => {
        /** A link or a button: a tag (a, Link, button) or the kit's Button, TextLink, LinkButton or
            LinkIconButton, or an element whose render puts one in its place (a trigger that
            renders a Button holds its children in the Button). */
        const isLink = (opening) =>
          /^(Link|a|button)$/.test(jsxTag(opening.name)) ||
          ["Button", "TextLink", "LinkButton", "LinkIconButton"].includes(
            kitPartOf(context, opening.name),
          );
        const linkOrButton = (opening) => {
          if (isLink(opening)) return true;
          const rendered = renderedElementOf(opening);
          return Boolean(rendered) && isLink(rendered.openingElement);
        };
        return {
          JSXOpeningElement(node) {
            // The kit's Id, however it is imported, or one a render prop puts in its place.
            const owner = classOwnerOf(context, node);
            if (owner.part !== "Id") return;
            // Its className, through a const, a map, a helper or a spread too (class-sites.js).
            const { at, texts } = elementClasses(context, node);
            if (!texts.some((s) => /(^|\s)text-brand(\s|$)/.test(s))) return;
            // From the element itself, so a link or a button that renders the Id is its link.
            for (let p = node.parent; p; p = p.parent)
              if (p.type === "JSXElement" && linkOrButton(p.openingElement)) return;
            context.report({
              node: at,
              ...(owner.via === "render"
                ? { messageId: "rendered", data: { wrapper: owner.wrapper } }
                : { messageId: "blue", data: { tag: jsxTag(node.name) } }),
            });
          },
        };
      },
    },
    "no-kit-shadow": {
      description: "Product code imports kit parts instead of declaring its own.",
      messages: {
        kitPart:
          "{{name}} is a kit part. Import it from @ledger/design-system instead of declaring a local copy.{{note}}",
        legacyName:
          "{{name}} is {{part}} in the kit. Import that instead of declaring a local copy.{{note}}",
      },
      create(context) {
        const check = (id) => {
          if (!id) return;
          if (KIT_PARTS.has(id.name))
            context.report({ node: id, messageId: "kitPart", data: { name: id.name } });
          else if (LEGACY[id.name])
            context.report({
              node: id,
              messageId: "legacyName",
              data: { name: id.name, part: LEGACY[id.name] },
            });
        };
        const topLevel = (n) =>
          n.type === "Program" ||
          n.type === "ExportNamedDeclaration" ||
          n.type === "ExportDefaultDeclaration";
        // `memo(function …)`, `forwardRef(…)` and `React.memo(…)` declare a component too.
        const wrapper = (init) =>
          init?.type === "CallExpression" &&
          /^(React\.)?(memo|forwardRef)$/.test(context.sourceCode.getText(init.callee));
        return {
          FunctionDeclaration(node) {
            if (topLevel(node.parent)) check(node.id);
          },
          ClassDeclaration(node) {
            if (topLevel(node.parent)) check(node.id);
          },
          VariableDeclarator(node) {
            if (
              node.id.type === "Identifier" &&
              node.init &&
              (/FunctionExpression$/.test(node.init.type) || wrapper(node.init)) &&
              node.parent.parent &&
              topLevel(node.parent.parent)
            )
              check(node.id);
          },
        };
      },
    },
    "use-primitives": {
      description:
        "Layout in product code goes through Box, Stack, Inline, Flex and Grid, and their props rather than classes.",
      messages: {
        // `advice` is the part the classes make and its props with their token values, as one
        // sentence (advice.js's layoutAdvice): Inline for a flex row, Stack for a flex column,
        // Grid for a grid, Box for padding.
        element: "<{{tag}}> carries layout classes ({{classes}}). {{advice}}{{note}}",
        primitive: "<{{part}}> carries layout classes ({{classes}}). {{advice}}{{note}}",
        rendered:
          "<{{wrapper}}> renders <{{part}}>, which then carries layout classes ({{classes}}). {{advice}}{{note}}",
      },
      create: (context) => ({
        JSXOpeningElement(node) {
          // Its className, through a const, a map, a helper or a spread too (class-sites.js).
          const { at, texts } = elementClasses(context, node);
          if (!at) return;
          const text = texts.join(" ");
          /** The advice for `found` on `part`, fitted to the message `id` with `data`. */
          const advise = (id, data, part, found, all) =>
            fitted(
              layoutAdvice({
                part,
                classes: found,
                column: all.some(({ base, variants }) => !variants.length && COLUMN.test(base)),
              }),
              (advice) => wordsOf("use-primitives", id, { ...data, advice }),
            );
          if (node.name.type === "JSXIdentifier" && PLAIN_LAYOUT.test(node.name.name)) {
            if (PLAIN_DISPLAY.test(text) || PLAIN_SPACE.test(text)) {
              // The layout classes as written with no variant, a flex column's direction and a
              // grid's template among them, which decide the part.
              const all = classesOf(text);
              const found = all
                .filter(({ variants }) => !variants.length)
                .map((parsed) => ({
                  ...parsed,
                  kind: COLUMN.test(parsed.base) ? "direction" : layoutKind(parsed),
                }))
                .filter(({ kind }) => kind);
              // gap-px alone: a 1px gap is on no space step, so no part's prop takes it.
              const hairlines = found.length
                ? []
                : all.filter(({ cls }) => PLAIN_SPACE.test(cls)).map(({ cls }) => cls);
              const data = {
                tag: node.name.name,
                classes: [...new Set([...found.map(({ cls }) => cls), ...hairlines])].join(", "),
              };
              context.report({
                node,
                messageId: "element",
                data: {
                  ...data,
                  advice: found.length
                    ? advise("element", data, undefined, found, all)
                    : HAIRLINE_GAP_ADVICE,
                },
              });
            }
            return;
          }
          // A primitive's layout is its props, so one prop changes it everywhere (PRM-7). A Grid
          // may follow its container's width through container-query column classes, which
          // templateColumns (keyed to the window) cannot say. The primitive is the kit's, however
          // it is imported, or one a render prop puts in the element's place.
          const owner = classOwnerOf(context, node);
          const { part } = owner;
          if (!PRIMITIVES.has(part)) return;
          const all = classesOf(text);
          const byContainer = all.some(
            ({ base, variants }) =>
              /^grid-(cols|rows)-/.test(base) && variants.some((v) => v.startsWith("@")),
          );
          /** What a class sets that a prop should: padding, gap, display or grid, or nothing. */
          const kindOf = ({ base, variants }) => {
            // A container query (`@3xl:`) is layout the props cannot key, and neither is any other
            // variant of a padding, a gap or a display (`md:px-300`, `hidden @3xl:flex`): the
            // spacing props take one token.
            if (variants.some((v) => v.startsWith("@"))) return undefined;
            if (/^-?(p|px|py|pt|pb|pl|pr|ps|pe)-/.test(base))
              return variants.length ? undefined : "padding";
            if (/^gap(-x|-y)?-/.test(base) && base !== "gap-px")
              return variants.length ? undefined : "gap";
            if (/^(flex|inline-flex|grid|inline-grid)$/.test(base))
              return variants.length ? undefined : "display";
            // templateColumns takes one template per window breakpoint, so `md:grid-cols-3` is a prop.
            return /^grid-(cols|rows)-/.test(base) && !byContainer ? "grid" : undefined;
          };
          const found = all.map((c) => ({ ...c, kind: kindOf(c) })).filter(({ kind }) => kind);
          if (found.length) {
            const messageId = owner.via === "render" ? "rendered" : "primitive";
            const data = {
              ...(owner.via === "render" && { wrapper: owner.wrapper }),
              part,
              classes: [...new Set(found.map(({ cls }) => cls))].join(", "),
            };
            context.report({
              node,
              messageId,
              data: { ...data, advice: advise(messageId, data, part, found, all) },
            });
          }
        },
      }),
    },
  }),
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
          message: "No router dependency. Consumers compose links with Base UI render.",
        },
      ],
    },
  ],
};

const { version } = JSON.parse(fs.readFileSync(path.join(here, "../package.json"), "utf8"));
/** A rule that reads `settings.ledger` as it starts, so a mistake there is said whichever rules a
    config turns on, not only when a class rule runs. */
const readingSettings = (definition) => ({
  ...definition,
  create(context) {
    settings(context);
    return definition.create(context);
  },
});
// Every rule takes an `allow` option, per-file counts of sites that predate it, and a `note` option,
// a sentence its findings end with (report.js).
const plugin = {
  meta: { name: "@ledger/design-system/eslint", version },
  rules: Object.fromEntries(
    Object.entries({
      ...rules,
      ...gateRules,
      ...configRules,
      ...readableRules,
      ...variantRules,
    }).map(([name, definition]) => [name, withAllowance(readingSettings(definition))]),
  ),
  configs: {},
};

/**
 * The kit's own allowances, in test/lint-allow.json: `{ "ledger/rule": { "src/file.tsx": 2 } }`,
 * sites that predate a rule. The list only shrinks (a file with fewer reports than its allowance
 * fails until the number is lowered). The file is not published, so a consumer gets none.
 */
const packageAllowPath = path.join(here, "../test/lint-allow.json");
const packageAllow = fs.existsSync(packageAllowPath)
  ? JSON.parse(fs.readFileSync(packageAllowPath, "utf8"))
  : {};
/** A rule at `severity`, with the kit's allowance for it when there is one. */
const allowing = (name, severity = "error") =>
  packageAllow[name] ? [severity, { allow: packageAllow[name] }] : severity;

/** The package's own code: everything is an error, and nothing outside the package may be imported. */
const packageRules = [
  "ledger/no-arbitrary-value",
  "ledger/no-alpha-token",
  "ledger/no-dark-variant",
  "ledger/no-unknown-variant",
  "ledger/no-margin",
  "ledger/no-static-design-value",
  "ledger/no-non-token-class",
  "ledger/no-deprecated-token",
  "ledger/no-deprecated-name",
  "ledger/readable-classes",
  "ledger/prefer-text-link",
  "ledger/no-colgroup",
  "ledger/button-icon-slot",
  "ledger/no-overlay-autofocus",
  "ledger/no-disabled-while-loading",
  "ledger/overlay-width-preset",
  "ledger/link-button-navigation",
  "ledger/no-style-design-value",
  "ledger/no-raw-colour",
  "ledger/no-inline-config",
];
/** Rules that judge how a screen uses the kit; stories show their mistakes on purpose (Don't). */
const usageRules = [
  "ledger/no-overlay-autofocus",
  "ledger/no-disabled-while-loading",
  "ledger/overlay-width-preset",
  "ledger/link-button-navigation",
  "ledger/no-style-design-value",
];
plugin.configs.package = [
  {
    plugins: { ledger: plugin },
    // The kit's own source: a relative import of a part is the part (identity.js).
    settings: { ledger: { kit: "self" } },
    rules: {
      ...Object.fromEntries(packageRules.map((name) => [name, allowing(name)])),
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
    // Only the documentation tree and story files: a folder named stories elsewhere is kit source.
    files: ["src/stories/**", "**/*.stories.{ts,tsx}"],
    rules: {
      "ledger/no-arbitrary-value": "off",
      "ledger/no-non-token-class": allowing("ledger/no-non-token-class"),
      ...Object.fromEntries(usageRules.map((name) => [name, "off"])),
    },
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
      "ledger/no-unknown-variant": "error",
      "ledger/no-margin": "error",
      "ledger/no-static-design-value": "error",
      "ledger/no-non-token-class": "error",
      "ledger/no-deprecated-token": "error",
      "ledger/no-deprecated-name": "error",
      "ledger/readable-classes": "error",
      "ledger/cell-plain": "error",
      "ledger/id-not-blue": "error",
      "ledger/no-kit-shadow": "error",
      "ledger/prefer-text-link": "error",
      "ledger/no-colgroup": "error",
      "ledger/button-icon-slot": "error",
      "ledger/use-primitives": "warn",
      "ledger/no-native-confirm": "error",
      "ledger/text-link-navigation": "error",
      "ledger/dialog-footer-order": "error",
      "ledger/no-overlay-autofocus": "error",
      "ledger/no-disabled-while-loading": "error",
      "ledger/overlay-width-preset": "error",
      "ledger/no-plain-alert-role": "error",
      "ledger/link-button-navigation": "error",
      "ledger/no-style-design-value": "error",
      "ledger/no-raw-colour": "error",
      "ledger/no-inline-config": "error",
    },
  },
];

export default plugin;
// The data whose words a finding carries, for test/lint-messages.test.mjs, which renders every
// value through its rule. Not part of the plugin's configuration.
export { deprecatedAttributes, deprecatedNames, LEGACY as legacyNames, PRIMITIVES as primitives };
// The names no-deprecated-name's member prefilter lets through, for test/lint-prefilter.test.mjs,
// which turns the prefilter off to show it drops no finding. Not part of the plugin's configuration.
export { deprecatedMemberEnds };
