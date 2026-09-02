import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { Check, Minus } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-[12px] font-medium text-foreground">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[12px] text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

const controlBase =
  "h-8 w-full rounded-md border border-input bg-card px-2.5 text-[13px] text-foreground outline-none transition-[box-shadow,border-color] placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlBase, className)} {...props} />;
}

/** The browser's own select with the kit's look. For options that carry a Dot or a Badge, see Select. */
export function NativeSelect({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(controlBase, "select-chevron appearance-none pr-8", className)}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(controlBase, "h-auto min-h-[68px] resize-y py-1.5 leading-snug", className)}
      {...props}
    />
  );
}

/* The choice controls. Each is Radix underneath (keyboard, aria, form value)
   and the kit's look on top. Children, when given, become the label; clicking
   the label toggles the control. A checked state is the blue budget's
   "selection" use. */

function Choice({
  control,
  disabled,
  children,
}: {
  control: ReactNode;
  disabled?: boolean | undefined;
  children: ReactNode;
}) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-2 text-13 text-foreground",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      {control}
      <span className="select-none leading-none">{children}</span>
    </label>
  );
}

const choiceFocus =
  "shrink-0 outline-none transition-[background-color,border-color,box-shadow] duration-100 focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:cursor-not-allowed";

export function Checkbox({
  children,
  className,
  ...props
}: Omit<ComponentProps<typeof CheckboxPrimitive.Root>, "children"> & { children?: ReactNode }) {
  const box = (
    <CheckboxPrimitive.Root
      className={cn(
        choiceFocus,
        "flex size-4 items-center justify-center rounded-[4px] border border-input bg-card text-primary-foreground shadow-hairline",
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        {props.checked === "indeterminate" ? (
          <Minus className="size-3" style={{ strokeWidth: 2.5 }} />
        ) : (
          <Check className="size-3" style={{ strokeWidth: 2.5 }} />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
  return children ? (
    <Choice control={box} disabled={props.disabled}>
      {children}
    </Choice>
  ) : (
    box
  );
}

export function Switch({
  children,
  className,
  ...props
}: Omit<ComponentProps<typeof SwitchPrimitive.Root>, "children"> & { children?: ReactNode }) {
  const control = (
    <SwitchPrimitive.Root
      className={cn(
        choiceFocus,
        "inline-flex h-[18px] w-[30px] items-center rounded-full bg-border-strong p-0.5 data-[state=checked]:bg-primary",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-3.5 rounded-full bg-card shadow-raised transition-transform duration-150 data-[state=checked]:translate-x-3" />
    </SwitchPrimitive.Root>
  );
  return children ? (
    <Choice control={control} disabled={props.disabled}>
      {children}
    </Choice>
  ) : (
    control
  );
}

function RadioGroupRoot({ className, ...props }: ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root className={cn("grid gap-2", className)} {...props} />;
}

function RadioGroupItem({
  children,
  className,
  ...props
}: Omit<ComponentProps<typeof RadioGroupPrimitive.Item>, "children"> & { children?: ReactNode }) {
  const dot = (
    <RadioGroupPrimitive.Item
      className={cn(
        choiceFocus,
        "flex size-4 items-center justify-center rounded-full border border-input bg-card shadow-hairline data-[state=checked]:border-primary",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <span className="block size-2 rounded-full bg-primary" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
  return children ? (
    <Choice control={dot} disabled={props.disabled}>
      {children}
    </Choice>
  ) : (
    dot
  );
}

export const RadioGroup = Object.assign(RadioGroupRoot, { Item: RadioGroupItem });
