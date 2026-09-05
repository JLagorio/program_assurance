import { useId, type CSSProperties, type ReactNode } from "react";

import { Dot, type Tone } from "../components/badge";
import { Id } from "../components/id";
import { Item } from "../components/item";

/* Master-detail as mail clients draw it: the list on the start side holds still and is the
   navigation, the detail on the end side changes, and choosing never leaves the page. A list
   column at
   `dimension.layout.list`, its rows Items that select in place, the chosen one marked, and the
   detail beside it. */

export type WorkPaneProps = {
  /** Above the list, staying put while the list scrolls: what the list is, and how many. It names the list's landmark. */
  listLabel?: ReactNode;
  /** The rows: WorkPane.Row, or Items that select in place. They stack in one list. */
  list: ReactNode;
  /** The detail of the chosen row, beside the list. */
  detail: ReactNode;
  /** What the detail shows when nothing is chosen: an Empty. */
  empty?: ReactNode;
  /** The list column in pixels, `dimension.layout.list` (340) by default: narrower for a list of short names. */
  listWidth?: number | undefined;
};

/** Master-detail. The list is the navigation and holds still; selecting never leaves the page. */
function WorkPaneRoot({ list, detail, listLabel, empty, listWidth }: WorkPaneProps) {
  const labelId = useId();
  const style = listWidth
    ? ({ "--ds-dimension-layout-list": `${listWidth}px` } as CSSProperties)
    : undefined;
  return (
    <div className="grid min-h-work grid-cols-1 lg:grid-cols-list-detail" style={style}>
      <aside
        aria-labelledby={listLabel ? labelId : undefined}
        aria-label={listLabel ? undefined : "List"}
        className="lg:sticky-rail lg:overflow-y-auto lg:border-e lg:border-default lg:pe-200"
      >
        {listLabel ? (
          <div id={labelId} className="sticky top-0 z-10 bg-surface-current pb-100 pt-025">
            {listLabel}
          </div>
        ) : null}
        <Item.Group size="compact">{list}</Item.Group>
      </aside>
      <div className="min-w-0 lg:ps-300">{detail ?? empty}</div>
    </div>
  );
}

export type WorkPaneRowProps = {
  /** The record's id, under the title with the meta. */
  id: ReactNode;
  /** The row's name, one line. */
  title: ReactNode;
  /** After the id, subtle: the state as a word, the method, how long ago. */
  meta?: ReactNode;
  /** The Dot before the title: the row's state as a colour. The meta carries the word. */
  tone?: Tone | undefined;
  /** The row whose detail is open. */
  isActive?: boolean | undefined;
  onSelect: () => void;
};

/** One row in a WorkPane list: an Item that selects in place, with a Dot for the state and the id under the title. */
function WorkPaneRow({ id, title, meta, tone = "neutral", isActive, onSelect }: WorkPaneRowProps) {
  return (
    <Item
      leading={<Dot tone={tone} />}
      title={title}
      description={
        <span className="flex min-w-0 items-baseline gap-100">
          <Id>{id}</Id>
          {meta ? <span className="truncate">{meta}</span> : null}
        </span>
      }
      onSelect={onSelect}
      isActive={isActive}
    />
  );
}

export const WorkPane = Object.assign(WorkPaneRoot, { Row: WorkPaneRow });
