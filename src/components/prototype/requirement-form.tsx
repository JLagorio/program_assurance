import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Absent,
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
import { requirementTypes, useEditRequirement } from "@/lib/requirement-edit";
import { labelFor } from "@/lib/records";
import { ReportFailures } from "./work-common";

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
/** The fields drawn as the record's Details rows rather than in its body. */
const propertyFields: ReadonlySet<FieldName> = new Set(["requirementType", "ownerPartyId"]);
/** The types the edit accepts, in the order a reader scans them: by their words. */
const typeOptions: EditableOption<string>[] = requirementTypes
  .map((value) => ({ value, label: labelFor(value) }))
  .sort((a, b) => a.label.localeCompare(b.label));

/** Says when its rows come into the page and when they leave it. */
function Presence({
  onShow,
  onHide,
  children,
}: {
  onShow: () => void;
  onHide: () => void;
  children: ReactNode;
}) {
  const latest = useRef({ onShow, onHide });
  useEffect(() => {
    latest.current = { onShow, onHide };
  });
  useEffect(() => {
    latest.current.onShow();
    return () => latest.current.onHide();
  }, []);
  return children;
}

/**
 * Existing records save one authored field at a time through the kit's inline editing contract:
 * the authored text in the body, the type and the owner in Details.
 * The Editables report their drafts, keep a refused value with Try again and Discard, and lock
 * the other rows with a reason while one change saves or waits; the form never remounts or
 * disables around a save, so focus stays on the row that saved.
 */
export function RequirementForm({
  requirementId,
  source,
  readOnly,
  onStateChange,
  children,
}: {
  requirementId: string;
  source: Row<"requirement_revisions">;
  readOnly: boolean;
  onStateChange: (state: RequirementEditState) => void;
  /**
   * Places the form's two parts, which share one save at a time: `body`, the authored text, in the
   * record's body; `properties`, the requirement type and the owner as KeyValue rows, in its
   * Details beside the code, the version and the state.
   */
  children: (parts: { body: ReactNode; properties: ReactNode }) => ReactNode;
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
  // The type and the owner sit in the record's Details, which leave the page with the Overview tab
  // while the text stays mounted. Their Editables, and a refused value's Try again, go with them, so
  // a change of theirs refused before or after they leave is dropped here.
  const propertiesShown = useRef(false);
  const propertiesHidden = () => {
    propertiesShown.current = false;
    for (const field of propertyFields) dropped(field);
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
      if (!propertiesShown.current && propertyFields.has(field)) {
        // The row left with the Overview tab and took its Try again with it: the refused change is
        // put back here, so the value shown is the stored one and no other row stays locked.
        activeRequest.current = null;
        delete draft.current[field];
        setValues((previous) => ({ ...previous, [field]: valuesFor(baselineRef.current)[field] }));
      } else setPending(change);
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
        <Absent />
      )
    ) : (
      <Editable.Text
        label={labels[field]}
        value={values[field]}
        multiline={multiline}
        placeholder={field === "rationale" ? "Add rationale" : undefined}
        validate={field === "rationale" ? undefined : required(field)}
        lockedReason={lockFor(field)}
        onValueChange={(value) => setValues((previous) => ({ ...previous, [field]: value }))}
        onDraftChange={(value) => track(field, value)}
        onCancel={() => dropped(field)}
        save={(value) => save(field, value)}
      />
    );
  /** The owner as text where it cannot be chosen: while the owners load or failed, or read-only. */
  const ownerText = () => {
    const id = values.ownerPartyId;
    // No owner is a missing value, read as the empty owner cell reads it.
    if (!id) return <Absent />;
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
    return <Absent label="Not available" />;
  };

  /** The requirement type and the owner: properties, as KeyValue rows for the record's Details. */
  const properties = (
    // Keyed by the discard, as the text is: a confirmed discard resets a row's refused value.
    <Presence
      key={generation}
      onShow={() => {
        propertiesShown.current = true;
      }}
      onHide={propertiesHidden}
    >
      <KeyValue label="Requirement type" wrap>
        {readOnly ? (
          labelFor(values.requirementType)
        ) : (
          <Editable.Select
            label="Requirement type"
            value={values.requirementType}
            options={typeOptions}
            lockedReason={lockFor("requirementType")}
            onValueChange={(value) =>
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
              value && !known.has(value) ? <Absent label="Not available" /> : label
            }
            lockedReason={lockFor("ownerPartyId")}
            onValueChange={(value) =>
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
    </Presence>
  );
  const body = (
    <Stack space="space.250">
      {/* The owners' failure is said by the failure region the form is drawn in, whose Retry
          reloads them; the Owner row says "Could not load" in its place. */}
      <ReportFailures queries={[parties]} />
      {/* Never disabled: a disabled row would drop the focus the Editable keeps on it while it
          saves. The other rows are locked with the reason instead. Busy while any change saves,
          the type's and the owner's in Details included. */}
      <FieldSet key={generation} aria-label="Requirement text" aria-busy={saving !== null}>
        <Stack space="space.250">
          <Section title="Title">{text("title")}</Section>
          <Section title="Statement">{text("statement", true)}</Section>
          <Section title="Acceptance criteria">{text("acceptanceCriteria", true)}</Section>
          <Section title="Rationale">{text("rationale", true)}</Section>
        </Stack>
      </FieldSet>
    </Stack>
  );
  return children({ body, properties });
}
