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
  /** The record's own name, the trail's last level and its one current page. */
  current: ReactNode;
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
  return (
    <PageHeader.Lead render={<Breadcrumb {...(label ? { "aria-label": label } : {})} />}>
      <BreadcrumbList>
        {levels.map((level, index) => (
          <Fragment key={isValidElement(level) && level.key != null ? level.key : index}>
            <BreadcrumbItem>{level}</BreadcrumbItem>
            <BreadcrumbSeparator />
          </Fragment>
        ))}
        <BreadcrumbItem>
          <BreadcrumbPage>{current}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </PageHeader.Lead>
  );
}
