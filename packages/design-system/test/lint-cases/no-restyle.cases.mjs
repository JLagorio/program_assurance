// ledger/no-restyle: a class on a kit part does not change what the part sets itself, and no class
// in a product file styles the elements inside the one it is on.
import { KIT, KIT_SETTINGS, kitImport } from "../lint-helpers.mjs";
import { readFileSync } from "node:fs";

// Where a part sets what it owns, as the rule reports it: read from the parts.json that
// `npm run build:lint` writes from the source, so a case follows an edit to the part's file.
const { parts } = JSON.parse(
  readFileSync(new URL("../../eslint-plugin/parts.json", import.meta.url), "utf8"),
);
const at = (part) => `${parts[part].file}:${parts[part].line}`;

const useProp = (output) => ({ messageId: "useProp", output });

export default {
  valid: [
    // A part owns only what it sets itself: layout and motion a Stack does not set are the
    // caller's, and so is a border on it (decision 7).
    {
      code: `${kitImport("Stack")} <Stack space="space.200" className="animate-rise max-w-layout-measure min-w-0">x</Stack>`,
    },
    { code: `${kitImport("Stack")} <Stack className="border-t border-default">x</Stack>` },
    // RadioGroup sets its gap, not its dividers.
    { code: `${kitImport("RadioGroup")} <RadioGroup className="divide-y">x</RadioGroup>` },
    // Id's className contract takes colour and type, and break-all (@accepts).
    { code: `${kitImport("Id")} <Id className="text-subtle break-all">X-1</Id>` },
    // A field whose className takes layout takes any layout.
    {
      code: `${kitImport("DatePicker")} <DatePicker aria-label="Due" className="w-full md:max-w-layout-measure" />`,
    },
    // A focus target may drop and redraw its own outline.
    {
      code: `${kitImport("TabsContent")} <TabsContent value="a" tabIndex={-1} className="outline-hidden">x</TabsContent>`,
    },
    {
      code: `${kitImport("Section")} export const A = ({ h }) => <Section.Title ref={h} tabIndex={-1} className="outline-none">Step</Section.Title>;`,
    },
    // Hiding a part, and layout at a container size, stay the caller's.
    { code: `${kitImport("Text")} <Text className="hidden @3xl:block">x</Text>` },
    { code: `${kitImport("Button")} <Button className="md:w-full">Save</Button>` },
    { code: `${kitImport("Attachment")} <Attachment className="w-full" />` },
    // A prop sets its classes in the states it names: a hover no prop sets is the caller's.
    { code: `${kitImport("Text")} <Text className="hover:text-subtle md:tabular-nums">x</Text>` },
    {
      code: `${kitImport("Box")} <Box backgroundColor="elevation.surface" className="hover:bg-surface-hovered">x</Box>`,
    },
    // A layout class the part sets through a prop that sets several things (Stack's grow).
    { code: `${kitImport("Stack")} <Stack className="flex-1 min-h-0">x</Stack>` },
    // A primitive's padding, gap and display are use-primitives' to judge, with or without a
    // variant, and a Table.Cell's type cell-plain's; a class rule's class is that rule's.
    { code: `${kitImport("Stack")} <Stack className="pt-200 md:gap-300">x</Stack>` },
    { code: `${kitImport("Table")} <Table.Cell className="font-semibold">x</Table.Cell>` },
    { code: `${kitImport("Text")} <Text className="text-red-500 mt-200">x</Text>` },
    // A status colour in a cell is data.
    {
      code: `${kitImport("Badge", "defineColumns")} const columns = defineColumns((c) => [c.custom("state", { cell: (row) => <Badge className="max-w-full">{row.state}</Badge> })]);`,
    },
    // A state of the element itself reaches nothing inside it.
    {
      code: '<div className="hover:bg-neutral-hovered group-hover:flex [&[hidden]]:hidden has-[>svg]:gap-100" />',
    },
    // Not the kit's part: a local look-alike, another package's part, a parameter.
    { code: 'const Text = (props) => <span {...props} />; <Text className="tabular-nums" />;' },
    { code: 'import { Text } from "other-kit"; <Text className="tabular-nums" />;' },
    {
      code: `${kitImport("Text")} export function A(Text) { return <Text className="tabular-nums" />; }`,
    },
    // A render function that does not hand its props on leaves the classes with the element.
    { code: `${kitImport("Text")} <Slot render={(item) => <Text />} className="tabular-nums" />` },
    // JSX keeps the className written last: a spread's before it never lands.
    {
      code: `${kitImport("Text")} const props = { className: "tabular-nums" }; <Text {...props} className="min-w-0">1</Text>`,
    },
    // Never on the kit's own source, where patterns compose components by design.
    {
      code: 'import { Text } from "../primitives/text"; <Text className="tabular-nums" />;',
      filename: KIT,
      settings: KIT_SETTINGS,
    },
    // A component of this file whose rest no longer carries className hands it on to nothing.
    {
      code: `${kitImport("TabsContent")} function Pad({ className, ...rest }) { return <TabsContent value="a" {...rest} />; } export const A = () => <Pad className="pt-200" />;`,
    },
    // An interaction state the prop does not set is the caller's, and so is placement at a width
    // or a container size.
    {
      code: `${kitImport("Text")} <Text color="color.text.subtle" className="hover:text-default aria-expanded:text-default data-[state=open]:text-default group-hover:text-default">x</Text>`,
    },
    { code: `${kitImport("Button")} <Button className="@3xl:w-full lg:min-w-0">Save</Button>` },
    // A flag's or a given prop's classes are set only where the element writes it, and a state
    // (isLoading) is no style.
    { code: `${kitImport("Button")} <Button className="cursor-default">Save</Button>` },
    { code: `${kitImport("Prose")} <Prose className="pt-200">x</Prose>` },
    // What a part makes from a prop that is not written and has no value then (Box's text on a
    // bold backgroundColor) is not set.
    { code: `${kitImport("Box")} <Box className="text-subtle">x</Box>` },
    // A layout primitive's children are the caller's, a part's placement too, and a selector
    // that names a tag misses a part that does not draw it.
    {
      code: `${kitImport("Grid")} <Grid columns="2" className="*:min-w-0"><div>a</div><div>b</div></Grid>`,
    },
    {
      code: `${kitImport("Button", "Inline")} <Inline space="space.100" className="*:flex-1"><Button>a</Button><Button>b</Button></Inline>`,
    },
    {
      code: `${kitImport("Badge")} <ul className="[&>li]:py-100"><li>a</li><li>b <Badge>x</Badge></li></ul>`,
    },
    {
      code: `${kitImport("Text")} <span className="[&_svg]:size-200"><svg /><Text>x</Text></span>`,
    },
  ],
  invalid: [
    {
      // A class the part's root sets: RadioGroup's gap (decision 7).
      code: `${kitImport("RadioGroup")} <RadioGroup className="gap-0 divide-y">x</RadioGroup>`,
      errors: [
        {
          messageId: "own",
          data: {
            cls: "gap-0",
            on: "<RadioGroup>",
            what: "gap",
            own: "gap-100",
            at: at("RadioGroup"),
            family: "RadioGroup",
          },
        },
      ],
    },
    {
      // The space under a tab strip is the kit's (decision 6).
      code: `${kitImport("Tabs", "TabsContent")} <Tabs className="gap-150"><TabsContent value="a" className="pt-200">x</TabsContent></Tabs>`,
      errors: [{ messageId: "own" }, { messageId: "own" }],
    },
    {
      // A prop's one class: the suggestion writes the prop, which renders the same.
      code: `${kitImport("Text")} <Text className="tabular-nums">12</Text>`,
      errors: [
        {
          messageId: "prop",
          data: { cls: "tabular-nums", on: "<Text>", prop: "numeric", written: "numeric" },
          suggestions: [useProp(`${kitImport("Text")} <Text numeric>12</Text>`)],
        },
      ],
    },
    {
      code: `${kitImport("Text")} <Text color="color.text.subtle" className="shrink-0 tabular-nums">a.</Text>`,
      errors: [
        {
          messageId: "prop",
          suggestions: [
            useProp(
              `${kitImport("Text")} <Text color="color.text.subtle" numeric className="shrink-0">a.</Text>`,
            ),
          ],
        },
      ],
    },
    {
      code: `${kitImport("Text")} <Text className="text-subtle">x</Text>`,
      errors: [
        {
          messageId: "prop",
          data: {
            cls: "text-subtle",
            on: "<Text>",
            prop: "color",
            written: 'color="color.text.subtle"',
          },
          suggestions: [useProp(`${kitImport("Text")} <Text color="color.text.subtle">x</Text>`)],
        },
      ],
    },
    {
      code: `${kitImport("Table")} <Table.Header className="text-end">Due</Table.Header>`,
      errors: [
        {
          messageId: "prop",
          data: { cls: "text-end", on: "<Table.Header>", prop: "align", written: 'align="end"' },
          suggestions: [
            useProp(`${kitImport("Table")} <Table.Header align="end">Due</Table.Header>`),
          ],
        },
      ],
    },
    {
      // A layout class is a prop's only where the prop sets nothing else.
      code: `${kitImport("Button")} <Button className="w-full">Save</Button>`,
      errors: [
        {
          messageId: "prop",
          data: { cls: "w-full", on: "<Button>", prop: "isFullWidth", written: "isFullWidth" },
          suggestions: [useProp(`${kitImport("Button")} <Button isFullWidth>Save</Button>`)],
        },
      ],
    },
    {
      // A type the part sets through a prop, which is another primitive's value, named by its
      // current value alone: Heading's retired sizes that draw the same class are named by the
      // value that replaces them (xsmall is overlay, medium is page) or, with no one-to-one
      // replacement (small), not at all.
      code: `${kitImport("Text")} <><Text className="font-heading-overlay">Plan</Text><Text className="font-heading-page">Plan</Text></>`,
      errors: [
        {
          messageId: "propKey",
          data: {
            cls: "font-heading-overlay",
            on: "<Text>",
            what: "type",
            prop: "size",
            advice: 'Drop it; "font-heading-overlay" is Heading size="overlay".',
          },
        },
        {
          messageId: "propKey",
          data: {
            cls: "font-heading-page",
            on: "<Text>",
            what: "type",
            prop: "size",
            advice: 'Drop it; "font-heading-page" is Heading size="page".',
          },
        },
      ],
    },
    {
      // A className contract takes what it names and nothing else (@accepts layout).
      code: `${kitImport("DatePicker", "Id")} <><DatePicker aria-label="Due" className="pt-200 w-full" /><Id className="pt-050">X-1</Id></>`,
      errors: [
        {
          messageId: "contract",
          data: { cls: "pt-200", on: "<DatePicker>", takes: "layout", family: "DatePicker" },
        },
        {
          messageId: "contract",
          data: { cls: "pt-050", on: "<Id>", takes: "colour, type and break-all", family: "Id" },
        },
      ],
    },
    {
      // Box's background sets its text colour too, so the class is not all the prop does.
      code: `${kitImport("Box")} <Box className="bg-surface-raised">x</Box>`,
      errors: [
        {
          messageId: "propKey",
          data: {
            cls: "bg-surface-raised",
            on: "<Box>",
            what: "background",
            prop: "backgroundColor",
            advice: 'Drop it; it is what backgroundColor="elevation.surface.raised" sets.',
          },
        },
      ],
    },
    {
      // What a part makes from several props counts where one of them is written.
      code: `${kitImport("Box")} <Box backgroundColor="color.background.brand.bold" className="text-subtle">x</Box>`,
      errors: [{ messageId: "derived" }],
    },
    {
      // Inside a column's cell renderer: cells are one style.
      code: `${kitImport("Stack", "defineColumns")} const columns = defineColumns((c) => [c.custom("baseline", { cell: (row) => <Stack as="span" space="space.0" className="min-w-0 font-body-small">{row.title}</Stack> })]);`,
      errors: [
        {
          messageId: "cell",
          data: { cls: "font-body-small", on: "<Stack>" },
        },
      ],
    },
    {
      // A Table.Cell around the element, and a builder typed ColumnKinds.
      code: `${kitImport("Inline", "Table")} <Table.Cell><Inline className="text-subtle">x</Inline></Table.Cell>`,
      errors: [{ messageId: "cell", data: { cls: "text-subtle", on: "<Inline>" } }],
    },
    {
      code: `import { Inline, type ColumnKinds } from "@ledger/design-system"; export const name = (c: ColumnKinds<{ n: string }>) => c.custom("n", { cell: (row) => <Inline className="font-semibold">{row.n}</Inline> });`,
      only: "ts",
      errors: [{ messageId: "cell", data: { cls: "font-semibold", on: "<Inline>" } }],
    },
    {
      // The type a part sets itself; a focus target's outline still passes.
      code: `${kitImport("Section")} export const A = ({ h }) => <Section.Title ref={h} tabIndex={-1} className="font-heading-overlay outline-none">Step</Section.Title>;`,
      errors: [{ messageId: "own" }],
    },
    {
      // Without tabIndex={-1} the outline is the part's.
      code: `${kitImport("TabsContent")} <TabsContent value="a" className="outline-hidden">x</TabsContent>`,
      errors: [{ messageId: "own" }],
    },
    {
      // A variant reaches into the parts inside, on any element of a product file.
      code: `${kitImport("Button")} export const A = () => <div className="[&_button]:bg-danger-bold *:p-200"><Button>Save</Button></div>;`,
      errors: [
        { messageId: "descendant", data: { cls: "[&_button]:bg-danger-bold", part: "Button" } },
        { messageId: "descendant", data: { cls: "*:p-200", part: "Button" } },
      ],
    },
    {
      code: `${kitImport("Button")} const reach = "[&>svg]:icon-subtle"; export const A = () => <Button className={reach}>Save</Button>;`,
      errors: [{ messageId: "descendant", data: { cls: "[&>svg]:icon-subtle", part: "Button" } }],
    },
    {
      // A part a render prop puts in the element's place owns the classes; no suggestion there.
      code: `${kitImport("DialogTrigger", "Button")} <DialogTrigger render={<Button />} className="w-full" />`,
      errors: [
        {
          messageId: "prop",
          data: {
            cls: "w-full",
            on: "the <Button> <DialogTrigger> renders",
            prop: "isFullWidth",
            written: "isFullWidth",
          },
        },
      ],
    },
    {
      // Read however the class reaches the part: a const, a namespace, an important modifier.
      code: `import * as L from "@ledger/design-system"; const numbers = "tabular-nums"; <><L.Text className={numbers}>1</L.Text><L.Text className="tabular-nums!">2</L.Text></>`,
      errors: [{ messageId: "prop" }, { messageId: "prop" }],
    },
    {
      // A colour the prop does not take: the prop is still where the colour is set.
      code: `${kitImport("Heading")} <Heading className="text-subtle">Plan</Heading>`,
      errors: [
        {
          messageId: "propKey",
          data: {
            cls: "text-subtle",
            on: "<Heading>",
            what: "text colour",
            prop: "color",
            advice: "Drop it and set color.",
          },
        },
      ],
    },
    {
      // A component of this file that hands its className on to a part.
      code: `${kitImport("TabsContent")} function Pad({ className }) { return <TabsContent value="a" className={className} />; } export const A = () => <Pad className="pt-200" />;`,
      errors: [
        {
          messageId: "own",
          data: {
            cls: "pt-200",
            on: "<Pad>, which forwards className to <TabsContent>,",
            what: "padding",
            own: "pt-150",
            at: at("TabsContent"),
            family: "Tabs",
          },
        },
      ],
    },
    {
      // A width, a media condition and a variant that always holds on the part are no state: a
      // colour under them changes what the prop sets.
      code: `${kitImport("Button")} <Button className="sm:bg-danger-bold data-[slot=button]:bg-danger-bold [&]:bg-danger-bold motion-safe:bg-danger-bold not-hover:bg-danger-bold">Save</Button>`,
      errors: [
        "sm:bg-danger-bold",
        "data-[slot=button]:bg-danger-bold",
        "[&]:bg-danger-bold",
        "motion-safe:bg-danger-bold",
        "not-hover:bg-danger-bold",
      ].map((cls) => ({
        messageId: "propKey",
        data: {
          cls,
          on: "<Button>",
          what: "background",
          prop: "variant",
          advice: "Drop it; a different background is a change to Button.",
        },
      })),
    },
    {
      code: `${kitImport("Heading", "Text")} <><Text className="min-[0px]:font-semibold not-print:text-danger">x</Text><Heading size="page" className="sm:font-heading-display">y</Heading></>`,
      errors: [
        {
          messageId: "propKey",
          data: {
            cls: "min-[0px]:font-semibold",
            on: "<Text>",
            what: "weight",
            prop: "weight",
            advice: "Drop it; a different weight is a change to Text.",
          },
        },
        {
          messageId: "propKey",
          data: {
            cls: "not-print:text-danger",
            on: "<Text>",
            what: "text colour",
            prop: "color",
            advice: "Drop it; a different text colour is a change to Text.",
          },
        },
        {
          messageId: "propKey",
          data: {
            cls: "sm:font-heading-display",
            on: "<Heading>",
            what: "type",
            prop: "size",
            advice: "Drop it; a different type is a change to Heading.",
          },
        },
      ],
    },
    {
      // What a part makes from several props it sets with none of them written: Alert's neutral
      // tone, Badge's brand bold fill, Avatar's and Prose's default size.
      code: `${kitImport("Alert", "Avatar", "Badge", "Prose")} <><Alert className="bg-danger">x</Alert><Badge className="bg-danger-bold">x</Badge><Avatar name="A" className="font-heading-page" /><Prose className="font-body-large">x</Prose><Badge tone="danger" className="sm:bg-success-bold">x</Badge></>`,
      errors: [
        {
          messageId: "derived",
          data: {
            cls: "bg-danger",
            on: "<Alert>",
            what: "background",
            props: "tone and variant",
            at: at("Alert"),
            family: "Alert",
          },
        },
        {
          messageId: "derived",
          data: {
            cls: "bg-danger-bold",
            on: "<Badge>",
            what: "background",
            props: "appearance and tone and variant",
            at: at("Badge"),
            family: "Badge",
          },
        },
        {
          messageId: "derived",
          data: {
            cls: "font-heading-page",
            on: "<Avatar>",
            what: "type",
            props: "size",
            at: at("Avatar"),
            family: "Avatar",
          },
        },
        {
          messageId: "derived",
          data: {
            cls: "font-body-large",
            on: "<Prose>",
            what: "type",
            props: "size",
            at: at("Prose"),
            family: "Prose",
          },
        },
        {
          messageId: "derived",
          data: {
            cls: "sm:bg-success-bold",
            on: "<Badge>",
            what: "background",
            props: "appearance and tone and variant",
            at: at("Badge"),
            family: "Badge",
          },
        },
      ],
    },
    {
      // A class the part already sets, in the same states, changes nothing.
      code: `${kitImport("Badge", "Card")} <><Card className="rounded-large">x</Card><Badge className="text-inverse">x</Badge></>`,
      errors: [
        {
          messageId: "repeats",
          data: { cls: "rounded-large", on: "<Card>", at: at("Card") },
        },
        {
          messageId: "repeats",
          data: { cls: "text-inverse", on: "<Badge>", at: at("Badge") },
        },
      ],
    },
    {
      // Beside the prop it changes, the advice is the part, not the prop.
      code: `${kitImport("Prose")} <Prose label="Notes" className="pt-200">x</Prose>`,
      errors: [
        {
          messageId: "propKey",
          data: {
            cls: "pt-200",
            on: "<Prose>",
            what: "padding",
            prop: "label",
            advice: "Drop it; a different padding is a change to Prose.",
          },
        },
      ],
    },
    {
      // A part's interaction, transforms, text flow and overflow are its own, not its placement.
      code: `${kitImport("Badge", "Button", "Text")} <><Button className="select-text whitespace-normal disabled:pointer-events-auto">x</Button><Badge className="overflow-visible">x</Badge><Text className="line-clamp-2 truncate">x</Text></>`,
      errors: [
        {
          messageId: "own",
          data: {
            cls: "select-text",
            on: "<Button>",
            what: "text selection",
            own: "select-none",
            at: at("Button"),
            family: "Button",
          },
        },
        {
          messageId: "own",
          data: {
            cls: "whitespace-normal",
            on: "<Button>",
            what: "wrapping",
            own: "whitespace-nowrap",
            at: at("Button"),
            family: "Button",
          },
        },
        {
          messageId: "own",
          data: {
            cls: "disabled:pointer-events-auto",
            on: "<Button>",
            what: "pointer behaviour",
            own: "disabled:pointer-events-none",
            at: at("Button"),
            family: "Button",
          },
        },
        { messageId: "own" },
        {
          messageId: "propKey",
          data: {
            cls: "line-clamp-2",
            on: "<Text>",
            what: "wrapping",
            prop: "maxLines",
            advice: "Drop it; it is what maxLines={2} sets.",
          },
        },
        {
          messageId: "propKey",
          data: {
            cls: "truncate",
            on: "<Text>",
            what: "wrapping",
            prop: "maxLines",
            advice: "Drop it and set maxLines.",
          },
        },
      ],
    },
    {
      // A state or an attribute of the element before the step inside still reaches inside.
      code: `${kitImport("Button")} <Button className="[&:hover_svg]:text-brand [&[data-state=open]>svg]:rotate-180 [:where(&)_svg]:text-brand [&:not(:disabled)_svg]:text-brand">Save</Button>`,
      errors: [
        "[&:hover_svg]:text-brand",
        "[&[data-state=open]>svg]:rotate-180",
        "[:where(&)_svg]:text-brand",
        "[&:not(:disabled)_svg]:text-brand",
      ].map((cls) => ({ messageId: "descendant", data: { cls, part: "Button" } })),
    },
    {
      // A kit component inside, under the element's own: its inside is the kit's.
      code: `${kitImport("Badge")} export const A = ({ on }) => <div className="**:text-subtle [&_svg]:icon-subtle"><p>{on && <Badge>New</Badge>}</p></div>;`,
      errors: [
        { messageId: "descendant", data: { cls: "**:text-subtle", part: "Badge" } },
        { messageId: "descendant", data: { cls: "[&_svg]:icon-subtle", part: "Badge" } },
      ],
    },
  ],
};
