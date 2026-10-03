import type { Meta, StoryObj } from "@storybook/react-vite";

import { Filter, Package, Plus, Server } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";

import { TablePagination, Toolbar } from "../..";
import {
  Absent,
  Badge,
  Button,
  DateTime,
  FilterChip,
  Icon,
  Id,
  Indicator,
  Person,
  Table,
  TextLink,
  type Tone,
  usePage,
  useSort,
} from "../../components";
import { LedgerProvider, useLedgerLocale } from "../../lib/locale";
import { Stack, Text } from "../../primitives";
import * as direction from "../_lib/direction";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Pair } = pairLayout;
const { along, isRtl, towardsEnd } = direction;

const meta = {
  title: "Components/Table",
  component: Table,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Table>;
export default meta;
type Story = StoryObj<typeof meta>;

type Row = {
  id: string;
  name: string;
  owner: string;
  status: { tone: Tone; label: string };
  severity: { tone: Tone; label: string };
  /** An ISO day: the raw value the column sorts by, formatted only in the cell. */
  due: string;
  family: string;
};

const rows: Row[] = [
  {
    id: "CTRL-0412",
    name: "Segregation of duties, payables",
    owner: "Dana Whitfield",
    status: { tone: "success", label: "Verified" },
    severity: { tone: "danger", label: "High" },
    due: "2026-09-14",
    family: "Finance",
  },
  {
    id: "CTRL-0418",
    name: "Vendor master change approval",
    owner: "Dana Whitfield",
    status: { tone: "information", label: "In review" },
    severity: { tone: "warning", label: "Medium" },
    due: "2026-09-18",
    family: "Finance",
  },
  {
    id: "CTRL-0450",
    name: "Privileged access review",
    owner: "Priya Natarajan",
    status: { tone: "danger", label: "Overdue" },
    severity: { tone: "danger", label: "High" },
    due: "2026-09-02",
    family: "Security",
  },
  {
    id: "CTRL-0451",
    name: "Firewall rule recertification",
    owner: "Priya Natarajan",
    status: { tone: "warning", label: "Due soon" },
    severity: { tone: "warning", label: "Medium" },
    due: "2026-09-09",
    family: "Security",
  },
  {
    id: "CTRL-0472",
    name: "Backup restore test",
    owner: "Marcus Oyelaran",
    status: { tone: "neutral", label: "Draft" },
    severity: { tone: "neutral", label: "Low" },
    due: "2026-09-30",
    family: "Operations",
  },
];

/** What each sortable column reads: raw values, never the formatted label. At module level, so the sort's memo holds. */
const registerReaders = {
  id: (r: Row) => r.id,
  due: (r: Row) => r.due,
};

/** The text a cell's content paints, measured on its glyphs rather than its box. */
const textBox = (el: Element) => {
  const range = el.ownerDocument.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect();
};
/** A heading's label: the span that holds its text. */
const headingLabel = (heading: HTMLElement) =>
  heading.querySelector<HTMLElement>(":scope > span > span, :scope > span > button > span")!;

function Register() {
  const sort = useSort(rows, registerReaders, { key: "id", dir: "asc" });
  const [selected, setSelected] = useState<Set<string>>(new Set(["CTRL-0418"]));
  const [preview, setPreview] = useState<string | null>("CTRL-0450");
  const [opened, setOpened] = useState<string | null>(null);
  const [page, setPage] = useState(2);
  const [search, setSearch] = useState("");
  const all = selected.size === rows.length;
  const some = selected.size > 0 && !all;
  return (
    <Stack space="space.0">
      {/* The toolbar keeps its gap to the table, so the sticky header never covers its rings. */}
      <Stack space="space.200">
        <Toolbar
          search={search}
          onSearch={setSearch}
          placeholder="Search controls"
          actions={
            <Button variant="primary" size="small" iconBefore={<Plus />}>
              New control
            </Button>
          }
          filters={
            <>
              <FilterChip label="Owner" value="Dana Whitfield" isActive />
              <FilterChip label="Status" />
            </>
          }
        >
          <Button variant="subtle" size="small" iconBefore={<Filter />}>
            More filters
          </Button>
        </Toolbar>
        <Table label="Controls">
          <thead>
            <tr>
              <Table.Selection
                header
                checked={all}
                indeterminate={some}
                onCheckedChange={(next) =>
                  setSelected(next ? new Set(rows.map((r) => r.id)) : new Set())
                }
                label="Select all"
                pinned="start"
              />
              <Table.Header
                sort={sort.dir("id")}
                onSort={() => sort.toggle("id")}
                pinned="start"
                offset={32}
                edge
              >
                Id
              </Table.Header>
              <Table.Header minWidth={200}>Control</Table.Header>
              <Table.Header width={180}>Owner</Table.Header>
              <Table.Header>Status</Table.Header>
              <Table.Header>Severity</Table.Header>
              <Table.Header sort={sort.dir("due")} onSort={() => sort.toggle("due")} width={120}>
                Due
              </Table.Header>
            </tr>
          </thead>
          <tbody>
            {sort.rows.map((r) => (
              // The row's click follows the name's link, which is in the row as well: the click is
              // never the only way to open the record.
              <Table.Row key={r.id} isSelected={selected.has(r.id)} onClick={() => setOpened(r.id)}>
                <Table.Selection
                  checked={selected.has(r.id)}
                  onCheckedChange={(next) =>
                    setSelected((s) => {
                      const n = new Set(s);
                      if (next) n.add(r.id);
                      else n.delete(r.id);
                      return n;
                    })
                  }
                  label={`Select ${r.id}`}
                  pinned="start"
                />
                <Table.Id
                  id={r.id}
                  rowHeader
                  isActive={preview === r.id}
                  onPreview={() => setPreview(r.id)}
                  pinned="start"
                  offset={32}
                  edge
                />
                <Table.Cell>
                  <TextLink
                    href={`#${r.id}`}
                    onClick={(event) => {
                      event.preventDefault();
                      setOpened(r.id);
                    }}
                  >
                    {r.name}
                  </TextLink>
                </Table.Cell>
                <Table.Cell>
                  <Person name={r.owner} />
                </Table.Cell>
                <Table.Cell>
                  <Badge variant="secondary" tone={r.status.tone}>
                    {r.status.label}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Indicator tone={r.severity.tone}>{r.severity.label}</Indicator>
                </Table.Cell>
                <Table.Cell>
                  <DateTime value={r.due} focusable={false} />
                </Table.Cell>
              </Table.Row>
            ))}
          </tbody>
        </Table>
      </Stack>
      <TablePagination
        page={page}
        pageCount={28}
        onPageChange={setPage}
        total={1391}
        pageSize={50}
        className="pt-150"
      />
      <Text size="small" color="color.text.subtle">
        Opened: {opened ?? "none"}
      </Text>
    </Stack>
  );
}

export const Playground: Story = {
  args: { label: "Controls" },
  render: (args) => (
    <Table {...args}>
      <thead>
        <tr>
          <Table.Header width={110}>Id</Table.Header>
          <Table.Header>Control</Table.Header>
          <Table.Header width={140}>Status</Table.Header>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <Table.Row key={r.id}>
            <Table.Id id={r.id} />
            <Table.Cell>{r.name}</Table.Cell>
            <Table.Cell>
              <Badge variant="secondary" tone={r.status.tone}>
                {r.status.label}
              </Badge>
            </Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  ),
};

/** A register by hand: the checkbox column, the pinned id as each row's header with the eye that previews it, the name as the link that opens the record (the row's click follows it), dates sorted by their ISO value and shown through DateTime. */
export const RegisterStory: Story = {
  name: "Register",
  render: () => <Register />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const all = canvas.getByRole("checkbox", { name: "Select all" });
    await expect(all).toBePartiallyChecked();
    await userEvent.click(all);
    for (const checkbox of canvas.getAllByRole("checkbox")) await expect(checkbox).toBeChecked();
    await userEvent.click(all);
    for (const checkbox of canvas.getAllByRole("checkbox"))
      await expect(checkbox).not.toBeChecked();

    // Each row's id is its header, and its eye is named after it.
    await expect(canvas.getAllByRole("rowheader").map((cell) => cell.textContent)).toEqual(
      rows.map((r) => r.id).sort(),
    );
    const selection = canvas.getByRole("checkbox", { name: "Select CTRL-0412" });
    const row = selection.closest("tr")!;
    const preview = within(row).getByRole("button", { name: "Preview CTRL-0412" });
    await expect(preview).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(selection);
    await expect(selection).toBeChecked();
    await expect(all).toBePartiallyChecked();
    await fireEvent.click(
      selection.closest("td")!.querySelector<HTMLInputElement>('input[type="checkbox"]')!,
    );
    await expect(selection).not.toBeChecked();
    // A click beside the box, anywhere in its cell, toggles it and never opens the record.
    await fireEvent.click(selection.closest("td")!);
    await expect(selection).toBeChecked();
    await expect(canvas.getByText("Opened: none")).toBeInTheDocument();

    // A chosen row under the pointer is one colour, its pinned cells included.
    await userEvent.hover(within(row).getByText("Dana Whitfield"));
    const pinnedId = within(row).getByRole("rowheader");
    await waitFor(() =>
      expect(getComputedStyle(pinnedId).backgroundColor).toBe(
        getComputedStyle(row).backgroundColor,
      ),
    );

    // The name is the record's link; the row's click follows it.
    await expect(
      within(row).getByRole("link", { name: "Segregation of duties, payables" }),
    ).toHaveAttribute("href", "#CTRL-0412");
    await userEvent.click(within(row).getByText("Dana Whitfield"));
    await expect(canvas.getByText("Opened: CTRL-0412")).toBeInTheDocument();
    await expect(preview).toHaveAttribute("aria-pressed", "false");

    // The eye previews the row; the open row's eye has a ring as well as its fill.
    await userEvent.click(preview);
    await expect(preview).toHaveAttribute("aria-pressed", "true");
    await expect(getComputedStyle(preview).borderTopWidth).toBe("1px");
    const resting = within(canvas.getByRole("table")).getByRole("button", {
      name: "Preview CTRL-0450",
    });
    await expect(resting).toHaveAttribute("aria-pressed", "false");
    await expect(getComputedStyle(resting).borderTopWidth).toBe("0px");

    // Due sorts by the ISO day, not the label: 2, 9, 14, 18, 30 September.
    const due = canvas.getByRole("columnheader", { name: "Due" });
    await userEvent.click(within(due).getByRole("button"));
    await expect(due).toHaveAttribute("aria-sort", "ascending");
    await expect(canvas.getByRole("columnheader", { name: "Id" })).not.toHaveAttribute("aria-sort");
    await expect(canvas.getAllByRole("rowheader").map((cell) => cell.textContent)).toEqual([
      "CTRL-0450",
      "CTRL-0451",
      "CTRL-0412",
      "CTRL-0418",
      "CTRL-0472",
    ]);
    await userEvent.click(within(due).getByRole("button"));
    await expect(due).toHaveAttribute("aria-sort", "descending");
    await expect(canvas.getAllByRole("rowheader")[0]).toHaveTextContent("CTRL-0472");
  },
};

