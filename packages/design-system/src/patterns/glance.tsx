import type { ReactNode } from "react";

import { Id } from "../components/id";
import { Grid, Inline, Stack } from "../primitives";

/**
 * One record type's preview body, drawn once and shown by every shell. `glance` is the hover rung: the
 * id and one status on the eyebrow line, the title, the meta line, then at most four KeyValue rows in one
 * column, facts only. `peek` is the top of a PreviewSheet's body: the sheet's own header already carries
 * the id, status, title and meta, so the caller passes only the rows and they sit in two columns.
 */
export function Glance({
  id,
  status,
  title,
  meta,
  density = "glance",
  children,
}: {
  id?: ReactNode;
  /** One status, at the end of the eyebrow line. A Badge or an Indicator. */
  status?: ReactNode;
  /** Omitted at `peek` density: the PreviewSheet's header is the same line. */
  title?: ReactNode;
  /** The record's meta line: kind, path, owner. */
  meta?: ReactNode;
  density?: "glance" | "peek" | undefined;
  /** KeyValue rows: at most four at a glance. */
  children: ReactNode;
}) {
  return (
    <Stack space="space.100">
      {title ? (
        <Stack space="space.025">
          <Inline space="space.100" alignBlock="center" spread="space-between">
            <Id className="font-body-small text-subtle">{id}</Id>
            {status}
          </Inline>
          <span className="truncate font-body font-medium text-default">{title}</span>
          {meta ? <span className="truncate font-body-small text-subtle">{meta}</span> : null}
        </Stack>
      ) : null}
      <Grid
        as="dl"
        columnGap="space.300"
        templateColumns={density === "peek" ? "repeat(2, minmax(0, 1fr))" : "minmax(0, 1fr)"}
      >
        {children}
      </Grid>
    </Stack>
  );
}
