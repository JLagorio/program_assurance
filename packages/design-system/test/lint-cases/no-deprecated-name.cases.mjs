// ledger/no-deprecated-name: a renamed or removed part, prop or value, fixed where the rename is one
// to one and the tag is bound to the kit's import.
import { KIT, KIT_SETTINGS, STORY, kitImport } from "../lint-helpers.mjs";

const shell = kitImport("Shell");
const parts = kitImport("Card", "Chart", "Item", "Switch", "Tree");
const sized = kitImport("AlertDialogContent", "InputGroupButton", "Toggle", "ToggleGroup");
const onToggle = (part) => ({
  messageId: "propRemoved",
  data: {
    part,
    prop: "onToggle",
    detail: "use onExpandedChange, which is called with the next state",
  },
});
const sidebar = {
  name: "Shell.Sidebar",
  to: "Shell.SideNav",
  detail: "with Header, Body and Footer; the brand moves to Shell.TopNav.Start",
};
const donut = kitImport("Chart", "ChartDonut");
const keyValue = kitImport("KeyValue", "KeyValueGroup");
const heading = kitImport("Heading");
/** The Donut's `label` read as its middle, which is centerLabel now. */
const middle = (part) => ({
  messageId: "propMoved",
  data: {
    part,
    prop: "label",
    to: "centerLabel",
    what: "the words in the middle",
    now: "names the ring",
  },
});
/** A KeyValue label width written in pixels, with the step that replaces it. */
const pixels = (part, written, to) => ({
  messageId: "pixels",
  data: { part, prop: "labelWidth", written, to, detail: 'or labelWidth="auto" in a page body' },
});
const smallHeading =
  'a page or record title is size="page" (20/26 semibold, with as="h2" to stay an h2), a section\'s title size="section" (13/18 semibold)';
const actionBar = {
  name: "ActionBar",
  to: "PageHeader",
  detail:
    "the trail in PageHeader.Lead, the verbs in PageHeader.Actions and the state in the Details rail, Shell.Aside; a blocked action is a Button with disabledReason",
};

