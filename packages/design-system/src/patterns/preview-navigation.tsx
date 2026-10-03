import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { IconButton, ReasonTooltip, labelAndReason } from "../components/button";
import { LinkIconButton } from "../components/link-button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/tooltip";
import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";

/** How long the status waits after it mounts before it speaks: a region is not heard until assistive technology has seen it empty. */
const REGION_SETTLE = 100;

/**
 * The group's native props, `className` and `ref` reach the group. Its name is the locale's
 * "Record navigation" unless the caller passes an `aria-label`; its role stays `group`.
 */
export type PreviewNavigationProps = Omit<ComponentProps<"div">, "children" | "role"> & {
  /** One-based position in the displayed results; zero means outside those results. */
  position: number;
  /** How many records the displayed results hold: every filtered, sorted row, not one table page. */
  total: number;
  onPrevious?: (() => void) | undefined;
  onNext?: (() => void) | undefined;
  /**
   * The shown record's name, said with its position when the preview opens and on each step
   * ("Access review evidence, 2 of 6 records"), so the reader hears which record arrived.
   */
  recordLabel?: string | undefined;
  /**
   * Shows the position ("2 of 6") before the buttons, and "Not in results" while the record is
   * outside them. Off by default: the position is always announced, and while the record is
   * outside the results each button says so in its tooltip.
   */
  showPosition?: boolean | undefined;
  /**
   * A real anchor/router link to the full record, opened in a new tab. The application owns the
   * destination. Leave it out for a preview inside a selection task (RecordBrowser, PickerSheet),
   * whose preview belongs to the task and opens no record of its own.
   */
  openLink?:
    | ReactElement<{
        children?: ReactNode;
        className?: string;
        "aria-label"?: string;
        title?: string;
      }>
    | undefined;
};

/** Consistent collection navigation for a preview header. No routing or row state lives here. */
export function PreviewNavigation({
  position,
  total,
  onPrevious,
  onNext,
  recordLabel,
  showPosition = false,
  openLink,
  className,
  ...props
}: PreviewNavigationProps) {
  const { t, formatNumber } = useLedgerLocale();
  const reasonId = useId();
  const outside = position <= 0;
  const values = {
    position: formatNumber(position),
    total: formatNumber(total),
    record: recordLabel ?? "",
  };
  const message = outside
    ? recordLabel
      ? t("recordOutsideResultsNamed", values)
      : t("recordOutsideResults")
    : recordLabel
      ? t("recordPositionNamed", values)
      : t("recordPosition", values);
  // A status that mounts with its words already in it is not heard, so the preview's first record
  // would pass in silence: the region mounts empty and speaks once it has settled, or at the first
  // step, whichever comes first.
  const initial = useRef({ position, total, recordLabel });
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(true), REGION_SETTLE);
    return () => clearTimeout(timer);
  }, []);
  const speaking =
    settled ||
    initial.current.position !== position ||
    initial.current.total !== total ||
    initial.current.recordLabel !== recordLabel;
  // Outside the results neither step can run; each button says why when it is focused, hovered
  // or tapped.
  const reason = outside ? t("recordOutsideResults") : undefined;
  /*
   * A step that cannot run stays a focusable button that says it is unavailable (`aria-disabled`)
   * and does nothing, rather than turning disabled under the reader's finger: a repeated Enter at
   * the end stays put instead of walking back, Tab still finds both buttons, and Escape still
   * reaches the panel or sheet around them, which a Base UI disabled button would swallow.
   */
  const step = (
    label: string,
    icon: ReactElement,
    available: boolean,
    action: (() => void) | undefined,
  ) => {
    const button = (
      <IconButton
        label={label}
        variant="subtle"
        icon={icon}
        isTooltipDisabled
        {...(available
          ? {}
          : {
              "aria-disabled": true,
              "data-disabled": "",
              "aria-describedby": reason ? reasonId : undefined,
            })}
        className={available ? undefined : "cursor-not-allowed"}
        onClick={() => {
          if (available) action?.();
        }}
      />
    );
    return reason ? (
      <ReasonTooltip trigger={button}>{labelAndReason(label, reason)}</ReasonTooltip>
    ) : (
      <Tooltip>
        <TooltipTrigger render={button} />
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    );
  };
  return (
    <div
      aria-label={t("recordNavigation")}
      {...props}
      role="group"
      className={cn("flex items-center gap-050", className)}
      data-slot="preview-navigation"
    >
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {speaking ? message : null}
      </span>
      {reason ? (
        <span id={reasonId} hidden>
          {reason}
        </span>
      ) : null}
      {showPosition ? (
        // Drawn for sighted readers; the status above says the same words to everyone else.
        <span
          aria-hidden="true"
          data-slot="preview-navigation-position"
          className="whitespace-nowrap px-050 font-body-small tabular-nums text-subtle"
        >
          {outside ? t("recordNotInResults") : t("recordPositionShort", values)}
        </span>
      ) : null}
      {step(
        t("previousRecord"),
        <ChevronLeft className="rtl:rotate-180" />,
        position > 1 && Boolean(onPrevious),
        onPrevious,
      )}
      {step(
        t("nextRecord"),
        <ChevronRight className="rtl:rotate-180" />,
        !outside && position < total && Boolean(onNext),
        onNext,
      )}
      {openLink ? (
        <LinkIconButton
          render={openLink}
          label={t("openFullRecord")}
          variant="subtle"
          icon={<ExternalLink />}
        />
      ) : null}
    </div>
  );
}
