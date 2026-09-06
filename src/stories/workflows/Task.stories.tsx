import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus } from "lucide-react";
import { useState } from "react";

import { Badge, Button, Id, Progress } from "@ledger/design-system";
import { Card, Section } from "@ledger/design-system";
import { Task, type TaskState } from "@/components/app/task";
import { Box, Inline, Stack, Text } from "@ledger/design-system";
import { Matrix, Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Product/Workflows/Task",
  component: Task,
  parameters: { layout: "padded", a11y: { test: "error" } },
  globals: { theme: "ledger" },
  args: {
    title: "Confirm the account review procedure",
    assignee: "Joel Barrantes",
    due: "Fri 4 Sep",
  },
} satisfies Meta<typeof Task>;
export default meta;
type Story = StoryObj<typeof meta>;

const noop = () => undefined;

/** A record's tasks: the box, the ask, who has it, when, and what it waits on. Done is a line through the title. */
export const Tasks: Story = {
  render: () => (
    <Box style={{ width: 640 }}>
      <Task.List
        title="Tasks"
        count={4}
        action={
          <Button size="small" iconBefore={<Plus />}>
            Add task
          </Button>
        }
      >
        <Task
          title="Confirm the account review procedure"
          assignee="Joel Barrantes"
          due="Fri 4 Sep"
          dueDateTime="2026-09-04"
          state="waiting"
          waitingOn="Joel Barrantes"
          onDoneChange={noop}
        />
        <Task
          title="Write the implementation statement"
          assignee="Priya Raghavan"
          due="Today"
          dueDateTime="2026-08-30"
          onDoneChange={noop}
        />
        <Task
          title="Link the IdP's quarterly report"
          assignee="Priya Raghavan"
          due="3d overdue"
          dueDateTime="2026-08-27"
          overdue
          onDoneChange={noop}
        />
        <Task title="Take ownership" assignee="Priya Raghavan" state="done" onDoneChange={noop} />
      </Task.List>
    </Box>
  ),
};

/** In a person's queue the list spans records, so each row says where it sits. */
export const InAQueue: Story = {
  render: () => (
    <Box style={{ width: 640 }}>
      <Task.List title="Assigned to you" count={3}>
        <Task
          title="Confirm the account review procedure"
          subject={
            <Inline as="span" space="space.050" alignBlock="center">
              <Id>AC-2</Id>
              <span>Account management</span>
            </Inline>
          }
          due="Fri 4 Sep"
          dueDateTime="2026-09-04"
          link={<a href="#ac-2" />}
          onDoneChange={noop}
        />
        <Task
          title="Map REQ-0412 to its objectives"
          subject={
            <Inline as="span" space="space.050" alignBlock="center">
              <Id>REQ-0412</Id>
              <span>Signed boot images</span>
            </Inline>
          }
          due="Mon 7 Sep"
          dueDateTime="2026-09-07"
          link={<a href="#req-0412" />}
          onDoneChange={noop}
        />
        <Task
          title="Link the IdP's quarterly report"
          subject={
            <Inline as="span" space="space.050" alignBlock="center">
              <Id>AC-2</Id>
              <span>Account management</span>
            </Inline>
          }
          due="3d overdue"
          dueDateTime="2026-08-27"
          overdue
          link={<a href="#ac-2" />}
          onDoneChange={noop}
        />
      </Task.List>
    </Box>
  ),
};

/** The box completes and reopens; the row says so at once. */
export const Interactive: Story = {
  tags: ["app-contract"],
  play: async ({ canvasElement }) => {
    const { expect, userEvent, within } = await import("storybook/test");
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("checkbox", { name: "Complete: Confirm the account review procedure" }),
    );
    await expect(
      canvas.getByRole("checkbox", { name: "Reopen: Confirm the account review procedure" }),
    ).toBeChecked();
    await userEvent.click(
      canvas.getByRole("checkbox", { name: "Reopen: Confirm the account review procedure" }),
    );
    await expect(
      canvas.getByRole("checkbox", { name: "Complete: Confirm the account review procedure" }),
    ).not.toBeChecked();
  },
  render: function Render() {
    const [rows, setRows] = useState<{ title: string; state: TaskState }[]>([
      { title: "Confirm the account review procedure", state: "open" },
      { title: "Write the implementation statement", state: "open" },
      { title: "Take ownership", state: "done" },
    ]);
    return (
      <Box style={{ width: 640 }}>
        <Task.List title="Tasks" count={rows.filter((r) => r.state !== "done").length}>
          {rows.map((r, i) => (
            <Task
              key={r.title}
              title={r.title}
              state={r.state}
              assignee="Priya Raghavan"
              onDoneChange={(done) =>
                setRows((all) =>
                  all.map((x, j) => (j === i ? { ...x, state: done ? "done" : "open" } : x)),
                )
              }
            />
          ))}
        </Task.List>
      </Box>
    );
  },
};