function Grouped() {
  const [open, setOpen] = useState<Record<string, boolean>>({
    Finance: true,
    Security: true,
    Operations: false,
  });
  const families = [...new Set(rows.map((r) => r.family))];
  return (
    <Table label="Controls by family">
      <thead>
        <tr>
          <Table.Header>Id</Table.Header>
          <Table.Header>Control</Table.Header>
          <Table.Header>Status</Table.Header>
        </tr>
      </thead>
      {families.map((f) => (
        <Table.Group
          key={f}
          colSpan={3}
          expanded={open[f] ?? false}
          onExpandedChange={(next) => setOpen((o) => ({ ...o, [f]: next }))}
          title={f}
          count={rows.filter((r) => r.family === f).length}
        >
          {rows
            .filter((r) => r.family === f)
            .map((r) => (
              <Table.Row key={r.id}>
                <Table.Id id={r.id} tone="subtle" />
                <Table.Cell>{r.name}</Table.Cell>
                <Table.Cell>
                  <Badge variant="secondary" tone={r.status.tone}>
                    {r.status.label}
                  </Badge>
                </Table.Cell>
              </Table.Row>
            ))}
        </Table.Group>
      ))}
    </Table>
  );
}

/** The register on a phone: the name keeps its 200px floor (`minWidth`) and the frame scrolls sideways under the pinned id rather than squeezing it to a sliver, and the open row's id keeps the eye's slot, so the eye never covers it. */
export const RegisterPhone: Story = {
  name: "Register at 390px",
  globals: { viewport: { value: "ledgerPhone", isRotated: false } },
  render: () => <Register />,
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(window.innerWidth).toBe(390));
    const canvas = within(canvasElement);
    const root = canvasElement.ownerDocument.documentElement;
    const table = canvas.getByRole("table");
    const frame = table.parentElement!;
    await waitFor(() => expect(frame.scrollWidth).toBeGreaterThan(frame.clientWidth));
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
    const name = canvas.getByRole("columnheader", { name: "Control" });
    await expect(name.getBoundingClientRect().width).toBeGreaterThanOrEqual(200);

    // The open row's id is whole, and ends before its eye.
    const eye = within(table).getByRole("button", { name: "Preview CTRL-0450", pressed: true });
    const slot = eye.closest<HTMLElement>('[data-slot="preview-eye"]')!;
    const id = slot.previousElementSibling as HTMLElement;
    await expect(id).toHaveTextContent("CTRL-0450");
    await expect(id.scrollWidth).toBeLessThanOrEqual(id.clientWidth);
    await expect(along(id).end - 24).toBeLessThanOrEqual(along(slot).start + 1);
    // Scrolled sideways, the checkbox and the id hold still and the name scrolls under them.
    const idStart = along(slot).start;
    frame.scrollLeft = towardsEnd(frame, 160);
    fireEvent.scroll(frame);
    await waitFor(() => expect(along(name).start).toBeLessThan(idStart));
    await expect(Math.round(along(slot).start)).toBe(Math.round(idStart));
    frame.scrollLeft = 0;
    fireEvent.scroll(frame);
    // Every control smaller than 24px takes the touch hit area.
    for (const control of within(table).getAllByRole("button")) {
      const { width, height } = control.getBoundingClientRect();
      if (width > 0 && (width < 24 || height < 24))
        await expect(control).toHaveClass("touch-target");
    }
    // A checkbox's hit area is its own, larger than its 16px box: a point 11px from its middle,
    // sideways or up and down, still reaches it, in the heading as in a row.
    const doc = canvasElement.ownerDocument;
    for (const checkbox of [
      within(table).getByRole("checkbox", { name: "Select all" }),
      within(table).getAllByRole("checkbox")[1]!,
    ]) {
      const box = checkbox.getBoundingClientRect();
      const [x, y] = [box.left + box.width / 2, box.top + box.height / 2];
      for (const [dx, dy] of [
        [-11, 0],
        [11, 0],
        [0, -11],
        [0, 11],
      ] as const)
        await expect(checkbox.contains(doc.elementFromPoint(x + dx, y + dy))).toBe(true);
    }
  },
};

/** Rows under headings. Each band is its rows' header (`th scope="rowgroup"`), and its chevron is named by the family while `aria-expanded` says whether it is open, so the name never flips. */
export const Groups: Story = {
  render: () => <Grouped />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const finance = canvas.getByRole("button", { name: "Finance" });
    const operations = canvas.getByRole("button", { name: "Operations" });
    await expect(finance).toHaveAttribute("aria-expanded", "true");
    await expect(operations).toHaveAttribute("aria-expanded", "false");
    await expect(finance.closest("th")).toHaveAttribute("scope", "rowgroup");
    await expect(canvas.queryByText("Backup restore test")).toBeNull();

    await userEvent.click(operations);
    await expect(operations).toHaveAttribute("aria-expanded", "true");
    await expect(operations).toHaveAccessibleName("Operations");
    await expect(canvas.getByText("Backup restore test")).toBeVisible();

    // A click anywhere on the band toggles it too.
    await userEvent.click(canvas.getByText("Finance"));
    await expect(finance).toHaveAttribute("aria-expanded", "false");
    await expect(canvas.queryByText("Vendor master change approval")).toBeNull();
    await userEvent.click(finance);
    await expect(canvas.getByText("Vendor master change approval")).toBeVisible();
  },
};

