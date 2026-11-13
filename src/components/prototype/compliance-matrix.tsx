import { useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, getRouteApi, useRouterState } from "@tanstack/react-router";
import { AlertCircle, Plus } from "lucide-react";
import {
  Absent,
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  DataTable,
  DatePicker,
  DateTime,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ErrorSummary,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldSet,
  FileTrigger,
  Grid,
  Heading,
  Inline,
  KeyValue,
  Prose,
  Section,
  Stack,
  Stat,
  Text,
  Tray,
  defineColumns,
  toast,
  useLedgerLocale,
} from "@ledger/design-system";
import { createWorkbookFileClient } from "@ledger/spreadsheet-core/file-client";
import { ChoiceField, PartyField, TextField } from "@/components/app/fields";
import { useFormFeedback, type FormIssue } from "@/components/app/form-feedback";
import { causeText } from "@/components/app/sentence";
import { StatusBadge } from "@/components/app/status";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import { useWorkspace } from "@/components/app/workspace";
import { useRows, type Row } from "@/lib/models";
import {
  COMPLIANCE_STATUS_ORDER,
  IMPORT_MAX,
  VERIFICATION_METHODS,
  useImportCustomerRequirements,
  useRequirementSourceCompliance,
  type ComplianceStatus,
  type RequirementCompliance,
  type RequirementSourceCompliance,
  type VerificationMethod,
} from "@/lib/product-assurance";
import { registerViews } from "@/lib/register-views";
import {
  answerNeedsStatement,
  requirementAnswerIssues,
  useAnswerRequirement,
  useRequirementAnswer,
  useRequirementSources,
} from "@/lib/requirement-compliance";
import {
  IMPORT_FIELD_LABELS,
  importFileKind,
  readReqif,
  readRequirementRows,
  readRequirementTable,
  workbookTable,
  type ReadRequirements,
} from "@/lib/requirement-import-file";
import {
  complianceAnswers,
  complianceStatuses,
  elementStandings,
  requirementMetBy,
} from "@/lib/status";
import { useCollectionTable } from "./collection-question";
import { complianceSearch, type ComplianceAnswer } from "./compliance-link";
import { LibrarySelect } from "./library-shared";
import { ProductCollection } from "./product-collection";
import { RelationName } from "./record-tools";
import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  useDisplayedRecords,
  useOpenRecord,
} from "./record-preview";
import { EmptyMessage, QueryState, ReportFailures } from "./work-common";

/*
 * A customer's requirements and how the program meets them. A program receives a requirements
 * document, imports its paragraphs as requirements, and answers each: compliant, partially,
 * non-compliant or not applicable, with how it is verified. `requirement_source_compliance` gives
 * the document back as a matrix, each requirement with what meets it: the product as delivered, a
 * change the variant made, or the program's own elements. The Overview counts a document in two
 * trays; the focused Compliance matrix view is the register a reader answers in.
 */

const complianceRoute = getRouteApi("/programs/$programId_/compliance");

type Answer = ComplianceAnswer;
/** The answers in the order a reader acts on them: what is not met first. */
const ANSWER_LINES: readonly Answer[] = [
  "non_compliant",
  "partially_compliant",
  "unanswered",
  "compliant",
  "not_applicable",
];
const methodLabel = (method: string) => method.charAt(0).toUpperCase() + method.slice(1);
const answerCount = (matrix: RequirementSourceCompliance, answer: Answer) =>
  answer === "unanswered" ? matrix.unanswered : matrix.counts[answer];

/* ——— The Overview's trays —————————————————————————————————————————————————————————————————————— */

/**
 * One requirements document on the program's Overview, as two counted groups: its requirements by
 * the program's answer, what is not met first, and what meets them. Each heading opens the
 * Compliance matrix at the document.
 */
function DocumentTrays({
  programId,
  source,
}: {
  programId: string;
  source: Row<"requirement_sources">;
}) {
  const matrix = useRequirementSourceCompliance(source.id);
  const data = matrix.data;
  const failed = !data && matrix.isError;
  const loading = !data && !failed;
  const view = (
    <Link
      to="/programs/$programId/compliance"
      params={{ programId }}
      search={{ document: source.id }}
    />
  );
  const metLines = (["variant_change", "program", "unallocated"] as const).map((key) => ({
    label: requirementMetBy[key].label,
    value: data?.metBy[key] ?? 0,
  }));
  return (
    <>
      <ReportFailures queries={[matrix]} />
      <Tray
        link={view}
        {...(failed
          ? { title: `Could not load ${source.code}` }
          : {
              title: `requirements in ${source.code}`,
              value: data?.total ?? null,
              isLoading: loading,
            })}
      >
        {failed ? null : (
          <Stat.List aria-label={`Requirements in ${source.code}, by the program's answer`}>
            {ANSWER_LINES.map((answer) => (
              <Stat.Row
                key={answer}
                label={complianceAnswers[answer].label}
                value={data ? answerCount(data, answer) : 0}
                tone={answer === "non_compliant" ? "danger" : "neutral"}
                isLoading={loading}
              />
            ))}
          </Stat.List>
        )}
      </Tray>
      <Tray
        link={view}
        {...(failed
          ? { title: `Could not load what meets ${source.code}` }
          : {
              title: "met by the product as delivered",
              value: data?.metBy.product ?? null,
              isLoading: loading,
            })}
      >
        {failed ? null : (
          <Stat.List aria-label={`What meets the requirements in ${source.code}`}>
            {metLines.map((line) => (
              <Stat.Row
                key={line.label}
                label={line.label}
                value={line.value}
                isLoading={loading}
              />
            ))}
          </Stat.List>
        )}
      </Tray>
    </>
  );
}

