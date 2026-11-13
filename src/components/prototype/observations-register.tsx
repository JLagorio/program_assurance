import { useMemo, useState } from "react";
import {
  Absent,
  DataTable,
  HeadingLevelProvider,
  Prose,
  Section,
  Stack,
  defineColumns,
} from "@ledger/design-system";
import {
  RecordLink,
  RecordPreviewActions,
  RecordPreviewPanel,
  useDisplayedRecords,
  useEndOnHide,
  useOpenRecord,
} from "./record-preview";
import { useRows } from "@/lib/models";
import { labelFor, type DataRecord } from "@/lib/records";
import { serverRead, type ServerRow } from "@/lib/server-table";
import { stepDeterminations } from "@/lib/status";
import { EntitySection, ModelFacts, RelationName, RevisionName } from "./record-tools";
import { StatusBadge } from "@/components/app/status";
import { ProductCollection } from "./product-collection";
import { useServerCollection, vocabularyOptions } from "./collection-question";

/**
 * What an observation says, wherever it is previewed: what was observed, how and by whom, the
 * operational issues it supports, and the evidence it cites. An observation has no page of its
 * own; it is read from the issue it supports, or here.
 */
export function ObservationDetails({
  observation,
  result,
}: {
  observation: DataRecord;
  /** Its test step's determination, where the caller has read it; read here otherwise. */
  result?: string | null | undefined;
}) {
  const step = useRows(
    "step_results",
    { id: typeof observation["step_result_id"] === "string" ? observation["step_result_id"] : [] },
    {
      columns: ["id", "determination"],
      enabled: result === undefined && typeof observation["step_result_id"] === "string",
    },
  );
  const determination = result === undefined ? (step.data?.[0]?.determination ?? null) : result;
  const description = observation["description"];
  return (
    // The preview's record title is its h2; its collections sit under it.
    <HeadingLevelProvider level={3}>
      <Stack space="space.250">
        <Prose label="Description">
          {typeof description === "string" && description.trim() ? description : <Absent />}
        </Prose>
        <ModelFacts
          record={observation}
          table="observations"
          fields={[
            { key: "method", label: "Method" },
            { key: "observed_at", label: "Observed" },
            { key: "expires_at", label: "Expires" },
            {
              key: "program_id",
              label: "Program",
              render: (row) => (
                <RelationName table="programs" id={row["program_id"] as string | null} />
              ),
            },
            {
              key: "observer_party_id",
              label: "Observer",
              render: (row) => (
                <RelationName table="parties" id={row["observer_party_id"] as string | null} />
              ),
            },
            {
              key: "assessment_event_id",
              label: "Assessment event",
              render: (row) => (
                <RelationName
                  table="assessment_events"
                  id={row["assessment_event_id"] as string | null}
                />
              ),
            },
            {
              key: "step_result_id",
              label: "Step result",
              render: (row) =>
                determination ? (
                  <StatusBadge statuses={stepDeterminations} value={determination} />
                ) : (
                  <Absent label={row["step_result_id"] ? "No result recorded" : "Not recorded"} />
                ),
            },
          ]}
        />
        <EntitySection
          showHeading
          table="issue_observations"
          links="operational_issues"
          filters={{ observation_id: observation.id }}
          title="Operational issues"
          readOnly
          columns={[
            {
              key: "issue_id",
              label: "Operational issue",
              render: (row) => (
                <RelationName table="operational_issues" id={row["issue_id"] as string} />
              ),
            },
          ]}
        />
        <EntitySection
          showHeading
          table="observation_evidence"
          links="evidence_versions"
          filters={{ observation_id: observation.id }}
          title="Evidence citations"
          readOnly
          columns={[
            {
              key: "evidence_version_id",
              label: "Evidence",
              render: (row) => (
                <RevisionName table="evidence_versions" id={row["evidence_version_id"] as string} />
              ),
            },
            { key: "description", label: "Description" },
          ]}
        />
      </Stack>
    </HeadingLevelProvider>
  );
}

/**
 * An observation as its register and its preview read it: what the preview draws, its program by
 * name, and the determination recorded at the test step it was made at.
 */
type ObservationRow = ServerRow<
  "observation_rows",
  | "id"
  | "tenant_id"
  | "title"
  | "description"
  | "method"
  | "observed_at"
  | "expires_at"
  | "program_id"
  | "program_name"
  | "observer_party_id"
  | "assessment_event_id"
  | "step_result_id"
  | "result",
  "tenant_id" | "title" | "method"
>;

/** The methods an observation is made by (its check constraint), in the order the filter lists them. */
const methods = ["analysis", "demonstration", "examine", "inspection", "interview", "test"];
const methodOptions = methods.map((method) => ({ value: method, label: labelFor(method) }));
/** The search finds a method by the words its cell shows. */
const methodLabels = Object.fromEntries(
  methods.map((method) => [method, { label: labelFor(method) }]),
);

