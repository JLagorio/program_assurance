import type { Meta, StoryObj } from "@storybook/react-vite";
import { ListChecks } from "lucide-react";
import { useState } from "react";

import { Badge, Button, Indicator, Item, Tabs, type Tone } from "../../components";
import { Empty } from "../../patterns";
import { Box, Inline, Stack, Text } from "../../primitives";
import { ActionBar, Block, Inspector, WorkPane } from "../../shapes";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Shapes/WorkPane",
  component: WorkPane,
  parameters: { layout: "padded" },
} satisfies Meta<typeof WorkPane>;
export default meta;
type Story = StoryObj;

const items: { id: string; title: string; meta: string; tone: Tone }[] = [
  { id: "CTRL-0412", title: "Segregation of duties, payables", meta: "Verified", tone: "success" },
  {
    id: "CTRL-0418",
    title: "Vendor master change approval",
    meta: "In review",
    tone: "information",
  },
  { id: "CTRL-0450", title: "Privileged access review", meta: "Overdue", tone: "danger" },
  { id: "CTRL-0451", title: "Firewall rule recertification", meta: "Due soon", tone: "warning" },
  { id: "CTRL-0472", title: "Backup restore test", meta: "Draft", tone: "neutral" },
];

const noop = () => {};

const chooseOne = (
  <Empty
    size="compact"
    icon={<ListChecks />}
    title="Choose a control"
    description="Its work opens here; the list stays."
  />
);

function Pane() {
  const [active, setActive] = useState("CTRL-0418");
  const current = items.find((i) => i.id === active);
  return (
    <WorkPane
      listLabel={
        <Text size="xsmall" weight="medium" color="color.text.subtlest">
          5 controls
        </Text>
      }
      list={items.map((i) => (
        <WorkPane.Row
          key={i.id}
          id={i.id}
          title={i.title}
          meta={i.meta}
          tone={i.tone}
          isActive={active === i.id}
          onSelect={() => setActive(i.id)}
        />
      ))}
      detail={
        current ? (
          <Stack space="space.300">
            <ActionBar
              id={current.id}
              title={current.title}
              context="Finance · Quarterly"
              states={[
                { label: "Status", value: current.meta, tone: current.tone },
                { label: "Severity", value: "High", tone: "danger" },
              ]}
              actions={[
                { label: "Request evidence", onSelect: noop },
                {
                  label: "Mark verified",
                  onSelect: noop,
                  primary: true,
                  blocked: current.tone === "success" ? "already verified" : null,
                },
              ]}
              tabs={
                <Tabs defaultValue="Work" className="contents">
                  <Tabs.List label="Sections">
                    <Tabs.Tab value="Work">Work</Tabs.Tab>
                    <Tabs.Tab value="Evidence">Evidence</Tabs.Tab>
                    <Tabs.Tab value="History">History</Tabs.Tab>
                  </Tabs.List>
                  <Tabs.Panel value="Work" />
                </Tabs>
              }
            />
            <div className="grid gap-300 lg:grid-cols-main-rail">
              <Stack space="space.300">
                <Block
                  title="Open findings"
                  count={2}
                  action={<Button size="small">Add finding</Button>}
                >
                  <Stack space="space.100">
                    <Indicator tone="danger">Approver released a payment in July</Indicator>
                    <Indicator tone="warning">Vendor bank change without call-back</Indicator>
                  </Stack>
                </Block>
                <Block title="Evidence requests" count={0}>
                  <Text color="color.text.subtle">None open.</Text>
                </Block>
              </Stack>
              <Inspector
                groups={[
                  {
                    title: "Ownership",
                    rows: [
                      { label: "Owner", value: "Dana Whitfield" },
                      { label: "Assessor", value: "Priya Natarajan" },
                    ],
                  },
                  {
                    title: "Schedule",
                    rows: [
                      { label: "Frequency", value: "Quarterly" },
                      { label: "Next due", value: "18 Sep 2026" },
                    ],
                  },
                ]}
                footer={
                  <Button variant="link" size="small">
                    Edit facts
                  </Button>
                }
              />
            </div>
          </Stack>
        ) : null
      }
      empty={chooseOne}
    />
  );
}

/** The list stays and the detail changes: an ActionBar pinned above Blocks of work, an Inspector beside them. Choose a row. */
export const WorkPaneStory: Story = {
  name: "WorkPane with ActionBar, Blocks and Inspector",
  render: () => <Pane />,
};