/** The program's requirements documents on its Overview; a program that has received none draws nothing. */
export function ProgramRequirementsTrays({ programId }: { programId: string }) {
  const { query, sources } = useRequirementSources(programId);
  if (!sources?.length) return <ReportFailures queries={[query]} />;
  return (
    <Grid templateColumns="repeat(auto-fit, minmax(min(100%, 208px), 1fr))" gap="space.200">
      <ReportFailures queries={[query]} />
      {sources.map((source) => (
        <DocumentTrays key={source.id} programId={programId} source={source} />
      ))}
    </Grid>
  );
}

/* ——— Answering a requirement ——————————————————————————————————————————————————————————————————— */

const answerFields = ["status", "method", "statement"] as const;
type AnswerField = (typeof answerFields)[number];

/**
 * Create or edit a requirement's compliance statement: where the program stands on it, how that is
 * verified, and what the program says. An answer short of compliant says why.
 */
function ComplianceStatementDialog({
  requirement,
  onClose,
}: {
  requirement: RequirementCompliance;
  onClose: () => void;
}) {
  const workspace = useWorkspace();
  const formId = useId();
  const recorded = useRequirementAnswer(requirement.id);
  const existing = recorded.data?.[0];
  const operation = requirement.status
    ? "Edit compliance statement"
    : "Create compliance statement";
  const [open, setOpen] = useState(true);
  const [status, setStatus] = useState<string | null>(requirement.status);
  const [method, setMethod] = useState<string | null>(requirement.verificationMethod);
  const [statement, setStatement] = useState(requirement.complianceStatement ?? "");
  const [dirty, setDirty] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const feedback = useFormFeedback<AnswerField>();
  const save = useAnswerRequirement();
  const guard = useDraftGuard({
    dirty,
    onClose: () => setOpen(false),
    description: "The compliance statement you entered will be lost.",
  });
  const writable = workspace.role !== "viewer";
  const issues: FormIssue<AnswerField>[] = requirementAnswerIssues({ status, statement });
  const errors = new Map(
    feedback.submitted ? issues.map((issue) => [issue.field, issue.message] as const) : [],
  );
  const unavailable = !writable
    ? "An editor, admin, or owner can answer a requirement."
    : recorded.isError
      ? "Load the recorded answer before saving."
      : recorded.isPending
        ? "The recorded answer is loading."
        : undefined;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (guard.busy || unavailable) return;
    setFailure(null);
    if (!feedback.report(issues)) return;
    submitRef.current?.focus();
    if (!guard.start()) return;
    try {
      await save.mutateAsync({
        requirementId: requirement.id,
        existing: existing ? { id: existing.id, revision: existing.revision } : null,
        status: status as ComplianceStatus,
        verificationMethod: (method as VerificationMethod | null) ?? null,
        statement,
      });
      setDirty(false);
      toast.add({ type: "success", title: "Compliance statement saved" });
      guard.finish();
      guard.complete();
    } catch (cause) {
      setFailure(`${causeText(cause)} Your answer is kept.`);
      guard.finish();
    }
  }
  return (
    <Dialog
      open={open}
      pending={guard.busy}
      onOpenChange={(next, details) => {
        if (next) return;
        details.cancel();
        void guard.close();
      }}
      onOpenChangeComplete={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent width="medium" initialFocus={() => feedback.node("status") ?? true}>
        <DialogHeader>
          <DialogTitle>{operation}</DialogTitle>
          <DialogDescription>
            {requirement.reference ? `${requirement.reference} ` : ""}
            {requirement.title}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form id={formId} noValidate onSubmit={(event) => void submit(event)}>
            <Stack space="space.200">
              {recorded.isError ? (
                <Alert variant="destructive" role="alert">
                  <AlertCircle aria-hidden />
                  <AlertTitle>The recorded answer could not be loaded</AlertTitle>
                  <AlertDescription>{causeText(recorded.error)}</AlertDescription>
                </Alert>
              ) : null}
              {failure ? (
                <Alert variant="destructive" role="alert">
                  <AlertCircle aria-hidden />
                  <AlertTitle>The compliance statement was not saved</AlertTitle>
                  <AlertDescription>{failure}</AlertDescription>
                </Alert>
              ) : null}
              <ErrorSummary issues={feedback.summary} focusKey={feedback.attempts} />
              <FieldSet disabled={guard.busy || !writable}>
                <Stack space="space.200">
                  <Grid
                    gap="space.200"
                    templateColumns={{ base: "minmax(0,1fr)", sm: "repeat(2,minmax(0,1fr))" }}
                  >
                    <ChoiceField
                      label="Compliance"
                      value={status}
                      options={COMPLIANCE_STATUS_ORDER.map((value) => ({
                        value,
                        label: complianceStatuses[value].label,
                      }))}
                      onChange={(value) => {
                        setStatus(value);
                        setDirty(true);
                      }}
                      required
                      placeholder="Choose an answer"
                      error={errors.get("status")}
                      controlRef={feedback.ref("status")}
                    />
                    <ChoiceField
                      label="Verification method"
                      value={method}
                      options={VERIFICATION_METHODS.map((value) => ({
                        value,
                        label: methodLabel(value),
                      }))}
                      onChange={(value) => {
                        setMethod(value);
                        setDirty(true);
                      }}
                      placeholder="No method"
                      emptyOption="No method"
                      error={errors.get("method")}
                      controlRef={feedback.ref("method")}
                    />
                  </Grid>
                  <TextField
                    label="Compliance statement"
                    value={statement}
                    onChange={(value) => {
                      setStatement(value);
                      setDirty(true);
                    }}
                    multiline
                    autoResize
                    required={answerNeedsStatement(status as ComplianceStatus | null)}
                    description="What the program says to the customer: how the requirement is met, what is not met, or why it does not apply."
                    error={errors.get("statement")}
                    controlRef={feedback.ref("statement")}
                  />
                </Stack>
              </FieldSet>
            </Stack>
          </form>
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button variant="subtle" />}>Cancel</DialogClose>
          <Button
            ref={submitRef}
            type="submit"
            form={formId}
            variant="primary"
            isLoading={guard.busy}
            disabledReason={unavailable}
          >
            {operation}
          </Button>
        </DialogFooter>
      </DialogContent>
      {guard.confirmation}
    </Dialog>
  );
}

