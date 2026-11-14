import { useId, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Plus } from "lucide-react";
import {
  Absent,
  Alert,
  AlertDescription,
  AlertTitle,
  AsideLayout,
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
  DropdownMenuItem,
  ErrorSummary,
  Field,
  FieldLabel,
  FieldSet,
  Grid,
  Inline,
  Inspector,
  PageHeader,
  Progress,
  ProgressLabel,
  ProgressValue,
  Section,
  Shell,
  Stack,
  TextLink,
  defineColumns,
  toast,
  useLedgerLocale,
} from "@ledger/design-system";
import { useRecordTitle } from "@/components/app/browser-title";
import { useConfirmation } from "@/components/app/confirmation";
import { ChoiceField, PartyField, TextField } from "@/components/app/fields";
import { useFormFeedback, type FormIssue } from "@/components/app/form-feedback";
import { causeText } from "@/components/app/sentence";
import { Page } from "@/components/app/shell";
import { StatusBadge } from "@/components/app/status";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import { useWorkspace } from "@/components/app/workspace";
import { useRow, useRows, type Row } from "@/lib/models";
import {
  PRODUCT_DETERMINATIONS,
  WHOLE_PRODUCT,
  newAssessmentIssues,
  openingElement,
  sheetRows,
  useBaselineName,
  useBaselineOptions,
  useCreateProductAssessment,
  useProductAssessmentSheet,
  useProductAssessments,
  usePublishProductAssessment,
  useRecordProductDeterminations,
  type ProductAssessmentSheet,
  type ProductDetermination,
  type SheetElement,
  type SheetRow,
} from "@/lib/product-assessment";
import { determinations, revisionStates } from "@/lib/status";
import { useCollectionTable } from "./collection-question";
import { LibrarySelect, QueryValue } from "./library-shared";
import { canAuthorLibrary } from "./library-utils";
import { ProductCollection } from "./product-collection";
import { RecordLink, useOpenRecord } from "./record-preview";
import { RelationName } from "./record-tools";
import { RecordTrail, TrailLink } from "./record-trail";
import {
  DetailFacts,
  MissingRecord,
  QueryState,
  RecordActions,
  ReportFailures,
} from "./work-common";

/*
 * Authoring a product assessment. A product version is judged once, on its elements, so one
 * assessment answers for every configuration. The product's Assessment tab lists the version's
 * assessments and creates a draft; the assessment's own page is where an assessor works it: choose
 * an element (or the product as a whole), choose controls, record one determination for all of
 * them, and publish. A published assessment is the version's standing and no longer changes.
 */

const elementLabel = (element: Pick<SheetElement, "code" | "name">) =>
  element.code ? `${element.code} ${element.name}` : element.name;
const familyName = (code: string | null, title: string | null) =>
  [code ?? "Other", title].filter(Boolean).join(" ");
