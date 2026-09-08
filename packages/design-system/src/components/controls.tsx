import { ChevronDown } from "lucide-react";
import {
  cloneElement,
  createContext,
  useContext,
  type AriaAttributes,
  isValidElement,
  type ComponentProps,
  type ReactNode,
  useId,
} from "react";

import { cn } from "../lib/cn";

/**
 * The form controls. Field wraps one control with its label, hint and error. Input, NativeSelect
 * and Textarea share `controlBase`, the hairline field on the input surface. Checkbox,
 * Switch and RadioGroup live in their own files with the shadcn Base UI APIs and
 * externally composed labels.
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
