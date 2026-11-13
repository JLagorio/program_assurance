import { useConfirmation } from "@/components/app/confirmation";
import { Page } from "@/components/app/shell";
import { StatusBadge } from "@/components/app/status";
import { useWorkspace } from "@/components/app/workspace";
import { useCollectionTable } from "@/components/prototype/collection-question";
import { canAuthorLibrary } from "@/components/prototype/library-utils";
import { OverlayDialog } from "@/components/prototype/overlay-dialog";
import { ProductCollection } from "@/components/prototype/product-collection";
import {
  RecordLink,
  useDisplayedRecords,
  useRemovalFocus,
} from "@/components/prototype/record-preview";
import { RecordSummaryPreview } from "@/components/prototype/record-summary-preview";
import { useDeleteControlOverlay } from "@/lib/control-overlays";
import { useRows, type Row } from "@/lib/models";
import { overlayDecisionActions, revisionStates } from "@/lib/status";
import {
  Button,
  DataTable,
  DateTime,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconButton,
  Id,
  PageHeader,
  Prose,
  defineColumns,
  toast,
  useLedgerLocale,
} from "@ledger/design-system";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MoreHorizontal, Plus } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/overlays/")({
  head: () => ({ meta: [{ title: "Overlays — Program Assurance" }] }),
  component: OverlaysIndex,
});

/** What the register shows of an overlay: its identity, its state and what Postgres counts for it. */
type OverlayRow = Pick<
  Row<"control_overlay_rows">,
  | "id"
  | "code"
  | "title"
  | "description"
  | "state"
  | "revision"
  | "include_count"
  | "exclude_count"
  | "application_count"
  | "parameter_count"
  | "updated_at"
>;

const columns = defineColumns<OverlayRow>((c) => [
  c.id("code", { header: "Code", width: 150, priority: 1 }),
  c.text("title", {
    header: "Overlay",
    hideable: false,
    priority: 0,
    width: 260,
    minWidth: 200,
    cell: (row) => (
      <RecordLink table="control_overlay_rows" record={row}>
        {row.title}
      </RecordLink>
    ),
  }),
  c.status("state", { header: "State", width: 125, priority: 2, statuses: revisionStates }),
  c.number("include_count", {
    header: overlayDecisionActions.include.label,
    width: 100,
    priority: 3,
  }),
  c.number("exclude_count", {
    header: overlayDecisionActions.exclude.label,
    width: 110,
    priority: 3,
  }),
  // How many parameters it sets values for.
  c.number("parameter_count", { header: "Parameters", width: 120, priority: 4 }),
  // How many baselines apply the overlay.
  c.number("application_count", { header: "Applied", width: 110, priority: 4 }),
  c.date("updated_at", { header: "Updated", priority: 5 }),
]);

