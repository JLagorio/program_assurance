// ledger/no-arbitrary-value: a bracketed value that bypasses the tokens.
import { KIT } from "../lint-helpers.mjs";

/** The words when no token of the value's role is near it (nearest.js). */
const USE = "Use a token utility or a primitive prop.";
/** A width's words: no token names one. */
const WIDTH =
  "A width is a layout part's, a part's preset or computed from its container (w-full, a grid track).";
/** An arbitrary value's report, with the advice nearest.js gives it. */
const arbitrary = (cls, advice = USE, more = {}) => ({
  messageId: "arbitrary",
  data: { cls, advice },
  ...more,
});
/** The editor suggestion that writes the token class of the same value. */
const same = (output) => ({ messageId: "sameValue", output });

export default {
  valid: [
    { code: '<div className="w-full p-200 text-body" />' },
    // A grid template with no length in it is the columns' shape, not a value.
    { code: '<div className="grid grid-cols-[auto_1fr] @3xl:grid-cols-[minmax(0,1fr)_auto]" />' },
    { code: 'const A = () => <DayPicker classNames={{ root: "font-body", months: "flex" }} />;' },
    { code: 'export const label = "Open the [draft] record";' },
    // The structural admissions that read a variable: Grid's columns and a panel's height.
    {
      code: '<div className="grid-cols-(--ds-grid-md) h-(--accordion-panel-height) h-(--collapsible-panel-height)" />',
    },
    // A margin and a dark: class are their own rules' whatever their value (classify), so the
    // class is reported once.
    { code: '<div className="mt-[13px] -mx-(--gutter) dark:w-[1px] dark:bg-(--brand)" />' },
    // So is a margin, or a dark: class, that writes a token's variable: no-margin's fix and
    // no-dark-variant's take the whole class.
    { code: '<div className="mt-(--ds-space-200) dark:bg-(--ds-elevation-surface)" />' },
    // A key of an object is a name, not an attribute, and a bare word alone is no class list.
    { code: 'const slots = { containerClass: "w-[240px]" }; export default slots;' },
    { code: 'export const shape = "rounded";' },
    // A bracket after a word Tailwind does not place is data, and so is a word in a *Class prop.
    {
      code: 'export const SORT = "items-[0]"; export const A = () => <Marker levelClass="[0]" />;',
    },
  ],
  invalid: [
    {
      code: '<div className="w-[240px]" />',
      output: null,
      errors: [arbitrary("w-[240px]", WIDTH, { line: 1, column: 16 })],
    },
    {
      code: '<p className={cn("text-[13px]", open && "hover:[mask:none]")} />',
      output: null,
      errors: [
        arbitrary("text-[13px]", "13px is font-body.", {
          line: 1,
          column: 18,
          suggestions: [same('<p className={cn("font-body", open && "hover:[mask:none]")} />')],
        }),
        arbitrary("hover:[mask:none]", USE, { line: 1, column: 41 }),
      ],
    },
    {
      // A template that names a length is an arbitrary value.
      code: '<div className="grid grid-cols-[220px_minmax(0,1fr)]" />',
      output: null,
      errors: [arbitrary("grid-cols-[220px_minmax(0,1fr)]")],
    },
    {
      code: 'const A = () => <P triggerClassName="w-[240px]" />;',
      output: null,
      errors: [arbitrary("w-[240px]", WIDTH)],
    },
    {
      // A Base UI className callback returns classes.
      code: 'const A = () => <P className={(state) => (state.open ? "text-[13px]" : "p-200")} />;',
      output: null,
      errors: [
        arbitrary("text-[13px]", "13px is font-body.", {
          suggestions: [
            same(
              'const A = () => <P className={(state) => (state.open ? "font-body" : "p-200")} />;',
            ),
          ],
        }),
      ],
    },
    {
      code: '<div className={"w-[240px]" satisfies string} />',
      only: "ts",
      output: null,
      errors: [arbitrary("w-[240px]", WIDTH)],
    },
    {
      code: '<div className={cn("bg-brand/[0.5]")!} />',
      only: "ts",
      output: null,
      errors: [arbitrary("bg-brand/[0.5]")],
    },
    {
      // Tailwind 4's variable shorthand, for a value and for an opacity, typed or not: a value the
      // lint cannot compare with a token.
      code: '<div className="bg-(--brand) md:w-(--rail) bg-(image:--hero) bg-brand-bold/(--alpha)" />',
      output: null,
      errors: [
        { messageId: "variable", data: { cls: "bg-(--brand)" }, line: 1, column: 16 },
        { messageId: "variable", data: { cls: "md:w-(--rail)" } },
        { messageId: "variable", data: { cls: "bg-(image:--hero)" } },
        { messageId: "variable", data: { cls: "bg-brand-bold/(--alpha)" } },
      ],
    },
    {
      // A Ledger token's own variable names its token: the token class that generates the same CSS
      // (varToClass in lint-values.json) is written in its place, shorthand or bracketed, typed or
      // not.
      code: '<div className="flex bg-(--ds-elevation-surface)" />',
      output: '<div className="flex bg-surface" />',
      errors: [
        {
          messageId: "token",
          data: { cls: "bg-(--ds-elevation-surface)", replacement: "bg-surface" },
          line: 1,
          column: 16,
        },
      ],
    },
    {
      code: 'export const c = cn("bg-(color:--ds-elevation-surface)", "bg-[var(--ds-elevation-surface)]", "bg-[color:var(--ds-elevation-surface)]");',
      output: 'export const c = cn("bg-surface", "bg-surface", "bg-surface");',
      errors: [
        "bg-(color:--ds-elevation-surface)",
        "bg-[var(--ds-elevation-surface)]",
        "bg-[color:var(--ds-elevation-surface)]",
      ].map((cls) => ({ messageId: "token", data: { cls, replacement: "bg-surface" } })),
    },
    {
      // A space or a radius on its scale, and a layout dimension typed as a length, under the
      // class's variants and important modifier, in single-quoted strings.
      code: "export const c = cn('md:hover:!p-[var(--ds-space-200)]', 'gap-x-(--ds-space-100)', 'rounded-t-(--ds-radius-medium)', 'h-(length:--ds-dimension-row)!');",
      output: "export const c = cn('md:hover:!p-200', 'gap-x-100', 'rounded-t-medium', 'h-row!');",
      errors: [
        {
          messageId: "token",
          data: { cls: "md:hover:!p-[var(--ds-space-200)]", replacement: "md:hover:!p-200" },
        },
        { messageId: "token", data: { cls: "gap-x-(--ds-space-100)", replacement: "gap-x-100" } },
        {
          messageId: "token",
          data: { cls: "rounded-t-(--ds-radius-medium)", replacement: "rounded-t-medium" },
        },
        {
          messageId: "token",
          data: { cls: "h-(length:--ds-dimension-row)!", replacement: "h-row!" },
        },
      ],
    },
    {
      // A string written with an escape is replaced by hand: the message still names the class.
      code: 'export const c = cn("bg-(--ds-elevation-surface)\\u0020w-full");',
      output: null,
      errors: [
        {
          messageId: "tokenByHand",
          data: {
            cls: "bg-(--ds-elevation-surface)",
            replacement: "bg-surface",
            reason: "this string is written with an escape",
          },
        },
      ],
    },
    {
      // No token class declares the same: another property under the prefix (a type hint that is
      // not the token's kind), a prefix no token class takes, a variable no token has, or a token
      // class another rule reports (a deprecated one).
      code: '<div className="bg-(length:--ds-elevation-surface) divide-[var(--ds-color-border)] bg-(--ds-color-unknown) fill-(--ds-color-chart-categorical-8)" />',
      output: null,
      errors: [
        "bg-(length:--ds-elevation-surface)",
        "divide-[var(--ds-color-border)]",
        "bg-(--ds-color-unknown)",
        "fill-(--ds-color-chart-categorical-8)",
      ].map((cls) => arbitrary(cls)),
    },
    {
      // An opacity in brackets is this rule's, not no-alpha-token's or no-non-token-class's.
      code: '<div className="bg-brand-bold/[0.5] bg-red-500/[0.5]" />',
      output: null,
      errors: [arbitrary("bg-brand-bold/[0.5]"), arbitrary("bg-red-500/[0.5]")],
    },
    {
      // The kit's dialog popup (src/components/dialog.tsx), which its allowance counts.
      code: 'import { cn } from "../lib/cn"; export const popup = cn("fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[520px] flex-col overflow-y-auto rounded-xxlarge bg-surface-overlay");',
      filename: KIT,
      output: null,
      errors: [
        arbitrary("max-h-[calc(100dvh-2rem)]"),
        arbitrary("w-[calc(100%-2rem)]"),
        arbitrary("max-w-[520px]", WIDTH),
      ],
    },
    {
      // Any other length names the token of its role nearest it (nearest.js): a space, a radius, a
      // type size, a border width or a duration, and an editor suggestion only for the same value,
      // never a fix. Off the scale, the scale's range. On an element use-primitives does not read, the
      // class is the answer.
      code: '<button className="p-[13px] p-[16px] -top-[13px] rounded-[5px] border-[2px] border-t-[1px] duration-[250ms] p-[400px]" />',
      output: null,
      errors: [
        arbitrary("p-[13px]", "Nearest: p-150 (12px) or p-200 (16px).", { line: 1, column: 19 }),
        arbitrary("p-[16px]", "16px is p-200 (space.200).", {
          suggestions: [
            same(
              '<button className="p-[13px] p-200 -top-[13px] rounded-[5px] border-[2px] border-t-[1px] duration-[250ms] p-[400px]" />',
            ),
          ],
        }),
        arbitrary("-top-[13px]", "Nearest: -top-150 (12px) or -top-200 (16px)."),
        arbitrary("rounded-[5px]", "5px is rounded-medium.", {
          suggestions: [
            same(
              '<button className="p-[13px] p-[16px] -top-[13px] rounded-medium border-[2px] border-t-[1px] duration-[250ms] p-[400px]" />',
            ),
          ],
        }),
        // Two tokens hold 2px, each for its own role, so neither is picked.
        arbitrary(
          "border-[2px]",
          "2px is border-w-selected (the width used to indicate a selected element…) or border-w-focused (the width used for the focus ring on…).",
        ),
        // 1px is the default width, which a side's own border class writes.
        arbitrary("border-t-[1px]", "1px is border-t.", {
          suggestions: [
            same(
              '<button className="p-[13px] p-[16px] -top-[13px] rounded-[5px] border-[2px] border-t duration-[250ms] p-[400px]" />',
            ),
          ],
        }),
        arbitrary(
          "duration-[250ms]",
          "Nearest: duration-moderate (240ms, a dialog or a sheet arriving, the panel…).",
        ),
        arbitrary("p-[400px]", "The space scale runs from p-025 (2px) to p-1000 (80px)."),
      ],
    },
    {
      // On an element use-primitives reads (a plain layout element or a layout primitive), in a
      // product, a padding or a gap is its primitive's prop: named with its token, and no class
      // suggestion, which use-primitives would report in turn. A zero is space.0; a height's example
      // is of its own dimension, and 1px has its own spelling.
      code: '<div className="p-[13px] p-[16px] p-[0] gap-[8px] top-[0px] h-[40px] h-[1px]" />',
      output: null,
      errors: [
        arbitrary(
          "p-[13px]",
          'Nearest: padding="space.150" (12px) or padding="space.200" (16px) on a Box.',
        ),
        arbitrary("p-[16px]", '16px is space.200: padding="space.200" on a Box.'),
        arbitrary("p-[0]", '0px is space.0: padding="space.0" on a Box.'),
        arbitrary("gap-[8px]", '8px is space.100: space="space.100" on a Stack.'),
        arbitrary("top-[0px]", "0px is top-0 (space.0).", {
          suggestions: [
            same('<div className="p-[13px] p-[16px] p-[0] gap-[8px] top-0 h-[40px] h-[1px]" />'),
          ],
        }),
        arbitrary(
          "h-[40px]",
          "A height is a layout part's, a part's preset or computed from its container (h-full, a grid track).",
        ),
        arbitrary("h-[1px]", "1px is h-px.", {
          suggestions: [
            same('<div className="p-[13px] p-[16px] p-[0] gap-[8px] top-[0px] h-[40px] h-px" />'),
          ],
        }),
      ],
    },
    {
      // A pill's radius is rounded-full, one pick at 9999px and named from 32px up; an outline's
      // width is on the border width scale, a ring is the focus outline, a weight in brackets is its
      // weight and a delay a duration token in style.
      code: '<span className="rounded-[9999px] rounded-[100px] outline-[2px] ring-[3px] font-[500] delay-[150ms]" />',
      output: null,
      errors: [
        arbitrary("rounded-[9999px]", "9999px is rounded-full.", {
          suggestions: [
            same(
              '<span className="rounded-full rounded-[100px] outline-[2px] ring-[3px] font-[500] delay-[150ms]" />',
            ),
          ],
        }),
        arbitrary(
          "rounded-[100px]",
          "100px rounds its ends as a pill: rounded-full (dots, avatars, pills, meters).",
        ),
        arbitrary(
          "outline-[2px]",
          "2px is border.width.selected (the width used to indicate a selected element…) or border.width.focused (the width used for the focus ring on…). A focus outline is outline-focused, which sets its width.",
        ),
        arbitrary("ring-[3px]", "A ring width is a focus ring: use outline-focused."),
        arbitrary("font-[500]", "500 is font-medium.", {
          suggestions: [
            same(
              '<span className="rounded-[9999px] rounded-[100px] outline-[2px] ring-[3px] font-medium delay-[150ms]" />',
            ),
          ],
        }),
        arbitrary(
          "delay-[150ms]",
          'A delay has no class; in style, 150ms is token("motion.duration.medium").',
        ),
      ],
    },
    {
      // A pale status tint as a hex is its hue's, not a grey (Tailwind's red-50).
      code: '<span className="bg-[#fef2f2]" />',
      output: null,
      errors: [
        arbitrary(
          "bg-[#fef2f2]",
          "Red is bg-danger (backgrounds communicating critical…) or bg-accent-red-subtler (a red tint that carries no meaning: an avatar…).",
        ),
      ],
    },
    {
      // A colour names the roles its hue plays for the utility, each with its purpose (decision
      // 8): a list, never one pick by value alone.
      code: '<div className="bg-[#f00] text-[#666]" />',
      output: null,
      errors: [
        arbitrary(
          "bg-[#f00]",
          "Red is bg-danger-bold (a vibrant background for critical information…) or bg-accent-red-bolder (a red fill that carries no meaning, for…).",
        ),
        arbitrary(
          "text-[#666]",
          "Grey is text-subtlest (tertiary text, such as metadata, breadcrumbs…).",
        ),
      ],
    },
    {
      // A component's own name for its classes (containerClass, iconClass) is read as className.
      code: 'export const A = () => <Widget containerClass="w-[240px]" />;',
      errors: [{ messageId: "arbitrary", data: { cls: "w-[240px]", advice: WIDTH } }],
      output: null,
    },
    {
      // A module-level string that can only be classes is read where it is declared.
      code: 'export const width = "w-[240px]";',
      errors: [{ messageId: "arbitrary", data: { cls: "w-[240px]", advice: WIDTH } }],
      output: null,
    },
  ],
};
