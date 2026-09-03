/**
 * Write paths for the requirements layer: author a requirement, allocate one,
 * and answer "does this apply to this component?" one obligation at a time.
 *
 * The applicability dialog is the shape the work actually takes. An engineer
 * holding one LRU walks the obligations that have not been answered for it and
 * says apply or skip — and a skip is recorded with a reason rather than left as
 * an absence, because "nobody considered it" and "considered and excluded" are
 * different states and only the second survives an assessment.
 */

import { useRequired } from "@/lib/form";
import { useMemo, useState } from "react";

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
  NativeSelect,
  Textarea,
} from "@ledger/design-system";
import { nodesForProgram } from "@/lib/composition";
import { systemComponents } from "@/lib/reusable-components";
import {
  addAllocation,
  addRequirement,
  coverages,
  decideApplicability,
  derivationSourceTone,
  requirementsForProgram,
  responsibilities,
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
  const req = useRequired({ text, owner, sourceId, why });

  const candidates = useMemo(() => requirementsForProgram(programId), [programId]);

  const reset = () => {
    setText("");
    setOwner("");
    setCriteria("");
    setSourceId("");
    setSourceLabel("");
    setWhy("");
  };

  const submit = () => {
    if (!req.check()) return;
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
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>
            Create requirement
          </Button>
        </>
      }
    >
      <Grid gap="space.150">
        <Field
          isRequired
          error={req.errorFor("text")}
          label="Shall statement"
          hint="One obligation, testable, no compound clauses."
        >
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
          <Field isRequired error={req.errorFor("owner")} label="Owner">
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
            <Field
              isRequired
              error={req.errorFor("sourceId")}
              label="Source"
              hint="SI-7(1), THR-0309, CMP-008 …"
            >
              <Input value={sourceId} onChange={(e) => setSourceId(e.target.value)} />
            </Field>
            <Field label="Source name">
              <Input value={sourceLabel} onChange={(e) => setSourceLabel(e.target.value)} />
            </Field>
          </Grid>
          <Field
            isRequired
            error={req.errorFor("why")}
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
  const req = useRequired({ target, scope });

  const submit = () => {
    if (!req.check()) return;
    const chosen = options.find((o) => o.id === target);
    if (!chosen) return setError("Pick something to allocate to.");
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
        <Field isRequired error={req.errorFor("target")} label="Allocate to">
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
        <Field
          isRequired
          error={req.errorFor("scope")}
          label="Scope of the claim"
          hint="What part of the requirement this element answers."
        >
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
 * "Does this apply to this component?" — one obligation at a time, with a
 * skip recorded rather than dropped.
 */
export function ApplicabilityModal({
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
    // Recomputed only when the dialog opens: answering an item removes it from
    // `undecidedFor`, and a queue that reshuffles under the cursor mid-walk is
    // how you skip an obligation without meaning to.

    [open, targetId, programId],
  );
  const [index, setIndex] = useState(0);
  const [rationale, setRationale] = useState("");
  const [responsibility, setResponsibility] = useState<Responsibility>("Primary");
  const [coverage, setCoverage] = useState<Coverage>("Partial");
  const [scope, setScope] = useState("");
  const [error, setError] = useState<string | null>(null);

  const current = queue[index];

  const advance = () => {
    setRationale("");
    setScope("");
    setError(null);
    if (index + 1 >= queue.length) {
      setIndex(0);
      onClose();
    } else {
      setIndex(index + 1);
    }
  };

  const apply = () => {
    if (!current) return;
    if (!scope.trim())
      return setError("State what part of the requirement this component answers.");
    decideApplicability({
      requirement: current.id,
      target: targetId,
      targetKind,
      applies: true,
      rationale: rationale.trim() || "Applies to this component.",
      decidedBy,
      allocation: {
        responsibility,
        coverage,
        scope: scope.trim(),
        owner: decidedBy,
      },
    });
    advance();
  };

  const skip = () => {
    if (!current) return;
    if (!rationale.trim())
      return setError("A skip has to say why. That is the whole point of logging it.");
    decideApplicability({
      requirement: current.id,
      target: targetId,
      targetKind,
      applies: false,
      rationale: rationale.trim(),
      decidedBy,
    });
    advance();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Applicability — ${targetName}`}
      description={
        queue.length
          ? `${queue.length - index} of ${queue.length} obligations not yet answered for this component.`
          : "Every requirement in this program has been answered for this component."
      }
      width="large"
      footer={
        current ? (
          <>
            {error ? <span className="mr-auto font-body-small text-danger">{error}</span> : null}
            <Button onClick={onClose}>Stop</Button>
            <Button onClick={skip}>Does not apply — log it</Button>
            <Button variant="primary" onClick={apply}>
              Applies here
            </Button>
          </>
        ) : (
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        )
      }
    >
      {current ? (
        <Grid gap="space.150">
          <Box
            className="rounded-large border border-default bg-surface-sunken"
            paddingInline="space.200"
            paddingBlock="space.150"
          >
            <Inline space="space.100" alignBlock="center" shouldWrap>
              <Id>{current.id}</Id>
              <Badge size="xsmall">{current.type}</Badge>
              {current.derivations.map((d) => (
                <Badge key={d.sourceId} size="xsmall" tone={derivationSourceTone[d.sourceType]}>
                  {d.sourceId}
                </Badge>
              ))}
            </Inline>
            <p className="pt-075 font-body">{current.text}</p>
          </Box>

          <Field label="Rationale" hint="Required to skip. Recorded either way, against your name.">
            <Textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder={`Why this ${current.type.toLowerCase()} requirement does or does not reach ${targetName}`}
            />
          </Field>

          <Grid gap="space.150" templateColumns={{ sm: "140px 140px minmax(0,1fr)" }}>
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
            <Field label="Scope of the claim" hint="Needed only when it applies.">
              <Input value={scope} onChange={(e) => setScope(e.target.value)} />
            </Field>
          </Grid>
        </Grid>
      ) : (
        <p className="font-body text-subtle">Nothing left to answer for {targetName}.</p>
      )}
    </Dialog>
  );
}
