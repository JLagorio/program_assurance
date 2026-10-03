import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import {
  Absent,
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  DatePicker,
  DateTimeField,
  DialogBody,
  DialogClose,
  DialogFooter,
  ErrorSummary,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldSet,
  Inline,
  Input,
  KeyValue,
  NumberField,
  Section,
  Skeleton,
  Stack,
  Textarea,
  VisuallyHidden,
  toast,
} from "@ledger/design-system";
import { listRecords, saveRecord } from "@/lib/database";
import {
  defaultValue,
  isDerivedRecordField,
  recordPayload,
  recordTitle,
  systemColumns,
  type Collection,
  type Column,
  type DataRecord,
} from "@/lib/records";
import {
  isAdditionalProductField,
  productCollectionNoun,
  productFieldLabel,
  productFieldOrder,
  productRecordNoun,
  productTargetGroups,
} from "@/lib/product-records";
import { statusLabel, vocabularyFor } from "@/lib/status";
import { ChoiceField, RecordField } from "./fields";
import { useFormFeedback, type FormIssue } from "./form-feedback";
import { causeText } from "./sentence";
import { useDraftGuard } from "./use-draft-guard";
import { relatedCollection } from "./record-lookup";
import { useWorkspace } from "./workspace";
import { useSchemaCatalog } from "@/lib/collections";
import { NAME_COLUMNS, useRecordName } from "@/lib/record-names";

const NO_COLLECTIONS: Collection[] = [];

/**
 * A record's name as text: a skeleton while it loads, Absent when it cannot be read. A record
 * with no name of its own is never named by its id or its description: a revision reads as its
 * version ("SSP revision 1"), a control as its code and title, and a record about a control
 * (a selected control, a control implementation) as that control. The names a page shows are
 * read together, one request per collection (useRecordName).
 */
export function RecordName({ collection, id }: { collection: Collection; id: string }) {
  const catalog = useSchemaCatalog();
  const query = useRecordName(collection, id);
  if (query.isError) return <Absent label="Not available" />;
  const record = query.data;
  if (!record)
    return (
      <span aria-busy="true">
        <Skeleton width={160} />
        <VisuallyHidden>Loading</VisuallyHidden>
      </span>
    );
  const text = (key: string) => {
    const value = record[key];
    return typeof value === "string" && value.trim() ? value : undefined;
  };
  const named = NAME_COLUMNS.map(text).find(Boolean);
  if (named) {
    const code = text("code");
    return (
      <>{collection.name === "controls" && code && code !== named ? `${code} · ${named}` : named}</>
    );
  }
  const version = record["version_number"];
  if (typeof version === "number")
    return <>{`${capitalize(productRecordNoun(collection.name))} ${version}`}</>;
  for (const key of ["control_id", "selected_control_id"]) {
    const related = relatedCollection(collection, key, catalog.data ?? []);
    const target = text(key);
    if (related && target) return <RecordName collection={related} id={target} />;
  }
  return <>{capitalize(productRecordNoun(collection.name))}</>;
}

const NUMERIC = /^(smallint|integer|bigint|numeric|decimal|real|double precision)/;
const INTEGER = /^(smallint|integer|bigint)/;
const MULTILINE = /description|narrative|rationale|prose|notes|criteria|content|payload|body/;

type FieldKind =
  "reference" | "choice" | "boolean" | "multiline" | "number" | "date" | "moment" | "text";

function kindOf(column: Column, reference: boolean): FieldKind {
  if (reference) return "reference";
  if (column.choices.length) return "choice";
  if (column.type === "boolean") return "boolean";
  if (MULTILINE.test(column.name) || column.type.startsWith("json") || column.type.endsWith("[]"))
    return "multiline";
  if (NUMERIC.test(column.type)) return "number";
  if (column.type === "date") return "date";
  if (column.type.startsWith("timestamp")) return "moment";
  return "text";
}

/** Labels that name several things take "the": "Enter the acceptance criteria." */
const PLURAL = /(criteria|ies|ions|remarks|notes|details|parameters)$/i;

