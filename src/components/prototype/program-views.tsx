import { Link } from "@tanstack/react-router";
import {
  Inline,
  LinkButton,
  Scroller,
  ScrollerArrow,
  ScrollerViewport,
} from "@ledger/design-system";
import { useProgramVariants } from "@/lib/product-assurance";
import { useRequirementSources } from "@/lib/requirement-compliance";
import type { ProgramTab } from "./program-workspace";
import { ReportFailures, type QueryStatus } from "./work-common";

/**
 * The program's focused views, each a page of its own under the program, listed under the tab whose
 * work it reads. A view that repeats a tab ("Cyber T&E phases", the Assessment campaigns tab) or
 * lands back on the Overview (the old dashboard address) is not one. A view that only applies to
 * some programs says what it waits on: `variant`, a system created from a product; `document`, a
 * customer's requirements document.
 */
export const programViews = [
  { name: "Authorization", to: "/programs/$programId/authorization", tab: "Overview" },
  { name: "Program transfer", to: "/programs/$programId/export", tab: "Overview" },
  { name: "Configuration baseline", to: "/programs/$programId/baseline", tab: "System" },
  { name: "Posture", to: "/programs/$programId/posture", tab: "Requirements" },
  {
    name: "Compliance matrix",
    to: "/programs/$programId/compliance",
    tab: "Requirements",
    when: "document",
  },
  { name: "Workbook", to: "/programs/$programId/workbook", tab: "Requirements" },
  { name: "Traceability matrix", to: "/programs/$programId/sctm", tab: "Requirements" },
  { name: "Control status", to: "/programs/$programId/control-status", tab: "Controls" },
  { name: "Control baseline", to: "/programs/$programId/control-baseline", tab: "Controls" },
  { name: "Cyber resiliency", to: "/programs/$programId/resiliency", tab: "Controls" },
  {
    name: "Product delta",
    to: "/programs/$programId/product-delta",
    tab: "Controls",
    when: "variant",
  },
  { name: "Inheritance resolution", to: "/programs/$programId/inheritance", tab: "Controls" },
  { name: "Continuous monitoring", to: "/programs/$programId/conmon", tab: "Assessment campaigns" },
  { name: "Scanner ingestion", to: "/programs/$programId/ingestion", tab: "Assessment campaigns" },
  { name: "Residual risk", to: "/programs/$programId/risk", tab: "POA&M & risk" },
] as const satisfies readonly {
  name: string;
  to: string;
  tab: ProgramTab;
  when?: "variant" | "document";
}[];

export type ProgramView = (typeof programViews)[number];
export type ProgramViewName = ProgramView["name"];

/** The tab a view is listed under, which its trail names between the program and the view. */
export function programViewTab(name: ProgramViewName): ProgramTab {
  return programViews.find((view) => view.name === name)!.tab;
}

/**
 * A tab's views, as one row of links before the tab's content, named after the tab ("Controls
 * views"). Only the views that apply to the program are listed: Product delta once a system was
 * created from a product, Compliance matrix once a requirements document was received; the reads
 * that say so are the Overview trays' own. The row scrolls on its own when it is wider than the
 * frame, as a tab strip does. A tab with no view draws nothing.
 */
export function ProgramViewRow({ programId, tab }: { programId: string; tab: ProgramTab }) {
  const listed = programViews.filter((view) => view.tab === tab);
  const waits = (on: "variant" | "document") =>
    listed.some((view) => "when" in view && view.when === on);
  const variants = useProgramVariants(waits("variant") ? programId : null);
  const documents = useRequirementSources(waits("document") ? programId : null);
  const applies = (view: ProgramView) =>
    !("when" in view) ||
    (view.when === "variant" ? !!variants.variants?.length : !!documents.sources?.length);
  const shown = listed.filter(applies);
  // A read that says whether a view applies, and failed, is said by the tab's one alert.
  const reads: QueryStatus[] = [
    ...(waits("variant") ? [variants.query] : []),
    ...(waits("document") ? [documents.query] : []),
  ];
  return (
    <>
      <ReportFailures queries={reads} />
      {shown.length > 0 && (
        <nav aria-label={`${tab} views`} className="min-w-0">
          <Scroller orientation="horizontal">
            <ScrollerViewport>
              <Inline space="space.100">
                {shown.map((view) => (
                  <LinkButton
                    key={view.to}
                    size="small"
                    render={<Link to={view.to} params={{ programId }} />}
                  >
                    {view.name}
                  </LinkButton>
                ))}
              </Inline>
            </ScrollerViewport>
            <ScrollerArrow edge="start" />
            <ScrollerArrow edge="end" />
          </Scroller>
        </nav>
      )}
    </>
  );
}
