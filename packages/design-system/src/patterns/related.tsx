import { useRender } from "@base-ui/react/use-render";
import { Link2 } from "lucide-react";
import { Children, useId, type ReactElement, type ReactNode } from "react";

import { Count } from "../components/badge";
import { Item, type ItemSize } from "../components/item";
import { KeyValue } from "../components/key-value";
import { cn } from "../lib/cn";
import { Card } from "../components/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../components/empty";

/* On the body of a page, a card per related record: a header with the kind, the count and the
   way to add one; the record's name as the link, up to six properties under it, and the actions
   in a menu that shows on hover; "view all" at the bottom. In a rail, one row per record. A card
   that carries actions of its own cannot be one click target, so the title is the link and the
   actions are separate stops, in both layouts. */

export type RelatedLayout = "list" | "cards";

/** What a Related card says when nothing is linked: a title alone, or an Empty's title, line, action and icon. */
export type RelatedEmpty =
  | string
  | {
      title: string;
      description?: string | undefined;
      action?: ReactNode;
      secondary?: ReactNode;
      icon?: ReactNode;
    };

export type RelatedProps = {
  /** The kind of record linked, a noun: "Linked findings", "Systems", "Team". */
  title: ReactNode;
  /** A Count after the title: how many are linked. */
  count?: number | undefined;
  /** At the end of the heading's line: one small button ("Link", "Add") or a TextLink. */
  action?: ReactNode;
  /** Under the rows, after a rule: "See all 14" as a TextLink when the card shows a handful of many. */
  footer?: ReactNode;
  /** `list`: an Item row per record, for a rail. `cards`: a grid of Related.Card, for the body of a page. */
  layout?: RelatedLayout | undefined;
  /** The list's row height, `compact` by default; `default` beside a page's body. */
  size?: ItemSize | undefined;
  /** What to show when nothing is linked, drawn as a compact Empty with a link icon: "Nothing linked yet" by default. */
  empty?: RelatedEmpty | undefined;
  className?: string | undefined;
  /** Item rows in the list layout; Related.Card in the cards layout. */
  children?: ReactNode;
};

/** A card of linked records: a header with the kind, the count and the way to add one; rows in a rail, cards in the body of a page; a proper empty state when there are none. */
function RelatedRoot({
  title,
  count,
  action,
  footer,
  layout = "list",
  size = "compact",
  empty = "Nothing linked yet",
  className,
  children,
}: RelatedProps) {
  const headingId = useId();
  const has = Children.toArray(children).some(Boolean);
  const emptyProps: Exclude<RelatedEmpty, string> =
    typeof empty === "string" ? { title: empty } : empty;
  const emptyIcon = "icon" in emptyProps ? emptyProps.icon : <Link2 />;
  return (
    <Card className={cn("flex flex-col", className)}>
      <div className="flex items-center gap-100 border-b border-default px-200 py-100">
        <h3 id={headingId} className="min-w-0 truncate font-body font-semibold text-default">
          {title}
        </h3>
        {count !== undefined ? <Count value={count} /> : null}
        {action ? (
          <span className="ms-auto flex shrink-0 items-center gap-100">{action}</span>
        ) : null}
      </div>
      {!has ? (
        <div className="px-200 py-150">
          <Empty size="compact">
            {emptyIcon ? (
              <EmptyMedia variant="icon" aria-hidden>
                {emptyIcon}
              </EmptyMedia>
            ) : null}
            <EmptyHeader>
              <EmptyTitle>{emptyProps.title}</EmptyTitle>
              {emptyProps.description ? (
                <EmptyDescription>{emptyProps.description}</EmptyDescription>
              ) : null}
            </EmptyHeader>
            {emptyProps.action || emptyProps.secondary ? (
              <EmptyContent>
                {emptyProps.action}
                {emptyProps.secondary}
              </EmptyContent>
            ) : null}
          </Empty>
        </div>
      ) : layout === "cards" ? (
        <ul
          aria-labelledby={headingId}
          className="grid gap-150 p-200 stagger-children"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}
        >
          {children}
        </ul>
      ) : (
        <div className="py-050">
          <Item.Group labelledBy={headingId} size={size} flush>
            {children}
          </Item.Group>
        </div>
      )}
      {footer ? (
        <div className="flex items-center border-t border-default px-200 py-100 font-body-small">
          {footer}
        </div>
      ) : null}
    </Card>
  );
}

export type RelatedCardProps = {
  /** The mark before the title, 32px: a medium Avatar, square for a thing and round for a person. It spans the title and the meta line. */
  leading?: ReactNode;
  /** The record's name. With `link`, it is the link. */
  title: ReactNode;
  /** A link element (a router's Link) that becomes the title. Leave it empty to use title; supplied children override the link text. */
  link?:
    | ReactElement<{
        className?: string | undefined;
        children?: ReactNode;
      }>
    | undefined;
  /** Under the title, subtle: kind, path, owner. */
  meta?: ReactNode;
  /** One status at the start of the meta line: a Badge or an Indicator. */
  status?: ReactNode;
  /** Label and value pairs under the head: the properties the reader decides by. Four fit; six is the most. */
  properties?: { label: string; value: ReactNode }[] | undefined;
  /** Icon buttons at the top end, shown on hover, on focus and always on a touch screen, their space kept so nothing shifts: open in a new tab, unlink, more. Never the way to the record; the title is. */
  actions?: ReactNode;
  className?: string | undefined;
  /** A line under the properties: a row of Badges, a sentence. */
  children?: ReactNode;
};

/** One linked record as a card, in a Related with `layout="cards"`: the mark, the name as the link, the meta, one status, a few properties, and the actions that show on hover. */
function RelatedCard({
  leading,
  title,
  link,
  meta,
  status,
  properties,
  actions,
  className,
  children,
}: RelatedCardProps) {
  const text = <span className="block truncate">{title}</span>;
  const titleClass = "block min-w-0 font-body font-medium text-default";
  const titleEl = useRender({
    defaultTagName: "span",
    render: link,
    props: {
      className: cn(
        titleClass,
        link && "rounded-xsmall outline-none hover:underline focus-visible:outline-focused",
      ),
      children: text,
    },
  });
  return (
    <li
      className={cn(
        "group/card flex list-none flex-col gap-100 rounded-large border border-default bg-surface-raised p-150 transition-shadow duration-fast ease-standard animate-rise hover:shadow-raised",
        className,
      )}
    >
      <div className="flex items-center gap-100">
        {leading ? <span className="flex shrink-0 items-center">{leading}</span> : null}
        <div className="flex min-w-0 flex-1 flex-col gap-025">
          {titleEl}
          {status || meta ? (
            <span className="flex min-w-0 items-center gap-100">
              {status ? <span className="flex shrink-0 items-center">{status}</span> : null}
              {meta ? (
                <span className="min-w-0 truncate font-body-small text-subtle">{meta}</span>
              ) : null}
            </span>
          ) : null}
        </div>
        {actions ? (
          <span className="flex h-250 shrink-0 items-center gap-025 opacity-0 transition-opacity duration-fast ease-standard focus-within:opacity-100 group-hover/card:opacity-100 has-[[data-state=open]]:opacity-100 pointer-coarse:opacity-100">
            {actions}
          </span>
        ) : null}
      </div>
      {properties?.length ? (
        <div className="flex flex-col gap-025">
          {properties.slice(0, 6).map((p) => (
            <KeyValue key={p.label} label={p.label} labelWidth={96}>
              {p.value}
            </KeyValue>
          ))}
        </div>
      ) : null}
      {children}
    </li>
  );
}

export const Related = Object.assign(RelatedRoot, { Card: RelatedCard });
