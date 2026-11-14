import { useMemo, type ReactElement, type ReactNode } from "react";
import {
  Absent,
  KeyValue,
  Stack,
  Tally,
  Text,
  TileMap,
  TileMapKey,
  useLedgerLocale,
  type TallySegment,
  type TileMapGroup,
  type TileMapKeyItem,
  type TileMapLayout,
  type TileMapMark,
} from "@ledger/design-system";
import { StatusBadge } from "@/components/app/status";
import { useWorkspace } from "@/components/app/workspace";
import type { AssuranceTrace } from "@/lib/assurance-trace";
import { useControlAssessment } from "@/lib/control-assessment";
import { useProgramControlObjectives } from "@/lib/control-objectives";
import {
  CONTROL_STATUS_ORDER,
  controlStatusFamilies,
  useProgramControlStatus,
  type ControlStanding,
  type ControlStatus,
  type ControlStatusCounts,
  type ProgramControlStatus,
} from "@/lib/control-status";
import { controlNextStep } from "@/lib/next-steps";
import { objectiveWords, objectivesOf } from "@/lib/product-records";
import { controlDeterminers, controlStatuses } from "@/lib/status";
import { QueryValue } from "./library-shared";
import { NextStep, StepSurfaceHost } from "./next-step";
import { RecordLink } from "./record-preview";
import { ReportFailures } from "./work-common";

/**
 * How each status is drawn, once: the map's marks and its key read the same entry. An assessor's
 * determinations are the three bold tones, and the only bold colours on the map; evidence waiting
 * on one is a pale step of the one-hue scale, so a baseline nobody has assessed reads quiet; a
 * control with no evidence is hollow, not there yet; one no requirement maps says nothing.
 */
const marks = {
  satisfied: { tone: "success", fill: "solid" },
  partially_satisfied: { tone: "warning", fill: "solid" },
  other_than_satisfied: { tone: "danger", fill: "solid" },
  not_assessed: { tone: "sequential.2", fill: "solid" },
  no_evidence: { tone: "neutral", fill: "outline" },
  no_requirement: { tone: "neutral", fill: "empty" },
} as const satisfies Record<ControlStatus, Pick<TileMapMark, "tone" | "fill">>;

/** The key's order: what an assessor decided first, then what waits. */
const KEY_ORDER = [...CONTROL_STATUS_ORDER].reverse();

/**
 * How much of a control's assessment objectives the program's requirements cover, in a mark's
 * words, where it is part of the story: some mapped and not all, or every one mapped and some
 * without evidence. A control whose objectives are all or none of either says it with its status.
 */
function objectiveStanding(
  control: Pick<ControlStanding, "objectives" | "objectivesMapped" | "objectivesEvidenced">,
  format: (value: number) => string,
): string | undefined {
  const { objectives, objectivesMapped, objectivesEvidenced } = control;
  if (objectivesMapped > 0 && objectivesMapped < objectives)
    return `${objectivesOf(format(objectivesMapped), format(objectives))} objectives mapped`;
  if (
    objectivesMapped === objectives &&
    objectivesEvidenced > 0 &&
    objectivesEvidenced < objectives
  )
    return `${objectivesOf(format(objectivesEvidenced), format(objectives))} objectives with evidence`;
  return undefined;
}

/**
 * A count of a control's assessment objectives out of all it counts, as a cell says it: "12 of 26",
 * in the reader's numbers. A control the catalog gives no objective says so. The Control status
 * List, a risk's Countering controls and the catalog control's table of programs draw it.
 */
export function ObjectiveCount({ count, objectives }: { count: number; objectives: number }) {
  const { formatNumber } = useLedgerLocale();
  return objectives > 0 ? (
    objectivesOf(formatNumber(count), formatNumber(objectives))
  ) : (
    <Absent label="No assessment objectives" />
  );
}

/** A link element a key line or a card's title takes: the part gives it its words. */
type LinkElement = ReactElement<{ className?: string | undefined; children?: ReactNode }>;

