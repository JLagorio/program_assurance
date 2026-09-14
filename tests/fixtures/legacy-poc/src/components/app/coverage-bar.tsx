import { coverageWord, type RequirementCoverage } from "@/lib/requirement-verification";
import { Inline, ProgressStacked, Text, type StackedSegment } from "@ledger/design-system";

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
      title: `${c.notCovered} with no assessment linked`,
    },
  ];
}

export function CoverageBar({ coverage }: { coverage: RequirementCoverage }) {
  return (
    <Inline as="span" space="space.100" alignBlock="center">
      <span className="shrink-0" style={{ width: 56 }}>
        <ProgressStacked size="medium" segments={coverageSegments(coverage)}></ProgressStacked>
      </span>
      <Text size="xsmall" color="color.text.subtle" maxLines={1}>
        {coverageWord(coverage)}
      </Text>
    </Inline>
  );
}
