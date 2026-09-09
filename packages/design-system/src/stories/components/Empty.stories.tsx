import { useId, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Link2, Search } from "lucide-react";

import {
  Button,
  Card,
  CardContent,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  TextLink,
} from "../../components";

const meta = {
  title: "Components/Empty",
  component: Empty,
  parameters: { layout: "padded" },
  args: { size: "default", ref: fn() },
} satisfies Meta<typeof Empty>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: function Example(args) {
    const id = useId();
    const [cleared, setCleared] = useState(false);
    return (
      <Empty {...args} role="region" aria-labelledby={id} className="max-w-layout-measure">
        <EmptyMedia variant="icon" aria-hidden>
          <Search className="opacity-loading" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle id={id}>{cleared ? "All filters cleared" : "No controls match"}</EmptyTitle>
          <EmptyDescription>Clear a filter or widen the date range.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="small" variant="link" onClick={() => setCleared(true)}>
            Clear filters
          </Button>
          <TextLink href="#search-help" size="small">
            Search help
          </TextLink>
        </EmptyContent>
      </Empty>
    );
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(args.ref).toHaveBeenCalledWith(
      canvas.getByRole("region", { name: "No controls match" }),
    );
    await userEvent.click(canvas.getByRole("button", { name: "Clear filters" }));
    await expect(canvas.getByRole("region", { name: "All filters cleared" })).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Search help" })).toHaveAttribute(
      "href",
      "#search-help",
    );
  },
};

export const Compact: Story = {
  render: () => (
    <div className="flex flex-col gap-200" style={{ maxWidth: 320 }}>
      <Card>
        <CardContent>
          <Empty size="compact">
            <EmptyMedia variant="icon" aria-hidden>
              <Link2 />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>Nothing linked yet</EmptyTitle>
              <EmptyDescription>Link the findings this control answers.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="small" variant="link">
                Link a finding
              </Button>
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>
      <Empty size="compact">
        <EmptyHeader>
          <EmptyTitle>No evidence yet</EmptyTitle>
        </EmptyHeader>
      </Empty>
    </div>
  ),
};

export const CustomMedia: Story = {
  render: () => (
    <Empty className="max-w-layout-measure items-center text-center">
      <EmptyHeader className="items-center">
        <EmptyMedia>
          <span className="font-heading-large" aria-hidden>
            01
          </span>
        </EmptyMedia>
        <EmptyTitle>Start your first assessment</EmptyTitle>
        <EmptyDescription>Choose a program and add its evidence.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="small">Create assessment</Button>
      </EmptyContent>
    </Empty>
  ),
};
