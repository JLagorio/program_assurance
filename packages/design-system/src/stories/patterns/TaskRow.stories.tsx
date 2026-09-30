import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fireEvent, userEvent, within } from "storybook/test";

import { TaskRow } from "../..";
import { Badge, Button, Item, Person } from "../../components";
import { Stack, Text } from "../../primitives";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Patterns/TaskRow",
  component: TaskRow,
  parameters: { layout: "padded" },
  args: { title: "Review draft" },
} satisfies Meta<typeof TaskRow>;
export default meta;
type Story = StoryObj<typeof meta>;

export const TaskRowMatrix: Story = {
  render: () => (
    <Item.Group title="Checklist">
      <TaskRow
        title="Review draft"
        onCompletedChange={() => undefined}
        assignee={<Person name="Sam Rivera" />}
        due="Tomorrow"
        dueDateTime="2026-09-07"
      />
      <TaskRow title="Check figures" completed onCompletedChange={() => undefined} />
      <TaskRow
        title="Prepare handoff"
        status={
          <Badge variant="secondary" tone="information">
            Needs review
          </Badge>
        }
      />
      <TaskRow
        title="Save confirmation"
        completionDisabled
        onCompletedChange={() => undefined}
        status="Saving changes"
      />
      <TaskRow title="File the minutes" completed />
    </Item.Group>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The checkbox is named for the task, whether it is done or not; its state says which.
    await expect(canvas.getByRole("checkbox", { name: "Review draft" })).not.toBeChecked();
    await expect(canvas.getByRole("checkbox", { name: "Check figures" })).toBeChecked();
    await expect(canvas.getByRole("checkbox", { name: "Save confirmation" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    // A completed row without a checkbox says so in words, not only with the strike-through.
    const done = canvas.getByText("File the minutes");
    await expect(done.textContent).toBe("File the minutes, completed");
    await expect(canvas.getByText("Tomorrow").closest("time")).toHaveAttribute(
      "datetime",
      "2026-09-07",
    );
  },
};

export const Completion: Story = {
  render: function Example() {
    const [completed, setCompleted] = useState(false);
    const [opened, setOpened] = useState(0);
    const [actions, setActions] = useState(0);
    return (
      <Stack space="space.200">
        <Item.Group>
          <TaskRow
            title="Review draft"
            completed={completed}
            onCompletedChange={setCompleted}
            onSelect={() => setOpened((count) => count + 1)}
            actions={<Button onClick={() => setActions((count) => count + 1)}>Details</Button>}
          />
        </Item.Group>
        <Text>
          Opened: {opened}; actions: {actions}
        </Text>
      </Stack>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // One name through the change: the checked state, not the name, says the task is done.
    const checkbox = canvas.getByRole("checkbox", { name: "Review draft" });
    await userEvent.click(checkbox);
    await expect(checkbox).toBeChecked();
    await expect(checkbox).toHaveAccessibleName("Review draft");
    await expect(canvas.getByText("Opened: 0; actions: 0")).toBeVisible();
    await userEvent.keyboard(" ");
    await expect(checkbox).not.toBeChecked();
    await fireEvent.click(canvasElement.querySelector<HTMLInputElement>('input[type="checkbox"]')!);
    await expect(checkbox).toBeChecked();
    await expect(canvas.getByText("Opened: 0; actions: 0")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Review draft" }));
    await userEvent.click(canvas.getByRole("button", { name: "Details" }));
    await expect(canvas.getByText("Opened: 1; actions: 1")).toBeVisible();
  },
};

export const Dont: Story = {
  render: () => (
    <Pair
      do={
        <Item.Group>
          <TaskRow
            title="Review draft"
            status={
              <Badge variant="secondary" tone="information">
                Needs review
              </Badge>
            }
          />
        </Item.Group>
      }
      doText="Supply your product's status as content. Completion is a separate boolean."
      dont={
        <Item.Group>
          <TaskRow title="Review draft — status 3 — assigned 1042" />
        </Item.Group>
      }
      dontText="Do not expose storage codes or bury every field in the title."
    />
  ),
};
export const Playground: Story = {
  render: (args) => (
    <Item.Group>
      <TaskRow {...args} />
    </Item.Group>
  ),
};
