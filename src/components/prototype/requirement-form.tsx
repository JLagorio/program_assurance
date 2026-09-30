import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
  KeyValue,
  Prose,
  Section,
  Skeleton,
  Stack,
  Text,
  VisuallyHidden,
  type EditableOption,
} from "@ledger/design-system";
import { useWorkspace } from "@/components/app/workspace";
import { useRows, type Row } from "@/lib/models";
import { useEditRequirement } from "@/lib/requirement-edit";
import { labelFor } from "@/lib/records";

type FieldName =
  "title" | "statement" | "acceptanceCriteria" | "rationale" | "requirementType" | "ownerPartyId";
type Values = Record<FieldName, string>;
type PendingChange = { field: FieldName; value: string; requestId: string };
/**
 * What the form reports as it changes: an unsaved or refused change, a save in flight, and how to
 * drop what is unsaved. The record guards leaving with it, since the form's tab may be hidden.
 */
export type RequirementEditState = { dirty: boolean; busy: boolean; discard: () => void };
const labels: Record<FieldName, string> = {
  title: "Title",
  statement: "Statement",
  acceptanceCriteria: "Acceptance criteria",
  rationale: "Rationale",
  requirementType: "Requirement type",
  ownerPartyId: "Owner",
};
/** Each authored field's column on the revision row. */
const columns = {
  title: "title",
  statement: "statement",
  acceptanceCriteria: "acceptance_criteria",
  rationale: "rationale",
  requirementType: "requirement_type",
  ownerPartyId: "owner_party_id",
} as const satisfies Record<FieldName, keyof Row<"requirement_revisions">>;
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
/** What the server stores for a value: authored text is trimmed, and an empty rationale or owner is none. */
function stored(field: FieldName, value: string) {
  const trimmed = field === "ownerPartyId" || field === "requirementType" ? value : value.trim();
  return (field === "rationale" || field === "ownerPartyId") && !trimmed ? null : trimmed;
}

