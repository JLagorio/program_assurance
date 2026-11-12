import { useRender } from "@base-ui/react/use-render";
import { ChevronRight } from "lucide-react";
import {
  useId,
  type ComponentProps,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn";
import { useLedgerLocale } from "../lib/locale";
import { Heading } from "../primitives/heading";
import {
  HeadingLevelScope,
  headingTag,
  nextHeadingLevel,
  useHeadingLevel,
} from "../primitives/heading-level";
import { VisuallyHidden } from "../primitives/visually-hidden";
import { Skeleton } from "./skeleton";

/** `neutral` is the sunken surface; `danger` is the bold fill, for the one count on a screen that cannot wait. */
export type TrayTone = "neutral" | "danger";

export type TrayProps = Omit<ComponentProps<"div">, "title" | "role"> & {
  /** What the tray holds. With `value` it is the words after the number, so the heading reads as one count: "monitored devices" under `value={20}` is "20 monitored devices". */
  title: ReactNode;
  /** The count the heading leads with. A number is written in the reader's locale; a string shows as given. Zero reads muted on the neutral tray. */
  value?: ReactNode;
  /** Before the heading: an `Icon` for the kind of thing the tray holds. Decoration, since the title says it. */
  icon?: ReactNode;
  /** A link element (a router's Link, or `<a href>`) that becomes the heading's text, with a chevron after it: the heading opens the register the tray counts. */
  link?:
    | ReactElement<{
        className?: string | undefined;
        children?: ReactNode;
      }>
    | undefined;
  /** At the heading's end: a key for what the tray holds, one figure, a link. It takes the next row when the heading needs the width. */
  action?: ReactNode;
  /** `danger` fills the tray with the bold danger colour and draws its heading on it. One a screen at most. @default "neutral" */
  tone?: TrayTone | undefined;
  /** The count is on its way: a Skeleton holds its place in the heading, the tray is `aria-busy`, and a screen reader hears "Loading". */
  isLoading?: boolean | undefined;
  /** What the tray holds, stacked `space.075` apart: Cards, a Stat.List, a Grid of either. Each child draws its own raised surface. */
  children?: ReactNode;
};

/** The surface a tray's children read, so a tile that paints the current surface paints the tray's. */
const sunkenSurface = {
  "--ds-utility-elevation-surface-current": "var(--ds-elevation-surface-sunken)",
} as CSSProperties;

const isZero = (value: ReactNode) => value === 0 || value === "0";

/**
 * A sunken surface that holds raised cards under one heading, and the heading is a count: "20
 * monitored devices", "2 frameworks". It groups what belongs to one number, where a Section only
 * titles a block: the tray's edge says which cards the heading counts. A named group, never a
 * landmark. Its heading takes the contextual level (an h2 outside every HeadingLevelProvider) and
 * what it holds one level below.
 */
export function Tray({
  title,
  value,
  icon,
  link,
  action,
  tone = "neutral",
  isLoading,
  className,
  style,
  children,
  ...props
}: TrayProps) {
  const { formatNumber, t } = useLedgerLocale();
  const titleId = useId();
  const level = useHeadingLevel() ?? 2;
  const bold = tone === "danger";
  const shown = isLoading ? (
    <>
      <Skeleton width={24} className="inline-block align-middle" />
      <VisuallyHidden>{t("loading")}</VisuallyHidden>
    </>
  ) : typeof value === "number" && Number.isFinite(value) ? (
    formatNumber(value)
  ) : (
    value
  );
  const words = (
    <>
      {value !== undefined || isLoading ? (
        <>
          <span
            data-slot="tray-value"
            className={cn("tabular-nums", !bold && !isLoading && isZero(value) && "text-subtlest")}
          >
            {shown}
          </span>{" "}
        </>
      ) : null}
      {title}
    </>
  );
  const linked = useRender({
    defaultTagName: "a",
    render: link,
    enabled: Boolean(link),
    props: {
      className:
        "group/tray-link inline-flex min-w-0 items-center gap-050 rounded-xsmall outline-none hover:underline focus-visible:outline-focused",
      children: (
        <>
          <span className="min-w-0 break-words">{words}</span>
          <ChevronRight
            aria-hidden
            className={cn(
              "size-icon-small shrink-0 rtl:rotate-180",
              bold ? "text-inverse" : "icon-subtle",
            )}
          />
        </>
      ),
      ...{ "data-slot": "tray-link" },
    },
  });
  return (
    <div
      {...props}
      role="group"
      aria-labelledby={titleId}
      aria-busy={isLoading ? true : props["aria-busy"]}
      data-slot="tray"
      data-tone={tone}
      className={cn(
        "flex min-w-0 flex-col gap-075 rounded-xlarge p-075",
        bold ? "bg-danger-bold" : "bg-surface-sunken",
        className,
      )}
      style={{ ...sunkenSurface, ...style }}
    >
      <div
        data-slot="tray-header"
        className="flex min-w-0 flex-wrap items-center justify-between gap-x-150 gap-y-050 px-100 pt-050"
      >
        <span className="flex min-w-0 items-center gap-100">
          {icon ? (
            <span
              data-slot="tray-icon"
              className={cn("flex shrink-0 items-center", bold ? "text-inverse" : "icon-subtle")}
            >
              {icon}
            </span>
          ) : null}
          <Heading
            size="section"
            as={headingTag(level)}
            id={titleId}
            data-slot="tray-title"
            className={cn("min-w-0 break-words", bold ? "text-inverse" : "text-default")}
          >
            {link ? linked : words}
          </Heading>
        </span>
        {action ? (
          <span
            data-slot="tray-action"
            className={cn(
              "flex min-w-0 flex-wrap items-center justify-end gap-100 font-body-small",
              bold ? "text-inverse" : "text-subtle",
            )}
          >
            {action}
          </span>
        ) : null}
      </div>
      {children ? (
        <div data-slot="tray-content" className="flex min-w-0 flex-col gap-075">
          <HeadingLevelScope level={nextHeadingLevel(level)}>{children}</HeadingLevelScope>
        </div>
      ) : null}
    </div>
  );
}
