import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button, Tabs } from "../../components";
import { Stack, Text } from "../../primitives";
import { ActionBar } from "../../shapes";

const meta = {
  title: "Shapes/ActionBar",
  component: ActionBar,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ActionBar>;
export default meta;
type Story = StoryObj;

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
