// The kit's retired names, which ledger/no-deprecated-name reports with what replaces them: the parts
// that were renamed or removed (deprecatedNames), and the props and values a part renamed
// (deprecatedAttributes). The restyle advice reads the second too, so it never names a retired
// value as the prop to write.

/** Parts that were renamed. `fix` marks a one-to-one rename the rule can apply; `props` renames
    attributes with it. `removed` marks a part that is gone, reported where it is imported, and
    `kitOnly` a part still exported, reported only where its name is bound to the kit's import. */
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
    note: "use multiple, root defaultValue and AccordionItem with explicit stable values; see Guidance/Upgrading, Collapsible",
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
  // A deprecated pattern, still exported for one version: reported where the kit's is used, since
  // a product's own component may share the name.
  ActionBar: {
    to: "PageHeader",
    kitOnly: true,
    note: "the trail in PageHeader.Lead, the verbs in PageHeader.Actions and the state in the Details rail, Shell.Aside; a blocked action is a Button with disabledReason",
  },
};
/** The last segment of every name a member expression can be reported under (`Sidebar` of
    `Shell.Sidebar`, `Tiles`), built once: no-deprecated-name skips any other member before reading
    its source, the costliest step of the costliest ledger rule. */
const deprecatedMemberEnds = new Set(
  Object.entries(deprecatedNames)
    .filter(([, dep]) => !dep.removed)
    .map(([name]) => name.split(".").at(-1)),
);
/** A disclosure's press before `onExpandedChange`: its signature changed, so no fix is one to one. */
const ON_TOGGLE = { note: "use onExpandedChange, which is called with the next state" };
/** shadcn's size words on a part whose sizes are the kit's words. */
const SIZE_WORDS = { __proto__: null, sm: "small", default: "medium", lg: "large" };

/** An element's attribute by name, as written. */
const attributeOf = (element, name) =>
  element.attributes.find((item) => item.type === "JSXAttribute" && item.name.name === name);
/** A figure as text: digits with their separators, a sign and a percent sign, nothing else. */
const FIGURE = /^\s*[+\-−]?[\d.,\s]*\d[\d.,\s]*%?\s*$/;
/** The static text of a template that holds a figure (`${n}%`): signs, separators and a percent
    sign around its holes, and at least one of them. */
const FIGURE_AROUND = /^[\s\d.,%+\-−]*$/;
/** Whether a Chart.Donut's `label` is the words in its middle: beside `name`, which then names the
    ring, or a number, a figure written as text ("75%", `${n}%`) or an element, which no accessible
    name is; never beside `centerLabel`. */
function drawsTheMiddle(element, attribute) {
  if (attributeOf(element, "centerLabel")) return false;
  if (attributeOf(element, "name")) return true;
  let value = attribute.value;
  if (value?.type === "JSXExpressionContainer") value = value.expression;
  if (value?.type === "JSXElement" || value?.type === "JSXFragment") return true;
  if (value?.type === "Literal")
    return (
      typeof value.value === "number" ||
      (typeof value.value === "string" && FIGURE.test(value.value))
    );
  if (value?.type === "TemplateLiteral" && value.expressions.length) {
    const text = value.quasis.map((quasi) => quasi.value.cooked ?? "").join("");
    return text.trim() !== "" && FIGURE_AROUND.test(text);
  }
  return false;
}
/** KeyValue's label width for a number of pixels: the nearest named step (narrow 88, the default
    104, wide 160), split halfway between them. */
const LABEL_WIDTH = {
  pixels: (px) => (px <= 96 ? "narrow" : px < 132 ? "default" : "wide"),
  detail: 'or labelWidth="auto" in a page body',
  examples: ["labelWidth={88}", "labelWidth={120}", "labelWidth={160}"],
};

