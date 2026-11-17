// From the product pattern contract (docs/guides/product-patterns.md), moved here on
// 2026-11-16 when the contract was cut to its rules: what holds for this screen alone, and the
// full wording of rules the contract now states in fewer words.
//
// Each part of a program's record lists its focused views first, in a row of small LinkButtons
// named `<part> views` (`ProgramViewRow` in program-views; the Overview's leads its body), only
// those that apply: Product delta once a system was created from a product, Compliance matrix once
// a requirements document was received. A view is never only in a menu. The row also leads to a
// part the side nav does not name, under the part it belongs to: System's lists Library. A focused
// program view's h1 is the view's name, its trail is Programs › the program › the part that lists
// it, and its browser title is `<view> — <program name> — Program Assurance` (`useViewTitle`); it
// uses the full work area without the program's Details. The program's Details and References
// belong only to its Overview; focused views, including Workbook, Traceability matrix and Program
// transfer, do not render that rail or its narrow-screen disclosure.

import { Link } from "@tanstack/react-router";
import { ViewSwitcher } from "@ledger/design-system";
import { useProgramVariants } from "@/lib/product-assurance";
import { useRequirementSources } from "@/lib/requirement-compliance";
import { partAddress, type ProgramPart } from "@/lib/program-parts";
import { ReportFailures, type QueryStatus } from "./work-common";

/**
 * The program's focused views, each a page of its own under the program, listed under the part
 * whose work it reads. A view that repeats a part ("Cyber T&E phases", the Assessments part) or
 * lands back on the Overview (the old dashboard address) is not one. A view that only applies to
 * some programs says what it waits on: `variant`, a system created from a product; `document`, a
 * customer's requirements document.
 */
export const programViews = [
  { name: "Authorization", to: "/programs/$programId/authorization", part: "Overview" },
  { name: "Program transfer", to: "/programs/$programId/export", part: "Overview" },
  { name: "Configuration baseline", to: "/programs/$programId/baseline", part: "System" },
  { name: "Posture", to: "/programs/$programId/posture", part: "Requirements" },
  {
    name: "Compliance matrix",
    to: "/programs/$programId/compliance",
    part: "Requirements",
    when: "document",
  },
  { name: "Workbook", to: "/programs/$programId/workbook", part: "Requirements" },
  { name: "Traceability matrix", to: "/programs/$programId/sctm", part: "Requirements" },
  { name: "Control status", to: "/programs/$programId/control-status", part: "Controls" },
  { name: "Control baseline", to: "/programs/$programId/control-baseline", part: "Controls" },
  { name: "Cyber resiliency", to: "/programs/$programId/resiliency", part: "Controls" },
  {
    name: "Product delta",
    to: "/programs/$programId/product-delta",
    part: "Controls",
    when: "variant",
  },
  { name: "Inheritance resolution", to: "/programs/$programId/inheritance", part: "Controls" },
  { name: "Continuous monitoring", to: "/programs/$programId/conmon", part: "Assessments" },
  { name: "Scanner ingestion", to: "/programs/$programId/ingestion", part: "Assessments" },
  { name: "Residual risk", to: "/programs/$programId/risk", part: "Risks" },
] as const satisfies readonly {
  name: string;
  to: string;
  part: ProgramPart;
  when?: "variant" | "document";
}[];

export type ProgramView = (typeof programViews)[number];
export type ProgramViewName = ProgramView["name"];

/** The part a view is listed under, which its trail names between the program and the view. */
export function programViewPart(name: ProgramViewName): ProgramPart {
  return programViews.find((view) => view.name === name)!.part;
}

/**
 * A part the side nav does not name, listed in the row of the part it belongs to: Library, what
 * the program's systems take from the library, is System's.
 */
const partsUnder: Partial<Record<ProgramPart, readonly ProgramPart[]>> = { System: ["Library"] };

/**
 * A part's views, as the kit's ViewSwitcher before the part's content, named after the part
 * ("Controls views"). Only the views that apply to the program are listed: Product delta once a
 * system was created from a product, Compliance matrix once a requirements document was received;
 * the reads that say so are the Overview trays' own. Then the parts the side nav does not name
 * that belong to this one (System's Library), each at its address. The row scrolls in its own
 * strip when it is wider than the frame, as a tab strip does. The part shows none of its views,
 * so none is current. A part with no view draws nothing.
 */
export function ProgramViewRow({ programId, part }: { programId: string; part: ProgramPart }) {
  const listed = programViews.filter((view) => view.part === part);
  const under = partsUnder[part] ?? [];
  const waits = (on: "variant" | "document") =>
    listed.some((view) => "when" in view && view.when === on);
  const variants = useProgramVariants(waits("variant") ? programId : null);
  const documents = useRequirementSources(waits("document") ? programId : null);
  const applies = (view: ProgramView) =>
    !("when" in view) ||
    (view.when === "variant" ? !!variants.variants?.length : !!documents.sources?.length);
  const shown = listed.filter(applies);
  // A read that says whether a view applies, and failed, is said by the part's one alert.
  const reads: QueryStatus[] = [
    ...(waits("variant") ? [variants.query] : []),
    ...(waits("document") ? [documents.query] : []),
  ];
  return (
    <>
      <ReportFailures queries={reads} />
      {shown.length + under.length > 0 && (
        <ViewSwitcher label={`${part} views`}>
          {shown.map((view) => (
            <ViewSwitcher.Item key={view.to} render={<Link to={view.to} params={{ programId }} />}>
              {view.name}
            </ViewSwitcher.Item>
          ))}
          {under.map((name) => (
            <ViewSwitcher.Item
              key={name}
              render={
                <Link
                  to="/programs/$programId"
                  params={{ programId }}
                  {...partAddress(name)}
                  activeOptions={{ exact: true, includeSearch: true }}
                />
              }
            >
              {name}
            </ViewSwitcher.Item>
          ))}
        </ViewSwitcher>
      )}
    </>
  );
}
