// ledger/no-deprecated-name: a renamed or removed part, prop or value, fixed where the rename is one
// to one and the tag is bound to the kit's import.
import { KIT, KIT_SETTINGS, STORY, kitImport } from "../lint-helpers.mjs";

const shell = kitImport("Shell");
const parts = kitImport("Card", "Chart", "Item", "Switch", "Tree");
const sidebar = {
  name: "Shell.Sidebar",
  to: "Shell.SideNav",
  detail: "with Header, Body and Footer; the brand moves to Shell.TopNav.Start",
};

export default {
  valid: [
    {
      code: `${shell} <Shell.SideNav><Shell.SideNav.Item>Work</Shell.SideNav.Item></Shell.SideNav>`,
    },
    {
      code: `${parts} <><Switch size="small" /><Card size="medium" /><Chart.Donut centerLabel="75%" /></>`,
    },
    // Local components that share a kit name keep their own props.
    { code: '<Switch size="sm" />' },
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
  ],
};