/**
 * Props and values a part renamed. `to` renames the attribute and `values` renames a literal value,
 * each fixed; with both, a literal value is renamed with its attribute in one fix (`size="sm"` is
 * `width="xsmall"`), and any other value names the new attribute without a fix. A value mapped to
 * `{ note }` has no one-to-one replacement and is reported with what to do instead. `note` alone
 * reports a prop with no one-to-one replacement. `when(element, attribute)` limits a rename to the
 * elements where the old meaning is certain, and `moved` says what the prop now means there.
 * `pixels` maps a number of pixels written as a literal to the named step that replaces it, fixed.
 * `examples` are attributes as written that reach the entry, for test/lint-messages.test.mjs where
 * `prop="x"` does not. Every level is read with names from the source, so none has a prototype:
 * `<Switch toString="x">`, a `size` of "constructor" and a part named `constructor` find no rename.
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
  Toggle: { __proto__: null, size: { values: SIZE_WORDS } },
  ToggleGroup: { __proto__: null, size: { values: SIZE_WORDS } },
  ToggleGroupItem: { __proto__: null, size: { values: SIZE_WORDS } },
  InputGroupButton: {
    __proto__: null,
    size: {
      values: {
        __proto__: null,
        xs: "xsmall",
        sm: "small",
        "icon-xs": { note: 'an icon-only button takes size="xsmall", icon={<Icon />} and a label' },
        "icon-sm": { note: 'an icon-only button takes size="small", icon={<Icon />} and a label' },
      },
    },
  },
  AlertDialogContent: {
    __proto__: null,
    size: { to: "width", values: { __proto__: null, sm: "xsmall", default: "small" } },
  },
  DropdownMenuItem: {
    __proto__: null,
    variant: { values: { __proto__: null, destructive: "danger" } },
  },
  "Item.Group": { __proto__: null, labelledBy: { to: "aria-labelledby" } },
  "Chart.Donut": {
    __proto__: null,
    name: { to: "label" },
    // `label` drew the words in the middle before it named the ring, as it does on every plot. It
    // is read as the middle only where it cannot be the name: beside `name`, or as a number, a
    // figure written as text ("75%") or an element. Any other string is the ring's name, and a
    // value the rule cannot read is left alone.
    label: {
      to: "centerLabel",
      when: drawsTheMiddle,
      moved: { what: "the words in the middle", now: "names the ring" },
      examples: ["label={298}"],
    },
  },
  "Chart.Scatter": { __proto__: null, name: { to: "nameKey" } },
  "Chart.Frame": { __proto__: null, status: { to: "state" } },
  "Chart.Area": {
    __proto__: null,
    baseline: { note: "an Area always starts at zero; remove the prop" },
  },
  "Table.Group": { __proto__: null, open: { to: "expanded" }, onToggle: ON_TOGGLE },
  "Table.Tree": { __proto__: null, onToggle: ON_TOGGLE },
  "Table.Disclosure": { __proto__: null, onToggle: ON_TOGGLE },
  "Tree.Item": { __proto__: null, expanded: { to: "isExpanded" }, onToggle: ON_TOGGLE },
  "Shell.Profile": { __proto__: null, role: { to: "description" } },
  "Editable.Text": { __proto__: null, onChange: { to: "onValueChange" } },
  "Editable.Select": { __proto__: null, onChange: { to: "onValueChange" } },
  // The heading ramp is the titles the kit draws. `small` was both a page title and a section's, so
  // it has no one-to-one size; `medium` (22/28) becomes the page title's 20/26.
  Heading: {
    __proto__: null,
    size: {
      values: {
        __proto__: null,
        large: "display",
        medium: "page",
        xsmall: "overlay",
        small: {
          note: 'a page or record title is size="page" (20/26 semibold, with as="h2" to stay an h2), a section\'s title size="section" (13/18 semibold)',
        },
      },
    },
  },
  KeyValue: { __proto__: null, labelWidth: LABEL_WIDTH },
  "KeyValue.Group": { __proto__: null, labelWidth: LABEL_WIDTH },
  Inspector: {
    __proto__: null,
    groups: {
      note: 'compose the groups as children, each an <Inspector.Group title="…"> around its KeyValue rows',
    },
  },
};
// The same parts under their named exports.
for (const [compound, named] of [
  ["Item.Group", "ItemGroup"],
  ["Chart.Donut", "ChartDonut"],
  ["Chart.Scatter", "ChartScatter"],
  ["Chart.Frame", "ChartFrame"],
  ["Chart.Area", "ChartArea"],
  ["Table.Group", "TableGroup"],
  ["Table.Tree", "TreeCell"],
  ["Table.Disclosure", "DisclosureCell"],
  ["Tree.Item", "TreeItem"],
  ["Shell.Profile", "Profile"],
  ["Editable.Text", "EditableText"],
  ["Editable.Select", "EditableSelect"],
  ["KeyValue.Group", "KeyValueGroup"],
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

/**
 * What a retired prop value is written as now: the value that replaces it one to one, or undefined
 * when it has none (a value with only a note) or is not retired. `Heading size="large"` is
 * "display"; `Heading size="small"` has no one-to-one size.
 */
export function currentValue(part, prop, value) {
  const parts = Object.hasOwn(deprecatedAttributes, part) ? deprecatedAttributes[part] : undefined;
  const rename = parts && Object.hasOwn(parts, prop) ? parts[prop] : undefined;
  if (!rename?.values || !Object.hasOwn(rename.values, value)) return value;
  const to = rename.values[value];
  return typeof to === "string" ? to : undefined;
}

export { deprecatedAttributes, deprecatedMemberEnds, deprecatedNames };
