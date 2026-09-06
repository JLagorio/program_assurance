import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileText, Link2, ListChecks, Send } from "lucide-react";
import { useState } from "react";

import { Badge, Button, Combobox, Field, Id, Table } from "@ledger/design-system";
import { Section } from "@ledger/design-system";
import { Activity, type ActivityKind } from "@/components/app/activity";
import { Box, Inline, Stack, Text } from "@ledger/design-system";
import { Matrix, Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Product/Workflows/Activity",
  component: Activity,
  parameters: { layout: "padded", a11y: { test: "error" } },
  globals: { theme: "ledger" },
  args: { label: "Activity" },
} satisfies Meta<typeof Activity>;
export default meta;
type Story = StoryObj;

const people = [
  { name: "Priya Raghavan", meta: "Product security" },
  { name: "Joel Barrantes", meta: "Software" },
  { name: "Victor Amsel", meta: "Firmware" },
  { name: "Dana Whitcombe", meta: "Assessor" },
];

const logItems = [
  { value: "note", label: "Note", icon: <FileText /> },
  { value: "task", label: "Task", icon: <ListChecks /> },
  { value: "request", label: "Request", icon: <Send /> },
  { value: "evidence", label: "Evidence", icon: <Link2 /> },
];

const feed = (
  <Activity>
    <Activity.Group label="Today" count={3}>
      <Activity.Item
        actor="Joel Barrantes"
        kind="comment"
        title="replied"
        time="2h ago"
        dateTime="2026-08-30T10:00:00Z"
        timeTitle="2026-08-30 10:00"
        emphasis
      >
        <Activity.Text>
          @[Priya Raghavan] the review runs quarterly from the IdP's own report. Attaching the last
          one now.
        </Activity.Text>
      </Activity.Item>
      <Activity.Item
        actor="Joel Barrantes"
        kind="link"
        title="linked EVD-0412 Account review, Q3"
        time="2h ago"
        dateTime="2026-08-30T10:04:00Z"
      />
      <Activity.Item
        kind="done"
        title="Confirm the account review procedure closed: evidence linked"
        time="2h ago"
        dateTime="2026-08-30T10:04:00Z"
      />
    </Activity.Group>
    <Activity.Group label="Last week" count={3}>
      <Activity.Item
        actor="Priya Raghavan"
        kind="request"
        title="asked Joel Barrantes for the account review procedure"
        time="27 Aug"
        dateTime="2026-08-27T15:12:00Z"
      >
        <Activity.Text>How often are privileged accounts reviewed, and who signs it?</Activity.Text>
      </Activity.Item>
      <Activity.Item
        actor="Priya Raghavan"
        kind="assign"
        title="took ownership"
        time="27 Aug"
        dateTime="2026-08-27T15:10:00Z"
      />
      <Activity.Item
        kind="stage"
        title="Implementation moved from Planned to Partially implemented"
        time="26 Aug"
        dateTime="2026-08-26T09:30:00Z"
      />
    </Activity.Group>
  </Activity>
);

/** A control's feed: what people did with a face, what the system did with an icon, newest first, grouped by when. The body sits under the sentence. */
export const Feed: Story = {
  render: () => <Box className="w-layout-list">{feed}</Box>,
};

/** The log bar and the composer under it: the work happened outside and comes back in through one of four buttons. Note opens the composer; the rest open the caller's dialog. */
export const Logging: Story = {
  tags: ["app-contract"],
  play: async ({ canvasElement }) => {
    const { expect, userEvent, within } = await import("storybook/test");
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Add a note" }),
      "Reviewed the implementation.",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Post" }));
    await expect(canvas.getByText("Reviewed the implementation.")).toBeVisible();
    await expect(canvas.queryByRole("textbox", { name: "Add a note" })).toBeNull();
  },
  render: function Render() {
    const [open, setOpen] = useState<string | null>("note");
    const [posted, setPosted] = useState<{ text: string; mentions: string[] }[]>([]);
    return (
      <Stack space="space.200" className="w-layout-list">
        <Activity.LogBar
          items={logItems}
          value={open}
          onSelect={(v) => setOpen((cur) => (cur === v ? null : v))}
        />
        {open === "note" ? (
          <Activity.Composer
            actor="Priya Raghavan"
            people={people}
            placeholder="Add a note"
            submitLabel="Post"
            onCancel={() => setOpen(null)}
            onSubmit={(text, mentions) => {
              setPosted((p) => [{ text, mentions }, ...p]);
              setOpen(null);
            }}
          />
        ) : null}
        {open === "request" ? (
          <Activity.Composer
            actor="Priya Raghavan"
            people={people}
            placeholder="What are you asking for?"
            submitLabel="Send"
            onCancel={() => setOpen(null)}
            onSubmit={(text, mentions) => {
              setPosted((p) => [{ text: `Request: ${text}`, mentions }, ...p]);
              setOpen(null);
            }}
          >
            <Field label="To">
              <Combobox
                value="Joel Barrantes"
                onChange={() => undefined}
                options={people.map((p) => ({ value: p.name, label: p.name, meta: p.meta }))}
                width={280}
              />
            </Field>
          </Activity.Composer>
        ) : null}
        {open === "task" || open === "evidence" ? (
          <Text size="small" color="color.text.subtle">
            The caller opens its {open} dialog here.
          </Text>
        ) : null}
        <Activity>
          {posted.map((p, i) => (
            <Activity.Item
              key={i}
              actor="Priya Raghavan"
              kind="note"
              title={p.mentions.length ? `mentioned ${p.mentions.join(", ")}` : "added a note"}
              time="now"
            >
              <Activity.Text>{p.text}</Activity.Text>
            </Activity.Item>
          ))}
        </Activity>
      </Stack>
    );
  },
};

