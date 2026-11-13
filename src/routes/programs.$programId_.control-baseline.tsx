import { createFileRoute } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { useRecordTitle } from "@/components/app/browser-title";
import { layersOffParam } from "@/lib/baseline-stack";
import { techniqueParam } from "@/lib/control-resiliency";
import { useRow } from "@/lib/models";
import { ProgramWorkspace } from "@/components/prototype/program-workspace";

/** What the Control baseline view's address keeps (ProgramControlBaseline reads it there). */
export type ControlBaselineSearch = {
  /** The resiliency technique the baseline is read by, by its code after `technique.`; none is all controls. */
  technique?: string | undefined;
  /** How many layers of the stack are applied: 0 is the reference baseline alone, none is all of them. */
  layer?: number | undefined;
  /** How the catalog at that step is shown: none is the Grid. */
  show?: "skyline" | "list" | undefined;
  /**
   * The layers switched off for a what-if, by the start of each one's key (`layerParamKey`),
   * comma-separated; none is the saved baseline. Nothing is saved: it is a reading of the stack.
   */
  off?: string | undefined;
};

export const Route = createFileRoute("/programs/$programId_/control-baseline")({
  // The resiliency technique, the step and how it is shown live in the address, so a reload, Back
  // and a shared link keep them. An address that names no step shows the last layer, the
  // program's baseline, and one that names no take the Grid. Every key is answered, also with
  // nothing: the router lays this answer over the address as it was typed, so a value left
  // unanswered would reach the screen as written.
  validateSearch: (search: Record<string, unknown>): ControlBaselineSearch => {
    const layer = search["layer"];
    const show = search["show"];
    return {
      technique: techniqueParam(search["technique"]),
      layer: typeof layer === "number" && Number.isInteger(layer) && layer >= 0 ? layer : undefined,
      show: show === "skyline" || show === "list" ? show : undefined,
      off: layersOffParam(search["off"]),
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
  return <ProgramWorkspace programId={programId} tab="Controls" view="Control baseline" />;
}
