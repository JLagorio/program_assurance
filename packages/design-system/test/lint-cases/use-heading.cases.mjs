// ledger/use-heading: a raw h1–h6 carries no type classes. A title is a Heading at the size it
// matches, or the kit part that draws it; a heading a kit title part renders through `render`
// takes the part's type, bare.
import { KIT, KIT_SETTINGS, kitImport } from "../lint-helpers.mjs";

const stack = kitImport("Stack");
const title = kitImport("DialogTitle", "Section");

/** A report naming the size the classes match, with its suggestion's output where it has one. */
const heading = (tag, size, classes, output) => ({
  messageId: "heading",
  data: { tag, size, classes },
  ...(output ? { suggestions: [{ messageId: "toHeading", output }] } : { suggestions: [] }),
});

export default {
  valid: [
    // No type class: layout, colour, a screen reader's heading, a focus target's outline.
    { code: '<h2 className="min-w-0 text-subtle">Scope</h2>' },
    { code: '<h2 tabIndex={-1} className="sr-only outline-none">Step 2 of 4</h2>' },
    { code: "<h1>Programs</h1>" },
    { code: `${kitImport("Heading")} <Heading size="page" as="h1">Programs</Heading>` },
    // A kit title part's render, bare: the part draws its type.
    { code: `${title} <DialogTitle render={<h3 />}>Remove this allocation?</DialogTitle>` },
    { code: `${title} <Section.Title render={<h3 className="min-w-0" />}>Systems</Section.Title>` },
    // Not a heading element: a component named like one, and a paragraph with type classes.
    { code: '<H2 className="font-heading-page">Scope</H2>' },
    { code: '<p className="font-body-small">Scope</p>' },
    // The kit's own source draws its titles from its own classes.
    {
      code: '<h2 className="font-heading-section">Scope</h2>',
      filename: KIT,
      settings: KIT_SETTINGS,
    },
  ],
  invalid: [
    {
      // A type style names its size; the suggestion adds Heading to the kit import and keeps the
      // classes that are not type.
      code: `${stack} <h2 className="font-heading-page text-subtle">Scope</h2>`,
      errors: [
        heading(
          "h2",
          "page",
          '"font-heading-page"',
          'import { Stack, Heading } from "@ledger/design-system"; <Heading size="page" as="h2" className="text-subtle">Scope</Heading>',
        ),
      ],
    },
    {
      // A body style at semibold is a section's title; a self-closing heading, the kit's Heading
      // imported already, and nothing left of the className.
      code: `${kitImport("Heading")} <h3 className="font-body font-semibold" />`,
      errors: [
        heading(
          "h3",
          "section",
          '"font-body", "font-semibold"',
          `${kitImport("Heading")} <Heading size="section" as="h3" />`,
        ),
      ],
    },
    {
      // The earlier ramp names the size that replaced it, under a variant too; a namespace
      // import names Heading through it.
      code: 'import * as Kit from "@ledger/design-system"; <h4 className="md:font-heading-xsmall min-w-0">x</h4>',
      errors: [
        heading(
          "h4",
          "overlay",
          '"md:font-heading-xsmall"',
          'import * as Kit from "@ledger/design-system"; <Kit.Heading size="overlay" as="h4" className="min-w-0">x</Kit.Heading>',
        ),
      ],
    },
    {
      // Through cn() and a const: reported, with no suggestion, since the classes cannot be
      // rewritten in place. A file that imports nothing from the kit gets none either.
      code: 'const big = "font-heading-display"; <h1 className={cn(big, "min-w-0")}>12</h1>; <h2 className="font-heading-large">x</h2>',
      errors: [
        heading("h1", "display", '"font-heading-display"'),
        heading("h2", "display", '"font-heading-large"'),
      ],
    },
    {
      // Classes that match no size name the four to choose from.
      code: '<h1 className="text-xl font-bold leading-tight tracking-tight">Programs</h1>',
      errors: [
        {
          messageId: "anySize",
          data: { tag: "h1", classes: '"text-xl", "font-bold", "leading-tight", 1 more' },
        },
      ],
    },
    {
      // A heading in a kit title part's render: drop the type, which the part sets.
      code: `${title} <DialogTitle render={<h2 className="font-heading-page" />}>Remove</DialogTitle>`,
      errors: [
        {
          messageId: "rendered",
          data: { tag: "h2", part: "DialogTitle", classes: '"font-heading-page"' },
          suggestions: [
            {
              messageId: "dropType",
              output: `${title} <DialogTitle render={<h2 />}>Remove</DialogTitle>`,
            },
          ],
        },
      ],
    },
    {
      // A style, which Heading does not take, leaves the change to the author.
      code: `${kitImport("Heading")} <h2 className="font-heading-page" style={{ order: 1 }}>x</h2>`,
      errors: [heading("h2", "page", '"font-heading-page"')],
    },
    {
      // A Heading is already in scope under another meaning: no suggestion adds the kit's.
      code: `${stack} function Heading() { return null; } <h2 className="font-heading-small font-semibold">x</h2>`,
      errors: [heading("h2", "page", '"font-heading-small", "font-semibold"')],
    },
  ],
};
