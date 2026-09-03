import type { ReactNode } from "react";

import { Id } from "../components/id";
import { KeyValue } from "../components/key-value";
import { Text } from "../primitives/text";

/**
 * The hover rung's body: what a HoverCard shows for a record. The id and one status on the first
 * line, the title, a meta line, at most four facts. Facts only, no actions: the click is the peek
 * (PreviewSheet) and the footer link there is the record. A record reads the same on every rung
 * because the same parts draw it; this is the smallest of them.
 */
export function Glance({
  id,
  title,
  meta,
  status,
  facts = [],
}: {
  id: ReactNode;
  title: ReactNode;
  /** The record's meta line: kind, path, owner. */
  meta?: ReactNode;
  /** One status, right of the id. A Badge or an Indicator. */
  status?: ReactNode;
  /** At most four; the rest belong to the peek. */
  facts?: { label: string; value: ReactNode }[];
}) {
  return (
    <div className="flex flex-col gap-100">
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
        <dl className="flex flex-col">
          {facts.slice(0, 4).map((f) => (
            <KeyValue key={f.label} label={f.label} labelWidth={88}>
              {f.value}
            </KeyValue>
          ))}
        </dl>
      ) : null}
    </div>
  );
}
