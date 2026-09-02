import type { ReactNode } from "react";

import { Id } from "../components/id";
import { Eyebrow } from "../components/typography";

/** The right rail is a preview surface only, never the record itself. */
export function PreviewRail({ id, title, onClose, openTo, children }: { id: ReactNode; title?: ReactNode; onClose: () => void; openTo?: ReactNode; children: ReactNode }) {
  return (
    <aside className="flex flex-col gap-150 border-t border-default pt-200 lg:border-s lg:border-t-0 lg:ps-300 lg:pt-0">
      <div className="flex flex-col gap-075">
        <div className="flex items-center gap-100">
          <Eyebrow>Preview</Eyebrow>
          <Id className="font-body-small text-subtle">{id}</Id>
          <button type="button" onClick={onClose} className="ms-auto rounded-xsmall font-body-small text-subtle outline-none transition-colors duration-fast ease-standard hover:text-default focus-visible:outline-focused">
            Close
          </button>
        </div>
        {title ? <h2 className="font-body font-medium text-default">{title}</h2> : null}
        {openTo ? <div className="font-body">{openTo}</div> : null}
      </div>
      <div>{children}</div>
    </aside>
  );
}
