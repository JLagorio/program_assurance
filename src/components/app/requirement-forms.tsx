/**
 * Write paths for the requirements layer: author a requirement, allocate one,
 * and answer "does this apply to this component?" for many obligations at once.
 *
 * The applicability picker is the shape the work actually takes. An engineer
 * holding one LRU gathers the obligations that have not been answered for it,
 * then says apply or skip for each — and a skip is recorded with a reason
 * rather than left as an absence, because "nobody considered it" and
 * "considered and excluded" are different states and only the second survives
 * an assessment.
 */

import { useMemo, useState } from "react";

import {
  Absent,
  Badge,
  Box,
  Button,
  DataTable,
  Dialog,
  Editable,
  Field,
  Grid,
  Inline,
  Input,
  NativeSelect,
  PickerSheet,
  Text,
  Textarea,
  defineColumns,
  useDataTable,
} from "@ledger/design-system";
import { nodesForProgram } from "@/lib/composition";
import { systemComponents } from "@/lib/reusable-components";
import {
  addAllocation,
  addRequirement,
  coverages,
  coverageTone,
  decideApplicability,
  requirementStateTone,
  requirementsForProgram,
  responsibilities,
  responsibilityTone,
  securityProcesses,
  undecidedFor,
  verificationMethods,
  type AllocationTargetKind,
  type Coverage,
  type DerivationSource,
  type Requirement,
  type RequirementType,
  type Responsibility,
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
}: {
  open: boolean;
  onClose: () => void;
  programId: string;
  parentId?: string | null;
}) {
  const [text, setText] = useState("");
  const [type, setType] = useState<RequirementType>("Derived");
  const [parent, setParent] = useState(parentId ?? "");
  const [owner, setOwner] = useState("");
  const [method, setMethod] = useState<VerificationMethod>("Test");
  const [criteria, setCriteria] = useState("");
  const [sourceType, setSourceType] = useState<DerivationSource>("Control statement");
  const [sourceId, setSourceId] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [why, setWhy] = useState("");
  const [error, setError] = useState<string | null>(null);

  const candidates = useMemo(() => requirementsForProgram(programId), [programId]);

  const reset = () => {
    setText("");
    setOwner("");
    setCriteria("");
    setSourceId("");
    setSourceLabel("");
    setWhy("");
    setError(null);
  };

  const submit = () => {
    if (!text.trim()) return setError("The shall statement cannot be empty.");
    if (!owner.trim()) return setError("A requirement needs an accountable owner.");
    if (!sourceId.trim()) return setError("A requirement needs at least one derivation source.");
    if (!why.trim()) return setError("Record why the source produces this requirement.");
    addRequirement({
      program: programId,
      parent: parent || null,
      type,
      text: text.trim(),
      owner: owner.trim(),
      method,
      successCriteria: criteria.trim() || "—",
      derivations: [
        {
          sourceType,
          sourceId: sourceId.trim(),
          sourceLabel: sourceLabel.trim() || sourceId.trim(),
          rationale: why.trim(),
        },
      ],
    });
    reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New security requirement"
      description="Authored as a Draft. Provenance is mandatory — a requirement with no source cannot be approved."
      width="large"
      footer={
        <>
          {error ? <span className="mr-auto font-body-small text-danger">{error}</span> : null}
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>
            Create requirement
          </Button>
        </>
      }
    >
      <Grid gap="space.150">
        <Field label="Shall statement" hint="One obligation, testable, no compound clauses.">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="The system shall …"
          />
        </Field>
        <Grid gap="space.150" templateColumns={{ sm: "repeat(3, minmax(0, 1fr))" }}>
          <Field label="Type">
            <NativeSelect value={type} onChange={(e) => setType(e.target.value as RequirementType)}>
              {requirementTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Decomposes" hint="Leave blank for a top-level obligation.">
            <NativeSelect value={parent} onChange={(e) => setParent(e.target.value)}>
              <option value="">— none —</option>
              {candidates.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Owner">
            <Input
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Accountable engineer"
            />
          </Field>
        </Grid>
        <Grid gap="space.150" templateColumns={{ sm: "140px minmax(0,1fr)" }}>
          <Field label="Verification method">
            <NativeSelect
              value={method}
              onChange={(e) => setMethod(e.target.value as VerificationMethod)}
            >
              {verificationMethods.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Success criteria">
            <Input
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
              placeholder="The observable that decides this is met"
            />
          </Field>
        </Grid>

        <Box className="border-t border-default pt-150" paddingBlockStart="space.050">
          <Box className="font-heading-xxsmall uppercase text-subtlest" paddingBlockEnd="space.100">
            Derivation source
          </Box>
          <Grid gap="space.150" templateColumns={{ sm: "repeat(3, minmax(0, 1fr))" }}>
            <Field label="Source type">
              <NativeSelect
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as DerivationSource)}
              >
                {derivationSources.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Source" hint="SI-7(1), THR-0309, CMP-008 …">
              <Input value={sourceId} onChange={(e) => setSourceId(e.target.value)} />
            </Field>
            <Field label="Source name">
              <Input value={sourceLabel} onChange={(e) => setSourceLabel(e.target.value)} />
            </Field>
          </Grid>
          <Field
            className="pt-150"
            label="Why it produces this requirement"
            hint="&ldquo;The security team asked&rdquo; is not provenance."
          >
            <Textarea value={why} onChange={(e) => setWhy(e.target.value)} />
          </Field>
        </Box>
      </Grid>
    </Dialog>
  );
}

/* ------------------------------------------------------------- Allocate */

type TargetOption = { id: string; label: string; kind: AllocationTargetKind };

function targetOptions(programId: string): TargetOption[] {
  return [
    ...nodesForProgram(programId).map((n) => ({
      id: n.id,
      label: `${n.name} — ${n.kind}`,
      kind: "node" as const,
    })),
    ...systemComponents.map((c) => ({
      id: c.key,
      label: `${c.name} — provider`,
      kind: "provider" as const,
    })),
    ...securityProcesses.map((p) => ({
      id: p.id,
      label: `${p.name} — process`,
      kind: "process" as const,
    })),
  ];
}

export function AllocateModal({
  open,
  onClose,
  programId,
  requirement,
}: {
  open: boolean;
  onClose: () => void;
  programId: string;
  requirement: Requirement;
}) {
  const options = useMemo(() => targetOptions(programId), [programId]);
  const [target, setTarget] = useState(options[0]?.id ?? "");
  const [responsibility, setResponsibility] = useState<Responsibility>("Primary");
  const [coverage, setCoverage] = useState<Coverage>("Partial");
  const [scope, setScope] = useState("");
  const [owner, setOwner] = useState(requirement.owner);
  const [rationale, setRationale] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const chosen = options.find((o) => o.id === target);
    if (!chosen) return setError("Pick something to allocate to.");
    if (!scope.trim()) return setError("State the bounded claim this element answers.");
    addAllocation({
      requirement: requirement.id,
      target: chosen.id,
      targetKind: chosen.kind,
      responsibility,
      coverage,
      scope: scope.trim(),
      owner: owner.trim() || requirement.owner,
      rationale: rationale.trim() || "—",
    });
    setScope("");
    setRationale("");
    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Allocate ${requirement.id}`}
      description="Coverage is per element. Partial is the normal answer — a part that fully covers a system requirement would be a system of one part."
      width="large"
      footer={
        <>
          {error ? <span className="mr-auto font-body-small text-danger">{error}</span> : null}
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>
            Allocate
          </Button>
        </>
      }
    >
      <Grid gap="space.150">
        <Field label="Allocate to">
          <NativeSelect value={target} onChange={(e) => setTarget(e.target.value)}>
            {options.map((o) => (
              <option key={`${o.kind}-${o.id}`} value={o.id}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Grid gap="space.150" templateColumns={{ sm: "repeat(3, minmax(0, 1fr))" }}>
          <Field label="Responsibility">
            <NativeSelect
              value={responsibility}
              onChange={(e) => setResponsibility(e.target.value as Responsibility)}
            >
              {responsibilities.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Coverage">
            <NativeSelect
              value={coverage}
              onChange={(e) => setCoverage(e.target.value as Coverage)}
            >
              {coverages.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Owner">
            <Input value={owner} onChange={(e) => setOwner(e.target.value)} />
          </Field>
        </Grid>
        <Field label="Scope of the claim" hint="What part of the requirement this element answers.">
          <Input
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            placeholder="on-device verification prior to execution"
          />
        </Field>
        <Field label="Rationale">
          <Textarea value={rationale} onChange={(e) => setRationale(e.target.value)} />
        </Field>
      </Grid>
    </Dialog>
  );
}

/* -------------------------------------------------- Applicability walk */

/**
 * One answer per chosen obligation. `note` is the bounded claim when it
 * applies and the reason when it does not; the model requires the second.
 */
type Answer = {
  applies: boolean;
  responsibility: Responsibility;
  coverage: Coverage;
  note: string;
};
type AnswerRow = Requirement & Answer;

const defaultAnswer: Answer = {
  applies: true,
  responsibility: "Primary",
  coverage: "Partial",
  note: "",
};

const obligationColumns = defineColumns<Requirement>((c) => [
  c.id("id", { header: "Requirement", width: 110 }),
  c.text("text", { header: "Shall statement", sortable: false }),
  c.text("type", { header: "Type", width: 130 }),
  c.status("state", { header: "State", width: 110, tone: (r) => requirementStateTone[r.state] }),
]);

export function ApplicabilitySheet({
  open,
  onClose,
  programId,
  targetId,
  targetName,
  targetKind,
  decidedBy,
}: {
  open: boolean;
  onClose: () => void;
  programId: string;
  targetId: string;
  targetName: string;
  targetKind: AllocationTargetKind;
  decidedBy: string;
}) {
  const queue = useMemo(
    () => (open ? undecidedFor(targetId, programId) : []),
    // Recomputed only when the sheet opens: answering an item removes it from
    // `undecidedFor`, and a queue that reshuffles under the cursor mid-walk is
    // how you skip an obligation without meaning to.
    [open, targetId, programId],
  );
  const [frame, setFrame] = useState<"choose" | "details">("choose");
  const [answers, setAnswers] = useState<Record<string, Answer>>({});

  // Frame one gathers; the selection is kept by row id, so it survives the search and the facets.
  const choose = useDataTable({
    columns: obligationColumns,
    data: queue,
    getRowId: (r) => r.id,
    selectable: true,
    label: "Obligations",
    initialState: { sorting: [{ id: "id", desc: false }] },
  });
  const chosenIds = Object.keys(choose.state.rowSelection);
  const chosen = new Set(chosenIds);
  const answerOf = (id: string): Answer => answers[id] ?? defaultAnswer;
  const setAnswer = (id: string, patch: Partial<Answer>) =>
    setAnswers((a) => ({ ...a, [id]: { ...(a[id] ?? defaultAnswer), ...patch } }));
  const applyAll = (patch: Partial<Answer>) =>
    setAnswers((a) =>
      Object.fromEntries(chosenIds.map((id) => [id, { ...(a[id] ?? defaultAnswer), ...patch }])),
    );
  const rows: AnswerRow[] = queue
    .filter((r) => chosen.has(r.id))
    .map((r) => ({ ...r, ...answerOf(r.id) }));
  const unanswered = rows.filter((r) => !r.note.trim()).length;

  const reset = () => {
    choose.resetRowSelection();
    choose.setGlobalFilter("");
    setAnswers({});
    setFrame("choose");
    onClose();
  };

  // Frame two answers in place. "Does not apply" is a row action that turns the claim into the
  // reason; responsibility and coverage fall away because there is nothing to allocate.
  const answerColumns = useMemo(
    () =>
      defineColumns<AnswerRow>((c) => [
        c.id("id", { header: "Requirement", width: 110, sortable: false }),
        c.text("text", { header: "Shall statement", sortable: false }),
        c.custom("responsibility", {
          header: "Responsibility",
          width: 140,
          cell: (r) =>
            r.applies ? (
              <Editable.Select
                label="Responsibility"
                options={responsibilities}
                value={r.responsibility}
                onChange={(next) => setAnswer(r.id, { responsibility: next })}
                save={async () => undefined}
                render={(o) => <Badge tone={responsibilityTone[o]}>{o}</Badge>}
              />
            ) : (
              <Badge tone="neutral">Does not apply</Badge>
            ),
        }),
        c.custom("coverage", {
          header: "Coverage",
          width: 120,
          cell: (r) =>
            r.applies ? (
              <Editable.Select
                label="Coverage"
                options={coverages}
                value={r.coverage}
                onChange={(next) => setAnswer(r.id, { coverage: next })}
                save={async () => undefined}
                render={(o) => <Badge tone={coverageTone[o]}>{o}</Badge>}
              />
            ) : (
              <Absent />
            ),
        }),
        c.text("note", {
          header: "What it answers, or why not",
          sortable: false,
          editable: {
            onChange: (row, next) => setAnswer(row.id, { note: next }),
            save: async () => undefined,
          },
          // drawn by hand for the placeholder; `editable` above keeps the grid semantics
          cell: (r) => (
            <Editable.Text
              value={r.note}
              placeholder={
                r.applies ? "The part of it this component answers" : "Why it does not reach here"
              }
              onChange={(next) => setAnswer(r.id, { note: next })}
              save={async () => undefined}
            />
          ),
        }),
        c.custom("apply", {
          header: "",
          width: 130,
          align: "end",
          cell: (r) => (
            <Button
              variant="link"
              size="small"
              onClick={() => setAnswer(r.id, { applies: !r.applies })}
            >
              {r.applies ? "Does not apply" : "Applies here"}
            </Button>
          ),
        }),
      ]),
    [],
  );
  const details = useDataTable({
    columns: answerColumns,
    data: rows,
    getRowId: (r) => r.id,
    label: "Chosen obligations",
  });

  const record = () => {
    for (const r of rows) {
      const note = r.note.trim();
      decideApplicability({
        requirement: r.id,
        target: targetId,
        targetKind,
        applies: r.applies,
        rationale: r.applies ? "Applies to this component." : note,
        decidedBy,
        ...(r.applies
          ? {
              allocation: {
                responsibility: r.responsibility,
                coverage: r.coverage,
                scope: note,
                owner: decidedBy,
              },
            }
          : {}),
      });
    }
    reset();
  };

  const title = `Applicability — ${targetName}`;
  if (frame === "choose") {
    return (
      <PickerSheet
        open={open}
        onClose={reset}
        width={900}
        title={title}
        subtitle={
          queue.length
            ? `${queue.length} obligation${queue.length === 1 ? "" : "s"} not yet answered for this component.`
            : "Every requirement in this program has been answered for this component."
        }
        search={{
          value: String(choose.state.globalFilter ?? ""),
          onChange: (v) => choose.setGlobalFilter(v),
          placeholder: "Search by id or text",
        }}
        filters={
          <>
            <DataTable.Filter table={choose} column="type" />
            <DataTable.Filter table={choose} column="state" />
          </>
        }
        selected={chosen.size}
        total={choose.getRowCount()}
        onClear={() => choose.resetRowSelection()}
        action={{ label: `Continue with ${chosen.size}`, onClick: () => setFrame("details") }}
      >
        <DataTable
          table={choose}
          onRowClick={(r) => choose.getRow(r.id).toggleSelected()}
          className="rounded-none border-0"
          empty={{
            title: "Nothing left to answer",
            description: `Every obligation has been answered for ${targetName}.`,
          }}
        />
      </PickerSheet>
    );
  }

  return (
    <PickerSheet
      open={open}
      onClose={reset}
      onBack={() => setFrame("choose")}
      width={900}
      title={title}
      subtitle={`Recorded against ${decidedBy}. A claim where it applies, a reason where it does not.`}
      toolbar={
        <Inline space="space.150" alignBlock="center" shouldWrap>
          <Text size="small" color="color.text.subtle">
            Apply to all
          </Text>
          <Box style={{ width: 140 }}>
            <NativeSelect
              aria-label="Responsibility for all"
              className="[&>select]:h-control-small"
              defaultValue=""
              onChange={(e) =>
                e.target.value && applyAll({ responsibility: e.target.value as Responsibility })
              }
            >
              <option value="">Responsibility</option>
              {responsibilities.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </NativeSelect>
          </Box>
          <Box style={{ width: 120 }}>
            <NativeSelect
              aria-label="Coverage for all"
              className="[&>select]:h-control-small"
              defaultValue=""
              onChange={(e) => e.target.value && applyAll({ coverage: e.target.value as Coverage })}
            >
              <option value="">Coverage</option>
              {coverages.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </NativeSelect>
          </Box>
          {unanswered ? (
            <Text size="small" color="color.text.subtle">
              {unanswered} still need a claim or a reason
            </Text>
          ) : null}
        </Inline>
      }
      selected={chosen.size}
      action={{
        label: `Record ${chosen.size} decision${chosen.size === 1 ? "" : "s"}`,
        onClick: record,
        disabled: unanswered > 0,
      }}
    >
      <DataTable table={details} className="rounded-none border-0" />
    </PickerSheet>
  );
}
