// The program control record's Findings tab (the pass-six boards impl-control.html and
// control-inherited.html). What holds for this panel alone:
//
// What was found on the control in the program and what is being done about it, read from the
// control's trace (`assurance_trace`, the read the strip counts from): the assessor's findings of
// published results on its parts, each with its determination and the day it was made; the
// operational issues the trace reaches, with severity and status; the risks they lead to; and the
// remediation that answers them (`TraceRemediationSection`). Each is a compact collection under its
// Section heading, its order its meaning; a section with nothing in it is not drawn, and a control
// nothing was found on says so once. The strip's Findings counts the first two, as the tab does.

import { useMemo } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Section, Stack, defineColumns, useDataTable } from "@ledger/design-system";
import { SearchCheck } from "lucide-react";
import { LevelIndicator } from "@/components/app/status";
import {
  openIssue,
  type AssuranceTrace,
  type TraceFinding,
  type TraceIssue,
  type TraceRisk,
} from "@/lib/assurance-trace";
import {
  compareStatus,
  determinations,
  operationalIssueStatuses,
  riskStatuses,
  severityLevels,
} from "@/lib/status";
import { TraceRemediationSection } from "./assurance-trace";
import { ProductCollection } from "./product-collection";
import { RecordLink, useOpenRecord } from "./record-preview";
import { EmptyMessage, QueryState } from "./work-common";

/** What the tab counts, as the strip's Findings does: the assessor's findings and the open issues. */
export const findingsCount = (trace: Pick<AssuranceTrace, "findings" | "issues">) =>
  trace.findings.length + trace.issues.filter((issue) => openIssue(issue.status)).length;

const findingColumns = defineColumns<TraceFinding>((c) => [
  c.text("title", {
    header: "Assessment finding",
    minWidth: 240,
    priority: 0,
    hideable: false,
    sortable: false,
    cell: (row) => (
      <RecordLink table="assessment_findings" record={{ id: row.id }}>
        {row.title}
      </RecordLink>
    ),
  }),
  c.status("determination", {
    header: "Determination",
    width: 180,
    priority: 1,
    sortable: false,
    statuses: determinations,
  }),
  c.date("determined_at", { header: "Determined", priority: 2, sortable: false }),
]);

const issueColumns = defineColumns<TraceIssue>((c) => [
  c.text("title", {
    header: "Operational issue",
    minWidth: 240,
    priority: 0,
    hideable: false,
    sortable: false,
    cell: (row) => (
      <RecordLink table="operational_issues" record={{ id: row.id }}>
        {row.title}
      </RecordLink>
    ),
  }),
  c.status("severity", {
    header: "Severity",
    width: 130,
    priority: 1,
    sortable: false,
    statuses: severityLevels,
    cell: (row) => (
      <LevelIndicator levels={severityLevels} value={row.severity} absentLabel="Not rated" />
    ),
  }),
  c.status("status", {
    header: "Status",
    width: 130,
    priority: 2,
    sortable: false,
    statuses: operationalIssueStatuses,
  }),
  c.date("opened_at", { header: "Opened", priority: 3, sortable: false }),
]);

const riskColumns = defineColumns<TraceRisk>((c) => [
  c.text("title", {
    header: "Risk",
    minWidth: 240,
    priority: 0,
    hideable: false,
    sortable: false,
    cell: (row) => (
      <RecordLink table="risks" record={{ id: row.id }}>
        {row.title}
      </RecordLink>
    ),
  }),
  c.status("severity", {
    header: "Severity",
    width: 130,
    priority: 1,
    sortable: false,
    statuses: severityLevels,
    cell: (row) => (
      <LevelIndicator levels={severityLevels} value={row.severity} absentLabel="Not assessed" />
    ),
  }),
  c.status("status", {
    header: "Status",
    width: 130,
    priority: 2,
    sortable: false,
    statuses: riskStatuses,
  }),
]);

/** The worst first, by a vocabulary's rank. */
function worstFirst<T>(
  rows: readonly T[],
  value: (row: T) => string | null,
  order: ReturnType<typeof compareStatus>,
) {
  return [...rows].sort((a, b) => order(value(b), value(a)));
}

/** One of the tab's collections under its heading: not drawn once read with nothing in it. */
function TraceCollection<T extends { id: string }>({
  title,
  rows,
  columns,
  trace,
  onOpen,
}: {
  title: string;
  rows: readonly T[];
  columns: ReturnType<typeof defineColumns<T>>;
  trace: UseQueryResult<AssuranceTrace, Error>;
  onOpen: (row: T) => void;
}) {
  const data = useMemo(() => [...rows], [rows]);
  const collection = useDataTable({
    columns,
    data,
    getRowId: (row) => row.id,
    label: title,
    pageSize: 25,
    pinnable: false,
    hideable: false,
  });
  if (trace.data && rows.length === 0) return null;
  return (
    <Section title={title} count={trace.data ? rows.length : undefined} countMax={9999}>
      <ProductCollection
        compact
        search={false}
        sort={false}
        keepQuestion={false}
        table={collection}
        queries={[trace]}
        onRowClick={onOpen}
        empty={{ title: `No ${title.toLowerCase()}`, icon: <SearchCheck /> }}
      />
    </Section>
  );
}

/** What was found on the control in the program, and what is being done about it. */
export function ControlFindingsPanel({ trace }: { trace: UseQueryResult<AssuranceTrace, Error> }) {
  const open = useOpenRecord();
  const data = trace.data;
  const findings = useMemo(
    () =>
      worstFirst(data?.findings ?? [], (row) => row.determination, compareStatus(determinations)),
    [data?.findings],
  );
  const issues = useMemo(
    () => worstFirst(data?.issues ?? [], (row) => row.severity, compareStatus(severityLevels)),
    [data?.issues],
  );
  const risks = useMemo(
    () => worstFirst(data?.risks ?? [], (row) => row.severity, compareStatus(severityLevels)),
    [data?.risks],
  );
  const nothing =
    !!data &&
    !data.findings.length &&
    !data.issues.length &&
    !data.risks.length &&
    !data.remediation.length;
  return (
    <QueryState query={trace}>
      {nothing ? (
        <EmptyMessage
          title="Nothing found yet"
          description="Listed once an assessor or an issue finds it."
        />
      ) : (
        <Stack space="space.300" className="min-w-0">
          <TraceCollection
            title="Assessment findings"
            rows={findings}
            columns={findingColumns}
            trace={trace}
            onOpen={(row) => open("assessment_findings", { id: row.id })}
          />
          <TraceCollection
            title="Operational issues"
            rows={issues}
            columns={issueColumns}
            trace={trace}
            onOpen={(row) => open("operational_issues", { id: row.id })}
          />
          <TraceCollection
            title="Risks"
            rows={risks}
            columns={riskColumns}
            trace={trace}
            onOpen={(row) => open("risks", { id: row.id })}
          />
          {(!data || data.remediation.length > 0) && (
            <TraceRemediationSection items={data?.remediation} queries={[trace]} />
          )}
        </Stack>
      )}
    </QueryState>
  );
}
