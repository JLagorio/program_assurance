import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { Check, ChevronDown, Minus } from "lucide-react";
import type { ComponentProps, ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "../lib/cn";

/*
 * The form controls. Field wraps one control with its label, hint and error. Input, NativeSelect
 * and Textarea share `controlBase`, the hairline field on the input surface. Checkbox, Switch and
 * RadioGroup are Radix underneath (keyboard, aria, form value) with the tokens on top; give them
 * children and the children become a label that toggles the control.
 */

export type FieldProps = {
  label: ReactNode;
  /** Shown under the control. */
  hint?: ReactNode;
  /** Replaces the hint and marks the field invalid. */
  error?: ReactNode;
  isRequired?: boolean | undefined;
  children: ReactNode;
  className?: string | undefined;
};

export function Field({ label, hint, error, isRequired, children, className }: FieldProps) {
  return (
    <label className={cn("flex flex-col gap-050", className)} aria-invalid={error ? true : undefined}>
      <span className="font-body-small font-medium text-subtle">
        {label}
        {isRequired ? (
          <span aria-hidden className="text-danger">
            {" *"}
          </span>
        ) : null}
      </span>
      {children}
      {error ? (
        <span role="alert" className="font-body-small text-danger">
          {error}
        </span>
      ) : hint ? (
        <span className="font-body-small text-subtlest">{hint}</span>
      ) : null}
    </label>
  );
}

/** The hairline control: Input, NativeSelect, Textarea, and the button triggers of Select, Combobox and DatePicker. */
export const controlBase =
  "h-control-medium w-full rounded-medium border border-input bg-input px-100 font-body text-default outline-none transition-colors duration-fast ease-standard placeholder:text-subtlest hover:bg-input-hovered focus-visible:border-focused focus-visible:outline-focused disabled:cursor-not-allowed disabled:border-disabled disabled:bg-disabled disabled:text-disabled";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlBase, className)} {...props} />;
}

/** The browser's own select with the kit's look. The chevron is a real icon, so it follows the colour mode. */
export function NativeSelect({ className, ...props }: ComponentProps<"select">) {
  return (
    <span className={cn("relative block w-full", className)}>
      <select className={cn(controlBase, "appearance-none pe-400")} {...props} />
      <ChevronDown aria-hidden className="pointer-events-none absolute end-100 top-1/2 size-icon-small -translate-y-1/2 icon-subtle" />
    </span>
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(controlBase, "h-auto min-h-800 resize-y py-075", className)} {...props} />;
}

/* The choice controls. A checked state is the blue budget's "selection" use. */

function Choice({ control, disabled, children }: { control: ReactNode; disabled?: boolean | undefined; children: ReactNode }) {
  return (
    <label className={cn("inline-flex items-center gap-100 font-body text-default", disabled && "cursor-not-allowed text-disabled")}>
      {control}
      <span className="select-none">{children}</span>
    </label>
  );
}

const choiceBase = "shrink-0 outline-none transition-colors duration-fast ease-standard focus-visible:outline-focused disabled:cursor-not-allowed";

export type CheckboxProps = Omit<ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>, "children"> & { children?: ReactNode };

export function Checkbox({ children, className, ...props }: CheckboxProps) {
  const box = (
    <CheckboxPrimitive.Root
      className={cn(
        choiceBase,
        "flex size-200 items-center justify-center rounded-small border border-input bg-input text-inverse",
        "data-[state=checked]:border-brand data-[state=checked]:bg-brand-bold data-[state=indeterminate]:border-brand data-[state=indeterminate]:bg-brand-bold",
        "disabled:border-disabled disabled:bg-disabled disabled:text-disabled",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        {props.checked === "indeterminate" ? <Minus className="size-150" strokeWidth={2.5} /> : <Check className="size-150" strokeWidth={2.5} />}
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

export type SwitchProps = Omit<ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>, "children"> & { children?: ReactNode };

export function Switch({ children, className, ...props }: SwitchProps) {
  const control = (
    <SwitchPrimitive.Root
      className={cn(
        choiceBase,
        "inline-flex h-250 w-500 items-center rounded-full bg-neutral-bold p-025 data-[state=checked]:bg-brand-bold disabled:bg-disabled",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-200 rounded-full bg-surface shadow-raised transition-transform duration-medium ease-standard data-[state=checked]:translate-x-250" />
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

function RadioGroupRoot({ className, ...props }: ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root className={cn("flex flex-col gap-100", className)} {...props} />;
}

export type RadioGroupItemProps = Omit<ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>, "children"> & { children?: ReactNode };

function RadioGroupItem({ children, className, ...props }: RadioGroupItemProps) {
  const dot = (
    <RadioGroupPrimitive.Item
      className={cn(
        choiceBase,
        "flex size-200 items-center justify-center rounded-full border border-input bg-input data-[state=checked]:border-brand disabled:border-disabled disabled:bg-disabled",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <span className="block size-100 rounded-full bg-brand-bold" />
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
