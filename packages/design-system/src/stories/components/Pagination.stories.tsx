import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef, useState, type MouseEvent } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import {
  Button,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
  type PaginationProps,
} from "../../components";
import { TablePagination } from "../../patterns/data-table/pagination";

const meta = {
  title: "Components/Pagination",
  component: Pagination,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Pagination>;
export default meta;
type Story = StoryObj<typeof meta>;
const linkClick = fn((event: MouseEvent<HTMLAnchorElement>) => event.preventDefault());
const linkRef = createRef<HTMLAnchorElement>();
export const Links: Story = {
  render: () => (
    <Pagination aria-label="Control pages">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="?page=1" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=1" aria-label="Page 1">
            1
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink
            ref={linkRef}
            onClick={linkClick}
            href="?page=2"
            aria-label="Page 2"
            isActive
          >
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=3" aria-label="Page 3">
            3
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="?page=3" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  ),
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement).getByRole("navigation", { name: "Control pages" });
    const active = within(nav).getByRole("link", { name: "Page 2" });
    await expect(linkRef.current).toBe(active);
    await expect(active).toHaveAttribute("href", "?page=2");
    await expect(active).toHaveAttribute("aria-current", "page");
    await expect(within(nav).getByRole("link", { name: "Previous page" })).toHaveAttribute(
      "href",
      "?page=1",
    );
    await expect(within(nav).queryByRole("button")).toBeNull();
    linkClick.mockClear();
    active.focus();
    await userEvent.keyboard(" ");
    await expect(linkClick).not.toHaveBeenCalled();
    await userEvent.keyboard("{Enter}");
    await expect(linkClick).toHaveBeenCalledTimes(1);
  },
};
function ResultPages({
  label,
  pages = [1, "gap-start", 4, 5, 6, "gap-end", 12],
  ...props
}: { label: string; pages?: (number | string)[] | undefined } & Omit<PaginationProps, "children">) {
  return (
    <Pagination aria-label={label} {...props}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="?page=4" />
        </PaginationItem>
        {pages.map((page) => (
          <PaginationItem key={page}>
            {typeof page === "string" ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                href={`?page=${page}`}
                aria-label={`Page ${page}`}
                isActive={page === 5}
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext href="?page=6" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
const wordsShown = (nav: HTMLElement) =>
  [...nav.querySelectorAll<HTMLElement>('[data-slot="pagination-label"]')].map(
    (word) => getComputedStyle(word).display !== "none",
  );

/** The pagination measures itself, not the window: on a wide page Previous and Next carry their words; in a 320px panel on the same screen they are arrows, named for a screen reader, and every link stays at least 24px. */
export const InANarrowPanel: Story = {
  render: () => (
    <div className="flex flex-col gap-300">
      <ResultPages label="Results on the page" />
      <section aria-label="Narrow panel" style={{ maxWidth: 320 }}>
        <ResultPages label="Results in the panel" />
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = canvas.getByRole("navigation", { name: "Results on the page" });
    const panel = canvas.getByRole("navigation", { name: "Results in the panel" });
    const wide = page.getBoundingClientRect().width >= 384;
    await expect(wordsShown(page)).toEqual([wide, wide]);
    await expect(wordsShown(panel)).toEqual([false, false]);
    const previous = within(panel).getByRole("link", { name: "Previous page" });
    await expect(previous).toHaveAttribute("href", "?page=4");
    const bounds = panel.getBoundingClientRect();
    for (const link of within(panel).getAllByRole("link")) {
      const box = link.getBoundingClientRect();
      await expect(box.width).toBeGreaterThanOrEqual(24);
      await expect(box.height).toBeGreaterThanOrEqual(24);
      await expect(box.right).toBeLessThanOrEqual(bounds.right + 0.5);
    }
    const doc = canvasElement.ownerDocument.documentElement;
    await expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);
  },
};

/** At the end of a row, after a caption, the pagination takes the rest of the row (`min-w-0 flex-1 justify-end`): on a wide page a long list keeps its words on one line at the row's end, and in a 320px panel row it shrinks to arrows and wraps inside the row. */
export const AtTheEndOfARow: Story = {
  render: () => (
    <div className="flex flex-col gap-300">
      <div className="flex items-center gap-200">
        <span className="font-body-small whitespace-nowrap text-subtle">Rows 41–50 of 120</span>
        <ResultPages
          label="Results at the end of a row"
          pages={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}
          className="min-w-0 flex-1 justify-end"
        />
      </div>
      <section
        aria-label="Narrow panel"
        className="flex items-center gap-200"
        style={{ maxWidth: 320 }}
      >
        <span className="font-body-small whitespace-nowrap text-subtle">41–50</span>
        <ResultPages
          label="Results at the end of a panel row"
          className="min-w-0 flex-1 justify-end"
        />
      </section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const name of ["Results at the end of a row", "Results at the end of a panel row"]) {
      const nav = canvas.getByRole("navigation", { name });
      const row = nav.parentElement!;
      const caption = nav.previousElementSibling!.getBoundingClientRect();
      const room =
        row.getBoundingClientRect().right -
        caption.right -
        parseFloat(getComputedStyle(row).columnGap);
      const bounds = nav.getBoundingClientRect();
      // The rest of the row, with no 384px cap, and never collapsed.
      await expect(Math.abs(bounds.width - room)).toBeLessThanOrEqual(1);
      const wide = bounds.width >= 384;
      await expect(wordsShown(nav)).toEqual([wide, wide]);
      for (const link of within(nav).getAllByRole("link")) {
        const box = link.getBoundingClientRect();
        await expect(box.width).toBeGreaterThanOrEqual(24);
        await expect(box.left).toBeGreaterThanOrEqual(bounds.left - 0.5);
        await expect(box.right).toBeLessThanOrEqual(bounds.right + 0.5);
      }
      const list = nav.querySelector<HTMLElement>('[data-slot="pagination-content"]')!;
      // justify-end: the list ends where the row does.
      await expect(Math.abs(list.getBoundingClientRect().right - bounds.right)).toBeLessThanOrEqual(
        1,
      );
      // Where the row holds the whole list, it stays on one line.
      const items = [...list.children] as HTMLElement[];
      const gap = parseFloat(getComputedStyle(list).columnGap);
      const oneLine =
        items.reduce((sum, item) => sum + item.getBoundingClientRect().width, 0) +
        gap * (items.length - 1);
      if (bounds.width >= oneLine + 1) {
        const tops = new Set(items.map((item) => Math.round(item.getBoundingClientRect().top)));
        await expect(tops.size).toBe(1);
      }
    }
    const doc = canvasElement.ownerDocument.documentElement;
    await expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);
  },
};

function InMemoryDemo() {
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(23);
  return (
    <div className="flex max-w-layout-measure flex-col gap-150">
      <p role="status">
        {total ? `Rows ${(page - 1) * 8 + 1}–${Math.min(page * 8, total)}` : "No matching rows"}
      </p>
      <TablePagination
        page={page}
        pageCount={Math.max(1, Math.ceil(total / 8))}
        pageSize={8}
        total={total}
        onPageChange={setPage}
        label="Risks pagination"
      />
      <Button
        onClick={() => {
          setTotal(0);
          setPage(1);
        }}
      >
        Filter to no rows
      </Button>
    </div>
  );
}
export const InMemoryTable: Story = {
  render: () => <InMemoryDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Previous page" })).toBeDisabled();
    await userEvent.click(canvas.getByRole("button", { name: "Next page" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Rows 9–16");
    await expect(canvas.getByRole("button", { name: "Page 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Page 3" }));
    await expect(canvas.getByRole("button", { name: "Next page" })).toBeDisabled();
    await expect(canvas.getByRole("status")).toHaveTextContent("Rows 17–23");
    await userEvent.click(canvas.getByRole("button", { name: "Filter to no rows" }));
    await expect(canvas.getByRole("button", { name: "Next page" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "Previous page" })).toBeDisabled();
    await expect(canvas.getByRole("status")).toHaveTextContent("No matching rows");
  },
};
export const ManyPages: Story = {
  render: () => (
    <div className="flex max-w-layout-measure flex-col gap-200">
      {[1, 6, 12].map((page) => (
        <TablePagination
          key={page}
          page={page}
          pageCount={12}
          total={289}
          pageSize={25}
          onPageChange={() => {}}
          label={`Results at page ${page}`}
        />
      ))}
    </div>
  ),
};
