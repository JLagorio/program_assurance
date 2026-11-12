import { useMemo, useState } from "react";
import {
  Absent,
  Badge,
  Button,
  DataTable,
  PickerSheet,
  defineColumns,
  toast,
  useLedgerLocale,
} from "@ledger/design-system";
import { causeText } from "@/components/app/sentence";
import { useDraftGuard } from "@/components/app/use-draft-guard";
import { LIFE_CYCLE_FRAMEWORK, useFrameworkItems } from "@/lib/frameworks";
import {
  GATE_OUTCOMES_REQUEST_REUSED,
  choiceRequests,
  securityOutcomes,
  useAddGateSecurityOutcomes,
  type GateCriterionSources,
  type SecurityOutcome,
} from "@/lib/gate-criteria";
import type { DataRecord } from "@/lib/records";
import { useCollectionTable } from "./collection-question";
import { QueryState, type QueryStatus } from "./work-common";

/**
 * A Gate criteria row's Source: the life cycle process the criterion was drawn from ("System
 * Requirements Definition"), and nothing for a criterion somebody wrote. `sources` is the gate's
 * read (`useGateCriterionSources`), which the collection waits on with its rows.
 */
export function CriterionSource({
  criterion,
  sources,
}: {
  criterion: DataRecord;
  sources: GateCriterionSources | undefined;
}) {
  const process = sources?.byCriterion.get(criterion.id)?.process;
  if (process) return process;
  // Drawn from an outcome whose process the reader cannot read; a written criterion has none.
  return criterion["outcome_item_id"] ? <Absent label="Not available" /> : <Absent />;
}

/** The control that opened the picker, read as it first renders, so focus can go back there. */
function currentOpener(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || active === document.body) return null;
  // A menu item goes with its menu: the menu's trigger is the control that stays.
  if (active.closest('[role="menu"]'))
    return document.querySelector<HTMLElement>('[aria-haspopup="menu"][aria-expanded="true"]');
  return active;
}

/**
 * The first criteria replace the collection's empty state, and with it the create menu that
 * opened the picker. Once the closing sheet has let go of focus and it has nowhere to be, it goes
 * to the same menu in the collection's toolbar.
 */
function focusCreateMenuWhenLost(collection: Element | null) {
  if (!collection) return;
  let tries = 0;
  const settle = () => {
    const active = document.activeElement;
    if (!active || active === document.body) {
      const menu = collection.querySelector<HTMLElement>(
        '[data-slot="button-group"] button[aria-haspopup="menu"]',
      );
      menu?.focus();
      if (menu && document.activeElement === menu) return;
    }
    if (tries++ < 120) requestAnimationFrame(settle);
  };
  requestAnimationFrame(settle);
}

const SECURITY_OUTCOMES = { one: "{count} security outcome", other: "{count} security outcomes" };

/**
 * Add security outcomes: choose outcomes of the system life cycle processes (NIST SP 800-160
 * Vol. 1) to add to one gate as its criteria. Every chosen outcome is added in one request, so all
 * are added or none, and adding the same choice again after a failure adds nothing twice. An
 * outcome the gate already holds is marked and cannot be chosen again.
 */
