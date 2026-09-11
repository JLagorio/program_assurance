import { ChevronLeft } from "lucide-react";
import { cloneElement, useRef, type ReactElement, type ReactNode } from "react";
import { Button, Fact } from "../components";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  type SheetContentProps,
} from "../components/sheet";
import { TextLink } from "../components/text-link";
import { PreviewHeader } from "./preview-header";

/**
 * Modal record details. Base UI owns focus containment, Escape and focus return.
 * Callers own related-record navigation and any work performed in the sheet.
 */
export type PreviewSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Back to the previous frame of the stack. */
  onBack?: (() => void) | undefined;
  /** The record's id, beside its status. */
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
  /** Native focus overrides for workflows whose opener disappears or whose first task is an input. */
  initialFocus?: SheetContentProps["initialFocus"];
  finalFocus?: SheetContentProps["finalFocus"];
  /** Focused record content, editable properties or actions. */
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
  initialFocus,
  finalFocus,
  children,
}: PreviewSheetProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  // TextLink's render element owns children, even when explicitly undefined.
  // Fill the default before composition so an empty router link stays named.
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
      <SheetContent
        side="end"
        style={{ maxWidth: width }}
        initialFocus={initialFocus ?? titleRef}
        finalFocus={finalFocus}
      >
        <SheetHeader>
          <div className="flex items-start gap-100">
            {onBack && (
              <Button
                aria-label="Back"
                variant="subtle"
                size="small"
                className="size-control-small p-0"
                onClick={onBack}
              >
                <ChevronLeft aria-hidden />
              </Button>
            )}
            <div className="min-w-0 flex-1">
              <PreviewHeader
                id={id}
                status={status}
                title={
                  <SheetTitle ref={titleRef} tabIndex={-1} className="break-words outline-none">
                    {title}
                  </SheetTitle>
                }
                subtitle={subtitle ? <SheetDescription>{subtitle}</SheetDescription> : null}
              />
              {facts ? <Fact.Group className="pt-100">{facts}</Fact.Group> : null}
            </div>
          </div>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-none px-200 py-150">
          {children}
        </div>
        <SheetFooter>
          <div className="flex w-full flex-wrap items-center justify-between gap-150">
            <div className="flex min-w-0 flex-wrap items-center gap-200 font-body">
              <TextLink weight="medium" render={open_} />
              {links}
            </div>
            {actions ? (
              <div className="flex max-w-full flex-wrap items-center gap-100">{actions}</div>
            ) : null}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
