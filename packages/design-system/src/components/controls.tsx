import { createContext, useContext } from "react";

/** The field every control shares: the border on the input surface and its hover, focus, invalid, disabled and read-only looks. The height comes from `controlHeight`. */
export const controlBase =
  "w-full rounded-medium border border-input bg-input px-100 font-body text-default outline-none transition-colors duration-fast ease-standard placeholder:text-subtlest hover:bg-input-hovered focus-visible:bg-input-pressed [&[readonly]]:bg-surface-sunken [&[readonly]]:hover:bg-surface-sunken aria-[invalid=true]:border-danger focus-visible:border-focused focus-visible:outline-field-focused aria-[invalid=true]:focus-visible:border-danger aria-[invalid=true]:focus-visible:outline-field-danger disabled:cursor-not-allowed disabled:border-disabled disabled:bg-disabled disabled:text-disabled";

export type ControlSize = "small" | "medium";

/** `medium` (32px) in a form, beside a medium Button; `small` (28px) in a toolbar, a row or a rail, beside a small Button. */
export const controlHeight: Record<ControlSize, string> = {
  small: "h-control-small",
  medium: "h-control-medium",
};

/* Package-internal: the state a Field and a FieldSet hand to the controls inside them, for what
   Base UI's own Field and Fieldset contexts do not carry. Base UI already passes a Field's
   `invalid` and `disabled`, ids and descriptions; Ledger adds `required` (Base UI takes it on each
   control) and a FieldSet's `disabled` for the span-rooted choice controls, which a native
   `<fieldset disabled>` does not reach. Not exported from the package. */

export type FieldState = {
  /** The Field's `required`, for its control and the label's marker. */
  required: boolean | undefined;
  /** The Field's `disabled` or an ancestor Field's, so a choice in its own nested Field follows a disabled group Field. */
  disabled: boolean | undefined;
  /** FieldError reports a shown message, so the Field is invalid while one is visible. */
  registerError: () => () => void;
  /** The FieldLabel's id, so a Select or Combobox popup list is named by the field's label. */
  labelId: string | undefined;
  registerLabel: (id: string) => () => void;
};

/** The nearest Field, or null outside one. A nested Field starts its own. */
export const FieldStateContext = createContext<FieldState | null>(null);

/** The nearest FieldSet's disabled state (an ancestor's disabled wins), or null outside one. */
export const FieldSetStateContext = createContext<{ disabled: boolean } | null>(null);

/**
 * Set inside a CheckboxGroup, with the Field around it (or null). That Field's `required` belongs
 * to the group, not to each checkbox, and no control announces it, so the legend says it.
 */
export const GroupFieldContext = createContext<{ field: FieldState | null } | null>(null);

/** What a control reads from the Field and FieldSet around it. Explicit props on the control win. */
export function useFieldControlState() {
  const field = useContext(FieldStateContext);
  const group = useContext(GroupFieldContext);
  const fieldSet = useContext(FieldSetStateContext);
  return {
    required: field && field !== group?.field ? field.required : undefined,
    disabled: fieldSet?.disabled ?? false,
    labelId: field?.labelId,
  };
}
