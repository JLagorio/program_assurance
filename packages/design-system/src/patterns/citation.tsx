import type { ReactNode } from "react";
import { Prose } from "../components/typography";
import { cn } from "../lib/cn";
import { RelatedCard, type RelatedCardProps } from "./related";

export type CitationProps = Omit<RelatedCardProps, "children"> & {
  /** Exact quoted source text. Prose renders it safely; no HTML is interpreted. */
  passage: string;
  /** Accessible name for the quoted passage, supplied in the reader's language. */
  passageLabel: string;
  /** Optional source URL for the semantic blockquote. This does not create a link. */
  cite?: string | undefined;
  /** Open/download actions and source-read failures, owned by the host. */
  source?: ReactNode;
  /** Links to the records that refer to this source. */
  backlinks?: ReactNode;
  /** A discussion or other supporting detail below the source actions. */
  children?: ReactNode;
};

/** A quoted source inside a Related cards collection, with source actions and backlinks. */
export function Citation({
  passage,
  passageLabel,
  cite,
  source,
  backlinks,
  children,
  className,
  ...props
}: CitationProps) {
  return (
    <RelatedCard {...props} className={cn("min-w-0", className)} data-citation="">
      <div className="flex min-w-0 flex-col gap-150">
        <blockquote cite={cite} aria-label={passageLabel} className="min-w-0">
          <Prose label={passageLabel}>{passage}</Prose>
        </blockquote>
        {source}
        {children}
        {backlinks && <div className="flex flex-wrap items-center gap-100">{backlinks}</div>}
      </div>
    </RelatedCard>
  );
}
