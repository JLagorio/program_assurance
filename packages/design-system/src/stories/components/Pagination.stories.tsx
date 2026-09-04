import type { Meta, StoryObj } from "@storybook/react-vite";

import { Pagination } from "../../components";
import { Stack } from "../../primitives";

const meta = {
  title: "Components/Pagination",
  component: Pagination,
  parameters: { layout: "padded" },
  args: { page: 1, pageCount: 12, onPageChange: () => {} },
} satisfies Meta<typeof Pagination>;
export default meta;
type Story = StoryObj<typeof meta>;

/** First page, a middle page with the range, the last page, and a single page. */
export const PaginationMatrix: Story = {
  parameters: {
    // The matrix stacks four pagination navs; a page has one. A false positive of the layout, not a defect.
    a11y: { config: { rules: [{ id: "landmark-unique", enabled: false }] } },
  },
  render: () => (
    <Stack space="space.200" className="max-w-layout-measure">
      <Pagination page={1} pageCount={12} onPageChange={() => {}} total={289} pageSize={25} />
      <Pagination page={6} pageCount={12} onPageChange={() => {}} total={289} pageSize={25} />
      <Pagination page={12} pageCount={12} onPageChange={() => {}} total={289} pageSize={25} />
      <Pagination page={1} pageCount={1} onPageChange={() => {}} total={5} pageSize={25} />
    </Stack>
  ),
};