/** A label inside a sentence: "an owner", "an SSP revision", "the acceptance criteria". */
function withArticle(label: string) {
  if (PLURAL.test(label)) return `the ${label.charAt(0).toLowerCase() + label.slice(1)}`;
  const acronym = /^[A-Z]{2,}/.test(label);
  const word = acronym ? label : label.charAt(0).toLowerCase() + label.slice(1);
  const vowel = acronym ? /^[AEFHILMNORSX]/.test(word) : /^[aeiou]/.test(word);
  return `${vowel ? "an" : "a"} ${word}`;
}

/** What fixes an empty required field, naming it. */
function requiredMessage(kind: FieldKind, label: string, column: string) {
  if (kind === "date") return `${label} needs a date.`;
  if (kind === "moment") return `${label} needs a date and a time.`;
  // "Approved by" names a person by their act: ask for the person, not "an approved by".
  if (kind === "reference" && /_by_party_id$/.test(column))
    return `Choose who it was ${label.toLowerCase()}.`;
  // "Superseded by" names the record that replaces this one.
  if (kind === "reference" && / by$/.test(label))
    return `Choose what it is ${label.toLowerCase()}.`;
  if (kind === "reference" || kind === "choice" || kind === "boolean")
    return `Choose ${withArticle(label)}.`;
  return `Enter ${withArticle(label)}.`;
}

const listFormat = new Intl.ListFormat("en-US", { type: "disjunction" });

/** How many matches one search returns; the list says how many more there are. */
const REFERENCE_PAGE = 50;

/**
 * What a reference field asks for, in its placeholder: the field's own words ("Choose an owner",
 * "Choose a parent organization"), or the record's where the label names an act ("Approved by").
 */
function referencePlaceholder(label: string, collection: Collection) {
  if (!/ by$/i.test(label)) return `Choose ${withArticle(label)}`;
  return collection.name === "parties"
    ? "Choose a person or organization"
    : `Choose ${withArticle(productRecordNoun(collection.name))}`;
}

/** A searchable choice of records the server filters, with the chosen one always named. */
function ReferencePicker({
  collection,
  value,
  onChange,
  label,
  required,
  clearable,
  description,
  error,
  controlRef,
}: {
  collection: Collection;
  value: string;
  onChange: (value: string) => void;
  label: string;
  required: boolean;
  /** A reference the schema lets be empty can be cleared. */
  clearable: boolean;
  description?: string | null | undefined;
  error?: string | undefined;
  controlRef: (node: HTMLElement | null) => void;
}) {
  const workspace = useWorkspace();
  const selected = useRecordName(collection, value || null);
  // A party is a person or an organization, in the words PartyField uses.
  const parties = collection.name === "parties";
  const noun = parties ? "person or organization" : productRecordNoun(collection.name);
  const hint = [description, selected.isError ? `The chosen ${noun} could not be read.` : null]
    .filter(Boolean)
    .join(" ");
  return (
    <RecordField
      label={label}
      value={value || null}
      onChange={(next) => onChange(next ?? "")}
      queryKey={["reference-options", workspace.tenantId, collection.name]}
      search={async (term) => {
        const page = await listRecords(workspace, collection, {
          search: term,
          limit: REFERENCE_PAGE,
        });
        return {
          options: page.records.map((record) => ({
            value: record.id,
            label: recordTitle(record, collection),
          })),
          total: page.count,
        };
      }}
      selected={
        value
          ? {
              value,
              label: selected.data
                ? recordTitle(selected.data, collection)
                : selected.isError
                  ? `Unavailable ${noun}`
                  : `Loading the chosen ${noun}…`,
            }
          : null
      }
      noun={parties ? "people and organizations" : productCollectionNoun(collection.name)}
      required={required}
      clearable={clearable}
      placeholder={referencePlaceholder(label, collection)}
      description={hint || undefined}
      error={error}
      controlRef={controlRef}
    />
  );
}

export type RecordEditorState = {
  dirty: boolean;
  busy: boolean;
  noun: string;
  requestClose: () => void;
};

