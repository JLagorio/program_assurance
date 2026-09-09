/** The field every control shares: the border on the input surface and its hover, focus, invalid, disabled and read-only looks. The height comes from `controlHeight`. */
export const controlBase =
  "w-full rounded-medium border border-input bg-input px-100 font-body text-default outline-none transition-colors duration-fast ease-standard placeholder:text-subtlest hover:bg-input-hovered focus-visible:bg-input-pressed [&[readonly]]:bg-surface-sunken [&[readonly]]:hover:bg-surface-sunken aria-[invalid=true]:border-danger focus-visible:border-focused focus-visible:outline-focused disabled:cursor-not-allowed disabled:border-disabled disabled:bg-disabled disabled:text-disabled";

export type ControlSize = "small" | "medium";

/** `medium` (32px) in a form, beside a medium Button; `small` (28px) in a toolbar, a row or a rail, beside a small Button. */
export const controlHeight: Record<ControlSize, string> = {
  small: "h-control-small",
  medium: "h-control-medium",
};
