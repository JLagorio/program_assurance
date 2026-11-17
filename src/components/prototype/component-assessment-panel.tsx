// A component record's Assessment tab (the pass-six board component--assessment.html; Josef's
// decision of 2026-11-15, "Component versions · A new version carries forward every determination
// except on the controls its owner lists as affected, which read To review until judged"). What
// holds for this tab alone:
//
// It says where the version shown stands on each control it claims or is judged on, from one read,
// `component_control_status`: a line a deciding assessment (Decided by its title, its assessor,
// the day it was completed, how many of the standing determinations are its own), with "not
// assessed itself" once no assessment of this version decides anything; then the controls as a
// register, the worst first (`componentStandings`: Other than satisfied, Partially satisfied, To
// review, Not assessed, Satisfied), each named by its code and title (a link to the catalog's
// control), its Control family, its Determination, From (the version that was judged on it: this
// one, or the earlier one it was carried from), its Claim (what the component's implementation
// says of it) and its Rationale (the assessor's, else, for a control to review, what an earlier
// version read: "Was Satisfied on version 1"). Its saved views are each standing and Carried;
// Determination and Control family are its filters. Its question is the component version's own
// (`component-controls-<id>`), so a standing the header's line opens is never asked of another.
// The eye previews a control's standing beside the page.

import {
  Absent,
  DataTable,
  DateTime,
  Fact,
  Prose,
  Stack,
  defineColumns,
  useLedgerLocale,
  type Preset,
} from "@ledger/design-system";
import type { UseQueryResult } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/app/status";
import { controlStanding, type ComponentStanding } from "@/lib/component-record";
import type { ComponentControl, ComponentControlStatusAnswer } from "@/lib/component-reuse";
import { useRows } from "@/lib/models";
import { controlName } from "@/lib/product-records";
import { componentStandings, determinations, implementationStatuses } from "@/lib/status";
import { useCollectionTable } from "./collection-question";
import { ProductCollection } from "./product-collection";
import { RecordLink, useDisplayedRecords, useEndOnHide, useOpenRecord } from "./record-preview";
import { RecordSummaryPreview } from "./record-summary-preview";
import { RelationName } from "./record-tools";

/** The address key of one component version's controls: its question is its own. */
export const componentControlsKey = (componentId: string) => `component-controls-${componentId}`;

/** A control as the tab lists it. */
type ControlLine = ComponentControl & {
  /** The control's code and title together, as a record names a control. */
  name: string;
  standing: ComponentStanding;
  /** The version that was judged on it, in words; none while nobody has judged it. */
  from: string | null;
  /** What the component's implementation of it says (`implementationStatuses`); none where it claims none. */
  claim: string | null;
  /** The assessor's rationale, else what a control to review read on an earlier version. */
  reason: string | null;
};

/** The control's code in natural order: AC-2 before AC-10. */
const byCode = (a: ControlLine, b: ControlLine) =>
  a.code.localeCompare(b.code, undefined, { numeric: true });
const RANK = Object.keys(componentStandings) as ComponentStanding[];

const columns = defineColumns<ControlLine>((c) => [
  c.text("name", {
    header: "Control",
    priority: 0,
    minWidth: 260,
    hideable: false,
    sortBy: (row) => row.code,
    cell: (row) => (
      <RecordLink table="controls" record={{ id: row.id, code: row.code, title: row.title }}>
        {row.name}
      </RecordLink>
    ),
  }),
  c.text("family", { header: "Control family", width: 140, priority: 4 }),
  c.status("standing", {
    header: "Determination",
    width: 200,
    priority: 1,
    statuses: componentStandings,
  }),
  c.text("from", { header: "From", width: 120, priority: 3 }),
  c.status("claim", { header: "Claim", width: 150, priority: 5, statuses: implementationStatuses }),
  c.text("reason", { header: "Rationale", minWidth: 200, priority: 2 }),
]);

