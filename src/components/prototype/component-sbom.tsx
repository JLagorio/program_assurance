// A shared component's SBOM tab: what the version shown is made of and what is known to be wrong
// with it. Its standing SBOM (the latest by the day it was generated) heads the tab as a Section
// titled by the SBOM, its components counted, with its format and day and how many CVEs affect the
// version as facts, and Import SBOM as its small secondary for a reader who may write. Under it the
// SBOM's components, a page at a time from `sbom_component_rows` (`sbomComponentRead` in
// component-vulnerabilities): each component by name, its version and kind, its CVEs as a list
// whose card says each one's state in VEX's words, the most pressing of those states, and the worst
// severity among the CVEs that affect it. Beside them, while the page has room (under them on a
// phone or beside a panel), Programs on version N: every program built from the version under each
// CVE that affects it, with the operational issue it holds for it or No issue, the programs that owe
// an answer first (`cveAnswers` in component-work); its small secondary, Open operational issues,
// confirms which programs it opens one in and runs `open_vulnerability_issues` for each CVE still
// owed an answer, one request a CVE. Import SBOM is a Dialog that reads a CycloneDX or an SPDX
// document saved as JSON (`readSbomFile`), says what it read, and imports it whole through
// `import_sbom`, one request a choice.

import {
  createContext,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { AlertCircle, FileText, Package } from "lucide-react";
import {
  Absent,
  Alert,
  AlertDescription,
  AlertTitle,
  Box,
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
  Indicator,
  Inline,
  KeyValue,
  Section,
  Stack,
  Table,
  Text,
  defineColumns,
  toast,
  useLedgerLocale,
} from "@ledger/design-system";
import { useConfirmation } from "@/components/app/confirmation";
import { TextField } from "@/components/app/fields";
import { useFormFeedback, type FormIssue } from "@/components/app/form-feedback";
import { causeText } from "@/components/app/sentence";
import { LevelIndicator, StatusBadge } from "@/components/app/status";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import { useWorkspace } from "@/components/app/workspace";
import {
  SBOM_KIND_WORDS,
  cveAnswers,
  sbomFormatWords,
  unansweredCves,
  useComponentIdentity,
  useSbomCves,
  type CveAnswer,
  type SbomCve,
} from "@/lib/component-work";
import {
  readSbomFile,
  sbomComponentRead,
  sbomImportIssues,
  useComponentSboms,
  useComponentVulnerabilities,
  useImportSbom,
  useOpenVulnerabilityIssues,
  type SbomComponentKind,
  type SbomComponentRow,
  type SbomFile,
} from "@/lib/component-vulnerabilities";
import { operationalIssueStatuses, severityLevels, vulnerabilityStates } from "@/lib/status";
import { useCollectionTable, useServerCollection, vocabularyOptions } from "./collection-question";
import { currentOpener } from "./opener";
import { ProductCollection } from "./product-collection";
import { RecordLink, useDisplayedRecords } from "./record-preview";
import type { QueryStatus } from "./work-common";

/** The CVEs of the components a page shows, which their cells read. */
const PageCves = createContext<ReadonlyMap<string, readonly SbomCve[]> | undefined>(undefined);

/** A component's CVEs: each by its identifier, its card saying its state, severity and fix. */
function CveCell({ row }: { row: SbomComponentRow }) {
  const byComponent = useContext(PageCves);
  const cves = byComponent?.get(row.id);
  if (!byComponent) return <Text color="color.text.subtle">…</Text>;
  return (
    <Table.List
      items={(cves ?? []).map((cve) => ({
        key: cve.id,
        label: cve.cveId,
        meta: [cve.title, cve.fixedIn ? `Fixed in ${cve.fixedIn}` : null]
          .filter(Boolean)
          .join(" · "),
        status: <StatusBadge statuses={vulnerabilityStates} value={cve.state} size="xsmall" />,
      }))}
      empty={<Absent label="No CVE" />}
    />
  );
}

/** The most pressing of a component's CVE states: affected before the rest. */
function StateCell({ row }: { row: SbomComponentRow }) {
  const byComponent = useContext(PageCves);
  const first = byComponent?.get(row.id)?.[0];
  if (!byComponent) return <Text color="color.text.subtle">…</Text>;
  return first ? (
    <StatusBadge statuses={vulnerabilityStates} value={first.state} />
  ) : (
    <Absent label="No CVE" />
  );
}

const componentColumns = defineColumns<SbomComponentRow>((c) => [
  c.text("name", {
    header: "Component",
    minWidth: 200,
    priority: 0,
    hideable: false,
    cell: (row) => (
      <RecordLink table="sbom_components" record={row}>
        {row.name}
      </RecordLink>
    ),
  }),
  c.text("version", { header: "Version", width: 110, priority: 2 }),
  c.custom("cves", {
    header: "CVEs",
    width: 150,
    priority: 1,
    cell: (row) => <CveCell row={row} />,
  }),
  c.custom("vex_state", {
    header: "VEX state",
    width: 130,
    priority: 3,
    cell: (row) => <StateCell row={row} />,
  }),
  c.status("worst_severity", {
    header: "Severity",
    statuses: severityLevels,
    width: 110,
    priority: 4,
    cell: (row) => (
      <LevelIndicator
        levels={severityLevels}
        value={row.worst_severity}
        absentLabel="No open CVE"
      />
    ),
  }),
  c.text("kind", {
    header: "Kind",
    width: 150,
    priority: 5,
    cell: (row) => SBOM_KIND_WORDS[row.kind as SbomComponentKind] ?? row.kind,
  }),
]);

const componentNoun = { one: "SBOM component", other: "SBOM components" };

/** The standing SBOM's components, a page at a time, each with its CVEs in VEX's words. */
function SbomComponents({
  componentId,
  action,
  queries,
}: {
  componentId: string;
  action: ReactNode;
  queries: QueryStatus[];
}) {
  const read = useMemo(() => sbomComponentRead({ definedComponentId: componentId }), [componentId]);
  const collection = useServerCollection<SbomComponentRow>(read, {
    columns: componentColumns,
    label: "SBOM components",
    view: "component-sbom",
    // One version's question, so a page asked of one version is never asked of the next.
    keepQuestion: `component-sbom-${componentId}`,
    resizable: true,
    reorderable: true,
  });
  const displayed = useDisplayedRecords(collection.table);
  const ids = useMemo(() => displayed.map((row) => row.id), [displayed]);
  const cves = useSbomCves(ids.length ? { sbomComponentIds: ids } : null);
  return (
    <PageCves.Provider value={ids.length ? cves.byComponent : new Map()}>
      <ProductCollection
        {...collection}
        queries={[...queries, ...collection.queries, ...cves.queries]}
        compact
        noun={componentNoun}
        searchLabel="Find SBOM components"
        action={action}
        empty={{
          icon: <Package />,
          title: "No SBOM recorded",
          description: "Import one to list what this version holds.",
          action,
        }}
        filters={
          <DataTable.Filter
            table={collection.table}
            column="worst_severity"
            options={vocabularyOptions(severityLevels)}
          />
        }
      />
    </PageCves.Provider>
  );
}

const answerColumns = defineColumns<CveAnswer>((c) => [
  c.text("programName", {
    header: "Program",
    minWidth: 180,
    priority: 0,
    hideable: false,
    cell: (row) => (
      <RecordLink table="programs" record={{ id: row.programId }}>
        {row.programName}
      </RecordLink>
    ),
  }),
  // Its answer: the issue's severity, or No issue, which owes one.
  c.custom("answer", {
    header: "Issue",
    width: 120,
    priority: 1,
    cell: (row) =>
      row.issue ? (
        <LevelIndicator levels={severityLevels} value={row.issue.severity} />
      ) : (
        <Indicator tone="warning">No issue</Indicator>
      ),
  }),
  c.custom("status", {
    header: "Status",
    width: 130,
    priority: 2,
    cell: (row) =>
      row.issue ? (
        <StatusBadge statuses={operationalIssueStatuses} value={row.issue.status} />
      ) : (
        <Absent label="No issue" />
      ),
  }),
  c.custom("issue", {
    header: "Operational issue",
    minWidth: 180,
    priority: 3,
    cell: (row) =>
      row.issue ? (
        <RecordLink
          table="operational_issues"
          record={{ id: row.issue.issueId, program_id: row.programId }}
        >
          {row.issue.title}
        </RecordLink>
      ) : (
        <Absent label="No issue" />
      ),
  }),
  c.text("cveId", { header: "CVE", width: 150, priority: 4 }),
]);

/** Every program built from the version under each CVE that affects it, and its answer. */
function CveAnswers({
  rows,
  cves,
  queries,
}: {
  rows: CveAnswer[];
  /** How many CVEs affect the version; none while they are read. */
  cves: number | undefined;
  queries: QueryStatus[];
}) {
  const table = useCollectionTable({
    columns: answerColumns,
    data: rows,
    getRowId: (row) => row.id,
    label: "Programs on this version",
    pinnable: false,
    hideable: false,
  });
  return (
    <ProductCollection
      table={table}
      queries={queries}
      compact
      search={false}
      sort={false}
      keepQuestion={false}
      noun={{ one: "program", other: "programs" }}
      empty={
        cves
          ? {
              icon: <FileText />,
              title: "No program is built from it",
              description: "Programs built from this version appear here.",
            }
          : {
              icon: <FileText />,
              title: "No CVE affects this version",
              description: "Programs owing a CVE an answer appear here.",
            }
      }
    />
  );
}

/**
 * The version's SBOM, its components with their CVEs, and the programs built from it with how
 * they have answered each CVE. `componentId` is the component version the record shows.
 */
export function ComponentSbomPanel({ componentId }: { componentId: string }) {
  const workspace = useWorkspace();
  const { locale, formatNumber, formatPlural } = useLedgerLocale();
  const { identity, queries: identityQueries } = useComponentIdentity(componentId);
  const vulnerabilities = useComponentVulnerabilities(componentId);
  const { query: sbomsQuery } = useComponentSboms(componentId);
  const open = useOpenVulnerabilityIssues();
  const { confirm, confirmation } = useConfirmation();
  const [importing, setImporting] = useState(false);
  const writable = workspace.role !== "viewer";
  const answer = vulnerabilities.data;
  const sbom = answer?.sbom ?? null;
  const rows = useMemo(() => (answer ? cveAnswers(answer) : []), [answer]);
  const owed = useMemo(() => (answer ? unansweredCves(answer) : []), [answer]);
  const version = identity ? formatNumber(identity.version) : null;
  const importAction = writable ? (
    <Button size="small" variant="secondary" onClick={() => setImporting(true)}>
      Import SBOM
    </Button>
  ) : undefined;
  const openIssues = async () => {
    if (!owed.length) return;
    const requests = owed.map((cve) => ({
      vulnerabilityId: cve.vulnerabilityId,
      requestId: crypto.randomUUID(),
    }));
    const programs = [...new Set(owed.flatMap((cve) => cve.programs))];
    const opened: number[] = [];
    const done = await confirm({
      title: "Open operational issues?",
      description: `Opens an operational issue for ${owed.map((cve) => cve.cveId).join(", ")} in each of the ${formatPlural(programs.length, { one: "{count} program", other: "{count} programs" })} that holds none for it: ${new Intl.ListFormat(locale, { type: "conjunction" }).format(programs)}. Each is open and has no owner until its program names one.`,
      confirmLabel: "Open operational issues",
      variant: "primary",
      failureTitle: "The operational issues were not opened",
      action: async () => {
        opened.length = 0;
        for (const request of requests) opened.push((await open.mutateAsync(request)).programs);
      },
    });
    if (done)
      toast.add({
        type: "success",
        title: "Operational issues opened",
        description: `${formatPlural(
          opened.reduce((sum, count) => sum + count, 0),
          { one: "{count} program", other: "{count} programs" },
        )} now hold one.`,
      });
  };
  const openReason = !answer
    ? "Reading who has answered each CVE…"
    : !owed.length
      ? "Every program built from this version holds an issue for each CVE."
      : undefined;
  return (
    <Box className="@container">
      <Grid gap="space.400" alignItems="start" className="grid-cols-1 @4xl:grid-cols-3">
        <Stack space="space.150" className="min-w-0 @4xl:col-span-2">
          <Section
            title={sbom?.title ?? "SBOM"}
            {...(sbom ? { count: sbom.components, countMax: 9999 } : {})}
          >
            <Stack space="space.200">
              {sbom ? (
                <KeyValue.Group layout="columns" labelWidth="auto">
                  <KeyValue label="Format">
                    {sbomFormatWords(sbom.format, sbom.specVersion)}
                  </KeyValue>
                  <KeyValue label="Generated">
                    <DateTime value={sbom.generatedOn} format="date" />
                  </KeyValue>
                  {answer?.totals.vulnerabilities ? (
                    <KeyValue label="Open CVEs">
                      {formatNumber(answer.totals.vulnerabilities)}
                    </KeyValue>
                  ) : null}
                </KeyValue.Group>
              ) : null}
              <SbomComponents
                componentId={componentId}
                action={importAction}
                queries={[...identityQueries, sbomsQuery]}
              />
            </Stack>
          </Section>
        </Stack>
        <Section
          title={version ? `Programs on version ${version}` : "Programs on this version"}
          {...(answer ? { count: answer.totals.programs, countMax: 9999 } : {})}
          action={
            writable && owed.length ? (
              <Button
                size="small"
                variant="secondary"
                onClick={() => void openIssues()}
                {...(openReason ? { disabledReason: openReason } : {})}
              >
                Open operational issues
              </Button>
            ) : undefined
          }
        >
          <CveAnswers
            rows={rows}
            cves={answer?.totals.vulnerabilities}
            queries={[vulnerabilities]}
          />
        </Section>
      </Grid>
      {importing && identity && (
        <ImportSbomDialog
          componentId={componentId}
          componentName={identity.name}
          version={identity.version}
          onClose={() => setImporting(false)}
        />
      )}
      {confirmation}
    </Box>
  );
}

type ImportField = "file" | "title" | "generatedOn";

/**
 * Import SBOM: a CycloneDX or an SPDX document saved as JSON, read as soon as it is chosen, with
 * the title and the day it was generated taken from it and left to change. It says how many
 * components it read; a document that cannot be read says why on the file. The import is one
 * request a choice: every component or none, and the same choice sent again imports nothing more.
 */
function ImportSbomDialog({
  componentId,
  componentName,
  version,
  onClose,
}: {
  componentId: string;
  componentName: string;
  version: number;
  onClose: () => void;
}) {
  const { formatNumber, formatPlural } = useLedgerLocale();
  const formId = useId();
  const [open, setOpen] = useState(true);
  const [opener] = useState(currentOpener);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [file, setFile] = useState<{ name: string; read: SbomFile | null; issue: string | null }>();
  const [reading, setReading] = useState(false);
  const [title, setTitle] = useState("");
  const [generatedOn, setGeneratedOn] = useState("");
  const [dirty, setDirty] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const imported = useRef<{ components: number; standing: boolean } | null>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const feedback = useFormFeedback<ImportField>();
  const run = useImportSbom();
  const guard = useDraftGuard({
    dirty,
    onClose: () => setOpen(false),
    description: "The SBOM you read will be lost.",
  });
  // A changed choice is another request: the id that makes a retry safe names what is sent.
  const changed = () => {
    setDirty(true);
    setRequestId(crypto.randomUUID());
  };
  async function choose(chosen: File) {
    setReading(true);
    try {
      const read = readSbomFile(await chosen.text());
      setFile({ name: chosen.name, read, issue: null });
      setTitle((now) => now || read.title || `${componentName} SBOM`);
      setGeneratedOn((now) => now || read.generatedOn || "");
    } catch (cause) {
      setFile({ name: chosen.name, read: null, issue: causeText(cause) });
    } finally {
      setReading(false);
      changed();
    }
  }
  const read = file?.read ?? null;
  const issues: FormIssue<ImportField>[] = [
    ...(!file
      ? [{ field: "file" as const, message: "Choose a CycloneDX or an SPDX document." }]
      : file.issue
        ? [{ field: "file" as const, message: file.issue }]
        : []),
    ...sbomImportIssues({ title, generatedOn, components: read?.components ?? [] })
      .filter((issue) => read || issue.field !== "components")
      .map((issue) => ({
        field: issue.field === "components" ? ("file" as const) : issue.field,
        message: issue.message,
      })),
  ];
  // A chosen file says what is wrong with it as soon as it is read; the rest waits for an attempt.
  const fileIssue = file?.issue ? issues.find((issue) => issue.field === "file") : undefined;
  const errors = new Map(
    feedback.submitted
      ? issues.map((issue) => [issue.field, issue.message] as const)
      : fileIssue
        ? [[fileIssue.field, fileIssue.message] as const]
        : [],
  );
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (guard.busy) return;
    setFailure(null);
    if (!feedback.report(issues) || !read) return;
    submitRef.current?.focus();
    if (!guard.start()) return;
    try {
      const result = await run.mutateAsync({
        subject: { definedComponentId: componentId },
        title,
        format: read.format,
        specVersion: read.specVersion,
        serial: read.serial,
        generatedOn,
        components: read.components,
        requestId,
      });
      imported.current = { components: result.components, standing: result.standing };
      setDirty(false);
      guard.finish();
      guard.complete();
    } catch (cause) {
      setFailure(
        `${causeText(cause)} Nothing was imported. The SBOM you read is kept, and importing again will not record it twice.`,
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
        const done = imported.current;
        if (done)
          toast.add({
            type: "success",
            title: "SBOM imported",
            description: `${formatPlural(done.components, { one: "{count} component", other: "{count} components" })}. ${
              done.standing
                ? `It now stands for version ${formatNumber(version)}.`
                : "An SBOM generated later still stands."
            }`,
          });
        onClose();
      }}
    >
      <DialogContent
        width="medium"
        initialFocus={() => feedback.node("file") ?? true}
        finalFocus={() => (opener?.isConnected ? opener : true)}
      >
        <DialogHeader>
          <DialogTitle>Import SBOM</DialogTitle>
          <DialogDescription>
            {`${componentName}, version ${formatNumber(version)}`}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <form id={formId} noValidate onSubmit={(event) => void submit(event)}>
            <Stack space="space.200">
              {failure ? (
                <Alert variant="destructive" role="alert">
                  <AlertCircle aria-hidden />
                  <AlertTitle>The SBOM was not imported</AlertTitle>
                  <AlertDescription>{failure}</AlertDescription>
                </Alert>
              ) : null}
              <ErrorSummary issues={feedback.summary} focusKey={feedback.attempts} />
              <FieldSet disabled={guard.busy}>
                <Stack space="space.200">
                  <Field invalid={errors.has("file") ? true : undefined} required>
                    <FieldLabel>SBOM file</FieldLabel>
                    <Inline space="space.150" alignBlock="center" shouldWrap>
                      <FileTrigger
                        ref={feedback.ref("file")}
                        accept={[".json"]}
                        isLoading={reading}
                        onSelect={(files) => {
                          const chosen = files[0];
                          if (chosen) void choose(chosen);
                        }}
                      />
                      {file && <Text size="small">{file.name}</Text>}
                    </Inline>
                    <FieldDescription>
                      A CycloneDX or an SPDX document saved as JSON.
                    </FieldDescription>
                    {errors.has("file") ? <FieldError>{errors.get("file")}</FieldError> : null}
                  </Field>
                  <TextField
                    label="Title"
                    value={title}
                    onChange={(value) => {
                      setTitle(value);
                      changed();
                    }}
                    required
                    error={errors.get("title")}
                    controlRef={feedback.ref("title")}
                  />
                  <Field invalid={errors.has("generatedOn") ? true : undefined} required>
                    <FieldLabel>Generated</FieldLabel>
                    <DatePicker
                      ref={feedback.ref("generatedOn")}
                      value={generatedOn}
                      onValueChange={(value) => {
                        setGeneratedOn(value);
                        changed();
                      }}
                    />
                    <FieldDescription>
                      The version's latest SBOM by this day stands for it.
                    </FieldDescription>
                    {errors.has("generatedOn") ? (
                      <FieldError>{errors.get("generatedOn")}</FieldError>
                    ) : null}
                  </Field>
                  {read && (
                    <Alert role="status">
                      <AlertTitle>
                        {formatPlural(read.components.length, {
                          one: "{count} component read",
                          other: "{count} components read",
                        })}
                      </AlertTitle>
                      <AlertDescription>
                        {sbomFormatWords(read.format, read.specVersion)}.
                        {read.kindsUnread > 0 &&
                          ` ${formatPlural(read.kindsUnread, { one: "{count} is", other: "{count} are" })} of a kind the product has no word for and will be recorded as a library.`}
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
          >
            Import SBOM
          </Button>
        </DialogFooter>
      </DialogContent>
      {guard.confirmation}
    </Dialog>
  );
}
