import {
  FieldLabel,
  FieldError,
  FieldDescription,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
  Box,
  Button,
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
  Indicator,
  Inline,
  Input,
  KeyValue,
  Section,
  Stack,
  Table,
  Textarea,
} from "@ledger/design-system";
import { useRecordForm } from "@/lib/record-form";
import { useId, Fragment, useEffect, useMemo, useState } from "react";
import {
  gateKindTone,
  gateStatusTone,
  gatesForProgram,
  lifecyclePhases,
  type GateKind,
  type GateStatus,
  type ProgramGate,
} from "@/lib/grc-data";

const statusFilters: Array<"All" | GateStatus> = [
  "All",
  "In progress",
  "At risk",
  "Blocked",
  "Planned",
  "Complete",
];

const kindFilters = ["All", "Milestone decision", "Engineering review", "RMF action"] as const;

const shortDate = (d: string) => (d && d !== "—" ? d.replace(/,\s*20(\d\d)$/, " '$1") : d);

const gateKindShort: Record<GateKind, string> = {
  "Engineering review": "Engineering",
  "Milestone decision": "Milestone",
  "RMF action": "RMF",
  Operational: "Operational",
};

export function LifecycleSection({
  programId,
  programName,
}: {
  programId: string;
  programName: string;
}) {
  const [gates, setGates] = useState<ProgramGate[]>(() => gatesForProgram(programId));
  const [status, setStatus] = useState<(typeof statusFilters)[number]>("All");
  const [kind, setKind] = useState<(typeof kindFilters)[number]>("All");
  const [selected, setSelected] = useState<ProgramGate | null>(null);

  const rows = useMemo(
    () =>
      gates.filter(
        (g) => (status === "All" || g.status === status) && (kind === "All" || g.kind === kind),
      ),
    [gates, status, kind],
  );

  const grouped = lifecyclePhases
    .map((phase) => ({ phase, items: rows.filter((g) => g.phase === phase) }))
    .filter((p) => p.items.length > 0);

  const current = gates.find(
    (g) => g.status === "In progress" || g.status === "At risk" || g.status === "Blocked",
  );

  function save(next: ProgramGate) {
    setGates((prev) => prev.map((g) => (g.id === next.id ? next : g)));
    setSelected(null);
  }

  const kindItems = kindFilters.map((k) => ({
    value: k,
    label: k === "All" ? "All gate types" : k,
  }));
  const statusItems = statusFilters.map((s) => ({
    value: s,
    label: s === "All" ? "All statuses" : s,
  }));
  return (
    <>
      <Section
        title="Acquisition lifecycle"
        description={`Milestones, technical reviews and RMF actions gating ${programName}. Current gate: ${current ? `${current.id} — ${current.name}` : "complete"}.`}
        action={
          <Inline space="space.100" alignBlock="center">
            <Select<string>
              items={kindItems}
              value={kind}
              onValueChange={(value) => {
                if (value === null) return;
                return setKind(value as (typeof kindFilters)[number]);
              }}
            >
              <SelectTrigger
                className="w-full"
                aria-label="Gate kind"
                size="sm"
                style={{ width: 172, maxWidth: "100%" }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {kindItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select<string>
              items={statusItems}
              value={status}
              onValueChange={(value) => {
                if (value === null) return;
                return setStatus(value as (typeof statusFilters)[number]);
              }}
            >
              <SelectTrigger
                className="w-full"
                aria-label="Gate status"
                size="sm"
                style={{ width: 136 }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Inline>
        }
      >
        <Table className="table-fixed">
          <thead>
            <tr>
              <Table.Header width={72}>Gate</Table.Header>
              <Table.Header>Requirement</Table.Header>
              <Table.Header width={116}>Type</Table.Header>
              <Table.Header width={104}>Status</Table.Header>
              <Table.Header width={152}>Cyber dependency</Table.Header>
              <Table.Header width={92}>Owner</Table.Header>
              <Table.Header className="text-right" width={112}>
                Planned
              </Table.Header>
              <Table.Header className="text-right" width={112}>
                Actual
              </Table.Header>
            </tr>
          </thead>
          <tbody>
            {grouped.map((group) => (
              <Fragment key={group.phase}>
                <tr>
                  <td
                    colSpan={8}
                    className="border-b border-default bg-surface-sunken px-100 py-050 font-heading-xxsmall uppercase text-subtle"
                  >
                    Phase {group.phase}
                  </td>
                </tr>
                {group.items.map((g) => (
                  <Table.Row key={g.id} onClick={() => setSelected(g)} className="cursor-pointer">
                    <Table.Cell width={72}>
                      <Id>{g.id}</Id>
                    </Table.Cell>
                    <Table.Cell>{g.name}</Table.Cell>
                    <Table.Cell width={116}>
                      <Badge variant="secondary" tone={gateKindTone[g.kind]}>
                        {gateKindShort[g.kind]}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell width={104}>
                      <Indicator tone={gateStatusTone[g.status]}>{g.status}</Indicator>
                    </Table.Cell>
                    <Table.Cell width={152}>{g.cyberGate}</Table.Cell>
                    <Table.Cell width={92}>{g.owner}</Table.Cell>
                    <Table.Cell className="tabular-nums text-right" width={112}>
                      {shortDate(g.planned)}
                    </Table.Cell>
                    <Table.Cell className="tabular-nums text-right" width={112}>
                      {shortDate(g.actual)}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Fragment>
            ))}
            {rows.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={8}>No gates match this filter.</Table.Cell>
              </Table.Row>
            ) : null}
          </tbody>
        </Table>
      </Section>

      <GateModal
        gate={selected}
        programId={programId}
        onClose={() => setSelected(null)}
        onSave={save}
      />
    </>
  );
}

function GateModal({
  gate,
  programId,
  onClose,
  onSave,
}: {
  gate: ProgramGate | null;
  programId: string;
  onClose: () => void;
  onSave: (g: ProgramGate) => void;
}) {
  const fieldId = useId();

  const { form, values, formId, formRef } = useRecordForm(
    {
      draft: gate as ProgramGate | null,
      note: "",
    },
    (value) => ({ "draft.owner": value.draft?.owner, "draft.planned": value.draft?.planned }),
  );
  const { draft, note } = values;

  // reset when a different gate is opened
  useEffect(() => {
    form.reset({ draft: gate, note: "" });
  }, [gate, form]);
  if (!gate || !draft) return null;

  return (
    <Dialog
      open={Boolean(gate)}
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
          <DialogTitle>{`${gate.id} — ${gate.name}`}</DialogTitle>
          <DialogDescription>{`${programId} · ${gate.phase}`}</DialogDescription>
        </DialogHeader>
        <Box className="min-h-0 flex-1 overflow-y-auto overscroll-none">
          <Box className="grid grid-cols-1 md:grid-cols-3">
            <Box className="px-250 py-200 md:col-span-2">
              <form
                id={formId + "-1"}
                ref={formRef}
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  void form.handleSubmit({
                    save: () => {
                      onSave(draft);
                    },
                  });
                }}
              >
                <Stack space="space.150">
                  <Grid
                    gap="space.150"
                    templateColumns={{ base: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }}
                  >
                    <form.Field name="draft.status">
                      {(field) => {
                        const valueItems = (
                          [
                            "Planned",
                            "In progress",
                            "At risk",
                            "Blocked",
                            "Complete",
                          ] as GateStatus[]
                        ).map((s) => ({ value: s, label: s }));
                        const fieldError1 =
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined;
                        return (
                          <Field data-invalid={Boolean(fieldError1)}>
                            <FieldLabel
                              id={`${fieldId}-status-1-label`}
                              htmlFor={`${fieldId}-status-1`}
                            >
                              {"Status"}
                            </FieldLabel>
                            <Select<string>
                              items={valueItems}
                              value={field.state.value ?? ""}
                              onValueChange={(value) => {
                                if (value === null) return;
                                return field.handleChange(value as GateStatus);
                              }}
                              name={field.name}
                            >
                              <SelectTrigger
                                id={`${fieldId}-status-1`}
                                aria-labelledby={`${fieldId}-status-1-label`}
                                aria-invalid={Boolean(fieldError1)}
                                aria-describedby={
                                  fieldError1 ? `${fieldId}-status-1-message` : undefined
                                }
                                className="w-full"
                                onBlur={field.handleBlur}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent aria-labelledby={`${fieldId}-status-1-label`}>
                                {valueItems.map((item) => (
                                  <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {fieldError1 ? (
                              <FieldError id={`${fieldId}-status-1-message`}>
                                {fieldError1}
                              </FieldError>
                            ) : null}
                          </Field>
                        );
                      }}
                    </form.Field>
                    <form.Field name="draft.owner">
                      {(field) => {
                        const fieldError2 =
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined;
                        return (
                          <Field data-invalid={Boolean(fieldError2)}>
                            <FieldLabel
                              id={`${fieldId}-owner-2-label`}
                              htmlFor={`${fieldId}-owner-2`}
                            >
                              {"Owner"}
                              <span aria-hidden="true" className="text-danger">
                                {" "}
                                *
                              </span>
                            </FieldLabel>
                            <Input
                              id={`${fieldId}-owner-2`}
                              aria-labelledby={`${fieldId}-owner-2-label`}
                              aria-required={true}
                              aria-invalid={Boolean(fieldError2)}
                              aria-describedby={
                                fieldError2 ? `${fieldId}-owner-2-message` : undefined
                              }
                              value={field.state.value ?? ""}
                              onChange={(e) => field.handleChange(e.target.value)}
                              name={field.name}
                              onBlur={field.handleBlur}
                            />
                            {fieldError2 ? (
                              <FieldError id={`${fieldId}-owner-2-message`}>
                                {fieldError2}
                              </FieldError>
                            ) : null}
                          </Field>
                        );
                      }}
                    </form.Field>
                    <form.Field name="draft.planned">
                      {(field) => {
                        const fieldError3 =
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined;
                        return (
                          <Field data-invalid={Boolean(fieldError3)}>
                            <FieldLabel
                              id={`${fieldId}-planned-date-3-label`}
                              htmlFor={`${fieldId}-planned-date-3`}
                            >
                              {"Planned date"}
                              <span aria-hidden="true" className="text-danger">
                                {" "}
                                *
                              </span>
                            </FieldLabel>
                            <Input
                              id={`${fieldId}-planned-date-3`}
                              aria-labelledby={`${fieldId}-planned-date-3-label`}
                              aria-required={true}
                              aria-invalid={Boolean(fieldError3)}
                              aria-describedby={
                                fieldError3 ? `${fieldId}-planned-date-3-message` : undefined
                              }
                              value={field.state.value ?? ""}
                              onChange={(e) => field.handleChange(e.target.value)}
                              name={field.name}
                              onBlur={field.handleBlur}
                            />
                            {fieldError3 ? (
                              <FieldError id={`${fieldId}-planned-date-3-message`}>
                                {fieldError3}
                              </FieldError>
                            ) : null}
                          </Field>
                        );
                      }}
                    </form.Field>
                    <form.Field name="draft.actual">
                      {(field) => {
                        const fieldError4 =
                          field.state.meta.isTouched && !field.state.meta.isValid
                            ? [...new Set(field.state.meta.errors)].join(" ")
                            : undefined;
                        return (
                          <Field data-invalid={Boolean(fieldError4)}>
                            <FieldLabel
                              id={`${fieldId}-actual-date-4-label`}
                              htmlFor={`${fieldId}-actual-date-4`}
                            >
                              {"Actual date"}
                            </FieldLabel>
                            <Input
                              id={`${fieldId}-actual-date-4`}
                              aria-labelledby={`${fieldId}-actual-date-4-label`}
                              aria-invalid={Boolean(fieldError4)}
                              aria-describedby={
                                fieldError4 ? `${fieldId}-actual-date-4-message` : undefined
                              }
                              value={field.state.value ?? ""}
                              onChange={(e) => field.handleChange(e.target.value)}
                              name={field.name}
                              onBlur={field.handleBlur}
                            />
                            {fieldError4 ? (
                              <FieldError id={`${fieldId}-actual-date-4-message`}>
                                {fieldError4}
                              </FieldError>
                            ) : null}
                          </Field>
                        );
                      }}
                    </form.Field>
                  </Grid>
                  <form.Field name="draft.artifact">
                    {(field) => {
                      const fieldError5 =
                        field.state.meta.isTouched && !field.state.meta.isValid
                          ? [...new Set(field.state.meta.errors)].join(" ")
                          : undefined;
                      return (
                        <Field data-invalid={Boolean(fieldError5)}>
                          <FieldLabel
                            id={`${fieldId}-artifact-of-record-5-label`}
                            htmlFor={`${fieldId}-artifact-of-record-5`}
                          >
                            {"Artifact of record"}
                          </FieldLabel>
                          <Input
                            id={`${fieldId}-artifact-of-record-5`}
                            aria-labelledby={`${fieldId}-artifact-of-record-5-label`}
                            aria-invalid={Boolean(fieldError5)}
                            aria-describedby={`${fieldId}-artifact-of-record-5-message`}
                            value={field.state.value ?? ""}
                            onChange={(e) => field.handleChange(e.target.value)}
                            name={field.name}
                            onBlur={field.handleBlur}
                          />
                          {fieldError5 ? (
                            <FieldError id={`${fieldId}-artifact-of-record-5-message`}>
                              {fieldError5}
                            </FieldError>
                          ) : (
                            <FieldDescription id={`${fieldId}-artifact-of-record-5-message`}>
                              {"SSP, SAR, IATT memo, review minutes."}
                            </FieldDescription>
                          )}
                        </Field>
                      );
                    }}
                  </form.Field>
                  <form.Field name="note">
                    {(field) => {
                      const fieldError6 =
                        field.state.meta.isTouched && !field.state.meta.isValid
                          ? [...new Set(field.state.meta.errors)].join(" ")
                          : undefined;
                      return (
                        <Field data-invalid={Boolean(fieldError6)}>
                          <FieldLabel
                            id={`${fieldId}-entry-note-6-label`}
                            htmlFor={`${fieldId}-entry-note-6`}
                          >
                            {"Entry note"}
                          </FieldLabel>
                          <Textarea
                            id={`${fieldId}-entry-note-6`}
                            aria-labelledby={`${fieldId}-entry-note-6-label`}
                            aria-invalid={Boolean(fieldError6)}
                            aria-describedby={
                              fieldError6 ? `${fieldId}-entry-note-6-message` : undefined
                            }
                            rows={3}
                            value={field.state.value ?? ""}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="Assessment findings, exit criteria met, dependencies…"
                            name={field.name}
                            onBlur={field.handleBlur}
                          />
                          {fieldError6 ? (
                            <FieldError id={`${fieldId}-entry-note-6-message`}>
                              {fieldError6}
                            </FieldError>
                          ) : null}
                        </Field>
                      );
                    }}
                  </form.Field>
                </Stack>
              </form>
            </Box>
            <Box className="border-t border-default bg-surface-sunken px-250 py-200 md:border-s md:border-t-0">
              <div>
                <Eyebrow as="p">Gate detail</Eyebrow>
                <Box paddingBlockStart="space.100">
                  <KeyValue label="Type">{gate.kind}</KeyValue>
                  <KeyValue label="Phase">{gate.phase}</KeyValue>
                  <KeyValue label="Cyber gate">{gate.cyberGate}</KeyValue>
                  <KeyValue label="Artifact">{draft.artifact}</KeyValue>
                </Box>
                <p className="pt-150 border-t border-default font-body-small text-subtle">
                  {gate.description}
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
            <Button
              variant="primary"
              type="submit"
              form={formId + "-1"}
              disabled={form.state.isSubmitting}
            >
              Save gate
            </Button>
          </>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
