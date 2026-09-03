import { ChevronLeft } from "lucide-react";
import { cloneElement, type ReactElement, type ReactNode } from "react";

import { Id } from "../components/id";
import { Tooltip } from "../components/tooltip";
import { Fact } from "../components/typography";

const backClass =
  "inline-flex size-control-xsmall shrink-0 items-center justify-center rounded-medium icon-subtle outline-none transition-colors duration-fast ease-standard hover:bg-neutral-subtle-hovered hover:icon-default focus-visible:outline-focused";

/** Compact record-page header: back chevron, id, title, meta. `back` is a link element (a router's Link) that becomes the chevron; a `breadcrumb` above the row places a sub-page under its parent record. */
export function RecordHeader({
  back,
  breadcrumb,
  id,
  title,
  meta,
  actions,
  facts,
  below,
}: {
  back?:
    | ReactElement<{ className?: string | undefined; children?: ReactNode; "aria-label"?: string }>
    | undefined;
  breadcrumb?: ReactNode;
  id: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  /** Facts under the title, on one line above the fold: the ones the reader acts on. At most six; the rest go in the rail. */
  facts?: ReactNode;
  /** Persistent state strip under the title row (a lifecycle). */
  below?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-150">
      {breadcrumb ? <div className="ps-500">{breadcrumb}</div> : null}
      <div className="flex items-start gap-150">
        {back ? (
          <Tooltip content="Back">
            {cloneElement(back, {
              className: backClass,
              "aria-label": "Back",
              children: <ChevronLeft className="size-icon-medium" />,
            })}
          </Tooltip>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col gap-025">
          <div className="flex items-baseline gap-100">
            <Id className="font-body text-subtle">{id}</Id>
            {meta ? <span className="truncate font-body-small text-subtle">{meta}</span> : null}
          </div>
          <h1 className="font-heading-small font-semibold text-default">{title}</h1>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-100">{actions}</div> : null}
      </div>
      {facts ? <Fact.Group className="border-t border-default pt-100">{facts}</Fact.Group> : null}
      {below}
    </div>
  );
}
