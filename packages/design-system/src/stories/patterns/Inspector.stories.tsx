import type { Meta, StoryObj } from "@storybook/react-vite";
import { Pencil } from "lucide-react";
import type { ReactNode } from "react";

import { Badge, Button, IconButton, Id, Indicator, KeyValue, Person } from "../../components";
import { Panel } from "../../patterns";
import { Box, Inline } from "../../primitives";
import { Inspector } from "../../shapes";
import { Pair } from "../_lib/pair";
import { panelGroups } from "../_lib/patterns-fixtures";

const groups = [
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
      { label: "Assessor", value: <Person name="Priya Natarajan" /> },
      { label: "Package", value: <Id>PKG-2026-114</Id> },
    ],
  },
  {
    title: "Schedule",
    rows: [
      { label: "Frequency", value: "Quarterly" },
      { label: "Last verified", value: "12 Aug 2026" },
      { label: "Next due", value: "18 Sep 2026" },
    ],
  },
];

const meta = {
  title: "Shapes/Inspector",
  component: Inspector,
  parameters: { layout: "padded" },
  args: { groups },
} satisfies Meta<typeof Inspector>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A panel surface in a box the size of the shell's Panel area. */
function PanelBox({ children }: { children: ReactNode }) {
  return (
    <div
      style={{ width: 320, height: 360 }}
      className="overflow-y-auto rounded-medium border border-default bg-surface"
    >
      {children}
    </div>
  );
}

const exposure = (
  <Inspector.Group
    title="Exposure"
    action={<IconButton label="Edit exposure" variant="subtle" size="small" icon={<Pencil />} />}
  >
    <KeyValue label="Risk">
      <Id>RSK-0021</Id>
    </KeyValue>
    <KeyValue label="Likelihood">
      <Indicator tone="warning">Likely</Indicator>
    </KeyValue>
    <KeyValue label="Impact">
      <Indicator tone="danger">Severe</Indicator>
    </KeyValue>
    <KeyValue label="Treatment">Mitigate</KeyValue>
  </Inspector.Group>
);

/** The composed form: Inspector.Group with KeyValue rows, one with an action. */
export const InspectorGroups: Story = {
  name: "Inspector.Group",
  render: () => (
    <Box className="w-layout-rail">
      {exposure}
      <Inspector.Group title="Adjudication">
        <KeyValue label="Disposition">
          <Badge tone="information" size="xsmall">
            Under review
          </Badge>
        </KeyValue>
        <KeyValue label="Decided by">Dana Whitlock</KeyValue>
      </Inspector.Group>
    </Box>
  ),
};

/** Groups from data with a footer, beside a page; the composed group with an action; the same groups in a flush Panel, the rules edge to edge. */
export const InspectorMatrix: Story = {
  tags: ["contract"],
  render: () => (
    <Inline space="space.300" alignBlock="start" shouldWrap>
      <Box className="w-layout-rail">
        <Inspector
          groups={groups}
          footer={
            <Button variant="link" size="small">
              Edit properties
            </Button>
          }
        />
      </Box>
      <Box className="w-layout-rail">{exposure}</Box>
      <PanelBox>
        <Panel flush>
          <Inspector groups={panelGroups} />
        </Panel>
      </PanelBox>
    </Inline>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Inline space="space.300" alignBlock="start" shouldWrap>
      <Pair
        do={
          <Box className="w-layout-rail">
            <Inspector groups={groups} />
          </Box>
        }
        doText="Groups named by the kind of fact, a handful of rows each: the reader finds Next due under Schedule."
        dont={
          <Box className="w-layout-rail">
            <Inspector
              groups={[
                {
                  title: "Details",
                  rows: [
                    { label: "Owner", value: "Dana Whitlock" },
                    { label: "Package", value: "PKG-2026-114" },
                    { label: "Status", value: "Partially satisfied" },
                    { label: "Method", value: "Examine, Test" },
                    { label: "Last verified", value: "12 Aug 2026" },
                    { label: "Next due", value: "18 Sep 2026" },
                    { label: "Frequency", value: "Quarterly" },
                    { label: "Assessor", value: "Priya Natarajan" },
                    { label: "Baseline", value: "Moderate" },
                    { label: "Family", value: "Access control" },
                    { label: "Created", value: "3 Mar 2026" },
                    { label: "Updated", value: "2h ago" },
                  ],
                },
              ]}
            />
          </Box>
        }
        dontText="One group called Details with twelve rows. Nothing folds and nothing is found; the label says what the rail already is."
      />
      <Pair
        do={<Box className="w-layout-rail">{exposure}</Box>}
        doText="The group's action is an IconButton with a name: a screen reader hears “Edit exposure”, and it has the hover, the focus ring and the tooltip of every other button."
        dont={
          <Box className="w-layout-rail">
            <Inspector.Group
              title="Exposure"
              action={
                <button type="button" className="text-subtle transition-colors hover:text-default">
                  <Pencil className="size-icon-small" />
                </button>
              }
            >
              <KeyValue label="Risk">
                <Id>RSK-0021</Id>
              </KeyValue>
              <KeyValue label="Treatment">Mitigate</KeyValue>
            </Inspector.Group>
          </Box>
        }
        dontText="A raw button holding a pencil. It has no name, no focus ring and no tooltip, and it is drawn by hand where the kit has the part."
      />
    </Inline>
  ),
};

export const Playground: Story = {
  render: (args) => (
    <Box className="w-layout-rail">
      <Inspector {...args} />
    </Box>
  ),
};
