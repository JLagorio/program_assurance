import { KeyValue } from "@ledger/design-system";
import { labelFor } from "@/lib/records";
import type { ElementType } from "@/lib/program-wizard";
import { ChoiceField, TextField } from "./fields";

export const elementTypeOptions = [
  "subsystem",
  "hardware",
  "software",
  "network",
  "service",
  "facility",
  "data",
  "other",
].map((value) => ({ value, label: value[0]!.toUpperCase() + value.slice(1) }));

/**
 * The identity of one element, shared by the wizard's element sheet and the product structure
 * sheet so both read the same way: Name, Code, a description, and the Type unless the library
 * or the product fixes it.
 */
export function ElementIdentityFields({
  value,
  onChange,
  typeLocked,
  descriptionLabel = "Description",
  descriptionHint,
  codeHint = "Unique within this system.",
  autoFocus = false,
}: {
  value: { name: string; code: string; description: string; type: ElementType | null };
  onChange: (
    patch: Partial<{ name: string; code: string; description: string; type: ElementType | null }>,
  ) => void;
  /** Why the type cannot change, shown after the type; undefined leaves it editable. */
  typeLocked?: string | undefined;
  descriptionLabel?: string;
  descriptionHint?: string | undefined;
  codeHint?: string;
  autoFocus?: boolean;
}) {
  return (
    <>
      <TextField
        label="Name"
        value={value.name}
        onChange={(name) => onChange({ name })}
        required
        autoFocus={autoFocus}
      />
      <TextField
        label="Code"
        value={value.code}
        onChange={(code) => onChange({ code })}
        required
        description={codeHint}
      />
      <TextField
        label={descriptionLabel}
        value={value.description}
        onChange={(description) => onChange({ description })}
        multiline
        {...(descriptionHint ? { description: descriptionHint } : {})}
      />
      {typeLocked ? (
        <KeyValue label="Type">
          {labelFor(value.type ?? "other")} <span className="text-subtle">{typeLocked}</span>
        </KeyValue>
      ) : (
        <ChoiceField
          label="Type"
          value={value.type}
          onChange={(type) => onChange({ type: type as ElementType })}
          options={elementTypeOptions}
          required
        />
      )}
    </>
  );
}
