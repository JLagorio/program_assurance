import { ChevronLeft } from "lucide-react";
import { cloneElement, type ReactElement, type ReactNode } from "react";
import { Button, Fact } from "../components";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../components/sheet";

import { Id } from "../components/id";

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
export type PreviewSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Back to the previous frame of the stack. */
  onBack?: (() => void) | undefined;
  /** The record's id, beside the Preview eyebrow. */
  id: ReactNode;
  /** The record's name, the sheet's title. */
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
  /** Pixels, 720 by default: about half the screen. */
  width?: number | undefined;
  /** The body: sections of facts and small tables, the record's detail at the peek's depth. */
  children: ReactNode;
};

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
}: PreviewSheetProps) {
  const open_ = openTo.props.children
    ? openTo
    : cloneElement(openTo, { children: "Open the full record" });
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <SheetContent side="end" style={{ maxWidth: width }}>
        <SheetHeader>
          <div className="flex items-start gap-100">
            <Button
              aria-label="Back"
              variant="subtle"
              size="small"
              className="size-control-small p-0"
              onClick={onBack}
            >
              <ChevronLeft aria-hidden />
            </Button>
            <div className="flex min-w-0 flex-1 flex-col gap-025">
              <div className="flex items-center gap-100 pb-025">
                <>
                  <Eyebrow>Preview</Eyebrow>
                  <Id className="font-body-small text-subtle">{id}</Id>
                  {status}
                </>
              </div>
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription>{subtitle}</SheetDescription>
              <Fact.Group className="pt-075">{facts}</Fact.Group>
            </div>
          </div>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-none px-200 py-150">
          {children}
        </div>
        <SheetFooter>
          <div className="flex w-full items-center justify-between gap-150">
            <div className="flex min-w-0 flex-wrap items-center gap-200 font-body">
              <TextLink weight="medium">{open_}</TextLink>
              {links}
            </div>
            {actions ? <div className="flex shrink-0 items-center gap-100">{actions}</div> : null}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
