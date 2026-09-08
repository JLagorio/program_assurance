import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { classes } from "../lib/base-ui";
import { cn } from "../lib/cn";
import { useFieldControl } from "./controls";

export type SwitchProps = SwitchPrimitive.Root.Props & {
  size?: "sm" | "default" | undefined;
};

export function Switch({ className, size = "default", ...props }: SwitchProps) {
  const bound = useFieldControl(props);
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      {...bound}
      aria-required={bound["aria-required"] ?? (props.required || undefined)}
      className={classes(
        cn(
          "peer group/switch relative inline-flex shrink-0 items-center rounded-full bg-neutral p-025 outline-none transition-colors duration-fast ease-standard after:absolute after:-inset-x-150 after:-inset-y-100 focus-visible:outline-focused aria-invalid:outline-danger data-checked:bg-brand-bold data-disabled:cursor-not-allowed data-disabled:opacity-disabled motion-reduce:transition-none",
          size === "sm" ? "h-200 w-300" : "h-250 w-400",
        ),
        className,
      )}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        style={({ checked }) => ({
          backgroundColor: checked
            ? "var(--ds-color-text-inverse)"
            : "light-dark(var(--ds-elevation-surface), var(--ds-color-text))",
        })}
        className={cn(
          "pointer-events-none block shrink-0 rounded-full shadow-raised transition-transform duration-micro ease-standard motion-reduce:transition-none",
          size === "sm"
            ? "size-150 data-checked:translate-x-100 rtl:data-checked:-translate-x-100"
            : "size-200 data-checked:translate-x-150 rtl:data-checked:-translate-x-150",
        )}
      />
    </SwitchPrimitive.Root>
  );
}
