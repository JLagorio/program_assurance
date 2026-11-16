// From the product pattern contract (docs/guides/product-patterns.md), moved here on
// 2026-11-16 when the contract was cut to its rules: what holds for this screen alone, and the
// full wording of rules the contract now states in fewer words.
//
// A campaign's Objectives, there and on the campaign record's Execution tab, list each campaign's
// objectives together (by the campaign's title, then the newest plan first) in the catalog's
// reading order: a control's objectives as the catalog prints them (AC-08a.01 before AC-08a.02, a
// heading before the objectives under it, the control's statement before its objectives), the
// controls in code order (AC-2 before AC-10), then an objective aimed at no control part by its
// title. Both read them a page at a time from `assessment_objective_rows`, whose rows carry their
// place, and the server orders the result (`assessmentObjectiveRead` and `campaignObjectiveRead` in
// assessment-objectives), since a whole-baseline plan by objective holds about 1,800. The record's
// is a compact collection under its Section heading among the Execution tab's, which counts the
// campaign's objectives on the server, with its search over what a row shows, its sort, its small
// secondary Create assessment objective and its preview stepping across the pages; its question
// lives in the address under the campaign's own name (`campaign-objectives-<campaign>.page`), so a
// page asked of one campaign is never asked of the next (`CampaignObjectives` in
// campaign-objectives). Their Target column names what each objective is aimed at: an assessment
// objective by its label (AC-08a.01), the control's statement as Control statement, a requirement
// revision as Requirement revision (`objectiveTarget`).

import { useMemo, useRef, type ReactNode } from "react";
import { Absent, Section, defineColumns, type EmptyIllustrationKind } from "@ledger/design-system";
import {
  campaignObjectiveRead,
  objectiveTarget,
  type CampaignObjectiveRow,
} from "@/lib/assessment-objectives";
import { productCollectionNoun, productRecordNoun } from "@/lib/product-records";
import { useServerCountQueries, type ServerResultQuestion } from "@/lib/server-table";
import { useServerCollection } from "./collection-question";
import { ProductCollection } from "./product-collection";
import { RecordLink, useDisplayedRecords, useOpenRecord } from "./record-preview";
import type { QueryStatus } from "./work-common";

/*
 * A campaign record's Objectives, on its Execution tab: the campaign's objectives a page at a time
 * from `assessment_objective_rows`, since a plan by objective holds one objective an assessment
 * objective of each control it assesses (about 1,800 for a whole baseline). The server pages,
 * sorts, searches and counts them, the newest plan first and each plan's in the catalog's reading
 * order unless the reader sorts. An objective has no page of its own: its name and its row open the
 * record's preview, which steps across the pages.
 */

/** An objective as the collection draws it: its plan's title under the id its column names. */
export type CampaignObjective = CampaignObjectiveRow & { plan: string };

/** The collection's rows from the page's, in the server's order. */
const objectiveRows = (page: CampaignObjectiveRow[]): CampaignObjective[] =>
  page.map((row) => ({ ...row, plan: row.plan_title }));

/**
 * The columns, built once for their opener: stepping through the preview rebuilds none. The
 * Target names what an objective is aimed at, as the Assessment campaigns page's does: an
 * assessment objective by its label (AC-08a.01), the control's statement as Control statement, a
 * requirement revision as Requirement revision.
 */
const objectiveColumns = (open: (row: CampaignObjective) => void) =>
  defineColumns<CampaignObjective>((c) => [
    c.id("title", {
      header: "Objective",
      minWidth: 180,
      priority: 0,
      hideable: false,
      cell: (row) => (
        <RecordLink table="assessment_objectives" record={row} onPreview={() => open(row)}>
          {row.title}
        </RecordLink>
      ),
    }),
    c.text("acceptance_criterion", {
      header: "Acceptance criterion",
      priority: 3,
      cell: (row) => row.acceptance_criterion ?? <Absent />,
    }),
    c.text("plan", { header: "Plan", width: 180, priority: 2 }),
    c.custom("target", {
      header: "Target",
      width: 170,
      priority: 1,
      text: (row) => objectiveTarget(row)?.label ?? "",
      cell: (row) => {
        const target = objectiveTarget(row);
        return target ? (
          <RecordLink table={target.table} record={{ id: target.id }}>
            {target.label}
          </RecordLink>
        ) : (
          <Absent />
        );
      },
    }),
  ]);

const objectiveNoun = {
  one: productRecordNoun("assessment_objectives"),
  other: productCollectionNoun("assessment_objectives"),
};

/** The whole collection, whatever the reader asks of it: the Section's count. */
const WHOLE: ServerResultQuestion[] = [{}];

/** The name the collection's column layout is kept under in the browser, every campaign's alike. */
const campaignObjectivesView = "campaign-objectives";

/**
 * Where the collection keeps the reader's question (its search, sort and page) in the address and
 * in this tab's session: one campaign's, so a page asked of one campaign's objectives is never
 * asked of the next campaign opened, as a program's tasks keep theirs (`programTasksView`).
 */
const campaignObjectivesQuestion = (campaignId: string) =>
  `${campaignObjectivesView}-${campaignId}`;

export function CampaignObjectives({
  campaignId,
  selectedId,
  onPreview,
  onDisplayedRowsChange,
  queries,
  action,
  empty,
}: {
  campaignId: string;
  /** The objective the record's preview shows, whose eye the table marks. */
  selectedId?: string | undefined;
  /** Opens the record's preview of an objective. */
  onPreview: (row: CampaignObjective) => void;
  /** The page's rows, in the server's order, which the preview steps through and across pages. */
  onDisplayedRowsChange: (rows: CampaignObjective[]) => void;
  /** The other reads the collection waits on: the plans its create action needs. */
  queries: QueryStatus[];
  /** Create assessment objective, drawn as a small secondary among the tab's collections. */
  action: ReactNode;
  empty: { illustration: EmptyIllustrationKind; icon: ReactNode; description: string };
}) {
  const read = useMemo(() => campaignObjectiveRead(campaignId), [campaignId]);
  // The Section counts the campaign's objectives on the server, with no rows, whatever the
  // reader's question: none while it loads or when it cannot be read, never a zero.
  const [total] = useServerCountQueries(read, WHOLE);
  const openRecord = useOpenRecord();
  // The columns are built once: the name reaches the latest opener.
  const open = useRef(onPreview);
  open.current = onPreview;
  const columns = useMemo(() => objectiveColumns((row) => open.current(row)), []);
  const collection = useServerCollection<CampaignObjective, CampaignObjectiveRow>(read, {
    columns,
    rows: objectiveRows,
    preview: useMemo(
      () => ({
        onPreview: (row: CampaignObjective) => open.current(row),
        activeId: selectedId ?? null,
      }),
      [selectedId],
    ),
    label: "Objectives",
    view: campaignObjectivesView,
    keepQuestion: campaignObjectivesQuestion(campaignId),
    resizable: true,
    reorderable: true,
  });
  useDisplayedRecords(collection.table, onDisplayedRowsChange);
  return (
    <Section title="Objectives" count={total?.data} countMax={9999}>
      <ProductCollection
        {...collection}
        queries={[...collection.queries, ...queries]}
        compact
        noun={objectiveNoun}
        // An objective has no page of its own: its row opens its preview, as its name does.
        onRowClick={(row) => openRecord("assessment_objectives", row, () => open.current(row))}
        searchLabel="Find objectives"
        empty={{ ...empty, title: "No objectives yet", action }}
        action={action}
      />
    </Section>
  );
}
