import type { ReactNode, RefObject } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@ledger/design-system";
import type { Row } from "@/lib/models";

/**
 * The control's element, for DialogContent `initialFocus`, an ErrorSummary target, or moving focus
 * to the first invalid field: a ref object, or the callback `useFormFeedback().ref(field)` returns.
 */
export type ControlRef = RefObject<HTMLElement | null> | ((node: HTMLElement | null) => void);

function bind(controlRef: ControlRef | undefined) {
  if (!controlRef || typeof controlRef === "function") return controlRef;
  return (node: HTMLElement | null) => {
    controlRef.current = node;
  };
}

/**
 * What every field wrapper shares. The kit Field ties the label, hint and error to the control and
 * carries `required`, `invalid` and `disabled` to it: no ids or ARIA are written here.
 */
type FieldFrameProps = {
  label: string;
  /** Marks the label with the asterisk and announces the requirement. The form checks it on submit. */
  required?: boolean | undefined;
  /** A sentence under the control that helps the reader answer. */
  description?: ReactNode | undefined;
  /** What fixes the field, from the last validation. It marks the field invalid and describes the control. */
  error?: string | undefined;
  /** Disables the control and dims the label. A surrounding FieldSet's `disabled` also reaches it. */
  disabled?: boolean | undefined;
  controlRef?: ControlRef | undefined;
};

export function TextField({
  label,
  value,
  onChange,
  required = false,
  multiline = false,
  description,
  error,
  disabled,
  controlRef,
  placeholder,
  maxLength,
  rows,
  autoFocus = false,
}: FieldFrameProps & {
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean | undefined;
  placeholder?: string | undefined;
  maxLength?: number | undefined;
  rows?: number | undefined;
  /**
   * @deprecated Inside a Dialog or Sheet, pass `controlRef` and give the same ref to the content's
   * `initialFocus`: an `autoFocus` there becomes the place focus returns to when it closes.
   */
  autoFocus?: boolean | undefined;
}) {
  const ref = bind(controlRef);
  const shared = {
    value,
    ...(placeholder ? { placeholder } : {}),
    ...(maxLength !== undefined ? { maxLength } : {}),
    ...(autoFocus ? { autoFocus } : {}),
  };
  return (
    <Field invalid={error ? true : undefined} required={required} disabled={disabled}>
      <FieldLabel>{label}</FieldLabel>
      {multiline ? (
        <Textarea
          ref={ref}
          {...shared}
          {...(rows !== undefined ? { rows } : {})}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <Input ref={ref} {...shared} onChange={(event) => onChange(event.target.value)} />
      )}
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}

/** One of a fixed list of plain words (an enum), in a Select. A record set is a ComboboxField. */
export function ChoiceField({
  label,
  value,
  onChange,
  options,
  required = false,
  description,
  error,
  disabled,
  controlRef,
  placeholder = "Choose…",
  emptyOption,
}: FieldFrameProps & {
  value: string | null;
  onChange: (value: string | null) => void;
  options: { value: string; label: string }[];
  placeholder?: string | undefined;
  /** For an optional choice: the label of a first item that clears the value, such as "No priority". */
  emptyOption?: string | undefined;
}) {
  return (
    <Field invalid={error ? true : undefined} required={required} disabled={disabled}>
      <FieldLabel>{label}</FieldLabel>
      <Select<string> items={options} value={value || null} onValueChange={onChange}>
        <SelectTrigger ref={bind(controlRef)} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {emptyOption ? <SelectItem value={null}>{emptyOption}</SelectItem> : null}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}

/**
 * An option in a ComboboxField; `detail` is quieter text after the label, and is searched too. A
 * detail that repeats the label (a party named by its email) is not shown twice.
 */
export type ComboboxOption = { value: string; label: string; detail?: string | null | undefined };

/**
 * One of many, or a name the reader would type, in a searchable Combobox. The first match is
 * highlighted as the reader types, so Enter chooses it; an optional field can be cleared.
 */
export function ComboboxField({
  label,
  value,
  onChange,
  options,
  required = false,
  description,
  error,
  disabled,
  controlRef,
  placeholder = "Choose…",
  emptyMessage = "No matching records.",
}: FieldFrameProps & {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  options: ComboboxOption[];
  placeholder?: string | undefined;
  emptyMessage?: string | undefined;
}) {
  return (
    <Field invalid={error ? true : undefined} required={required} disabled={disabled}>
      <FieldLabel>{label}</FieldLabel>
      <Combobox<ComboboxOption>
        items={options}
        value={options.find((option) => option.value === value) ?? null}
        isItemEqualToValue={(item, selected) => item.value === selected.value}
        filter={(item, query) =>
          `${item.label} ${item.detail ?? ""}`
            .toLocaleLowerCase()
            .includes(query.toLocaleLowerCase())
        }
        onValueChange={(item) => onChange(item?.value ?? null)}
        autoHighlight
      >
        <ComboboxInput ref={bind(controlRef)} placeholder={placeholder} showClear={!required} />
        <ComboboxContent>
          <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
          <ComboboxList>
            {(item: ComboboxOption) => (
              <ComboboxItem key={item.value} value={item}>
                {item.detail && item.detail !== item.label ? (
                  <>
                    <span className="min-w-0 flex-1">{item.label}</span>
                    <span className="font-body-small text-subtle">{item.detail}</span>
                  </>
                ) : (
                  item.label
                )}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}

/** A person or organization in this workspace, searched by name and email. */
export function PartyField({
  parties,
  placeholder = "Choose a party",
  ...props
}: FieldFrameProps & {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  parties: Row<"parties">[];
  placeholder?: string | undefined;
}) {
  return (
    <ComboboxField
      {...props}
      placeholder={placeholder}
      emptyMessage="No matching parties in this workspace."
      options={parties.map((party) => ({
        value: party.id,
        label: party.name,
        detail: party.email,
      }))}
    />
  );
}
