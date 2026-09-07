import type { ReactNode } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../components/breadcrumb";
import { Id } from "../components/id";
import { Fact } from "../components/typography";

/* A record's header is two lines: the trail, its parents then the record's id as the current crumb,
   unlinked, which is the way back; and the title's line, the name with a word of meta after it and
   the actions at the end. Josef, on review: no back chevron, no line of its own for the id, never
   more than the trail and the title, and no facts: what is not needed on every load is the rail's.
   `facts` is deprecated; a state strip may still sit below. */

export type RecordHeaderProps = {
  /** The trail's parents as BreadcrumbItem elements with BreadcrumbSeparator between them. The header appends a separator and the record's `id` as the current crumb. */
  crumbs?: ReactNode;
  /** The record's id, the trail's last crumb: "PRG-1041". Unlinked; it says where the reader is. */
  id?: ReactNode;
  /** The record's name, the h1. One line; it wraps when it must. */
  title: ReactNode;
  /** After the title on its line, subtle: the state as a Badge, the baseline, when it was updated. A few words, never a sentence. */
  meta?: ReactNode;
  /** The record's actions at the end of the title's line: one primary, and at most two beside it; the rest in a menu. */
  actions?: ReactNode;
  /** @deprecated The header is the trail, the title and the actions; the details are the rail's Inspector. Kept for one release. */
  facts?: ReactNode;
  /** A persistent strip under everything: a lifecycle, a Stepper, an ActionBar. */
  below?: ReactNode;
  /** @deprecated Pass the parents as `crumbs`; the header builds the trail and ends it with `id`. A Breadcrumb given here renders as is, without the id. */
  breadcrumb?: ReactNode;
  /** @deprecated The trail is the way back. Ignored. */
  back?: ReactNode;
};

/** The head of a record page: the trail ending in the record's id, then the title with a word of meta and the actions on one line; the facts that matter and a state strip under it. */
export function RecordHeader({
  crumbs,
  id,
  title,
  meta,
  actions,
  facts,
  below,
  breadcrumb,
}: RecordHeaderProps) {
  const trail = breadcrumb ? (
    breadcrumb
  ) : crumbs || id ? (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs}
        {crumbs && id ? <BreadcrumbSeparator className="first:hidden" /> : null}
        {id ? (
          <BreadcrumbItem>
            <BreadcrumbPage>
              <Id>{id}</Id>
            </BreadcrumbPage>
          </BreadcrumbItem>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  ) : null;
  return (
    <div className="flex flex-col gap-100">
      {trail ? <div className="min-w-0">{trail}</div> : null}
      <div className="flex items-start gap-150">
        <h1 className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-100 gap-y-025 font-heading-small font-semibold text-default">
          <span className="min-w-0">{title}</span>
          {meta ? (
            <span className="min-w-0 truncate font-body-small font-regular text-subtle">
              {meta}
            </span>
          ) : null}
        </h1>
        {actions ? <div className="flex shrink-0 items-center gap-100">{actions}</div> : null}
      </div>
      {facts ? <Fact.Group className="border-t border-default pt-100">{facts}</Fact.Group> : null}
      {below}
    </div>
  );
}
