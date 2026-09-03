import { cloneElement, type ReactElement, type ReactNode } from "react";

import { Id } from "../components/id";
import { Sheet } from "../components/sheet";
import { TextLink } from "../components/text-link";
import { Eyebrow } from "../components/typography";

/**
 * The peek panel: a Sheet that previews one row and leaves the list in place. It is a preview, never the
 * record: the footer's first item always opens the full record. Its header is the compact form of a
 * RecordHeader (id, title, meta, at most three facts, one status), so a record reads the same in the panel
 * and on its page. A preview opened from inside a preview is the next frame of the same sheet; `onBack`
 * returns to the one before, and the caller keeps the stack (in the URL, so the browser's back is the same
 * thing). The rail (PreviewRail) previews a row beside an IndexPage table that leaves room; the sheet
 * previews a row over a full-width table (a tree, a board) and whenever the preview carries actions.
 */
export function PreviewSheet({
  open,
  onClose,
  onBack,
  id,
  title,
  subtitle,
  status,
  facts,
  openTo,
  links,
  actions,
  width = 720,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** Back to the previous frame of the stack. */
  onBack?: (() => void) | undefined;
  id: ReactNode;
  title: ReactNode;
  /** The record's meta line: kind, path, owner. */
  subtitle?: ReactNode;
  /** One status, beside the id. A Badge or an Indicator. */
  status?: ReactNode;
  /** At most three Facts under the meta line: the ones the reader acts on. */
  facts?: ReactNode;
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
      onBack={onBack}
      width={width}
      eyebrow={
        <>
          <Eyebrow>Preview</Eyebrow>
          <Id className="font-body-small text-subtle">{id}</Id>
          {status}
        </>
      }
      title={title}
      subtitle={subtitle}
      facts={facts}
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