/* ——— Importing a document ————————————————————————————————————————————————————————————————————— */

const importFields = ["code", "title", "version", "received", "issuer", "file", "rows"] as const;
type ImportFormField = (typeof importFields)[number];

/**
 * Import requirements: a customer's document read from a CSV file or from rows pasted out of a
 * spreadsheet, into a new requirements document or one the program already holds. It is one
 * request: every requirement or none, a paragraph already there passed over, and the same import
 * sent again adding nothing more.
 */
function ImportRequirementsDialog({
  programId,
  sources,
  initialSourceId,
  onClose,
  onImported,
}: {
  programId: string;
  sources: readonly Row<"requirement_sources">[];
  /** The document the reader was looking at, offered as the one to add to. */
  initialSourceId?: string | undefined;
  onClose: () => void;
  onImported: (sourceId: string) => void;
}) {
  const workspace = useWorkspace();
  const { formatNumber } = useLedgerLocale();
  const formId = useId();
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [open, setOpen] = useState(true);
  const [target, setTarget] = useState<string | null>(initialSourceId ?? null);
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [version, setVersion] = useState("");
  const [received, setReceived] = useState("");
  const [issuer, setIssuer] = useState<string | null>(null);
  // The chosen file as it was read: a CSV as text, a workbook's first sheet, a ReqIF file's objects.
  const [file, setFile] = useState<{ name: string; read: ReadRequirements } | null>(null);
  const [reading, setReading] = useState(false);
  const [pasted, setPasted] = useState("");
  const [dirty, setDirty] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const imported = useRef<string | null>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const feedback = useFormFeedback<ImportFormField>();
  const parties = useRows("parties");
  const run = useImportCustomerRequirements();
  const guard = useDraftGuard({
    dirty,
    onClose: () => setOpen(false),
    description: "The document details and the requirements you read will be lost.",
  });
  const writable = workspace.role !== "viewer";
  const existing = sources.find((source) => source.id === target);
  const pastedRead = useMemo(() => (pasted.trim() ? readRequirementRows(pasted) : null), [pasted]);
  const read = file ? file.read : pastedRead;
  /** Read a chosen file by its kind; one that cannot be read says so as the file's own issue. */
  async function choose(chosen: File) {
    setReading(true);
    try {
      const kind = importFileKind(chosen.name);
      let result: ReadRequirements;
      if (kind === "workbook") {
        const client = createWorkbookFileClient();
        try {
          const { workbook } = await client.importXlsx(await chosen.arrayBuffer(), chosen.name);
          result = readRequirementTable(workbookTable(workbook));
        } finally {
          client.dispose();
        }
      } else
        result =
          kind === "reqif"
            ? readReqif(await chosen.text())
            : readRequirementRows(await chosen.text());
      setFile({ name: chosen.name, read: result });
    } catch (cause) {
      setFile({
        name: chosen.name,
        read: {
          requirements: [],
          fields: [],
          issues: [`The file could not be read. ${causeText(cause, "")}`.trim()],
          skipped: 0,
        },
      });
    } finally {
      setReading(false);
      changed();
    }
  }
  // A changed choice is another request: the id that makes a retry safe names what is sent.
  function changed() {
    setDirty(true);
    setRequestId(crypto.randomUUID());
  }
  const rowsField: ImportFormField = file ? "file" : "rows";
  const issues: FormIssue<ImportFormField>[] = [
    ...(!existing && !code.trim()
      ? [{ field: "code" as const, message: "Give the document a code, such as CUSA-SSRD." }]
      : []),
    ...(!existing && !title.trim()
      ? [{ field: "title" as const, message: "Give the document a title." }]
      : []),
    ...(!read
      ? [{ field: "file" as const, message: "Choose a CSV file, or paste the rows below." }]
      : read.issues.length
        ? [{ field: rowsField, message: read.issues.join(" ") }]
        : !read.requirements.length
          ? [{ field: rowsField, message: "No row holds both a reference and a statement." }]
          : read.requirements.length > IMPORT_MAX
            ? [
                {
                  field: rowsField,
                  message: `Import at most ${formatNumber(IMPORT_MAX)} requirements at a time; this holds ${formatNumber(read.requirements.length)}.`,
                },
              ]
            : duplicateReference(
                read.requirements.map((row) => row.reference),
                rowsField,
              )),
  ];
  // A chosen file says what is wrong with it as soon as it is read; the other fields wait for the
  // first attempt, as a form does.
  const fileIssue = file ? issues.find((issue) => issue.field === "file") : undefined;
  const errors = new Map(
    feedback.submitted
      ? issues.map((issue) => [issue.field, issue.message] as const)
      : fileIssue
        ? [[fileIssue.field, fileIssue.message] as const]
        : [],
  );
  const unavailable = !writable ? "An editor, admin, or owner can import requirements." : undefined;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (guard.busy || unavailable) return;
    setFailure(null);
    if (!feedback.report(issues) || !read) return;
    submitRef.current?.focus();
    if (!guard.start()) return;
    try {
      const result = await run.mutateAsync({
        programId,
        requestId,
        source: existing
          ? { code: existing.code, title: existing.title }
          : {
              code: code.trim(),
              title: title.trim(),
              versionLabel: version.trim() || null,
              receivedOn: received || null,
              issuerPartyId: issuer,
            },
        requirements: read.requirements,
      });
      imported.current = result.sourceId;
      setDirty(false);
      toast.add({
        type: "success",
        title: `${formatNumber(result.created)} ${result.created === 1 ? "requirement" : "requirements"} imported`,
        ...(result.skipped || result.allocated
          ? {
              description: [
                result.allocated
                  ? `${formatNumber(result.allocated)} ${result.allocated === 1 ? "allocation" : "allocations"} made.`
                  : "",
                result.skipped
                  ? `${formatNumber(result.skipped)} already in the document were passed over.`
                  : "",
              ]
                .filter(Boolean)
                .join(" "),
            }
          : {}),
      });
      guard.finish();
      guard.complete();
    } catch (cause) {
      setFailure(
        `${causeText(cause)} Nothing was imported. Your details are kept, and importing again will not add a requirement twice.`,
      );
      guard.finish();
    }
  }
  return (
    <Dialog
      open={open}
      pending={guard.busy}
      onOpenChange={(next, details) => {
        if (next) return;
        details.cancel();
        void guard.close();
      }}
      onOpenChangeComplete={(next) => {
        if (next) return;
        const sourceId = imported.current;
        onClose();
        if (sourceId) onImported(sourceId);
      }}
    >
      <DialogContent
        width="large"
        initialFocus={() => feedback.node(sources.length ? "file" : "code") ?? true}
      >
        <DialogHeader>
          <DialogTitle>Import requirements</DialogTitle>
          <DialogDescription>
            Read a customer's requirements document into the program, one requirement a row.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form id={formId} noValidate onSubmit={(event) => void submit(event)}>
            <Stack space="space.200">
              {!writable ? (
                <Alert role="note">
                  <AlertDescription>
                    An editor, admin, or owner can import requirements.
                  </AlertDescription>
                </Alert>
              ) : null}
              {failure ? (
                <Alert variant="destructive" role="alert">
                  <AlertCircle aria-hidden />
                  <AlertTitle>The requirements were not imported</AlertTitle>
                  <AlertDescription>{failure}</AlertDescription>
                </Alert>
              ) : null}
              <ErrorSummary issues={feedback.summary} focusKey={feedback.attempts} />
              <FieldSet disabled={guard.busy || !writable}>
                <Stack space="space.200">
                  {sources.length > 0 && (
                    <ChoiceField
                      label="Requirements document"
                      value={target}
                      options={sources.map((source) => ({
                        value: source.id,
                        label: `${source.code} · ${source.title}`,
                      }))}
                      onChange={(value) => {
                        setTarget(value);
                        changed();
                      }}
                      placeholder="A new document"
                      emptyOption="A new document"
                      description="Add to a document the program holds, or record a new one."
                    />
                  )}
                  {!existing && (
                    <>
                      <Grid
                        gap="space.200"
                        templateColumns={{
                          base: "minmax(0,1fr)",
                          sm: "minmax(0,1fr) minmax(0,2fr)",
                        }}
                      >
                        <TextField
                          label="Document code"
                          value={code}
                          onChange={(value) => {
                            setCode(value);
                            changed();
                          }}
                          required
                          placeholder="CUSA-SSRD"
                          error={errors.get("code")}
                          controlRef={feedback.ref("code")}
                        />
                        <TextField
                          label="Document title"
                          value={title}
                          onChange={(value) => {
                            setTitle(value);
                            changed();
                          }}
                          required
                          error={errors.get("title")}
                          controlRef={feedback.ref("title")}
                        />
                      </Grid>
                      <Grid
                        gap="space.200"
                        templateColumns={{ base: "minmax(0,1fr)", sm: "repeat(2,minmax(0,1fr))" }}
                      >
                        <TextField
                          label="Version"
                          value={version}
                          onChange={(value) => {
                            setVersion(value);
                            changed();
                          }}
                          placeholder="Rev C"
                          error={errors.get("version")}
                          controlRef={feedback.ref("version")}
                        />
                        <Field>
                          <FieldLabel>Received</FieldLabel>
                          <DatePicker
                            ref={feedback.ref("received")}
                            value={received}
                            onValueChange={(value) => {
                              setReceived(value);
                              changed();
                            }}
                          />
                        </Field>
                      </Grid>
                      <PartyField
                        label="Issuer"
                        value={issuer}
                        parties={parties.data ?? []}
                        onChange={(value) => {
                          setIssuer(value);
                          changed();
                        }}
                        loading={parties.isPending && !parties.isError}
                        loadError={parties.isError}
                        onRetry={() => void parties.refetch()}
                        description="The customer or authority that issued the document."
                        error={errors.get("issuer")}
                        controlRef={feedback.ref("issuer")}
                      />
                    </>
                  )}
                  <Field invalid={errors.has("file") ? true : undefined}>
                    <FieldLabel>Requirements file</FieldLabel>
                    <Inline space="space.150" alignBlock="center" shouldWrap>
                      <FileTrigger
                        ref={feedback.ref("file")}
                        accept={[".csv", ".tsv", ".txt", ".xlsx", ".reqif", ".xml"]}
                        isLoading={reading}
                        onSelect={(files) => {
                          const chosen = files[0];
                          if (chosen) void choose(chosen);
                        }}
                      />
                      {file && (
                        <>
                          <Text size="small">{file.name}</Text>
                          <Button
                            size="small"
                            variant="subtle"
                            onClick={() => {
                              setFile(null);
                              changed();
                            }}
                          >
                            Remove file
                          </Button>
                        </>
                      )}
                    </Inline>
                    <FieldDescription>
                      A CSV, the first sheet of an Excel workbook, or a ReqIF file. The first row
                      names the columns: it needs a Reference and a Statement; Title, Type,
                      Acceptance criteria and Rationale are read when present, and an Elements
                      column allocates each requirement to the elements it names by code.
                    </FieldDescription>
                    {errors.has("file") ? <FieldError>{errors.get("file")}</FieldError> : null}
                  </Field>
                  {!file && (
                    <TextField
                      label="Or paste rows"
                      value={pasted}
                      onChange={(value) => {
                        setPasted(value);
                        changed();
                      }}
                      multiline
                      rows={4}
                      description="Rows copied from a spreadsheet, the heading row first."
                      error={errors.get("rows")}
                      controlRef={feedback.ref("rows")}
                    />
                  )}
                  {read && !read.issues.length && (
                    <Alert role="status">
                      <AlertTitle>
                        {formatNumber(read.requirements.length)}{" "}
                        {read.requirements.length === 1 ? "requirement" : "requirements"} read
                      </AlertTitle>
                      <AlertDescription>
                        Columns read:{" "}
                        {read.fields.map((field) => IMPORT_FIELD_LABELS[field]).join(", ")}.
                        {read.skipped > 0 &&
                          ` ${formatNumber(read.skipped)} ${read.skipped === 1 ? "row" : "rows"} with no reference or no statement passed over.`}
                      </AlertDescription>
                    </Alert>
                  )}
                </Stack>
              </FieldSet>
            </Stack>
          </form>
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button variant="subtle" />}>Cancel</DialogClose>
          <Button
            ref={submitRef}
            type="submit"
            form={formId}
            variant="primary"
            isLoading={guard.busy}
            disabledReason={unavailable}
          >
            Import requirements
          </Button>
        </DialogFooter>
      </DialogContent>
      {guard.confirmation}
    </Dialog>
  );
}

