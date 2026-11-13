import { useCallback, useMemo } from "react";
import { Link, getRouteApi, useRouterState } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  Grid,
  Heading,
  Inline,
  Stack,
  Text,
  TextLink,
  ToggleGroup,
  ToggleGroupItem,
  defineColumns,
  useLedgerLocale,
} from "@ledger/design-system";
import { StatusBadge } from "@/components/app/status";
import {
  controlStatusFamilies,
  controlStatusShare,
  useProgramControlStatus,
  type ControlStanding,
  type ControlStatusFamily,
  type ProgramControlStatus,
} from "@/lib/control-status";
import { registerViews } from "@/lib/register-views";
import { controlDeterminers, controlStatuses } from "@/lib/status";
import { useCollectionTable } from "./collection-question";
import { controlStatusLink, controlStatusListSearch } from "./control-status-link";
import { ControlStatusKey, ControlStatusMap } from "./control-status";
import { ProductCollection } from "./product-collection";
import { RecordLink, useOpenRecord } from "./record-preview";
import { EmptyMessage, QueryState } from "./work-common";

/** The view's route: its address keeps how the controls are shown and the List's question. */
const statusRoute = getRouteApi("/programs/$programId_/control-status");

/** How the view shows the baseline's controls. The families are what an address shows unasked. */
export type ControlStatusShow = "families" | "list";
const shows: { value: ControlStatusShow; label: string }[] = [
  { value: "families", label: "Families" },
  { value: "list", label: "List" },
];

/** A family as the List's column and filter name it: its code and its name, "AC Access Control". */
const familyName = (code: string | null, title: string | null) =>
  [code ?? "Other", title].filter(Boolean).join(" ");

/** A row of the List: a control with its name and its family as the columns read them. */
type ControlRow = ControlStanding & { name: string; family: string };

const listColumns = (programId: string) =>
  defineColumns<ControlRow>((c) => [
    c.text("name", {
      header: "Control",
      priority: 0,
      minWidth: 240,
      hideable: false,
      cell: (row) => (
        <RecordLink table="controls" record={{ id: row.id, program_id: programId }}>
          {row.name}
        </RecordLink>
      ),
    }),
    c.status("status", {
      header: "Control status",
      width: 200,
      priority: 1,
      statuses: controlStatuses,
    }),
    // Whose determination the status is; a control nobody has determined is not determined yet.
    c.status("determinedBy", {
      header: "Determined by",
      width: 190,
      priority: 2,
      statuses: controlDeterminers,
      cell: (row) => (
        <StatusBadge
          statuses={controlDeterminers}
          value={row.determinedBy}
          size="xsmall"
          absentLabel="Not determined"
        />
      ),
    }),
    c.text("family", { header: "Control family", width: 260, priority: 5 }),
    c.number("requirements", { header: "Requirements", width: 130, priority: 3 }),
    c.number("evidenced", { header: "With evidence", width: 130, priority: 4 }),
  ]);

/**
 * The baseline's controls as a register: each with where the program stands on it and whose
 * determination that is, the family it belongs to, the requirements that map it and how many of
 * them cite evidence. Its question lives in the address, so a count that links here opens what it
 * counts.
 */
function ControlStatusList({
  programId,
  status,
}: {
  programId: string;
  status: ProgramControlStatus;
}) {
  const rows = useMemo<ControlRow[]>(
    () =>
      status.controls.map((control) => ({
        ...control,
        name: `${control.code} ${control.title}`,
        family: familyName(control.family, control.familyTitle),
      })),
    [status.controls],
  );
  const columns = useMemo(() => listColumns(programId), [programId]);
  const table = useCollectionTable({
    columns,
    data: rows,
    getRowId: (row) => row.id,
    label: "Controls in the control baseline",
    view: registerViews.controlStatus,
  });
  const openRecord = useOpenRecord();
  return (
    <ProductCollection
      table={table}
      fill
      onRowClick={(row) => openRecord("controls", { id: row.id, program_id: programId })}
      searchLabel="Find controls"
      filters={
        <>
          <DataTable.Filter table={table} column="status" />
          <DataTable.Filter table={table} column="determinedBy" />
          <DataTable.Filter table={table} column="family" />
        </>
      }
      empty={{
        title: "No controls to show",
        description: "The control baseline selects no control.",
      }}
    />
  );
}

/**
 * One control family as a card: its name, which opens the family's controls in the List, how many
 * of its controls an assessor found satisfied and how many cite evidence, over a mark a control in
 * its status. A mark opens its control.
 */
