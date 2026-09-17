import { useConfirmation, discardChanges } from "@/components/app/confirmation";
import { useRef, useState } from "react";
import { useBlocker } from "@tanstack/react-router";
import { Button, Editable, Inline, KeyValue, Section, Stack } from "@ledger/design-system";
import { useWorkspace } from "@/components/app/workspace";
import { useRows, type Row } from "@/lib/models";
import { useEditRequirement } from "@/lib/requirement-edit";
import { labelFor } from "@/lib/records";

type FieldName =
  "title" | "statement" | "acceptanceCriteria" | "rationale" | "requirementType" | "ownerPartyId";
type Values = Record<FieldName, string>;
type PendingChange = { field: FieldName; value: string; requestId: string; error?: string };
export type RequirementEditState = { dirty: boolean; busy: boolean; discard: () => void };
const labels: Record<FieldName, string> = {
  title: "Title",
  statement: "Statement",
  acceptanceCriteria: "Acceptance criteria",
  rationale: "Rationale",
  requirementType: "Requirement type",
  ownerPartyId: "Owner",
};
function valuesFor(row: Row<"requirement_revisions">): Values {
  return {
    title: row.title,
    statement: row.statement,
    acceptanceCriteria: row.acceptance_criteria,
    rationale: row.rationale ?? "",
    requirementType: row.requirement_type,
    ownerPartyId: row.owner_party_id ?? "",
  };
}

