// From the product pattern contract (docs/guides/product-patterns.md), moved here on
// 2026-11-16 when the contract was cut to its rules: what holds for this screen alone, and the
// full wording of rules the contract now states in fewer words.
//
// Each part of a program's record lists its focused views first, in a row of small LinkButtons
// named `<part> views` (`ProgramViewRow` in program-views; the Overview's leads its body), only
// those that apply: Product delta once a system was created from a product, Compliance matrix once
// a requirements document was received. A view is never only in a menu. A row lists only the views
// the side nav does not name: Authorization is in no row, so the Overview's row holds Program
// transfer alone. The Controls part's row is its view switch (wave 10, the boards' Controls ›
// Status): its own two views in place first, Status and Implementation, then Baseline, the Control
// baseline view the side nav also names, then the views listed under Controls (Inheritance, Cyber
// resiliency, Product delta where it applies); it marks the view shown current, on the part and on
// each of those views' pages. The row also leads to a part the side nav does not name, under the
// part it belongs to: System's lists Library. A focused program view's h1 is the view's name, its
// trail is the program's code › the part that lists it (`ProgramTrail` in record-trail; a view the
// nav names has none), and its browser title is `<view> — <program name> — Program Assurance`
// (`useViewTitle`); it uses the full work area without the program's Details. The program's Details
// and References belong only to its Overview; focused views, including Workbook, Traceability
// matrix and Program transfer, do not render that rail or its narrow-screen disclosure.

import { Link } from "@tanstack/react-router";
import { ViewSwitcher } from "@ledger/design-system";
import { useProgramVariants } from "@/lib/product-assurance";
import { useRequirementSources } from "@/lib/requirement-compliance";
import {
  controlsViewSearch,
  partAddress,
  type ControlsView,
  type ProgramPart,
} from "@/lib/program-parts";
import { ReportFailures, type QueryStatus } from "./work-common";

/**
 * The program's focused views, each a page of its own under the program, listed under the part
 * whose work it reads, or named by the side nav itself (`nav`: Baseline, Authorization), which
 * lists it in no part's row. A view that repeats a part ("Cyber T&E phases", the Assessments part)
 * or lands back on the Overview (the old dashboard address) is not one. A view that only applies
 * to some programs says what it waits on: `variant`, a system created from a product; `document`,
 * a customer's requirements document.
 */
export const programViews = [
  { name: "Authorization", to: "/programs/$programId/authorization", nav: "Authorization" },
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
  { name: "Control baseline", to: "/programs/$programId/control-baseline", nav: "Baseline" },
  { name: "Inheritance", to: "/programs/$programId/inheritance", part: "Controls" },
  { name: "Cyber resiliency", to: "/programs/$programId/resiliency", part: "Controls" },
  {
    name: "Product delta",
    to: "/programs/$programId/product-delta",
    part: "Controls",
    when: "variant",
  },
  { name: "Continuous monitoring", to: "/programs/$programId/conmon", part: "Assessments" },
  { name: "Scanner ingestion", to: "/programs/$programId/ingestion", part: "Assessments" },
  { name: "Residual risk", to: "/programs/$programId/risk", part: "Risks" },
] as const satisfies readonly ({
  name: string;
  to: string;
  when?: "variant" | "document";
} & ({ part: ProgramPart } | { nav: "Baseline" | "Authorization" }))[];

export type ProgramView = (typeof programViews)[number];
export type ProgramViewName = ProgramView["name"];

/**
 * The part a view is listed under, which its trail names after the program; none for a view the
 * side nav names, which has no trail.
 */
export function programViewPart(name: ProgramViewName): ProgramPart | undefined {
  const view = programViews.find((each) => each.name === name);
  return view && "part" in view ? view.part : undefined;
}

/**
 * A part the side nav does not name, listed in the row of the part it belongs to: Library, what
 * the program's systems take from the library, is System's.
 */
const partsUnder: Partial<Record<ProgramPart, readonly ProgramPart[]>> = { System: ["Library"] };

/**
 * The Controls part's own views, which lead its row: Status and Implementation in place, then
 * Baseline, the Control baseline view, which the side nav names too.
 */
const controlsLeads = [
  { name: "Status", view: "Status" },
  { name: "Implementation", view: "Implementation" },
  { name: "Baseline", to: "/programs/$programId/control-baseline" },
] as const satisfies readonly ({ name: string } & ({ view: ControlsView } | { to: string }))[];

/**
 * A part's views, as the kit's ViewSwitcher before the part's content, named after the part
 * ("Controls views"). The Controls part's row leads with its own views (`controlsLeads`). Only the
 * views that apply to the program are listed: Product delta once a system was created from a
 * product, Compliance matrix once a requirements document was received; the reads that say so are
 * the Overview trays' own. Then the parts the side nav does not name that belong to this one
 * (System's Library), each at its address. The row scrolls in its own strip when it is wider than
 * the frame, as a tab strip does. `current` names the view shown, marked current: a Controls view
 * on the part, or a view's own name on its page. A part with no view draws nothing.
 */
export function ProgramViewRow({
  programId,
  part,
  current,
}: {
  programId: string;
  part: ProgramPart;
  current?: string | undefined;
}) {
  const listed = programViews.filter((view) => "part" in view && view.part === part);
  const leads = part === "Controls" ? controlsLeads : [];
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
  // Exact matching, so a router link never marks itself current: `current` says which is.
  const exact = { exact: true, includeSearch: true } as const;
  return (
    <>
      <ReportFailures queries={reads} />
      {leads.length + shown.length + under.length > 0 && (
        <ViewSwitcher label={`${part} views`}>
          {leads.map((lead) => (
            <ViewSwitcher.Item
              key={lead.name}
              isActive={current === lead.name}
              render={
                "view" in lead ? (
                  <Link
                    to="/programs/$programId"
                    params={{ programId }}
                    search={controlsViewSearch(lead.view)}
                    activeOptions={exact}
                  />
                ) : (
                  <Link to={lead.to} params={{ programId }} activeOptions={exact} />
                )
              }
            >
              {lead.name}
            </ViewSwitcher.Item>
          ))}
          {shown.map((view) => (
            <ViewSwitcher.Item
              key={view.to}
              isActive={current === view.name}
              render={<Link to={view.to} params={{ programId }} activeOptions={exact} />}
            >
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
                  activeOptions={exact}
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
