import type { Meta, StoryObj } from "@storybook/react-vite";

import { Skeleton, Table } from "@/ds/primitives";
import { Card } from "@/ds/patterns";

const meta = {
  title: "Primitives/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  args: { lines: 1 },
  argTypes: {
    lines: { control: { type: "number", min: 1, max: 6 } },
    className: { control: false },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div className="max-w-[320px]">
      <Skeleton {...args} />
    </div>
  ),
};

/** A record card and a table while their data loads. The shapes hold the layout so nothing shifts when content lands. */
export const Loading: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid max-w-[880px] gap-6 md:grid-cols-[300px_minmax(0,1fr)]">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="w-1/2" />
            <Skeleton className="w-1/3" />
          </div>
        </div>
        <Skeleton lines={3} className="mt-5" />
      </Card>
      <Card>
        <Table>
          <thead>
            <tr>
              <Table.Header className="w-[96px]">Finding</Table.Header>
              <Table.Header>Title</Table.Header>
              <Table.Header className="w-[120px]">Status</Table.Header>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }, (_, i) => (
              <Table.Row key={i}>
                <Table.Cell>
                  <Skeleton className="w-16" />
                </Table.Cell>
                <Table.Cell>
                  <Skeleton className={i % 2 ? "w-3/4" : "w-1/2"} />
                </Table.Cell>
                <Table.Cell>
                  <Skeleton className="h-4 w-20 rounded-full" />
                </Table.Cell>
              </Table.Row>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  ),
};
