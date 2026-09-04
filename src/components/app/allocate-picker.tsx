/**
 * Choosing many from hundreds, for the two mapping asks: requirements onto one
 * element, and elements onto one requirement. Frame one chooses by attribute;
 * frame two fills in what the model requires of every allocation (the
 * responsibility, the coverage, the bounded claim) as Editable cells with a
 * defaults row, never a form per row. "Does not apply" is a row action in
 * frame two, recorded with its reason, so the applicability walk is a mode of
 * this picker rather than a dialog of its own.
 */

import { useMemo, useState } from "react";

import {
  Badge,
  Box,
  Button,
  Editable,
  FilterChip,
  Id,
  Inline,
  Indicator,
  NativeSelect,
  PickerSheet,
  Table,
  Text,
  toast,
} from "@ledger/design-system";
import { nodesForProgram, pathLabel, type CompositionNode } from "@/lib/composition";
import { currentSession } from "@/lib/control-work";
import { reviewLink } from "@/lib/link-currency";
import {
  addAllocation,
  allocationsFor,
  coverages,
  decideApplicability,
  derivationSourceTone,
  requirementStateTone,
  responsibilities,
  securityProcesses,
  undecidedFor,
  type AllocationTargetKind,
  type Coverage,
  type Requirement,
  type Responsibility,
} from "@/lib/requirements";
import { systemComponents } from "@/lib/reusable-components";

type Fields = { responsibility: Responsibility; coverage: Coverage; claim: string };
type Frame = "choose" | "details";

const defaults: Fields = { responsibility: "Primary", coverage: "Partial", claim: "" };

function useChoice() {
  const [chosen, setChosen] = useState<Set<string>>(() => new Set());
  const [fields, setFields] = useState<Record<string, Fields>>({});
  const toggle = (id: string) =>
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const fieldOf = (id: string): Fields => fields[id] ?? defaults;
  const setField = (id: string, patch: Partial<Fields>) =>
    setFields((f) => ({ ...f, [id]: { ...(f[id] ?? defaults), ...patch } }));
  const applyAll = (patch: Partial<Fields>) =>
    setFields((f) =>
      Object.fromEntries([...chosen].map((id) => [id, { ...(f[id] ?? defaults), ...patch }])),
    );
  const reset = () => {
    setChosen(new Set());
    setFields({});
  };
  return { chosen, setChosen, toggle, fieldOf, setField, applyAll, reset };
}

