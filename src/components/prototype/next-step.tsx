import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button, Text, TextLink } from "@ledger/design-system";
import { AssessmentSurface } from "./assessment-step";
import { questionSearch } from "./collection-question";
import { MapRequirementSurface, type StepControl } from "./map-requirement";
import { stepSlot } from "./step-focus";
import {
  isInPlaceStep,
  nextStepLabel,
  type ControlNextStep,
  type TraceGapFix,
} from "@/lib/next-steps";
import { registerViews } from "@/lib/register-views";
import { determinations } from "@/lib/status";

/** What an in-place step asked to open: the step, the control and the row it was opened from. */
type StepSurface = {
  kind: "map_requirement" | "assess" | "plan_assessment";
  programId: string;
  control: StepControl;
  opener: HTMLElement | null;
  slot: HTMLElement | null;
  key: number;
};
const StepSurfaces = createContext<((surface: Omit<StepSurface, "key">) => void) | null>(null);

/**
 * Holds what the in-place steps inside it open: a picker or a form over the page. The Details and
 * the trace each hold their own, since they stay where they are while a step inside changes: a
 * change made from a picker moves the control on, and the picker stays open over the step that
 * replaced its opener until the reader closes it.
 */
export function StepSurfaceHost({ children }: { children: ReactNode }) {
  const [surface, setSurface] = useState<StepSurface | null>(null);
  const open = useCallback(
    (next: Omit<StepSurface, "key">) => setSurface({ ...next, key: Date.now() }),
    [],
  );
  const close = useCallback(() => setSurface(null), []);
  return (
    <StepSurfaces.Provider value={open}>
      {children}
      {surface &&
        (surface.kind === "map_requirement" ? (
          <MapRequirementSurface
            key={surface.key}
            programId={surface.programId}
            control={surface.control}
            opener={surface.opener}
            slot={surface.slot}
            onClose={close}
          />
        ) : (
          <AssessmentSurface
            key={surface.key}
            kind={surface.kind}
            programId={surface.programId}
            control={surface.control}
            opener={surface.opener}
            slot={surface.slot}
            onClose={close}
          />
        ))}
    </StepSurfaces.Provider>
  );
}

/** A step done on the control itself: the link-styled button that opens it over the page. */
function InPlaceStep({
  step,
  programId,
  control,
  size,
}: {
  step: Extract<ControlNextStep | TraceGapFix, { kind: StepSurface["kind"] }>;
  programId: string;
  control: StepControl;
  size: "small" | "medium" | undefined;
}) {
  const open = useContext(StepSurfaces);
  const opener = useRef<HTMLButtonElement>(null);
  return (
    <Button
      ref={opener}
      variant="link"
      {...(size ? { size } : {})}
      onClick={() =>
        open?.({
          kind: step.kind,
          programId,
          control,
          opener: opener.current,
          slot: stepSlot(opener.current),
        })
      }
    >
      {nextStepLabel(step)}
    </Button>
  );
}

/** The determinations an assessor publishes short of satisfied: what Open assessment findings asks. */
const shortOfSatisfied = Object.keys(determinations).filter(
  (determination) =>
    determination === "partially_satisfied" || determination === "other_than_satisfied",
);

/** A step that leads to where it is done: every step but the ones done on the control itself. */
type LinkStep = Exclude<
  ControlNextStep | TraceGapFix,
  { kind: "map_requirement" | "assess" | "plan_assessment" }
>;

/**
 * A next step as the link that leads to where it is done: the requirement's Evidence or Control
 * mappings tab, the assessment campaign whose plan holds the control, the assessment findings an
 * assessor published short of satisfied, the product assessment that found a control the program
 * inherits short of satisfied or decided it, or an operational issue's Link requirement, which its
 * address opens. `programId` is the program the step is read in. A step that names its own page
 * (`own`) says the step alone, without the record's code.
 */