/** Every row tone, one active, the list's label with its count, and the empty detail. */
export const WorkPaneMatrix: Story = {
  render: () => (
    <Box style={{ height: 360 }}>
      <WorkPane
        listLabel={
          <Inline spread="space-between" alignBlock="center">
            <Text size="xsmall" weight="medium" color="color.text.subtlest">
              Access control
            </Text>
            <Text size="xsmall" color="color.text.subtlest">
              6
            </Text>
          </Inline>
        }
        list={
          <>
            <WorkPane.Row
              id="AC-2"
              title="Neutral"
              meta="Interview"
              tone="neutral"
              onSelect={noop}
            />
            <WorkPane.Row
              id="AC-3"
              title="Information"
              meta="Test · 1d"
              tone="information"
              onSelect={noop}
            />
            <WorkPane.Row
              id="AC-6"
              title="Success"
              meta="Examine · 3d"
              tone="success"
              onSelect={noop}
            />
            <WorkPane.Row
              id="AC-7"
              title="Warning · active"
              meta="Test · 34d"
              tone="warning"
              isActive
              onSelect={noop}
            />
            <WorkPane.Row
              id="AC-11"
              title="Danger"
              meta="Test · 51d"
              tone="danger"
              onSelect={noop}
            />
            <WorkPane.Row id="AC-17" title="Neutral again" meta="Examine · 8d" onSelect={noop} />
          </>
        }
        detail={null}
        empty={chooseOne}
      />
    </Box>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  // Independent pane examples repeat their landmark names.
  parameters: { a11y: { config: { rules: [{ id: "landmark-unique", enabled: false }] } } },
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Box style={{ height: 240 }}>
            <WorkPane
              listWidth={220}
              listLabel={
                <Text size="xsmall" weight="medium" color="color.text.subtlest">
                  3 controls
                </Text>
              }
              list={items.slice(0, 3).map((i) => (
                <WorkPane.Row
                  key={i.id}
                  id={i.id}
                  title={i.title}
                  meta={i.meta}
                  tone={i.tone}
                  onSelect={noop}
                />
              ))}
              detail={null}
              empty={chooseOne}
            />
          </Box>
        }
        doText="Nothing chosen is an empty state: a mark, what to do, and the list beside it to do it with."
        dont={
          <Box style={{ height: 240 }}>
            <WorkPane
              listWidth={220}
              list={items.slice(0, 3).map((i) => (
                <WorkPane.Row
                  key={i.id}
                  id={i.id}
                  title={i.title}
                  meta={i.meta}
                  tone={i.tone}
                  onSelect={noop}
                />
              ))}
              detail={null}
              empty={
                <Text size="small" color="color.text.subtle">
                  Select a control.
                </Text>
              }
            />
          </Box>
        }
        dontText="A grey line where the work would be, and no label on the list. The pane reads as broken, and the list's landmark has no name."
      />
      <Pair
        do={
          <Box style={{ height: 200 }}>
            <WorkPane
              listWidth={220}
              listLabel={
                <Text size="xsmall" weight="medium" color="color.text.subtlest">
                  3 controls
                </Text>
              }
              list={items.slice(1, 4).map((i) => (
                <WorkPane.Row
                  key={i.id}
                  id={i.id}
                  title={i.title}
                  meta={i.meta}
                  tone={i.tone}
                  isActive={i.id === "CTRL-0418"}
                  onSelect={noop}
                />
              ))}
              detail={<Text color="color.text.subtle">The detail.</Text>}
            />
          </Box>
        }
        doText="A Dot for the state and the word in the meta. One tint per row, and the active row is the only fill."
        dont={
          <Box style={{ height: 200 }}>
            <WorkPane
              listWidth={220}
              listLabel={
                <Text size="xsmall" weight="medium" color="color.text.subtlest">
                  3 controls
                </Text>
              }
              list={items.slice(1, 4).map((i) => (
                <Item
                  key={i.id}
                  title={i.title}
                  meta={
                    <Badge variant="secondary" size="xsmall" tone={i.tone}>
                      {i.meta}
                    </Badge>
                  }
                  description={i.id}
                  isActive={i.id === "CTRL-0418"}
                  onSelect={noop}
                />
              ))}
              detail={<Text color="color.text.subtle">The detail.</Text>}
            />
          </Box>
        }
        dontText="A Badge in every row. Three pills in a list column, and the active row's fill is one more."
      />
    </Stack>
  ),
};
