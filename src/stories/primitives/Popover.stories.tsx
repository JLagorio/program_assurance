import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronDown, ListFilter } from "lucide-react";

import { Button, Checkbox, Field, Popover, Select } from "@/ds/primitives";

const meta = {
  title: "Primitives/Popover",
  component: Popover,
  tags: ["autodocs"],
  args: { side: "bottom", align: "start", width: 280, trigger: null, children: null },
  argTypes: {
    side: { control: "inline-radio", options: ["top", "right", "bottom", "left"] },
    align: { control: "inline-radio", options: ["start", "center", "end"] },
    width: { control: "number" },
    defaultOpen: { control: false },
    open: { control: false },
    onOpenChange: { control: false },
    className: { control: false },
    trigger: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

const statuses = ["Open", "Overdue", "Closed", "Risk accepted"];
const owners = ["Anyone", "D. Reyes", "K. Lund", "M. Okafor"];

/** A filter form anchored to its button: Fields, a Checkbox, and a footer whose buttons close it. */
export const Filters: Story = {
  render: (args) => (
    <div className="h-[380px]">
      <Popover
        {...args}
        defaultOpen
        trigger={
          <Button>
            <ListFilter className="size-3.5 text-muted-foreground" />
            Filter
            <ChevronDown className="size-3 text-muted-foreground" />
          </Button>
        }
      >
        <div className="space-y-3">
          <Field label="Status">
            <Select defaultValue="Open">
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="Owner">
            <Select defaultValue="Anyone">
              {owners.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </Select>
          </Field>
          <Checkbox defaultChecked>Include inherited controls</Checkbox>
          <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
            <Popover.Close>
              <Button variant="ghost" size="sm">
                Cancel
              </Button>
            </Popover.Close>
            <Popover.Close>
              <Button variant="primary" size="sm">
                Apply
              </Button>
            </Popover.Close>
          </div>
        </div>
      </Popover>
    </div>
  ),
};