function FamilyCard({ programId, family }: { programId: string; family: ControlStatusFamily }) {
  const { formatNumber } = useLedgerLocale();
  const openRecord = useOpenRecord();
  const name = familyName(family.code, family.title);
  // The family's controls in the catalog's order, each enhancement after its control.
  const controls = useMemo(
    () => ({
      controls: family.controls.flatMap(({ enhancements, ...control }) => [
        control,
        ...enhancements,
      ]),
    }),
    [family.controls],
  );
  // A control cites evidence when one of its requirements does. A determination needs none: the
  // product's assessment, or an assessor, may have decided a control no requirement maps.
  const evidenced = controls.controls.filter((control) => control.evidenced > 0).length;
  const open = useCallback(
    (controlId: string) => openRecord("controls", { id: controlId, program_id: programId }),
    [openRecord, programId],
  );
  return (
    <Card size="small">
      <CardHeader>
        <CardTitle render={<h3 />}>
          <TextLink
            tone="neutral"
            render={
              <Link
                to="/programs/$programId/control-status"
                params={{ programId }}
                search={controlStatusListSearch({ family: name })}
              />
            }
          >
            {name}
          </TextLink>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Stack space="space.100">
          <Inline space="space.150" spread="space-between" shouldWrap>
            <Text size="small" color="color.text.subtle" numeric>
              {formatNumber(family.counts.satisfied)} / {formatNumber(family.total)} satisfied
            </Text>
            <Text size="small" color="color.text.subtle" numeric>
              {formatNumber(evidenced)} with evidence
            </Text>
          </Inline>
          <ControlStatusMap
            status={controls}
            layout="strip"
            label={`Controls of ${name}, each coloured by where the program stands on it`}
            onSelect={open}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}

/**
 * The program's focused Control status view: where the program stands on every control of its
 * control baseline. Families draws one card a control family, a mark a control; List is the same
 * controls as a register, asked by status or by family. The key above the families counts each
 * status and opens the List at it. One read answers both, `program_control_status`.
 */
export function ProgramControlStatusView({ programId }: { programId: string }) {
  const { formatNumber } = useLedgerLocale();
  const status = useProgramControlStatus(programId);
  // How the controls are shown, read from the address the page is drawn on, as the List's question
  // is (ProductCollection): a link that asks for the List and its question in one step mounts the
  // List once the address holds both, so the List never opens on the question it asked before.
  const show = useRouterState({
    select: (state): ControlStatusShow =>
      (state.resolvedLocation ?? state.location).search["show" as never] === "list"
        ? "list"
        : "families",
  });
  const navigate = statusRoute.useNavigate();
  const families = useMemo(
    () => controlStatusFamilies(status.data?.controls ?? []),
    [status.data?.controls],
  );
  const link = useMemo(() => controlStatusLink(programId), [programId]);
  const data = status.data;
  return (
    <QueryState queries={[status]}>
      {!data ? null : !data.baseline ? (
        <EmptyMessage
          illustration="document"
          title="No control baseline recorded"
          description="A program made outside the setup flow records no catalog or baseline choice, so there is no control to stand on."
        />
      ) : (
        <Stack space="space.200" className="min-w-0">
          <Inline space="space.150" alignBlock="center" spread="space-between" shouldWrap>
            <Heading as="h2" size="section">
              {formatNumber(data.total)} controls,{" "}
              {formatNumber(controlStatusShare(data, "satisfied"))}% satisfied
            </Heading>
            <ToggleGroup
              size="small"
              spacing={0}
              variant="outline"
              aria-label="Show as"
              value={[show]}
              onValueChange={(value) => {
                const next = value[0] as ControlStatusShow | undefined;
                if (!next || next === show) return;
                void navigate({
                  search: (current) => ({ ...current, show: next === "list" ? "list" : undefined }),
                  resetScroll: false,
                });
              }}
            >
              {shows.map((item) => (
                <ToggleGroupItem key={item.value} value={item.value}>
                  {item.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Inline>
          {show === "list" ? (
            <ControlStatusList programId={programId} status={data} />
          ) : (
            <Stack space="space.150" className="min-w-0">
              <ControlStatusKey counts={data.counts} link={link} />
              <Grid
                templateColumns="repeat(auto-fill, minmax(min(100%, 320px), 1fr))"
                gap="space.200"
              >
                {families.map((family) => (
                  <FamilyCard key={family.code} programId={programId} family={family} />
                ))}
              </Grid>
            </Stack>
          )}
        </Stack>
      )}
    </QueryState>
  );
}
