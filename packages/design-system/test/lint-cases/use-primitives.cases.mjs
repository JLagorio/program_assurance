// ledger/use-primitives: layout in product code goes through the primitives and their props, not
// layout classes on an element or on a primitive.
import { KIT, KIT_SETTINGS, kitImport } from "../lint-helpers.mjs";

const layout = kitImport("Box", "Grid", "Inline", "Stack");
/** A Stack's padding above it: a Box around it, with the step as its prop's value. */
const stackPadding = 'Wrap it in <Box paddingBlockStart="space.200"> (a Stack has no padding).';
/** The same, for the Stack inside a component of the file that hands its className on. */
const forwardedPadding = 'wrap it in <Box paddingBlockStart="space.200"> (a Stack has no padding).';

export default {
  valid: [
    { code: `${layout} <Box padding="space.200" className="min-w-0">x</Box>` },
    // A container query, responsive visibility and a breakpoint's spacing are what the props
    // cannot key: padding, space and gap take one token.
    { code: `${layout} <Grid className="grid-cols-1 @4xl:grid-cols-3">x</Grid>` },
    { code: `${layout} <Inline className="hidden @3xl:flex">x</Inline>` },
    { code: `${layout} <Box className="md:px-300">x</Box>` },
    { code: `${layout} <Grid className="gap-px">x</Grid>` },
    { code: '<p className="text-subtle">x</p>' },
    // A local component that shares a primitive's name is not the kit's, and neither is another
    // package's or a parameter.
    { code: '<Stack className="pt-200">x</Stack>' },
    { code: 'import { Stack } from "other-kit"; <Stack className="pt-200">x</Stack>' },
    {
      code: `${layout} export function Row(Stack) { return <Stack className="pt-200">x</Stack>; }`,
    },
    // Past four components the hand-on is not followed, and neither is a `let` component, one
    // read from an object or one imported from another file.
    {
      code: `${layout} function W1(p) { return <W2 {...p} />; } function W2(p) { return <W3 {...p} />; } function W3(p) { return <W4 {...p} />; } function W4(p) { return <W5 {...p} />; } function W5(p) { return <Stack {...p} />; } export const A = () => <W1 className="pt-200" />;`,
    },
    {
      code: `${layout} let Pane = (p) => <Stack {...p} />; const parts = { Pane: (p) => <Stack {...p} /> }; export const A = () => <><Pane className="pt-200" /><parts.Pane className="pt-200" /></>;`,
    },
    // Without the package preset's settings a file is a product's, whose relative import is its
    // own file.
    {
      code: 'import { Stack } from "../primitives/stack"; <Stack className="pt-200">x</Stack>',
      filename: KIT,
    },
    // A primitive's classes through a const are judged as written: no layout, no report.
    { code: `${layout} const clip = "min-w-0 truncate"; <Stack className={clip}>x</Stack>` },
    // A component of this file whose rest no longer carries className hands it on to nothing.
    {
      code: `${layout} function Row({ className, ...rest }) { return <Inline {...rest} />; } export const A = () => <Row className="pt-200" />;`,
    },
  ],
  invalid: [
    {
      code: '<p className="flex gap-100">x</p>',
      errors: [
        {
          messageId: "element",
          data: { tag: "p", classes: "flex, gap-100", advice: 'Use <Inline space="space.100">.' },
          line: 1,
          column: 1,
        },
      ],
    },
    {
      code: '<><label className="px-100">x</label><h2 className="grid">y</h2></>',
      errors: [
        {
          messageId: "element",
          data: {
            tag: "label",
            classes: "px-100",
            advice: 'Use <Box paddingInline="space.100">.',
          },
        },
        { messageId: "element", data: { tag: "h2", classes: "grid", advice: "Use <Grid>." } },
      ],
    },
    {
      code: `${layout} <Stack className="pt-200">x</Stack>`,
      errors: [
        {
          messageId: "primitive",
          data: { part: "Stack", classes: "pt-200", advice: stackPadding },
        },
      ],
    },
    {
      code: `${layout} <Box className="px-150 gap-100">x</Box>`,
      errors: [
        {
          messageId: "primitive",
          data: {
            part: "Box",
            classes: "px-150, gap-100",
            advice:
              'Use paddingInline="space.150", and put its children in <Stack space="space.100"> inside it.',
          },
        },
      ],
    },
    {
      code: `${layout} <Grid className="md:grid-cols-3">x</Grid>`,
      errors: [
        {
          messageId: "primitive",
          data: {
            part: "Grid",
            classes: "md:grid-cols-3",
            advice: 'Use templateColumns={{ md: "repeat(3, minmax(0, 1fr))" }}.',
          },
        },
      ],
    },
    {
      // An alias and a namespace are the kit's primitive, and the message names it as the kit does.
      code: 'import { Inline as Row } from "@ledger/design-system"; <Row className="flex">x</Row>',
      errors: [
        {
          messageId: "primitive",
          data: {
            part: "Inline",
            classes: "flex",
            advice: "Drop flex (an Inline is already a flex row).",
          },
        },
      ],
    },
    {
      code: 'import * as L from "@ledger/design-system"; <L.Stack className="pt-200">x</L.Stack>',
      errors: [
        {
          messageId: "primitive",
          data: { part: "Stack", classes: "pt-200", advice: stackPadding },
        },
      ],
    },
    {
      // A render prop puts the primitive in the element's place, so the classes land on it.
      code: `${layout} <Slot render={<Stack />} className="pt-200">x</Slot>`,
      errors: [
        {
          messageId: "rendered",
          data: { wrapper: "Slot", part: "Stack", classes: "pt-200", advice: stackPadding },
        },
      ],
    },
    {
      // Inside the kit, a relative import of a primitive is the primitive.
      code: 'import { Stack } from "../primitives/stack"; <Stack className="pt-200">x</Stack>',
      filename: KIT,
      settings: KIT_SETTINGS,
      errors: [
        {
          messageId: "primitive",
          data: { part: "Stack", classes: "pt-200", advice: stackPadding },
        },
      ],
    },
    {
      // The classes are read through a const and a map entry, as a literal is.
      code: `${layout} const pad = "pt-200"; const rows = { tight: "flex gap-100" }; <><Stack className={pad}>x</Stack><div className={rows.tight}>y</div></>`,
      errors: [
        {
          messageId: "primitive",
          data: { part: "Stack", classes: "pt-200", advice: stackPadding },
        },
        {
          messageId: "element",
          data: { tag: "div", classes: "flex, gap-100", advice: 'Use <Inline space="space.100">.' },
        },
      ],
    },
    {
      // A plain element becomes the part its classes make: a flex column is a Stack, inside a
      // Box for its padding; a grid is a Grid, its columns and gap as props; a stock step or an
      // arbitrary length takes the step it is, or the one nearest it.
      code: '<><div className="flex flex-col gap-200 p-300" /><div className="grid grid-cols-3 gap-4" /><section className="px-[13px]" /></>',
      errors: [
        {
          messageId: "element",
          data: {
            tag: "div",
            classes: "flex, flex-col, gap-200, p-300",
            advice: 'Use <Stack space="space.200"> inside <Box padding="space.300">.',
          },
        },
        {
          messageId: "element",
          data: {
            tag: "div",
            classes: "grid, grid-cols-3, gap-4",
            advice: 'Use <Grid templateColumns="repeat(3, minmax(0, 1fr))" gap="space.200">.',
          },
        },
        {
          messageId: "element",
          data: {
            tag: "section",
            classes: "px-[13px]",
            advice: 'Use <Box paddingInline="space.150"> (nearest 13px).',
          },
        },
      ],
    },
    {
      // On a primitive: a display it has already goes, its props take the values, and padding
      // goes on a Box around it; a Box that lays out its children puts them in the part.
      code: `${layout} <><Stack className="p-200 gap-100 flex">x</Stack><Box className="flex gap-100">y</Box><Inline className="inline-flex gap-y-100">z</Inline></>`,
      errors: [
        {
          messageId: "primitive",
          data: {
            part: "Stack",
            classes: "p-200, gap-100, flex",
            advice:
              'Drop flex (a Stack is already a flex column), use space="space.100" and wrap it in <Box padding="space.200"> (a Stack has no padding).',
          },
        },
        {
          messageId: "primitive",
          data: {
            part: "Box",
            classes: "flex, gap-100",
            advice: 'Use <Inline space="space.100"> in its place: a Box is a block.',
          },
        },
        {
          messageId: "primitive",
          data: {
            part: "Inline",
            classes: "inline-flex, gap-y-100",
            advice: 'Use rowSpace="space.100" and display="inline-flex".',
          },
        },
      ],
    },
    {
      // templateColumns keys only the window breakpoints Grid's ResponsiveTemplate has (base, sm,
      // md, lg, xl): any other variant, a Ledger breakpoint or a state, keys none of them.
      code: `${layout} <><Grid className="grid-cols-1 aside:grid-cols-2">x</Grid><Grid className="grid-cols-1 hover:grid-cols-2 wide:grid-cols-4">y</Grid></>`,
      errors: [
        {
          messageId: "primitive",
          data: {
            part: "Grid",
            classes: "grid-cols-1, aside:grid-cols-2",
            advice: "Use templateColumns (it keys base, sm, md, lg and xl only).",
          },
        },
        {
          messageId: "primitive",
          data: {
            part: "Grid",
            classes: "grid-cols-1, hover:grid-cols-2, wide:grid-cols-4",
            advice: "Use templateColumns (it keys base, sm, md, lg and xl only).",
          },
        },
      ],
    },
    {
      // A Stack's space is its row gap: a column gap has no Stack prop, and a gap-y wins over a
      // gap for it. gap-px alone is on no space step, so no prop takes it.
      code: `${layout} <><Stack className="gap-x-100">x</Stack><div className="flex flex-col gap-x-100 gap-y-200" /><div className="gap-px" /></>`,
      errors: [
        {
          messageId: "primitive",
          data: {
            part: "Stack",
            classes: "gap-x-100",
            advice: "Drop gap-x-100 (a Stack has no column gap).",
          },
        },
        {
          messageId: "element",
          data: {
            tag: "div",
            classes: "flex, flex-col, gap-x-100, gap-y-200",
            advice: 'Use <Stack space="space.200">.',
          },
        },
        {
          messageId: "element",
          data: {
            tag: "div",
            classes: "gap-px",
            advice:
              "A 1px gap is on no space step: give a Stack, an Inline or a Grid a space token, or draw the hairline with a border or a Separator.",
          },
        },
      ],
    },
    {
      // A component of this file that hands its className on to a primitive: the advice is for
      // the primitive inside it, whose props the component need not take.
      code: `${layout} const Pane = (props) => <Stack {...props} />; export const A = () => <Pane className="pt-200" />;`,
      errors: [
        {
          messageId: "forwarded",
          data: {
            wrapper: "Pane",
            part: "Stack",
            classes: "pt-200",
            advice: forwardedPadding,
          },
        },
      ],
    },
    {
      // Four components of the file, one handing className to the next, reach the primitive.
      code: `${layout} function W1(p) { return <W2 {...p} />; } function W2(p) { return <W3 {...p} />; } function W3(p) { return <W4 {...p} />; } function W4(p) { return <Stack {...p} />; } export const A = () => <W1 className="pt-200" />;`,
      errors: [
        {
          messageId: "forwarded",
          data: { wrapper: "W1", part: "Stack", classes: "pt-200", advice: forwardedPadding },
        },
      ],
    },
    {
      // A component whose body destructures its props, and one that renders itself before the
      // primitive (a tree), hand className on too.
      code: `${layout} function Pane(props) { const { className, ...rest } = props; return <Stack className={className} {...rest} />; } function Tree(props) { return props.depth ? <Tree {...props} depth={props.depth - 1} /> : <Stack {...props} />; } export const A = () => <><Pane className="pt-200" /><Tree depth={2} className="pt-200" /></>;`,
      errors: [
        {
          messageId: "forwarded",
          data: { wrapper: "Pane", part: "Stack", classes: "pt-200", advice: forwardedPadding },
        },
        {
          messageId: "forwarded",
          data: { wrapper: "Tree", part: "Stack", classes: "pt-200", advice: forwardedPadding },
        },
      ],
    },
  ],
};
