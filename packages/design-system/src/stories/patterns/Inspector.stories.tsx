import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge, Button, Id, KeyValue, Person } from "../../components";
import { Box, Inline, Stack } from "../../primitives";
import { Inspector } from "../../shapes";

const meta = {
  title: "Shapes/Inspector",
  component: Inspector,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Inspector>;
export default meta;
type Story = StoryObj;

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
