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