/**
 * Existing records save one authored field at a time through the kit's inline editing contract.
 * The Editables report their drafts, keep a refused value with Try again and Discard, and lock
 * the other rows with a reason while one change saves or waits; the form never remounts or
 * disables around a save, so focus stays on the row that saved.
 */
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
  const cache = useQueryClient();
  // The revision the next save expects. It advances with each save this form makes, and takes a
  // newer source only while nothing is unsaved: a refetch never silently moves an edit's CAS.
  const [baseline, setBaseline] = useState(source);
  const baselineRef = useRef(source);
  const [values, setValues] = useState(() => valuesFor(source));
  // The field whose change is saving, and the refused change that waits for Try again or Discard.
  const [saving, setSaving] = useState<FieldName | null>(null);
  const [pending, setPending] = useState<PendingChange | null>(null);
  // Bumped only by a confirmed discard, which resets every row's refused value.
  const [generation, setGeneration] = useState(0);
  const draft = useRef<Partial<Values>>({});
  const activeRequest = useRef<PendingChange | null>(null);
  const inFlight = useRef(false);
  const workspace = useWorkspace();
  const parties = useRows("parties");
  const edit = useEditRequirement();
  const original = valuesFor(baseline);
  const typeOptions: EditableOption<string>[] = (
    workspace.collections
      .find((row) => row.name === "requirement_revisions")
      ?.columns.find((column) => column.name === "requirement_type")?.choices ?? []
  ).map((value) => ({ value, label: labelFor(value) }));
  const roster = (parties.data ?? []).filter((party) => party.tenant_id === workspace.tenantId);
  const nameCounts = new Map<string, number>();
  for (const party of roster) nameCounts.set(party.name, (nameCounts.get(party.name) ?? 0) + 1);
  // Owners are chosen by name and stored by id; two people with one name are told apart by email.
  const ownerOptions: EditableOption<string>[] = roster
    .map((party) => ({
      value: party.id,
      label:
        (nameCounts.get(party.name) ?? 0) > 1 && party.email
          ? `${party.name} · ${party.email}`
          : party.name,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const known = new Set(ownerOptions.map((option) => option.value));

  const dirty = () => Object.keys(draft.current).length > 0 || activeRequest.current !== null;
  const report = () => onStateChange({ dirty: dirty(), busy: inFlight.current, discard });
  function discard() {
    if (inFlight.current) return;
    draft.current = {};
    activeRequest.current = null;
    setPending(null);
    setValues(valuesFor(baselineRef.current));
    setGeneration((value) => value + 1);
    report();
  }
  /** A row's unsaved draft, as its Editable reports it: `null` once saved, put back or discarded. */
  const track = (field: FieldName, value: string | null) => {
    if (value === null || value === original[field]) delete draft.current[field];
    else draft.current[field] = value;
    report();
  };
  /** The reader dropped a row's edit: a refused change of that row goes with it. */
  const dropped = (field: FieldName) => {
    if (inFlight.current || activeRequest.current?.field !== field) return;
    activeRequest.current = null;
    setPending(null);
    report();
  };
  // A newer revision of the same record (another session's edit, or this form's own save coming
  // back from the server, as it stored it) is taken once nothing is unsaved here.
  useEffect(() => {
    const current = baselineRef.current;
    if (source === current || source.id !== current.id || source.revision < current.revision)
      return;
    if (inFlight.current || dirty()) return;
    baselineRef.current = source;
    setBaseline(source);
    setValues(valuesFor(source));
  }, [source]);

  async function save(field: FieldName, value: string) {
    if (inFlight.current)
      throw new Error(`Wait for the change to ${labels[saving ?? field]} to finish saving.`);
    if (readOnly) throw new Error("This requirement is read-only.");
    const waiting = activeRequest.current;
    if (waiting && waiting.field !== field)
      throw new Error(`Try again or discard the change to ${labels[waiting.field]} first.`);
    // Try again sends the refused change as it was, under its request id, so a save that landed
    // before its response was lost is not applied twice; a new value is a new request.
    const change =
      waiting && waiting.value === value
        ? waiting
        : { field, value, requestId: crypto.randomUUID() };
    activeRequest.current = change;
    draft.current[field] = value;
    inFlight.current = true;
    setSaving(field);
    setPending(null);
    report();
    const expected = baselineRef.current;
    try {
      const result = await edit.mutateAsync({
        requirementId,
        requestId: change.requestId,
        contentId: expected.id,
        expectedRevision: expected.revision,
        patch: { [field]: stored(field, value) },
      });
      const next = result.changed
        ? { ...expected, revision: result.revision, [columns[field]]: stored(field, value) }
        : expected;
      baselineRef.current = next;
      setBaseline(next);
      if (!result.changed) setValues(valuesFor(next));
      delete draft.current[field];
      activeRequest.current = null;
      inFlight.current = false;
      setSaving(null);
      report();
    } catch (cause) {
      inFlight.current = false;
      setSaving(null);
      setPending(change);
      report();
      // A refusal is often a newer revision elsewhere: fetch it, so Discard shows what is current.
      void cache.invalidateQueries({
        queryKey: ["models", workspace.tenantId, "requirement_revisions"],
      });
      throw cause;
    }
  }
  /** One change at a time: the other rows wait, and say why, while one saves or was refused. */
  const lockFor = (field: FieldName) =>
    saving && saving !== field
      ? `Wait for the change to ${labels[saving]} to finish saving.`
      : pending && pending.field !== field
        ? `Try again or discard the change to ${labels[pending.field]} first.`
        : undefined;
  /** What fixes an empty required field, in the words the create form uses. */
  const missing: Partial<Record<FieldName, string>> = {
    title: "Enter a title.",
    statement: "Enter the requirement statement.",
    acceptanceCriteria: "Enter the acceptance criteria.",
  };
  const required = (field: FieldName) => (value: string) =>
    value.trim() ? null : (missing[field] ?? `Enter the ${labels[field].toLowerCase()}.`);
  const text = (
    field: "title" | "statement" | "acceptanceCriteria" | "rationale",
    multiline = false,
  ) =>
    readOnly ? (
      values[field] ? (
        multiline ? (
          <Prose>{values[field]}</Prose>
        ) : (
          values[field]
        )
      ) : (
        <Absent label="Not recorded" />
      )
    ) : (
      <Editable.Text
        label={labels[field]}
        value={values[field]}
        multiline={multiline}
        placeholder={field === "rationale" ? "Add rationale" : undefined}
        validate={field === "rationale" ? undefined : required(field)}
        lockedReason={lockFor(field)}
        onChange={(value) => setValues((previous) => ({ ...previous, [field]: value }))}
        onDraftChange={(value) => track(field, value)}
        onCancel={() => dropped(field)}
        save={(value) => save(field, value)}
      />
    );
  /** The owner as text where it cannot be chosen: while the owners load or failed, or read-only. */
  const ownerText = () => {
    const id = values.ownerPartyId;
    if (!id) return "Unassigned";
    const party = roster.find((row) => row.id === id);
    if (party) return party.name;
    if (parties.data === undefined && parties.error)
      return <Text color="color.text.subtle">Could not load</Text>;
    if (parties.data === undefined)
      return (
        <>
          <Skeleton shape="line" width={96} />
          <VisuallyHidden>Loading</VisuallyHidden>
        </>
      );
    return <Text color="color.text.subtle">Not available</Text>;
  };

  return (
    <Stack space="space.250">
      {/* Never disabled: a disabled row would drop the focus the Editable keeps on it while it
          saves. The other rows are locked with the reason instead. */}
      <FieldSet key={generation} aria-label="Requirement details" aria-busy={saving !== null}>
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
                  <Editable.Select
                    label="Requirement type"
                    value={values.requirementType}
                    options={typeOptions}
                    lockedReason={lockFor("requirementType")}
                    onChange={(value) =>
                      setValues((previous) => ({ ...previous, requirementType: value }))
                    }
                    onDraftChange={(value) => track("requirementType", value)}
                    onCancel={() => dropped("requirementType")}
                    save={(value) => save("requirementType", value)}
                  />
                )}
              </KeyValue>
              <KeyValue label="Owner" wrap>
                {readOnly || parties.data === undefined ? (
                  ownerText()
                ) : (
                  <Editable.Select
                    label="Owner"
                    value={values.ownerPartyId}
                    options={ownerOptions}
                    emptyLabel="Unassigned"
                    searchable
                    // An owner who left the workspace's roster reads as such, never as an id.
                    render={(value, label) =>
                      value && !known.has(value) ? (
                        <Text color="color.text.subtle">Not available</Text>
                      ) : (
                        label
                      )
                    }
                    lockedReason={lockFor("ownerPartyId")}
                    onChange={(value) =>
                      setValues((previous) => ({ ...previous, ownerPartyId: value }))
                    }
                    onDraftChange={(value) => track("ownerPartyId", value)}
                    onCancel={() => dropped("ownerPartyId")}
                    save={(value) => {
                      if (value && !known.has(value))
                        return Promise.reject(
                          new Error("This owner is no longer in the workspace. Choose another."),
                        );
                      return save("ownerPartyId", value);
                    }}
                  />
                )}
              </KeyValue>
            </KeyValue.Group>
            {parties.error && (
              <Alert variant="destructive" role="alert">
                <AlertCircle aria-hidden />
                <AlertTitle>The owners could not be loaded</AlertTitle>
                <AlertDescription>{parties.error.message}</AlertDescription>
                <AlertAction>
                  <Button
                    size="small"
                    isLoading={parties.isFetching}
                    onClick={() => void parties.refetch()}
                  >
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
    </Stack>
  );
}