/** A reference a file gives twice stops the import, named, since the command would refuse it whole. */
function duplicateReference<Field extends string>(
  references: readonly string[],
  field: Field,
): FormIssue<Field>[] {
  const seen = new Set<string>();
  const twice = new Set<string>();
  for (const reference of references) {
    if (seen.has(reference)) twice.add(reference);
    seen.add(reference);
  }
  return twice.size
    ? [
        {
          field,
          message: `A reference appears twice: ${[...twice].slice(0, 3).join(", ")}. Each requirement needs its own.`,
        },
      ]
    : [];
}

/* ——— The focused view ——————————————————————————————————————————————————————————————————————————— */

type MatrixRow = RequirementCompliance & {
  name: string;
  answer: Answer;
  method: string | null;
  allocated: string[];
};

const matrixColumns = (programId: string) =>
  defineColumns<MatrixRow>((c) => [
    c.text("reference", { header: "Reference", width: 120, priority: 1 }),
    c.text("name", {
      header: "Requirement",
      priority: 0,
      minWidth: 240,
      hideable: false,
      cell: (row) => (
        <RecordLink table="engineering_requirements" record={{ id: row.id, program_id: programId }}>
          {row.name}
        </RecordLink>
      ),
    }),
    c.status("answer", {
      header: "Compliance",
      width: 180,
      priority: 1,
      statuses: complianceAnswers,
    }),
    c.status("metBy", { header: "Met by", width: 150, priority: 2, statuses: requirementMetBy }),
    c.list("allocated", {
      header: "Elements",
      width: 240,
      priority: 4,
      searchable: true,
      items: (row) => row.allocated.map((label) => ({ key: label, label })),
      empty: () => <Absent label="Not allocated" />,
    }),
    c.text("method", { header: "Verification", width: 150, priority: 5 }),
    c.number("controls", { header: "Controls", width: 110, priority: 6 }),
    c.number("evidence", { header: "Evidence", width: 110, priority: 3 }),
  ]);