/** `@` in the composer opens the people, filtered as the reader types; Enter or Tab writes the mention. A body draws them tinted. */
export const Mentions: Story = {
  tags: ["app-contract"],
  play: async ({ canvasElement }) => {
    const { expect, userEvent, within } = await import("storybook/test");
    const canvas = within(canvasElement);
    const field = canvas.getByRole("textbox", { name: "Add a note" });
    await userEvent.type(field, "@Joel");
    await expect(canvas.getByRole("listbox", { name: "People" })).toBeVisible();
    await userEvent.keyboard("{Enter}");
    await expect(field).toHaveValue("Type @ and a name: @[Joel Barrantes] ");
    await expect(field).toHaveFocus();
  },
  render: () => (
    <Stack space="space.300" className="w-layout-list">
      <Activity.Composer
        actor="Priya Raghavan"
        people={people}
        defaultValue="Type @ and a name: "
        placeholder="Add a note"
        onSubmit={() => undefined}
      />
      <Activity.Text>
        {
          "@[Joel Barrantes] can you confirm the review cadence with @[Dana Whitcombe] before Friday?"
        }
      </Activity.Text>
      <Activity.Text
        mention={(name) => <Activity.Mention name={name} onSelect={() => undefined} />}
      >
        {"A mention that opens the person: @[Victor Amsel]."}
      </Activity.Text>
    </Stack>
  ),
};

const kindList: ActivityKind[] = [
  "note",
  "comment",
  "task",
  "request",
  "link",
  "change",
  "stage",
  "assign",
  "done",
  "created",
];

const sentence: Record<ActivityKind, string> = {
  note: "added a note",
  comment: "replied",
  task: "assigned Confirm the account review procedure to Joel Barrantes",
  request: "asked Joel Barrantes for the account review procedure",
  link: "linked EVD-0412 Account review, Q3",
  change: "changed Owner from Unassigned to Priya Raghavan",
  stage: "moved the program from Select to Implement",
  assign: "took ownership",
  done: "closed Confirm the account review procedure",
  created: "created the task",
};

