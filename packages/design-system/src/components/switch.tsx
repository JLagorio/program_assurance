import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { classes } from "../lib/base-ui";
import { cn } from "../lib/cn";
import { useFieldControlState } from "./controls";

export type SwitchProps = SwitchPrimitive.Root.Props & {
  size?: "sm" | "default" | undefined;
};

/** An on/off setting. Inside a Field it takes the label, hint and error and the Field's `invalid`, `disabled` and `required`; inside a FieldSet it follows its `disabled`. */
export function Switch({ className, size = "default", ...props }: SwitchProps) {
  const field = useFieldControlState();
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
          // danger outline only while unfocused, so focus still shows as focus.
          "peer group/switch relative inline-flex shrink-0 items-center rounded-full bg-input-track p-025 outline-none transition-colors duration-fast ease-standard after:absolute after:-inset-x-150 after:-inset-y-100 focus-visible:outline-focused aria-invalid:not-focus-visible:outline-danger data-checked:bg-brand-bold data-disabled:cursor-not-allowed data-disabled:opacity-disabled motion-reduce:transition-none",
          size === "sm" ? "h-200 w-300" : "h-250 w-400",
        ),
        className,
      )}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block shrink-0 rounded-full bg-input-thumb shadow-raised data-checked:bg-input-thumb-checked transition-transform duration-micro ease-standard motion-reduce:transition-none",
          size === "sm"
            ? "size-150 data-checked:translate-x-100 rtl:data-checked:-translate-x-100"
            : "size-200 data-checked:translate-x-150 rtl:data-checked:-translate-x-150",
        )}
      />
    </SwitchPrimitive.Root>
  );
}
