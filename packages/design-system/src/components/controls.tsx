import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { Check, ChevronDown, Minus } from "lucide-react";
import {
  cloneElement,
  isValidElement,
  type ComponentProps,
  type ComponentPropsWithoutRef,
  type ReactNode,
  useId,
} from "react";

import { cn } from "../lib/cn";

/**
 * The form controls. Field wraps one control with its label, hint and error. Input, NativeSelect
 * and Textarea share `controlBase`, the hairline field on the input surface. Checkbox, Switch and
 * RadioGroup are Radix underneath (keyboard, aria, form value) with the tokens on top; give them
 * children and the children become a label that toggles the control.
 */

type AriaProps = {
  "aria-invalid"?: boolean | undefined;
  "aria-required"?: boolean | undefined;
  "aria-describedby"?: string | undefined;
};

export type FieldProps = {
  /** The control's name, read by the label and by assistive technology. Sentence case, no colon. */
  label: ReactNode;
  /** Shown under the control and read as its description: the format, the reason, the consequence. A full sentence. */
  hint?: ReactNode;
  /** Replaces the hint, marks the control invalid (its border turns) and is announced as an alert. */
  error?: ReactNode;
  /** Paints the asterisk and sets aria-required. Not the browser's `required`: the form checks on submit with `useRequired`. */
  isRequired?: boolean | undefined;
  /** The child is a group, a RadioGroup or several Checkboxes in a Stack: the Field renders a fieldset with the label as its legend, so the group is named, and the hint or the error describes the group. */
  isGroup?: boolean | undefined;
  children: ReactNode;
  className?: string | undefined;
};

export function Field({
  label,
  hint,
  error,
  isRequired,
  isGroup,
  children,
  className,
}: FieldProps) {
  // The label wraps the control, so any control is named by it. The hint or the error sits outside
  // the label as the control's description (aria-describedby), never as part of its name; the one
  // control inside also takes aria-invalid, so its border turns, and aria-required. A group is a
  // fieldset with the label as its legend; the fieldset carries the description, and a RadioGroup
  // inside it takes aria-invalid and aria-required, which a stack of checkboxes cannot.
  const id = useId();
  const messageId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const isRadioGroup = isValidElement(children) && children.type === RadioGroup;
  const takesState = !isGroup || isRadioGroup;
  const control = isValidElement<AriaProps>(children)
    ? cloneElement(children, {
        ...(error && takesState ? { "aria-invalid": true } : {}),
        ...(isRequired && takesState ? { "aria-required": true } : {}),
        ...(messageId && !isGroup
          ? {
              "aria-describedby": [children.props["aria-describedby"], messageId]
                .filter(Boolean)
                .join(" "),
            }
          : {}),
      })
    : children;
  const labelText = (
    <>
      {label}
      {isRequired ? (
        <span aria-hidden className="text-danger">
          {" *"}
        </span>
      ) : null}
    </>
  );
  const message = error ? (
    <span id={`${id}-error`} role="alert" className="font-body-small text-danger">
      {error}
    </span>
  ) : hint ? (
    <span id={`${id}-hint`} className="font-body-small text-subtlest">
      {hint}
    </span>
  ) : null;
  if (isGroup) {
    return (
      <fieldset
        className={cn("min-w-0", className)}
        aria-describedby={messageId}
        aria-invalid={error ? true : undefined}
      >
        <legend className="font-body-small font-medium text-subtle">{labelText}</legend>
        <div className="flex flex-col gap-050 pt-050">
          {control}
          {message}
        </div>
      </fieldset>
    );
  }
  return (
    <div className={cn("flex flex-col gap-050", className)}>
      <label className="flex flex-col gap-050">
        <span className="font-body-small font-medium text-subtle">{labelText}</span>
        {control}
      </label>
      {message}
    </div>
  );
}