export function AddSecurityOutcomes({
  gate,
  sources,
  onClose,
}: {
  gate: DataRecord;
  /** What the gate's criteria were drawn from: the outcomes it already holds are marked. */
  sources: QueryStatus & { data?: GateCriterionSources | undefined };
  onClose: () => void;
}) {
  const { t, formatNumber, formatPlural } = useLedgerLocale();
  const [opener] = useState(currentOpener);
  // Every item of the framework, a few hundred rows: the outcomes, and the processes and groups
  // that say where each one comes from.
  const items = useFrameworkItems(LIFE_CYCLE_FRAMEWORK);
  const outcomes = useMemo(() => securityOutcomes(items.data ?? []), [items.data]);
  const onGate = sources.data?.outcomeCodes;
  const add = useAddGateSecurityOutcomes();
  const [error, setError] = useState<string>();
  // An id chosen once for each choice, so adding it again after a lost answer adds nothing more.
  const [requestFor] = useState(() => choiceRequests());
  const columns = useMemo(
    () =>
      defineColumns<SecurityOutcome>((c) => [
        // The sentence is what the reader chooses by, so it stays in the row and reads whole. An
        // outcome has no page, and inside a sheet a name is plain text.
        c.text("title", {
          header: "Security outcome",
          priority: 0,
          minWidth: 240,
          hideable: false,
          wrap: true,
          // Why the row cannot be chosen: the gate already holds the outcome as a criterion.
          badge: (row) =>
            onGate?.has(row.code) ? (
              <Badge size="xsmall" variant="secondary" tone="neutral">
                On this gate
              </Badge>
            ) : null,
        }),
        c.text("process", { header: "Process", width: 240, priority: 1 }),
        c.text("group", { header: "Group", width: 220, priority: 2 }),
      ]),
    [onGate],
  );
  // The whole collection, in the order the publication prints it: the sheet's search and filters
  // narrow the table, so a miss is "Nothing matches". It pages as every collection does.
  const table = useCollectionTable({
    columns,
    data: outcomes,
    getRowId: (row) => row.id,
    selectable: (row) => !onGate?.has(row.code),
    label: "Security outcomes to add",
  });
  const chosen = Object.keys(table.state.rowSelection).filter((id) => table.state.rowSelection[id]);
  const guard = useDraftGuard({
    dirty: chosen.length > 0,
    onClose,
    description: "The security outcomes you chose will be lost.",
  });
  // The header's checkbox chooses the page; once it has, the footer offers every outcome the
  // search and the filters leave that the gate does not hold yet.
  const offered = table.getFilteredRowModel().flatRows.filter((row) => row.getCanSelect()).length;
  const onPage = table.getRowModel().rows.filter((row) => row.getCanSelect()).length;
  const offerRest =
    table.getIsAllPageRowsSelected() && !table.getIsAllRowsSelected() && offered > onPage;
  const gateTitle = typeof gate["title"] === "string" ? gate["title"] : "this gate";
  async function addChosen() {
    if (!guard.start()) return;
    setError(undefined);
    // Opened from the collection's empty state, which the first criteria replace: its section is
    // found while the opener is still drawn.
    const emptied =
      opener && !opener.closest('[data-slot="data-table-toolbar"]')
        ? opener.closest("section")
        : null;
    try {
      // One request for every chosen outcome: all of them become criteria, or none.
      const answer = await add.mutateAsync({
        gateId: gate.id,
        requestId: requestFor(chosen),
        outcomeItemIds: chosen,
      });
      toast.add(
        answer.added > 0
          ? {
              type: "success",
              title: `${formatPlural(answer.added, SECURITY_OUTCOMES)} added to ${gateTitle}`,
              ...(answer.skipped > 0
                ? { description: `${formatNumber(answer.skipped)} already on this gate.` }
                : {}),
            }
          : {
              type: "information",
              title: "No security outcomes added",
              description: `${gateTitle} already holds every outcome you chose.`,
            },
      );
      guard.finish();
      guard.complete();
      if (answer.added > 0) focusCreateMenuWhenLost(emptied);
    } catch (cause) {
      const said = causeText(cause, "The security outcomes could not be added.");
      // One write: a refusal added none of them, and a request sent again adds only what is missing.
      setError(
        said === GATE_OUTCOMES_REQUEST_REUSED
          ? said
          : `${said} Your choice is kept; adding it again will not duplicate a criterion.`,
      );
      guard.finish();
    }
  }
  // Where the rows on offer are: the outcomes, and which of them the gate already holds.
  const reads = [items, sources];
  const failed = reads.some((read) => read.isError && read.data === undefined);
  const loading = reads.some((read) => read.isPending && read.data === undefined);
  const state = failed ? "error" : loading ? "loading" : "ready";
  return (
    <PickerSheet
      open
      onClose={() => void guard.close()}
      title="Add security outcomes"
      subtitle={gateTitle}
      width="xlarge"
      table={table}
      state={state}
      search={{ placeholder: "Find security outcomes" }}
      filters={
        <>
          <DataTable.Filter table={table} column="process" />
          <DataTable.Filter table={table} column="group" />
        </>
      }
      finalFocus={() => (opener?.isConnected ? opener : true)}
      pending={guard.busy}
      error={error}
      secondary={
        offerRest ? (
          <Button variant="secondary" onClick={() => table.toggleAllRowsSelected(true)}>
            {t("selectAllCount", { count: formatNumber(offered) })}
          </Button>
        ) : undefined
      }
      action={{
        label:
          chosen.length > 0
            ? `Add ${formatPlural(chosen.length, SECURITY_OUTCOMES)}`
            : "Add security outcomes",
        onClick: () => void addChosen(),
        disabled: chosen.length === 0,
      }}
    >
      <QueryState queries={reads}>
        <DataTable
          responsive
          table={table}
          empty={{
            illustration: "shield",
            title: "No security outcomes yet",
            description:
              "The life cycle processes of NIST SP 800-160 are loaded into the reference data by a workspace administrator.",
          }}
        />
      </QueryState>
      {guard.confirmation}
    </PickerSheet>
  );
}
