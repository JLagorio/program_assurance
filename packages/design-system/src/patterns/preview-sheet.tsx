import { ChevronLeft, X } from "lucide-react";
import { cloneElement, useRef, type ReactElement, type ReactNode } from "react";
import { Fact, IconButton, Id } from "../components";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  type SheetContentProps,
} from "../components/sheet";
import { TextLink } from "../components/text-link";
import { PageHeader } from "../layout/page-header";
import { useLedgerLocale } from "../lib/locale";
import { Stack } from "../primitives/stack";

/**
 * Modal record details. Base UI owns focus containment, Escape and focus return.
 * Callers own related-record navigation and any work performed in the sheet.
 */
export type PreviewSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Back to the previous frame of the stack. */
  onBack?: (() => void) | undefined;
  /** The record's id, beside its status in the body metadata. */
  id: ReactNode;
  /** The record's name in the inner record header; also names the modal. */
  title: ReactNode;
  /** Global collection navigation in the outer header, before Close. Includes the full-record link. */
  navigation?: ReactNode;
  /** The record's meta line: kind, path, owner. */
  subtitle?: ReactNode;
  /** One status, beside the id. A Badge or an Indicator. */
  status?: ReactNode;
  /** At most three Facts under the meta line: the ones the reader acts on. */
  facts?: ReactNode;
  /** Full-record link in the outer header when navigation is absent. Empty children default to "Open the full record". */
  openTo: ReactElement<{ children?: ReactNode }>;
  /** Related destination TextLinks in the footer. Do not repeat the full-record link. */
  links?: ReactNode;
  /** Record commands in the inner PageHeader.Actions, beside the title. Use small controls. */
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
  navigation,
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
  const { t } = useLedgerLocale();
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
        showCloseButton={false}
        style={{ maxWidth: width }}
        initialFocus={initialFocus ?? titleRef}
        finalFocus={finalFocus}
      >
        <SheetHeader className="flex-row items-center gap-050 pe-200">
          {onBack ? (
            <IconButton
              label={t("back")}
              variant="subtle"
              icon={<ChevronLeft />}
              isTooltipDisabled
              onClick={onBack}
            />
          ) : null}
          <div className="flex min-w-0 flex-1 items-center justify-end">
            {navigation || <TextLink weight="medium" render={open_} />}
          </div>
          <SheetClose
            render={
              <IconButton label={t("close")} variant="subtle" icon={<X />} isTooltipDisabled />
            }
          />
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-none px-200 py-150">
          <Stack space="space.250">
            <PageHeader>
              <PageHeader.Heading>
                <SheetTitle
                  ref={titleRef}
                  tabIndex={-1}
                  className="break-words font-heading-small font-semibold outline-none"
                >
                  {title}
                </SheetTitle>
              </PageHeader.Heading>
              {actions ? <PageHeader.Actions>{actions}</PageHeader.Actions> : null}
            </PageHeader>
            {id != null || status || subtitle || facts ? (
              <Stack space="space.100">
                {id != null || status ? (
                  <div className="flex min-w-0 flex-wrap items-center gap-100">
                    {id != null ? (
                      <Id className="break-words font-body-small text-subtle">{id}</Id>
                    ) : null}
                    {status}
                  </div>
                ) : null}
                {subtitle ? <SheetDescription>{subtitle}</SheetDescription> : null}
                {facts ? <Fact.Group>{facts}</Fact.Group> : null}
              </Stack>
            ) : null}
            {children}
          </Stack>
        </div>
        {links ? (
          <SheetFooter>
            <div className="flex w-full min-w-0 flex-wrap items-center gap-200 font-body">
              {links}
            </div>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