function OverlaysIndex() {
  const navigate = useNavigate();
  const workspace = useWorkspace();
  const { formatNumber } = useLedgerLocale();
  // A workspace's overlays are a small collection: each one's decisions are counted by Postgres.
  const overlays = useRows("control_overlay_rows", undefined, {
    columns: [
      "id",
      "code",
      "title",
      "description",
      "state",
      "revision",
      "include_count",
      "exclude_count",
      "application_count",
      "parameter_count",
      "updated_at",
    ],
  });
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<OverlayRow | null>(null);
  const table = useCollectionTable<OverlayRow>({
    preview: useMemo(
      () => ({ onPreview: setSelected, activeId: selected?.id ?? null }),
      [selected?.id],
    ),
    data: overlays.data ?? NO_OVERLAYS,
    columns,
    getRowId: (row) => row.id,
    label: "Overlays",
    view: "overlays",
    resizable: true,
    reorderable: true,
    initialState: { sorting: [{ id: "code", desc: false }] },
  });
  const displayed = useDisplayedRecords(table);
  const canCreate = canAuthorLibrary(workspace.role);
  const remove = useDeleteControlOverlay();
  const { confirm, confirmation } = useConfirmation();
  // A deleted overlay takes its row and the preview that asked; focus comes to Create overlay.
  const focus = useRemovalFocus(overlays.data ?? NO_OVERLAYS);
  /** Delete overlay, from the preview of a draft: it asks first, and says a failure in the prompt. */
  async function deleteOverlay(row: OverlayRow) {
    const total = row.include_count + row.exclude_count;
    const held = [
      ...(total
        ? [`${formatNumber(total)} control ${total === 1 ? "decision" : "decisions"}`]
        : []),
      ...(row.parameter_count
        ? [
            `${formatNumber(row.parameter_count)} parameter ${row.parameter_count === 1 ? "value" : "values"}`,
          ]
        : []),
    ].join(" and ");
    const deleted = await confirm({
      title: "Delete overlay?",
      description: `${row.title}${held ? ` and its ${held}` : ""} will be deleted. A deleted overlay cannot be restored.`,
      confirmLabel: "Delete overlay",
      variant: "danger",
      failureTitle: "The overlay was not deleted",
      action: async () => {
        focus.removed(row.id);
        await remove.mutateAsync({ overlayId: row.id, expectedRevision: row.revision });
      },
    });
    if (!deleted) return;
    setSelected((current) => (current?.id === row.id ? null : current));
    toast.add({
      type: "success",
      title: "Overlay deleted",
      description: `${row.code} is no longer in the library.`,
    });
  }
  const create = canCreate ? (
    <Button
      ref={(node: HTMLButtonElement | null) => {
        focus.target.current = node;
      }}
      size="small"
      variant="primary"
      iconBefore={<Plus />}
      onClick={() => {
        // The trigger stays enabled while its dialog is open; a second press opens nothing new.
        if (!creating) setCreating(true);
      }}
    >
      Create overlay
    </Button>
  ) : undefined;
  return (
    <Page>
      <PageHeader>
        <PageHeader.Heading>
          <PageHeader.Title>Overlays</PageHeader.Title>
        </PageHeader.Heading>
      </PageHeader>
      {creating && (
        <OverlayDialog
          onClose={() => setCreating(false)}
          onSaved={(saved) =>
            navigate({ to: "/overlays/$overlayId", params: { overlayId: saved.id } })
          }
        />
      )}
      <ProductCollection
        table={table}
        queries={[overlays]}
        fill
        noun={{ one: "overlay", other: "overlays" }}
        onRowClick={(row) => {
          void navigate({ to: "/overlays/$overlayId", params: { overlayId: row.id } });
        }}
        empty={{
          illustration: "shield",
          title: "No overlays yet",
          description:
            "An overlay is a reusable set of control decisions a program stacks on a baseline.",
          action: create,
        }}
        filters={<DataTable.Filter table={table} column="state" />}
        action={create}
      />
      {/* What the register says of an overlay, at a glance. Its decisions, its edit and Publish are
          the record's, which the preview's header opens. */}
      {selected && (
        <RecordSummaryPreview
          model="control_overlays"
          readOnly
          fields={[
            {
              key: "state",
              label: "State",
              render: (row) => <StatusBadge statuses={revisionStates} value={row.state} />,
            },
            { key: "code", label: "Code", render: (row) => <Id>{row.code}</Id> },
            {
              key: "include_count",
              label: overlayDecisionActions.include.label,
              render: (row) => formatNumber(row.include_count),
            },
            {
              key: "exclude_count",
              label: overlayDecisionActions.exclude.label,
              render: (row) => formatNumber(row.exclude_count),
            },
            {
              key: "parameter_count",
              label: "Parameters",
              render: (row) => formatNumber(row.parameter_count),
            },
            {
              key: "application_count",
              label: "Applied",
              render: (row) => formatNumber(row.application_count),
            },
            {
              key: "updated_at",
              label: "Updated",
              render: (row) => <DateTime value={row.updated_at} format="date" />,
            },
          ]}
          record={selected}
          rows={displayed}
          onSelect={setSelected}
          onClose={() => setSelected(null)}
          // A draft can be deleted from here; everything else about it is the record's.
          recordActions={
            canCreate && selected.state === "draft" ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <IconButton
                      size="small"
                      variant="subtle"
                      label="Overlay actions"
                      icon={<MoreHorizontal />}
                    />
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem variant="danger" onClick={() => void deleteOverlay(selected)}>
                    Delete overlay
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : undefined
          }
        >
          {selected.description ? <Prose label="Description">{selected.description}</Prose> : null}
        </RecordSummaryPreview>
      )}
      {confirmation}
    </Page>
  );
}

const NO_OVERLAYS: OverlayRow[] = [];
