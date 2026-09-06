import { useLedgerLocale } from "../lib/locale";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { Check, ChevronDown, Minus } from "lucide-react";
import {
  cloneElement,
  createContext,
  useContext,
  type AriaAttributes,
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

type FieldBinding = {
  controlId: string;
  labelId: string;
  messageId?: string | undefined;
  invalid: boolean;
  required: boolean;
  group: boolean;
};
const FieldContext = createContext<FieldBinding | null>(null);

/** Bind a native or custom control, including controls behind wrappers and fragments. */
export function useFieldControl<P extends AriaAttributes & { id?: string | undefined }>(
  props: P,
  groupContainer = false,
) {
  const field = useContext(FieldContext);
  const receivesName = field && (!field.group || groupContainer);
  return {
    ...props,
    ...(receivesName
      ? {
          id: props.id ?? field.controlId,
          "aria-labelledby":
            props["aria-labelledby"] ?? (props["aria-label"] ? undefined : field.labelId),
        }
      : {}),
    "aria-invalid": field?.invalid || props["aria-invalid"],
    "aria-required": (receivesName && field.required) || props["aria-required"],
    "aria-describedby":
      [
        ...new Set(
          [props["aria-describedby"], field?.messageId]
            .filter(Boolean)
            .flatMap((value) => value!.split(/\s+/)),
        ),
      ].join(" ") || undefined,
  };
}

export type FieldProps = {
  /** The control's name, read by the label and by assistive technology. Sentence case, no colon. */
  label: ReactNode;
  /** Stable control ID for external labels or custom controls. Otherwise generated. */
  controlId?: string | undefined;
  /** Shown under the control and read as its description: the format, the reason, the consequence. A full sentence. */
  hint?: ReactNode;
  /** Replaces the hint, marks the control invalid (its border turns) and is announced as an alert. */
  error?: ReactNode;
  /** Paints the asterisk and sets aria-required. Not the browser's `required`: validation belongs to the form (see the TanStack Forms pattern). */
  isRequired?: boolean | undefined;
  /** The child is a group, a RadioGroup or several Checkboxes in a Stack: the Field renders a fieldset with the label as its legend, so the group is named, and the hint or the error describes the group. */
  isGroup?: boolean | undefined;
  children: ReactNode;
  className?: string | undefined;
};

export function Field({
  label,
  controlId: suppliedId,
  hint,
  error,
  isRequired,
  isGroup,
  children,
  className,
}: FieldProps) {
  const id = useId();
  const childId =
    isValidElement<{ id?: string }>(children) &&
    (typeof children.type !== "string" ||
      ["input", "textarea", "select", "button"].includes(children.type))
      ? children.props.id
      : undefined;
  const controlId = suppliedId ?? childId ?? `${id}-control`;
  const labelId = `${id}-label`;
  const messageId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const binding: FieldBinding = {
    controlId,
    labelId,
    messageId,
    invalid: Boolean(error),
    required: Boolean(isRequired),
    group: Boolean(isGroup),
  };
  // Only clone native controls. Components bind through useFieldControl; structural wrappers never receive the control ID.
  const control =
    isValidElement<AriaAttributes & { id?: string }>(children) &&
    typeof children.type === "string" &&
    ["input", "textarea", "select", "button"].includes(children.type)
      ? cloneElement(children, {
          ...(!isGroup
            ? { id: controlId, "aria-labelledby": children.props["aria-labelledby"] ?? labelId }
            : {}),
          ...(error ? { "aria-invalid": true } : {}),
          ...(isRequired && !isGroup ? { "aria-required": true } : {}),
          ...(messageId
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
      <FieldContext.Provider value={binding}>
        <fieldset
          className={cn("min-w-0", className)}
          aria-describedby={messageId}
          aria-invalid={error ? true : undefined}
          data-invalid={error ? true : undefined}
        >
          <legend id={labelId} className="font-body-small font-medium text-subtle">
            {labelText}
          </legend>
          <div className="flex flex-col gap-050 pt-050">
            {control}
            {message}
          </div>
        </fieldset>
      </FieldContext.Provider>
    );
  }
  return (
    <FieldContext.Provider value={binding}>
      <div
        className={cn("flex flex-col gap-050", className)}
        data-invalid={error ? true : undefined}
      >
        <label id={labelId} htmlFor={controlId} className="font-body-small font-medium text-subtle">
          {labelText}
        </label>
        {control}
        {message}
      </div>
    </FieldContext.Provider>
  );
}

/** The field every control shares: the border on the input surface and its hover, focus, invalid, disabled and read-only looks. The height comes from `controlHeight`. */
export const controlBase =
  "w-full rounded-medium border border-input bg-input px-100 font-body text-default outline-none transition-colors duration-fast ease-standard placeholder:text-subtlest hover:bg-input-hovered focus-visible:bg-input-pressed [&[readonly]]:bg-surface-sunken [&[readonly]]:hover:bg-surface-sunken aria-[invalid=true]:border-danger focus-visible:border-focused focus-visible:outline-focused disabled:cursor-not-allowed disabled:border-disabled disabled:bg-disabled disabled:text-disabled";

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
  const bound = useFieldControl(props);
  return (
    <input
      className={cn(
        controlBase,
        controlHeight[size],
        "[&::-webkit-search-cancel-button]:appearance-none",
        className,
      )}
      {...bound}
    />
  );
}

export type NativeSelectProps = {
  /** `medium` (32px) in a form; `small` (28px) as a toolbar's filter or a row's cell, beside small Buttons. */
  size?: ControlSize;
} & Omit<ComponentProps<"select">, "size">;

/** The browser's own select with the kit's look: a short, plain list the reader picks one of. The chevron is a real icon, so it follows the colour mode. `className` goes to the wrapper. */
export function NativeSelect({ size = "medium", className, ...props }: NativeSelectProps) {
  const bound = useFieldControl(props);
  return (
    <span className={cn("relative block w-full", className)}>
      <select
        className={cn(controlBase, controlHeight[size], "appearance-none pe-400")}
        {...bound}
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
  const bound = useFieldControl(props);
  return (
    <textarea className={cn(controlBase, "min-h-800 resize-y py-075", className)} {...bound} />
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
  rest = useFieldControl(rest);
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
  rest = useFieldControl(rest);
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
      <SwitchPrimitive.Thumb className="block size-200 rounded-full bg-surface shadow-raised transition-transform duration-micro ease-standard group-disabled:opacity-disabled data-[state=checked]:translate-x-250 rtl:data-[state=checked]:-translate-x-250" />
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
  dir,
  orientation = "vertical",
  className,
  value,
  defaultValue,
  onValueChange,
  disabled,
  name,
  ...rest
}: RadioGroupProps) {
  const { direction } = useLedgerLocale();
  rest = useFieldControl(rest, true);
  return (
    <RadioGroupPrimitive.Root
      dir={dir ?? direction}
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