const listRows = [
  {
    id: "CTRL-0412",
    name: "Segregation of duties",
    systems: [
      { name: "Payments API", status: <Indicator tone="danger">Not met</Indicator> },
      { name: "Ledger" },
      { name: "Vault" },
    ],
  },
  { id: "CTRL-0418", name: "Access review", systems: [{ name: "Directory" }] },
];

function ListLine() {
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <Stack space="space.100">
      <Table label="Controls by system" style={{ maxWidth: 520 }}>
        <thead>
          <tr>
            <Table.Header minWidth={180}>Control</Table.Header>
            <Table.Header width={200}>Systems</Table.Header>
          </tr>
        </thead>
        <tbody>
          {listRows.map((row) => (
            <Table.Row key={row.id} className="cursor-pointer" onClick={() => setOpened(row.id)}>
              <Table.Cell>{row.name}</Table.Cell>
              <Table.Cell>
                <Table.List
                  items={row.systems.map((system) => ({
                    key: system.name,
                    label: system.name,
                    meta: "Component",
                    status: system.status,
                  }))}
                  {...(row.systems.length > 1 ? { note: "Payments API has an open finding." } : {})}
                />
              </Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
      <Text size="small" color="color.text.subtle">
        Row opened: {opened ?? "none"}
      </Text>
    </Stack>
  );
}

/** A list line with nothing to open is a button: hover, focus, a click, Enter or a tap shows its card, so the whole list is reachable where nothing can hover, and the click does not open the row. "+2" is spoken "and 2 more", and every item with its meta and status, and the note, is the line's description, so a screen reader hears the list without the card. */
export const ListLineStory: Story = {
  name: "List line without an opener",
  render: () => <ListLine />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const line = canvas.getByRole("button", { name: "Payments API and 2 more" });
    await expect(line).not.toHaveAttribute("title");
    // Read as the card shows it: each item with its meta and status, then the note.
    const spoken = (el: HTMLElement) =>
      (el.ownerDocument.getElementById(el.getAttribute("aria-describedby")!)?.textContent ?? "")
        .replace(/\s+/g, " ")
        .trim();
    await expect(line).toHaveAccessibleDescription(/Payments API, Component, Not met ?\./);
    await expect(spoken(line)).toBe(
      "Payments API, Component, Not met.Ledger, Component.Vault, Component.Payments API has an open finding.",
    );
    await expect(canvas.getByRole("button", { name: "Directory" })).toHaveAccessibleDescription(
      "Directory, Component.",
    );
    await userEvent.click(line);
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(() => expect(body.getByText("Vault")).toBeVisible());
    await expect(canvas.getByText("Row opened: none")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByText("Vault")).toBeNull());
  },
};

const elements = [
  {
    id: "EL-01",
    name: "Ground segment",
    kind: "System",
    path: "Program Atlas",
    library: false,
  },
  {
    id: "EL-02",
    name: "Telemetry, tracking and command processor with redundant uplink",
    kind: "Component",
    path: "Ground segment · Operations network",
    library: true,
  },
  { id: "EL-03", name: "Operator console", kind: "Component", path: "", library: false },
];

