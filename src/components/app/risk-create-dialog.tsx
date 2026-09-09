import {
  FieldLabel,
  FieldError,
  FieldDescription,
  ComboboxInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Box,
  Button,
  Combobox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Eyebrow,
  Field,
  Grid,
  Id,
  Inline,
  Input,
  Progress,
  Stack,
  Textarea,
  toast,
} from "@ledger/design-system";
import { useRecordForm } from "@/lib/record-form";
import { createRisk, riskDraft, saveRiskDraft } from "@/lib/risk-store";
import { useId, useState } from "react";

export function CreateRiskDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const fieldId = useId();

  const { form, values, formId, formRef } = useRecordForm(
    {
      title: riskDraft()?.title ?? "",
      summary: riskDraft()?.summary ?? "",
      framework: riskDraft()?.framework ?? "SOC 2",
      control: riskDraft()?.control ?? "CC6.1",
      owner: riskDraft()?.owner ?? "Sarah Chen",
      treatment: riskDraft()?.treatment ?? "Mitigate",
      likelihood: riskDraft()?.likelihood ?? "3",
      impact: riskDraft()?.impact ?? "4",
    },
    (value) => ({ title: value.title, owner: value.owner }),
  );
  const { title, summary, framework, control, owner, treatment, likelihood, impact } = values;

  const [saveError, setSaveError] = useState("");

  const inherent = Number(likelihood) * Number(impact) * 4;
  const residual = inherent;
  const draft = { title, summary, framework, control, owner, treatment, likelihood, impact };
  const save = (asDraft: boolean) => {
    setSaveError("");
    try {
      if (asDraft) saveRiskDraft(draft);
      else createRisk(draft);
      toast.add({
        title: asDraft ? "Risk draft saved" : "Risk created",
        type: "success",
        description: "Saved in this browser.",
      });
      onClose();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Risk could not be saved.");
    }
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
          <DialogTitle>Create a risk</DialogTitle>
          <DialogDescription>
            Score the initial risk from likelihood × impact. Saved records and drafts stay in this
            browser.
          </DialogDescription>
        </DialogHeader>
        <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none">
          <Box className="grid grid-cols-1 md:grid-cols-3">
            <Box className="px-250 py-200 md:col-span-2">
              <form
                id={formId}
                ref={formRef}
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  void form.handleSubmit({ save: () => save(false) });
                }}
              >
                <Stack space="space.150">
                  {saveError ? (
                    <p role="alert" className="text-danger">
                      {saveError}
                    </p>
                  ) : null}
                  <form.Field name="title">
                    {(field) => {
                      const fieldError1 =
                        field.state.meta.isTouched && !field.state.meta.isValid
                          ? [...new Set(field.state.meta.errors)].join(" ")
                          : undefined;
                      return (
                        <Field data-invalid={Boolean(fieldError1)}>
                          <FieldLabel
                            id={`${fieldId}-title-1-label`}
                            htmlFor={`${fieldId}-title-1`}
                          >
                            {"Title"}
                            <span aria-hidden="true" className="text-danger">
                              {" "}
                              *
                            </span>
                          </FieldLabel>
                          <Input
                            id={`${fieldId}-title-1`}
                            aria-labelledby={`${fieldId}-title-1-label`}
                            aria-required={true}
                            aria-invalid={Boolean(fieldError1)}
                            aria-describedby={
                              fieldError1 ? `${fieldId}-title-1-message` : undefined
                            }
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="e.g. Unscoped object references on export endpoint"
                            name={field.name}
                            onBlur={field.handleBlur}
                          />
                          {fieldError1 ? (
                            <FieldError id={`${fieldId}-title-1-message`}>{fieldError1}</FieldError>
                          ) : null}
                        </Field>
                      );
                    }}
                  </form.Field>
                  <form.Field name="summary">
                    {(field) => {
                      const fieldError2 =
                        field.state.meta.isTouched && !field.state.meta.isValid
                          ? [...new Set(field.state.meta.errors)].join(" ")
                          : undefined;
                      return (
                        <Field data-invalid={Boolean(fieldError2)}>
                          <FieldLabel
                            id={`${fieldId}-description-2-label`}
                            htmlFor={`${fieldId}-description-2`}
                          >
                            {"Description"}
                          </FieldLabel>
                          <Textarea
                            id={`${fieldId}-description-2`}
                            aria-labelledby={`${fieldId}-description-2-label`}
                            aria-invalid={Boolean(fieldError2)}
                            aria-describedby={`${fieldId}-description-2-message`}
                            value={field.state.value}
                            onChange={(event) => field.handleChange(event.target.value)}
                            placeholder="What could happen, to which system, and why it matters."
                            name={field.name}
                            onBlur={field.handleBlur}
                          />
                          {fieldError2 ? (
                            <FieldError id={`${fieldId}-description-2-message`}>
                              {fieldError2}
                            </FieldError>
                          ) : (
                            <FieldDescription id={`${fieldId}-description-2-message`}>
                              {"Auditors read this verbatim during sampling."}
                            </FieldDescription>
                          )}
                        </Field>
                      );
                    }}
                  </form.Field>
                  <Grid
                    gap="space.150"
                    templateColumns={{ base: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }}
                  >
                    <form.Field name="framework">
                      {(field) => {
                        const valueItems = ["SOC 2", "ISO 27001", "GDPR", "PCI DSS"].map((f) => ({
                          value: f,
                          label: f,
                        }));
                        const fieldError3 =
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined;
                        return (
                          <Field data-invalid={Boolean(fieldError3)}>
                            <FieldLabel
                              id={`${fieldId}-framework-3-label`}
                              htmlFor={`${fieldId}-framework-3`}
                            >
                              {"Framework"}
                            </FieldLabel>
                            <Select<string>
                              items={valueItems}
                              value={field.state.value}
                              onValueChange={(value) => {
                                if (value === null) return;
                                return field.handleChange(value);
                              }}
                              name={field.name}
                            >
                              <SelectTrigger
                                id={`${fieldId}-framework-3`}
                                aria-labelledby={`${fieldId}-framework-3-label`}
                                aria-invalid={Boolean(fieldError3)}
                                aria-describedby={
                                  fieldError3 ? `${fieldId}-framework-3-message` : undefined
                                }
                                className="w-full"
                                onBlur={field.handleBlur}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent aria-labelledby={`${fieldId}-framework-3-label`}>
                                {valueItems.map((item) => (
                                  <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {fieldError3 ? (
                              <FieldError id={`${fieldId}-framework-3-message`}>
                                {fieldError3}
                              </FieldError>
                            ) : null}
                          </Field>
                        );
                      }}
                    </form.Field>
                    <form.Field name="control">
                      {(field) => {
                        const valueItems2 = ["CC6.1", "CC6.2", "CC7.2", "CC9.2", "A.8.9"].map(
                          (c) => ({
                            value: c,
                            label: c,
                          }),
                        );
                        const fieldError4 =
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined;
                        return (
                          <Field data-invalid={Boolean(fieldError4)}>
                            <FieldLabel
                              id={`${fieldId}-linked-control-4-label`}
                              htmlFor={`${fieldId}-linked-control-4`}
                            >
                              {"Linked control"}
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
                                id={`${fieldId}-linked-control-4`}
                                aria-labelledby={`${fieldId}-linked-control-4-label`}
                                aria-invalid={Boolean(fieldError4)}
                                aria-describedby={
                                  fieldError4 ? `${fieldId}-linked-control-4-message` : undefined
                                }
                                className="w-full"
                                onBlur={field.handleBlur}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent aria-labelledby={`${fieldId}-linked-control-4-label`}>
                                {valueItems2.map((item) => (
                                  <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {fieldError4 ? (
                              <FieldError id={`${fieldId}-linked-control-4-message`}>
                                {fieldError4}
                              </FieldError>
                            ) : null}
                          </Field>
                        );
                      }}
                    </form.Field>
                    <form.Field name="owner">
                      {(field) => {
                        const valueItems4 = [
                          "Sarah Chen",
                          "Linus Aarto",
                          "Marcus Ryde",
                          "Priya Raghavan",
                        ].map((name) => ({ value: name, label: name }));
                        const fieldError5 =
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined;
                        return (
                          <Field data-invalid={Boolean(fieldError5)}>
                            <FieldLabel
                              id={`${fieldId}-owner-5-label`}
                              htmlFor={`${fieldId}-owner-5`}
                            >
                              {"Owner"}
                              <span aria-hidden="true" className="text-danger">
                                {" "}
                                *
                              </span>
                            </FieldLabel>
                            <div className={"w-full"}>
                              <Combobox<(typeof valueItems4)[number]>
                                items={valueItems4}

                                isItemEqualToValue={(item, selected) =>
                                  item.value === selected.value
                                }
                                filter={(item, query) =>
                                  [item.label, item.value, "keywords" in item ? item.keywords : ""]
                                    .join(" ")
                                    .toLocaleLowerCase()
                                    .includes(query.toLocaleLowerCase())
                                }
                                value={
                                  valueItems4.find((item) => item.value === field.state.value) ??
                                  null
                                }
                                onValueChange={(item) => field.handleChange(item?.value ?? "")}
                                name={field.name}
                              >
                                <ComboboxInput
                                  id={`${fieldId}-owner-5`}
                                  aria-labelledby={`${fieldId}-owner-5-label`}
                                  aria-required={true}
                                  aria-invalid={Boolean(fieldError5)}
                                  aria-describedby={
                                    fieldError5 ? `${fieldId}-owner-5-message` : undefined
                                  }
                                  placeholder="Choose an owner"
                                  onBlur={field.handleBlur}
                                />
                                <ComboboxContent>
                                  <ComboboxEmpty>{"No matches."}</ComboboxEmpty>
                                  <ComboboxList aria-labelledby={`${fieldId}-owner-5-label`}>
                                    {(item) => (
                                      <ComboboxItem
                                        key={item.value}
                                        value={item}
                                        disabled={"disabled" in item && Boolean(item.disabled)}
                                      >
                                        <span className="min-w-0 flex-1">{item.label}</span>
                                        {"meta" in item && item.meta ? (
                                          <span className="text-subtle font-body-small">
                                            {String(item.meta)}
                                          </span>
                                        ) : null}
                                      </ComboboxItem>
                                    )}
                                  </ComboboxList>
                                </ComboboxContent>
                              </Combobox>
                            </div>
                            {fieldError5 ? (
                              <FieldError id={`${fieldId}-owner-5-message`}>
                                {fieldError5}
                              </FieldError>
                            ) : null}
                          </Field>
                        );
                      }}
                    </form.Field>
                    <form.Field name="treatment">
                      {(field) => {
                        const valueItems3 = ["Mitigate", "Accept", "Transfer", "Avoid"].map(
                          (t) => ({
                            value: t,
                            label: t,
                          }),
                        );
                        const fieldError6 =
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined;
                        return (
                          <Field data-invalid={Boolean(fieldError6)}>
                            <FieldLabel
                              id={`${fieldId}-treatment-6-label`}
                              htmlFor={`${fieldId}-treatment-6`}
                            >
                              {"Treatment"}
                            </FieldLabel>
                            <Select<string>
                              items={valueItems3}
                              value={field.state.value}
                              onValueChange={(value) => {
                                if (value === null) return;
                                return field.handleChange(value);
                              }}
                              name={field.name}
                            >
                              <SelectTrigger
                                id={`${fieldId}-treatment-6`}
                                aria-labelledby={`${fieldId}-treatment-6-label`}
                                aria-invalid={Boolean(fieldError6)}
                                aria-describedby={
                                  fieldError6 ? `${fieldId}-treatment-6-message` : undefined
                                }
                                className="w-full"
                                onBlur={field.handleBlur}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent aria-labelledby={`${fieldId}-treatment-6-label`}>
                                {valueItems3.map((item) => (
                                  <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {fieldError6 ? (
                              <FieldError id={`${fieldId}-treatment-6-message`}>
                                {fieldError6}
                              </FieldError>
                            ) : null}
                          </Field>
                        );
                      }}
                    </form.Field>
                    <form.Field name="likelihood">
                      {(field) => {
                        const fieldError7 =
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined;
                        return (
                          <Field data-invalid={Boolean(fieldError7)}>
                            <FieldLabel
                              id={`${fieldId}-likelihood-1-5-7-label`}
                              htmlFor={`${fieldId}-likelihood-1-5-7`}
                            >
                              {"Likelihood (1–5)"}
                            </FieldLabel>
                            <Input
                              id={`${fieldId}-likelihood-1-5-7`}
                              aria-labelledby={`${fieldId}-likelihood-1-5-7-label`}
                              aria-invalid={Boolean(fieldError7)}
                              aria-describedby={
                                fieldError7 ? `${fieldId}-likelihood-1-5-7-message` : undefined
                              }
                              type="number"
                              min={1}
                              max={5}
                              value={field.state.value}
                              onChange={(e) => field.handleChange(e.target.value)}
                              name={field.name}
                              onBlur={field.handleBlur}
                            />
                            {fieldError7 ? (
                              <FieldError id={`${fieldId}-likelihood-1-5-7-message`}>
                                {fieldError7}
                              </FieldError>
                            ) : null}
                          </Field>
                        );
                      }}
                    </form.Field>
                    <form.Field name="impact">
                      {(field) => {
                        const fieldError8 =
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined;
                        return (
                          <Field data-invalid={Boolean(fieldError8)}>
                            <FieldLabel
                              id={`${fieldId}-impact-1-5-8-label`}
                              htmlFor={`${fieldId}-impact-1-5-8`}
                            >
                              {"Impact (1–5)"}
                            </FieldLabel>
                            <Input
                              id={`${fieldId}-impact-1-5-8`}
                              aria-labelledby={`${fieldId}-impact-1-5-8-label`}
                              aria-invalid={Boolean(fieldError8)}
                              aria-describedby={
                                fieldError8 ? `${fieldId}-impact-1-5-8-message` : undefined
                              }
                              type="number"
                              min={1}
                              max={5}
                              value={field.state.value}
                              onChange={(e) => field.handleChange(e.target.value)}
                              name={field.name}
                              onBlur={field.handleBlur}
                            />
                            {fieldError8 ? (
                              <FieldError id={`${fieldId}-impact-1-5-8-message`}>
                                {fieldError8}
                              </FieldError>
                            ) : null}
                          </Field>
                        );
                      }}
                    </form.Field>
                  </Grid>
                </Stack>
              </form>
            </Box>
            <Box className="border-t border-default bg-surface-sunken px-250 py-200 md:border-s md:border-t-0">
              <div>
                <Eyebrow>Preview</Eyebrow>
                <Box paddingBlockStart="space.150">
                  <Box
                    className="rounded-medium border border-default bg-surface"
                    padding="space.150"
                  >
                    <Id className="text-subtle">New risk</Id>
                    <Box className="font-body font-medium" paddingBlockStart="space.050">
                      {title || "Untitled risk"}
                    </Box>
                    <Box className="font-body-small text-subtle" paddingBlockStart="space.050">
                      {framework} · {control} · {owner}
                    </Box>
                    <dl className="pt-150 space-y-100 border-t border-default">
                      <Inline
                        className="font-body-small"
                        alignBlock="center"
                        spread="space-between"
                      >
                        <dt className="text-subtle">Inherent</dt>
                        <dd className="tabular-nums font-medium">{inherent}</dd>
                      </Inline>
                      <Inline
                        className="font-body-small"
                        alignBlock="center"
                        spread="space-between"
                      >
                        <dt className="text-subtle">Residual</dt>
                        <dd className="tabular-nums font-medium">{residual}</dd>
                      </Inline>
                      <Progress
                        value={residual}
                        tone={residual > 60 ? "danger" : residual > 30 ? "warning" : "success"}
                        aria-hidden
                      />
                    </dl>
                  </Box>
                </Box>
                <p className="pt-150 font-body-small text-subtle">
                  The initial residual score equals the inherent score until a treatment is
                  assessed.
                </p>
              </div>
            </Box>
          </Box>
        </Box>
        <DialogFooter>
          <>
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={() => save(true)}>
              Save draft
            </Button>
            <Button
              variant="primary"
              type="submit"
              form={formId}
              disabled={form.state.isSubmitting}
            >
              Create risk
            </Button>
          </>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
