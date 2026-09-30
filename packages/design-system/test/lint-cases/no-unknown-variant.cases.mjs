// ledger/no-unknown-variant: a variant Tailwind does not generate, and an aria- variant that names
// no ARIA attribute, checked against the grammar the token build asked Tailwind for (lint.json).
import { sizeLists } from "../../eslint-plugin/variants.js";
import { KIT, KIT_SETTINGS, STORY } from "../lint-helpers.mjs";

const { containers, breakpoints } = sizeLists();
const breakpoint = (cls, variant) => ({
  messageId: "breakpoint",
  data: { cls, variant, containers, breakpoints },
  suggestions: [],
});
const replace = (output) => ({ messageId: "replace", output });

export default {
  valid: [
    // The catalogue's: compounds, a /name handed through not-, container queries and their names,
    // the kit's breakpoints, a name, a number and an arbitrary value, and ARIA names.
    {
      code: '<div className="not-group-data-disabled/field:hidden @md/main:flex @max-split:flex max-panel:hidden data-open:flex nth-3:flex supports-[display:grid]:grid [&>svg]:size-icon-small in-[.table-fixed]:w-full aria-expanded:flex" />',
    },
    {
      code: 'cva("inline-flex", { variants: { tone: { a: "hover:bg-neutral-hovered", b: "group-data-[state=open]/collapsible:rotate-90" } } });',
    },
    // Every breakpoint the kit has, xl (the alias of panel) included, and the container sizes.
    {
      code: '<div className="sm:flex md:flex lg:flex aside:flex panel:flex xl:flex wide:flex max-wide:hidden min-aside:grid @3xs:flex @compact:flex @split:flex @7xl:flex @min-[400px]:flex" />',
    },
    // The ARIA forms the repository writes.
    {
      code: '<a className="aria-[current=page]:text-selected aria-[orientation=horizontal]:flex-row aria-invalid:border-danger aria-[invalid=true]:border-danger aria-disabled:opacity-disabled group-aria-selected/row:bg-selected" />',
    },
    // Compounds Tailwind builds: a negation of a negation, a group of a group, not- around a media
    // query (hover) once, and an arbitrary selector or media query.
    {
      code: '<div className="not-not-first:flex group-group-hover:flex not-group-hover:flex has-[>svg]:flex group-has-[>input]/input-group:flex not-sm:hidden not-[@media_print]:flex [@media(hover:none)]:flex" />',
    },
    // A dark: class and a margin are their own rules' under any variant (classify).
    { code: '<div className="dark:hovr:bg-surface hovr:mt-4 tablet:-mx-100" />' },
    // A word that is no class is data.
    { code: 'export const label = "Note: see the tablet view";' },
    // ARIA 1.3's names that aria-query does not list yet.
    { code: '<td className="aria-colindextext:flex aria-rowindextext:flex aria-actions:flex" />' },
    // A variant the product declares in its own CSS (@custom-variant), alone or in a compound;
    // the class rules then judge its base.
    {
      code: '<div className="theme-sepia:bg-surface group-theme-sepia:flex" />',
      settings: { ledger: { customVariants: ["theme-sepia"] } },
    },
  ],
  invalid: [
    {
      code: '<div className="hovr:bg-surface" />',
      errors: [
        {
          messageId: "respell",
          data: { cls: "hovr:bg-surface", variant: "hovr", meant: "hover" },
          line: 1,
          column: 16,
          suggestions: [replace('<div className="hover:bg-surface" />')],
        },
      ],
    },
    {
      // A compound root two edits away around a variant written right, and a misspelt variant
      // inside a group with its /name.
      code: '<div className="grp-hover:flex group-hovr/row:flex" />',
      errors: [
        {
          messageId: "respell",
          data: { cls: "grp-hover:flex", variant: "grp-hover", meant: "group-hover" },
          suggestions: [replace('<div className="group-hover:flex group-hovr/row:flex" />')],
        },
        {
          messageId: "respell",
          data: { cls: "group-hovr/row:flex", variant: "group-hovr/row", meant: "group-hover/row" },
          suggestions: [replace('<div className="grp-hover:flex group-hover/row:flex" />')],
        },
      ],
    },
    {
      // One edit: a letter dropped, two swapped.
      code: 'cn("focus-visble:outline-focused", "motion-redcue:transition-none");',
      errors: [
        {
          messageId: "respell",
          data: {
            cls: "focus-visble:outline-focused",
            variant: "focus-visble",
            meant: "focus-visible",
          },
          suggestions: [
            replace('cn("focus-visible:outline-focused", "motion-redcue:transition-none");'),
          ],
        },
        {
          messageId: "respell",
          data: {
            cls: "motion-redcue:transition-none",
            variant: "motion-redcue",
            meant: "motion-reduce",
          },
          suggestions: [
            replace('cn("focus-visble:outline-focused", "motion-reduce:transition-none");'),
          ],
        },
      ],
    },
    {
      // The other variants and the important modifier stay as written.
      code: '<div className="md:hovr:!bg-surface" />',
      errors: [
        {
          messageId: "respell",
          data: { cls: "md:hovr:!bg-surface", variant: "hovr", meant: "hover" },
          suggestions: [replace('<div className="md:hover:!bg-surface" />')],
        },
      ],
    },
    {
      // The respelled class would fail another class rule, so the message names the variant's
      // spelling and offers no suggestion; so does a class with a second unknown variant, and a
      // template, which a fix never rewrites.
      code: '<div className={cn("hovr:bg-surfce", "hovr:tablet:flex", `hovr:bg-surface`)} />',
      errors: [
        {
          messageId: "respell",
          data: { cls: "hovr:bg-surfce", variant: "hovr", meant: "hover" },
          suggestions: [],
        },
        {
          messageId: "respell",
          data: { cls: "hovr:tablet:flex", variant: "hovr", meant: "hover" },
          suggestions: [],
        },
        {
          messageId: "respell",
          data: { cls: "hovr:bg-surface", variant: "hovr", meant: "hover" },
          suggestions: [],
        },
      ],
    },
    {
      // A size that is no breakpoint, 2xl included: the kit's reset clears Tailwind's own.
      code: '<div className="tablet:flex max-tablet:hidden 2xl:grid" />',
      errors: [
        breakpoint("tablet:flex", "tablet"),
        breakpoint("max-tablet:hidden", "max-tablet"),
        breakpoint("2xl:grid", "2xl"),
      ],
    },
    {
      code: '<div className="@8xl:flex @max-3lx:hidden" />',
      errors: [
        {
          messageId: "container",
          data: { cls: "@8xl:flex", variant: "@8xl", sizes: containers },
          suggestions: [],
        },
        {
          messageId: "container",
          data: { cls: "@max-3lx:hidden", variant: "@max-3lx", sizes: containers },
          suggestions: [],
        },
      ],
    },
    {
      // A /name on a variant that takes none: without it, or on the group of that name when a
      // group takes the variant (not a compound's, not a breakpoint's).
      code: '<div className="hover/row:flex data-open/x:flex not-hover/row:flex sm/x:flex" />',
      errors: [
        {
          messageId: "groupModifier",
          data: {
            cls: "hover/row:flex",
            variant: "hover/row",
            without: "hover",
            group: "group-hover/row",
          },
        },
        {
          messageId: "groupModifier",
          data: {
            cls: "data-open/x:flex",
            variant: "data-open/x",
            without: "data-open",
            group: "group-data-open/x",
          },
        },
        {
          messageId: "modifier",
          data: { cls: "not-hover/row:flex", variant: "not-hover/row", without: "not-hover" },
        },
        { messageId: "modifier", data: { cls: "sm/x:flex", variant: "sm/x", without: "sm" } },
      ],
    },
    {
      // A state-like word is a state, not a size: at the top, and inside a group, a peer, in- or
      // has-, which never wrap a breakpoint. A forbidden variant (dark) is never the spelling
      // offered.
      code: '<div className="selected:bg-selected group-expanded:rotate-90 peer-error:text-danger dakr:bg-surface" />',
      errors: [
        ["selected:bg-selected", "selected"],
        ["group-expanded:rotate-90", "group-expanded"],
        ["peer-error:text-danger", "peer-error"],
        ["dakr:bg-surface", "dakr"],
      ].map(([cls, variant]) => ({
        messageId: "variant",
        data: { cls, variant },
        suggestions: [],
      })),
    },
    {
      // A word near a breakpoint's name is a size, and so is one under not-, which negates one.
      code: '<div className="pannel:flex not-tablet:hidden" />',
      errors: [breakpoint("pannel:flex", "pannel"), breakpoint("not-tablet:hidden", "not-tablet")],
    },
    {
      // A CSS variable as the value of a selector or a feature query, which Tailwind writes into
      // it, where var() is never read: generated, and never matching.
      code: '<li className="nth-(--n):bg-surface supports-(--x):grid group-nth-last-(--n):flex" />',
      errors: [
        ["nth-(--n):bg-surface", "nth-(--n)"],
        ["supports-(--x):grid", "supports-(--x)"],
        ["group-nth-last-(--n):flex", "group-nth-last-(--n)"],
      ].map(([cls, variant]) => ({
        messageId: "variable",
        data: { cls, variant },
        suggestions: [],
      })),
    },
    {
      // Only the variants the product declares are its own.
      code: '<div className="theme-sepia:flex theme-sepai:flex" />',
      settings: { ledger: { customVariants: "theme-sepia" } },
      errors: [{ messageId: "variant", data: { cls: "theme-sepai:flex", variant: "theme-sepai" } }],
    },
    {
      // Compounds Tailwind does not build: a group cannot wrap a breakpoint, nor not- around a
      // media query.
      code: '<div className="group-md:flex group-not-hover:flex not-not-hover:flex" />',
      errors: [
        { messageId: "variant", data: { cls: "group-md:flex", variant: "group-md" } },
        { messageId: "variant", data: { cls: "group-not-hover:flex", variant: "group-not-hover" } },
        { messageId: "variant", data: { cls: "not-not-hover:flex", variant: "not-not-hover" } },
      ],
    },
    {
      code: '<div className="aria-expaned:flex" />',
      errors: [
        {
          messageId: "ariaRespell",
          data: { cls: "aria-expaned:flex", name: "expaned", meant: "aria-expanded" },
          suggestions: [replace('<div className="aria-expanded:flex" />')],
        },
      ],
    },
    {
      // Inside a group, with its /name, and in the bracket form.
      code: '<tr className="group-aria-selectd/row:bg-selected aria-[sortt=ascending]:text-default" />',
      errors: [
        {
          messageId: "ariaRespell",
          data: {
            cls: "group-aria-selectd/row:bg-selected",
            name: "selectd",
            meant: "group-aria-selected/row",
          },
          suggestions: [
            replace(
              '<tr className="group-aria-selected/row:bg-selected aria-[sortt=ascending]:text-default" />',
            ),
          ],
        },
        {
          messageId: "ariaRespell",
          data: {
            cls: "aria-[sortt=ascending]:text-default",
            name: "sortt",
            meant: "aria-[sort=ascending]",
          },
          suggestions: [
            replace(
              '<tr className="group-aria-selectd/row:bg-selected aria-[sort=ascending]:text-default" />',
            ),
          ],
        },
      ],
    },
    {
      // A name no ARIA attribute has, near none: Tailwind generates it, and it never matches.
      code: '<div className="aria-foo:flex aria-3:flex" />',
      errors: [
        { messageId: "aria", data: { cls: "aria-foo:flex", name: "foo" }, suggestions: [] },
        { messageId: "aria", data: { cls: "aria-3:flex", name: "3" }, suggestions: [] },
      ],
    },
    {
      // A recipe's variants, in the kit's own source and in a story.
      code: 'cva("inline-flex", { variants: { tone: { a: "hovr:bg-neutral-hovered" } } });',
      filename: KIT,
      settings: KIT_SETTINGS,
      errors: [
        {
          messageId: "respell",
          data: { cls: "hovr:bg-neutral-hovered", variant: "hovr", meant: "hover" },
          suggestions: [
            replace(
              'cva("inline-flex", { variants: { tone: { a: "hover:bg-neutral-hovered" } } });',
            ),
          ],
        },
      ],
    },
    {
      code: 'export const Story = () => <div className="tablet:flex" />;',
      filename: STORY,
      settings: KIT_SETTINGS,
      errors: [breakpoint("tablet:flex", "tablet")],
    },
  ],
};