/** Every state across the ways a row can be dated, then the list's empty state and a list in a card. */
export const TaskMatrix: Story = {
  tags: ["app-contract"],
  render: () => (
    <Stack space="space.400">
      <Matrix
        rows={["open", "waiting", "blocked", "done"] as const}
        cols={["undated", "due", "overdue"] as const}
        rowLabel="state"
        render={(state, col) => (
          <Box style={{ width: 460 }}>
            <Task.List>
              <Task
                title="Confirm the account review procedure"
                state={state}
                waitingOn={state === "waiting" ? "Joel Barrantes" : undefined}
                assignee="Joel Barrantes"
                due={col === "due" ? "Fri 4 Sep" : col === "overdue" ? "3d overdue" : undefined}
                dueDateTime={
                  col === "due" ? "2026-09-04" : col === "overdue" ? "2026-08-27" : undefined
                }
                overdue={col === "overdue"}
                onDoneChange={noop}
              />
            </Task.List>
          </Box>
        )}
      />
      <Specimens title="Empty, read-only, and in a card">
        <Box style={{ width: 420 }}>
          <Task.List title="Tasks" count={0} />
        </Box>
        <Box style={{ width: 420 }}>
          <Task.List title="Done this week" count={1}>
            <Task title="Take ownership" assignee="Priya Raghavan" state="done" />
          </Task.List>
        </Box>
        <Card style={{ width: 420 }}>
          <Task.List title="Tasks" count={1} flush>
            <Task
              title="Write the implementation statement"
              assignee="Priya Raghavan"
              due="Today"
              onDoneChange={noop}
            />
          </Task.List>
        </Card>
      </Specimens>
    </Stack>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Box style={{ width: 640 }}>
            <Task.List>
              <Task
                title="Confirm the account review procedure"
                assignee="Joel Barrantes"
                due="Fri 4 Sep"
                onDoneChange={noop}
              />
            </Task.List>
          </Box>
        }
        doText="A verb and an object, a name and a date."
        dont={
          <Box style={{ width: 640 }}>
            <Task.List>
              <Task title="AC-2" assignee="Joel Barrantes" onDoneChange={noop} />
            </Task.List>
          </Box>
        }
        dontText="A control id as a task. Nobody knows what to do, so nobody does it."
      />
      <Pair
        do={
          <Box style={{ width: 640 }}>
            <Task.List>
              <Task
                title="Take ownership"
                assignee="Priya Raghavan"
                state="done"
                onDoneChange={noop}
              />
            </Task.List>
          </Box>
        }
        doText="Done is a line through the title. Nothing else."
        dont={
          <Box style={{ width: 640 }}>
            <Section title="Take ownership">
              <Stack space="space.100" className="pt-100">
                <Inline space="space.100" alignBlock="center">
                  <Badge tone="success">Complete</Badge>
                  <Text size="small" color="color.text.subtle">
                    100%
                  </Text>
                </Inline>
                <Progress value={100} label="Progress" />
              </Stack>
            </Section>
          </Box>
        }
        dontText="A task as a card with a badge, a percent and a bar. Three words for one fact."
      />
      <Pair
        do={
          <Box style={{ width: 640 }}>
            <Task.List>
              <Task
                title="Confirm the account review procedure"
                assignee="Joel Barrantes"
                state="waiting"
                waitingOn="Joel Barrantes"
                onDoneChange={noop}
              />
            </Task.List>
          </Box>
        }
        doText="Asked and not answered is Waiting on the person, and stays open."
        dont={
          <Box style={{ width: 640 }}>
            <Task.List>
              <Task
                title="Confirm the account review procedure"
                assignee="Joel Barrantes"
                state="done"
                onDoneChange={noop}
              />
            </Task.List>
          </Box>
        }
        dontText="Marked done because the question was sent. Two weeks later nobody knows it was never answered."
      />
    </Stack>
  ),
};

export const Playground: Story = {
  args: {
    title: "Confirm the account review procedure",
    state: "open",
    assignee: "Joel Barrantes",
    due: "Fri 4 Sep",
    overdue: false,
    waitingOn: "Joel Barrantes",
  },
  argTypes: {
    state: { control: "select", options: ["open", "waiting", "blocked", "done"] },
  },
  render: (args) => (
    <Box style={{ width: 640 }}>
      <Task.List>
        <Task {...args} onDoneChange={noop} />
      </Task.List>
    </Box>
  ),
};
