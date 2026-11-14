import { useMemo } from "react";
import { FileText } from "lucide-react";
import { Absent, DataTable, Section, defineColumns } from "@ledger/design-system";
import { resultsFindingRead, type ResultsFindingRow } from "@/lib/assessment-results";
import { useServerCountQueries, type ServerResultQuestion } from "@/lib/server-table";
import { determinations } from "@/lib/status";
import { useServerCollection, vocabularyOptions } from "./collection-question";
import { ProductCollection } from "./product-collection";
import { RecordLink, useOpenRecord } from "./record-preview";

/*
 * The findings a results revision holds, in its preview: the campaign's Assessment results' and the
 * Review queue's. A whole-baseline plan by objective can find one an assessment objective, so they
 * are read a page at a time from the findings register's view, scoped to the results revision and
 * with what a row draws: the finding's name, a link to its record; its determination, as its
 * status; and the control it judges, a link to the program's record of it. They read control by
 * control in the catalog's order unless the reader sorts.
 */

/** The columns for a program, built once a preview: a control opens the program's record of it. */
const findingColumns = (programId: string | null) =>
  defineColumns<ResultsFindingRow>((c) => [
    c.text("title", {
      header: "Assessment finding",
      minWidth: 180,
      priority: 0,
      hideable: false,
      cell: (row) => (
        <RecordLink table="assessment_findings" record={row}>
          {row.title}
        </RecordLink>
      ),
    }),
    c.status("determination", {
      header: "Determination",
      width: 160,
      priority: 1,
      statuses: determinations,
    }),
    c.custom("control", {
      header: "Control",
      width: 120,
      priority: 2,
      // The server sorts it in the catalog's order; the page's rows by the code as they read.
      sort: (row) => row.control_code ?? "",
      text: (row) => row.control_code ?? "",
      cell: (row) =>
        row.control_id && row.control_code ? (
          <RecordLink
            table="controls"
            record={{ id: row.control_id, ...(programId ? { program_id: programId } : {}) }}
          >
            {row.control_code}
          </RecordLink>
        ) : (
          <Absent />
        ),
    }),
  ]);

const findingNoun = { one: "assessment finding", other: "assessment findings" };

/** The whole list, whatever the reader asks of it: the Section's count. */
const WHOLE: ServerResultQuestion[] = [{}];

/**
 * The Section of a results preview that lists the findings the results hold, a compact collection
 * a page at a time with its search, a Determination filter and the sort. Its question ends with the
 * preview, so it stays out of the address. Key it by the results, so another record's list starts
 * on its first page.
 */
export function ResultsFindings({
  resultsId,
  programId,
}: {
  resultsId: string;
  /** The program the results belong to, whose record of each control a control's code opens. */
  programId: string | null;
}) {
  const read = useMemo(() => resultsFindingRead(resultsId), [resultsId]);
  // The Section counts every finding the results hold on the server, with no rows: none while the
  // count loads or when it cannot be read, never a zero.
  const [total] = useServerCountQueries(read, WHOLE);
  const columns = useMemo(() => findingColumns(programId), [programId]);
  const openRecord = useOpenRecord();
  const collection = useServerCollection<ResultsFindingRow>(read, {
    columns,
    label: "Assessment findings",
    keepQuestion: false,
  });
  const { table } = collection;
  return (
    <Section title="Assessment findings" count={total?.data} countMax={9999}>
      <ProductCollection
        {...collection}
        compact
        noun={findingNoun}
        // A finding has a page of its own: its row opens it, as its name does.
        onRowClick={(row) => openRecord("assessment_findings", row)}
        searchLabel="Find assessment findings"
        filters={
          <DataTable.Filter
            table={table}
            column="determination"
            options={vocabularyOptions(determinations)}
          />
        }
        empty={{
          illustration: "records",
          icon: <FileText />,
          title: "No assessment findings yet",
          description: "An assessor records a finding against a control in these results.",
        }}
      />
    </Section>
  );
}
