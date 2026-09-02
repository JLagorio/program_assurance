import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Pagination } from "@/ds/primitives";
import { Spec } from "../_lib/tokens";

const meta = {
  title: "Primitives/Pagination",
  component: Pagination,
  tags: ["autodocs"],
  args: { page: 3, pageCount: 28, total: 1391, pageSize: 50, onPageChange: () => {} },
  argTypes: {
    page: { control: "number" },
    pageCount: { control: "number" },
    total: { control: "number" },
    pageSize: { control: "number" },
    onPageChange: { control: false },
    className: { control: false },
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

function Live({
  pageCount,
  total,
  pageSize,
}: {
  pageCount: number;
  total?: number;
  pageSize?: number;
}) {
  const [page, setPage] = useState(1);
  return (
    <Pagination
      page={page}
      pageCount={pageCount}
      onPageChange={setPage}
      {...(total !== undefined ? { total } : {})}
      {...(pageSize !== undefined ? { pageSize } : {})}
    />
  );
}

export const Playground: Story = {
  render: (args) => (
    <div className="max-w-[720px]">
      <Pagination {...args} />
    </div>
  ),
};

/** Under a table: the row range on the left, seven numbers with gaps on the right. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="max-w-[720px] space-y-6">
      <div className="space-y-1.5">
        <Spec>28 pages · 1,391 rows · 50 per page</Spec>
        <Live pageCount={28} total={1391} pageSize={50} />
      </div>
      <div className="space-y-1.5">
        <Spec>5 pages · no range</Spec>
        <Live pageCount={5} />
      </div>
      <div className="space-y-1.5">
        <Spec>1 page · buttons disabled</Spec>
        <Live pageCount={1} total={12} pageSize={50} />
      </div>
    </div>
  ),
};