export function ComponentAssessmentPanel({
  componentId,
  status,
}: {
  componentId: string;
  status: UseQueryResult<ComponentControlStatusAnswer, Error>;
}) {
  const { formatNumber } = useLedgerLocale();
  const openRecord = useOpenRecord();
  // What the component's own implementations claim of each control.
  const claims = useRows(
    "defined_component_implementations",
    { defined_component_id: componentId },
    { columns: ["control_id", "implementation_status"] },
  );
  const [preview, setPreview] = useState<ControlLine | null>(null);
  useEndOnHide(() => setPreview(null));
  const answer = status.data;
  const version = answer?.component.version;
  const rows = useMemo((): ControlLine[] => {
    if (!answer) return [];
    const claimOf = new Map(
      (claims.data ?? []).flatMap((claim) =>
        claim.control_id ? [[claim.control_id, claim.implementation_status] as const] : [],
      ),
    );
    return answer.controls
      .map((control): ControlLine => {
        const standing = controlStanding(control);
        const review = control.review;
        return {
          ...control,
          name: controlName(control),
          standing,
          from: control.carriedFrom
            ? `Version ${formatNumber(control.carriedFrom.version)}`
            : control.status === "not_assessed"
              ? null
              : `Version ${formatNumber(answer.component.version)}`,
          claim: claimOf.get(control.id) ?? null,
          reason:
            control.rationale ??
            (review
              ? `Was ${determinations[review.earlierDetermination].label} on version ${formatNumber(review.earlierVersion)}`
              : null),
        };
      })
      .sort((a, b) => RANK.indexOf(a.standing) - RANK.indexOf(b.standing) || byCode(a, b));
  }, [answer, claims.data, formatNumber]);
  // Each standing that holds a control, then the determinations carried from an earlier version.
  const presets = useMemo((): Preset[] => {
    const carried = [...new Set(rows.flatMap((row) => (row.carriedFrom ? [row.from!] : [])))];
    return [
      { id: "all", label: "All controls" },
      // Satisfied is what the line and the tray count; the views are what is left to act on.
      ...RANK.filter((key) => key !== "satisfied" && rows.some((row) => row.standing === key)).map(
        (key) => ({
          id: key,
          label: componentStandings[key].label,
          filters: [{ id: "standing", value: [key] }],
        }),
      ),
      ...(carried.length
        ? [{ id: "carried", label: "Carried", filters: [{ id: "from", value: carried }] }]
        : []),
    ];
  }, [rows]);
  const table = useCollectionTable<ControlLine>({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    rowLabel: (row) => row.name,
    preview: useMemo(
      () => ({ onPreview: setPreview, activeId: preview?.id ?? null }),
      [preview?.id],
    ),
    label: "Controls by determination",
    view: "component-controls",
    resizable: true,
  });
  const displayed = useDisplayedRecords(table);
  const own = answer?.assessments.some((assessment) => assessment.version === version);
  return (
    <Stack space="space.200">
      {answer && (answer.assessments.length > 0 || answer.total > 0) && (
        <Stack space="space.075">
          {answer.assessments.map((assessment) => (
            <Fact.Group key={assessment.id}>
              <Fact label="Decided by">{assessment.title}</Fact>
              {assessment.assessorPartyId && (
                <Fact label="Assessor">
                  <RelationName table="parties" id={assessment.assessorPartyId} peek={false} />
                </Fact>
              )}
              <Fact label={assessment.completedOn ? "Completed" : "Published"}>
                <DateTime value={assessment.completedOn ?? assessment.publishedAt} format="date" />
              </Fact>
              <Fact label="Determinations">{formatNumber(assessment.determinations)}</Fact>
            </Fact.Group>
          ))}
          {!own && version !== undefined && (
            <Fact.Group>
              <Fact label={`Version ${formatNumber(version)}`}>not assessed itself</Fact>
            </Fact.Group>
          )}
        </Stack>
      )}
      <ProductCollection
        table={table}
        queries={[status, claims]}
        keepQuestion={componentControlsKey(componentId)}
        noun={{ one: "control", other: "controls" }}
        views={
          <DataTable.Presets
            table={table}
            presets={presets}
            aria-label="Controls by determination"
          />
        }
        filters={
          <>
            <DataTable.Filter table={table} column="standing" />
            <DataTable.Filter table={table} column="family" />
          </>
        }
        onRowClick={(row) =>
          openRecord("controls", { id: row.id, code: row.code, title: row.title })
        }
        empty={{
          illustration: "shield",
          title: "No controls claimed",
          description: "The controls its implementations claim are listed here.",
        }}
      />
      {preview && (
        <RecordSummaryPreview
          model="controls"
          noun="Control standing"
          title={preview.name}
          readOnly
          record={displayed.find((row) => row.id === preview.id) ?? preview}
          rows={displayed}
          onSelect={setPreview}
          onClose={() => setPreview(null)}
          fields={[
            {
              key: "standing",
              label: "Determination",
              render: (row) => <StatusBadge statuses={componentStandings} value={row.standing} />,
            },
            {
              key: "from",
              label: "From",
              render: (row) => row.from ?? <Absent label="Not judged" />,
            },
            {
              key: "claim",
              label: "Claim",
              render: (row) =>
                row.claim ? (
                  <StatusBadge statuses={implementationStatuses} value={row.claim} />
                ) : (
                  <Absent label="Not claimed" />
                ),
            },
            {
              key: "family",
              label: "Control family",
              render: (row) => row.familyTitle ?? row.family ?? <Absent />,
            },
            {
              key: "reason",
              label: "Rationale",
              render: (row) => (row.reason ? <Prose>{row.reason}</Prose> : <Absent />),
            },
          ]}
        />
      )}
    </Stack>
  );
}