/**
 * What each mark of a control status map means, with how many controls stand there. Satisfied is
 * always said, so the reader sees what done looks like; another status is said once a control
 * stands at it. With `link`, a status that counts controls opens them: the program's Control
 * status list asked for that status.
 */
export function ControlStatusKey({
  counts,
  link,
  label = "Control statuses",
}: {
  counts: ControlStatusCounts;
  /** The link that lists the controls at a status. A status that counts none stays text. */
  link?: ((status: ControlStatus) => LinkElement) | undefined;
  /** The key's name. */
  label?: string | undefined;
}) {
  const { formatNumber } = useLedgerLocale();
  const items = KEY_ORDER.filter((status) => status === "satisfied" || counts[status] > 0).map(
    (status): TileMapKeyItem => ({
      label: controlStatuses[status].label,
      value: formatNumber(counts[status]),
      ...marks[status],
      ...(link && counts[status] > 0 ? { link: link(status) } : {}),
    }),
  );
  return <TileMapKey aria-label={label} items={items} />;
}

/**
 * A program's control baseline as one bar: each status its share of the baseline, in the key's
 * order and the map's marks, so the key that explains the map explains the bar. For a table cell
 * beside the number it stands for; the bar is named, and says each status with its count.
 */
export function ControlStatusTally({
  status,
  label,
}: {
  status: Pick<ProgramControlStatus, "total" | "counts">;
  /** The bar's name: whose baseline it is. */
  label: string;
}) {
  const { formatNumber } = useLedgerLocale();
  const segments = KEY_ORDER.map((key): TallySegment => ({
    key,
    value: status.counts[key],
    label: `${formatNumber(status.counts[key])} ${controlStatuses[key].label.toLowerCase()}`,
    ...marks[key],
  }));
  return <Tally segments={segments} total={status.total} size="large" label={label} />;
}

/**
 * Every control of a program's control baseline as one mark, coloured by where the program stands
 * on it: `grid` is a row a family, `strip` the whole baseline in one run for a card. A mark says
 * its control, its status, whose determination that is and what the program holds for it, in
 * words. Give the same controls as a table one step away: the List of the program's Control status
 * view.
 */
export function ControlStatusMap({
  status,
  layout = "grid",
  label,
  onSelect,
}: {
  status: Pick<ProgramControlStatus, "controls">;
  layout?: TileMapLayout | undefined;
  /** The map's name: whose baseline it is. */
  label: string;
  /** Makes each mark a button that opens its control: called with the control's id. */
  onSelect?: ((controlId: string) => void) | undefined;
}) {
  const { formatNumber } = useLedgerLocale();
  const groups = useMemo(() => {
    const mark = (control: ControlStanding): TileMapMark => {
      const objectives = objectiveStanding(control, formatNumber);
      return {
        id: control.id,
        label: `${control.code} ${control.title}`,
        description: `${controlStatuses[control.status].label}${
          control.determinedBy ? ` · ${controlDeterminers[control.determinedBy].label}` : ""
        } · ${formatNumber(control.requirements)} ${
          control.requirements === 1 ? "requirement" : "requirements"
        }, ${formatNumber(control.evidenced)} with evidence${objectives ? `, ${objectives}` : ""}`,
        ...marks[control.status],
      };
    };
    return controlStatusFamilies(status.controls).map((family): TileMapGroup => ({
      id: family.code,
      label: family.code,
      title: family.title ?? "Unnamed family",
      value: formatNumber(family.total),
      marks: family.controls.map((control) => ({
        ...mark(control),
        parts: control.enhancements.map(mark),
      })),
    }));
  }, [status.controls, formatNumber]);
  const choose = useMemo(
    () => (onSelect ? (mark: TileMapMark) => onSelect(mark.id) : undefined),
    [onSelect],
  );
  return <TileMap label={label} layout={layout} groups={groups} onSelect={choose} />;
}

