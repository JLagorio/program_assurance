import { createFileRoute } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { useRecordTitle } from "@/components/app/browser-title";
import { useRow } from "@/lib/models";
import { POSTURE_READINGS, type PostureReading } from "@/lib/program-posture";
import { ProgramWorkspace } from "@/components/prototype/program-workspace";
export const Route = createFileRoute("/programs/$programId_/posture")({
  // What the grid counts and what its columns are live in the address, so a reload, Back and a
  // shared link keep them. An address that names no columns shows the control families, and one
  // that names the techniques shows the program's chosen ones unless it asks for all. Every key is
  // answered, also with nothing: the router lays this answer over the address as it was typed, so
  // a value left unanswered would reach the screen as written. The grid counted requirements
  // before it counted objectives, so an address saved then (`reading=requirements`) opens the
  // reading that took its place.
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    reading?: PostureReading | undefined;
    columns?: "techniques" | undefined;
    techniques?: "all" | undefined;
  } => {
    const asked = search["reading"] === "requirements" ? "objectives" : search["reading"];
    const reading = POSTURE_READINGS.find((name) => name === asked);
    const byTechnique = search["columns"] === "techniques";
    return {
      reading: reading && reading !== "issues" ? reading : undefined,
      columns: byTechnique ? "techniques" : undefined,
      techniques: byTechnique && search["techniques"] === "all" ? "all" : undefined,
    };
  },
  head: () => ({ meta: [{ title: "Program — Program Assurance" }] }),
  pendingComponent: RecordPending,
  component: ProgramView,
});
function ProgramView() {
  const { programId } = Route.useParams();
  const { reading } = Route.useSearch();
  const navigate = Route.useNavigate();
  const record = useRow("programs", programId);
  useRecordTitle("Program", record.data?.name);
  return (
    <ProgramWorkspace
      programId={programId}
      tab="Controls"
      view="Posture"
      postureReading={reading}
      onPostureReading={(next) =>
        void navigate({
          search: (current) => ({ ...current, reading: next === "issues" ? undefined : next }),
          resetScroll: false,
        })
      }
    />
  );
}
