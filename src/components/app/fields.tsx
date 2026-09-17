import { useId } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  Field,
  FieldDescription,
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

export function TextField({
  label,
  value,
  onChange,
  required = false,
  multiline = false,
  description,
  autoFocus = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  multiline?: boolean;
  description?: string;
  autoFocus?: boolean;
}) {
  const id = useId();
  const props = {
    id,
    value,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange(event.target.value),
    "aria-required": required,
    "aria-describedby": description ? `${id}-help` : undefined,
    autoFocus,
  };
  return (
    <Field>
      <FieldLabel htmlFor={id}>
        {label}
        {required ? (
          <span aria-hidden="true" className="text-danger">
            {" "}
            *
          </span>
        ) : null}
      </FieldLabel>
      {multiline ? <Textarea {...props} /> : <Input {...props} />}
      {description ? <FieldDescription id={`${id}-help`}>{description}</FieldDescription> : null}
    </Field>
  );
}

export function ChoiceField({
  label,
  value,
  onChange,
  options,
  required = false,
  description,
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  description?: string;
}) {
  const id = useId();
  return (
    <Field>
      <FieldLabel id={`${id}-label`} htmlFor={id}>
        {label}
        {required ? (
          <span aria-hidden="true" className="text-danger">
            {" "}
            *
          </span>
        ) : null}
      </FieldLabel>
      <Select<string> items={options} value={value || null} onValueChange={onChange}>
        <SelectTrigger
          id={id}
          className="w-full"
          aria-labelledby={`${id}-label`}
          aria-required={required}
          aria-describedby={description ? `${id}-help` : undefined}
        >
          <SelectValue placeholder="Choose…" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description ? <FieldDescription id={`${id}-help`}>{description}</FieldDescription> : null}
    </Field>
  );
}

export function PartyField({
  label,
  value,
  onChange,
  parties,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  parties: Row<"parties">[];
}) {
  const id = useId();
  const options = parties.map((party) => ({
    value: party.id,
    label: party.name,
    email: party.email,
  }));
  return (
    <Field>
      <FieldLabel id={`${id}-label`} htmlFor={id}>
        {label}
      </FieldLabel>
      <Combobox<(typeof options)[number]>
        items={options}
        value={options.find((item) => item.value === value) ?? null}
        isItemEqualToValue={(item, selected) => item.value === selected.value}
        filter={(item, query) =>
          `${item.label} ${item.email ?? ""}`
            .toLocaleLowerCase()
            .includes(query.toLocaleLowerCase())
        }
        onValueChange={(item) => onChange(item?.value ?? null)}
      >
        <ComboboxInput
          id={id}
          aria-labelledby={`${id}-label`}
          placeholder="Choose a party (optional)"
          showClear
        />
        <ComboboxContent>
          <ComboboxEmpty>No matching parties in this workspace.</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item.value} value={item}>
                <span className="min-w-0 flex-1">{item.label}</span>
                {item.email ? (
                  <span className="font-body-small text-subtle">{item.email}</span>
                ) : null}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </Field>
  );
}
