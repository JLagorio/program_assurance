import {
  FieldLabel,
  FieldError,
  FieldDescription,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Dot,
  Eyebrow,
  Field,
  Grid,
  Id,
  Inline,
  Input,
  Section,
  Stack,
  Table,
  Textarea,
  Timeline,
  toast,
} from "@ledger/design-system";
import { useRecordForm } from "@/lib/record-form";
import { Check, Pencil, Send, X } from "lucide-react";
import { useId, useCallback, useMemo, useRef, useState, type SetStateAction } from "react";
import { type ImpactLevel } from "@/lib/grc-data";
import {
  approvalTone,
  classifications,
  computeTailoring,
  connectivityOptions,
  defaultParameters,
  hostingOptions,
  impactLevels,
  scopeApprovals,
  scopeHistory,
  systemClasses,
  type ApprovalState,
  type Classification,
  type Connectivity,
  type Hosting,
  type ScopeEvent,
  type SystemClass,
  type SystemParameters,
} from "@/lib/tailoring";

const actionTone = {
  Added: "success",
  "Tailored out": "danger",
  "Parameter set": "information",
} as const;

function now() {
  return new Date().toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function TailoringSection({
  programId,
  programOwner,
}: {
  programId: string;
  programOwner: string;
}) {
  const fieldId = useId();

  const alertCancelRef = useRef<HTMLButtonElement>(null);

  const [params, setParams] = useState<SystemParameters>(defaultParameters);
  const [editing, setEditing] = useState(false);
  const { form, values, setValue, formId, formRef } = useRecordForm(
    {
      draft: defaultParameters as SystemParameters,
      message: "",
      note: "",
    },
    (value) => ({
      message: submitting && value.message,
      note: deciding === "changes" && value.note,
    }),
  );
  const { draft, message, note } = values;
  const setDraft = useCallback(
    (value: SetStateAction<typeof draft>) => setValue("draft", value),
    [setValue],
  );

  const setNote = useCallback(
    (value: SetStateAction<typeof note>) => setValue("note", value),
    [setValue],
  );
  const [submitting, setSubmitting] = useState(false);

  const [deciding, setDeciding] = useState<null | "approve" | "changes">(null);

  const seed = scopeApprovals.find((a) => a.programId === programId);
  const [state, setState] = useState<ApprovalState>(seed?.state ?? "Draft");
  const [decision, setDecision] = useState<{ by: string; at: string; note: string | null } | null>(
    seed?.decidedBy ? { by: seed.decidedBy, at: seed.decided!, note: seed.note } : null,
  );
  const [history, setHistory] = useState<ScopeEvent[]>(scopeHistory[programId] ?? []);

  const result = useMemo(() => computeTailoring(params), [params]);

  function log(text: string, actor: string, tone: ScopeEvent["tone"]) {
    setHistory((h) => [{ at: now(), actor, text, tone }, ...h]);
  }

  function saveParams() {
    setParams(draft);
    setEditing(false);
    setState("Draft");
    setDecision(null);
    log("System parameters updated — scope recomputed", "Sarah Chen (SSE)", "neutral");
  }

  function submit() {
    setSubmitting(false);
    setState("Pending PM approval");
    log(
      `Submitted tailored scope for PM approval — ${result.total} controls, ${result.overlays.length} overlays`,
      "Sarah Chen (SSE)",
      "information",
    );
    toast.add({
      title: "Scope sent for PM approval",
      type: "success",
      description: `${programId} · ${result.total} controls · ${result.overlays.length} overlays`,
    });
  }

  function decide(kind: "approve" | "changes") {
    const approved = kind === "approve";
    setState(approved ? "Approved" : "Changes requested");
    setDecision({ by: `${programOwner} (PM)`, at: now(), note: note || null });
    log(
      approved
        ? `Compliance scope approved — engineering may baseline ${result.total} controls`
        : `Changes requested on tailored scope${note ? ` — ${note}` : ""}`,
      `${programOwner} (PM)`,
      approved ? "success" : "danger",
    );
    setDeciding(null);
    setNote("");
  }

  return (
    <>
      <Stack space="space.300">
        {/* ------------------------------------------------ approval banner */}
        <Inline
          className="rounded-medium border border-default bg-surface-sunken px-150 py-100"
          space="space.150"
          alignBlock="center"
          shouldWrap
        >
          <Badge variant="secondary" tone={approvalTone[state]}>
            {state}
          </Badge>
          <span className="min-w-0 flex-1 truncate font-body-small text-subtle">
            {state === "Approved"
              ? `Approved by ${decision?.by ?? "—"} on ${decision?.at ?? "—"}${decision?.note ? ` · ${decision.note}` : ""}`
              : state === "Changes requested"
                ? `${decision?.by ?? "PM"} requested changes${decision?.note ? ` · ${decision.note}` : ""}`
                : state === "Pending PM approval"
                  ? `Awaiting ${programOwner} (PM) — engineering should not baseline until the scope is approved`
                  : "Draft scope — submit to the program manager before engineering begins"}
          </span>
          {state === "Pending PM approval" ? (
            <Inline as="span" space="space.100" alignBlock="center">
              <Button variant="secondary" onClick={() => setDeciding("changes")} iconBefore={<X />}>
                Request changes
              </Button>
              <Button
                variant="primary"
                onClick={() => setDeciding("approve")}
                iconBefore={<Check />}
              >
                Approve scope
              </Button>
            </Inline>
          ) : (
            <Button variant="primary" onClick={() => setSubmitting(true)} iconBefore={<Send />}>
              Submit for approval
            </Button>
          )}
        </Inline>

        {/* --------------------------------------------- system parameters */}
        <Section
          title="System parameters"
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setDraft(params);
                setEditing(true);
              }}
              iconBefore={<Pencil />}
            >
              Edit parameters
            </Button>
          }
        >
          <dl className="grid grid-cols-2 gap-x-400 pt-050 lg:grid-cols-4">
            {[
              ["Confidentiality", params.confidentiality],
              ["Integrity", params.integrity],
              ["Availability", params.availability],
              ["High-water mark", result.impact],
              ["System class", params.systemClass],
              ["Hosting", params.hosting],
              ["Classification", params.classification],
              ["Connectivity", params.connectivity],
              ["Handles PII", params.handlesPii ? "Yes" : "No"],
              ["Cross domain", params.crossDomain ? "Yes" : "No"],
              ["Safety critical", params.safetyCritical ? "Yes" : "No"],
              ["Baseline", result.baselineLabel.replace("NIST SP 800-53 Rev. 5 — ", "")],
            ].map(([k, v]) => (
              <Inline
                key={k}
                className="border-b border-default py-075"
                space="space.150"
                alignBlock="baseline"
                spread="space-between"
              >
                <dt className="truncate font-body-small text-subtle">{k}</dt>
                <dd className="truncate font-body-small font-medium">{v}</dd>
              </Inline>
            ))}
          </dl>
        </Section>

        {/* ------------------------------------------------------ overlays */}
        <Section
          title="Selected overlays"
          description={`${result.overlays.length} overlays triggered by the parameters above.`}
        >
          <Table className="table-fixed">
            <thead>
              <tr>
                <Table.Header width={164}>Overlay ID</Table.Header>
                <Table.Header width={232}>Name</Table.Header>
                <Table.Header width={212}>Authority</Table.Header>
                <Table.Header>Trigger</Table.Header>
                <Table.Header className="text-right" width={76}>
                  Δ ctrl
                </Table.Header>
              </tr>
            </thead>
            <tbody>
              {result.overlays.map((o) => {
                const delta =
                  o.controls.filter((c) => c.action === "Added").length -
                  o.controls.filter((c) => c.action === "Tailored out").length;
                return (
                  <Table.Row key={o.id}>
                    <Table.Cell width={164}>
                      <Id>{o.id}</Id>
                    </Table.Cell>
                    <Table.Cell className="truncate" width={232}>
                      {o.name}
                    </Table.Cell>
                    <Table.Cell className="truncate" width={212}>
                      {o.authority}
                    </Table.Cell>
                    <Table.Cell className="truncate">{o.trigger}</Table.Cell>
                    <Table.Cell className="tabular-nums text-right" width={76}>
                      {delta > 0 ? `+${delta}` : delta}
                    </Table.Cell>
                  </Table.Row>
                );
              })}
              {result.overlays.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={5}>
                    No overlays apply — the stock baseline stands.
                  </Table.Cell>
                </Table.Row>
              ) : null}
            </tbody>
          </Table>
        </Section>

        {/* --------------------------------------------------- control delta */}
        <Section
          title="Tailoring actions"
          description={`${result.baselineCount} baseline controls · +${result.added.length} added · −${result.removed.length} tailored out · ${result.total} in scope.`}
        >
          <Table className="table-fixed">
            <thead>
              <tr>
                <Table.Header width={96}>Control</Table.Header>
                <Table.Header width={292}>Title</Table.Header>
                <Table.Header width={132}>Action</Table.Header>
                <Table.Header width={188}>Overlay</Table.Header>
                <Table.Header>Rationale</Table.Header>
              </tr>
            </thead>
            <tbody>
              {result.overlays.flatMap((o) =>
                o.controls.map((c) => (
                  <Table.Row key={`${o.id}-${c.id}`}>
                    <Table.Cell width={96}>
                      <Id>{c.id}</Id>
                    </Table.Cell>
                    <Table.Cell className="truncate" width={292}>
                      {c.title}
                    </Table.Cell>
                    <Table.Cell width={132}>
                      <Badge variant="secondary" tone={actionTone[c.action]}>
                        {c.action}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell className="truncate" width={188}>
                      {o.name}
                    </Table.Cell>
                    <Table.Cell className="truncate">{c.rationale}</Table.Cell>
                  </Table.Row>
                )),
              )}
            </tbody>
          </Table>
        </Section>

        {/* -------------------------------------------------------- history */}
        <Section title="Scope history">
          <Timeline className="pt-100">
            {history.map((e, i) => (
              <Timeline.Item
                key={`${e.at}-${i}`}
                tone={e.tone}
                title={e.text}
                meta={e.actor}
                time={e.at}
              />
            ))}
          </Timeline>
        </Section>
      </Stack>

      {/* ------------------------------------------------ parameters modal */}
      <Dialog
        open={editing}
        onOpenChange={(next) => {
          if (!next) {
            setEditing(false);
          }
        }}
      >
        <DialogContent
          style={{ maxWidth: ({ medium: 520, large: 860 } as const)["large"] }}
          className="top-200 translate-y-0 sm:top-600"
        >
          <DialogHeader>
            <DialogTitle>System parameters</DialogTitle>
            <DialogDescription>
              The engine recomputes the baseline and overlays as you type.
            </DialogDescription>
          </DialogHeader>
          <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none">
            <Box className="grid grid-cols-1 md:grid-cols-3">
              <Box className="px-250 py-200 md:col-span-2">
                <Stack space="space.150">
                  <Grid
                    gap="space.150"
                    templateColumns={{ base: "minmax(0, 1fr)", md: "repeat(3, minmax(0, 1fr))" }}
                  >
                    {(["confidentiality", "integrity", "availability"] as const).map((k) => {
                      const draftkItems = impactLevels.map((l) => ({ value: l, label: l }));
                      return (
                        <Field key={k}>
                          <FieldLabel
                            id={`${fieldId}-field-1-${encodeURIComponent(String(k))}-label`}
                            htmlFor={`${fieldId}-field-1-${encodeURIComponent(String(k))}`}
                          >
                            {k.charAt(0).toUpperCase() + k.slice(1)}
                          </FieldLabel>
                          <Select<string>
                            items={draftkItems}
                            value={draft[k]}
                            onValueChange={(value) => {
                              if (value === null) return;
                              return setDraft({ ...draft, [k]: value as ImpactLevel });
                            }}
                          >
                            <SelectTrigger
                              id={`${fieldId}-field-1-${encodeURIComponent(String(k))}`}
                              aria-labelledby={`${fieldId}-field-1-${encodeURIComponent(String(k))}-label`}
                              className="w-full"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent
                              aria-labelledby={`${fieldId}-field-1-${encodeURIComponent(String(k))}-label`}
                            >
                              {draftkItems.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                      );
                    })}
                  </Grid>
                  <Grid
                    gap="space.150"
                    templateColumns={{ base: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }}
                  >
                    <form.Field name="draft.systemClass">
                      {(field) => {
                        const valueItems = systemClasses.map((s) => ({ value: s, label: s }));
                        const fieldError2 =
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined;
                        return (
                          <Field data-invalid={Boolean(fieldError2)}>
                            <FieldLabel
                              id={`${fieldId}-system-class-2-label`}
                              htmlFor={`${fieldId}-system-class-2`}
                            >
                              {"System class"}
                            </FieldLabel>
                            <Select<string>
                              items={valueItems}
                              value={field.state.value}
                              onValueChange={(value) => {
                                if (value === null) return;
                                return field.handleChange(value as SystemClass);
                              }}
                              name={field.name}
                            >
                              <SelectTrigger
                                id={`${fieldId}-system-class-2`}
                                aria-labelledby={`${fieldId}-system-class-2-label`}
                                aria-invalid={Boolean(fieldError2)}
                                aria-describedby={
                                  fieldError2 ? `${fieldId}-system-class-2-message` : undefined
                                }
                                className="w-full"
                                onBlur={field.handleBlur}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent aria-labelledby={`${fieldId}-system-class-2-label`}>
                                {valueItems.map((item) => (
                                  <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {fieldError2 ? (
                              <FieldError id={`${fieldId}-system-class-2-message`}>
                                {fieldError2}
                              </FieldError>
                            ) : null}
                          </Field>
                        );
                      }}
                    </form.Field>
                    <form.Field name="draft.hosting">
                      {(field) => {
                        const valueItems2 = hostingOptions.map((s) => ({ value: s, label: s }));
                        const fieldError3 =
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined;
                        return (
                          <Field data-invalid={Boolean(fieldError3)}>
                            <FieldLabel
                              id={`${fieldId}-hosting-3-label`}
                              htmlFor={`${fieldId}-hosting-3`}
                            >
                              {"Hosting"}
                            </FieldLabel>
                            <Select<string>
                              items={valueItems2}
                              value={field.state.value}
                              onValueChange={(value) => {
                                if (value === null) return;
                                return field.handleChange(value as Hosting);
                              }}
                              name={field.name}
                            >
                              <SelectTrigger
                                id={`${fieldId}-hosting-3`}
                                aria-labelledby={`${fieldId}-hosting-3-label`}
                                aria-invalid={Boolean(fieldError3)}
                                aria-describedby={
                                  fieldError3 ? `${fieldId}-hosting-3-message` : undefined
                                }
                                className="w-full"
                                onBlur={field.handleBlur}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent aria-labelledby={`${fieldId}-hosting-3-label`}>
                                {valueItems2.map((item) => (
                                  <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {fieldError3 ? (
                              <FieldError id={`${fieldId}-hosting-3-message`}>
                                {fieldError3}
                              </FieldError>
                            ) : null}
                          </Field>
                        );
                      }}
                    </form.Field>
                  </Grid>
                  <Grid
                    gap="space.150"
                    templateColumns={{ base: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }}
                  >
                    <form.Field name="draft.classification">
                      {(field) => {
                        const valueItems3 = classifications.map((s) => ({ value: s, label: s }));
                        const fieldError4 =
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined;
                        return (
                          <Field data-invalid={Boolean(fieldError4)}>
                            <FieldLabel
                              id={`${fieldId}-classification-4-label`}
                              htmlFor={`${fieldId}-classification-4`}
                            >
                              {"Classification"}
                            </FieldLabel>
                            <Select<string>
                              items={valueItems3}
                              value={field.state.value}
                              onValueChange={(value) => {
                                if (value === null) return;
                                return field.handleChange(value as Classification);
                              }}
                              name={field.name}
                            >
                              <SelectTrigger
                                id={`${fieldId}-classification-4`}
                                aria-labelledby={`${fieldId}-classification-4-label`}
                                aria-invalid={Boolean(fieldError4)}
                                aria-describedby={
                                  fieldError4 ? `${fieldId}-classification-4-message` : undefined
                                }
                                className="w-full"
                                onBlur={field.handleBlur}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent aria-labelledby={`${fieldId}-classification-4-label`}>
                                {valueItems3.map((item) => (
                                  <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {fieldError4 ? (
                              <FieldError id={`${fieldId}-classification-4-message`}>
                                {fieldError4}
                              </FieldError>
                            ) : null}
                          </Field>
                        );
                      }}
                    </form.Field>
                    <form.Field name="draft.connectivity">
                      {(field) => {
                        const valueItems4 = connectivityOptions.map((s) => ({
                          value: s,
                          label: s,
                        }));
                        const fieldError5 =
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined;
                        return (
                          <Field data-invalid={Boolean(fieldError5)}>
                            <FieldLabel
                              id={`${fieldId}-connectivity-5-label`}
                              htmlFor={`${fieldId}-connectivity-5`}
                            >
                              {"Connectivity"}
                            </FieldLabel>
                            <Select<string>
                              items={valueItems4}
                              value={field.state.value}
                              onValueChange={(value) => {
                                if (value === null) return;
                                return field.handleChange(value as Connectivity);
                              }}
                              name={field.name}
                            >
                              <SelectTrigger
                                id={`${fieldId}-connectivity-5`}
                                aria-labelledby={`${fieldId}-connectivity-5-label`}
                                aria-invalid={Boolean(fieldError5)}
                                aria-describedby={
                                  fieldError5 ? `${fieldId}-connectivity-5-message` : undefined
                                }
                                className="w-full"
                                onBlur={field.handleBlur}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent aria-labelledby={`${fieldId}-connectivity-5-label`}>
                                {valueItems4.map((item) => (
                                  <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {fieldError5 ? (
                              <FieldError id={`${fieldId}-connectivity-5-message`}>
                                {fieldError5}
                              </FieldError>
                            ) : null}
                          </Field>
                        );
                      }}
                    </form.Field>
                  </Grid>
                  <Inline
                    className="border-t border-default pt-150"
                    space="space.250"
                    alignBlock="center"
                    shouldWrap
                  >
                    {(
                      [
                        ["handlesPii", "Stores or processes PII"],
                        ["crossDomain", "Crosses security domains"],
                        ["safetyCritical", "Safety-critical function"],
                      ] as const
                    ).map(([key, label]) => (
                      <label
                        key={key}
                        className="inline-flex items-center gap-100 font-body text-default"
                      >
                        <Checkbox
                          checked={draft[key]}
                          onCheckedChange={(checked) => setDraft({ ...draft, [key]: checked })}
                        />
                        <span className="select-none">{label}</span>
                      </label>
                    ))}
                  </Inline>
                </Stack>
              </Box>
              <Box className="border-t border-default bg-surface-sunken px-250 py-200 md:border-s md:border-t-0">
                <ScopePreview params={draft} />
              </Box>
            </Box>
          </Box>
          <DialogFooter>
            <>
              <Button variant="subtle" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={saveParams}>
                Save and recompute
              </Button>
            </>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --------------------------------------------------- submit modal */}
      <AlertDialog
        open={submitting}
        onOpenChange={(next, details) => {
          if (!next) {
            if (form.state.isSubmitting) {
              details.cancel();
              return;
            }
            setSubmitting(false);
          }
        }}
      >
        <AlertDialogContent
          initialFocus={alertCancelRef}
          className="top-200 translate-y-0 sm:top-1000"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Submit scope for PM approval</AlertDialogTitle>
            <AlertDialogDescription>{`${programId} · ${result.total} controls · ${result.overlays.length} overlays. The PM sees the tailored scope on the approvals dashboard and every stage below Categorize locks until they decide.`}</AlertDialogDescription>
            <form
              id={formId + "-1"}
              ref={formRef}
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                void form.handleSubmit({
                  save: () => {
                    submit();
                  },
                });
              }}
            >
              <Stack space="space.150">
                <Field>
                  <FieldLabel id={`${fieldId}-approver-6-label`} htmlFor={`${fieldId}-approver-6`}>
                    {"Approver"}
                  </FieldLabel>
                  <Input
                    id={`${fieldId}-approver-6`}
                    aria-labelledby={`${fieldId}-approver-6-label`}
                    defaultValue={`${programOwner} (PM)`}
                    readOnly
                  />
                </Field>
                <form.Field name="message">
                  {(field) => {
                    const fieldError7 =
                      field.state.meta.isTouched && !field.state.meta.isValid
                        ? [...new Set(field.state.meta.errors)].join(" ")
                        : undefined;
                    return (
                      <Field data-invalid={Boolean(fieldError7)}>
                        <FieldLabel
                          id={`${fieldId}-message-7-label`}
                          htmlFor={`${fieldId}-message-7`}
                        >
                          {"Message"}
                          <span aria-hidden="true" className="text-danger">
                            {" "}
                            *
                          </span>
                        </FieldLabel>
                        <Textarea
                          id={`${fieldId}-message-7`}
                          aria-labelledby={`${fieldId}-message-7-label`}
                          aria-required={true}
                          aria-invalid={Boolean(fieldError7)}
                          aria-describedby={`${fieldId}-message-7-message`}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Tailored scope reflects the DDIL tactical profile agreed at the SRR working group."
                          name={field.name}
                          onBlur={field.handleBlur}
                        />
                        {fieldError7 ? (
                          <FieldError id={`${fieldId}-message-7-message`}>{fieldError7}</FieldError>
                        ) : (
                          <FieldDescription id={`${fieldId}-message-7-message`}>
                            {"Shown on the shared scope approvals dashboard."}
                          </FieldDescription>
                        )}
                      </Field>
                    );
                  }}
                </form.Field>
              </Stack>
            </form>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel ref={alertCancelRef} disabled={form.state.isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="primary"
              isLoading={form.state.isSubmitting}
              onClick={() => {
                if (form.state.isSubmitting) return;
                (() => {
                  return form.handleSubmit({
                    save: () => {
                      submit();
                    },
                  });
                })();
              }}
            >
              Send for approval
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* -------------------------------------------------- decision modal */}
      <Dialog
        open={deciding !== null}
        onOpenChange={(next) => {
          if (!next) {
            setDeciding(null);
          }
        }}
      >
        <DialogContent style={{ maxWidth: 520 }} className="top-200 translate-y-0 sm:top-600">
          <DialogHeader>
            <DialogTitle>
              {deciding === "approve" ? "Approve compliance scope" : "Request changes"}
            </DialogTitle>
            <DialogDescription>{`${programId} · ${result.total} controls · ${result.overlays.length} overlays`}</DialogDescription>
          </DialogHeader>
          <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none px-250 py-200">
            <form
              id={formId + "-2"}
              ref={formRef}
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                void form.handleSubmit({
                  save: () => {
                    decide(deciding ?? "approve");
                  },
                });
              }}
            >
              <form.Field name="note">
                {(field) => {
                  const fieldError8 =
                    field.state.meta.isTouched && !field.state.meta.isValid
                      ? [...new Set(field.state.meta.errors)].join(" ")
                      : undefined;
                  const fieldHint8 =
                    deciding === "approve"
                      ? "Recorded against the authorization package."
                      : "Returned to the systems security engineer.";
                  return (
                    <Field data-invalid={Boolean(fieldError8)}>
                      <FieldLabel id={`${fieldId}-field-8-label`} htmlFor={`${fieldId}-field-8`}>
                        {deciding === "approve" ? "Approval note" : "What needs to change?"}
                        {deciding === "changes" ? (
                          <span aria-hidden="true" className="text-danger">
                            {" "}
                            *
                          </span>
                        ) : null}
                      </FieldLabel>
                      <Textarea
                        id={`${fieldId}-field-8`}
                        aria-labelledby={`${fieldId}-field-8-label`}
                        aria-required={deciding === "changes"}
                        aria-invalid={Boolean(fieldError8)}
                        aria-describedby={
                          fieldError8 || fieldHint8 ? `${fieldId}-field-8-message` : undefined
                        }
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        name={field.name}
                        onBlur={field.handleBlur}
                      />
                      {fieldError8 ? (
                        <FieldError id={`${fieldId}-field-8-message`}>{fieldError8}</FieldError>
                      ) : fieldHint8 ? (
                        <FieldDescription id={`${fieldId}-field-8-message`}>
                          {fieldHint8}
                        </FieldDescription>
                      ) : null}
                    </Field>
                  );
                }}
              </form.Field>
            </form>
          </Box>
          <DialogFooter>
            <>
              <Button variant="subtle" onClick={() => setDeciding(null)}>
                Cancel
              </Button>
              <Button
                variant={deciding === "approve" ? "primary" : "danger"}
                type="submit"
                form={formId + "-2"}
                disabled={form.state.isSubmitting}
              >
                {deciding === "approve" ? "Approve scope" : "Request changes"}
              </Button>
            </>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ScopePreview({ params }: { params: SystemParameters }) {
  const r = computeTailoring(params);
  return (
    <div>
      <Eyebrow>Derived scope</Eyebrow>
      <dl className="pt-100">
        {[
          ["Baseline", r.baselineLabel.replace("NIST SP 800-53 Rev. 5 — ", "Rev. 5 ")],
          ["Baseline controls", String(r.baselineCount)],
          ["Overlay additions", `+${r.added.length}`],
          ["Tailored out", `−${r.removed.length}`],
          ["Parameters set", String(r.parameterized.length)],
          ["Controls in scope", String(r.total)],
        ].map(([k, v]) => (
          <Inline
            key={k}
            className="border-b border-default py-050 last:border-0"
            space="space.150"
            alignBlock="baseline"
            spread="space-between"
          >
            <dt className="font-body-small text-subtle">{k}</dt>
            <dd className="tabular-nums font-body-small font-medium">{v}</dd>
          </Inline>
        ))}
      </dl>
      <Box className="font-heading-xxsmall uppercase text-subtle" paddingBlockStart="space.150">
        Overlays
      </Box>
      <Stack className="pt-075" as="ul" space="space.050">
        {r.overlays.map((o) => (
          <Inline
            key={o.id}
            className="font-body-small"
            as="li"
            space="space.100"
            alignBlock="center"
          >
            <Dot tone="information" />
            <span className="truncate">{o.name}</span>
          </Inline>
        ))}
        {r.overlays.length === 0 ? <li className="font-body-small text-subtle">None</li> : null}
      </Stack>
    </div>
  );
}