/** Existing records save one authored field at a time through the kit's inline editing contract. */
export function RequirementForm({
  requirementId,
  source,
  readOnly,
  onStateChange,
}: {
  requirementId: string;
  source: Row<"requirement_revisions">;
  readOnly: boolean;
  onStateChange: (state: RequirementEditState) => void;
}) {
  const { confirm, confirmation } = useConfirmation();
  // Pin the exact source snapshot; a refetch must never silently advance an in-progress edit's CAS.
  const [baseline] = useState(source);
  const [values, setValues] = useState(() => valuesFor(baseline));
  const [pending, setPending] = useState<PendingChange | null>(null);
  const [busy, setBusy] = useState(false);
  const [generation, setGeneration] = useState(0);
  const draft = useRef<Partial<Values>>({});
  const activeRequest = useRef<PendingChange | null>(null);
  const inFlight = useRef(false);
  const workspace = useWorkspace();
  const parties = useRows("parties");
  const edit = useEditRequirement();
  const original = valuesFor(baseline);
  const typeOptions =
    workspace.collections
      .find((row) => row.name === "requirement_revisions")
      ?.columns.find((column) => column.name === "requirement_type")?.choices ?? [];
  const roster = (parties.data ?? []).filter((party) => party.tenant_id === workspace.tenantId);
  const nameCounts = new Map<string, number>();
  for (const party of roster) nameCounts.set(party.name, (nameCounts.get(party.name) ?? 0) + 1);
  const ownerOptions = roster
    .map((party) => ({
      id: party.id,
      label:
        nameCounts.get(party.name) === 1 && party.name !== "Unassigned"
          ? party.name
          : `${party.name} · ${party.id}`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const ownerLabel = (id: string) =>
    id
      ? (ownerOptions.find((option) => option.id === id)?.label ?? "Owner unavailable")
      : "Unassigned";
  const report = () =>
    onStateChange({
      dirty: Object.keys(draft.current).length > 0 || activeRequest.current !== null,
      busy: inFlight.current,
      discard,
    });
  function discard() {
    if (inFlight.current) return;
    draft.current = {};
    activeRequest.current = null;
    setPending(null);
    setValues(valuesFor(baseline));
    setGeneration((value) => value + 1);
    report();
  }
  const track = (field: FieldName, value: string) => {
    if (value === original[field]) delete draft.current[field];
    else draft.current[field] = value;
    report();
  };
  useBlocker({
    shouldBlockFn: async () => {
      if (inFlight.current) return true;
      if (!Object.keys(draft.current).length && !activeRequest.current) return false;
      if (!(await confirm(discardChanges("Discard your unsaved requirement change?")))) return true;
      discard();
      return false;
    },
    enableBeforeUnload: () =>
      inFlight.current || Object.keys(draft.current).length > 0 || activeRequest.current !== null,
  });

  async function save(field: FieldName, value: string, retry?: PendingChange) {
    if (inFlight.current)
      throw new Error("Wait for the current requirement change to finish saving.");
    if (readOnly) throw new Error("This requirement is read-only.");
    if (
      activeRequest.current &&
      (activeRequest.current.field !== field || activeRequest.current.value !== value)
    )
      throw new Error("Retry or discard the unsaved change before making another change.");
    const change = retry ??
      activeRequest.current ?? { field, value, requestId: crypto.randomUUID() };
    activeRequest.current = change;
    draft.current[field] = value;
    inFlight.current = true;
    setBusy(true);
    setPending(null);
    report();
    try {
      const result = await edit.mutateAsync({
        requirementId,
        requestId: change.requestId,
        contentId: baseline.id,
        expectedRevision: baseline.revision,
        patch: {
          [field]:
            (field === "rationale" || field === "ownerPartyId") && !value.trim() ? null : value,
        },
      });
      draft.current = {};
      activeRequest.current = null;
      inFlight.current = false;
      setBusy(false);
      setPending(null);
      if (!result.changed) {
        setValues(valuesFor(baseline));
        setGeneration((value) => value + 1);
      }
      report();
    } catch (cause) {
      const error =
        cause instanceof Error ? cause.message : "The requirement change could not be saved.";
      inFlight.current = false;
      setBusy(false);
      const failed = { ...change, error };
      activeRequest.current = failed;
      setPending(failed);
      report();
      throw cause;
    }
  }
  const required = (label: string) => (value: string) =>
    value.trim() ? null : `${label} is required.`;
  const text = (
    field: "title" | "statement" | "acceptanceCriteria" | "rationale",
    multiline = false,
  ) =>
    readOnly ? (
      <p className="whitespace-pre-wrap">{values[field] || "Not recorded"}</p>
    ) : (
      <div
        onChange={(event) => {
          const target = event.target;
          if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)
            track(field, target.value);
        }}
        onKeyDownCapture={(event) => {
          if (event.key === "Escape") {
            delete draft.current[field];
            report();
          }
        }}
      >
        <Editable.Text
          label={labels[field]}
          value={values[field]}
          multiline={multiline}
          placeholder={field === "rationale" ? "Add rationale" : undefined}
          validate={field === "rationale" ? undefined : required(labels[field])}
          onChange={(value) => setValues((previous) => ({ ...previous, [field]: value }))}
          save={(value) => save(field, value)}
        />
      </div>
    );

  return (
    <Stack space="space.250">
      <fieldset
        key={generation}
        disabled={busy || !!pending}
        className="min-w-0"
        aria-label="Requirement details"
        aria-busy={busy}
      >
        <Stack space="space.250">
          <Section title="Requirement details">
            <Stack space="space.100">
              <KeyValue label="Title" labelWidth={128} wrap>
                {text("title")}
              </KeyValue>
              <KeyValue label="Requirement type" labelWidth={128} wrap>
                {readOnly || !typeOptions.length ? (
                  labelFor(values.requirementType)
                ) : (
                  <Editable.Select
                    label="Requirement type"
                    value={labelFor(values.requirementType)}
                    options={typeOptions.map((value) => labelFor(value))}
                    onChange={(value) => {
                      const type = typeOptions.find((option) => labelFor(option) === value);
                      if (type) setValues((previous) => ({ ...previous, requirementType: type }));
                    }}
                    save={(value) => {
                      const type = typeOptions.find((option) => labelFor(option) === value);
                      if (!type)
                        return Promise.reject(new Error("Select an available requirement type."));
                      return save("requirementType", type);
                    }}
                  />
                )}
              </KeyValue>
              <KeyValue label="Owner" labelWidth={128} wrap>
                {readOnly || parties.isPending || parties.error ? (
                  ownerLabel(values.ownerPartyId)
                ) : (
                  <Editable.Select
                    label="Owner"
                    value={ownerLabel(values.ownerPartyId)}
                    options={["Unassigned", ...ownerOptions.map((option) => option.label)]}
                    searchable
                    onChange={(value) => {
                      const id =
                        value === "Unassigned"
                          ? ""
                          : ownerOptions.find((option) => option.label === value)?.id;
                      if (id !== undefined)
                        setValues((previous) => ({ ...previous, ownerPartyId: id }));
                    }}
                    save={(value) => {
                      const id =
                        value === "Unassigned"
                          ? ""
                          : ownerOptions.find((option) => option.label === value)?.id;
                      if (id === undefined)
                        return Promise.reject(
                          new Error(
                            "The selected owner is no longer available. Reload the available owners.",
                          ),
                        );
                      return save("ownerPartyId", id);
                    }}
                  />
                )}
              </KeyValue>
              {parties.error && (
                <p role="alert" className="text-danger">
                  Owners could not be loaded: {parties.error.message}
                </p>
              )}
            </Stack>
          </Section>
          <Section title="Statement">{text("statement", true)}</Section>
          <Section title="Acceptance criteria">{text("acceptanceCriteria", true)}</Section>
          <Section title="Rationale">{text("rationale", true)}</Section>
        </Stack>
      </fieldset>
      {pending && (
        <Section title="Unsaved change" description={pending.error}>
          <Stack space="space.150">
            <KeyValue label={labels[pending.field]} wrap>
              {pending.field === "ownerPartyId" ? (
                ownerLabel(pending.value)
              ) : pending.field === "requirementType" ? (
                labelFor(pending.value)
              ) : (
                <span className="whitespace-pre-wrap">{pending.value || "No value"}</span>
              )}
            </KeyValue>
            <Inline space="space.100">
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => void save(pending.field, pending.value, pending).catch(() => {})}
              >
                Retry change
              </Button>
              <Button variant="subtle" disabled={busy} onClick={discard}>
                Discard change
              </Button>
            </Inline>
          </Stack>
        </Section>
      )}
      {confirmation}
    </Stack>
  );
}
