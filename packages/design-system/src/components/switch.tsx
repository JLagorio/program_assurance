import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { classes } from "../lib/base-ui";
import { cn } from "../lib/cn";
import { useFieldControlState, type ControlSize } from "./controls";

/** The switch's size: `medium` (32 × 20px, the default) or `small` (24 × 16px), the words the kit's controls use. */
export type SwitchSize =
  | ControlSize
  /** @deprecated `sm` is `small`. */
  | "sm"
  /** @deprecated `default` is `medium`. */
  | "default";

/** The shadcn spellings the switch still accepts, for one version. */
const legacySizes: Record<string, ControlSize> = { sm: "small", default: "medium" };

export type SwitchProps = SwitchPrimitive.Root.Props & {
  /** `medium` (32 × 20px) by default; `small` (24 × 16px) in a dense row. `sm` and `default` are the deprecated spellings of `small` and `medium`. */
  size?: SwitchSize | undefined;
};

/** An on/off setting. Inside a Field it takes the label, hint and error and the Field's `invalid`, `disabled` and `required`; inside a FieldSet it follows its `disabled`. */
export function Switch({ className, size: sizeProp = "medium", ...props }: SwitchProps) {
  const field = useFieldControlState();
  const size: ControlSize = legacySizes[sizeProp] ?? (sizeProp as ControlSize);
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      {...props}
      disabled={props.disabled || field.disabled}
      aria-required={props["aria-required"] ?? ((props.required ?? field.required) || undefined)}
      className={classes(
        cn(
          // The off track is color.background.input.track, 3:1 against every surface with the thumb
          // at 3:1 on it (WCAG 1.4.11); the neutral fill buttons share was 1.12:1. Invalid draws the
          // danger outline only while unfocused, so focus still shows as focus. A read-only switch
          // that is on takes the neutral fill instead of the brand one, so a setting that cannot
          // change does not look like one waiting for a click.
          "peer group/switch relative inline-flex shrink-0 items-center rounded-full bg-input-track p-025 outline-none transition-colors duration-fast ease-standard after:absolute after:-inset-x-150 after:-inset-y-100 focus-visible:outline-focused aria-invalid:not-focus-visible:outline-danger not-data-readonly:data-checked:bg-brand-bold data-readonly:data-checked:bg-neutral-bold data-disabled:cursor-not-allowed data-disabled:opacity-disabled motion-reduce:transition-none",
          size === "small" ? "h-200 w-300" : "h-250 w-400",
        ),
        className,
      )}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block shrink-0 rounded-full bg-input-thumb shadow-raised data-checked:bg-input-thumb-checked transition-transform duration-micro ease-standard motion-reduce:transition-none",
          size === "small"
            ? "size-150 data-checked:translate-x-100 rtl:data-checked:-translate-x-100"
            : "size-200 data-checked:translate-x-150 rtl:data-checked:-translate-x-150",
        )}
      />
    </SwitchPrimitive.Root>
  );
}
