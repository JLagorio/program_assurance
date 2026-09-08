import { useCallback, type SetStateAction, useMemo } from "react";
import { useRecordForm } from "@/lib/record-form";

import {
  Box,
  Button,
  Dialog,
  Field,
  Grid,
  Input,
  NativeSelect,
  Textarea,
} from "@ledger/design-system";
import {
  addRequirement,
  requirementsForProgram,
  verificationMethods,
  type DerivationSource,
  type RequirementType,
  type Requirement,
} from "@/lib/requirements";
import type { VerificationMethod } from "@/lib/spine";

const requirementTypes: RequirementType[] = [
  "System security",
  "Derived",
  "Subsystem",
  "Component",
  "Interface",
  "Process",
  "Assurance",
  "Protection need",
];

const derivationSources: DerivationSource[] = [
  "Control statement",
  "Overlay",
  "Policy",
  "Threat",
  "Architecture decision",
  "Interface contract",
  "Finding",
  "Supplier constraint",
];

/* ------------------------------------------------------ New requirement */

export function NewRequirementModal({
  open,
  onClose,
  programId,
  parentId = null,
  initialControlId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  programId: string;
  parentId?: string | null;
  initialControlId?: string | undefined;
  onCreated?: ((requirement: Requirement) => void) | undefined;
}) {
  const { form, values, setValue, formId, formRef } = useRecordForm(
    {
      text: "",
      type: (initialControlId ? "Derived" : "System security") as RequirementType,
      parent: parentId ?? "",
      owner: "",
      method: "Test" as VerificationMethod,
      criteria: "",
      sourceType: (initialControlId
        ? "Control statement"
        : "Architecture decision") as DerivationSource,
      sourceId: initialControlId ?? "",
      sourceLabel: initialControlId ?? "",
      why: "",
    },
    (value) => ({ text: value.text, owner: value.owner, sourceId: value.sourceId, why: value.why }),
  );
  const { text, type, parent, owner, method, criteria, sourceType, sourceId, sourceLabel, why } =
    values;
  const setText = useCallback(
    (value: SetStateAction<typeof text>) => setValue("text", value),
    [setValue],
  );

  const setOwner = useCallback(
    (value: SetStateAction<typeof owner>) => setValue("owner", value),
    [setValue],
  );

  const setCriteria = useCallback(
    (value: SetStateAction<typeof criteria>) => setValue("criteria", value),
    [setValue],
  );

  const setSourceId = useCallback(
    (value: SetStateAction<typeof sourceId>) => setValue("sourceId", value),
    [setValue],
  );
  const setSourceLabel = useCallback(
    (value: SetStateAction<typeof sourceLabel>) => setValue("sourceLabel", value),
    [setValue],
  );
  const setWhy = useCallback(
    (value: SetStateAction<typeof why>) => setValue("why", value),
    [setValue],
  );

  const candidates = useMemo(() => requirementsForProgram(programId), [programId]);

  const reset = () => {
    setValue("type", initialControlId ? "Derived" : "System security");
    setValue("sourceType", initialControlId ? "Control statement" : "Architecture decision");
    setValue("parent", parentId ?? "");
    setValue("method", "Test");
    setText("");
    setOwner("");
    setCriteria("");
    setSourceId(initialControlId ?? "");
    setSourceLabel(initialControlId ?? "");
    setWhy("");
  };

  const submit = () => {
    return form.handleSubmit({
      save: () => {
        const created = addRequirement({
          program: programId,
          parent: parent || null,
          type,
          text: text.trim(),
          owner: owner.trim(),
          method,
          successCriteria: criteria.trim() || "—",
          derivations: [
            {
              relation: "derived",
              sourceType,
              sourceId: sourceId.trim(),
              sourceLabel: sourceLabel.trim() || sourceId.trim(),
              rationale: why.trim(),
            },
          ],
        });
        reset();
        onClose();
        onCreated?.(created);
      },
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={initialControlId ? "Derive requirement" : "New requirement"}
      width="large"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            type="submit"
            form={formId + "-1"}
            disabled={form.state.isSubmitting}
          >
            Create requirement
          </Button>
        </>
      }
    >
      <form
        id={formId + "-1"}
        ref={formRef}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <Grid gap="space.150">
          <form.Field name="text">
            {(field) => (
              <Field
                isRequired
                error={
                  field.state.meta.isTouched && !field.state.meta.isValid
                    ? [...new Set(field.state.meta.errors)].join(" ")
                    : undefined
                }
                label="Shall statement"
                hint="One obligation, testable, no compound clauses."
              >
                <Textarea
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="The system shall …"
                  name={field.name}
                  onBlur={field.handleBlur}
                />
              </Field>
            )}
          </form.Field>
          <Grid gap="space.150" templateColumns={{ sm: "repeat(3, minmax(0, 1fr))" }}>
            <form.Field name="type">
              {(field) => (
                <Field
                  label="Type"
                  error={
                    field.state.meta.isTouched && !field.state.meta.isValid
                      ? [...new Set(field.state.meta.errors)].join(" ")
                      : undefined
                  }
                >
                  <NativeSelect
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value as RequirementType)}
                    name={field.name}
                    onBlur={field.handleBlur}
                  >
                    {requirementTypes.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </NativeSelect>
                </Field>
              )}
            </form.Field>
            <form.Field name="parent">
              {(field) => (
                <Field
                  label="Decomposes"
                  hint="Leave blank for a top-level obligation."
                  error={
                    field.state.meta.isTouched && !field.state.meta.isValid
                      ? [...new Set(field.state.meta.errors)].join(" ")
                      : undefined
                  }
                >
                  <NativeSelect
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    name={field.name}
                    onBlur={field.handleBlur}
                  >
                    <option value="">— none —</option>
                    {candidates.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.id}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              )}
            </form.Field>
            <form.Field name="owner">
              {(field) => (
                <Field
                  isRequired
                  error={
                    field.state.meta.isTouched && !field.state.meta.isValid
                      ? [...new Set(field.state.meta.errors)].join(" ")
                      : undefined
                  }
                  label="Owner"
                >
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Accountable engineer"
                    name={field.name}
                    onBlur={field.handleBlur}
                  />
                </Field>
              )}
            </form.Field>
          </Grid>
          <Grid gap="space.150" templateColumns={{ sm: "140px minmax(0,1fr)" }}>
            <form.Field name="method">
              {(field) => (
                <Field
                  label="Verification method"
                  error={
                    field.state.meta.isTouched && !field.state.meta.isValid
                      ? [...new Set(field.state.meta.errors)].join(" ")
                      : undefined
                  }
                >
                  <NativeSelect
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value as VerificationMethod)}
                    name={field.name}
                    onBlur={field.handleBlur}
                  >
                    {verificationMethods.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </NativeSelect>
                </Field>
              )}
            </form.Field>
            <form.Field name="criteria">
              {(field) => (
                <Field
                  label="Success criteria"
                  error={
                    field.state.meta.isTouched && !field.state.meta.isValid
                      ? [...new Set(field.state.meta.errors)].join(" ")
                      : undefined
                  }
                >
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="The observable that decides this is met"
                    name={field.name}
                    onBlur={field.handleBlur}
                  />
                </Field>
              )}
            </form.Field>
          </Grid>

          <Box className="border-t border-default pt-150" paddingBlockStart="space.050">
            <Box
              className="font-heading-xxsmall uppercase text-subtlest"
              paddingBlockEnd="space.100"
            >
              Source
            </Box>
            <Grid gap="space.150" templateColumns={{ sm: "repeat(3, minmax(0, 1fr))" }}>
              <form.Field name="sourceType">
                {(field) => (
                  <Field
                    label="Source type"
                    error={
                      field.state.meta.isTouched && !field.state.meta.isValid
                        ? [...new Set(field.state.meta.errors)].join(" ")
                        : undefined
                    }
                  >
                    <NativeSelect
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value as DerivationSource)}
                      name={field.name}
                      onBlur={field.handleBlur}
                    >
                      {derivationSources.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </NativeSelect>
                  </Field>
                )}
              </form.Field>
              <form.Field name="sourceId">
                {(field) => (
                  <Field
                    isRequired
                    error={
                      field.state.meta.isTouched && !field.state.meta.isValid
                        ? [...new Set(field.state.meta.errors)].join(" ")
                        : undefined
                    }
                    label="Source"
                    hint="SI-7(1), THR-0309, CMP-008 …"
                  >
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      name={field.name}
                      onBlur={field.handleBlur}
                    />
                  </Field>
                )}
              </form.Field>
              <form.Field name="sourceLabel">
                {(field) => (
                  <Field
                    label="Source name"
                    error={
                      field.state.meta.isTouched && !field.state.meta.isValid
                        ? [...new Set(field.state.meta.errors)].join(" ")
                        : undefined
                    }
                  >
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      name={field.name}
                      onBlur={field.handleBlur}
                    />
                  </Field>
                )}
              </form.Field>
            </Grid>
            <form.Field name="why">
              {(field) => (
                <Field
                  isRequired
                  error={
                    field.state.meta.isTouched && !field.state.meta.isValid
                      ? [...new Set(field.state.meta.errors)].join(" ")
                      : undefined
                  }
                  className="pt-150"
                  label="Rationale"
                >
                  <Textarea
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    name={field.name}
                    onBlur={field.handleBlur}
                  />
                </Field>
              )}
            </form.Field>
          </Box>
        </Grid>
      </form>
    </Dialog>
  );
}