/** A name with what tells records apart: the kind's icon, a link, one badge, a second line. */
function RichNames() {
  return (
    <Table label="Program elements" style={{ maxWidth: 420 }}>
      <thead>
        <tr>
          <Table.Header minWidth={200}>Element</Table.Header>
          <Table.Header width={96}>Code</Table.Header>
        </tr>
      </thead>
      <tbody>
        {elements.map((element) => (
          <Table.Row key={element.id}>
            <Table.Cell rowHeader>
              <Table.Name
                icon={
                  <Icon label={element.kind} size="medium" color="color.icon.subtle">
                    {element.kind === "System" ? <Server /> : <Package />}
                  </Icon>
                }
                {...(element.library
                  ? {
                      badge: (
                        <Badge size="xsmall" variant="secondary" tone="information">
                          Library
                        </Badge>
                      ),
                    }
                  : {})}
                {...(element.path ? { description: element.path } : {})}
              >
                <TextLink href={`#/elements/${element.id}`}>{element.name}</TextLink>
              </Table.Name>
            </Table.Cell>
            <Table.Cell>
              <Id>{element.id}</Id>
            </Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

/** `Table.Name`: the record's kind as a labelled icon, its link, one badge and a muted second line, built in and never by hand. The name is cut first, the badge keeps its width, and the second line is cut on its own; in the row header a screen reader hears all of it with each cell. */
export const RichNamesStory: Story = {
  name: "Names with an icon, a badge and a second line",
  render: () => <RichNames />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole("table", { name: "Program elements" });
    const headers = within(table).getAllByRole("rowheader");
    await expect(headers).toHaveLength(3);
    // The kind, the name, the badge and the second line are the row header's words.
    await expect(headers[1]).toHaveTextContent(/Telemetry.*Library.*Ground segment/);
    await expect(within(headers[1]!).getByRole("img", { name: "Component" })).toBeVisible();
    // The long name gives way: its link cuts itself, with its ring inside, and the badge beside it
    // keeps its whole width.
    const name = within(headers[1]!).getByRole("link", { name: /^Telemetry/ });
    await expect(name.scrollWidth).toBeGreaterThan(name.clientWidth);
    const badge = within(headers[1]!).getByText("Library");
    await expect(badge.scrollWidth).toBeLessThanOrEqual(badge.clientWidth + 1);
    await expect(badge.getBoundingClientRect().right).toBeLessThanOrEqual(
      headers[1]!.getBoundingClientRect().right,
    );
    // The link is the record's, and a row without a second line draws none.
    await expect(within(headers[2]!).getByRole("link", { name: "Operator console" })).toBeVisible();
    await expect(headers[2]!.querySelector('[data-slot="table-name-description"]')).toBeNull();
    // Two lines still fit the 40px row.
    await expect(headers[0]!.closest("tr")!.getBoundingClientRect().height).toBeLessThanOrEqual(41);
  },
};

function FixedIds() {
  const [preview, setPreview] = useState<string | null>("CTRL-0450");
  return (
    <Table label="Controls, fixed layout" className="table-fixed" style={{ maxWidth: 480 }}>
      <thead>
        <tr>
          <Table.Header width={128}>Id</Table.Header>
          <Table.Header>Control</Table.Header>
        </tr>
      </thead>
      <tbody>
        {rows.slice(0, 3).map((r) => (
          <Table.Row key={r.id} onClick={() => setPreview(r.id)}>
            <Table.Id id={r.id} isActive={preview === r.id} onPreview={() => setPreview(r.id)} />
            <Table.Cell>{r.name}</Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

/** In a `table-fixed` table the column sets the id's width, so at rest the id keeps its full width, and it gives up the eye's 24px only while the eye shows: on the row's hover, on focus in the cell, on the open row, and always where nothing can hover. It ends in an ellipsis before the eye, never under it. */
export const FixedLayoutIds: Story = {
  name: "Ids in a fixed layout",
  render: () => <FixedIds />,
  play: async ({ canvasElement }) => {
    const table = within(within(canvasElement).getByRole("table"));
    const idOf = (eye: HTMLElement) =>
      eye.closest<HTMLElement>('[data-slot="preview-eye"]')!.previousElementSibling as HTMLElement;
    const open = table.getByRole("button", { name: "Preview CTRL-0450", pressed: true });
    await expect(idOf(open)).toHaveStyle({ paddingInlineEnd: "24px" });
    await expect(idOf(open).scrollWidth).toBeLessThanOrEqual(idOf(open).clientWidth);
    await expect(along(idOf(open)).end - 24).toBeLessThanOrEqual(along(open).start);
    const rest = table.getByRole("button", { name: "Preview CTRL-0412" });
    // A pointer that can hover: the resting row's id has its whole width.
    if (window.matchMedia("(hover: hover)").matches)
      await expect(idOf(rest)).toHaveStyle({ paddingInlineEnd: "0px" });
    await userEvent.click(rest);
    await waitFor(() => expect(idOf(rest)).toHaveStyle({ paddingInlineEnd: "24px" }));
  },
};

const parts = [
  { id: "SYS-01", name: "Ground segment", kind: "System", depth: 0, children: 2, controls: 212 },
  {
    id: "SUB-011",
    name: "Mission control",
    kind: "Subsystem",
    depth: 1,
    children: 2,
    controls: 140,
  },
  {
    id: "CMP-0113",
    name: "Telemetry gateway",
    kind: "Component",
    depth: 2,
    children: 0,
    controls: 86,
  },
  {
    id: "CMP-0114",
    name: "Operator console",
    kind: "Component",
    depth: 2,
    children: 0,
    controls: 54,
  },
  { id: "SUB-012", name: "Antenna array", kind: "Subsystem", depth: 1, children: 1, controls: 72 },
  {
    id: "CMP-0121",
    name: "Pedestal controller",
    kind: "Component",
    depth: 2,
    children: 0,
    controls: 1072,
  },
];

/**
 * A hierarchy with columns, by hand: a plain table, reached by Tab, whose chevrons name their row.
 * The caller flattens and folds. Two shapes: `Table.Tree` puts the chevron and the indent in the
 * name cell; `Table.Disclosure` gives them a leading column of their own, so the chevron stays
 * leftmost however the columns are ordered. DataTable's tree mode draws the second as a treegrid,
 * with the arrow keys.
 */
function Hierarchy({ leading = false }: { leading?: boolean }) {
  const { formatNumber } = useLedgerLocale();
  const [open, setOpen] = useState(() => new Set(["SYS-01", "SUB-011"]));
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const shown: typeof parts = [];
  let hideBelow = Infinity;
  for (const p of parts) {
    if (p.depth > hideBelow) continue;
    hideBelow = Infinity;
    shown.push(p);
    if (p.children && !open.has(p.id)) hideBelow = p.depth;
  }
  return (
    <Table label={leading ? "Parts, disclosure column" : "Parts"}>
      <thead>
        <tr>
          {leading ? (
            <Table.Header width={28} className="px-0">
              <span className="sr-only">Parts</span>
            </Table.Header>
          ) : null}
          <Table.Header>Element</Table.Header>
          <Table.Header width={110}>Kind</Table.Header>
          <Table.Header width={96} align="end">
            Controls
          </Table.Header>
        </tr>
      </thead>
      <tbody>
        {shown.map((p) => {
          const expanded = open.has(p.id);
          return (
            <Table.Row key={p.id}>
              {leading ? (
                <>
                  <Table.Disclosure
                    hasChildren={p.children > 0}
                    expanded={expanded}
                    onExpandedChange={() => toggle(p.id)}
                    label={p.name}
                    width={28}
                  />
                  <Table.Cell className="max-w-none">
                    <span
                      className="flex min-w-0 items-center"
                      style={{ paddingInlineStart: p.depth * 16 }}
                    >
                      {p.name}
                    </span>
                  </Table.Cell>
                </>
              ) : (
                <Table.Tree
                  depth={p.depth}
                  hasChildren={p.children > 0}
                  expanded={expanded}
                  onExpandedChange={() => toggle(p.id)}
                  label={p.name}
                  hint={
                    p.children && !expanded ? (
                      <Text size="xsmall" color="color.text.subtle">
                        {p.children} part{p.children === 1 ? "" : "s"}
                      </Text>
                    ) : null
                  }
                >
                  {p.name}
                </Table.Tree>
              )}
              <Table.Cell>{p.kind}</Table.Cell>
              <Table.Cell align="end">{formatNumber(p.controls)}</Table.Cell>
            </Table.Row>
          );
        })}
      </tbody>
    </Table>
  );
}

/** The chevron names its row and its action, "Collapse Ground segment"; Tab reaches it and Enter or Space turns it, and focus stays on it under its new name. The Controls heading ends where its figures do. */
export const TreeStory: Story = {
  name: "Tree",
  render: () => (
    <Stack space="space.300">
      <Hierarchy />
      <Hierarchy leading />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const name of ["Parts", "Parts, disclosure column"]) {
      const table = canvas.getByRole("table", { name });
      // By hand a hierarchy is a plain table: no treegrid without its arrow keys.
      await expect(table).not.toHaveAttribute("role");
      const t = within(table);
      const toggle = t.getByRole("button", { name: "Collapse Ground segment" });
      toggle.focus();
      await userEvent.keyboard("{Enter}");
      await expect(toggle).toHaveAccessibleName("Expand Ground segment");
      await expect(toggle).toHaveFocus();
      await expect(t.queryByText("Mission control")).toBeNull();
      await userEvent.keyboard(" ");
      await expect(toggle).toHaveAccessibleName("Collapse Ground segment");
      await expect(t.getByText("Mission control")).toBeVisible();
      await expect(t.getByRole("button", { name: "Expand Antenna array" })).toBeVisible();

      // The heading of a number column ends where its figures end.
      const heading = t.getByRole("columnheader", { name: "Controls" });
      const label = headingLabel(heading);
      const labelEnd = along(label, textBox(label)).end;
      for (const cell of t.getAllByRole("cell").filter((c) => /^[\d,]+$/.test(c.textContent!)))
        await expect(Math.abs(along(cell, textBox(cell)).end - labelEnd)).toBeLessThanOrEqual(1);
    }
  },
};

function GroupStates() {
  const [open, setOpen] = useState(true);
  return (
    <Table label="Group states">
      <thead>
        <tr>
          <Table.Header width={110}>Id</Table.Header>
          <Table.Header>Control</Table.Header>
          <Table.Header width={140}>Status</Table.Header>
        </tr>
      </thead>
      <Table.Group
        colSpan={3}
        expanded={open}
        onExpandedChange={setOpen}
        title="Access control"
        count={2}
        trailing={
          <Text size="xsmall" color="color.text.subtlest">
            2 of 46
          </Text>
        }
      >
        <Table.Row>
          <Table.Id id="AC-2" />
          <Table.Cell>Account management</Table.Cell>
          <Table.Cell>
            <Badge variant="secondary" tone="success">
              Satisfied
            </Badge>
          </Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Id id="AC-3" />
          <Table.Cell>Access enforcement</Table.Cell>
          <Table.Cell>
            <Badge variant="secondary" tone="warning">
              Partial
            </Badge>
          </Table.Cell>
        </Table.Row>
      </Table.Group>
      <Table.Group
        colSpan={3}
        expanded={false}
        onExpandedChange={() => {}}
        title="Audit and accountability (closed)"
        count={25}
      >
        {null}
      </Table.Group>
    </Table>
  );
}

/** Every header, row, cell and id state, then a group open and closed. In forced colours the chosen row keeps a Highlight edge and the open row's eye a Highlight fill, since both fills are tints the palette replaces. */
export const TableMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Table label="States">
        <thead>
          <tr>
            <Table.Selection
              header
              checked={false}
              indeterminate
              onCheckedChange={() => {}}
              label="Select all"
            />
            <Table.Header sticky width={110}>
              Sticky
            </Table.Header>
            <Table.Header sort="asc" onSort={() => {}}>
              Sorted asc
            </Table.Header>
            <Table.Header sort="desc" onSort={() => {}}>
              Sorted desc
            </Table.Header>
            <Table.Header sort={false} onSort={() => {}}>
              Sortable
            </Table.Header>
            <Table.Header width={120} align="end">
              End, 120
            </Table.Header>
          </tr>
        </thead>
        <tbody>
          <Table.Row>
            <Table.Selection checked={false} onCheckedChange={() => {}} label="Select FND-2231" />
            <Table.Id id={<TextLink href="#FND-2231">FND-2231</TextLink>} />
            <Table.Cell>Plain row · the id as a link</Table.Cell>
            <Table.Cell>
              <Indicator tone="danger">CAT I</Indicator>
            </Table.Cell>
            <Table.Cell>
              <Person name="Dana Whitlock" />
            </Table.Cell>
            <Table.Cell align="end">1,204</Table.Cell>
          </Table.Row>
          <Table.Row isSelected>
            <Table.Selection checked onCheckedChange={() => {}} label="Select FND-2214" />
            <Table.Id id="FND-2214" isActive onPreview={() => {}} />
            <Table.Cell>Selected row · active id</Table.Cell>
            <Table.Cell>
              <Indicator tone="warning">CAT II</Indicator>
            </Table.Cell>
            <Table.Cell>
              <Person name="Grace Hoppel" />
            </Table.Cell>
            <Table.Cell align="end">318</Table.Cell>
          </Table.Row>
          <Table.Row isStatic>
            <Table.Selection
              checked={false}
              onCheckedChange={() => {}}
              label="Select FND-2240"
              disabled
            />
            <Table.Id id="FND-2240" tone="subtle" />
            <Table.Cell>Static row · subtle id · disabled selection</Table.Cell>
            <Table.Cell>
              <Badge variant="secondary" tone="neutral">
                Triaged
              </Badge>
            </Table.Cell>
            <Table.Cell>
              A cell that is much too long for its column truncates with an ellipsis
            </Table.Cell>
            <Table.Cell align="end" className="text-danger">
              -12
            </Table.Cell>
          </Table.Row>
        </tbody>
      </Table>
      <GroupStates />
      <Hierarchy />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole("table", { name: "States" });
    const selected = within(table)
      .getByRole("checkbox", { name: "Select FND-2214" })
      .closest("tr")!;
    const eye = within(selected).getByRole("button", { name: "Preview FND-2214", pressed: true });
    await expect(getComputedStyle(eye).borderTopStyle).toBe("solid");
    // Figures line up: every cell takes tabular numerals from the table.
    await expect(
      getComputedStyle(within(table).getByText("Plain row · the id as a link")).fontVariantNumeric,
    ).toBe("tabular-nums");
    if (window.matchMedia("(forced-colors: active)").matches) {
      await expect(getComputedStyle(selected).outlineStyle).toBe("solid");
      await expect(getComputedStyle(selected).outlineColor).not.toBe(
        getComputedStyle(selected.previousElementSibling!).outlineColor,
      );
    }
  },
};

const risks = Array.from({ length: 23 }, (_, i) => ({
  id: `RSK-${String(i + 1).padStart(3, "0")}`,
  title:
    [
      "Export resolver leaks tenants",
      "Stale admin accounts",
      "Unsigned firmware",
      "Backups untested",
    ][i % 4] ?? "",
  score: (i * 37) % 100,
  owner: ["Sarah Chen", "Linus Aarto", "Priya Raghavan"][i % 3] ?? "",
}));
const riskReaders = {
  id: (r: (typeof risks)[number]) => r.id,
  score: (r: (typeof risks)[number]) => r.score,
  owner: (r: (typeof risks)[number]) => r.owner,
};

/** useSort feeds the headers; usePage feeds Pagination. The page clamps when the list shrinks. */
function SortedPaged() {
  const sort = useSort(risks, riskReaders, { key: "score", dir: "desc" });
  const page = usePage(sort.rows, 8);
  return (
    <Stack space="space.150">
      <Table label="Risks">
        <thead>
          <tr>
            <Table.Header sort={sort.dir("id")} onSort={() => sort.toggle("id")} width={120}>
              Risk
            </Table.Header>
            <Table.Header>Title</Table.Header>
            <Table.Header
              sort={sort.dir("score")}
              onSort={() => sort.toggle("score")}
              width={96}
              align="end"
            >
              Score
            </Table.Header>
            <Table.Header sort={sort.dir("owner")} onSort={() => sort.toggle("owner")} width={160}>
              Owner
            </Table.Header>
          </tr>
        </thead>
        <tbody>
          {page.rows.map((r) => (
            <Table.Row key={r.id}>
              <Table.Id id={r.id} />
              <Table.Cell>{r.title}</Table.Cell>
              <Table.Cell align="end">{String(r.score)}</Table.Cell>
              <Table.Cell>{r.owner}</Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
      <TablePagination
        page={page.page}
        pageCount={page.pageCount}
        onPageChange={page.setPage}
        total={page.total}
        pageSize={page.pageSize}
      />
    </Stack>
  );
}

/** A sortable heading reports its direction in `aria-sort`, and only the sorted one does. An end-aligned heading leads with its arrow, so its word still ends over the figures. */
export const SortedAndPaged: Story = {
  name: "Sorted and paged",
  render: () => <SortedPaged />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const score = canvas.getByRole("columnheader", { name: "Score" });
    const risk = canvas.getByRole("columnheader", { name: "Risk" });
    await expect(score).toHaveAttribute("aria-sort", "descending");
    await expect(risk).not.toHaveAttribute("aria-sort");
    // The arrow leads the end-aligned heading; the word ends over the column's figures.
    const button = within(score).getByRole("button");
    const label = headingLabel(score);
    await expect(along(button.querySelector("svg")!).end).toBeLessThanOrEqual(
      along(label, textBox(label)).start,
    );
    const figures = within(canvas.getByRole("table"))
      .getAllByRole("cell")
      .filter((cell) => /^\d+$/.test(cell.textContent!));
    await expect(
      Math.abs(along(label, textBox(label)).end - along(figures[0]!, textBox(figures[0]!)).end),
    ).toBeLessThanOrEqual(1);

    await userEvent.click(within(risk).getByRole("button"));
    await expect(risk).toHaveAttribute("aria-sort", "ascending");
    await expect(score).not.toHaveAttribute("aria-sort");
    await expect(canvas.getAllByRole("row")[1]).toHaveTextContent("RSK-001");
    await userEvent.click(within(risk).getByRole("button"));
    await expect(risk).toHaveAttribute("aria-sort", "descending");
    await expect(canvas.getAllByRole("row")[1]).toHaveTextContent("RSK-023");
  },
};

const wideRows = Array.from({ length: 14 }, (_, i) => ({
  ...(rows[i % rows.length] as Row),
  id: `CTRL-${String(412 + i * 3).padStart(4, "0")}`,
}));

/** The frame: `maxHeight` scrolls the rows under the sticky header; the id is pinned and shows its edge once the frame moves sideways. */
function Frame() {
  return (
    <Table label="Controls" maxHeight={240} className="table-fixed">
      <thead>
        <tr>
          <Table.Header pinned="start" edge="scrolled" width={120}>
            Id
          </Table.Header>
          <Table.Header width={260}>Control</Table.Header>
          <Table.Header width={180}>Owner</Table.Header>
          <Table.Header width={140}>Status</Table.Header>
          <Table.Header width={120}>Severity</Table.Header>
          <Table.Header width={120}>Due</Table.Header>
          <Table.Header width={160}>Family</Table.Header>
          <Table.Header width={320}>Notes</Table.Header>
        </tr>
      </thead>
      <tbody>
        {wideRows.map((r) => (
          <Table.Row key={r.id}>
            <Table.Id id={r.id} pinned="start" edge="scrolled" />
            <Table.Cell>{r.name}</Table.Cell>
            <Table.Cell>
              <Person name={r.owner} />
            </Table.Cell>
            <Table.Cell>
              <Badge variant="secondary" tone={r.status.tone}>
                {r.status.label}
              </Badge>
            </Table.Cell>
            <Table.Cell>
              <Indicator tone={r.severity.tone}>{r.severity.label}</Indicator>
            </Table.Cell>
            <Table.Cell>
              <DateTime value={r.due} focusable={false} />
            </Table.Cell>
            <Table.Cell>{r.family}</Table.Cell>
            <Table.Cell>
              A note long enough to be cut by its column and shown whole on hover, since a plain
              string is the cell's title.
            </Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

/** The pinned id draws its edge only while the frame is scrolled sideways (`edge="scrolled"`), reading the frame's `data-scrolled-start`, and holds still while the rest scrolls under it. */
export const FrameStory: Story = {
  name: "Frame",
  render: () => <Frame />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const frame = canvas.getByRole("table", { name: "Controls" }).parentElement!;
    const pinned = canvas.getByRole("columnheader", { name: "Id" });
    await waitFor(() => expect(frame).toHaveAttribute("data-scrolled-end"));
    await expect(frame).not.toHaveAttribute("data-scrolled-start");
    await expect(getComputedStyle(pinned, "::after").borderInlineEndWidth).toBe("0px");
    const left = pinned.getBoundingClientRect().left;
    frame.scrollLeft = towardsEnd(frame, 200);
    fireEvent.scroll(frame);
    await waitFor(() => expect(frame).toHaveAttribute("data-scrolled-start"));
    await expect(getComputedStyle(pinned, "::after").borderInlineEndWidth).toBe("1px");
    await expect(Math.round(pinned.getBoundingClientRect().left)).toBe(Math.round(left));
    frame.scrollLeft = 0;
    fireEvent.scroll(frame);
    await waitFor(() => expect(frame).not.toHaveAttribute("data-scrolled-start"));
  },
};

/** Two header rows: the column groups above, the headings under them. Each row sticks below the one above it, so once the rows scroll the group names stay over their columns. */
export const TwoHeaderRows: Story = {
  name: "Two header rows",
  render: () => (
    <Table label="Controls by area" maxHeight={220}>
      <thead>
        <tr>
          <Table.Header colSpan={2} align="center">
            Control
          </Table.Header>
          <Table.Header colSpan={2} align="center">
            Ownership
          </Table.Header>
        </tr>
        <tr>
          <Table.Header width={110}>Id</Table.Header>
          <Table.Header minWidth={200}>Name</Table.Header>
          <Table.Header width={180}>Owner</Table.Header>
          <Table.Header width={120}>Family</Table.Header>
        </tr>
      </thead>
      <tbody>
        {wideRows.map((r) => (
          <Table.Row key={r.id}>
            <Table.Id id={r.id} />
            <Table.Cell>{r.name}</Table.Cell>
            <Table.Cell>
              <Person name={r.owner} />
            </Table.Cell>
            <Table.Cell>{r.family}</Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const frame = canvas.getByRole("table", { name: "Controls by area" }).parentElement!;
    const group = canvas.getByRole("columnheader", { name: "Ownership" });
    const leaf = canvas.getByRole("columnheader", { name: "Owner" });
    const top = () => frame.getBoundingClientRect().top;
    frame.scrollTop = 160;
    fireEvent.scroll(frame);
    await waitFor(() =>
      expect(Math.abs(group.getBoundingClientRect().top - top())).toBeLessThanOrEqual(1),
    );
    await expect(
      Math.abs(leaf.getBoundingClientRect().top - group.getBoundingClientRect().bottom),
    ).toBeLessThanOrEqual(1);
    // The group's name sits over the middle of its columns.
    const label = textBox(headingLabel(group));
    const box = group.getBoundingClientRect();
    await expect(Math.abs(label.left - box.left - (box.right - label.right))).toBeLessThanOrEqual(
      2,
    );
  },
};

function Resizing() {
  const [widths, setWidths] = useState({ name: 240, owner: 180 });
  const resize = (key: keyof typeof widths, label: string) => ({
    label,
    onResizeStart: () => {},
    onResizeReset: () => setWidths((w) => ({ ...w, [key]: key === "name" ? 240 : 180 })),
    onResizeKeyboard: (change: number | "min" | "max") =>
      setWidths((w) => ({
        ...w,
        [key]:
          change === "min"
            ? 120
            : change === "max"
              ? 400
              : Math.min(400, Math.max(120, w[key] + change)),
      })),
    value: widths[key],
    min: 120,
    max: 400,
  });
  return (
    <Table label="Resizable controls" className="table-fixed" style={{ width: "auto" }}>
      <thead>
        <tr>
          <Table.Header width={110}>Id</Table.Header>
          <Table.Header width={widths.name} resize={resize("name", "Control")}>
            Control
          </Table.Header>
          <Table.Header width={widths.owner} resize={resize("owner", "Owner")}>
            Owner
          </Table.Header>
        </tr>
      </thead>
      <tbody>
        {rows.slice(0, 3).map((r) => (
          <Table.Row key={r.id}>
            <Table.Id id={r.id} />
            <Table.Cell>{r.name}</Table.Cell>
            <Table.Cell>
              <Person name={r.owner} />
            </Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

/** A heading's resize handle is named after its column (`resize.label`), "Resize Control". The keyboard moves it with the arrow keys, Home and End, and it shows the kit's ring inside its edge with the guide beside it. DataTable wires the handle, and its column menu gives the pointer Wider, Narrower and Reset width. */
export const ResizeHandles: Story = {
  name: "Resize handles",
  render: () => <Resizing />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const handle = canvas.getByRole("separator", { name: "Resize Control" });
    await expect(canvas.getByRole("separator", { name: "Resize Owner" })).toBeInTheDocument();
    await expect(handle).toHaveAttribute("aria-valuenow", "240");
    await userEvent.click(canvas.getByRole("columnheader", { name: "Id" }));
    for (let i = 0; i < 6 && canvasElement.ownerDocument.activeElement !== handle; i++)
      await userEvent.tab();
    await expect(handle).toHaveFocus();
    await expect(getComputedStyle(handle).outlineStyle).toBe("solid");
    await waitFor(() => expect(getComputedStyle(handle, "::after").opacity).toBe("1"));
    // Towards the line's end widens: ArrowRight, or ArrowLeft in right to left.
    await userEvent.keyboard(isRtl(handle) ? "{ArrowLeft}" : "{ArrowRight}");
    await expect(handle).toHaveAttribute("aria-valuenow", "248");
    await userEvent.keyboard("{Home}");
    await expect(handle).toHaveAttribute("aria-valuenow", "120");
  },
};

/** The table's one reveal of a cut value, which it portals: the whole text, one line per cut part. */
const cutReveal = (el: Element) =>
  el.ownerDocument.querySelector<HTMLElement>('[data-slot="table-cell-reveal"]');

/** A finger held on an element for `ms`, as a touch screen sends it. */
const longPress = async (el: Element, ms = 650) => {
  const { left, top } = el.getBoundingClientRect();
  const at = { bubbles: true, pointerType: "touch", clientX: left + 8, clientY: top + 8 };
  el.dispatchEvent(new PointerEvent("pointerdown", at));
  await new Promise((resolve) => setTimeout(resolve, ms));
  el.dispatchEvent(new PointerEvent("pointerup", at));
  el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
};

/** What a press on the last row would open, so the play can tell a long press from a tap. */
let overlayOpened = 0;

/** A value that must be read whole wraps (`wrap`); a hash or URN inside it breaks anywhere as an `Id` with `break-all`, and a link in it wraps with the text. A heading that must be read whole wraps too, inside its sort button. A value its column cuts shows whole in the table's one tooltip, and only while it is cut: on hover, while the keyboard is on the cell or a link in it, and after a long press on a touch screen, which then opens nothing. Escape closes it. A cut heading shows whole the same way. */
export const WrapAndTitles: Story = {
  name: "Wrapping and cut values",
  render: () => (
    <Table label="Source imports" className="table-fixed" style={{ maxWidth: 640 }}>
      <thead>
        <tr>
          <Table.Header width={72} align="end">
            Order
          </Table.Header>
          <Table.Header width={200}>Source</Table.Header>
          <Table.Header width={112} align="end" wrap sort={false} onSort={() => {}}>
            Controls included
          </Table.Header>
          <Table.Header width={220}>Reference in the source catalog's back matter</Table.Header>
        </tr>
      </thead>
      <tbody>
        <Table.Row>
          <Table.Cell align="end">1</Table.Cell>
          <Table.Cell>
            <Text>NIST SP 800-53 Rev 5 moderate baseline, tailored for the ground segment</Text>
          </Table.Cell>
          <Table.Cell align="end">287</Table.Cell>
          <Table.Cell wrap>
            <Id className="break-all">urn:uuid:5020259a-1767-5221-bb99-85c7c3a0f2d1</Id>
          </Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell align="end">2</Table.Cell>
          <Table.Cell>Organization overlay</Table.Cell>
          <Table.Cell align="end">41</Table.Cell>
          <Table.Cell wrap>Inherited from the program's control set and its tailoring</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell align="end">3</Table.Cell>
          <Table.Cell wrap>
            <TextLink href="#base-profile">
              Base profile · NIST SP 800-53 Rev 5 moderate · 5.1.1
            </TextLink>
          </Table.Cell>
          <Table.Cell align="end">218</Table.Cell>
          <Table.Cell wrap>
            <Id className="break-all">urn:uuid:8a1c4be0-52d7-4f0e-9a51-3c0d7e61b2aa</Id>
          </Table.Cell>
        </Table.Row>
        <Table.Row onClick={() => (overlayOpened += 1)}>
          <Table.Cell align="end">4</Table.Cell>
          <Table.Cell>
            <TextLink href="#ground-overlay">
              Ground segment overlay for operational technology and its field sites
            </TextLink>
          </Table.Cell>
          <Table.Cell align="end">12</Table.Cell>
          <Table.Cell wrap>
            <Id className="break-all">urn:uuid:0d6f3a2e-9b14-4c7a-8f21-6e5b1a9c4d30</Id>
          </Table.Cell>
        </Table.Row>
      </tbody>
    </Table>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole("table", { name: "Source imports" });
    const reference = within(table)
      .getAllByText(/^urn:uuid:/)[0]!
      .closest("td")!;
    // Wrapped, the whole value is on screen and the cell has no title to stand in for it.
    await expect(reference).not.toHaveAttribute("title");
    await expect(textBox(reference).height).toBeGreaterThan(20);
    await expect(reference.scrollWidth).toBeLessThanOrEqual(reference.clientWidth);

    // Cut, a value shows whole in the table's reveal while the pointer rests on it. No cell takes
    // a title, which would show it a second time and only to a mouse.
    const source = within(table)
      .getByText(/moderate baseline/)
      .closest("td")!;
    await expect(source).not.toHaveAttribute("title");
    await userEvent.hover(source);
    await waitFor(() =>
      expect(cutReveal(source)).toHaveTextContent(
        "NIST SP 800-53 Rev 5 moderate baseline, tailored for the ground segment",
      ),
    );
    // It is a visual copy of words the cell already holds.
    await expect(cutReveal(source)).toHaveAttribute("aria-hidden", "true");
    await userEvent.unhover(source);
    await waitFor(() => expect(cutReveal(source)).toBeNull());
    // A value that fits shows nothing more, and has no title either.
    const fits = within(table).getByText("Organization overlay");
    await expect(fits).not.toHaveAttribute("title");
    await userEvent.hover(fits);
    await new Promise((resolve) => setTimeout(resolve, 500));
    await expect(cutReveal(fits)).toBeNull();
    await userEvent.unhover(fits);

    // From the keyboard: the cut name shows whole while its link has focus, and Escape closes the
    // reveal and nothing else.
    const overlay = within(table).getByRole("link", { name: /^Ground segment overlay/ });
    await expect(overlay.scrollWidth).toBeGreaterThan(overlay.clientWidth);
    overlay.blur();
    await userEvent.click(canvas.getByRole("columnheader", { name: "Order" }));
    for (let i = 0; i < 8 && canvasElement.ownerDocument.activeElement !== overlay; i++)
      await userEvent.tab();
    await expect(overlay).toHaveFocus();
    await waitFor(() =>
      expect(cutReveal(overlay)).toHaveTextContent(
        "Ground segment overlay for operational technology and its field sites",
      ),
    );
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(cutReveal(overlay)).toBeNull());
    await expect(overlay).toHaveFocus();
    overlay.blur();

    // On a touch screen a long press shows it, and the press opens nothing; a tap still does.
    overlayOpened = 0;
    const overlayCell = overlay.closest("td")!;
    await longPress(overlayCell);
    await waitFor(() =>
      expect(cutReveal(overlayCell)).toHaveTextContent(/^Ground segment overlay/),
    );
    await expect(overlayOpened).toBe(0);
    // The next press anywhere closes it.
    canvasElement.ownerDocument.body.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" }),
    );
    await waitFor(() => expect(cutReveal(overlayCell)).toBeNull());
    await userEvent.click(within(overlayCell.closest("tr")!).getByText("12"));
    await expect(overlayOpened).toBe(1);

    // A cut heading shows whole on hover; it is a heading, so it needs no title either.
    const cutHeading = within(table).getByRole("columnheader", {
      name: /^Reference in the source/,
    });
    const label = headingLabel(cutHeading);
    await expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
    await expect(label).not.toHaveAttribute("title");
    await userEvent.hover(label);
    await waitFor(() =>
      expect(
        canvasElement.ownerDocument.querySelector('[data-slot="truncate-full-text"]'),
      ).toHaveTextContent("Reference in the source catalog's back matter"),
    );
    await userEvent.unhover(label);
    await waitFor(() =>
      expect(
        canvasElement.ownerDocument.querySelector('[data-slot="truncate-full-text"]'),
      ).toBeNull(),
    );

    // A link in a wrapping cell wraps with it: it is not cut to one line.
    const link = within(table).getByRole("link", { name: /^Base profile/ });
    await expect(getComputedStyle(link).whiteSpace).not.toBe("nowrap");
    await expect(link.scrollWidth).toBeLessThanOrEqual(link.clientWidth + 1);
    await expect(link.getClientRects().length).toBeGreaterThan(1);
    // A wrapping heading grows its sort button with it, so no line of it spills out of the header.
    const heading = within(table).getByRole("columnheader", { name: "Controls included" });
    const button = within(heading).getByRole("button").getBoundingClientRect();
    const words = textBox(headingLabel(heading));
    await expect(words.height).toBeGreaterThan(20);
    await expect(words.top).toBeGreaterThanOrEqual(button.top - 1);
    await expect(words.bottom).toBeLessThanOrEqual(button.bottom + 1);
    await expect(button.bottom).toBeLessThanOrEqual(heading.getBoundingClientRect().bottom + 1);
  },
};

/** Right to left: the table mirrors. Text starts at the right, a number ends at the left, and each heading sits where its column's values do. */
export const RightToLeft: Story = {
  name: "Right to left",
  render: () => (
    <LedgerProvider direction="rtl">
      <Table label="Controls, right to left" style={{ maxWidth: 520 }}>
        <thead>
          <tr>
            <Table.Header width={120}>Id</Table.Header>
            <Table.Header>Kind</Table.Header>
            <Table.Header width={110} align="end">
              Controls
            </Table.Header>
          </tr>
        </thead>
        <tbody>
          {parts.slice(0, 3).map((p) => (
            <Table.Row key={p.id}>
              <Table.Id id={p.id} />
              <Table.Cell>{p.kind}</Table.Cell>
              <Table.Cell align="end">{String(p.controls)}</Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
    </LedgerProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole("table", { name: "Controls, right to left" });
    const t = within(table);
    const kind = textBox(headingLabel(t.getByRole("columnheader", { name: "Kind" })));
    const controls = textBox(headingLabel(t.getByRole("columnheader", { name: "Controls" })));
    for (const cell of t.getAllByRole("cell")) {
      const box = textBox(cell);
      if (/^\d+$/.test(cell.textContent!))
        // A number ends at the column's left, under its heading's end.
        await expect(Math.abs(box.left - controls.left)).toBeLessThanOrEqual(1);
      else if (/^(System|Subsystem|Component)$/.test(cell.textContent!))
        // Text starts at the column's right, under its heading's start.
        await expect(Math.abs(box.right - kind.right)).toBeLessThanOrEqual(1);
    }
  },
};

function Scores({ align }: { align: "end" | "center" }) {
  return (
    <Table label="Scores">
      <thead>
        <tr>
          <Table.Header width={110}>Risk</Table.Header>
          <Table.Header>Title</Table.Header>
          <Table.Header width={90} align={align}>
            Score
          </Table.Header>
        </tr>
      </thead>
      <tbody>
        {risks.slice(0, 3).map((r) => (
          <Table.Row key={r.id}>
            <Table.Id id={r.id} />
            <Table.Cell>{r.title}</Table.Cell>
            <Table.Cell align={align}>{String(r.score)}</Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

function Selected({ withColumn }: { withColumn: boolean }) {
  return (
    <Table label="Controls">
      <thead>
        <tr>
          {withColumn ? (
            <Table.Selection
              header
              checked={false}
              indeterminate
              onCheckedChange={() => {}}
              label="Select all"
            />
          ) : null}
          <Table.Header width={110}>Id</Table.Header>
          <Table.Header>Control</Table.Header>
        </tr>
      </thead>
      <tbody>
        {rows.slice(0, 3).map((r, i) => (
          <Table.Row key={r.id} isSelected={i === 1}>
            {withColumn ? (
              <Table.Selection
                checked={i === 1}
                onCheckedChange={() => {}}
                label={`Select ${r.id}`}
              />
            ) : null}
            <Table.Id id={r.id} />
            <Table.Cell>{r.name}</Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

function Owners({ absent }: { absent: boolean }) {
  return (
    <Table label="Owners">
      <thead>
        <tr>
          <Table.Header width={110}>Risk</Table.Header>
          <Table.Header>Owner</Table.Header>
        </tr>
      </thead>
      <tbody>
        <Table.Row>
          <Table.Id id="RSK-001" />
          <Table.Cell>Sarah Chen</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Id id="RSK-002" />
          <Table.Cell>{absent ? <Absent /> : "—"}</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Id id="RSK-003" />
          <Table.Cell>{absent ? <Absent /> : "N/A"}</Table.Cell>
        </Table.Row>
      </tbody>
    </Table>
  );
}

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.400">
      <Pair
        do={<Scores align="end" />}
        doText={'Numbers end, in tabular numerals, and so does their header: align="end" on both.'}
        dont={<Scores align="center" />}
        dontText="Centred numbers. The digits never line up, so the eye cannot compare down the column."
      />
      <Pair
        do={<Selected withColumn />}
        doText="Selection is the checkbox column; the header's box chooses the page."
        dont={<Selected withColumn={false} />}
        dontText="A row painted selected by its click. The click is how a row opens, and a screen reader hears nothing chosen."
      />
      <Pair
        do={<Owners absent />}
        doText="An absent value is Absent."
        dont={<Owners absent={false} />}
        dontText="A dash typed by hand and an N/A. Two spellings of nothing, neither of which a sort or a filter understands."
      />
    </Stack>
  ),
};

/** Selection cells must keep their pinning geometry when composed after another pinned column. */
export const SelectionPinning: Story = {
  render: () => <PinnedSelection />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = canvas.getByRole("checkbox", { name: "Select page" });
    const row = canvas.getByRole("checkbox", { name: "Select record" });
    await expect(page.closest("th")).toHaveStyle({ insetInlineStart: "48px" });
    await expect(row.closest("td")).toHaveStyle({ insetInlineStart: "48px" });
    await expect(getComputedStyle(row.closest("td")!, "::after").borderInlineEndWidth).toBe("1px");
    await userEvent.click(row);
    await expect(row).toBeChecked();
    await expect(page).toBeChecked();
  },
};

function PinnedSelection() {
  const [checked, setChecked] = useState(false);
  return (
    <Table label="Selection geometry">
      <thead>
        <Table.Row>
          <Table.Header width={48}>Id</Table.Header>
          <Table.Selection
            header
            checked={checked}
            onCheckedChange={setChecked}
            label="Select page"
            pinned="start"
            offset={48}
            edge
          />
          <Table.Header>Name</Table.Header>
        </Table.Row>
      </thead>
      <tbody>
        <Table.Row>
          <Table.Cell>A</Table.Cell>
          <Table.Selection
            checked={checked}
            onCheckedChange={setChecked}
            label="Select record"
            pinned="start"
            offset={48}
            edge
          />
          <Table.Cell>Example record</Table.Cell>
        </Table.Row>
      </tbody>
    </Table>
  );
}

/** The frame takes the rest of a bounded column and scrolls inside it; the header sticks to the frame. The DataTable's `fill` builds this column for the register that is the page. */
export const FillFrame: Story = {
  name: "Fill frame",
  render: () => (
    <div className="flex flex-col" style={{ height: 320 }}>
      <Table fill label="Fitted controls">
        <thead>
          <Table.Row>
            <Table.Header>Id</Table.Header>
            <Table.Header>Control</Table.Header>
            <Table.Header>Owner</Table.Header>
          </Table.Row>
        </thead>
        <tbody>
          {Array.from({ length: 40 }, (_, i) => (
            <Table.Row key={i}>
              <Table.Cell>CTRL-{String(400 + i)}</Table.Cell>
              <Table.Cell>Access review {i + 1}</Table.Cell>
              <Table.Cell>Dana Whitfield</Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const frame = canvas.getByRole("table", { name: "Fitted controls" }).parentElement!;
    await waitFor(() => expect(frame).toHaveAttribute("tabindex", "0"));
    await expect(frame).toHaveAttribute("role", "region");
    await expect(frame.clientHeight).toBeLessThanOrEqual(320);
    await expect(frame.scrollHeight).toBeGreaterThan(frame.clientHeight);
    frame.scrollTop = 200;
    const header = canvas.getAllByRole("columnheader")[0]!;
    await waitFor(() =>
      expect(
        Math.abs(header.getBoundingClientRect().top - frame.getBoundingClientRect().top),
      ).toBeLessThanOrEqual(1),
    );
    // The hairline is the heading's own, so it stays under the stuck header.
    await expect(getComputedStyle(header, "::before").borderBottomWidth).toBe("1px");
  },
};

/** Content can grow inside a fixed frame; refs retain their native targets and cleanup. */
export const DynamicFrame: Story = {
  render: function Example() {
    const [wide, setWide] = useState(false);
    const [mounted, setMounted] = useState(true);
    const [report, setReport] = useState("Ready");
    const table = useRef<HTMLTableElement>(null);
    const calls = useRef({ attached: 0, cleaned: 0 });
    const frameRef = useCallback((node: HTMLDivElement | null) => {
      if (!node) return;
      calls.current.attached++;
      return () => {
        calls.current.cleaned++;
      };
    }, []);
    return (
      <Stack>
        <div style={{ width: 260 }}>
          {mounted ? (
            <Table
              ref={table}
              frameRef={frameRef}
              label="Dynamic records"
              style={{ width: wide ? 640 : "100%" }}
              tabIndex={-1}
            >
              <thead>
                <Table.Row>
                  <Table.Header>Record</Table.Header>
                  <Table.Header>Status</Table.Header>
                </Table.Row>
              </thead>
              <tbody>
                <Table.Row>
                  <Table.Cell>PRG-1041</Table.Cell>
                  <Table.Cell>Active</Table.Cell>
                </Table.Row>
              </tbody>
            </Table>
          ) : null}
        </div>
        <Button onClick={() => setWide((value) => !value)}>Toggle columns</Button>
        <Button onClick={() => table.current?.focus()}>Focus table</Button>
        <Button onClick={() => setMounted(false)}>Remove table</Button>
        <Button
          onClick={() =>
            setReport(`${calls.current.attached} attached, ${calls.current.cleaned} cleaned`)
          }
        >
          Inspect refs
        </Button>
        <Text role="status">{report}</Text>
      </Stack>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole("table", { name: "Dynamic records" });
    const frame = table.parentElement!;
    await waitFor(() => expect(frame).not.toHaveAttribute("tabindex"));
    await userEvent.click(canvas.getByRole("button", { name: "Toggle columns" }));
    await waitFor(() => expect(frame).toHaveAttribute("tabindex", "0"));
    await expect(frame).toHaveAttribute("role", "region");
    await expect(frame).toHaveAttribute("data-scrolled-end");
    frame.scrollTo({ left: towardsEnd(frame, 120) });
    await waitFor(() => expect(frame).toHaveAttribute("data-scrolled-start"));
    await userEvent.click(canvas.getByRole("button", { name: "Toggle columns" }));
    await waitFor(() => expect(frame).not.toHaveAttribute("tabindex"));
    await expect(frame).not.toHaveAttribute("data-scrolled-end");
    await userEvent.click(canvas.getByRole("button", { name: "Focus table" }));
    await expect(table).toHaveFocus();
    await userEvent.click(canvas.getByRole("button", { name: "Inspect refs" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("1 attached, 0 cleaned");
    await userEvent.click(canvas.getByRole("button", { name: "Remove table" }));
    await userEvent.click(canvas.getByRole("button", { name: "Inspect refs" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("1 attached, 1 cleaned");
  },
};
