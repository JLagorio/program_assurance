/**
 * Write paths for the requirements layer: author a requirement. Allocation and
 * applicability live in allocate-picker.tsx, as frames of one picker.
 */

import { useRequired } from "@/lib/form";
import { useMemo, useState } from "react";

import {
  Box,
  Button,
  Dialog,
  Field,
  Grid,
  Input,
  NativeSelect,
  Textarea,
} from "@ledger/design-system";
import {
  addRequirement,
  requirementsForProgram,
  verificationMethods,
  type DerivationSource,
  type RequirementType,
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
