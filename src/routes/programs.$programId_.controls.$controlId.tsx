import { createFileRoute } from "@tanstack/react-router";
import { Page, RecordPending } from "@/components/app/shell";
import { useRecordTitle } from "@/components/app/browser-title";
import { useRow } from "@/lib/models";
import { isControlTab } from "@/lib/control-record";
import { controlName } from "@/lib/product-records";
import { ProgramControl } from "@/components/prototype/control-record";
import { QueryState } from "@/components/prototype/work-common";

export const Route = createFileRoute("/programs/$programId_/controls/$controlId")({
  // The address keeps the tab, so a reload, Back and a shared link open the same one; an address
  // that names none opens Implementation.
  validateSearch: (search: Record<string, unknown>): { tab?: string | undefined } =>
    typeof search["tab"] === "string" ? { tab: search["tab"] } : {},
  head: () => ({ meta: [{ title: "Program control — Program Assurance" }] }),
  pendingComponent: RecordPending,
  component: ProgramRecord,
});

function ProgramRecord() {
  const { programId, controlId } = Route.useParams();
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  // The address names a catalog control read inside the program, or a control the program has
  // implemented, by its implementation: the page is the control's either way, resolved to its
  // catalog control before it is drawn.
  const implementation = useRow("implemented_requirements", controlId);
  const selected = useRow("selected_controls", implementation.data?.selected_control_id);
  const catalogId = implementation.data === null ? controlId : selected.data?.control_id;
  const control = useRow("controls", catalogId);
  useRecordTitle("Program control", control.data ? controlName(control.data) : null);
  if (implementation.data === undefined || (implementation.data && selected.data === undefined))
    return (
      <Page>
        <QueryState queries={[implementation, selected]} shape="record" region>
          {null}
        </QueryState>
      </Page>
    );
  return (
    <ProgramControl
      programId={programId}
      controlId={catalogId ?? controlId}
      implementationId={implementation.data?.id}
      tab={isControlTab(tab) ? tab : "Implementation"}
      onTab={(next) => void navigate({ search: (previous) => ({ ...previous, tab: next }) })}
    />
  );
}