function NextStepLink({
  step,
  programId,
  own = false,
  size,
}: {
  step: LinkStep;
  programId: string;
  /** The step is done on the record the reader is on: its code is left out of the words. */
  own?: boolean | undefined;
  size?: "small" | "medium" | undefined;
}) {
  const label = own && step.kind === "link_evidence" ? "Link evidence" : nextStepLabel(step);
  const link = (() => {
    switch (step.kind) {
      case "link_evidence":
        return step.requirement ? (
          <Link
            to="/programs/$programId/requirements/$requirementId"
            params={{
              programId: step.requirement.programId,
              requirementId: step.requirement.id,
            }}
            search={{ tab: "Evidence" }}
          />
        ) : (
          <Link to="/programs/$programId" params={{ programId }} search={{ tab: "Requirements" }} />
        );
      case "map_control":
        return (
          <Link
            to="/programs/$programId/requirements/$requirementId"
            params={{
              programId: step.requirement.programId,
              requirementId: step.requirement.id,
            }}
            search={{ tab: "Control mappings" }}
          />
        );
      // The campaign's plans, events and objectives are on its Execution tab.
      case "open_campaign":
        return (
          <Link
            to="/campaigns/$campaignId"
            params={{ campaignId: step.campaign.id }}
            search={{ tab: "Execution" }}
          />
        );
      case "review_findings":
        return (
          <Link
            to="/findings"
            search={{
              tab: "findings",
              ...questionSearch(registerViews.assessmentFindings, {
                filters: [{ id: "determination", value: shortOfSatisfied }],
              }),
            }}
          />
        );
      case "review_product_assessment":
      case "decided_by_product":
        return (
          <Link
            to="/library/product-assessments/$assessmentId"
            params={{ assessmentId: step.assessment.id }}
          />
        );
      case "link_requirement":
        // The issue's own page, asked to open its Link requirement: the address is taken back
        // once the browser opens, and the step replaces the entry, so Back leaves the issue.
        return (
          <Link
            to="/issues/$issueId"
            params={{ issueId: step.issue.id }}
            search={{ link: "requirement" }}
            replace
            resetScroll={false}
          />
        );
    }
  })();
  return (
    <TextLink render={link} {...(size ? { size } : {})}>
      {label}
    </TextLink>
  );
}

/**
 * A next step or a trace gap's fix, drawn where it is read. A step that leads elsewhere is a link
 * to where it is done. A step done on the control itself is a link-styled button that opens where
 * it is done over the page, so the reader makes the change without leaving the control: Map a
 * requirement, a picker of the program's requirements; Add to assessment campaign, a picker of its
 * campaigns with a draft plan; Plan an assessment, the form that plans a new campaign around the
 * control. What it opens is held by the nearest `StepSurfaceHost`, or by its own where there is
 * none. For a reader who may not make the change, and while the control is not yet known, such a
 * step is its words alone.
 */
export function NextStep(props: {
  step: ControlNextStep | TraceGapFix;
  programId: string;
  /** The control the record is about, which a step done in place works on. */
  control?: StepControl | undefined;
  /** Whether the reader may make the change a step done in place makes. */
  canWrite: boolean;
  /** The step is done on the record the reader is on: its code is left out of the words. */
  own?: boolean | undefined;
  size?: "small" | "medium" | undefined;
}) {
  const { step, programId, control, canWrite, own = false, size } = props;
  const host = useContext(StepSurfaces);
  if (!isInPlaceStep(step))
    return <NextStepLink step={step} programId={programId} own={own} size={size} />;
  if (!canWrite || !control)
    return <Text {...(size === "small" ? { size: "small" } : {})}>{nextStepLabel(step)}</Text>;
  if (!host)
    return (
      <StepSurfaceHost>
        <NextStep {...props} />
      </StepSurfaceHost>
    );
  return <InPlaceStep step={step} programId={programId} control={control} size={size} />;
}
