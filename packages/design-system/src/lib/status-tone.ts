/**
 * Status colour, said once. Every component that paints a status (Badge, Dot, Indicator, Count,
 * Progress and the bars) reads this table, so a tone is one decision: the subtlest fill with
 * the tone's text on it, the bold fill with inverse text, the icon colour for a 6px dot, and the
 * fill for a bar (Progress, Stacked). Neutral's fill is neutral.bold.
 * The names are the token names (information, not info) so a tone reads straight through to
 * `color.background.<tone>` and `color.text.<tone>`.
 */
export type Tone = "neutral" | "information" | "success" | "warning" | "danger";

export const tones = ["neutral", "information", "success", "warning", "danger"] as const;

export const toneClasses: Record<
  Tone,
  { subtle: string; bold: string; text: string; icon: string; fill: string }
> = {
  neutral: {
    subtle: "bg-neutral text-subtle",
    bold: "bg-neutral-bold text-inverse",
    text: "text-subtle",
    icon: "icon-subtlest",
    fill: "bg-neutral-bold",
  },
  information: {
    subtle: "bg-information text-information",
    bold: "bg-information-bold text-inverse",
    text: "text-information",
    icon: "icon-information",
    fill: "bg-information-bold",
  },
  success: {
    subtle: "bg-success text-success",
    bold: "bg-success-bold text-inverse",
    text: "text-success",
    icon: "icon-success",
    fill: "bg-success-bold",
  },
  warning: {
    subtle: "bg-warning text-warning",
    bold: "bg-warning-bold text-warning-inverse",
    text: "text-warning",
    icon: "icon-warning",
    fill: "bg-warning-bold",
  },
  danger: {
    subtle: "bg-danger text-danger",
    bold: "bg-danger-bold text-inverse",
    text: "text-danger",
    icon: "icon-danger",
    fill: "bg-danger-bold",
  },
};