export default {
  valid: [
    {
      code: `${shell} <Shell.SideNav><Shell.SideNav.Item>Work</Shell.SideNav.Item></Shell.SideNav>`,
    },
    {
      code: `${parts} <><Switch size="small" /><Card size="medium" /><Chart.Donut centerLabel="75%" /></>`,
    },
    {
      code: `${sized} <><Toggle size="small" /><ToggleGroup size="large" /><InputGroupButton size="xsmall" label="Copy" icon={null} /><AlertDialogContent width="xsmall" /></>`,
    },
    // A Donut's label names the ring, as on every plot: words alone, any label beside
    // centerLabel, or a value the rule cannot read (a name, a template of words) is the name.
    {
      code: `${donut} <><Chart.Donut label="Coverage" /><ChartDonut label="75%" centerLabel={298} /><Chart.Donut label={title} /><Chart.Donut label={\`\${n}\`} /><Chart.Donut label={\`\${n} controls\`} /><Chart.Donut label="2024 audit" /></>`,
    },
    // The heading ramp's sizes, and KeyValue's named label widths; a width the rule cannot read
    // may hold a step already.
    { code: `${heading} <><Heading size="page" /><Heading size="section" as="h2" /></>` },
    {
      code: `${keyValue} <><KeyValue label="Owner" labelWidth="wide">x</KeyValue><KeyValue.Group labelWidth="auto" /><KeyValueGroup labelWidth={width} /></>`,
    },
    { code: `${kitImport("Inspector")} <Inspector label="Details" footer={null} />` },
    // Local components that share a kit name keep their own props.
    { code: '<Switch size="sm" />' },
    { code: "function ActionBar() { return null; } const A = () => <ActionBar />;" },
    { code: '<><KeyValue labelWidth={88} /><Heading size="small" /></>' },
    { code: "function Panel() { return null; } const A = () => <Panel />;" },
    // A parameter that shadows the import is no part at all.
    { code: `${shell} export function Nav(Shell) { return <Shell.Sidebar />; }` },
    // Names from the source are looked up as the map's own: a prop, a value or a part named like
    // Object.prototype's members is no rename.
    { code: `${parts} <><Switch toString="x" /><Switch size="constructor" /></>` },
    { code: 'import * as Kit from "@ledger/design-system"; <Kit.constructor name="x" />' },
    // A kit story shows the old spelling beside the new while the part still takes it, so its
    // props are not read there; the story tree and a story file elsewhere alike.
    {
      code: 'import { Switch } from "../components/switch"; <Switch size="sm" />',
      filename: STORY,
      settings: KIT_SETTINGS,
    },
    {
      code: 'import { Switch } from "./switch"; <Switch size="sm" />',
      filename: KIT.replace(/\.tsx$/, ".stories.tsx"),
      settings: KIT_SETTINGS,
    },
    // Another package's part under the kit's name is judged by the name it imports: Layout.Brand
    // is no renamed part.
    { code: 'import { Layout as Shell } from "other-lib"; <Shell.Brand detail="x" />' },
    // Inside the kit only the part's home module is the part: a private part of a public part's
    // name keeps its own props, declared in the file or imported from a private module (the
    // chart's details card).
    {
      code: 'type Size = "sm" | "default" | "lg"; function Switch({ size }: { size: Size }) { return <span data-size={size} />; } export const Settings = () => <Switch size="default" />;',
      filename: KIT,
      settings: KIT_SETTINGS,
      only: "ts",
    },
    {
      code: 'import { Card } from "./_card"; export const Details = () => <Card size="sm" />;',
      filename: KIT.replace("components/example.tsx", "patterns/chart/_plot.tsx"),
      settings: KIT_SETTINGS,
    },
  ],
  invalid: [
    {
      code: `${shell} <Shell.NavItem>Work</Shell.NavItem>`,
      output: `${shell} <Shell.SideNav.Item>Work</Shell.SideNav.Item>`,
      errors: [
        {
          messageId: "renamed",
          data: { name: "Shell.NavItem", to: "Shell.SideNav.Item" },
          line: 1,
          column: 49,
        },
      ],
    },
    {
      // A rename that moves the part's props carries them with it.
      code: `${shell} <Shell.NavGroup label="Work">x</Shell.NavGroup>`,
      output: `${shell} <Shell.SideNav.Section heading="Work">x</Shell.SideNav.Section>`,
      errors: [
        {
          messageId: "renamedWithDetail",
          data: { name: "Shell.NavGroup", to: "Shell.SideNav.Section", detail: "label is heading" },
        },
      ],
    },
    {
      // An aliased root stays the alias.
      code: 'import { Shell as DsShell } from "@ledger/design-system"; <DsShell.NavItem>x</DsShell.NavItem>;',
      output:
        'import { Shell as DsShell } from "@ledger/design-system"; <DsShell.SideNav.Item>x</DsShell.SideNav.Item>;',
      errors: [{ messageId: "renamed", data: { name: "Shell.NavItem", to: "Shell.SideNav.Item" } }],
    },
    {
      // A rename with no one-to-one replacement is reported without a fix, in JSX and as a value.
      code: `${shell} <Shell.Sidebar />; const Nav = Shell.Sidebar;`,
      output: null,
      errors: [
        { messageId: "renamedWithDetail", data: sidebar, line: 1, column: 49 },
        { messageId: "renamedWithDetail", data: sidebar, line: 1, column: 79 },
      ],
    },
    {
      code: 'import * as Kit from "@ledger/design-system"; <Kit.Shell.Sidebar />',
      output: null,
      errors: [{ messageId: "renamedWithDetail", data: sidebar }],
    },
    {
      // A retired hook and a removed page shape are reported where they are imported.
      code: 'import { Block, useDensity } from "@ledger/design-system";',
      output: null,
      errors: [
        { messageId: "renamed", data: { name: "Block", to: "Section" }, column: 10 },
        {
          messageId: "renamedWithDetail",
          data: {
            name: "useDensity",
            to: "table.options.meta.density",
            detail: "a DataTable's own; the global hook is removed",
          },
          column: 17,
        },
      ],
    },
    {
      // A local object named like the part is reported and never rewritten.
      code: 'import { Shell as Kit } from "@ledger/design-system"; const Shell = { NavItem: () => null }; <Kit.SideNav><Shell.NavItem>Work</Shell.NavItem></Kit.SideNav>;',
      output: null,
      errors: [{ messageId: "renamed", data: { name: "Shell.NavItem", to: "Shell.SideNav.Item" } }],
    },
    {
      // A retired name used as a value, through a namespace.
      code: 'import * as Kit from "@ledger/design-system"; const Nav = Kit.Shell.Sidebar;',
      output: null,
      errors: [{ messageId: "renamedWithDetail", data: sidebar }],
    },
    {
      // Inside the kit, a relative import of the part is the part, and the rename is fixed.
      code: 'import { Shell } from "../layout/shell"; <Shell.NavItem>Work</Shell.NavItem>',
      output:
        'import { Shell } from "../layout/shell"; <Shell.SideNav.Item>Work</Shell.SideNav.Item>',
      filename: KIT,
      settings: KIT_SETTINGS,
      errors: [{ messageId: "renamed", data: { name: "Shell.NavItem", to: "Shell.SideNav.Item" } }],
    },
    {
      // A prop named like Object.prototype's members is left alone by the rename's fix.
      code: `${shell} <Shell.Brand toString="x" detail="y" />`,
      output: `${shell} <Shell.AppLogo toString="x" secondaryName="y" />`,
      errors: [
        {
          messageId: "renamedWithDetail",
          data: { name: "Shell.Brand", to: "Shell.AppLogo", detail: "detail is secondaryName" },
        },
      ],
    },
    {
      code: `${parts} <Switch size="sm" />`,
      output: `${parts} <Switch size="small" />`,
      errors: [
        {
          messageId: "propValue",
          data: { part: "Switch", prop: "size", value: "sm", to: "small" },
        },
      ],
    },
    {
      // The new value keeps the old one's quotes.
      code: `${parts} <Card size={'sm'} />`,
      output: `${parts} <Card size={'small'} />`,
      errors: [
        { messageId: "propValue", data: { part: "Card", prop: "size", value: "sm", to: "small" } },
      ],
    },
    {
      code: `${parts} <><Item.Group labelledBy="h" /><Tree.Item expanded /></>`,
      output: `${parts} <><Item.Group aria-labelledby="h" /><Tree.Item isExpanded /></>`,
      errors: [
        {
          messageId: "prop",
          data: { part: "Item.Group", prop: "labelledBy", to: "aria-labelledby" },
        },
        { messageId: "prop", data: { part: "Tree.Item", prop: "expanded", to: "isExpanded" } },
      ],
    },
    {
      // A renamed prop on a part three levels deep, through a namespace and through an alias.
      code: 'import * as Kit from "@ledger/design-system"; <Kit.Shell.SideNav.Section label="Work">x</Kit.Shell.SideNav.Section>',
      output:
        'import * as Kit from "@ledger/design-system"; <Kit.Shell.SideNav.Section heading="Work">x</Kit.Shell.SideNav.Section>',
      errors: [
        {
          messageId: "prop",
          data: { part: "Shell.SideNav.Section", prop: "label", to: "heading" },
        },
      ],
    },
    {
      code: 'import { Shell as S } from "@ledger/design-system"; <S.SideNav.Section label="Work" />',
      output:
        'import { Shell as S } from "@ledger/design-system"; <S.SideNav.Section heading="Work" />',
      errors: [
        {
          messageId: "prop",
          data: { part: "Shell.SideNav.Section", prop: "label", to: "heading" },
        },
      ],
    },
    {
      // The message names the part as the kit does, not the local alias.
      code: 'import { Switch as Toggle } from "@ledger/design-system"; <Toggle size="sm" />',
      output: 'import { Switch as Toggle } from "@ledger/design-system"; <Toggle size="small" />',
      errors: [
        {
          messageId: "propValue",
          data: { part: "Switch", prop: "size", value: "sm", to: "small" },
        },
      ],
    },
    {
      // An old prop beside the new one is reported and left.
      code: `${shell} <Shell.AppLogo detail="x" secondaryName="y" />`,
      output: null,
      errors: [
        { messageId: "prop", data: { part: "Shell.AppLogo", prop: "detail", to: "secondaryName" } },
      ],
    },
    {
      code: `${parts} <Chart.Area baseline={0} />`,
      output: null,
      errors: [
        {
          messageId: "propRemoved",
          data: {
            part: "Chart.Area",
            prop: "baseline",
            detail: "an Area always starts at zero; remove the prop",
          },
        },
      ],
    },
    {
      // A type parameter named Shell hides no value: the tag is still the kit's Shell.
      code: `${shell} export function A<Shell>() { return <Shell.NavItem />; }`,
      output: `${shell} export function A<Shell>() { return <Shell.SideNav.Item />; }`,
      only: "ts",
      errors: [{ messageId: "renamed" }],
    },
    {
      // The part's home module through a folder's barrel is the part too.
      code: 'import { Card } from "../components"; <Card size="sm" />',
      output: 'import { Card } from "../components"; <Card size="small" />',
      filename: KIT.replace("components/example.tsx", "patterns/example.tsx"),
      settings: KIT_SETTINGS,
      errors: [
        { messageId: "propValue", data: { part: "Card", prop: "size", value: "sm", to: "small" } },
      ],
    },
    {
      // The kit's own source passes the new names to the parts it composes: a renamed value there
      // is reported and fixed.
      code: 'import { SelectTrigger } from "./select"; <SelectTrigger size="sm" />',
      output: 'import { SelectTrigger } from "./select"; <SelectTrigger size="small" />',
      filename: KIT,
      settings: KIT_SETTINGS,
      errors: [
        {
          messageId: "propValue",
          data: { part: "SelectTrigger", prop: "size", value: "sm", to: "small" },
        },
      ],
    },
    {
      // Toggle and ToggleGroup take the kit's size words; shadcn's are renamed.
      code: `${sized} <><Toggle size="sm" /><ToggleGroup size="lg" /></>`,
      output: `${sized} <><Toggle size="small" /><ToggleGroup size="large" /></>`,
      errors: [
        {
          messageId: "propValue",
          data: { part: "Toggle", prop: "size", value: "sm", to: "small" },
        },
        {
          messageId: "propValue",
          data: { part: "ToggleGroup", prop: "size", value: "lg", to: "large" },
        },
      ],
    },
    {
      // A value with no one-to-one replacement says what to write, without a fix.
      code: `${sized} <><InputGroupButton size="xs" /><InputGroupButton size="icon-sm" /></>`,
      output: `${sized} <><InputGroupButton size="xsmall" /><InputGroupButton size="icon-sm" /></>`,
      errors: [
        {
          messageId: "propValue",
          data: { part: "InputGroupButton", prop: "size", value: "xs", to: "xsmall" },
        },
        {
          messageId: "valueRemoved",
          data: {
            part: "InputGroupButton",
            prop: "size",
            value: "icon-sm",
            detail: 'an icon-only button takes size="small", icon={<Icon />} and a label',
          },
        },
      ],
    },
    {
      // A prop renamed with its values: the attribute and the value change in one fix.
      code: `${sized} <AlertDialogContent size="sm" />`,
      output: `${sized} <AlertDialogContent width="xsmall" />`,
      errors: [
        {
          messageId: "propAndValue",
          data: {
            part: "AlertDialogContent",
            prop: "size",
            value: "sm",
            to: "width",
            toValue: "xsmall",
          },
        },
      ],
    },
    {
      // The old attribute beside the new one, and a value the lint cannot read, name the new
      // attribute without a fix.
      code: `${sized} <><AlertDialogContent size="default" width="medium" /><AlertDialogContent size={size} /></>`,
      output: null,
      errors: [
        {
          messageId: "propAndValue",
          data: {
            part: "AlertDialogContent",
            prop: "size",
            value: "default",
            to: "width",
            toValue: "small",
          },
        },
        { messageId: "prop", data: { part: "AlertDialogContent", prop: "size", to: "width" } },
      ],
    },
    {
      // A disclosure's onToggle became onExpandedChange, which takes the next state: no fix.
      code: 'import { Table, Tree } from "@ledger/design-system"; <><Table.Group open onToggle={t} title="Open" colSpan={3} /><Table.Tree onToggle={t} /><Table.Disclosure onToggle={t} /><Tree.Item onToggle={t} /></>',
      output:
        'import { Table, Tree } from "@ledger/design-system"; <><Table.Group expanded onToggle={t} title="Open" colSpan={3} /><Table.Tree onToggle={t} /><Table.Disclosure onToggle={t} /><Tree.Item onToggle={t} /></>',
      errors: [
        { messageId: "prop", data: { part: "Table.Group", prop: "open", to: "expanded" } },
        onToggle("Table.Group"),
        onToggle("Table.Tree"),
        onToggle("Table.Disclosure"),
        onToggle("Tree.Item"),
      ],
    },
    {
      // Editable's change callback is onValueChange, as on the kit's other value parts.
      code: 'import { Editable, EditableSelect } from "@ledger/design-system"; <><Editable.Text label="Owner" value={v} onChange={set} save={s} /><EditableSelect label="Status" value={v} options={o} onChange={set} save={s} /></>',
      output:
        'import { Editable, EditableSelect } from "@ledger/design-system"; <><Editable.Text label="Owner" value={v} onValueChange={set} save={s} /><EditableSelect label="Status" value={v} options={o} onValueChange={set} save={s} /></>',
      errors: [
        {
          messageId: "prop",
          data: { part: "Editable.Text", prop: "onChange", to: "onValueChange" },
        },
        {
          messageId: "prop",
          data: { part: "EditableSelect", prop: "onChange", to: "onValueChange" },
        },
      ],
    },
    {
      // The removed layout parts, each with what replaces it, where they are imported.
      code: 'import { IndexPage, ShowPage, RecordHeader, PreviewRail, PreviewSplit, Panel } from "@ledger/design-system";',
      output: null,
      errors: [
        {
          messageId: "renamedWithDetail",
          data: {
            name: "IndexPage",
            to: "PageHeader over a DataTable with fill",
            detail: "a register is one PageHeader and a frameless DataTable",
          },
        },
        {
          messageId: "renamedWithDetail",
          data: {
            name: "ShowPage",
            to: "PageHeader, Section and Shell.Aside",
            detail: "a record page: PageHeader, Section bodies and the Details rail in Shell.Aside",
          },
        },
        {
          messageId: "renamedWithDetail",
          data: {
            name: "RecordHeader",
            to: "PageHeader",
            detail:
              "the trail in PageHeader.Lead, the name in PageHeader.Title, actions in PageHeader.Actions",
          },
        },
        { messageId: "renamed", data: { name: "PreviewRail", to: "Shell.Aside" } },
        {
          messageId: "renamedWithDetail",
          data: {
            name: "PreviewSplit",
            to: "Shell.Panel",
            detail: "the preview is the Shell's panel area",
          },
        },
        {
          messageId: "renamedWithDetail",
          data: { name: "Panel", to: "Shell.Panel", detail: "the panel is an area of the Shell" },
        },
      ],
    },
    {
      // ActionBar is deprecated for one version: reported where it is used, never rewritten, as a
      // tag and as a value.
      code: 'import { ActionBar } from "@ledger/design-system"; import * as Kit from "@ledger/design-system"; <ActionBar id="REQ-1" title="Access" states={[]} />; const Bar = Kit.ActionBar;',
      output: null,
      errors: [
        { messageId: "renamedWithDetail", data: actionBar },
        { messageId: "renamedWithDetail", data: actionBar },
      ],
    },
    {
      // The heading ramp's sizes: three renamed one to one, and small, which was a page title and
      // a section's, says which to choose.
      code: `${heading} <><Heading size="large" /><Heading size="medium" /><Heading size="xsmall" as="h2" /><Heading size="small" /></>`,
      output: `${heading} <><Heading size="display" /><Heading size="page" /><Heading size="overlay" as="h2" /><Heading size="small" /></>`,
      errors: [
        {
          messageId: "propValue",
          data: { part: "Heading", prop: "size", value: "large", to: "display" },
        },
        {
          messageId: "propValue",
          data: { part: "Heading", prop: "size", value: "medium", to: "page" },
        },
        {
          messageId: "propValue",
          data: { part: "Heading", prop: "size", value: "xsmall", to: "overlay" },
        },
        {
          messageId: "valueRemoved",
          data: { part: "Heading", prop: "size", value: "small", detail: smallHeading },
        },
      ],
    },
    {
      // A label width in pixels is the nearest named step: up to 96 narrow, under 132 the default,
      // from 132 wide; a number under a condition is fixed where it is written.
      code: `${keyValue} <><KeyValue label="Owner" labelWidth={88}>x</KeyValue><KeyValue.Group labelWidth={120} /><KeyValueGroup labelWidth={long ? 160 : undefined} /><KeyValue.Group labelWidth={width ?? 132} /></>`,
      output: `${keyValue} <><KeyValue label="Owner" labelWidth="narrow">x</KeyValue><KeyValue.Group labelWidth="default" /><KeyValueGroup labelWidth={long ? "wide" : undefined} /><KeyValue.Group labelWidth={width ?? "wide"} /></>`,
      errors: [
        pixels("KeyValue", "{88}", "narrow"),
        pixels("KeyValue.Group", "{120}", "default"),
        pixels("KeyValueGroup", "{long ? 160 : undefined}", "wide"),
        pixels("KeyValue.Group", "{width ?? 132}", "wide"),
      ],
    },
    {
      code: `${keyValue} <KeyValue label="Owner" labelWidth={96 as const}>x</KeyValue>`,
      output: `${keyValue} <KeyValue label="Owner" labelWidth="narrow">x</KeyValue>`,
      only: "ts",
      errors: [pixels("KeyValue", "{96 as const}", "narrow")],
    },
    {
      // Inspector's groups prop is composition now.
      code: `${kitImport("Inspector")} <Inspector label="Details" groups={groups} />`,
      output: null,
      errors: [
        {
          messageId: "propRemoved",
          data: {
            part: "Inspector",
            prop: "groups",
            detail:
              'compose the groups as children, each an <Inspector.Group title="…"> around its KeyValue rows',
          },
        },
      ],
    },
    {
      // A Donut's name is its label, as on every plot; a label that is a number or an element is
      // the middle, centerLabel.
      code: `${donut} <><Chart.Donut name="Coverage" /><Chart.Donut label={298} /><ChartDonut label={<b>64%</b>} /></>`,
      output: `${donut} <><Chart.Donut label="Coverage" /><Chart.Donut centerLabel={298} /><ChartDonut centerLabel={<b>64%</b>} /></>`,
      errors: [
        { messageId: "prop", data: { part: "Chart.Donut", prop: "name", to: "label" } },
        middle("Chart.Donut"),
        middle("ChartDonut"),
      ],
    },
    {
      // A figure written as text is no accessible name: the middle, in a string or a template.
      code: `${donut} <><Chart.Donut label="75%" /><ChartDonut label={"1,204"} /><Chart.Donut label={\`\${n}%\`} /></>`,
      output: `${donut} <><Chart.Donut centerLabel="75%" /><ChartDonut centerLabel={"1,204"} /><Chart.Donut centerLabel={\`\${n}%\`} /></>`,
      errors: [middle("Chart.Donut"), middle("ChartDonut"), middle("Chart.Donut")],
    },
    {
      // Beside name, a label is the middle: it moves first, and name takes its place on the next
      // pass. Beside centerLabel, name alone is reported, and left while label is taken.
      code: `${donut} <><Chart.Donut label="64%" name="Coverage" /><Chart.Donut label="Coverage" name="Ring" centerLabel="64%" /></>`,
      output: `${donut} <><Chart.Donut centerLabel="64%" name="Coverage" /><Chart.Donut label="Coverage" name="Ring" centerLabel="64%" /></>`,
      errors: [
        middle("Chart.Donut"),
        { messageId: "prop", data: { part: "Chart.Donut", prop: "name", to: "label" } },
        { messageId: "prop", data: { part: "Chart.Donut", prop: "name", to: "label" } },
      ],
    },
    {
      // Profile's role was the person's job title, not an ARIA role.
      code: `${shell} <Shell.Profile avatar={null} name="Priya" role="Assessor" />`,
      output: `${shell} <Shell.Profile avatar={null} name="Priya" description="Assessor" />`,
      errors: [
        { messageId: "prop", data: { part: "Shell.Profile", prop: "role", to: "description" } },
      ],
    },
  ],
};