/** Today as a calendar day in the reader's zone, as Postgres `date` stores one. */
function today() {
  const now = new Date();
  const two = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`;
}

/** A control baseline by its profile's name and version, as the picker names it. */
export function BaselineName({ id }: { id: string | null | undefined }) {
  const { name, queries } = useBaselineName(id);
  return (
    <QueryValue queries={queries}>{() => name ?? <Absent label="Not available" />}</QueryValue>
  );
}

/* ——— On the product's Assessment tab ———————————————————————————————————————————————————————————— */

const createFields = ["title", "baseline", "assessor", "started"] as const;
type CreateField = (typeof createFields)[number];

/** Create product assessment: a draft of one published version against a published baseline. */
function CreateProductAssessmentDialog({
  product,
  revision,
  onClose,
}: {
  product: Row<"products">;
  revision: Row<"product_revisions">;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const formId = useId();
  const [open, setOpen] = useState(true);
  const initialTitle = `${product.name} version ${revision.version_number} product assessment`;
  const [title, setTitle] = useState(initialTitle);
  const [baseline, setBaseline] = useState<string | null>(null);
  const [assessor, setAssessor] = useState<string | null>(null);
  const [started, setStarted] = useState("");
  const [dirty, setDirty] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const created = useRef<string | null>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const feedback = useFormFeedback<CreateField>();
  const baselines = useBaselineOptions();
  const parties = useRows("parties");
  const create = useCreateProductAssessment();
  const guard = useDraftGuard({
    dirty,
    onClose: () => setOpen(false),
    description: "The product assessment you entered will be lost.",
  });
  const issues: FormIssue<CreateField>[] = newAssessmentIssues({
    title,
    profileResolutionId: baseline,
  });
  const errors = new Map(
    feedback.submitted ? issues.map((issue) => [issue.field, issue.message] as const) : [],
  );
  const loading = baselines.queries.some((query) => query.isPending && !query.isError);
  const loadError = baselines.queries.some((query) => query.isError);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (guard.busy) return;
    setFailure(null);
    if (!feedback.report(issues) || !baseline) return;
    submitRef.current?.focus();
    if (!guard.start()) return;
    try {
      const row = await create.mutateAsync({
        productRevisionId: revision.id,
        profileResolutionId: baseline,
        title,
        assessorPartyId: assessor,
        startedOn: started || null,
      });
      created.current = row.id;
      setDirty(false);
      guard.finish();
      guard.complete();
    } catch (cause) {
      setFailure(`${causeText(cause)} Your entry is kept.`);
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
        const assessmentId = created.current;
        onClose();
        if (assessmentId)
          void navigate({
            to: "/library/product-assessments/$assessmentId",
            params: { assessmentId },
          });
      }}
    >
      <DialogContent width="medium" initialFocus={() => feedback.node("title") ?? true}>
        <DialogHeader>
          <DialogTitle>Create product assessment</DialogTitle>
          <DialogDescription>
            A draft assessment of {product.name} version {revision.version_number}. Its
            determinations are recorded on the next page.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form id={formId} noValidate onSubmit={(event) => void submit(event)}>
            <Stack space="space.200">
              {failure ? (
                <Alert variant="destructive" role="alert">
                  <AlertCircle aria-hidden />
                  <AlertTitle>The product assessment was not created</AlertTitle>
                  <AlertDescription>{failure}</AlertDescription>
                </Alert>
              ) : null}
              <ErrorSummary issues={feedback.summary} focusKey={feedback.attempts} />
              <FieldSet disabled={guard.busy}>
                <Stack space="space.200">
                  <TextField
                    label="Title"
                    value={title}
                    onChange={(value) => {
                      setTitle(value);
                      setDirty(true);
                    }}
                    required
                    error={errors.get("title")}
                    controlRef={feedback.ref("title")}
                  />
                  <ChoiceField
                    label="Control baseline"
                    value={baseline}
                    options={baselines.options}
                    onChange={(value) => {
                      setBaseline(value);
                      setDirty(true);
                    }}
                    required
                    placeholder={loading ? "Loading baselines…" : "Choose a control baseline"}
                    description={
                      loadError
                        ? "The control baselines could not be loaded. Close this dialog and try again."
                        : "The published baseline whose controls the product is judged against."
                    }
                    error={errors.get("baseline")}
                    controlRef={feedback.ref("baseline")}
                  />
                  <Grid
                    gap="space.200"
                    templateColumns={{ base: "minmax(0,1fr)", sm: "repeat(2,minmax(0,1fr))" }}
                  >
                    <PartyField
                      label="Assessor"
                      value={assessor}
                      parties={parties.data ?? []}
                      onChange={(value) => {
                        setAssessor(value);
                        setDirty(true);
                      }}
                      loading={parties.isPending && !parties.isError}
                      loadError={parties.isError}
                      onRetry={() => void parties.refetch()}
                      error={errors.get("assessor")}
                      controlRef={feedback.ref("assessor")}
                    />
                    <Field>
                      <FieldLabel>Started</FieldLabel>
                      <DatePicker
                        ref={feedback.ref("started")}
                        value={started}
                        onValueChange={(value) => {
                          setStarted(value);
                          setDirty(true);
                        }}
                      />
                    </Field>
                  </Grid>
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
          >
            Create product assessment
          </Button>
        </DialogFooter>
      </DialogContent>
      {guard.confirmation}
    </Dialog>
  );
}

type AssessmentLine = Row<"product_assessments"> & { name: string; baseline: string | null };

/**
 * The assessments of a product version, on its Assessment tab: each opens its own page, and a
 * reader who may author creates a draft. The latest published one is the version's standing.
 */
export function ProductAssessmentsSection({
  product,
  revision,
}: {
  product: Row<"products">;
  revision: Row<"product_revisions">;
}) {
  const workspace = useWorkspace();
  const { query, assessments } = useProductAssessments(revision.id);
  const baselines = useBaselineOptions();
  const [creating, setCreating] = useState(false);
  const openRecord = useOpenRecord();
  const canCreate = canAuthorLibrary(workspace.role) && revision.state === "published";
  const rows = useMemo<AssessmentLine[]>(
    () =>
      (assessments ?? []).map((assessment) => ({
        ...assessment,
        name: assessment.title,
        baseline:
          baselines.options.find((option) => option.value === assessment.profile_resolution_id)
            ?.label ?? null,
      })),
    [assessments, baselines.options],
  );
  const columns = useMemo(
    () =>
      defineColumns<AssessmentLine>((c) => [
        c.text("name", {
          header: "Product assessment",
          priority: 0,
          minWidth: 240,
          hideable: false,
          cell: (row) => (
            <RecordLink table="product_assessments" record={row}>
              {row.name}
            </RecordLink>
          ),
        }),
        c.status("state", { header: "State", width: 120, priority: 1, statuses: revisionStates }),
        c.text("baseline", { header: "Control baseline", width: 280, priority: 3 }),
        c.person("assessor_party_id", { header: "Assessor", width: 180, priority: 4 }),
        c.date("completed_on", { header: "Completed", priority: 2 }),
      ]),
    [],
  );
  const table = useCollectionTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    label: "Product assessments of this version",
    view: "product-assessments",
  });
  const create = (size: "small" | "medium") =>
    canCreate ? (
      <Button
        size={size}
        variant="secondary"
        iconBefore={<Plus />}
        onClick={() => setCreating(true)}
      >
        Create product assessment
      </Button>
    ) : undefined;
  return (
    <Section title="Product assessments" count={assessments?.length} countMax={9999}>
      <ProductCollection
        table={table}
        compact
        queries={[query, ...baselines.queries]}
        onRowClick={(row) => openRecord("product_assessments", row)}
        searchLabel="Find product assessments"
        action={create("small")}
        empty={{
          title: "No product assessment yet",
          description:
            revision.state === "published"
              ? "Create one to record what this version satisfies, element by element."
              : "Publish this version before assessing it.",
          action: create("medium"),
        }}
      />
      {creating && (
        <CreateProductAssessmentDialog
          product={product}
          revision={revision}
          onClose={() => setCreating(false)}
        />
      )}
    </Section>
  );
}

/* ——— The assessment's own page ————————————————————————————————————————————————————————————————— */

const recordFields = ["determination", "rationale"] as const;
type RecordField = (typeof recordFields)[number];

/** Record determination: one finding, and why, for every chosen control of the element. */
function RecordDeterminationDialog({
  assessmentId,
  element,
  controlIds,
  onClose,
  onRecorded,
}: {
  assessmentId: string;
  element: SheetElement;
  controlIds: readonly string[];
  onClose: () => void;
  onRecorded: () => void;
}) {
  const { formatNumber } = useLedgerLocale();
  const formId = useId();
  const [open, setOpen] = useState(true);
  const [found, setFound] = useState<string | null>(null);
  const [rationale, setRationale] = useState("");
  const [dirty, setDirty] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const done = useRef(false);
  const submitRef = useRef<HTMLButtonElement>(null);
  const feedback = useFormFeedback<RecordField>();
  const record = useRecordProductDeterminations();
  const guard = useDraftGuard({
    dirty,
    onClose: () => setOpen(false),
    description: "The determination you entered will be lost.",
  });
  // A finding short of satisfied says what falls short, so a program reads why it owes the control.
  const needsReason = !!found && found !== "satisfied";
  const issues: FormIssue<RecordField>[] = [
    ...(found ? [] : [{ field: "determination" as const, message: "Choose a determination." }]),
    ...(needsReason && !rationale.trim()
      ? [{ field: "rationale" as const, message: "Say what falls short." }]
      : []),
  ];
  const errors = new Map(
    feedback.submitted ? issues.map((issue) => [issue.field, issue.message] as const) : [],
  );
  const count = `${formatNumber(controlIds.length)} ${controlIds.length === 1 ? "control" : "controls"}`;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (guard.busy) return;
    setFailure(null);
    if (!feedback.report(issues) || !found) return;
    submitRef.current?.focus();
    if (!guard.start()) return;
    try {
      const result = await record.mutateAsync({
        assessmentId,
        elementId: element.id,
        controlIds,
        determination: found as ProductDetermination,
        rationale,
      });
      done.current = true;
      setDirty(false);
      toast.add({
        type: "success",
        title: `${formatNumber(result.recorded)} ${result.recorded === 1 ? "determination" : "determinations"} recorded`,
        ...(result.unchanged
          ? { description: `${formatNumber(result.unchanged)} already said the same.` }
          : {}),
      });
      guard.finish();
      guard.complete();
    } catch (cause) {
      setFailure(`${causeText(cause)} Nothing was recorded, and your entry is kept.`);
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
        if (done.current) onRecorded();
        onClose();
      }}
    >
      <DialogContent width="medium" initialFocus={() => feedback.node("determination") ?? true}>
        <DialogHeader>
          <DialogTitle>Record determination</DialogTitle>
          <DialogDescription>
            {count} of {elementLabel(element)}. Each takes this determination, replacing any it has
            now.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form id={formId} noValidate onSubmit={(event) => void submit(event)}>
            <Stack space="space.200">
              {failure ? (
                <Alert variant="destructive" role="alert">
                  <AlertCircle aria-hidden />
                  <AlertTitle>The determination was not recorded</AlertTitle>
                  <AlertDescription>{failure}</AlertDescription>
                </Alert>
              ) : null}
              <ErrorSummary issues={feedback.summary} focusKey={feedback.attempts} />
              <FieldSet disabled={guard.busy}>
                <Stack space="space.200">
                  <ChoiceField
                    label="Determination"
                    value={found}
                    options={PRODUCT_DETERMINATIONS.map((value) => ({
                      value,
                      label: determinations[value].label,
                    }))}
                    onChange={(value) => {
                      setFound(value);
                      setDirty(true);
                    }}
                    required
                    placeholder="Choose a determination"
                    error={errors.get("determination")}
                    controlRef={feedback.ref("determination")}
                  />
                  <TextField
                    label="Rationale"
                    value={rationale}
                    onChange={(value) => {
                      setRationale(value);
                      setDirty(true);
                    }}
                    multiline
                    autoResize
                    required={needsReason}
                    description="What was examined and what it showed. Required where the control is not satisfied."
                    error={errors.get("rationale")}
                    controlRef={feedback.ref("rationale")}
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
          >
            Record determination
          </Button>
        </DialogFooter>
      </DialogContent>
      {guard.confirmation}
    </Dialog>
  );
}

type ControlLine = SheetRow & { name: string; claim: string; found: string; familyName: string };

const CLAIMED = "Claimed by the element";
const UNCLAIMED = "Not claimed";

const sheetColumns = defineColumns<ControlLine>((c) => [
  c.text("name", {
    header: "Control",
    priority: 0,
    // The determination stays in the row beside it at a phone's width: it is what the sheet is for.
    minWidth: 140,
    hideable: false,
    cell: (row) => (
      <RecordLink table="controls" record={{ id: row.id }}>
        {row.name}
      </RecordLink>
    ),
  }),
  c.status("found", { header: "Determination", width: 160, priority: 1, statuses: determinations }),
  c.text("claim", { header: "Claim", width: 190, priority: 2 }),
  c.text("rationale", { header: "Rationale", minWidth: 220, priority: 3 }),
  c.text("familyName", { header: "Control family", width: 240, priority: 4 }),
]);

/** One element's controls: what it claims and what is determined, with the verbs over chosen rows. */
function ElementSheet({
  sheet,
  element,
  canRecord,
}: {
  sheet: ProductAssessmentSheet;
  element: SheetElement;
  canRecord: boolean;
}) {
  const { formatNumber } = useLedgerLocale();
  const rows = useMemo<ControlLine[]>(
    () =>
      sheetRows(sheet, element.id).map((row) => ({
        ...row,
        name: `${row.code} ${row.title}`,
        claim: row.claimed ? CLAIMED : UNCLAIMED,
        found: row.determination ?? "not_assessed",
        familyName: familyName(row.family, row.familyTitle),
      })),
    [sheet, element.id],
  );
  const table = useCollectionTable({
    columns: sheetColumns,
    data: rows,
    getRowId: (row) => row.id,
    label: `Controls of ${elementLabel(element)}`,
    view: "product-assessment-sheet",
    selectable: canRecord,
  });
  const openRecord = useOpenRecord();
  const record = useRecordProductDeterminations();
  const { confirm, confirmation } = useConfirmation();
  const [recording, setRecording] = useState<readonly string[] | null>(null);
  const chosen = Object.keys(table.state.rowSelection).filter((id) => table.state.rowSelection[id]);
  const determinedHere = rows.filter((row) => row.determination).length;
  const clear = () =>
    confirm({
      title: "Clear determination?",
      description: `${formatNumber(chosen.length)} ${chosen.length === 1 ? "control" : "controls"} of ${elementLabel(element)} will read Not assessed again, and their rationale is removed.`,
      confirmLabel: "Clear determination",
      variant: "danger",
      failureTitle: "The determinations were not cleared",
      action: async () => {
        const result = await record.mutateAsync({
          assessmentId: sheet.assessment.id,
          elementId: element.id,
          controlIds: chosen,
          determination: null,
        });
        table.resetRowSelection();
        toast.add({
          type: "success",
          title: `${formatNumber(result.cleared)} ${result.cleared === 1 ? "determination" : "determinations"} cleared`,
        });
      },
    });
  return (
    <Stack space="space.200" className="min-w-0">
      <Progress
        size="small"
        value={determinedHere}
        max={rows.length || 1}
        tone={determinedHere === rows.length && rows.length > 0 ? "success" : "information"}
        getAriaValueText={() => `${formatNumber(determinedHere)} of ${formatNumber(rows.length)}`}
      >
        <ProgressLabel>Controls determined</ProgressLabel>
        <ProgressValue>
          {() => `${formatNumber(determinedHere)} of ${formatNumber(rows.length)}`}
        </ProgressValue>
      </Progress>
      <ProductCollection
        table={table}
        onRowClick={(row) => openRecord("controls", { id: row.id })}
        searchLabel="Find controls"
        filters={
          <>
            <DataTable.Filter table={table} column="found" />
            <DataTable.Filter table={table} column="claim" />
            <DataTable.Filter table={table} column="familyName" />
          </>
        }
        {...(canRecord
          ? {
              selection: (
                <>
                  <Button size="small" onClick={() => setRecording(chosen)}>
                    Record determination
                  </Button>
                  <Button size="small" variant="subtle" onClick={() => void clear()}>
                    Clear determination
                  </Button>
                </>
              ),
            }
          : {})}
        empty={{
          title: "No controls to show",
          description: "The assessment's control baseline selects no control.",
        }}
      />
      {recording && (
        <RecordDeterminationDialog
          assessmentId={sheet.assessment.id}
          element={element}
          controlIds={recording}
          onClose={() => setRecording(null)}
          onRecorded={() => table.resetRowSelection()}
        />
      )}
      {confirmation}
    </Stack>
  );
}

/**
 * The product assessment's record: its Details beside the sheet an assessor works. An element (or
 * the product as a whole) is chosen above the register, which lists the baseline's controls with
 * what the element claims and what is determined; a reader who may author chooses rows and records
 * one determination for all of them, or clears them. Publish product assessment freezes it.
 */
export function ProductAssessmentRecord({
  assessmentId,
  element: askedElement,
  onElement,
}: {
  assessmentId: string;
  /** The element the address names, when it names one. */
  element?: string | undefined;
  onElement: (elementId: string) => void;
}) {
  const workspace = useWorkspace();
  const { formatNumber } = useLedgerLocale();
  const query = useProductAssessmentSheet(assessmentId);
  const sheet = query.data;
  const revision = useRow("product_revisions", sheet?.assessment.productRevisionId);
  const product = useRow("products", revision.data?.product_id);
  useRecordTitle("Product assessment", sheet?.assessment.title);
  const publish = usePublishProductAssessment();
  const { confirm, confirmation } = useConfirmation();
  const draft = sheet?.assessment.state === "draft";
  const canAuthor = canAuthorLibrary(workspace.role);
  // The element the page opened on, when the reader has chosen none: the first that holds a
  // determination, else the first that claims a control. It is kept while the page is open, so
  // clearing an element's last determination never moves the sheet to another under the reader.
  const [opened, setOpened] = useState<string | null>(null);
  const opening = sheet ? openingElement(sheet.elements) : undefined;
  if (opening && opened === null) setOpened(opening.id);
  // The element worked: the one the reader chose, which the address names, else the one opened on.
  const element =
    sheet?.elements.find((item) => item.id === askedElement) ??
    sheet?.elements.find((item) => item.id === opened) ??
    opening;
  const publishWaits = !sheet?.determined
    ? "Record at least one determination before publishing."
    : undefined;
  const publishAssessment = () =>
    sheet &&
    confirm({
      title: "Publish product assessment?",
      description: `Its ${formatNumber(sheet.determined)} determinations become what ${product.data?.name ?? "the product"} version ${revision.data?.version_number ?? ""} gives, and can no longer change.`,
      confirmLabel: "Publish product assessment",
      variant: "primary",
      failureTitle: "The product assessment was not published",
      action: async () => {
        await publish.mutateAsync({
          id: sheet.assessment.id,
          revision: sheet.assessment.revision,
          determined: sheet.determined,
          completedOn: sheet.assessment.completedOn ?? today(),
        });
        toast.add({ type: "success", title: "Product assessment published" });
      },
    });
  const productLink = (tab?: string) =>
    product.data && (
      <Link
        to="/library/products/$productKey"
        params={{ productKey: product.data.id }}
        search={{ version: sheet?.assessment.productRevisionId, ...(tab ? { tab } : {}) }}
      />
    );
  return (
    <Page>
      <QueryState queries={[query]} region>
        {sheet ? (
          <>
            <ReportFailures queries={[revision, product]} />
            <PageHeader>
              <RecordTrail current={sheet.assessment.title}>
                <TrailLink to="/library/products">Products</TrailLink>
                {product.data && (
                  <TrailLink
                    to="/library/products/$productKey"
                    params={{ productKey: product.data.id }}
                    search={{ version: sheet.assessment.productRevisionId, tab: "Assessment" }}
                  >
                    {product.data.name}
                  </TrailLink>
                )}
              </RecordTrail>
              <PageHeader.Heading>
                <PageHeader.Title>{sheet.assessment.title}</PageHeader.Title>
              </PageHeader.Heading>
              <PageHeader.Actions>
                <RecordActions table="product_assessments" id={sheet.assessment.id}>
                  {draft && canAuthor && (
                    <DropdownMenuItem
                      onClick={() => void publishAssessment()}
                      {...(publishWaits ? { disabledReason: publishWaits } : {})}
                    >
                      Publish product assessment
                    </DropdownMenuItem>
                  )}
                </RecordActions>
              </PageHeader.Actions>
            </PageHeader>
            <AsideLayout
              aside={
                <Shell.Aside
                  label="Product assessment details"
                  summary={<StatusBadge statuses={revisionStates} value={sheet.assessment.state} />}
                >
                  <Inspector.Group title="Details">
                    <DetailFacts
                      facts={[
                        [
                          "State",
                          <StatusBadge statuses={revisionStates} value={sheet.assessment.state} />,
                        ],
                        [
                          "Product",
                          product.data ? (
                            <TextLink render={productLink("Assessment") as never}>
                              {product.data.name}
                            </TextLink>
                          ) : (
                            <Absent label="Not available" />
                          ),
                        ],
                        [
                          "Version",
                          revision.data ? formatNumber(revision.data.version_number) : null,
                        ],
                        [
                          "Control baseline",
                          <BaselineName id={sheet.assessment.profileResolutionId} />,
                        ],
                        [
                          "Assessor",
                          <RelationName table="parties" id={sheet.assessment.assessorPartyId} />,
                        ],
                        [
                          "Started",
                          <DateTime
                            value={sheet.assessment.startedOn}
                            format="date"
                            absentLabel="Not recorded"
                          />,
                        ],
                        [
                          "Completed",
                          <DateTime
                            value={sheet.assessment.completedOn}
                            format="date"
                            absentLabel="Not completed"
                          />,
                        ],
                        [
                          "Published",
                          <DateTime
                            value={sheet.assessment.publishedAt}
                            format="date"
                            absentLabel="Not published"
                          />,
                        ],
                        ["Determinations", formatNumber(sheet.determined)],
                      ]}
                    />
                  </Inspector.Group>
                </Shell.Aside>
              }
            >
              <Stack space="space.200" className="min-w-0">
                {!draft && (
                  <Alert role="note">
                    <AlertDescription>
                      This product assessment is published, and a published assessment cannot
                      change. Create a new one to judge the version again.
                    </AlertDescription>
                  </Alert>
                )}
                {element && (
                  <>
                    <Inline space="space.150" alignBlock="center" shouldWrap>
                      <LibrarySelect
                        inline
                        label="Element"
                        value={element.id}
                        options={sheet.elements.map((item) => ({
                          value: item.id,
                          label:
                            item.id === WHOLE_PRODUCT
                              ? `${item.name} · ${formatNumber(item.determined)} determined`
                              : `${elementLabel(item)} · ${formatNumber(item.determined)} determined, ${formatNumber(item.claimed)} claimed`,
                        }))}
                        onChange={onElement}
                      />
                    </Inline>
                    <ElementSheet
                      key={element.id}
                      sheet={sheet}
                      element={element}
                      canRecord={draft && canAuthor}
                    />
                  </>
                )}
              </Stack>
            </AsideLayout>
          </>
        ) : (
          <MissingRecord
            kind="Product assessment"
            back={{ label: "Open products", link: <Link to="/library/products" /> }}
          />
        )}
      </QueryState>
      {confirmation}
    </Page>
  );
}