/** Every kind as a person's event and as the system's, then the composer, the log bar and a request's composer with its To. */
export const ActivityMatrix: Story = {
  tags: ["app-contract"],
  render: () => (
    <Stack space="space.400">
      <Matrix
        rows={kindList}
        cols={["person", "system"] as const}
        rowLabel="kind"
        render={(kind, col) => (
          <Box style={{ width: 420 }}>
            <Activity label={`${kind} ${col}`}>
              <Activity.Item
                actor={col === "person" ? "Priya Raghavan" : undefined}
                kind={kind}
                title={
                  col === "person"
                    ? sentence[kind]
                    : `${sentence[kind][0]!.toUpperCase()}${sentence[kind].slice(1)}`
                }
                meta={
                  <Inline as="span" space="space.050" alignBlock="center">
                    <Id>AC-2</Id>
                    <span>Account management</span>
                  </Inline>
                }
                time="2h ago"
                dateTime="2026-08-30T10:00:00Z"
              >
                {kind === "note" || kind === "comment" || kind === "request" ? (
                  <Activity.Text>{"The body, with @[Joel Barrantes] mentioned."}</Activity.Text>
                ) : null}
              </Activity.Item>
            </Activity>
          </Box>
        )}
      />
      <Specimens title="Composer">
        <Box style={{ width: 480 }}>
          <Activity.Composer actor="Priya Raghavan" people={people} onSubmit={() => undefined} />
        </Box>
        <Box style={{ width: 480 }}>
          <Activity.Composer
            actor="Priya Raghavan"
            people={people}
            placeholder="What are you asking for?"
            submitLabel="Send"
            onCancel={() => undefined}
            onSubmit={() => undefined}
          >
            <Field label="To">
              <Combobox
                value="Joel Barrantes"
                onChange={() => undefined}
                options={people.map((p) => ({ value: p.name, label: p.name, meta: p.meta }))}
                width={280}
              />
            </Field>
          </Activity.Composer>
        </Box>
      </Specimens>
      <Specimens title="Log bar">
        <Activity.LogBar items={logItems} value={null} onSelect={() => undefined} />
        <Activity.LogBar items={logItems} value="request" onSelect={() => undefined} />
      </Specimens>
      <Specimens title="Emphasis and a footer">
        <Box style={{ width: 480 }}>
          <Activity>
            <Activity.Item
              actor="Joel Barrantes"
              kind="comment"
              title="mentioned you"
              time="2h ago"
              emphasis
              footer={
                <Inline space="space.100" alignBlock="center">
                  <Badge size="xsmall">Mentions you</Badge>
                  <Button size="small" variant="subtle">
                    Reply
                  </Button>
                </Inline>
              }
            >
              <Activity.Text>{"@[Priya Raghavan] the report is attached."}</Activity.Text>
            </Activity.Item>
          </Activity>
        </Box>
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
          <Box className="w-layout-list">
            <Activity>
              <Activity.Item
                actor="Priya Raghavan"
                kind="request"
                title="asked Joel Barrantes for the account review procedure"
                time="27 Aug"
              />
              <Activity.Item
                kind="done"
                title="Confirm the account review procedure closed"
                time="2h ago"
              />
            </Activity>
          </Box>
        }
        doText="A sentence with a face, and what the system did in the same feed."
        dont={
          <Box className="w-layout-list">
            <Table>
              <thead>
                <tr>
                  <Table.Header width={96}>Date</Table.Header>
                  <Table.Header width={120}>Actor</Table.Header>
                  <Table.Header>Event</Table.Header>
                </tr>
              </thead>
              <tbody>
                <Table.Row>
                  <Table.Cell>Aug 27</Table.Cell>
                  <Table.Cell>P. Raghavan</Table.Cell>
                  <Table.Cell>REQUEST_SENT</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>Aug 30</Table.Cell>
                  <Table.Cell>system</Table.Cell>
                  <Table.Cell>TASK_CLOSED</Table.Cell>
                </Table.Row>
              </tbody>
            </Table>
          </Box>
        }
        dontText="A history table on another tab. Codes, initials, and a second place to look."
      />
      <Pair
        do={
          <Box className="w-layout-list">
            <Activity.LogBar items={logItems} value={null} onSelect={() => undefined} />
          </Box>
        }
        doText="Four ways in. What happened outside comes back through one of them."
        dont={
          <Box className="w-layout-list">
            <Section title="Log an interaction">
              <Stack space="space.100" className="pt-100">
                <Field label="Interaction type">
                  <Combobox value="" onChange={() => undefined} options={[]} width={280} />
                </Field>
                <Field label="Channel">
                  <Combobox value="" onChange={() => undefined} options={[]} width={280} />
                </Field>
                <Field label="Outcome">
                  <Combobox value="" onChange={() => undefined} options={[]} width={280} />
                </Field>
              </Stack>
            </Section>
          </Box>
        }
        dontText="A form to log a conversation. Nobody fills it in, so nothing is logged."
      />
      <Pair
        do={
          <Box className="w-layout-list">
            <Activity.Text>{"@[Joel Barrantes] can you confirm the cadence?"}</Activity.Text>
          </Box>
        }
        doText="A mention is a tinted name that the person sees in their queue."
        dont={
          <Box className="w-layout-list">
            <Text>Joel, can you confirm the cadence? (cc: Dana, Victor)</Text>
          </Box>
        }
        dontText="Names in prose. Nobody is told, and two weeks later nobody remembers who was asked."
      />
    </Stack>
  ),
};

export const Playground: StoryObj<typeof Activity.Item> = {
  args: {
    actor: "Priya Raghavan",
    kind: "request",
    title: "asked Joel Barrantes for the account review procedure",
    time: "27 Aug",
    emphasis: false,
  },
  argTypes: {
    kind: { control: "select", options: kindList },
    actor: { control: "text" },
    title: { control: "text" },
    time: { control: "text" },
    emphasis: { control: "boolean" },
  },
  render: (args) => (
    <Box className="w-layout-list">
      <Activity>
        <Activity.Item {...args}>
          <Activity.Text>
            How often are privileged accounts reviewed, and who signs it?
          </Activity.Text>
        </Activity.Item>
      </Activity>
    </Box>
  ),
};
