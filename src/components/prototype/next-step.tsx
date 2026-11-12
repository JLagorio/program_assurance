import { Link } from "@tanstack/react-router";
import { TextLink } from "@ledger/design-system";
import { questionSearch } from "./collection-question";
import { nextStepLabel, type ControlNextStep, type TraceGapFix } from "@/lib/next-steps";
import { registerViews } from "@/lib/register-views";
import { determinations } from "@/lib/status";

/** The determinations an assessor publishes short of satisfied: what Open assessment findings asks. */
const shortOfSatisfied = Object.keys(determinations).filter(
  (determination) =>
    determination === "partially_satisfied" || determination === "other_than_satisfied",
);

/**
 * A next step as the link that leads to where it is done: the requirement's Evidence or Control
 * mappings tab, the program's Requirements or Assessment campaigns tab, or the assessment findings
 * an assessor published short of satisfied. `programId` is the program the step is read in. A step
 * that names its own page (`own`) says the step alone, without the record's code.
 */
export function NextStepLink({
  step,
  programId,
  own = false,
  size,
}: {
  step: ControlNextStep | TraceGapFix;
  programId: string;
  /** The step is done on the record the reader is on: its code is left out of the words. */
  own?: boolean | undefined;
  size?: "small" | "medium" | undefined;
}) {
  const label = own && step.kind === "link_evidence" ? "Link evidence" : nextStepLabel(step);
  const link = (() => {
    switch (step.kind) {
      case "map_requirement":
        return (
          <Link to="/programs/$programId" params={{ programId }} search={{ tab: "Requirements" }} />
        );
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
      case "assess":
        return (
          <Link
            to="/programs/$programId"
            params={{ programId }}
            search={{ tab: "Assessment campaigns" }}
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
    }
  })();
  return (
    <TextLink render={link} {...(size ? { size } : {})}>
      {label}
    </TextLink>
  );
}
