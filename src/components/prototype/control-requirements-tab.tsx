// A control's Requirements tab, on the program's record of the control (board impl-control of the
// November 2026 UX proposal): the program's requirements that map the control, one line a
// requirement at its latest revision, as the control status counts them. Each says what its
// mappings cover, the Whole control or the assessment objectives by label in the catalog's order
// (a mapping covers the objective it names and every one under it), how many of the control's
// objectives that is ("10 of 10"), the systems its mappings name (a mapping on an element counts on
// its boundary; one that names none, Every system), how many evidence versions it cites and its
// state. The tab's only content is the collection, so its one small primary is Map a requirement,
// the picker the control's next step opens (`MapRequirementSurface` in map-requirement), for a
// reader who may write. Which requirements map the control is the trace's answer
// (`assurance_trace`, read once for the record); their mappings are read on their latest revisions
// and what they cover is `requirementCoverage` in control-work, over the control's objectives from
// `program_control_objectives`.

import { useMemo, useRef, useState } from "react";
import { Button, defineColumns } from "@ledger/design-system";
import { Plus } from "lucide-react";
import { useWorkspace } from "@/components/app/workspace";
import { useAssuranceTrace } from "@/lib/assurance-trace";
import { useProgramControlObjectives } from "@/lib/control-objectives";
import {
  requirementCoverage,
  useLatestRevisions,
  type RequirementCoverage,
} from "@/lib/control-work";
import { idSet, useRow, useRows } from "@/lib/models";
import { revisionStates } from "@/lib/status";
import { useCollectionTable } from "./collection-question";
import { ObjectiveCount } from "./control-status";
import { MapRequirementSurface } from "./map-requirement";
import { ProductCollection } from "./product-collection";
import { RecordLink, useOpenRecord } from "./record-preview";

type Line = RequirementCoverage & {
  /** The requirement by its code and title, as the row's name reads and sorts. */
  name: string;
  /** The systems its mappings name, by code; none where they name none. */
  systemCodes: string[];
};

export function ControlRequirementsPanel({
  programId,
  controlId,
}: {
  programId: string;
  controlId: string;
}) {
  const workspace = useWorkspace();
  const openRecord = useOpenRecord();
  const control = useRow("controls", controlId);
  const trace = useAssuranceTrace({ kind: "control", id: controlId, programId });
  const requirements = trace.data?.requirements;
  const requirementIds = useMemo(() => requirements?.map((row) => row.id), [requirements]);
  const { revisions, latest } = useLatestRevisions(requirementIds);
  const latestIds = useMemo(() => idSet([...latest.values()]), [latest]);
  const mappings = useRows(
    "requirement_control_links",
    { control_id: controlId, requirement_revision_id: latestIds },
    {
      columns: [
        "id",
        "requirement_revision_id",
        "control_part_id",
        "system_id",
        "relationship_type",
      ],
      enabled: revisions.isSuccess,
    },
  );
  const coverage = useProgramControlObjectives(programId, controlId);
  // The systems the mappings name, by code: a boundary or an element inside one.
  const systemIds = useMemo(
    () => idSet(mappings.data?.map((row) => row.system_id)),
    [mappings.data],
  );
  const systems = useRows(
    "systems",
    { id: systemIds },
    { columns: ["id", "code"], enabled: mappings.isSuccess },
  );
  const rows = useMemo<Line[]>(() => {
    if (!requirements || !mappings.data || !coverage.data) return [];
    const codes = new Map((systems.data ?? []).map((system) => [system.id, system.code]));
    return requirementCoverage({
      requirements,
      latest,
      mappings: mappings.data,
      objectives: coverage.data.objectives,
    }).map((line) => ({
      ...line,
      name: `${line.code} ${line.title}`,
      systemCodes: line.systems.map((id) => codes.get(id) ?? "System unavailable"),
    }));
  }, [requirements, latest, mappings.data, coverage.data, systems.data]);
  const columns = useMemo(
    () =>
      defineColumns<Line>((c) => [
        c.text("name", {
          header: "Requirement",
          minWidth: 220,
          priority: 0,
          hideable: false,
          cell: (row) => (
            <RecordLink
              table="engineering_requirements"
              record={{ id: row.id, program_id: programId }}
            >
              {row.name}
            </RecordLink>
          ),
        }),
        // What its mappings cover: the whole control, else the objectives by label.
        c.list("covers", {
          header: "Covers",
          width: 220,
          priority: 1,
          searchable: true,
          items: (row) =>
            row.whole
              ? [{ key: "whole", label: "Whole control" }]
              : row.objectives.map((label) => ({ key: label, label })),
        }),
        c.number("covered", {
          header: "Objectives",
          width: 120,
          priority: 2,
          cell: (row) => <ObjectiveCount count={row.covered} objectives={row.total} />,
        }),
        c.list("systemCodes", {
          header: "Systems",
          width: 180,
          priority: 3,
          searchable: true,
          items: (row) => [
            ...(row.everySystem ? [{ key: "every", label: "Every system" }] : []),
            ...row.systemCodes.map((code) => ({ key: code, label: code })),
          ],
        }),
        c.number("evidence", { header: "Evidence", width: 110, priority: 4 }),
        c.status("state", { header: "State", width: 120, priority: 5, statuses: revisionStates }),
      ]),
    [programId],
  );
  const table = useCollectionTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    rowLabel: (row) => row.name,
    label: "Requirements that map this control",
    view: "control-requirements",
  });
  const [mapping, setMapping] = useState(false);
  // The button pressed, in the toolbar or the empty state, which the picker gives focus back to.
  const opener = useRef<HTMLElement | null>(null);
  const canWrite = workspace.role !== "viewer";
  const action =
    canWrite && control.data ? (
      <Button
        size="small"
        variant="primary"
        iconBefore={<Plus />}
        onClick={(event) => {
          opener.current = event.currentTarget;
          setMapping(true);
        }}
      >
        Map a requirement
      </Button>
    ) : null;
  return (
    <>
      <ProductCollection
        table={table}
        queries={[control, trace, revisions, mappings, coverage, systems]}
        keepQuestion
        searchLabel="Find requirements"
        action={action}
        onRowClick={(row) =>
          openRecord("engineering_requirements", { id: row.id, program_id: programId })
        }
        empty={{
          illustration: "document",
          title: "No requirement maps this control",
          description: "Map one of the program's requirements to it.",
          action,
        }}
      />
      {mapping && control.data && (
        <MapRequirementSurface
          programId={programId}
          control={{ id: control.data.id, code: control.data.code, title: control.data.title }}
          opener={opener.current}
          slot={null}
          onClose={() => setMapping(false)}
        />
      )}
    </>
  );
}