/** A requirement of the matrix beside it: the customer's words, the program's answer and what meets it. */
function RequirementAnswerPreview({
  programId,
  row,
  rows,
  canAnswer,
  onSelect,
  onClose,
  onAnswer,
}: {
  programId: string;
  row: MatrixRow;
  rows: ReturnType<typeof useDisplayedRecords<MatrixRow>>;
  canAnswer: boolean;
  onSelect: (row: MatrixRow) => void;
  onClose: () => void;
  onAnswer: (row: MatrixRow) => void;
}) {
  const { formatNumber } = useLedgerLocale();
  return (
    <RecordPreviewPanel
      title={row.name}
      label="Requirement preview"
      onClose={onClose}
      recordActions={
        canAnswer ? (
          <Button size="small" variant="primary" onClick={() => onAnswer(row)}>
            {row.status ? "Edit compliance statement" : "Create compliance statement"}
          </Button>
        ) : undefined
      }
      navigation={
        <RecordPreviewActions
          table="engineering_requirements"
          record={{ ...row, program_id: programId }}
          rows={rows}
          onSelect={onSelect}
        />
      }
    >
      <Stack key={row.id} space="space.200">
        <KeyValue.Group labelWidth="wide">
          <KeyValue label="Reference">{row.reference ?? <Absent />}</KeyValue>
          <KeyValue label="Compliance">
            <StatusBadge statuses={complianceAnswers} value={row.answer} />
          </KeyValue>
          <KeyValue label="Met by">
            <StatusBadge statuses={requirementMetBy} value={row.metBy} />
          </KeyValue>
          <KeyValue label="Verification method">
            {row.method ?? <Absent label="No method" />}
          </KeyValue>
          <KeyValue label="Controls">{formatNumber(row.controls)}</KeyValue>
          <KeyValue label="Evidence">{formatNumber(row.evidence)}</KeyValue>
        </KeyValue.Group>
        <Prose label="Statement">{row.statement}</Prose>
        <Prose label="Compliance statement">
          {row.complianceStatement || <Absent label="No statement" />}
        </Prose>
        <KeyValue.Group labelWidth="wide">
          {row.elements.length ? (
            row.elements.map((element) => (
              <KeyValue key={element.systemId} label={element.code} wrap>
                <Inline space="space.100" alignBlock="center" shouldWrap>
                  <RecordLink
                    table="systems"
                    record={{ id: element.systemId, program_id: programId }}
                  >
                    {element.name}
                  </RecordLink>
                  <StatusBadge statuses={elementStandings} value={element.standing} size="xsmall" />
                </Inline>
              </KeyValue>
            ))
          ) : (
            <KeyValue label="Elements">
              <Absent label="Not allocated" />
            </KeyValue>
          )}
        </KeyValue.Group>
      </Stack>
    </RecordPreviewPanel>
  );
}

