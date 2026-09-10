import { X } from "lucide-react";
import { useId, type ReactNode } from "react";

import { IconButton } from "../components/button";
import { Id } from "../components/id";
import { Eyebrow } from "../components/typography";

/* A rail beside a table: a panel with the key, the summary and the way to the full record. The
   rail's head is the compact record header the PreviewSheet
   also draws (the Preview eyebrow, the id, one status; the title; the meta line) so a record reads
   the same on every rung, and the way to the record is a link, never a button. */

export type PreviewRailProps = {
  /** The record's id, beside the Preview eyebrow. It names the landmark. */
  id: ReactNode;
  /** The record's name, an h2 under the eyebrow. */
  title?: ReactNode;
  /** The record's meta line under the title: kind, path, owner. */
  subtitle?: ReactNode;
  /** One status, after the id. A Badge or an Indicator. */
  status?: ReactNode;
  /** The close, at the end of the eyebrow's line. */
  onClose: () => void;
  /** The TextLink to the full record: "Open finding". The rail is a preview, never the record. */
  openTo?: ReactNode;
  /** Focused record content, including editable properties or actions useful beside the list. */
  children: ReactNode;
};

/** The rail beside an index table: a preview of the chosen row, never the record itself. */
export function PreviewRail({
  id,
  title,
  subtitle,
  status,
  onClose,
  openTo,
  children,
}: PreviewRailProps) {
  const labelId = useId();
  return (
    <aside
      aria-labelledby={labelId}
      className="flex flex-col gap-150 border-t border-default pt-200 lg:border-s lg:border-t-0 lg:ps-300 lg:pt-0"
    >
      <div className="flex flex-col gap-075">
        <div className="flex items-center gap-100">
          <div id={labelId} className="flex items-center gap-100">
            <Eyebrow>Preview</Eyebrow>
            <Id className="font-body-small text-subtle">{id}</Id>
          </div>
          {status ? <span className="flex shrink-0 items-center">{status}</span> : null}
          <span className="ms-auto flex shrink-0 items-center">
            <IconButton label="Close" variant="subtle" size="small" onClick={onClose} icon={<X />} />
          </span>
        </div>
        {title || subtitle ? (
          <div className="flex flex-col gap-025">
            {title ? <h2 className="font-body font-medium text-default">{title}</h2> : null}
            {subtitle ? <p className="font-body-small text-subtle">{subtitle}</p> : null}
          </div>
        ) : null}
        {openTo ? <div className="font-body">{openTo}</div> : null}
      </div>
      <div>{children}</div>
    </aside>
  );
}
