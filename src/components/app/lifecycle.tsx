import { Fragment, useMemo, useState } from "react";

import {
  Badge,
  Button,
  Dot,
  Field,
  Input,
  KeyValue,
  Modal,
  Mono,
  Section,
  Select,
  Table,
  Td,
  Textarea,
  Th,
  Tr,
} from "@/components/app/ui";
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

const kindFilters = [
  "All",
  "Milestone decision",
  "Engineering review",
  "RMF action",
] as const;

const shortDate = (d: string) =>
  d && d !== "—" ? d.replace(/,\s*20(\d\d)$/, " '$1") : d;

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
        (g) =>
          (status === "All" || g.status === status) &&
          (kind === "All" || g.kind === kind),
      ),
    [gates, status, kind],
  );

  const grouped = lifecyclePhases
    .map((phase) => ({ phase, items: rows.filter((g) => g.phase === phase) }))
    .filter((p) => p.items.length > 0);

  const current = gates.find((g) => g.status === "In progress" || g.status === "At risk" || g.status === "Blocked");

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
          <div className="flex items-center gap-2">
            <Select
              value={kind}
              onChange={(e) => setKind(e.target.value as (typeof kindFilters)[number])}
              className="h-7 w-[172px]"
            >
              {kindFilters.map((k) => (
                <option key={k} value={k}>
                  {k === "All" ? "All gate types" : k}
                </option>
              ))}
            </Select>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as (typeof statusFilters)[number])}
              className="h-7 w-[136px]"
            >
              {statusFilters.map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? "All statuses" : s}
                </option>
              ))}
            </Select>
          </div>
        }
      >
        <Table className="table-fixed">
          <thead>
            <tr>
              <Th className="w-[72px]">Gate</Th>
              <Th>Requirement</Th>
              <Th className="w-[116px]">Type</Th>
              <Th className="w-[104px]">Status</Th>
              <Th className="w-[152px]">Cyber dependency</Th>
              <Th className="w-[92px]">Owner</Th>
              <Th className="w-[112px] text-right">Planned</Th>
              <Th className="w-[112px] text-right">Actual</Th>
            </tr>
          </thead>
          <tbody>
            {grouped.map((group) => (
              <Fragment key={group.phase}>
                <tr>
                  <td
                    colSpan={8}
                    className="border-b border-border bg-subtle px-2.5 py-1 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground"
                  >
                    Phase {group.phase}
                  </td>
                </tr>
                {group.items.map((g) => (
                  <Tr key={g.id} onClick={() => setSelected(g)} className="cursor-pointer">
                    <Td className="w-[72px]">
                      <Mono>{g.id}</Mono>
                    </Td>
                    <Td className="font-medium">{g.name}</Td>
                    <Td className="w-[116px]">
                      <Badge tone={gateKindTone[g.kind]}>{gateKindShort[g.kind]}</Badge>
                    </Td>
                    <Td className="w-[104px]">
                      <span className="flex items-center gap-1.5">
                        <Dot tone={gateStatusTone[g.status]} />
                        <span className={g.status === "Planned" ? "text-muted-foreground" : ""}>
                          {g.status}
                        </span>
                      </span>
                    </Td>
                    <Td className="w-[152px] text-muted-foreground">{g.cyberGate}</Td>
                    <Td className="w-[92px] text-muted-foreground">{g.owner}</Td>
                    <Td className="tnum w-[112px] text-right text-muted-foreground">{shortDate(g.planned)}</Td>
                    <Td className="tnum w-[112px] text-right text-muted-foreground">{shortDate(g.actual)}</Td>
                  </Tr>
                ))}
              </Fragment>
            ))}
            {rows.length === 0 ? (
              <Tr>
                <Td colSpan={8} className="text-muted-foreground">
                  No gates match this filter.
                </Td>
              </Tr>
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

  // reset when a different gate is opened
  if (gate && draft?.id !== gate.id) {
    setDraft(gate);
    setNote("");
  }
  if (!gate || !draft) return null;

  return (
    <Modal
      open={Boolean(gate)}
      onClose={onClose}
      width="lg"
      title={`${gate.id} — ${gate.name}`}
      description={`${programId} · ${gate.phase}`}
      aside={
        <div>
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Gate detail
          </p>
          <div className="mt-2">
            <KeyValue label="Type">{gate.kind}</KeyValue>
            <KeyValue label="Phase">{gate.phase}</KeyValue>
            <KeyValue label="Cyber gate">{gate.cyberGate}</KeyValue>
            <KeyValue label="Artifact">{draft.artifact}</KeyValue>
          </div>
          <p className="mt-3 border-t border-border pt-3 text-[12.5px] leading-relaxed text-muted-foreground">
            {gate.description}
          </p>
        </div>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => onSave(draft)}>
            Save gate
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Status">
            <Select
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
            </Select>
          </Field>
          <Field label="Owner">
            <Input
              value={draft.owner}
              onChange={(e) => setDraft({ ...draft, owner: e.target.value })}
            />
          </Field>
          <Field label="Planned date">
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
        </div>
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
      </div>
    </Modal>
  );
}
