import { createContext, useContext } from "react";

/**
 * The field every text control shares: the border on the input surface and its hover, focus,
 * invalid, disabled and read-only looks. Read-only is the sunken surface with a dashed edge and no
 * hover, so a value that cannot change never looks like a field under the pointer. The height
 * comes from `fieldControlHeight`. Package-internal: Input, Textarea, InputGroup, Select and the
 * date fields compose it.
 */
export const fieldControl =
  "w-full rounded-medium border border-input bg-input px-100 font-body text-default outline-none transition-colors duration-fast ease-standard placeholder:text-subtlest hover:bg-input-hovered focus-visible:bg-input-pressed [&[readonly]]:border-dashed [&[readonly]]:bg-surface-sunken [&[readonly]]:hover:bg-surface-sunken aria-[invalid=true]:border-danger focus-visible:border-focused focus-visible:outline-field-focused aria-[invalid=true]:focus-visible:border-danger aria-[invalid=true]:focus-visible:outline-field-danger disabled:cursor-not-allowed disabled:border-disabled disabled:bg-disabled disabled:text-disabled";

export type ControlSize = "small" | "medium";

/** `medium` (32px) in a form, beside a medium Button; `small` (28px) in a toolbar, a row or a rail, beside a small Button. Package-internal. */
export const fieldControlHeight: Record<ControlSize, string> = {
  small: "h-control-small",
  medium: "h-control-medium",
};

/**
 * @deprecated A class string of the kit's own, not a part: compose Input, Textarea or InputGroup
 * instead. It stays exported for one version and then becomes internal.
 */
export const controlBase = fieldControl;

/**
 * @deprecated A class map of the kit's own, not a part: give Input, Select or a date field `size`
 * instead. It stays exported for one version and then becomes internal.
 */
export const controlHeight = fieldControlHeight;

/**
 * The states Checkbox and Radio share, so the two boxes cannot drift: the 3:1 boundary
 * (`color.border.bold`, WCAG 1.4.11), a hover on the box, invalid as the danger border with the
 * focus outline kept in the focus colour, the brand fill when chosen, and read-only as the sunken
 * surface with the mark in the text colour and no brand fill, so a value that cannot change does
 * not look like one waiting for a click. The 24px touch target is an `::after` around the box.
 * Package-internal.
 */
export const choiceControl = [
  "peer relative inline-flex size-200 shrink-0 items-center justify-center border border-bold bg-input text-inverse outline-none transition-colors duration-fast ease-standard motion-reduce:transition-none after:absolute after:-inset-x-150 after:-inset-y-100",
  "focus-visible:outline-focused aria-invalid:border-danger",
  "not-data-readonly:data-checked:border-brand not-data-readonly:data-checked:bg-brand-bold not-data-readonly:data-indeterminate:border-brand not-data-readonly:data-indeterminate:bg-brand-bold",
  "not-data-disabled:not-data-readonly:not-data-checked:not-data-indeterminate:hover:bg-input-hovered not-data-disabled:not-data-readonly:data-checked:hover:bg-brand-bold-hovered not-data-disabled:not-data-readonly:data-indeterminate:hover:bg-brand-bold-hovered",
  "data-readonly:border-dashed data-readonly:bg-surface-sunken data-readonly:text-default",
  "data-disabled:cursor-not-allowed data-disabled:opacity-disabled",
].join(" ");

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