/** One document's matrix: its band, its register and the preview a reader answers from. */
function DocumentMatrix({
  programId,
  source,
  sources,
  chooser,
}: {
  programId: string;
  source: Row<"requirement_sources">;
  sources: readonly Row<"requirement_sources">[];
  chooser: ReactNode;
}) {
  const workspace = useWorkspace();
  const navigate = complianceRoute.useNavigate();
  const matrix = useRequirementSourceCompliance(source.id);
  const data = matrix.data;
  const canEdit = workspace.role !== "viewer";
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [answering, setAnswering] = useState<MatrixRow | null>(null);
  const [importing, setImporting] = useState(false);
  const rows = useMemo<MatrixRow[]>(
    () =>
      (data?.requirements ?? []).map((requirement) => ({
        ...requirement,
        name: requirement.title,
        answer: requirement.status ?? "unanswered",
        method: requirement.verificationMethod ? methodLabel(requirement.verificationMethod) : null,
        allocated: requirement.elements.map((element) => `${element.code} ${element.name}`),
      })),
    [data?.requirements],
  );
  const columns = useMemo(() => matrixColumns(programId), [programId]);
  const tablePreview = useMemo(
    () => ({ onPreview: (row: MatrixRow) => setPreviewId(row.id), activeId: previewId }),
    [previewId],
  );
  const table = useCollectionTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    rowLabel: (row) => [row.reference, row.name].filter(Boolean).join(" "),
    label: "Compliance matrix",
    view: registerViews.compliance,
    preview: tablePreview,
  });
  const displayed = useDisplayedRecords(table);
  const openRecord = useOpenRecord();
  const preview = rows.find((row) => row.id === previewId);
  const loading = !data && !matrix.isError;
  const unread = matrix.isError ? "Could not load" : undefined;
  const count = (value: number | undefined) =>
    value === undefined ? matrix.isError ? <Absent label="Could not load" /> : null : value;
  const tile = (answer: Answer) => (
    <Link
      to="/programs/$programId/compliance"
      params={{ programId }}
      search={complianceSearch({ document: source.id, answer })}
    />
  );
  const importAction = (size: "small" | "medium") =>
    canEdit ? (
      <Button
        size={size}
        variant="primary"
        iconBefore={<Plus />}
        onClick={() => setImporting(true)}
      >
        Import requirements
      </Button>
    ) : undefined;
  return (
    <Stack space="space.300" className="min-w-0">
      <Inline space="space.150" alignBlock="center" spread="space-between" shouldWrap>
        <Heading as="h2" size="section">
          {source.code} {source.title}
        </Heading>
        {chooser}
      </Inline>
      <Stat.Grid frame="band" cols={4} aria-label={`Where the program stands on ${source.code}`}>
        <Stat.Tile
          label="Compliant"
          value={count(data?.counts.compliant)}
          note={data ? `of ${data.total} requirements` : unread}
          isLoading={loading}
          {...(data?.counts.compliant ? { link: tile("compliant") } : {})}
        />
        <Stat.Tile
          label="Partially compliant"
          value={count(data?.counts.partially_compliant)}
          note={data ? "Each says what is not met" : unread}
          tone={data?.counts.partially_compliant ? "warning" : "neutral"}
          isLoading={loading}
          {...(data?.counts.partially_compliant ? { link: tile("partially_compliant") } : {})}
        />
        <Stat.Tile
          label="Non-compliant"
          value={count(data?.counts.non_compliant)}
          note={data ? `${data.counts.not_applicable} not applicable` : unread}
          tone={data?.counts.non_compliant ? "danger" : "neutral"}
          isLoading={loading}
          {...(data?.counts.non_compliant ? { link: tile("non_compliant") } : {})}
        />
        <Stat.Tile
          label="Unanswered"
          value={count(data?.unanswered)}
          note={data ? "Not counted as non-compliant" : unread}
          isLoading={loading}
          {...(data?.unanswered ? { link: tile("unanswered") } : {})}
        />
      </Stat.Grid>
      <ProductCollection
        table={table}
        queries={[matrix]}
        onRowClick={(row) =>
          openRecord("engineering_requirements", { id: row.id, program_id: programId })
        }
        searchLabel="Find requirements"
        filters={
          <>
            <DataTable.Filter table={table} column="answer" />
            <DataTable.Filter table={table} column="metBy" />
            <DataTable.Filter table={table} column="allocated" />
            <DataTable.Filter table={table} column="method" />
          </>
        }
        action={importAction("small")}
        empty={{
          illustration: "document",
          title: "No requirements in this document",
          description: "Import the document's requirements to answer each one.",
          action: importAction("medium"),
        }}
      />
      <DocumentFacts source={source} />
      {preview && (
        <RequirementAnswerPreview
          programId={programId}
          row={preview}
          rows={displayed}
          canAnswer={canEdit}
          onSelect={(row) => setPreviewId(row.id)}
          onClose={() => setPreviewId(null)}
          onAnswer={setAnswering}
        />
      )}
      {answering && (
        <ComplianceStatementDialog
          key={answering.id}
          requirement={answering}
          onClose={() => setAnswering(null)}
        />
      )}
      {importing && (
        <ImportRequirementsDialog
          programId={programId}
          sources={sources}
          initialSourceId={source.id}
          onClose={() => setImporting(false)}
          onImported={(sourceId) =>
            void navigate({ search: (current) => ({ ...current, document: sourceId }) })
          }
        />
      )}
    </Stack>
  );
}

