import { useRecordForm } from "@/lib/record-form";
import { createRisk, riskDraft, saveRiskDraft } from "@/lib/risk-store";
import {
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
  NativeSelect,
  Progress,
  Stack,
  Textarea,
  toast,
} from "@ledger/design-system";
import { useState } from "react";

export function CreateRiskDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
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
      toast.success(asDraft ? "Risk draft saved" : "Risk created", {
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
                    {(field) => (
                      <Field
                        isRequired
                        error={
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined
                        }
                        label="Title"
                      >
                        <Input
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="e.g. Unscoped object references on export endpoint"
                          name={field.name}
                          onBlur={field.handleBlur}
                        />
                      </Field>
                    )}
                  </form.Field>
                  <form.Field name="summary">
                    {(field) => (
                      <Field
                        label="Description"
                        hint="Auditors read this verbatim during sampling."
                        error={
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined
                        }
                      >
                        <Textarea
                          value={field.state.value}
                          onChange={(event) => field.handleChange(event.target.value)}
                          placeholder="What could happen, to which system, and why it matters."
                          name={field.name}
                          onBlur={field.handleBlur}
                        />
                      </Field>
                    )}
                  </form.Field>
                  <Grid
                    gap="space.150"
                    templateColumns={{ base: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }}
                  >
                    <form.Field name="framework">
                      {(field) => (
                        <Field
                          label="Framework"
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
                            {["SOC 2", "ISO 27001", "GDPR", "PCI DSS"].map((f) => (
                              <option key={f}>{f}</option>
                            ))}
                          </NativeSelect>
                        </Field>
                      )}
                    </form.Field>
                    <form.Field name="control">
                      {(field) => (
                        <Field
                          label="Linked control"
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
                            {["CC6.1", "CC6.2", "CC7.2", "CC9.2", "A.8.9"].map((c) => (
                              <option key={c}>{c}</option>
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
                          <Combobox
                            value={field.state.value}
                            onChange={field.handleChange}
                            options={[
                              "Sarah Chen",
                              "Linus Aarto",
                              "Marcus Ryde",
                              "Priya Raghavan",
                            ].map((name) => ({ value: name, label: name }))}
                            placeholder="Choose an owner"
                            searchPlaceholder="Search people…"
                            className="w-full"
                            name={field.name}
                            onBlur={field.handleBlur}
                          />
                        </Field>
                      )}
                    </form.Field>
                    <form.Field name="treatment">
                      {(field) => (
                        <Field
                          label="Treatment"
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
                            {["Mitigate", "Accept", "Transfer", "Avoid"].map((t) => (
                              <option key={t}>{t}</option>
                            ))}
                          </NativeSelect>
                        </Field>
                      )}
                    </form.Field>
                    <form.Field name="likelihood">
                      {(field) => (
                        <Field
                          label="Likelihood (1–5)"
                          error={
                            field.state.meta.isTouched && !field.state.meta.isValid
                              ? [...new Set(field.state.meta.errors)].join(" ")
                              : undefined
                          }
                        >
                          <Input
                            type="number"
                            min={1}
                            max={5}
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            name={field.name}
                            onBlur={field.handleBlur}
                          />
                        </Field>
                      )}
                    </form.Field>
                    <form.Field name="impact">
                      {(field) => (
                        <Field
                          label="Impact (1–5)"
                          error={
                            field.state.meta.isTouched && !field.state.meta.isValid
                              ? [...new Set(field.state.meta.errors)].join(" ")
                              : undefined
                          }
                        >
                          <Input
                            type="number"
                            min={1}
                            max={5}
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            name={field.name}
                            onBlur={field.handleBlur}
                          />
                        </Field>
                      )}
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
