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

/* Parent breadcrumb links provide the way back; the unlinked record id marks the current page.
   The title, short meta and actions share the next row. Put record details in the rail;
   the deprecated `facts` slot still renders for compatibility. A state strip may sit below. */

export type RecordHeaderProps = {
  /** The trail's parents as BreadcrumbItem elements with BreadcrumbSeparator between them. The header appends a separator and the record's `id` as the current crumb. */
  crumbs?: ReactNode;
  /** The record's id, the trail's last crumb: "PRG-1041". Unlinked; it says where the reader is. */
  id?: ReactNode;
  /** The record's name in the h1. Long titles wrap. */
  title: ReactNode;
  /** After the title on its line, subtle: the state as a Badge, the baseline, when it was updated. A few words, never a sentence. */
  meta?: ReactNode;
  /** The record's actions at the end of the title's line: one primary, and at most two beside it; the rest in a menu. */
  actions?: ReactNode;
  /** @deprecated Put details in the rail's Inspector. Still renders a Fact.Group below the title for compatibility. */
  facts?: ReactNode;
  /** A persistent strip under everything: a lifecycle, a Stepper, an ActionBar. */
  below?: ReactNode;
  /** @deprecated Pass the parents as `crumbs`; the header builds the trail and ends it with `id`. A Breadcrumb given here renders as is, without the id. */
  breadcrumb?: ReactNode;
  /** @deprecated The trail is the way back. Ignored. */
  back?: ReactNode;
};

/** A record page's breadcrumb trail, title, short meta and actions, with an optional state strip below. Record details belong in the rail; the deprecated facts slot remains supported. */
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
      <div className="flex flex-col items-start gap-150 sm:flex-row">
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
