// ledger/no-static-design-value: a stock Tailwind utility that encodes a value a token owns, one
// message id per kind of value, with the token of its role nearest the value (nearest.js).

/** A report with the advice nearest.js gives it. */
const report = (messageId, cls, advice, more = {}) => ({
  messageId,
  data: { cls, advice },
  ...more,
});
/** The editor suggestion that writes the token class of the same value. */
const same = (output) => ({ messageId: "sameValue", output });
/** The two radii either side of the fixed 4px one, on the class's side. */
const radius = (side = "") =>
  `Nearest: rounded${side}-small (3px, count chips, the checkbox, skeleton lines…) or rounded${side}-medium (5px, buttons, inputs, chips, tooltips, menu items).`;
/** The two design opacities, the nearest first. */
const OPACITY =
  "Ledger has opacity-disabled (0.4, opacity of disabled elements when a disabled…) or opacity-loading (0.2, opacity of content in a loading state).";
/** The two 2px widths, each for its own role. */
const TWO_PX =
  "2px is border-w-selected (the width used to indicate a selected element…) or border-w-focused (the width used for the focus ring on…).";

export default {
  valid: [
    { code: '<div className="rounded-medium opacity-disabled duration-fast border" />' },
    // Hidden and shown, no width, a zero-radius join and an inset ring are structure.
    { code: '<div className="opacity-0 opacity-100 border-0 rounded-none ring-inset" />' },
    { code: '<div className="bg-transparent border-transparent fill-current text-danger" />' },
    // Under dark: the class is no-dark-variant's, and with alpha no-non-token-class's (classify).
    { code: '<div className="dark:bg-white dark:rounded bg-white/50" />' },
  ],
  invalid: [
    {
      code: '<div className="rounded opacity-50 duration-200 border-2 ring-2 bg-white" />',
      errors: [
        report("fixedRadius", "rounded", radius(), { line: 1, column: 16 }),
        report("numericOpacity", "opacity-50", OPACITY, { line: 1, column: 16 }),
        // The nearest two, since neither is 200ms: never the hard-coded fast or medium.
        report(
          "numericDuration",
          "duration-200",
          "Nearest: duration-moderate (240ms, a dialog or a sheet arriving, the panel…) or duration-medium (150ms, a menu or a popover arriving, a section…).",
          { line: 1, column: 16 },
        ),
        report("numericBorder", "border-2", TWO_PX, { line: 1, column: 16 }),
        { messageId: "ringWidth", data: { cls: "ring-2" }, line: 1, column: 16 },
        // A colour names the roles of its hue, each with its purpose (decision 8), never one pick:
        // white stays white in dark mode, and no token does.
        report(
          "literalColour",
          "bg-white",
          "Grey is bg-surface (primary background for the UI) or bg-surface-raised (background of raised cards, with…).",
          { line: 1, column: 16 },
        ),
      ],
    },
    {
      code: '<div className={cn("rounded-t", open && "delay-100", "text-current")} />',
      errors: [
        report("fixedRadius", "rounded-t", radius("-t")),
        // A delay has no class: its value is a duration token, in style.
        report(
          "numericDuration",
          "delay-100",
          'A delay has no class; in style, the nearest is token("motion.duration.fast") (110ms).',
        ),
        report("literalColour", "text-current", "Use the token for its role."),
      ],
    },
    {
      code: 'const focus = { className: "ring hover:border-x-4 text-transparent" };',
      errors: [
        { messageId: "ringWidth", data: { cls: "ring" } },
        report(
          "numericBorder",
          "hover:border-x-4",
          "The border width scale runs from border-w-default (1px) to border-w-focused (2px).",
        ),
        report("literalColour", "text-transparent", "Use the token for its role."),
      ],
    },
    {
      // A value a token holds alone is an editor suggestion for that token, under the class's
      // variants, never a fix: a duration, and the default 1px width, which `border` writes. A 2px
      // width on one side names the tokens, whose classes set every side, and offers neither.
      code: '<div className="hover:duration-150 border-1 border-x-2" />',
      output: null,
      errors: [
        report("numericDuration", "hover:duration-150", "150ms is duration-medium.", {
          suggestions: [same('<div className="hover:duration-medium border-1 border-x-2" />')],
        }),
        report("numericBorder", "border-1", "1px is border.", {
          suggestions: [same('<div className="hover:duration-150 border border-x-2" />')],
        }),
        report(
          "numericBorder",
          "border-x-2",
          "2px is border-w-selected (the width used to indicate a selected element…) or border-w-focused (the width used for the focus ring on…), which set every side.",
        ),
      ],
    },
    {
      // A literal colour and its dark: twin on the site are one colour in two modes, ranked
      // together: one token within ΔE 0.02 of both is an editor suggestion.
      code: 'export const c = cn("bg-white dark:bg-surface", "text-black dark:text-white");',
      output: null,
      errors: [
        report(
          "literalColour",
          "bg-white",
          'With "dark:bg-surface" it is bg-surface in both modes (primary background for the UI).',
          {
            suggestions: [
              same(
                'export const c = cn("bg-surface dark:bg-surface", "text-black dark:text-white");',
              ),
            ],
          },
        ),
        report(
          "literalColour",
          "text-black",
          'With "dark:text-white", grey is text-default (primary text, such as body copy, sentence case…).',
        ),
      ],
    },
  ],
};
