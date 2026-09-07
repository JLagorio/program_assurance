import { useEffect, Fragment, useMemo, useState } from "react";
import { useRecordForm } from "@/lib/record-form";

import {
  Badge,
  Box,
  Button,
  Dialog,
  Field,
  Grid,
  Id,
  Inline,
  Input,
  KeyValue,
  NativeSelect,
  Section,
  Stack,
  Table,
  Textarea,
  Indicator,
  Eyebrow,
} from "@ledger/design-system";
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

  return (
    <>
      <Section
        title="Acquisition lifecycle"
        description={`Milestones, technical reviews and RMF actions gating ${programName}. Current gate: ${current ? `${current.id} — ${current.name}` : "complete"}.`}
        action={
          <Inline space="space.100" alignBlock="center">
            <NativeSelect
              aria-label="Gate kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as (typeof kindFilters)[number])}
              size="small"
              style={{ width: 172, maxWidth: "100%" }}
            >
              {kindFilters.map((k) => (
                <option key={k} value={k}>
                  {k === "All" ? "All gate types" : k}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect
              aria-label="Gate status"
              value={status}
              onChange={(e) => setStatus(e.target.value as (typeof statusFilters)[number])}
              size="small"
              style={{ width: 136 }}
            >
              {statusFilters.map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? "All statuses" : s}
                </option>
              ))}
            </NativeSelect>
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
      onClose={onClose}
      width="large"
      title={`${gate.id} — ${gate.name}`}
      description={`${programId} · ${gate.phase}`}
      aside={
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
      }
      footer={
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
      }
    >
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
              {(field) => (
                <Field
                  label="Status"
                  error={
                    field.state.meta.isTouched && !field.state.meta.isValid
                      ? [...new Set(field.state.meta.errors)].join(" ")
                      : undefined
                  }
                >
                  <NativeSelect
                    value={field.state.value ?? ""}
                    onChange={(e) => field.handleChange(e.target.value as GateStatus)}
                    name={field.name}
                    onBlur={field.handleBlur}
                  >
                    {(
                      ["Planned", "In progress", "At risk", "Blocked", "Complete"] as GateStatus[]
                    ).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              )}
            </form.Field>
            <form.Field name="draft.owner">
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
                    value={field.state.value ?? ""}
                    onChange={(e) => field.handleChange(e.target.value)}
                    name={field.name}
                    onBlur={field.handleBlur}
                  />
                </Field>
              )}
            </form.Field>
            <form.Field name="draft.planned">
              {(field) => (
                <Field
                  isRequired
                  error={
                    field.state.meta.isTouched && !field.state.meta.isValid
                      ? [...new Set(field.state.meta.errors)].join(" ")
                      : undefined
                  }
                  label="Planned date"
                >
                  <Input
                    value={field.state.value ?? ""}
                    onChange={(e) => field.handleChange(e.target.value)}
                    name={field.name}
                    onBlur={field.handleBlur}
                  />
                </Field>
              )}
            </form.Field>
            <form.Field name="draft.actual">
              {(field) => (
                <Field
                  label="Actual date"
                  error={
                    field.state.meta.isTouched && !field.state.meta.isValid
                      ? [...new Set(field.state.meta.errors)].join(" ")
                      : undefined
                  }
                >
                  <Input
                    value={field.state.value ?? ""}
                    onChange={(e) => field.handleChange(e.target.value)}
                    name={field.name}
                    onBlur={field.handleBlur}
                  />
                </Field>
              )}
            </form.Field>
          </Grid>
          <form.Field name="draft.artifact">
            {(field) => (
              <Field
                label="Artifact of record"
                hint="SSP, SAR, IATT memo, review minutes."
                error={
                  field.state.meta.isTouched && !field.state.meta.isValid
                    ? [...new Set(field.state.meta.errors)].join(" ")
                    : undefined
                }
              >
                <Input
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  name={field.name}
                  onBlur={field.handleBlur}
                />
              </Field>
            )}
          </form.Field>
          <form.Field name="note">
            {(field) => (
              <Field
                label="Entry note"
                error={
                  field.state.meta.isTouched && !field.state.meta.isValid
                    ? [...new Set(field.state.meta.errors)].join(" ")
                    : undefined
                }
              >
                <Textarea
                  rows={3}
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Assessment findings, exit criteria met, dependencies…"
                  name={field.name}
                  onBlur={field.handleBlur}
                />
              </Field>
            )}
          </form.Field>
        </Stack>
      </form>
    </Dialog>
  );
}
