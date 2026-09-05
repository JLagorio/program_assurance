import { Fragment, useMemo, useState } from "react";

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
  useRequired,
  Indicator,
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
              value={kind}
              onChange={(e) => setKind(e.target.value as (typeof kindFilters)[number])}
              size="small"
              style={{ width: 172 }}
            >
              {kindFilters.map((k) => (
                <option key={k} value={k}>
                  {k === "All" ? "All gate types" : k}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect
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
                      <Badge tone={gateKindTone[g.kind]}>{gateKindShort[g.kind]}</Badge>
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
  const [draft, setDraft] = useState<ProgramGate | null>(gate);
  const [note, setNote] = useState("");
  const req = useRequired({ owner: draft?.owner, planned: draft?.planned });

  // reset when a different gate is opened
  if (gate && draft?.id !== gate.id) {
    setDraft(gate);
    setNote("");
  }
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
          <p className="font-heading-xxsmall uppercase text-subtle">Gate detail</p>
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
            onClick={() => {
              if (!req.check()) return;
              onSave(draft);
            }}
          >
            Save gate
          </Button>
        </>
      }
    >
      <Stack space="space.150">
        <Grid gap="space.150" templateColumns="repeat(2, minmax(0, 1fr))">
          <Field label="Status">
            <NativeSelect
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value as GateStatus })}
            >
              {(["Planned", "In progress", "At risk", "Blocked", "Complete"] as GateStatus[]).map(
                (s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ),
              )}
            </NativeSelect>
          </Field>
          <Field isRequired error={req.errorFor("owner")} label="Owner">
            <Input
              value={draft.owner}
              onChange={(e) => setDraft({ ...draft, owner: e.target.value })}
            />
          </Field>
          <Field isRequired error={req.errorFor("planned")} label="Planned date">
            <Input
              value={draft.planned}
              onChange={(e) => setDraft({ ...draft, planned: e.target.value })}
            />
          </Field>
          <Field label="Actual date">
            <Input
              value={draft.actual}
              onChange={(e) => setDraft({ ...draft, actual: e.target.value })}
            />
          </Field>
        </Grid>
        <Field label="Artifact of record" hint="SSP, SAR, IATT memo, review minutes.">
          <Input
            value={draft.artifact}
            onChange={(e) => setDraft({ ...draft, artifact: e.target.value })}
          />
        </Field>
        <Field label="Entry note">
          <Textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Assessment findings, exit criteria met, dependencies…"
          />
        </Field>
      </Stack>
    </Dialog>
  );
}
