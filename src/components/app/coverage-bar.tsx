/**
 * The verification bar: one segment per result and a hatched hole for what no
 * test names, with the one phrase beside it. Drawn on a coverage row and in the
 * requirement's peek, so the same bar reads the same on both rungs.
 */

import { Inline, Progress, Text, type StackedSegment } from "@ledger/design-system";
import { coverageWord, type RequirementCoverage } from "@/lib/requirement-verification";

/** The bar's segments: one per result, and a hatched hole for what no test names. */
export function coverageSegments(c: RequirementCoverage): StackedSegment[] {
  return [
    { key: "met", value: c.met, tone: "success", title: `${c.met} met` },
    { key: "partial", value: c.partial, tone: "warning", title: `${c.partial} partially met` },
    { key: "notMet", value: c.notMet, tone: "danger", title: `${c.notMet} not met` },
    { key: "notRun", value: c.notRun, tone: "information", title: `${c.notRun} not run` },
    {
      key: "notCovered",
      value: c.notCovered,
      tone: "neutral",
      appearance: "hatched",
      title: `${c.notCovered} not covered`,
    },
  ];
}

export function CoverageBar({ coverage }: { coverage: RequirementCoverage }) {
  return (
    <Inline as="span" space="space.100" alignBlock="center">
      <span className="shrink-0" style={{ width: 56 }}>
        <Progress.Stacked size="medium" segments={coverageSegments(coverage)} />
      </span>
      <Text size="xsmall" color="color.text.subtle" maxLines={1}>
        {coverageWord(coverage)}
      </Text>
    </Inline>
  );
}
