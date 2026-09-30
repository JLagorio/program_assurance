import { ArrowLeft, X } from "lucide-react";
import {
  cloneElement,
  useLayoutEffect,
  useRef,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from "react";
import { Fact, IconButton, Id } from "../components";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  type SheetContentProps,
} from "../components/sheet";
import { TextLink } from "../components/text-link";
import { token } from "../generated/tokens";
import { PageHeader } from "../layout/page-header";
import { useLedgerLocale } from "../lib/locale";
import { Stack } from "../primitives/stack";

/** A link element for the sheet's fallback full-record destination. */
type PreviewSheetLink = ReactElement<{ children?: ReactNode }>;

type PreviewSheetBaseProps = {
  open: boolean;
  /** Close and Escape: dismiss the whole preview, every frame, and return focus to the opener. */
  onClose: () => void;
  /** Back to the previous frame of the stack: the only control that pops one frame. */
  onBack?: (() => void) | undefined;
  /**
   * Where Back sends focus: the control in the parent frame that opened this one, read once the
   * parent frame shows. Without it, focus stays on Back while there is one, else goes to the
   * parent frame's title.
   */
  backFocus?: RefObject<HTMLElement | null> | undefined;
  /** The record's id, beside its status in the body metadata. */
  id?: ReactNode | undefined;
  /** The record's name in the inner record header; also names the modal. */
  title: ReactNode;
  /** The record's meta line: kind, path, owner. */
  subtitle?: ReactNode;
  /** One status, beside the id. A Badge or an Indicator. */
  status?: ReactNode;
  /** At most three Facts under the meta line: the ones the reader acts on. */
  facts?: ReactNode;
  /** Related destination TextLinks in the footer. Do not repeat the full-record link. */
  links?: ReactNode;
  /** Record commands in the inner PageHeader.Actions, beside the title. Use small controls. */
  actions?: ReactNode;
  /** Pixels, 720 by default (`dimension.part.previewSheet`): about half the screen. */
  width?: number | undefined;
  /** Native focus overrides for workflows whose opener disappears or whose first task is an input. */
  initialFocus?: SheetContentProps["initialFocus"];
  finalFocus?: SheetContentProps["finalFocus"];
  /** Focused record content, editable properties or actions. */
  children: ReactNode;
};

/**
 * Where the full record is reached from the outer header: PreviewNavigation's link in
 * `navigation`, or `openTo` when there is no navigation.
 */
type PreviewSheetDestinationProps =
  | {
      /** Global collection navigation in the outer header, before Close. Includes the full-record link. */
      navigation?: ReactNode;
      /** Full-record link in the outer header when navigation is absent. Empty children default to "Open the full record". */
      openTo: PreviewSheetLink;
    }
  | {
      navigation: ReactElement;
      openTo?: undefined;
    };

/**
 * Modal record details. Base UI owns focus containment, Escape and focus return.
 * Callers own related-record navigation and any work performed in the sheet.
 */
export type PreviewSheetProps = PreviewSheetBaseProps & PreviewSheetDestinationProps;

export function PreviewSheet({
  open,
  onClose,
  onBack,
  backFocus,
  id,
  title,
  navigation,
  subtitle,
  status,
  facts,
  openTo,
  links,
  actions,
  width,
  initialFocus,
  finalFocus,
  children,
}: PreviewSheetProps) {
  const { t } = useLedgerLocale();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  // Set when Back is pressed: the frame it left, and where focus goes once the parent frame shows.
  const leaving = useRef<{ title: ReactNode; target: RefObject<HTMLElement | null> | undefined }>(
    null,
  );
  const hasBack = Boolean(onBack);
  const shown = useRef({ title, open });
  useLayoutEffect(() => {
    const { title: previousTitle, open: wasOpen } = shown.current;
    shown.current = { title, open };
    const heading = titleRef.current;
    const focused = heading?.ownerDocument.activeElement;
    const left = leaving.current;
    if (!left) {
      // A frame that replaced the control that opened it (a link in the body) leaves focus on
      // nothing: the new frame's title takes it, as the first frame's does.
      if (wasOpen && open && previousTitle !== title && focused === heading?.ownerDocument.body)
        heading?.focus();
      return;
    }
    // The parent frame shows once the title changes or Back goes with the frame that had it.
    if (left.title === title && hasBack) return;
    leaving.current = null;
    const target = left.target?.current;
    if (target?.isConnected) {
      target.focus();
      return;
    }
    if (!backRef.current || focused !== backRef.current) heading?.focus();
  });
  // TextLink's render element owns children, even when explicitly undefined.
  // Fill the default before composition so an empty router link stays named.
  const open_ = !openTo
    ? undefined
    : openTo.props.children
      ? openTo
      : cloneElement(openTo, { children: t("openTheFullRecord") });
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          leaving.current = null;
          onClose();
        }
      }}
    >
      <SheetContent
        side="end"
        showCloseButton={false}
        style={{ maxWidth: width ?? token("dimension.part.previewSheet") }}
        initialFocus={initialFocus ?? titleRef}
        finalFocus={finalFocus}
      >
        <SheetHeader className="flex-row items-center gap-050 pe-200">
          {onBack ? (
            <IconButton
              ref={backRef}
              label={t("backToPreviousRecord")}
              variant="subtle"
              icon={<ArrowLeft className="rtl:rotate-180" />}
              onClick={() => {
                leaving.current = { title, target: backFocus };
                onBack();
              }}
            />
          ) : null}
          <div className="flex min-w-0 flex-1 items-center justify-end">
            {navigation || (open_ ? <TextLink weight="medium" render={open_} /> : null)}
          </div>
          {/* Close is the X every Sheet and Dialog closes with, and like theirs it has no tooltip:
              Escape on it closes the sheet at once instead of a tooltip first. */}
          <SheetClose
            render={
              <IconButton label={t("close")} variant="subtle" icon={<X />} isTooltipDisabled />
            }
          />
        </SheetHeader>
        <SheetBody>
          <Stack space="space.250">
            <PageHeader>
              <PageHeader.Heading>
                {/* The record's name is the sheet's title, its h2, and names the modal. */}
                <PageHeader.Title
                  ref={titleRef}
                  tabIndex={-1}
                  className="outline-none"
                  render={<SheetTitle />}
                >
                  {title}
                </PageHeader.Title>
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
        </SheetBody>
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
