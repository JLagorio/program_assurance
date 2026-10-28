import type { ComponentProps } from "react";
import { cn } from "../lib/cn";

export type MatchTextProps = Omit<ComponentProps<"span">, "children"> & {
  text: string;
  /** Literal terms, never HTML or regular expressions. A string is one complete phrase. */
  query: string | readonly string[];
  matchCase?: boolean | undefined;
};
/** Plain text with nonoverlapping semantic marks. Text, punctuation and whitespace are preserved. */
export function MatchText({ text, query, matchCase = false, className, ...props }: MatchTextProps) {
  const terms = [...new Set((typeof query === "string" ? [query] : query).filter(Boolean))].sort(
    (a, b) => b.length - a.length,
  );
  const expression = terms.length
    ? new RegExp(
        terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
        matchCase ? "gu" : "giu",
      )
    : null;
  const pieces = [];
  let start = 0;
  if (expression)
    for (const match of text.matchAll(expression)) {
      const index = match.index;
      if (index > start) pieces.push(text.slice(start, index));
      pieces.push(
        <mark key={index} data-slot="match-text-highlight" className="bg-selected text-default">
          {match[0]}
        </mark>,
      );
      start = index + match[0].length;
    }
  pieces.push(text.slice(start));
  return (
    <span {...props} className={cn("break-words", className)} data-slot="match-text">
      {pieces}
    </span>
  );
}
