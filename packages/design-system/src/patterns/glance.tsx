import type { ComponentProps, ReactNode } from "react";

import { Id } from "../components/id";
import { cn } from "../lib/cn";
import { KeyValue } from "../components/key-value";
import { Text } from "../primitives/text";

/** A Glance takes its box's native props, `className` and `ref` too; `id` and `title` are the record's. */
export type GlanceProps = Omit<ComponentProps<"div">, "id" | "title" | "children"> & {
  /** The record's id, first on the first line. */
  id: ReactNode;
  /** The record's name, at most two lines. */
  title: ReactNode;
  /** The record's meta line: kind, path, owner. One line. */
  meta?: ReactNode;
  /** One status, at the end of the id's line. A Badge or an Indicator. */
  status?: ReactNode;
  /** At most four, label and value; the rest belong to the peek. */
  facts?: { label: string; value: ReactNode }[] | undefined;
};

/**
 * The hover rung's body: what a HoverCard shows for a record. The id and one status on the first
 * line, the title, a meta line, at most four facts. Facts only, no actions: the click is the peek
 * (PreviewSheet) and the footer link there is the record. A record reads the same on every rung
 * because the same parts draw it; this is the smallest of them.
 */
export function Glance({ id, title, meta, status, facts = [], className, ...props }: GlanceProps) {
  return (
    <div {...props} className={cn("flex min-w-0 flex-col gap-100", className)} data-slot="glance">
      <div className="flex flex-col gap-025">
        <div className="flex items-center gap-100">
          <Id className="font-body-small text-subtle">{id}</Id>
          {status ? <span className="ms-auto flex shrink-0 items-center">{status}</span> : null}
        </div>
        <Text weight="medium" maxLines={2}>
          {title}
        </Text>
        {meta ? (
          <Text size="small" color="color.text.subtle" maxLines={1}>
            {meta}
          </Text>
        ) : null}
      </div>
      {facts.length ? (
        <div className="flex flex-col">
          {facts.slice(0, 4).map((f) => (
            <KeyValue key={f.label} label={f.label} labelWidth="narrow">
              {f.value}
            </KeyValue>
          ))}
        </div>
      ) : null}
    </div>
  );
}
