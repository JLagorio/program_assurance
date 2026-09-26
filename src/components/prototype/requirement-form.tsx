import { useConfirmation, discardChanges } from "@/components/app/confirmation";
import { useRef, useState } from "react";
import { useBlocker } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import {
  Absent,
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Button,
  Editable,
  FieldSet,
  Inline,
  KeyValue,
  Prose,
  Section,
  Stack,
} from "@ledger/design-system";
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
  // Each field's editable row, so focus can return to it when the failed-change alert goes away.
  const fieldNodes = useRef<Partial<Record<FieldName, HTMLDivElement | null>>>({});
  const alertRef = useRef<HTMLDivElement>(null);
  const fieldNode = (field: FieldName) => (node: HTMLDivElement | null) => {
    fieldNodes.current[field] = node;
  };
  /** When the alert that held focus is about to go, send focus back to the field it was about. */
  const returnFocus = (field: FieldName) => {
    if (!alertRef.current?.contains(document.activeElement)) return;
    requestAnimationFrame(() => {
      const active = document.activeElement;
      if (active && active !== document.body) return;
      fieldNodes.current[field]?.querySelector<HTMLElement>("button, input, textarea")?.focus();
    });
  };
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
    const failed = activeRequest.current;
    if (failed) returnFocus(failed.field);
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
      if (!(await confirm(discardChanges("Your unsaved change to this requirement will be lost."))))
        return true;
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
    // A retry keeps the failed-change alert, and its focused Retry button, until it settles.
    if (!retry) setPending(null);
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
      if (retry) returnFocus(field);
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
      values[field] ? (
        <Prose>{values[field]}</Prose>
      ) : (
        <Absent label="Not recorded" />
      )
    ) : (
      // Editable reports a draft only at commit; the draft guard reads the field's own input
      // until the kit offers a draft callback.
      <div
        ref={fieldNode(field)}
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
      {/* Never disabled: a disabled row would drop the focus the Editable keeps on it while it
          saves. A second change while one is saving or failed is refused by `save` instead, with
          the reason under that row. */}
      <FieldSet key={generation} aria-label="Requirement details" aria-busy={busy}>
        <Stack space="space.250">
          <Section title="Requirement details">
            <KeyValue.Group labelWidth={128}>
              <KeyValue label="Title" wrap>
                {text("title")}
              </KeyValue>
              <KeyValue label="Requirement type" wrap>
                {readOnly || !typeOptions.length ? (
                  labelFor(values.requirementType)
                ) : (
                  <div ref={fieldNode("requirementType")}>
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
                  </div>
                )}
              </KeyValue>
              <KeyValue label="Owner" wrap>
                {readOnly || parties.isPending || parties.error ? (
                  ownerLabel(values.ownerPartyId)
                ) : (
                  <div ref={fieldNode("ownerPartyId")}>
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
                  </div>
                )}
              </KeyValue>
            </KeyValue.Group>
            {parties.error && (
              <Alert variant="destructive" role="alert">
                <AlertCircle aria-hidden />
                <AlertTitle>The owners could not be loaded</AlertTitle>
                <AlertDescription>{parties.error.message}</AlertDescription>
                <AlertAction>
                  <Button size="small" onClick={() => void parties.refetch()}>
                    Retry loading owners
                  </Button>
                </AlertAction>
              </Alert>
            )}
          </Section>
          <Section title="Statement">{text("statement", true)}</Section>
          <Section title="Acceptance criteria">{text("acceptanceCriteria", true)}</Section>
          <Section title="Rationale">{text("rationale", true)}</Section>
        </Stack>
      </FieldSet>
      {pending && (
        <Alert ref={alertRef} variant="destructive" role="alert">
          <AlertCircle aria-hidden />
          <AlertTitle>The change to {labels[pending.field].toLowerCase()} was not saved</AlertTitle>
          <AlertDescription>
            <Stack space="space.150">
              <span>{pending.error}</span>
              <KeyValue label={labels[pending.field]} wrap>
                {pending.field === "ownerPartyId" ? (
                  ownerLabel(pending.value)
                ) : pending.field === "requirementType" ? (
                  labelFor(pending.value)
                ) : pending.value ? (
                  <Prose>{pending.value}</Prose>
                ) : (
                  <Absent label="No value" />
                )}
              </KeyValue>
              <Inline space="space.100">
                <Button
                  variant="secondary"
                  isLoading={busy}
                  onClick={() => void save(pending.field, pending.value, pending).catch(() => {})}
                >
                  Retry change
                </Button>
                <Button variant="subtle" onClick={discard}>
                  Discard change
                </Button>
              </Inline>
            </Stack>
          </AlertDescription>
        </Alert>
      )}
      {confirmation}
    </Stack>
  );
}
