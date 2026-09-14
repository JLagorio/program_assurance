import {
  FieldLabel,
  FieldDescription,
  FieldError,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  Grid,
  Input,
  Textarea,
} from "@ledger/design-system";
import { useRecordForm } from "@/lib/record-form";
import { useId, useCallback, useMemo, type SetStateAction } from "react";
import {
  addRequirement,
  requirementsForProgram,
  verificationMethods,
  type DerivationSource,
  type Requirement,
  type RequirementType,
} from "@/lib/requirements";
import { type VerificationMethod } from "@/lib/spine";

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
  const fieldId = useId();

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
      relation: (initialControlId ? "derived" : "mapped") as "mapped" | "derived",
      why: "",
    },
    (value) => ({ text: value.text, owner: value.owner, sourceId: value.sourceId, why: value.why }),
  );
  const {
    text,
    type,
    parent,
    owner,
    method,
    criteria,
    sourceType,
    sourceId,
    sourceLabel,
    relation,
    why,
  } = values;
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
    setValue("relation", initialControlId ? "derived" : "mapped");
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
              relation:
                sourceType === "Control statement" || sourceType === "Overlay"
                  ? relation
                  : "derived",
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
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <DialogContent
        style={{ maxWidth: ({ medium: 520, large: 860 } as const)["large"] }}
        className="top-200 translate-y-0 sm:top-600"
      >
        <DialogHeader>
          <DialogTitle>{initialControlId ? "Derive requirement" : "New requirement"}</DialogTitle>
        </DialogHeader>
        <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none px-250 py-200">
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
                {(field) => {
                  const fieldError1 =
                    field.state.meta.isTouched && !field.state.meta.isValid
                      ? [...new Set(field.state.meta.errors)].join(" ")
                      : undefined;
                  return (
                    <Field data-invalid={Boolean(fieldError1)}>
                      <FieldLabel
                        id={`${fieldId}-shall-statement-1-label`}
                        htmlFor={`${fieldId}-shall-statement-1`}
                      >
                        {"Shall statement"}
                        <span aria-hidden="true" className="text-danger">
                          {" "}
                          *
                        </span>
                      </FieldLabel>
                      <Textarea
                        id={`${fieldId}-shall-statement-1`}
                        aria-labelledby={`${fieldId}-shall-statement-1-label`}
                        aria-required={true}
                        aria-invalid={Boolean(fieldError1)}
                        aria-describedby={`${fieldId}-shall-statement-1-message`}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="The system shall …"
                        name={field.name}
                        onBlur={field.handleBlur}
                      />
                      {fieldError1 ? (
                        <FieldError id={`${fieldId}-shall-statement-1-message`}>
                          {fieldError1}
                        </FieldError>
                      ) : (
                        <FieldDescription id={`${fieldId}-shall-statement-1-message`}>
                          {"One obligation, testable, no compound clauses."}
                        </FieldDescription>
                      )}
                    </Field>
                  );
                }}
              </form.Field>
              <Grid gap="space.150" templateColumns={{ sm: "repeat(3, minmax(0, 1fr))" }}>
                <form.Field name="type">
                  {(field) => {
                    const valueItems = requirementTypes.map((t) => ({ value: t, label: t }));
                    const fieldError2 =
                      field.state.meta.isTouched && !field.state.meta.isValid
                        ? [...new Set(field.state.meta.errors)].join(" ")
                        : undefined;
                    return (
                      <Field data-invalid={Boolean(fieldError2)}>
                        <FieldLabel id={`${fieldId}-type-2-label`} htmlFor={`${fieldId}-type-2`}>
                          {"Type"}
                        </FieldLabel>
                        <Select<string>
                          items={valueItems}
                          value={field.state.value}
                          onValueChange={(value) => {
                            if (value === null) return;
                            return field.handleChange(value as RequirementType);
                          }}
                          name={field.name}
                        >
                          <SelectTrigger
                            id={`${fieldId}-type-2`}
                            aria-labelledby={`${fieldId}-type-2-label`}
                            aria-invalid={Boolean(fieldError2)}
                            aria-describedby={fieldError2 ? `${fieldId}-type-2-message` : undefined}
                            className="w-full"
                            onBlur={field.handleBlur}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent aria-labelledby={`${fieldId}-type-2-label`}>
                            {valueItems.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldError2 ? (
                          <FieldError id={`${fieldId}-type-2-message`}>{fieldError2}</FieldError>
                        ) : null}
                      </Field>
                    );
                  }}
                </form.Field>
                <form.Field name="parent">
                  {(field) => {
                    const valueItems2 = [
                      { value: "", label: "— none —" },
                      ...candidates.map((r) => ({ value: r.id, label: r.id })),
                    ];
                    const fieldError3 =
                      field.state.meta.isTouched && !field.state.meta.isValid
                        ? [...new Set(field.state.meta.errors)].join(" ")
                        : undefined;
                    return (
                      <Field data-invalid={Boolean(fieldError3)}>
                        <FieldLabel
                          id={`${fieldId}-decomposes-3-label`}
                          htmlFor={`${fieldId}-decomposes-3`}
                        >
                          {"Decomposes"}
                        </FieldLabel>
                        <Select<string>
                          items={valueItems2}
                          value={field.state.value}
                          onValueChange={(value) => {
                            if (value === null) return;
                            return field.handleChange(value);
                          }}
                          name={field.name}
                        >
                          <SelectTrigger
                            id={`${fieldId}-decomposes-3`}
                            aria-labelledby={`${fieldId}-decomposes-3-label`}
                            aria-invalid={Boolean(fieldError3)}
                            aria-describedby={`${fieldId}-decomposes-3-message`}
                            className="w-full"
                            onBlur={field.handleBlur}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent aria-labelledby={`${fieldId}-decomposes-3-label`}>
                            {valueItems2.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldError3 ? (
                          <FieldError id={`${fieldId}-decomposes-3-message`}>
                            {fieldError3}
                          </FieldError>
                        ) : (
                          <FieldDescription id={`${fieldId}-decomposes-3-message`}>
                            {"Leave blank for a top-level obligation."}
                          </FieldDescription>
                        )}
                      </Field>
                    );
                  }}
                </form.Field>
                <form.Field name="owner">
                  {(field) => {
                    const fieldError4 =
                      field.state.meta.isTouched && !field.state.meta.isValid
                        ? [...new Set(field.state.meta.errors)].join(" ")
                        : undefined;
                    return (
                      <Field data-invalid={Boolean(fieldError4)}>
                        <FieldLabel id={`${fieldId}-owner-4-label`} htmlFor={`${fieldId}-owner-4`}>
                          {"Owner"}
                          <span aria-hidden="true" className="text-danger">
                            {" "}
                            *
                          </span>
                        </FieldLabel>
                        <Input
                          id={`${fieldId}-owner-4`}
                          aria-labelledby={`${fieldId}-owner-4-label`}
                          aria-required={true}
                          aria-invalid={Boolean(fieldError4)}
                          aria-describedby={fieldError4 ? `${fieldId}-owner-4-message` : undefined}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Accountable engineer"
                          name={field.name}
                          onBlur={field.handleBlur}
                        />
                        {fieldError4 ? (
                          <FieldError id={`${fieldId}-owner-4-message`}>{fieldError4}</FieldError>
                        ) : null}
                      </Field>
                    );
                  }}
                </form.Field>
              </Grid>
              <Grid gap="space.150" templateColumns={{ sm: "140px minmax(0,1fr)" }}>
                <form.Field name="method">
                  {(field) => {
                    const valueItems3 = verificationMethods.map((m) => ({ value: m, label: m }));
                    const fieldError5 =
                      field.state.meta.isTouched && !field.state.meta.isValid
                        ? [...new Set(field.state.meta.errors)].join(" ")
                        : undefined;
                    return (
                      <Field data-invalid={Boolean(fieldError5)}>
                        <FieldLabel
                          id={`${fieldId}-verification-method-5-label`}
                          htmlFor={`${fieldId}-verification-method-5`}
                        >
                          {"Verification method"}
                        </FieldLabel>
                        <Select<string>
                          items={valueItems3}
                          value={field.state.value}
                          onValueChange={(value) => {
                            if (value === null) return;
                            return field.handleChange(value as VerificationMethod);
                          }}
                          name={field.name}
                        >
                          <SelectTrigger
                            id={`${fieldId}-verification-method-5`}
                            aria-labelledby={`${fieldId}-verification-method-5-label`}
                            aria-invalid={Boolean(fieldError5)}
                            aria-describedby={
                              fieldError5 ? `${fieldId}-verification-method-5-message` : undefined
                            }
                            className="w-full"
                            onBlur={field.handleBlur}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent aria-labelledby={`${fieldId}-verification-method-5-label`}>
                            {valueItems3.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldError5 ? (
                          <FieldError id={`${fieldId}-verification-method-5-message`}>
                            {fieldError5}
                          </FieldError>
                        ) : null}
                      </Field>
                    );
                  }}
                </form.Field>
                <form.Field name="criteria">
                  {(field) => {
                    const fieldError6 =
                      field.state.meta.isTouched && !field.state.meta.isValid
                        ? [...new Set(field.state.meta.errors)].join(" ")
                        : undefined;
                    return (
                      <Field data-invalid={Boolean(fieldError6)}>
                        <FieldLabel
                          id={`${fieldId}-success-criteria-6-label`}
                          htmlFor={`${fieldId}-success-criteria-6`}
                        >
                          {"Success criteria"}
                        </FieldLabel>
                        <Input
                          id={`${fieldId}-success-criteria-6`}
                          aria-labelledby={`${fieldId}-success-criteria-6-label`}
                          aria-invalid={Boolean(fieldError6)}
                          aria-describedby={
                            fieldError6 ? `${fieldId}-success-criteria-6-message` : undefined
                          }
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="The observable that decides this is met"
                          name={field.name}
                          onBlur={field.handleBlur}
                        />
                        {fieldError6 ? (
                          <FieldError id={`${fieldId}-success-criteria-6-message`}>
                            {fieldError6}
                          </FieldError>
                        ) : null}
                      </Field>
                    );
                  }}
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
                    {(field) => {
                      const valueItems4 = derivationSources.map((d) => ({ value: d, label: d }));
                      const fieldError7 =
                        field.state.meta.isTouched && !field.state.meta.isValid
                          ? [...new Set(field.state.meta.errors)].join(" ")
                          : undefined;
                      return (
                        <Field data-invalid={Boolean(fieldError7)}>
                          <FieldLabel
                            id={`${fieldId}-source-type-7-label`}
                            htmlFor={`${fieldId}-source-type-7`}
                          >
                            {"Source type"}
                          </FieldLabel>
                          <Select<string>
                            items={valueItems4}
                            value={field.state.value}
                            onValueChange={(value) => {
                              if (value === null) return;
                              return field.handleChange(value as DerivationSource);
                            }}
                            name={field.name}
                          >
                            <SelectTrigger
                              id={`${fieldId}-source-type-7`}
                              aria-labelledby={`${fieldId}-source-type-7-label`}
                              aria-invalid={Boolean(fieldError7)}
                              aria-describedby={
                                fieldError7 ? `${fieldId}-source-type-7-message` : undefined
                              }
                              className="w-full"
                              onBlur={field.handleBlur}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent aria-labelledby={`${fieldId}-source-type-7-label`}>
                              {valueItems4.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {fieldError7 ? (
                            <FieldError id={`${fieldId}-source-type-7-message`}>
                              {fieldError7}
                            </FieldError>
                          ) : null}
                        </Field>
                      );
                    }}
                  </form.Field>
                  <form.Field name="sourceId">
                    {(field) => {
                      const fieldError8 =
                        field.state.meta.isTouched && !field.state.meta.isValid
                          ? [...new Set(field.state.meta.errors)].join(" ")
                          : undefined;
                      return (
                        <Field data-invalid={Boolean(fieldError8)}>
                          <FieldLabel
                            id={`${fieldId}-source-8-label`}
                            htmlFor={`${fieldId}-source-8`}
                          >
                            {"Source"}
                            <span aria-hidden="true" className="text-danger">
                              {" "}
                              *
                            </span>
                          </FieldLabel>
                          <Input
                            id={`${fieldId}-source-8`}
                            aria-labelledby={`${fieldId}-source-8-label`}
                            aria-required={true}
                            aria-invalid={Boolean(fieldError8)}
                            aria-describedby={`${fieldId}-source-8-message`}
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            name={field.name}
                            onBlur={field.handleBlur}
                          />
                          {fieldError8 ? (
                            <FieldError id={`${fieldId}-source-8-message`}>
                              {fieldError8}
                            </FieldError>
                          ) : (
                            <FieldDescription id={`${fieldId}-source-8-message`}>
                              {"SI-7(1), THR-0309, CMP-008 …"}
                            </FieldDescription>
                          )}
                        </Field>
                      );
                    }}
                  </form.Field>
                  <form.Field name="sourceLabel">
                    {(field) => {
                      const fieldError9 =
                        field.state.meta.isTouched && !field.state.meta.isValid
                          ? [...new Set(field.state.meta.errors)].join(" ")
                          : undefined;
                      return (
                        <Field data-invalid={Boolean(fieldError9)}>
                          <FieldLabel
                            id={`${fieldId}-source-name-9-label`}
                            htmlFor={`${fieldId}-source-name-9`}
                          >
                            {"Source name"}
                          </FieldLabel>
                          <Input
                            id={`${fieldId}-source-name-9`}
                            aria-labelledby={`${fieldId}-source-name-9-label`}
                            aria-invalid={Boolean(fieldError9)}
                            aria-describedby={
                              fieldError9 ? `${fieldId}-source-name-9-message` : undefined
                            }
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            name={field.name}
                            onBlur={field.handleBlur}
                          />
                          {fieldError9 ? (
                            <FieldError id={`${fieldId}-source-name-9-message`}>
                              {fieldError9}
                            </FieldError>
                          ) : null}
                        </Field>
                      );
                    }}
                  </form.Field>
                </Grid>
                {sourceType === "Control statement" || sourceType === "Overlay" ? (
                  <form.Field name="relation">
                    {(field) => {
                      const valueItems5 = [
                        {
                          value: "mapped",
                          label: "Mapped to — supports a control",
                        },
                        {
                          value: "derived",
                          label: "Derived from — the control is its source",
                        },
                      ];
                      return (
                        <Field className="pt-150">
                          <FieldLabel
                            id={`${fieldId}-control-relationship-10-label`}
                            htmlFor={`${fieldId}-control-relationship-10`}
                          >
                            {"Control relationship"}
                          </FieldLabel>
                          <Select<string>
                            items={valueItems5}
                            name={field.name}
                            value={field.state.value}
                            onValueChange={(value) => {
                              if (value === null) return;
                              return field.handleChange(value as typeof relation);
                            }}
                          >
                            <SelectTrigger
                              id={`${fieldId}-control-relationship-10`}
                              aria-labelledby={`${fieldId}-control-relationship-10-label`}
                              className="w-full"
                              onBlur={field.handleBlur}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent
                              aria-labelledby={`${fieldId}-control-relationship-10-label`}
                            >
                              {valueItems5.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                      );
                    }}
                  </form.Field>
                ) : null}
                <form.Field name="why">
                  {(field) => {
                    const fieldError11 =
                      field.state.meta.isTouched && !field.state.meta.isValid
                        ? [...new Set(field.state.meta.errors)].join(" ")
                        : undefined;
                    return (
                      <Field className="pt-150" data-invalid={Boolean(fieldError11)}>
                        <FieldLabel
                          id={`${fieldId}-rationale-11-label`}
                          htmlFor={`${fieldId}-rationale-11`}
                        >
                          {"Rationale"}
                          <span aria-hidden="true" className="text-danger">
                            {" "}
                            *
                          </span>
                        </FieldLabel>
                        <Textarea
                          id={`${fieldId}-rationale-11`}
                          aria-labelledby={`${fieldId}-rationale-11-label`}
                          aria-required={true}
                          aria-invalid={Boolean(fieldError11)}
                          aria-describedby={
                            fieldError11 ? `${fieldId}-rationale-11-message` : undefined
                          }
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          name={field.name}
                          onBlur={field.handleBlur}
                        />
                        {fieldError11 ? (
                          <FieldError id={`${fieldId}-rationale-11-message`}>
                            {fieldError11}
                          </FieldError>
                        ) : null}
                      </Field>
                    );
                  }}
                </form.Field>
              </Box>
            </Grid>
          </form>
        </Box>
        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