/** The defaults row of frame two: one value for every chosen row. */
function DefaultsRow({ applyAll }: { applyAll: (patch: Partial<Fields>) => void }) {
  return (
    <Inline space="space.150" alignBlock="center">
      <Text size="small" color="color.text.subtle">
        Apply to all
      </Text>
      <Box style={{ width: 150 }}>
        <NativeSelect
          aria-label="Responsibility for all"
          size="small"
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
          size="small"
          defaultValue=""
          onChange={(e) => e.target.value && applyAll({ coverage: e.target.value as Coverage })}
        >
          <option value="">Coverage</option>
          {coverages.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </NativeSelect>
      </Box>
    </Inline>
  );
}

function FieldCells({
  id,
  fields,
  setField,
}: {
  id: string;
  fields: Fields;
  setField: (id: string, patch: Partial<Fields>) => void;
}) {
  return (
    <>
      <Table.Cell>
        <Editable.Select
          label="Responsibility"
          options={responsibilities}
          value={fields.responsibility}
          onChange={(next) => setField(id, { responsibility: next })}
          save={async () => undefined}
        />
      </Table.Cell>
      <Table.Cell>
        <Editable.Select
          label="Coverage"
          options={coverages}
          value={fields.coverage}
          onChange={(next) => setField(id, { coverage: next })}
          save={async () => undefined}
        />
      </Table.Cell>
      <Table.Cell>
        <Editable.Text
          value={fields.claim}
          placeholder="The bounded claim"
          onChange={(next) => setField(id, { claim: next })}
          save={async () => undefined}
        />
      </Table.Cell>
    </>
  );
}

/* ------------------------------------------ Requirements onto one element */

const typeFilters = [
  "Any type",
  "System security",
  "Derived",
  "Component",
  "Interface",
  "Process",
] as const;

export function AllocateRequirementsSheet({
  programId,
  node,
  open,
  onClose,
}: {
  programId: string;
  node: CompositionNode;
  open: boolean;
  onClose: () => void;
}) {
  const [frame, setFrame] = useState<Frame>("choose");
  const [query, setQuery] = useState("");
  const [type, setType] = useState<(typeof typeFilters)[number]>("Any type");
  const [fromControl, setFromControl] = useState(false);
  const [sort, setSort] = useState<"asc" | "desc">("asc");
  const [ruledOut, setRuledOut] = useState<Record<string, string>>({});
  const choice = useChoice();

  const candidates = useMemo(
    () => (open ? undecidedFor(node.id, programId) : []),
    [open, node.id, programId],
  );
  const q = query.trim().toLowerCase();
  const rows = candidates
    .filter(
      (r) =>
        (!q || r.id.toLowerCase().includes(q) || r.text.toLowerCase().includes(q)) &&
        (type === "Any type" || r.type === type) &&
        (!fromControl || r.derivations.some((d) => d.sourceType === "Control statement")),
    )
    .sort((a, b) => (sort === "asc" ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id)));
  const allShown = rows.length > 0 && rows.every((r) => choice.chosen.has(r.id));
  const someShown = rows.some((r) => choice.chosen.has(r.id));
  const chosenRows = candidates.filter((r) => choice.chosen.has(r.id));
  const applying = chosenRows.filter((r) => !(r.id in ruledOut));
  const missingClaims = applying.filter((r) => !choice.fieldOf(r.id).claim.trim()).length;
  const missingReasons = Object.values(ruledOut).filter((v) => !v.trim()).length;

  const close = () => {
    setFrame("choose");
    setQuery("");
    setRuledOut({});
    choice.reset();
    onClose();
  };

  const confirm = () => {
    const who = currentSession().name;
    for (const r of chosenRows) {
      const reason = ruledOut[r.id];
      const f = choice.fieldOf(r.id);
      decideApplicability({
        requirement: r.id,
        target: node.id,
        targetKind: "node",
        applies: reason === undefined,
        rationale: reason ?? "Applies to this element.",
        decidedBy: who,
        ...(reason === undefined
          ? {
              allocation: {
                responsibility: f.responsibility,
                coverage: f.coverage,
                scope: f.claim.trim(),
                owner: who,
              },
            }
          : {}),
      });
    }
    for (const r of applying) {
      const made = allocationsFor(r.id).find((a) => a.target === node.id);
      if (made) reviewLink({ kind: "allocation", id: made.id }, who);
    }
    const out = Object.keys(ruledOut).length;
    toast.success(`${applying.length} allocated to ${node.name}`, {
      description: out ? `${out} recorded as not applying` : undefined,
    });
    close();
  };

  if (frame === "choose")
    return (
      <PickerSheet
        open={open}
        onClose={close}
        width={880}
        title="Allocate requirements"
        subtitle={`${node.name} · ${candidates.length} not yet answered here`}
        search={{ value: query, onChange: setQuery, placeholder: "Search requirements" }}
        filters={
          <>
            <FilterChip
              label="Type"
              value={type === "Any type" ? undefined : type}
              isActive={type !== "Any type"}
              onClick={() =>
                setType((t) => typeFilters[(typeFilters.indexOf(t) + 1) % typeFilters.length]!)
              }
            />
            <FilterChip
              label="From a control"
              isActive={fromControl}
              onClick={() => setFromControl((v) => !v)}
            />
          </>
        }
        selected={choice.chosen.size}
        total={rows.length}
        onClear={() => choice.setChosen(new Set())}
        action={{
          label: `Continue with ${choice.chosen.size}`,
          onClick: () => setFrame("details"),
        }}
      >
        <Table>
          <thead>
            <tr>
              <Table.Selection
                header
                checked={allShown ? true : someShown ? "indeterminate" : false}
                onCheckedChange={(checked) =>
                  choice.setChosen((prev) => {
                    const next = new Set(prev);
                    for (const r of rows)
                      if (checked) next.add(r.id);
                      else next.delete(r.id);
                    return next;
                  })
                }
                label="Select every row shown"
              />
              <Table.Header
                width={110}
                sort={sort}
                onSort={() => setSort((s) => (s === "asc" ? "desc" : "asc"))}
              >
                Requirement
              </Table.Header>
              <Table.Header>Shall statement</Table.Header>
              <Table.Header width={120}>Type</Table.Header>
              <Table.Header width={104}>Source</Table.Header>
              <Table.Header width={96}>State</Table.Header>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Table.Row
                key={r.id}
                isSelected={choice.chosen.has(r.id)}
                onClick={() => choice.toggle(r.id)}
                className="cursor-pointer"
              >
                <Table.Selection
                  checked={choice.chosen.has(r.id)}
                  onCheckedChange={() => choice.toggle(r.id)}
                  label={`Select ${r.id}`}
                />
                <Table.Cell>
                  <Id>{r.id}</Id>
                </Table.Cell>
                <Table.Cell className="truncate" title={r.text}>
                  {r.text}
                </Table.Cell>
                <Table.Cell className="truncate">{r.type}</Table.Cell>
                <Table.Cell>
                  {r.derivations[0] ? (
                    <Badge size="xsmall" tone={derivationSourceTone[r.derivations[0].sourceType]}>
                      {r.derivations[0].sourceId}
                    </Badge>
                  ) : null}
                </Table.Cell>
                <Table.Cell>
                  <Badge size="xsmall" tone={requirementStateTone[r.state]}>
                    {r.state}
                  </Badge>
                </Table.Cell>
              </Table.Row>
            ))}
          </tbody>
        </Table>
        {rows.length === 0 ? (
          <Text as="p" size="small" color="color.text.subtle" className="pt-150">
            Nothing matches.
          </Text>
        ) : null}
      </PickerSheet>
    );

  return (
    <PickerSheet
      open={open}
      onClose={close}
      onBack={() => setFrame("choose")}
      width={880}
      title="Allocate requirements"
      subtitle={
        missingClaims || missingReasons
          ? `${node.name} · ${missingClaims ? `${missingClaims} without a claim` : ""}${missingClaims && missingReasons ? " · " : ""}${missingReasons ? `${missingReasons} without a reason` : ""}`
          : `${node.name} · responsibility, coverage and the claim for each`
      }
      toolbar={<DefaultsRow applyAll={choice.applyAll} />}
      selected={applying.length}
      action={{
        label: `Allocate ${applying.length} to ${node.name}`,
        onClick: confirm,
        disabled: missingClaims > 0 || missingReasons > 0,
      }}
    >
      <Table>
        <thead>
          <tr>
            <Table.Header width={104}>Requirement</Table.Header>
            <Table.Header>Shall statement</Table.Header>
            <Table.Header width={116}>Responsibility</Table.Header>
            <Table.Header width={90}>Coverage</Table.Header>
            <Table.Header width={280}>Claim</Table.Header>
            <Table.Header width={104} />
          </tr>
        </thead>
        <tbody>
          {chosenRows.map((r) => {
            const out = ruledOut[r.id];
            return (
              <Table.Row key={r.id} isStatic>
                <Table.Cell>
                  <Id>{r.id}</Id>
                </Table.Cell>
                <Table.Cell className="truncate" title={r.text}>
                  {r.text}
                </Table.Cell>
                {out === undefined ? (
                  <FieldCells id={r.id} fields={choice.fieldOf(r.id)} setField={choice.setField} />
                ) : (
                  <>
                    <Table.Cell>
                      <Indicator tone="neutral">Does not apply</Indicator>
                    </Table.Cell>
                    <Table.Cell />
                    <Table.Cell>
                      <Editable.Text
                        value={out}
                        placeholder="Why it does not reach this element"
                        onChange={(next) => setRuledOut((m) => ({ ...m, [r.id]: next }))}
                        save={async () => undefined}
                      />
                    </Table.Cell>
                  </>
                )}
                <Table.Cell className="text-right">
                  <Button
                    variant="link"
                    size="small"
                    onClick={() =>
                      setRuledOut((m) => {
                        const next = { ...m };
                        if (r.id in next) delete next[r.id];
                        else next[r.id] = "";
                        return next;
                      })
                    }
                  >
                    {out === undefined ? "Does not apply" : "Applies"}
                  </Button>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </tbody>
      </Table>
    </PickerSheet>
  );
}

/* ------------------------------------------ Elements onto one requirement */

type Target = { id: string; name: string; kind: AllocationTargetKind; detail: string };

const kindLabel: Record<AllocationTargetKind, string> = {
  node: "Element",
  provider: "Provider",
  process: "Process",
};

export function AllocateElementsSheet({
  programId,
  requirement,
  open,
  onClose,
}: {
  programId: string;
  requirement: Requirement;
  open: boolean;
  onClose: () => void;
}) {
  const [frame, setFrame] = useState<Frame>("choose");
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<AllocationTargetKind | null>(null);
  const choice = useChoice();

  const candidates = useMemo<Target[]>(() => {
    if (!open) return [];
    const taken = new Set(allocationsFor(requirement.id).map((a) => a.target));
    return [
      ...nodesForProgram(programId).map((n) => ({
        id: n.id,
        name: n.name,
        kind: "node" as const,
        detail: `${n.kind} · ${pathLabel(n.id)}`,
      })),
      ...systemComponents.map((c) => ({
        id: c.key,
        name: c.name,
        kind: "provider" as const,
        detail: "Inheritable capability",
      })),
      ...securityProcesses.map((p) => ({
        id: p.id,
        name: p.name,
        kind: "process" as const,
        detail: "Operational process",
      })),
    ].filter((t) => !taken.has(t.id));
  }, [open, programId, requirement.id]);

  const q = query.trim().toLowerCase();
  const rows = candidates.filter(
    (t) =>
      (!q || t.name.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)) &&
      (!kind || t.kind === kind),
  );
  const allShown = rows.length > 0 && rows.every((t) => choice.chosen.has(t.id));
  const someShown = rows.some((t) => choice.chosen.has(t.id));
  const chosenRows = candidates.filter((t) => choice.chosen.has(t.id));
  const missing = chosenRows.filter((t) => !choice.fieldOf(t.id).claim.trim()).length;

  const close = () => {
    setFrame("choose");
    setQuery("");
    choice.reset();
    onClose();
  };

  const confirm = () => {
    for (const t of chosenRows) {
      const f = choice.fieldOf(t.id);
      const made = addAllocation({
        requirement: requirement.id,
        target: t.id,
        targetKind: t.kind,
        responsibility: f.responsibility,
        coverage: f.coverage,
        scope: f.claim.trim(),
        owner: requirement.owner,
        rationale: "",
      });
      reviewLink({ kind: "allocation", id: made.id }, currentSession().name);
    }
    toast.success(`${requirement.id} allocated to ${chosenRows.length}`);
    close();
  };

  if (frame === "choose")
    return (
      <PickerSheet
        open={open}
        onClose={close}
        width={880}
        title={`Allocate ${requirement.id}`}
        subtitle={requirement.text}
        search={{ value: query, onChange: setQuery, placeholder: "Search elements" }}
        filters={
          <FilterChip
            label="Kind"
            value={kind ? kindLabel[kind] : undefined}
            isActive={kind !== null}
            onClick={() =>
              setKind((k) =>
                k === null
                  ? "node"
                  : k === "node"
                    ? "provider"
                    : k === "provider"
                      ? "process"
                      : null,
              )
            }
          />
        }
        selected={choice.chosen.size}
        total={rows.length}
        onClear={() => choice.setChosen(new Set())}
        action={{
          label: `Continue with ${choice.chosen.size}`,
          onClick: () => setFrame("details"),
        }}
      >
        <Table>
          <thead>
            <tr>
              <Table.Selection
                header
                checked={allShown ? true : someShown ? "indeterminate" : false}
                onCheckedChange={(checked) =>
                  choice.setChosen((prev) => {
                    const next = new Set(prev);
                    for (const t of rows)
                      if (checked) next.add(t.id);
                      else next.delete(t.id);
                    return next;
                  })
                }
                label="Select every row shown"
              />
              <Table.Header width={240}>Name</Table.Header>
              <Table.Header width={96}>Kind</Table.Header>
              <Table.Header>Where</Table.Header>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <Table.Row
                key={t.id}
                isSelected={choice.chosen.has(t.id)}
                onClick={() => choice.toggle(t.id)}
                className="cursor-pointer"
              >
                <Table.Selection
                  checked={choice.chosen.has(t.id)}
                  onCheckedChange={() => choice.toggle(t.id)}
                  label={`Select ${t.name}`}
                />
                <Table.Cell className="truncate">{t.name}</Table.Cell>
                <Table.Cell>{kindLabel[t.kind]}</Table.Cell>
                <Table.Cell className="truncate" title={t.detail}>
                  {t.detail}
                </Table.Cell>
              </Table.Row>
            ))}
          </tbody>
        </Table>
      </PickerSheet>
    );

  return (
    <PickerSheet
      open={open}
      onClose={close}
      onBack={() => setFrame("choose")}
      width={880}
      title={`Allocate ${requirement.id}`}
      subtitle={
        missing ? `${missing} without a claim` : "Responsibility, coverage and the claim for each"
      }
      toolbar={<DefaultsRow applyAll={choice.applyAll} />}
      selected={chosenRows.length}
      action={{
        label: `Allocate ${requirement.id} to ${chosenRows.length}`,
        onClick: confirm,
        disabled: missing > 0,
      }}
    >
      <Table>
        <thead>
          <tr>
            <Table.Header>Name</Table.Header>
            <Table.Header width={124}>Responsibility</Table.Header>
            <Table.Header width={96}>Coverage</Table.Header>
            <Table.Header width={300}>Claim</Table.Header>
            <Table.Header width={80} />
          </tr>
        </thead>
        <tbody>
          {chosenRows.map((t) => (
            <Table.Row key={t.id} isStatic>
              <Table.Cell className="truncate" title={t.detail}>
                {t.name}
              </Table.Cell>
              <FieldCells id={t.id} fields={choice.fieldOf(t.id)} setField={choice.setField} />
              <Table.Cell className="text-right">
                <Button variant="link" size="small" onClick={() => choice.toggle(t.id)}>
                  Remove
                </Button>
              </Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
    </PickerSheet>
  );
}
