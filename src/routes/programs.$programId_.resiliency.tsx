import { createFileRoute } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { useRecordTitle } from "@/components/app/browser-title";
import { useRow } from "@/lib/models";
import { ProgramWorkspace } from "@/components/prototype/program-workspace";

/** What the Cyber resiliency view's address keeps (ProgramResiliency reads it there). */
export type ResiliencySearch = {
  /** How the ladder is shown: as the ladder itself, or technique by technique, layer by layer. */
  show?: "layers" | undefined;
  /** How many layers of the stack are applied: 0 is the reference baseline alone, none is all. */
  layer?: number | undefined;
  /** Narrows the view to the approaches with nothing behind them. */
  only?: "gaps" | undefined;
  /** Lists the approaches under each technique of the Layers take. */
  rows?: "approaches" | undefined;
};

export const Route = createFileRoute("/programs/$programId_/resiliency")({
  // The take, the layer the baseline is read at and what the view is narrowed to live in the
  // address, so a reload, Back and a shared link keep them. An address that names no take shows
  // the ladder, and one that names no layer the program's whole baseline. Every key is answered,
  // also with nothing: the router lays this answer over the address as it was typed, so a value
  // left unanswered would reach the screen as written.
  validateSearch: (search: Record<string, unknown>): ResiliencySearch => {
    const layer = search["layer"];
    return {
      show: search["show"] === "layers" ? "layers" : undefined,
      layer: typeof layer === "number" && Number.isInteger(layer) && layer >= 0 ? layer : undefined,
      only: search["only"] === "gaps" ? "gaps" : undefined,
      rows: search["rows"] === "approaches" ? "approaches" : undefined,
    };
  },
  head: () => ({ meta: [{ title: "Program — Program Assurance" }] }),
  pendingComponent: RecordPending,
  component: ProgramView,
});
function ProgramView() {
  const { programId } = Route.useParams();
  const record = useRow("programs", programId);
  useRecordTitle("Program", record.data?.name);
  return <ProgramWorkspace programId={programId} tab="Controls" view="Cyber resiliency" />;
}