/** The field every control shares: the border on the input surface and its hover, focus, invalid, disabled and read-only looks. The height comes from `controlHeight`. */
export const controlBase =
  "w-full rounded-medium border border-input bg-input px-100 font-body text-default outline-none transition-colors duration-fast ease-standard placeholder:text-subtlest hover:bg-input-hovered [&[readonly]]:bg-surface-sunken [&[readonly]]:hover:bg-surface-sunken aria-[invalid=true]:border-danger focus-visible:border-focused focus-visible:outline-focused disabled:cursor-not-allowed disabled:border-disabled disabled:bg-disabled disabled:text-disabled";

export type ControlSize = "small" | "medium";

/** `medium` (32px) in a form, beside a medium Button; `small` (28px) in a toolbar, a row or a rail, beside a small Button. */
export const controlHeight: Record<ControlSize, string> = {
  small: "h-control-small",
  medium: "h-control-medium",
};

export type InputProps = {
  /** `medium` (32px) in a form; `small` (28px) in a toolbar or the top navigation, beside small Buttons. */
  size?: ControlSize;
} & Omit<ComponentProps<"input">, "size">;

/** One line of free text. Inside a Field for its label, hint and error; inside an InputGroup for an icon, a unit or a shortcut at either end. `type="search"` for a search box: the browser's own clear control is hidden, Escape clears it. */
export function Input({ size = "medium", className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        controlBase,
        controlHeight[size],
        "[&::-webkit-search-cancel-button]:appearance-none",
        className,
      )}
      {...props}
    />
  );
}

export type NativeSelectProps = {
  /** `medium` (32px) in a form; `small` (28px) as a toolbar's filter or a row's cell, beside small Buttons. */
  size?: ControlSize;
} & Omit<ComponentProps<"select">, "size">;

/** The browser's own select with the kit's look: a short, plain list the reader picks one of. The chevron is a real icon, so it follows the colour mode. `className` goes to the wrapper. */
export function NativeSelect({ size = "medium", className, ...props }: NativeSelectProps) {
  return (
    <span className={cn("relative block w-full", className)}>
      <select
        className={cn(controlBase, controlHeight[size], "appearance-none pe-400")}
        {...props}
      />
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute end-100 top-1/2 size-icon-small -translate-y-1/2 icon-subtle"
      />
    </span>
  );
}

/** Several lines of free text: a note, a description, a narrative. `rows` says how long an answer is expected; the reader can drag it taller. Inside a Field like an Input. */
export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea className={cn(controlBase, "min-h-800 resize-y py-075", className)} {...props} />
  );
}

/* The choice controls. A checked state is the blue budget's "selection" use. */

type ChoiceOwnProps = {
  /** The label, after the control; a click on it toggles the control. Without one, pass `aria-label`. */
  children?: ReactNode;
  /** A second line under the label, in the subtle colour: what turning it on does. Read as the control's description. */
  description?: ReactNode;
  /** Layout only. */
  className?: string | undefined;
};

