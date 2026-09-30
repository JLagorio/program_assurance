// ledger/no-margin: a margin class, wherever the lint reads classes. Also the rule the shared
// options are tried on: the note, the shared note, and an allowance within and under its count.
import { KIT, PRODUCT, STORY, allowKey } from "../lint-helpers.mjs";

const mt = '<div className="mt-200" />';
/** A margin's finding: the parent's space at the margin's step, a Stack's on the block axis and
    an Inline's on the inline axis, with the length a step stands nearest to; or, for a negative
    margin, Bleed on its axis. */
const lead = "Space between siblings belongs to their parent:";
const stack = (cls, token, near = "") => ({
  messageId: "margin",
  data: { cls, advice: `${lead} a Stack with space="${token}"${near}.` },
});
const inline = (cls, token) => ({
  messageId: "margin",
  data: { cls, advice: `${lead} an Inline with space="${token}".` },
});
const bleed = (cls, value) => ({
  messageId: "negative",
  data: {
    cls,
    advice: `A child pulled out to its parent's edge is <Bleed inline=${value}>, at the parent's padding.`,
  },
});

export default {
  valid: [
    { code: '<div className="m-auto mx-auto ms-auto" />' },
    { code: '<div className="p-200 gap-100" />' },
    { code: 'const A = () => <Text className={open ? "p-200" : "px-100"}>x</Text>;' },
    // Within its allowance a file reports nothing, in a product file, a kit file and a story.
    { code: mt, options: [{ allow: { [allowKey(PRODUCT)]: 1 } }] },
    { code: mt, filename: KIT, options: [{ allow: { [allowKey(KIT)]: 1 } }] },
    { code: mt, filename: STORY, options: [{ allow: { [allowKey(STORY)]: 1 } }] },
    // Text appended with no whitespace glues to the value before it: that word is built at
    // runtime, so the append is not read as a class of its own.
    {
      code: 'export const A = ({ on }) => { let k = "p-200"; if (on) k += "mt-200"; return <div className={k} />; };',
    },
    // A let whose writes the file does not state (a counter, a member write) is not read.
    {
      code: 'export const A = ({ on }) => { let k = "mt-200"; k++; return <div className={k} />; };',
    },
  ],
  invalid: [
    {
      code: mt,
      errors: [{ ...stack("mt-200", "space.200"), line: 1, column: 16 }],
    },
    {
      code: '<div className="-mx-100 md:mt-200 hover:!mb-100" />',
      errors: [
        bleed("-mx-100", '"space.100"'),
        stack("md:mt-200", "space.200"),
        stack("hover:!mb-100", "space.100"),
      ],
    },
    {
      // A const is read where it is used, and reported where it is written.
      code: 'const base = "mt-4"; const A = () => <P className={base} />;',
      errors: [{ ...stack("mt-4", "space.200"), line: 1, column: 14 }],
    },
    {
      // A module-level class constant is reported where it is declared.
      code: 'export const groupTitle = "mb-100 truncate";',
      errors: [{ ...stack("mb-100", "space.100"), line: 1, column: 27 }],
    },
    {
      // The kit's menu separator (src/components/menu.ts), which its allowance counts.
      code: 'export const menuSeparator = "my-050 border-t border-default";',
      filename: KIT,
      errors: [stack("my-050", "space.050")],
    },
    {
      // Any margin is this rule's alone (classify in classes.js): at a stock key, at an arbitrary
      // value or a variable, and under any variant but dark:, which is no-dark-variant's.
      code: '<div className="mt-4 mt-[13px] -mx-(--gutter) md:mb-100 dark:mb-100" />',
      errors: [
        stack("mt-4", "space.200"),
        stack("mt-[13px]", "space.150", " (nearest 13px)"),
        bleed("-mx-(--gutter)", '"space.…"'),
        stack("md:mb-100", "space.100"),
      ],
    },
    {
      code: 'const c = cn({ "mt-200": open }, "p-200");',
      errors: [stack("mt-200", "space.200")],
    },
    {
      // A destructured binding is its own slot of the initialiser: the slot's value is read, and
      // its key "k" is no class.
      code: 'const { k } = { k: "mt-200" }; const A = () => <div className={k} />;',
      errors: [{ ...stack("mt-200", "space.200"), line: 1, column: 20 }],
    },
    {
      // A let that is never written again is read like a const.
      code: 'export const A = () => { let k = "mt-200"; return <div className={k} />; };',
      errors: [stack("mt-200", "space.200")],
    },
    {
      // A let written again renders each value it is given: its initialiser, every value
      // assigned in a branch, and text appended after whitespace.
      code: 'export const A = ({ on, wide }) => { let k = "mt-200"; if (on) k = "mb-100"; else k ??= "p-200"; if (wide) k += " ms-100"; return <div className={k} />; };',
      errors: [
        stack("mt-200", "space.200"),
        stack("mb-100", "space.100"),
        inline("ms-100", "space.100"),
      ],
    },
    {
      // A let declared without a value and assigned in each branch.
      code: 'export const A = ({ on }) => { let k: string; if (on) k = "mt-200"; else k = "p-200"; return <div className={k} />; };',
      only: "ts",
      errors: [stack("mt-200", "space.200")],
    },
    {
      code: '<div className={"mt-200" as string} />',
      only: "ts",
      errors: [stack("mt-200", "space.200")],
    },
    {
      // The rule's note ends every finding.
      code: mt,
      options: [{ note: "In this app: Stack." }],
      errors: [
        {
          messageId: "margin",
          data: { ...stack("mt-200", "space.200").data, note: " In this app: Stack." },
        },
      ],
    },
    {
      // The shared note comes first, then the rule's.
      code: mt,
      settings: { ledger: { note: "See the guide." } },
      options: [{ note: "In this app: Stack." }],
      errors: [
        {
          messageId: "margin",
          data: {
            ...stack("mt-200", "space.200").data,
            note: " See the guide. In this app: Stack.",
          },
        },
      ],
    },
    {
      // Fewer reports than the allowance: the count is lowered, so the list only shrinks. The
      // tester names the rule rule-to-test/no-margin.
      code: '<div className="p-200" />',
      options: [{ allow: { [allowKey(PRODUCT)]: 1 } }],
      errors: [
        {
          message: `${allowKey(PRODUCT)} is allowed 1 report of rule-to-test/no-margin and has 0. Lower its allowance to 0 by deleting the entry: the list only shrinks.`,
          line: 1,
          column: 1,
        },
      ],
    },
    {
      // A negative length in brackets is a negative margin too: Bleed at the step of its size.
      // Bleed goes to space.400; a wider pull is named without a value.
      code: '<div className="mt-[-4px] has-[>button]:ml-[-0.45rem] -mx-600 -m-10" />',
      errors: [
        {
          messageId: "negative",
          data: {
            cls: "mt-[-4px]",
            advice:
              "A child pulled out to its parent's edge is <Bleed block=\"space.050\">, at the parent's padding.",
          },
        },
        {
          messageId: "negative",
          data: {
            cls: "has-[>button]:ml-[-0.45rem]",
            advice:
              "A child pulled out to its parent's edge is <Bleed inline=\"space.100\"> (nearest 7.2px), at the parent's padding.",
          },
        },
        {
          messageId: "negative",
          data: {
            cls: "-mx-600",
            advice:
              "A child pulled out to its parent's edge is <Bleed inline>, which goes to space.400; a wider pull is the parent's layout.",
          },
        },
        {
          messageId: "negative",
          data: {
            cls: "-m-10",
            advice:
              "A child pulled out to its parent's edge is <Bleed all>, which goes to space.400; a wider pull is the parent's layout.",
          },
        },
      ],
    },
  ],
};
