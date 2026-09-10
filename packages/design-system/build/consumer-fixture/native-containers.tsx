import { createRef } from "react";
import { Banner, Chart, Item, KeyValue, Stat, Stepper, Table, Tree } from "@ledger/design-system";

<Item
  ref={createRef<HTMLLIElement>()}
  title="Record"
  id="REC-1"
  aria-label="Record row"
  tabIndex={-1}
  style={{ maxWidth: 640 }}
  onFocus={(event) => {
    const row: HTMLLIElement = event.currentTarget;
    void row;
  }}
  isCollapsible
  onOpenChange={(_open, details) => details.cancel()}
  link={<a ref={createRef<HTMLAnchorElement>()} id="record-link" href="/record" />}
>
  Details
</Item>;
<Item.Group ref={createRef<HTMLDivElement>()} id="records" title="Records" data-report="records" />;
<Table
  ref={createRef<HTMLTableElement>()}
  frameRef={(frame) => {
    if (!frame) return;
    const observer = new ResizeObserver(() => {});
    observer.observe(frame);
    return () => observer.disconnect();
  }}
  aria-label="Records"
>
  <thead>
    <Table.Row ref={createRef<HTMLTableRowElement>()}>
      <Table.Header ref={createRef<HTMLTableCellElement>()}>Record</Table.Header>
    </Table.Row>
  </thead>
  <tbody>
    <Table.Row>
      <Table.Cell ref={createRef<HTMLTableCellElement>()}>REC-1</Table.Cell>
    </Table.Row>
  </tbody>
</Table>;
<Chart.Frame
  ref={createRef<HTMLElement>()}
  id="report"
  title="Report"
  tabIndex={-1}
  aria-describedby="report-description"
  style={{ maxWidth: 800 }}
  onFocus={(event) => {
    const figure: HTMLElement = event.currentTarget;
    void figure;
  }}
>
  <svg role="img" aria-label="Plot" />
</Chart.Frame>;
// @ts-expect-error Item refs target the row, not a generic div.
<Item ref={createRef<HTMLDivElement>()} title="Record" />;
// @ts-expect-error The table's scroll-frame ref is separate from its native table ref.
<Table ref={createRef<HTMLDivElement>()} />;
// @ts-expect-error A cell ref targets a native table cell.
<Table.Cell ref={createRef<HTMLDivElement>()} />;

<Tree
  ref={createRef<HTMLDivElement>()}
  id="hierarchy"
  label="Hierarchy"
  aria-describedby="help"
  style={{ maxWidth: 480 }}
  onFocusCapture={(event) => {
    const root: HTMLDivElement = event.currentTarget;
    void root;
  }}
>
  <Tree.Item
    ref={createRef<HTMLDivElement>()}
    depth={0}
    id="entry"
    title="Entry"
    aria-posinset={3}
    aria-setsize={10}
    onKeyDown={(event) => event.preventDefault()}
    onClick={(event) => event.preventDefault()}
    onSelect={() => {}}
  >
    Entry
  </Tree.Item>
</Tree>;
// @ts-expect-error Tree rows expose div refs.
<Tree.Item depth={0} ref={createRef<HTMLButtonElement>()}>
  Entry
</Tree.Item>;

<Stepper
  ref={createRef<HTMLOListElement>()}
  id="setup"
  label="Setup"
  aria-label="Program setup"
  className="gap-100"
  style={{ minWidth: 0 }}
  onFocus={(event) => {
    const list: HTMLOListElement = event.currentTarget;
    void list;
  }}
>
  <Stepper.Item
    ref={createRef<HTMLLIElement>()}
    id="program-step"
    value={2}
    title="Program details"
    state="current"
    label="Program"
    style={{ scrollMarginTop: 32 }}
    onClickCapture={(event) => event.preventDefault()}
    onSelect={() => {}}
  />
</Stepper>;
<Stat
  ref={createRef<HTMLDivElement>()}
  id="coverage"
  label="Coverage"
  value="80%"
  className="py-150"
  style={{ minWidth: 0 }}
  onFocus={(event) => {
    const stat: HTMLDivElement = event.currentTarget;
    void stat;
  }}
/>;
<Stat.Grid
  ref={createRef<HTMLDivElement>()}
  id="metrics"
  role="group"
  aria-label="Metrics"
  style={{ backgroundColor: "transparent" }}
>
  <Stat.Tile
    ref={createRef<HTMLDivElement>()}
    id="blocked"
    label="Blocked"
    value={0}
    note="None waiting"
    className="py-200"
    style={{ minWidth: 0 }}
  />
</Stat.Grid>;
<KeyValue
  ref={createRef<HTMLDListElement>()}
  id="owner"
  label="Owner"
  title="Record owner"
  className="py-075"
  style={{ gridTemplateColumns: "120px 1fr" }}
  onFocus={(event) => {
    const fact: HTMLDListElement = event.currentTarget;
    void fact;
  }}
>
  Dana Whitfield
</KeyValue>;
<Banner
  ref={createRef<HTMLDivElement>()}
  id="notice"
  tone="information"
  role="region"
  aria-label="Catalogue notice"
  aria-live="off"
  style={{ maxWidth: 720 }}
  onClick={(event) => {
    const notice: HTMLDivElement = event.currentTarget;
    void notice;
  }}
  action={
    <a
      ref={createRef<HTMLAnchorElement>()}
      href="/catalogue"
      onClick={(event) => event.preventDefault()}
    >
      Review
    </a>
  }
>
  The catalogue changed.
</Banner>;
// @ts-expect-error Stepper refs target ordered lists.
<Stepper ref={createRef<HTMLDivElement>()}>Steps</Stepper>;
// @ts-expect-error Stepper.Item refs target list items.
<Stepper.Item ref={createRef<HTMLDivElement>()} state="current" label="Program" />;
// @ts-expect-error KeyValue refs target definition lists.
<KeyValue ref={createRef<HTMLDivElement>()} label="Owner">
  Dana
</KeyValue>;
// @ts-expect-error Stat uses its value slot, not arbitrary root children.
<Stat label="Coverage" value="80%">
  Ignored
</Stat>;
// @ts-expect-error Metric refs target divs, not buttons.
<Stat.Tile ref={createRef<HTMLButtonElement>()} label="Blocked" value={0} />;
// @ts-expect-error Banner refs target the outer div, not its action.
<Banner ref={createRef<HTMLButtonElement>()}>Notice</Banner>;