/**
 * Where a program stands on one control, as the first rows of the control's Details: its control
 * status, how many of its assessment objectives the program's requirements map and how many with
 * evidence ("12 of 26"), whose determination it is (the program's assessment, or each product
 * assessment the program's variants inherit it from, a link to its record), and the next step that
 * moves it up the ladder: a link to where the step is done, or, for a step done on the control
 * itself, the button that opens it over the page (Map a requirement, or Map 14 more
 * objectives for a control mapped in part; Add to assessment campaign, Plan an assessment), which a
 * viewer reads as words alone. The status comes from the read the program's Overview and its
 * Control status view share, so the page opens on what the reader came from. `requirements` are
 * the requirements that map the control, as its trace reads them: the step names the first that
 * cites no evidence, and where some objectives are evidenced already, the first that covers one
 * that is not, which the control's objectives say. Evidence no assessor has determined waits on
 * what the program's open campaigns hold of the control, which decides the step.
 */
export function ControlStandingFacts({
  programId,
  controlId,
  requirements,
}: {
  programId: string;
  /** The catalog control; none while the record that names it loads. */
  controlId: string | undefined;
  requirements?: AssuranceTrace["requirements"] | undefined;
}) {
  const workspace = useWorkspace();
  const { formatNumber } = useLedgerLocale();
  const statuses = useProgramControlStatus(programId);
  const standing = controlId
    ? statuses.data?.controls.find((control) => control.id === controlId)
    : undefined;
  const waiting = standing?.status === "not_assessed";
  const assessment = useControlAssessment(programId, controlId, { enabled: waiting });
  // Evidence that covers some objectives and not others: the step names a requirement that
  // covers one without, which only the control's objectives say.
  const owing =
    standing?.status === "no_evidence" &&
    standing.objectivesEvidenced > 0 &&
    standing.objectivesEvidenced < standing.objectives;
  const objectives = useProgramControlObjectives(programId, controlId, { enabled: owing });
  const step = standing
    ? controlNextStep(standing, requirements, assessment.data, objectives.data?.objectives)
    : null;
  const stepQueries = waiting ? assessment.queries : owing ? [objectives] : [];
  const nextStep = step && standing && (
    <NextStep
      step={step}
      programId={programId}
      control={{ id: standing.id, code: standing.code, title: standing.title }}
      canWrite={workspace.role !== "viewer"}
    />
  );
  // The Details hold what a step opens, so it stays open while the step under it changes.
  return (
    <StepSurfaceHost>
      <ReportFailures queries={[statuses, ...stepQueries]} />
      <KeyValue label="Control status">
        <QueryValue queries={[statuses]}>
          {() =>
            standing ? (
              <StatusBadge statuses={controlStatuses} value={standing.status} />
            ) : (
              <Absent label="Not in the control baseline" />
            )
          }
        </QueryValue>
      </KeyValue>
      {standing && standing.objectives > 0 && (
        <>
          <KeyValue label={objectiveWords.mapped}>
            <Text numeric>
              {objectivesOf(
                formatNumber(standing.objectivesMapped),
                formatNumber(standing.objectives),
              )}
            </Text>
          </KeyValue>
          <KeyValue label={objectiveWords.evidenced}>
            <Text numeric>
              {objectivesOf(
                formatNumber(standing.objectivesEvidenced),
                formatNumber(standing.objectives),
              )}
            </Text>
          </KeyValue>
        </>
      )}
      {standing?.determinedBy && (
        <KeyValue label="Determined by" wrap>
          {standing.determinedBy === "product" && standing.productAssessments.length > 0 ? (
            <Stack space="space.050" alignInline="start">
              {standing.productAssessments.map((assessment) => (
                <RecordLink
                  key={assessment.id}
                  table="product_assessments"
                  record={{ id: assessment.id }}
                >
                  {assessment.title}
                </RecordLink>
              ))}
            </Stack>
          ) : (
            controlDeterminers[standing.determinedBy].label
          )}
        </KeyValue>
      )}
      {step && (
        <KeyValue label="Next step" wrap>
          {stepQueries.length ? (
            <QueryValue queries={stepQueries}>{() => nextStep}</QueryValue>
          ) : (
            nextStep
          )}
        </KeyValue>
      )}
    </StepSurfaceHost>
  );
}
