import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

import { cn } from "../lib/cn";

/* The container: a framed block on the raised surface, with a header row when it needs a name and
   a body with the standard inset. Nothing in it is clickable as a whole: a card that opens is a
   row of an Item list. */

/** The raised surface, recorded for children that read the surface they sit on (sticky table headers). */
export const raisedSurface = {
  "--ds-utility-elevation-surface-current": "var(--ds-elevation-surface-raised)",
} as CSSProperties;

export type CardProps = {
  /** Card.Header, Card.Body, or a Table, a Chart, a list, each drawing its own inset. */
  children?: ReactNode;
  className?: string | undefined;
  style?: CSSProperties | undefined;
} & Omit<ComponentPropsWithoutRef<"div">, "children" | "className" | "style">;

/** A framed block on the raised surface. */
function CardRoot({ className, style, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-large border border-default bg-surface-raised",
        className,
      )}
      style={{ ...raisedSurface, ...style }}
      {...props}
    />
  );
}

export type CardHeaderProps = {
  /** The card's name, an h2 in `font.heading.xsmall`. */
  title: ReactNode;
  /** One line under the title, subtle: a count, a source, a constraint. */
  description?: ReactNode;
  /** At the end of the header's line: one small button, or a TextLink. */
  action?: ReactNode;
  className?: string | undefined;
};

/** A rule and a label at the top of a Card, separating its regions the way a page's sections are. */
function CardHeader({ title, description, action, className }: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-200 border-b border-default px-200 py-150",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-025">
        <h2 className="font-heading-xsmall text-default">{title}</h2>
        {description ? <p className="font-body text-subtle">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-100">{action}</div> : null}
    </div>
  );
}

export type CardBodyProps = {
  /** Text, facts, a form: content that needs the card's inset. A Table or a Chart goes in the Card directly. */
  children: ReactNode;
  className?: string | undefined;
};

/** The card's inset, `space.200` on every side, for content that does not draw its own. */
function CardBody({ children, className }: CardBodyProps) {
  return <div className={cn("p-200", className)}>{children}</div>;
}

export const Card = Object.assign(CardRoot, { Header: CardHeader, Body: CardBody });
