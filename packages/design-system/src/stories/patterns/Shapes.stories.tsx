import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Badge, Button, Indicator, KeyValue, Tabs, type Tone, Person, Id } from "../../components";
import { ActionBar, Block, Inspector, WorkPane } from "../../shapes";
import { Stack, Text, Box, Inline } from "../../primitives";
import { Specimens } from "../_lib/matrix";

const meta = {
  title: "Patterns/Shapes",
  parameters: { layout: "padded" },
} satisfies Meta;
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
      list={
        <Stack space="space.025">
          {items.map((i) => (
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
        </Stack>
      }
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
                { label: "Request evidence", onSelect: () => undefined },
                {
                  label: "Mark verified",
                  onSelect: () => undefined,
                  primary: true,
                  blocked: current.tone === "success" ? "Already verified." : null,
                },
              ]}
              tabs={
                <Tabs label="Sections">
                  <Tabs.Tab isSelected>Work</Tabs.Tab>
                  <Tabs.Tab>Evidence</Tabs.Tab>
                  <Tabs.Tab>History</Tabs.Tab>
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
                <Block title="Evidence requests">
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
                  <Button variant="subtle" size="small">
                    Edit facts
                  </Button>
                }
              />
            </div>
          </Stack>
        ) : null
      }
      empty={<Text color="color.text.subtle">Choose a control.</Text>}
    />
  );
}

export const WorkPaneStory: Story = {
  name: "WorkPane with ActionBar, Blocks and Inspector",
  render: () => <Pane />,
};

export const InspectorGroups: Story = {
  render: () => (
    <div className="max-w-[300px]">
      <Inspector.Group
        title="Ownership"
        action={
          <Button variant="link" size="xsmall">
            Edit
          </Button>
        }
      >
        <KeyValue label="Owner">Dana Whitfield</KeyValue>
        <KeyValue label="Assessor">Priya Natarajan</KeyValue>
      </Inspector.Group>
      <Inspector.Group title="Status">
        <KeyValue label="Current">
          <Badge tone="information">In review</Badge>
        </KeyValue>
      </Inspector.Group>
    </div>
  ),
};

const noop = () => {};

/** A primary allowed and a secondary blocked; every action blocked; a state with a control; with a breadcrumb and tabs. */
export const ActionBarMatrix: Story = {
  render: () => (
    <Stack space="space.400">
      <ActionBar
        id="AC-2(3)"
        title="Disable accounts"
        context="Access control · Moderate baseline"
        states={[
          { label: "Assessment", value: "Partially satisfied", tone: "warning" },
          { label: "Evidence", value: "34d", tone: "warning" },
        ]}
        actions={[
          { label: "Mark satisfied", onSelect: noop, blocked: "2 findings still open" },
          { label: "Request evidence", onSelect: noop, primary: true },
        ]}
      />
      <ActionBar
        id="PKG-2026-114"
        title="Authorization package"
        context="Moderate · 340 controls"
        states={[
          { label: "Lifecycle", value: "In assessment", tone: "information" },
          { label: "Findings", value: "7 open", tone: "danger" },
        ]}
        actions={[
          { label: "Submit", onSelect: noop, primary: true, blocked: "7 findings still open" },
        ]}
      />
      <ActionBar
        breadcrumb={
          <Text size="small" color="color.text.subtle">
            Programs / Atlas payments platform / Controls
          </Text>
        }
        id="AC-17"
        title="Remote access"
        states={[
          {
            label: "Owner",
            value: "Dana Whitlock",
            tone: "neutral",
            control: (
              <Button size="xsmall" variant="subtle">
                Change
              </Button>
            ),
          },
        ]}
        actions={[{ label: "Assess", onSelect: noop, primary: true }]}
        tabs={
          <Tabs label="Sections">
            <Tabs.Tab isSelected>Implementation</Tabs.Tab>
            <Tabs.Tab count={3}>Assessment</Tabs.Tab>
          </Tabs>
        }
      />
    </Stack>
  ),
};

/** Title alone, with a count, with an action, and a count of zero. */
export const BlockMatrix: Story = {
  render: () => (
    <Stack space="space.300" className="max-w-layout-measure">
      <Block title="Findings">
        <Text size="small" color="color.text.subtle">
          Body
        </Text>
      </Block>
      <Block title="Findings" count={7}>
        <Text size="small" color="color.text.subtle">
          Body
        </Text>
      </Block>
      <Block title="Findings" count={7} action={<Button size="xsmall">New finding</Button>}>
        <Text size="small" color="color.text.subtle">
          Body
        </Text>
      </Block>
      <Block title="Findings" count={0}>
        <Text size="small" color="color.text.subtle">
          A zero count still shows.
        </Text>
      </Block>
    </Stack>
  ),
};

/** Grouped facts with a footer, and a standalone group with an action. */
export const InspectorMatrix: Story = {
  render: () => (
    <Inline space="space.300" alignBlock="start" shouldWrap>
      <Box className="w-layout-rail">
        <Inspector
          groups={[
            {
              title: "Ownership",
              rows: [
                { label: "Owner", value: <Person name="Dana Whitlock" /> },
                { label: "Package", value: <Id>PKG-2026-114</Id> },
              ],
            },
            {
              title: "Assessment",
              rows: [
                {
                  label: "Status",
                  value: (
                    <Badge tone="warning" size="xsmall">
                      Partially satisfied
                    </Badge>
                  ),
                },
                { label: "Method", value: "Examine, Test" },
              ],
            },
          ]}
          footer={
            <Button variant="link" size="xsmall">
              Edit properties
            </Button>
          }
        />
      </Box>
      <Box className="w-layout-rail">
        <Inspector.Group
          title="Standalone group"
          action={
            <Button size="xsmall" variant="subtle">
              Edit
            </Button>
          }
        >
          <Stack space="space.050">
            <KeyValue label="Owner">Dana Whitlock</KeyValue>
            <KeyValue label="Assessor">K. Lund</KeyValue>
          </Stack>
        </Inspector.Group>
      </Box>
    </Inline>
  ),
};

/** Every row tone, one active, and the empty detail. */
export const WorkPaneMatrix: Story = {
  render: () => (
    <Box style={{ height: 360 }}>
      <WorkPane
        listLabel={
          <Inline spread="space-between" alignBlock="center">
            <Text size="xsmall" color="color.text.subtlest">
              Access control
            </Text>
            <Text size="xsmall" color="color.text.subtlest">
              6
            </Text>
          </Inline>
        }
        list={
          <Stack space="space.0">
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
          </Stack>
        }
        detail={null}
        empty={
          <Text size="small" color="color.text.subtle">
            Select a control.
          </Text>
        }
      />
    </Box>
  ),
};