/** What the program recorded of the document itself, folded until asked for. */
function DocumentFacts({ source }: { source: Row<"requirement_sources"> }) {
  return (
    <Section title="Details" isCollapsible defaultOpen={false}>
      <KeyValue.Group labelWidth="auto">
        <KeyValue label="Requirements document">
          {source.code} {source.title}
        </KeyValue>
        <KeyValue label="Version">{source.version_label ?? <Absent />}</KeyValue>
        <KeyValue label="Received">
          <DateTime value={source.received_on} format="date" absentLabel="Not recorded" />
        </KeyValue>
        <KeyValue label="Issuer">
          <RelationName table="parties" id={source.issuer_party_id} />
        </KeyValue>
        {source.document_reference && (
          <KeyValue label="Document reference" wrap>
            {source.document_reference}
          </KeyValue>
        )}
      </KeyValue.Group>
    </Section>
  );
}

/**
 * The program's focused Compliance matrix view: a customer's requirements document with the
 * program's answer to each requirement and what meets it. A band counts the answers and opens the
 * register at each; a requirement's preview holds the customer's words beside the program's, and
 * its compliance statement is created or edited there. Import requirements reads a document in.
 */
export function ProgramComplianceView({ programId }: { programId: string }) {
  const workspace = useWorkspace();
  const navigate = complianceRoute.useNavigate();
  const { query, sources } = useRequirementSources(programId);
  const asked = useRouterState({
    select: (state) => {
      const document = (state.resolvedLocation ?? state.location).search["document" as never];
      return typeof document === "string" ? document : undefined;
    },
  });
  const [importing, setImporting] = useState(false);
  const source = sources?.find((item) => item.id === asked) ?? sources?.[0];
  const canEdit = workspace.role !== "viewer";
  const chooser =
    sources && sources.length > 1 && source ? (
      <LibrarySelect
        inline
        label="Requirements document"
        value={source.id}
        options={sources.map((item) => ({ value: item.id, label: `${item.code} · ${item.title}` }))}
        onChange={(id) =>
          void navigate({ search: (current) => ({ ...current, document: id }), resetScroll: false })
        }
      />
    ) : null;
  return (
    <QueryState queries={[query]}>
      {!sources ? null : !source ? (
        <>
          <EmptyMessage
            illustration="document"
            title="No requirements document"
            description="Import a customer's requirements to answer each one and show what meets it."
            action={
              canEdit ? (
                <Button variant="primary" iconBefore={<Plus />} onClick={() => setImporting(true)}>
                  Import requirements
                </Button>
              ) : undefined
            }
          />
          {importing && (
            <ImportRequirementsDialog
              programId={programId}
              sources={[]}
              onClose={() => setImporting(false)}
              onImported={(sourceId) =>
                void navigate({ search: (current) => ({ ...current, document: sourceId }) })
              }
            />
          )}
        </>
      ) : (
        <DocumentMatrix
          key={source.id}
          programId={programId}
          source={source}
          sources={sources}
          chooser={chooser}
        />
      )}
    </QueryState>
  );
}