/**
 * The generic create and edit form for any schema collection. In a Dialog it renders the
 * DialogBody and the DialogFooter, so the owner's DialogContent holds the header and these two;
 * on a page it renders the form and its actions. The fields follow the schema: a Combobox for a
 * record, a Select for a fixed list, DatePicker, DateTimeField and NumberField for days, moments
 * and numbers. It validates on submit and then on change, with a FieldError per field and an
 * ErrorSummary when several fail, and guards the draft through useDraftGuard.
 */
export function RecordEditor({
  collection,
  existing,
  initial,
  initialValues,
  onSaved,
  onCancel,
  presentation = "schema",
  onStateChange,
  formLayout = "page",
  operationLabel,
}: {
  collection: Collection;
  existing?: DataRecord | undefined;
  initial?: [string, string] | undefined;
  initialValues?: Record<string, unknown> | undefined;
  onSaved?: ((record: DataRecord) => void | Promise<void>) | undefined;
  onCancel: () => void;
  presentation?: "schema" | "product";
  formLayout?: "page" | "dialog";
  /** A connect-existing-record operation shares one explicit label across trigger, title and submit. */
  operationLabel?: string | undefined;
  onStateChange?: ((state: RecordEditorState) => void) | undefined;
}) {
  const workspace = useWorkspace();
  // The collection came from the schema, so the schema its references name is already loaded.
  const catalog = useSchemaCatalog();
  const collections = catalog.data ?? NO_COLLECTIONS;
  const formId = useId();
  const [baseline] = useState(existing);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const columns = useMemo(
    () =>
      collection.columns.filter(
        (column) =>
          !systemColumns.has(column.name) &&
          !isDerivedRecordField(collection.name, column.name) &&
          column.name !== "published_at" &&
          !(
            collection.name === "evidence_versions" &&
            [
              "storage_object_name",
              "storage_object_id",
              "media_type",
              "byte_size",
              "sha256",
            ].includes(column.name)
          ),
      ),
    [collection],
  );
  const [fields, setFields] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      columns.map((column) => {
        const value = baseline ? baseline[column.name] : initialValues?.[column.name];
        return [
          column.name,
          initial?.[0] === column.name
            ? initial[1]
            : value === null || value === undefined
              ? baseline
                ? ""
                : defaultValue(column)
              : typeof value === "object"
                ? JSON.stringify(value, null, 2)
                : String(value),
        ];
      }),
    ),
  );
  const noun = productRecordNoun(collection.name, fields);
  // The product's words for a field: "Owner", not "Owner party"; "Contact email" for a party.
  const fieldLabel = (column: Column) => productFieldLabel(collection.name, column.name, fields);
  const [dirty, setDirty] = useState(false);
  const [entryErrors, setEntryErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<{ title: string; message: string } | null>(null);
  const [additionalOpen, setAdditionalOpen] = useState(false);
  const failureRef = useRef<HTMLDivElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const feedback = useFormFeedback<string>();
  const guard = useDraftGuard({
    dirty,
    onClose: onCancel,
    description: `The ${noun} details you entered will be lost.`,
  });
  const busy = guard.busy;
  const closeRef = useRef(guard.close);
  closeRef.current = guard.close;
  const requestClose = useCallback(() => void closeRef.current(), []);
  const stateRef = useRef(onStateChange);
  stateRef.current = onStateChange;
  useEffect(() => {
    stateRef.current?.({ dirty, busy, noun, requestClose });
  }, [dirty, busy, noun, requestClose]);
  useEffect(() => {
    if (failure) failureRef.current?.scrollIntoView({ block: "nearest" });
  }, [failure]);

  const targetOf = (column: Column) => relatedCollection(collection, column.name, collections);
  // A reference the context fixes (the record this one belongs to) is shown, not asked for.
  const contextual = (column: Column) =>
    presentation === "product" &&
    Boolean(
      initialValues?.[column.name] ?? (initial?.[0] === column.name ? initial[1] : undefined),
    ) &&
    Boolean(fields[column.name]) &&
    Boolean(targetOf(column));
  const partyTypeFixed =
    presentation === "product" &&
    !existing &&
    collection.name === "parties" &&
    typeof initialValues?.["party_type"] === "string";
  const contextColumns = columns.filter(contextual);
  // Once the context sets one of a polymorphic target group, the others could only fail the save.
  const groups = productTargetGroups(collection.name);
  const settledByContext = new Set(
    groups
      .filter((group) => group.columns.some((name) => contextColumns.some((c) => c.name === name)))
      .flatMap((group) => group.columns),
  );
  const visibleColumns =
    presentation === "product"
      ? [...columns].sort(productFieldOrder).filter(
          (column) =>
            !contextual(column) &&
            !settledByContext.has(column.name) &&
            // The dialog's title already names the party type the context fixed.
            !(column.name === "party_type" && partyTypeFixed) &&
            !(
              column.name === "state" &&
              fields[column.name] === "draft" &&
              column.choices.includes("published")
            ),
        )
      : columns;
  const mainColumns = visibleColumns.filter(
    (column) => presentation === "schema" || !isAdditionalProductField(column),
  );
  const additionalColumns =
    presentation === "product" ? visibleColumns.filter(isAdditionalProductField) : [];
  const ordered = [...mainColumns, ...additionalColumns];
  // A column the record cannot leave empty: always on an edit, and on a create unless the schema
  // fills it in. The field is marked, and the save checks it, by the same rule.
  const isRequired = (column: Column) => column.required && (!!baseline || !column.default);

  /** Every issue with the values, one per field, in the order the fields appear. */
  function validate(extra: readonly FormIssue<string>[] = []) {
    const found = new Map<string, string>();
    for (const issue of extra) if (!found.has(issue.field)) found.set(issue.field, issue.message);
    for (const [name, message] of Object.entries(entryErrors))
      if (!found.has(name)) found.set(name, message);
    for (const column of ordered) {
      if (found.has(column.name)) continue;
      const raw = fields[column.name] ?? "";
      const kind = kindOf(column, Boolean(targetOf(column)));
      if (!raw.trim()) {
        if (isRequired(column))
          found.set(
            column.name,
            // A record whose body is the record (a comment) asks for the record itself.
            column.name === "body"
              ? `Write the ${noun}.`
              : requiredMessage(kind, fieldLabel(column), column.name),
          );
        continue;
      }
      try {
        recordPayload(collection, { [column.name]: raw }, baseline);
      } catch (cause) {
        found.set(
          column.name,
          cause instanceof Error ? cause.message : `Check ${fieldLabel(column)}.`,
        );
      }
    }
    for (const group of groups) {
      const shown = ordered.filter((column) => group.columns.includes(column.name));
      if (!shown.length || shown.length < group.columns.length) continue;
      const set = shown.filter((column) => fields[column.name]?.trim());
      const names = listFormat.format(shown.map((column) => fieldLabel(column).toLowerCase()));
      if (group.exactlyOne && set.length === 0 && !found.has(shown[0]!.name))
        found.set(shown[0]!.name, `Choose what this ${noun} is about: ${names}.`);
      if (set.length > 1 && !found.has(set[1]!.name))
        found.set(set[1]!.name, `Choose only one of ${names}.`);
    }
    return ordered.flatMap((column) => {
      const message = found.get(column.name);
      return message ? [{ field: column.name, message }] : [];
    });
  }
  const errors = new Map(
    feedback.submitted ? validate().map((issue) => [issue.field, issue.message] as const) : [],
  );

  // In a dialog the kit moves focus to the first field on open; on a page the shell owns focus.

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setFailure(null);
    // A DateTimeField holds Enter on a half-typed moment and reports it through onEntryError, as
    // it does when focus leaves it, so its entry error is among the issues below.
    const issues = validate();
    if (issues.some((issue) => additionalColumns.some((column) => column.name === issue.field)))
      setAdditionalOpen(true);
    if (!feedback.report(issues)) return;
    let payload: Record<string, unknown>;
    try {
      payload = recordPayload(collection, fields, baseline);
    } catch (cause) {
      setFailure({
        title: `Check the ${noun} details`,
        message: causeText(cause, "A value could not be read."),
      });
      return;
    }
    // The fields lock while the save runs; the primary stays focusable while it loads.
    submitRef.current?.focus();
    if (!guard.start()) return;
    let record: DataRecord;
    try {
      record = await saveRecord(workspace, collection, payload, baseline);
    } catch (cause) {
      setFailure({
        title: existing ? `The ${noun} was not saved` : `The ${noun} was not created`,
        message: `${causeText(cause)} Your details are kept.`,
      });
      guard.finish();
      return;
    }
    guard.release();
    setDirty(false);
    guard.finish();
    // The write is confirmed; the lists refresh behind the next view.
    void Promise.all(
      [
        ["records"],
        ["record", workspace.tenantId, collection.name, record.id],
        ["record-name", workspace.tenantId, collection.name, record.id],
        ["models", workspace.tenantId, collection.name],
        ["model", workspace.tenantId, collection.name],
        ["reference-options", workspace.tenantId, collection.name],
      ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
    ).catch(() => {});
    try {
      if (onSaved) {
        await onSaved(record);
        return;
      }
      if (existing) onCancel();
      await navigate({
        to: "/records/$collection/$recordId",
        params: { collection: collection.name, recordId: record.id },
        search: {},
      });
    } catch (cause) {
      toast.add({
        type: "error",
        timeout: 8000,
        title: existing ? `${capitalize(noun)} saved` : `${capitalize(noun)} created`,
        description: `The next view could not be opened. ${causeText(cause, "")}`.trim(),
      });
    }
  }

  function change(column: Column, next: string) {
    setFields((previous) => ({ ...previous, [column.name]: next }));
    setDirty(true);
  }
  function entryError(column: Column, message: string | null) {
    setEntryErrors((previous) => {
      if (!message) {
        if (!(column.name in previous)) return previous;
        const { [column.name]: _removed, ...rest } = previous;
        return rest;
      }
      return previous[column.name] === message ? previous : { ...previous, [column.name]: message };
    });
  }

  const renderField = (column: Column) => {
    const target = targetOf(column);
    const kind = kindOf(column, Boolean(target));
    const value = fields[column.name] ?? "";
    const label = fieldLabel(column);
    const required = isRequired(column);
    const error = errors.get(column.name);
    const ref = feedback.ref(column.name);
    const description = column.description ?? undefined;
    if (kind === "reference" && target)
      return (
        <ReferencePicker
          key={column.name}
          collection={target}
          value={value}
          onChange={(next) => change(column, next)}
          label={label}
          required={required}
          clearable={!column.required}
          description={description}
          error={error}
          controlRef={ref}
        />
      );
    if (kind === "choice" || kind === "boolean")
      return (
        <ChoiceField
          key={column.name}
          label={label}
          value={value || null}
          onChange={(next) => change(column, next ?? "")}
          options={
            kind === "boolean"
              ? [
                  { value: "true", label: "Yes" },
                  { value: "false", label: "No" },
                ]
              : column.choices.map((choice) => ({
                  value: choice,
                  // A status reads as its badge does; other choices as their own words.
                  label: statusLabel(vocabularyFor(collection.name, column.name)?.values, choice),
                }))
          }
          required={required}
          placeholder={column.required ? `Choose ${withArticle(label)}` : "Not recorded"}
          // Only a column the schema lets be empty offers "Not recorded"; an empty required one
          // would fail the save, or take the schema's default rather than stay unrecorded.
          {...(column.required ? {} : { emptyOption: "Not recorded" })}
          description={description}
          error={error}
          controlRef={ref}
        />
      );
    return (
      <Field key={column.name} invalid={error ? true : undefined} required={required}>
        <FieldLabel>{label}</FieldLabel>
        {kind === "multiline" ? (
          <Textarea
            ref={ref}
            value={value}
            onChange={(event) => change(column, event.target.value)}
            rows={4}
            autoResize
            maxRows={12}
          />
        ) : kind === "number" ? (
          <NumberField
            ref={ref}
            value={value.trim() === "" || !Number.isFinite(Number(value)) ? null : Number(value)}
            onValueChange={(next: number | null) =>
              change(column, next === null || Number.isNaN(next) ? "" : String(next))
            }
            {...(INTEGER.test(column.type)
              ? { step: 1, format: { maximumFractionDigits: 0 } }
              : { format: { maximumFractionDigits: 10 } })}
          />
        ) : kind === "date" ? (
          // The picker's button is the control; the wrapper lets an error summary focus it.
          <div ref={(node) => ref(node?.querySelector<HTMLElement>("button, input") ?? null)}>
            <DatePicker value={value} onValueChange={(next) => change(column, next)} />
          </div>
        ) : kind === "moment" ? (
          <DateTimeField
            ref={ref}
            value={value}
            onValueChange={(next) => change(column, next)}
            onEntryError={(message) => entryError(column, message)}
          />
        ) : (
          <Input
            ref={ref}
            type={/email/.test(column.name) ? "email" : /url$/.test(column.name) ? "url" : "text"}
            value={value}
            onChange={(event) => change(column, event.target.value)}
          />
        )}
        {description ? <FieldDescription>{description}</FieldDescription> : null}
        {/* A DateTimeField shows its own entry error; only other messages are added. */}
        {error && error !== entryErrors[column.name] ? <FieldError>{error}</FieldError> : null}
      </Field>
    );
  };

  const primaryLabel = operationLabel ?? (existing ? `Edit ${noun}` : `Create ${noun}`);
  const form = (
    <form id={formId} noValidate onSubmit={(event) => void submit(event)}>
      <Stack
        space="space.250"
        className={formLayout === "page" ? "max-w-layout-measure" : undefined}
      >
        {failure ? (
          <Alert ref={failureRef} variant="destructive" role="alert">
            <AlertCircle aria-hidden />
            <AlertTitle>{failure.title}</AlertTitle>
            <AlertDescription>{failure.message}</AlertDescription>
          </Alert>
        ) : null}
        <ErrorSummary issues={feedback.summary} focusKey={feedback.attempts} />
        <FieldSet disabled={busy}>
          <Stack space="space.250">
            {contextColumns.length ? (
              <KeyValue.Group
                {...(contextColumns.some((column) => fieldLabel(column).length > 14)
                  ? { labelWidth: "wide" as const }
                  : {})}
              >
                {contextColumns.map((column) => (
                  <KeyValue key={column.name} label={fieldLabel(column)} wrap>
                    <RecordName collection={targetOf(column)!} id={fields[column.name]!} />
                  </KeyValue>
                ))}
              </KeyValue.Group>
            ) : null}
            {mainColumns.map(renderField)}
            {additionalColumns.length > 0 && (
              <Section
                title="Additional details"
                isCollapsible
                open={additionalOpen}
                onOpenChange={setAdditionalOpen}
              >
                <Stack space="space.250">{additionalColumns.map(renderField)}</Stack>
              </Section>
            )}
          </Stack>
        </FieldSet>
      </Stack>
    </form>
  );
  const submitButton = (
    <Button ref={submitRef} type="submit" form={formId} variant="primary" isLoading={busy}>
      {primaryLabel}
    </Button>
  );
  if (formLayout === "dialog")
    return (
      <>
        <DialogBody>{form}</DialogBody>
        <DialogFooter>
          <DialogClose render={<Button variant="subtle" />}>Cancel</DialogClose>
          {submitButton}
        </DialogFooter>
        {guard.confirmation}
      </>
    );
  return (
    <Stack space="space.250">
      {form}
      <Inline space="space.150" alignInline="end" className="max-w-layout-measure">
        <Button
          variant="subtle"
          disabledReason={busy ? "Wait for the save to finish." : undefined}
          onClick={() => void guard.close()}
        >
          Cancel
        </Button>
        {submitButton}
      </Inline>
      {guard.confirmation}
    </Stack>
  );
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
