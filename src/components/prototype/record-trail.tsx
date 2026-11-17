import { createLink, type LinkComponent } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  PageHeader,
} from "@ledger/design-system";
import { Children, Fragment, isValidElement, type ReactNode } from "react";
import { useRow } from "@/lib/models";
import { partAddress, type ProgramPart } from "@/lib/program-parts";

const RouterBreadcrumbLink = createLink(BreadcrumbLink);

/**
 * A level of a record trail: the router works out the href, BreadcrumbLink draws it. It matches
 * exactly, so an ancestor is never the active link, and BreadcrumbLink drops the `aria-current`
 * the router hands it: only the trail's last level, the current page, is announced as current.
 * Takes the router Link's props (`to`, `params`, `search`) and BreadcrumbLink's.
 */
export const TrailLink: LinkComponent<typeof BreadcrumbLink> = (props) => (
  <RouterBreadcrumbLink activeOptions={{ exact: true }} {...props} />
);

export type RecordTrailProps = {
  /** The ancestors, root first: each a TrailLink, or plain text for a level the reader cannot open. */
  children?: ReactNode;
  /**
   * The record's own name, the trail's last level and its one current page. A page in a work scope
   * passes none: its h1 names it, and the trail ends at the level above (`ProgramTrail`).
   */
  current?: ReactNode | undefined;
  /** Names the navigation landmark when a page has more than one; the kit's "breadcrumb" unsaid. */
  label?: string | undefined;
};

/**
 * A record page's breadcrumb, as its PageHeader.Lead: every ancestor with a separator after it,
 * then the current page. Compose it once per record page, inside PageHeader:
 *
 * ```tsx
 * <PageHeader>
 *   <RecordTrail current={task.title}>
 *     <TrailLink to="/work">My work</TrailLink>
 *     <TrailLink to="/programs/$programId" params={{ programId }}>{program.name}</TrailLink>
 *   </RecordTrail>
 *   <PageHeader.Heading>…</PageHeader.Heading>
 * </PageHeader>
 * ```
 */
export function RecordTrail({ children, current, label }: RecordTrailProps) {
  const levels = Children.toArray(children);
  const last = current === undefined ? levels.length - 1 : levels.length;
  return (
    <PageHeader.Lead render={<Breadcrumb {...(label ? { "aria-label": label } : {})} />}>
      <BreadcrumbList>
        {levels.map((level, index) => (
          <Fragment key={isValidElement(level) && level.key != null ? level.key : index}>
            <BreadcrumbItem>{level}</BreadcrumbItem>
            {index < last && <BreadcrumbSeparator />}
          </Fragment>
        ))}
        {current !== undefined && (
          <BreadcrumbItem>
            <BreadcrumbPage>{current}</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </PageHeader.Lead>
  );
}

/** What a page of a program sits under: one of its parts, or the Authorization view's packages. */
export type ProgramTrailPart = ProgramPart | "Authorization";

/**
 * The one trail of a program's work scope (wave 7, after Josef's review of 2026-11-16): the way up
 * to the side nav's current entry, as the pass-six boards draw it (a risk is "code › Risks"). The
 * program by its code, as the work scope's switcher names it, leading to its Overview; then the
 * part that lists the page, at its address; then any element that holds it (`children`,
 * TrailLinks, outermost first). It has no current level, since the h1 under it names the page. A part, and a view the
 * side nav names (Baseline, Authorization), draws no trail at all; a record that names no program
 * stays in the organization and keeps its register's trail.
 */
export function ProgramTrail({
  programId,
  part,
  children,
}: {
  programId: string;
  /** The part that lists the page; none for a record no part lists (a workstream). */
  part?: ProgramTrailPart | undefined;
  children?: ReactNode;
}) {
  const program = useRow("programs", programId);
  return (
    <RecordTrail>
      <TrailLink to="/programs/$programId" params={{ programId }}>
        {program.data?.code ?? "Program"}
      </TrailLink>
      {part === "Authorization" ? (
        <TrailLink
          to="/programs/$programId/authorization"
          params={{ programId }}
          search={{ tab: "package" }}
        >
          Authorization
        </TrailLink>
      ) : part ? (
        <TrailLink to="/programs/$programId" params={{ programId }} {...partAddress(part)}>
          {part}
        </TrailLink>
      ) : null}
      {children}
    </RecordTrail>
  );
}
