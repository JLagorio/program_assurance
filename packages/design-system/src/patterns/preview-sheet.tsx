import { cloneElement, type ReactElement, type ReactNode } from "react";

import { Id } from "../components/id";
import { Sheet } from "../components/sheet";
import { TextLink } from "../components/text-link";
import { Eyebrow } from "../components/typography";

/**
 * The peek panel: a Sheet that previews one row and leaves the list in place. It is a preview, never the
 * record: the footer's first item always opens the full record. The rail (PreviewRail) previews a row
 * beside an IndexPage table that leaves room; the sheet previews a row over a full-width table (a tree,
 * a board) and whenever the preview carries actions.
 */
export function PreviewSheet({
  open,
  onClose,
  id,
  title,
  subtitle,
  openTo,
  links,
  actions,
  width = 720,
  children,
}: {
  open: boolean;
  onClose: () => void;
  id: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** The link element to the full record. Given no children it reads "Open the full record". */
  openTo: ReactElement<{ children?: ReactNode }>;
  /** More TextLinks after the first: a tab of the record, a related record. */
  links?: ReactNode;
  /** Actions that make sense without leaving, on the right of the footer. */
  actions?: ReactNode;
  width?: number | undefined;
  children: ReactNode;
}) {
  const open_ = openTo.props.children
    ? openTo
    : cloneElement(openTo, { children: "Open the full record" });
  return (
    <Sheet
      open={open}
      onClose={onClose}
      width={width}
      eyebrow={
        <>
          <Eyebrow>Preview</Eyebrow>
          <Id className="font-body-small text-subtle">{id}</Id>
        </>
      }
      title={title}
      subtitle={subtitle}
      footer={
        <div className="flex w-full items-center justify-between gap-150">
          <div className="flex min-w-0 flex-wrap items-center gap-200 font-body">
            <TextLink weight="medium">{open_}</TextLink>
            {links}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-100">{actions}</div> : null}
        </div>
      }
    >
      {children}
    </Sheet>
  );
}