/**
 * The observations, a page at a time from the server, newest change first: every observation of
 * the workspace, or one program's.
 */
const observationRead = (programId: string | undefined) =>
  serverRead({
    source: "observation_rows",
    model: "observations",
    // An observation's result is its test step's determination.
    models: ["step_results"],
    columns: [
      "id",
      "tenant_id",
      "title",
      "description",
      "method",
      "observed_at",
      "expires_at",
      "program_id",
      "program_name",
      "observer_party_id",
      "assessment_event_id",
      "step_result_id",
      "result",
    ],
    scope: programId ? { program_id: programId } : undefined,
    search: ["title", "program_name"],
    fields: {
      method: { labels: methodLabels },
      result: { labels: stepDeterminations, sort: "result_rank" },
      // The program sorts, and is found, by its name.
      program_id: { column: "program_name", filter: false },
      observed_at: { filter: false },
    },
    order: [{ column: "updated_at", ascending: false }],
  });

/**
 * The register's columns, built once for its opener: stepping through the preview rebuilds none.
 * An observation has no page of its own: its name opens its preview, with `open`.
 */
const observationColumns = (open: (row: ObservationRow) => void, withProgram: boolean) =>
  defineColumns<ObservationRow>((c) => [
    c.text("title", {
      header: "Observation",
      hideable: false,
      minWidth: 180,
      priority: 0,
      cell: (row) => (
        <RecordLink table="observations" record={row} onPreview={() => open(row)}>
          {row.title}
        </RecordLink>
      ),
    }),
    c.text("method", { header: "Method", priority: 2, cell: (row) => labelFor(row.method) }),
    c.date("observed_at", { header: "Observed", priority: 1 }),
    c.status("result", {
      header: "Result",
      width: 130,
      priority: 3,
      statuses: stepDeterminations,
    }),
    ...(withProgram
      ? [
          c.text("program_id", {
            header: "Program",
            cell: (row: ObservationRow) =>
              row.program_name ?? (
                <Absent label={row.program_id ? "Not available" : "Not recorded"} />
              ),
          }),
        ]
      : []),
  ]);

const observationNoun = { one: "observation", other: "observations" };

/**
 * Recorded observations can exist before a formal assessment execution is pinned. The register
 * reads a page at a time from the server, which pages, sorts, filters and searches them.
 */
export function ObservationsRegister({
  programId,
  fill,
}: {
  programId?: string | undefined;
  /** The register is the page's one block: it takes the rest of the window. */
  fill?: boolean | undefined;
}) {
  const openRecord = useOpenRecord();
  const [selected, setSelected] = useState<ObservationRow | null>(null);
  // A preview belongs to its tab: it ends when the tab hides this register.
  useEndOnHide(() => setSelected(null));
  const read = useMemo(() => observationRead(programId), [programId]);
  const collection = useServerCollection<ObservationRow>(read, {
    columns: useMemo(() => observationColumns(setSelected, !programId), [programId]),
    preview: useMemo(
      () => ({ onPreview: setSelected, activeId: selected?.id ?? null }),
      [selected?.id],
    ),
    label: "observations",
    view: programId ? "program-observations" : "observations",
    resizable: true,
    reorderable: true,
  });
  const { table } = collection;
  const displayed = useDisplayedRecords(table);
  // The preview reads the page's record, so a refreshed observation shows as it is now.
  const current = selected && (displayed.find((row) => row.id === selected.id) ?? selected);
  const content = (
    <>
      <ProductCollection
        {...collection}
        fill={fill}
        noun={observationNoun}
        // An observation has no page of its own: its row opens its preview, as its name does.
        onRowClick={(row) => openRecord("observations", row, () => setSelected(row))}
        searchLabel="Find observations"
        empty={{
          illustration: "records",
          title: "No observations recorded",
          description:
            "Observations are recorded from assessment test runs and events, and appear here as they are made.",
        }}
        filters={
          <>
            <DataTable.Filter table={table} column="method" options={methodOptions} />
            <DataTable.Filter
              table={table}
              column="result"
              options={vocabularyOptions(stepDeterminations)}
            />
          </>
        }
      />
      {current ? (
        <RecordPreviewPanel
          title={current.title}
          label="Observation preview"
          defaultWidth={640}
          onClose={() => setSelected(null)}
          navigation={
            <RecordPreviewActions
              table="observations"
              record={current}
              rows={displayed}
              onSelect={setSelected}
            />
          }
        >
          <ObservationDetails
            observation={current as unknown as DataRecord}
            result={current.result ?? null}
          />
        </RecordPreviewPanel>
      ) : null}
    </>
  );
  return fill ? content : <Section title="Observations">{content}</Section>;
}
