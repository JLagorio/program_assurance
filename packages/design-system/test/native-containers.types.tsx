import { createRef } from "react";
import { Chart, Item, Table } from "../src";

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
