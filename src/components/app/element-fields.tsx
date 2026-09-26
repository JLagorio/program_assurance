import { KeyValue } from "@ledger/design-system";
import { labelFor } from "@/lib/records";
import type { ElementType } from "@/lib/program-wizard";
import { ChoiceField, TextField, type ControlRef } from "./fields";

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

type IdentityField = "name" | "code" | "description" | "type";

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
  errors,
  controlRef,
  autoFocus = false,
}: {
  value: { name: string; code: string; description: string; type: ElementType | null };
  onChange: (
    patch: Partial<{ name: string; code: string; description: string; type: ElementType | null }>,
  ) => void;
  /** Why the type cannot change, shown after the type; undefined leaves it editable. */
  typeLocked?: string | undefined;
  descriptionLabel?: string | undefined;
  descriptionHint?: string | undefined;
  codeHint?: string | undefined;
  /** What fixes each field, from the last validation; each shows under its field and marks it invalid. */
  errors?: Partial<Record<IdentityField, string | undefined>> | undefined;
  /** Receives each control, for the Sheet's `initialFocus` (the name) and for focusing an invalid field. */
  controlRef?: ((field: IdentityField) => ControlRef) | undefined;
  /**
   * @deprecated Pass `controlRef` and give the name's control to the Sheet's `initialFocus`: an
   * `autoFocus` inside an overlay becomes the place focus returns to when it closes.
   */
  autoFocus?: boolean | undefined;
}) {
  return (
    <>
      <TextField
        label="Name"
        value={value.name}
        onChange={(name) => onChange({ name })}
        required
        error={errors?.name}
        controlRef={controlRef?.("name")}
        autoFocus={autoFocus}
      />
      <TextField
        label="Code"
        value={value.code}
        onChange={(code) => onChange({ code })}
        required
        description={codeHint}
        error={errors?.code}
        controlRef={controlRef?.("code")}
      />
      <TextField
        label={descriptionLabel}
        value={value.description}
        onChange={(description) => onChange({ description })}
        multiline
        description={descriptionHint}
        error={errors?.description}
        controlRef={controlRef?.("description")}
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
          error={errors?.type}
          controlRef={controlRef?.("type")}
        />
      )}
    </>
  );
}