function Choice({
  control,
  disabled,
  description,
  descriptionId,
  children,
}: {
  control: ReactNode;
  disabled?: boolean | undefined;
  description?: ReactNode;
  descriptionId: string;
  children: ReactNode;
}) {
  return (
    <label
      className={cn(
        "group inline-flex items-start gap-100 font-body text-default",
        "has-[:disabled]:cursor-not-allowed has-[:disabled]:text-disabled",
        disabled && "cursor-not-allowed text-disabled",
      )}
    >
      {control}
      <span className="flex min-w-0 flex-col">
        <span className="select-none">{children}</span>
        {description ? (
          <span
            id={descriptionId}
            className={cn(
              "font-body-small text-subtle group-has-[:disabled]:text-disabled",
              disabled && "text-disabled",
            )}
          >
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}

const describedBy = (own: string | undefined, description: ReactNode, id: string) =>
  description ? [own, id].filter(Boolean).join(" ") : own;

type Defined<T> = { [K in keyof T]-?: Exclude<T[K], undefined> };
/** Drops the undefined entries, so an optional prop the caller left unset is not handed to Radix as `undefined`. */
function defined<T extends object>(o: T): Partial<Defined<T>> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<
    Defined<T>
  >;
}

const choiceBase =
  "shrink-0 outline-none transition-colors duration-fast ease-standard focus-visible:outline-focused disabled:cursor-not-allowed";

export type CheckboxProps = ChoiceOwnProps & {
  /** `true`, `false`, or `"indeterminate"` for a parent whose children are partly checked. Controlled; pair it with `onCheckedChange`. */
  checked?: boolean | "indeterminate" | undefined;
  /** The starting state when uncontrolled. */
  defaultChecked?: boolean | undefined;
  /** Called with the new state. An indeterminate parent reports `true` on its first click. */
  onCheckedChange?: ((checked: boolean | "indeterminate") => void) | undefined;
  /** Not available. The last resort: a setting the reader cannot change is shown as text. */
  disabled?: boolean | undefined;
  /** The form field's name, for a native submit. */
  name?: string | undefined;
  /** The name, when there is no label: a row's checkbox in a table. */
  "aria-label"?: string | undefined;
} & Omit<
    ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    | "children"
    | "className"
    | "checked"
    | "defaultChecked"
    | "onCheckedChange"
    | "disabled"
    | "name"
    | "aria-label"
  >;

/** One independent yes or no: a parameter, an attestation, one of several options that can all be on. Several of them go in a Field with `isGroup`. It waits for the form's Save; a setting that applies at once is a Switch. */
export function Checkbox({
  children,
  description,
  className,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  name,
  ...rest
}: CheckboxProps) {
  const descriptionId = useId();
  const box = (
    <CheckboxPrimitive.Root
      className={cn(
        choiceBase,
        "flex size-200 items-center justify-center rounded-small border border-input bg-input text-inverse",
        "data-[state=checked]:border-brand data-[state=checked]:bg-brand-bold data-[state=indeterminate]:border-brand data-[state=indeterminate]:bg-brand-bold",
        "disabled:border-disabled disabled:bg-disabled disabled:text-disabled disabled:data-[state=checked]:border-disabled disabled:data-[state=checked]:bg-disabled disabled:data-[state=indeterminate]:border-disabled disabled:data-[state=indeterminate]:bg-disabled",
        className,
      )}
      {...rest}
      {...defined({ checked, defaultChecked, onCheckedChange, disabled, name })}
      aria-describedby={describedBy(rest["aria-describedby"], description, descriptionId)}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        {checked === "indeterminate" ? (
          <Minus className="size-150" strokeWidth={2.5} />
        ) : (
          <Check className="size-150" strokeWidth={2.5} />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
  return children ? (
    <Choice
      control={box}
      disabled={disabled}
      description={description}
      descriptionId={descriptionId}
    >
      {children}
    </Choice>
  ) : (
    box
  );
}

export type SwitchProps = ChoiceOwnProps & {
  /** On or off. Controlled; pair it with `onCheckedChange`. */
  checked?: boolean | undefined;
  /** The starting state when uncontrolled. */
  defaultChecked?: boolean | undefined;
  /** Called with the new state. The change applies at once; there is no Save. */
  onCheckedChange?: ((checked: boolean) => void) | undefined;
  /** Not available. The last resort: a setting the reader cannot change is shown as text. */
  disabled?: boolean | undefined;
  /** The form field's name, for a native submit. */
  name?: string | undefined;
  /** The name, when there is no label: a switch in a table row. */
  "aria-label"?: string | undefined;
} & Omit<
    ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>,
    | "children"
    | "className"
    | "checked"
    | "defaultChecked"
    | "onCheckedChange"
    | "disabled"
    | "name"
    | "aria-label"
  >;

/** A setting that is on or off and applies the moment it is flipped: a preference, a feature, an inheritance. It never waits for a Save; a choice a form submits is a Checkbox. */
export function Switch({
  children,
  description,
  className,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  name,
  ...rest
}: SwitchProps) {
  const descriptionId = useId();
  const control = (
    <SwitchPrimitive.Root
      className={cn(
        choiceBase,
        "group inline-flex h-250 w-500 items-center rounded-full bg-neutral p-025 data-[state=checked]:bg-brand-bold disabled:bg-disabled disabled:data-[state=checked]:bg-disabled",
        className,
      )}
      {...rest}
      {...defined({ checked, defaultChecked, onCheckedChange, disabled, name })}
      aria-describedby={describedBy(rest["aria-describedby"], description, descriptionId)}
    >
      <SwitchPrimitive.Thumb className="block size-200 rounded-full bg-surface shadow-raised transition-transform duration-medium ease-standard group-disabled:opacity-disabled data-[state=checked]:translate-x-250" />
    </SwitchPrimitive.Root>
  );
  return children ? (
    <Choice
      control={control}
      disabled={disabled}
      description={description}
      descriptionId={descriptionId}
    >
      {children}
    </Choice>
  ) : (
    control
  );
}

export type RadioGroupProps = {
  /** The chosen value, controlled; pair it with `onValueChange`. */
  value?: string | undefined;
  /** The starting value when uncontrolled. Preselect the common answer; leave none only when the choice must be the reader's own. */
  defaultValue?: string | undefined;
  /** Called with the new value. */
  onValueChange?: ((value: string) => void) | undefined;
  /** Not available, for the whole group. */
  disabled?: boolean | undefined;
  /** `vertical`, the rule; `horizontal` for two or three short options in a row. The arrow keys follow. */
  orientation?: "vertical" | "horizontal" | undefined;
  /** The form field's name, for a native submit. */
  name?: string | undefined;
  /** The group's name, when it is not inside a Field with `isGroup`. */
  "aria-label"?: string | undefined;
  /** Set by the Field from `error`. */
  "aria-invalid"?: boolean | undefined;
  /** Set by the Field from `isRequired`. */
  "aria-required"?: boolean | undefined;
  /** Layout only. */
  className?: string | undefined;
  /** `RadioGroup.Item`s. */
  children: ReactNode;
} & Omit<
  ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>,
  | "children"
  | "className"
  | "value"
  | "defaultValue"
  | "onValueChange"
  | "disabled"
  | "orientation"
  | "name"
  | "aria-label"
  | "aria-invalid"
  | "aria-required"
>;

/** One answer from two to five options, every one in view. Inside a Field with `isGroup` for its name, hint and error. More options are a NativeSelect. */
function RadioGroupRoot({
  orientation = "vertical",
  className,
  value,
  defaultValue,
  onValueChange,
  disabled,
  name,
  ...rest
}: RadioGroupProps) {
  return (
    <RadioGroupPrimitive.Root
      orientation={orientation}
      className={cn(
        "flex",
        orientation === "horizontal" ? "flex-row flex-wrap gap-200" : "flex-col gap-100",
        className,
      )}
      {...rest}
      {...defined({ value, defaultValue, onValueChange, disabled, name })}
    />
  );
}

export type RadioGroupItemProps = ChoiceOwnProps & {
  /** The value the group reports when this one is chosen. */
  value: string;
  /** A choice the reader cannot make yet, kept in the list so they know it exists. */
  disabled?: boolean | undefined;
  /** The name, when there is no label. */
  "aria-label"?: string | undefined;
} & Omit<
    ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>,
    "children" | "className" | "value" | "disabled" | "aria-label"
  >;

function RadioGroupItem({ children, description, className, ...props }: RadioGroupItemProps) {
  const descriptionId = useId();
  const dot = (
    <RadioGroupPrimitive.Item
      className={cn(
        choiceBase,
        "group flex size-200 items-center justify-center rounded-full border border-input bg-input data-[state=checked]:border-brand disabled:border-disabled disabled:bg-disabled disabled:data-[state=checked]:border-disabled",
        className,
      )}
      {...props}
      aria-describedby={describedBy(props["aria-describedby"], description, descriptionId)}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <span className="block size-100 rounded-full bg-brand-bold group-disabled:opacity-disabled" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
  return children ? (
    <Choice
      control={dot}
      disabled={props.disabled}
      description={description}
      descriptionId={descriptionId}
    >
      {children}
    </Choice>
  ) : (
    dot
  );
}

export const RadioGroup = Object.assign(RadioGroupRoot, { Item: RadioGroupItem });
