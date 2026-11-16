// From the product pattern contract (docs/guides/product-patterns.md), moved here on
// 2026-11-16 when the contract was cut to its rules: what holds for this screen alone, and the
// full wording of rules the contract now states in fewer words.
//
// A control read in a program offers Map a requirement where none maps it, which opens the picker
// of the program's requirements on the control's page (one its requirements map in part, some of
// its objectives or not on every system that selects it, holds them in the stage and offers what is
// left under them, the step its Details' Next step offers: Map 3 more objectives, Map on
// R210-STD-CUSA or Allocate to R210-STD-CUSA); where its requirements cite no evidence, Link
// evidence to the first of them by code (that requirement's Evidence tab); and, where no assessor
// has determined that evidence, Add to assessment campaign in its Assessment findings stage, the
// picker of the program's open campaigns with a draft plan, or Plan an assessment where none has
// one, the form that plans a campaign around the control. A control whose evidence an open
// campaign's plan holds already is under way: the stage names it instead, Open assessment campaign
// (its Execution tab), shown to every reader. A control its assessors have judged in part (some of
// the objectives it counts and not all, so still Not assessed) holds their findings in that stage,
// and so does a control whose findings all say Not assessed, which judge nothing; the stage carries
// the same step beside them, the one its Details carry: Open assessment campaign where an open
// campaign's plan holds the objectives nobody has judged yet, else Add to assessment campaign or
// Plan an assessment, opening over the page as the Details' step does. A requirement offers Map
// control and Link evidence on its own tabs; an operational issue that names no requirement offers
// Link requirement, which opens the issue's own Link requirement (its address asks for it,
// `link=requirement`), since the link is the issue's. A control the program's product variants
// inherit with a determination (the control status's `determinedBy` is the product) is not missing
// a requirement: its empty Requirements stage offers none and names the product assessment that
// decided it instead, a link to it in the stage's words (Decided by X800 Missile version 2 product
// assessment), shown to every reader. A stage with nothing wrong in it (No operational issue, No
// risk recorded) offers nothing, and otherwise a record further down the chain closes nothing
// upstream from its own page: evidence, a finding, a risk and a remediation item offer nothing. The
// fixes are derived in next-steps (`traceGapFixes`, given the control's standing from
// `program_control_status` and what the program's open campaigns hold of it, `useControlAssessment`
// in control-assessment) and drawn by `NextStep` in next-step.
//
// A step that leads elsewhere is a link; the four done on the control itself (Map a requirement,
// Allocate requirements, Add to assessment campaign, Plan an assessment) are link-styled buttons
// that open where they are done over the page, so the reader makes the change without leaving the
// control, and a viewer reads them as words alone.
//
// The Details and the trace each hold what their steps open (`StepSurfaceHost`), so a picker stays
// open while the step under it changes, and once the change shows, focus goes from the step that
// left to what replaced it in its row (`focusWhereStepWas` in step-focus).

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button, Text, TextLink } from "@ledger/design-system";
import { AssessmentSurface } from "./assessment-step";
import { questionSearch } from "./collection-question";
import { MapRequirementSurface, type StepControl } from "./map-requirement";
import { stepSlot } from "./step-focus";
import { AllocateRequirementsSurface } from "./system-requirements";
import {
  isInPlaceStep,
  nextStepLabel,
  type ControlNextStep,
  type InPlaceStepKind,
  type StepSystem,
  type TraceGapFix,
} from "@/lib/next-steps";
import { registerViews } from "@/lib/register-views";
import { determinations } from "@/lib/status";

/** What an in-place step asked to open: the step, the control and the row it was opened from. */
type StepSurface = {
  kind: InPlaceStepKind;
  programId: string;
  control: StepControl;
  /** Map a requirement opened for the rest of a control mapped in part: it starts on what is left. */
  rest: boolean;
  /** The system the control is short on, which Map a requirement opens on or Allocate requirements allocates to. */
  system: StepSystem | undefined;
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
            rest={surface.rest}
            system={surface.system}
            opener={surface.opener}
            slot={surface.slot}
            onClose={close}
          />
        ) : surface.kind === "allocate_requirement" ? (
          surface.system && (
            <AllocateRequirementsSurface
              key={surface.key}
              programId={surface.programId}
              system={surface.system}
              opener={surface.opener}
              slot={surface.slot}
              onClose={close}
            />
          )
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
          rest: "rest" in step && !!step.rest,
          system: "system" in step ? step.system : undefined,
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
type LinkStep = Exclude<ControlNextStep | TraceGapFix, { kind: InPlaceStepKind }>;

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
 * requirement, a picker of the program's requirements (for the rest of a control mapped in part,
 * Map 14 more objectives, with those objectives chosen; for a control short on a system, Map on
 * R210-STD-CUSA, on the requirements allocated there); Allocate to R210-STD-CUSA, the
 * system's own picker of the program's requirements, where none is allocated there yet; Add to
 * assessment campaign, a picker of its campaigns with a draft plan; Plan an assessment, the form
 * that plans a new campaign around the control. What it opens is held by the nearest
 * `StepSurfaceHost`, or by its own where there is none. For a reader who may not make the change,
 * and while the control is not yet known, such a step is its words alone.
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
