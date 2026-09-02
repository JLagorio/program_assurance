import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus } from "lucide-react";

import { Badge, Button, KeyValue, Person, Sheet, Id } from "@/ds/primitives";
import { behindPage } from "../_lib/fixtures";

const noop = () => {};

const meta = {
  title: "Primitives/Sheet",
  component: Sheet,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: { story: { inline: false, height: "560px" } },
  },
  decorators: [behindPage],
  args: {
    open: true,
    onClose: noop,
    side: "right",
    title: "Shared admin account on jump host",
    subtitle: "FND-2231 · opened 2026-08-14 by D. Reyes",
    children: null,
  },
  argTypes: {
    open: { control: "boolean" },
    side: { control: "inline-radio", options: ["right", "left"] },
    title: { control: "text" },
    subtitle: { control: "text" },
    onClose: { control: false },
    children: { control: false },
    footer: { control: false },
  },
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Detail beside the page: subtitle, facts, running text, one action, footer. */
export const Open: Story = {
  args: {
    footer: (
      <>
        <Button variant="ghost">Close</Button>
        <Button variant="primary">Open finding</Button>
      </>
    ),
    children: (
      <>
        <dl>
          <KeyValue label="Control">
            <Id>AC-2(3)</Id>
          </KeyValue>
          <KeyValue label="Severity">
            <Badge tone="danger" size="xs">
              Critical
            </Badge>
          </KeyValue>
          <KeyValue label="Status">
            <Badge tone="danger">Overdue</Badge>
          </KeyValue>
          <KeyValue label="Owner">
            <Person name="D. Reyes" />
          </KeyValue>
          <KeyValue label="Due">
            <span className="tnum">2026-08-28</span>
          </KeyValue>
        </dl>
        <p className="mt-4 text-[13px] leading-relaxed">
          The jump host has a local administrator account shared by the operations team. Access is
          not attributable to an individual and the account is not covered by the 90-day inactivity
          job.
        </p>
        <div className="mt-4">
          <Button size="sm">
            <Plus className="size-3.5" />
            Add evidence
          </Button>
        </div>
      </>
    ),
  },
};

/** The same surface from the left edge. */
export const FromLeft: Story = {
  args: {
    side: "left",
    children: <p className="text-[13px]">Filters and saved views live here.</p>,
  },
};
