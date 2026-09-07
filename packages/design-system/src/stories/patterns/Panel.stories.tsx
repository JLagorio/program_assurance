import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { ExternalLink, Info, Maximize2 } from "lucide-react";
import type { ReactNode } from "react";

import { Button, IconButton } from "../../components";
import { Panel } from "../../patterns";
import { Inline, Stack, Text } from "../../primitives";
import { Inspector } from "../../shapes";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";
import { panelGroups } from "../_lib/patterns-fixtures";

const filler = Array.from({ length: 6 }, (_, i) => (
  <Text key={i} color="color.text.subtle">
    Line {i + 1} of the panel's body. The area scrolls; the header and the footer stay put.
  </Text>
));

const meta = {
  title: "Patterns/Panel",
  component: Panel,
  parameters: { layout: "padded" },
  args: { title: "Comments", children: <Stack space="space.100">{filler}</Stack> },
} satisfies Meta<typeof Panel>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A panel surface in a box the size of the shell's Panel area. */
function PanelBox({ height = 300, children }: { height?: number; children: ReactNode }) {
  return (
    <div
      style={{ width: 320, height }}
      className="overflow-y-auto rounded-medium border border-default bg-surface"
    >
      {children}
    </div>
  );
}

/** Flush, with no header: the detail of a selected row beside its table, gone when the selection clears. */
export const PanelStory: Story = {
  name: "Panel",
  render: () => (
    <PanelBox height={420}>
      <Panel flush>
        <Inspector groups={panelGroups} />
      </Panel>
    </PanelBox>
  ),
};

/** The header's forms, a subheader, a footer; flush with no header at all, the detail of a selected row; the trigger for a dismissible panel. */
export const PanelMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Specimens title="Plain · with an icon and two actions · with a back button and a subheader">
        <Inline space="space.300" alignBlock="start" shouldWrap>
          <PanelBox>
            <Panel title="Details" onClose={() => undefined}>
              <Stack space="space.100">{filler}</Stack>
            </Panel>
          </PanelBox>
          <PanelBox>
            <Panel
              title="Comments"
              icon={<Info className="size-icon-small icon-subtle" />}
              actions={
                <>
                  <IconButton label="Expand" variant="subtle" icon={<Maximize2 />} />
                  <IconButton label="Open in a new tab" variant="subtle" icon={<ExternalLink />} />
                </>
              }
              onClose={() => undefined}
            >
              <Stack space="space.100">{filler}</Stack>
            </Panel>
          </PanelBox>
          <PanelBox>
            <Panel
              title="Add fields"
              subheader="Default field scheme"
              onBack={() => undefined}
              onClose={() => undefined}
            >
              <Stack space="space.100">{filler}</Stack>
            </Panel>
          </PanelBox>
        </Inline>
      </Specimens>
      <Specimens title="With a footer · flush, the detail of a selected row · the trigger of a dismissible panel, closed and open">
        <Inline space="space.300" alignBlock="start" shouldWrap>
          <PanelBox>
            <Panel
              title="Edit settings"
              onClose={() => undefined}
              footer={
                <>
                  <Button>Cancel</Button>
                  <Button variant="primary">Save</Button>
                </>
              }
            >
              <Stack space="space.100">{filler}</Stack>
            </Panel>
          </PanelBox>
          <PanelBox height={420}>
            <Panel flush>
              <Inspector groups={panelGroups} />
            </Panel>
          </PanelBox>
          <Inline space="space.100" alignBlock="center">
            <Panel.Trigger isOpen={false} onClick={() => undefined} />
            <Panel.Trigger isOpen onClick={() => undefined} />
          </Inline>
        </Inline>
      </Specimens>
    </Stack>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  // Independent panel examples repeat their landmark names.
  parameters: { a11y: { config: { rules: [{ id: "landmark-unique", enabled: false }] } } },
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <PanelBox height={360}>
            <Panel flush>
              <Inspector groups={panelGroups} />
            </Panel>
          </PanelBox>
        }
        doText="The detail of a selected row: flush, no title, no close. The row names it, and clearing the selection closes it."
        dont={
          <PanelBox height={360}>
            <Panel title="Details" onClose={() => undefined}>
              <Inspector groups={panelGroups} />
            </Panel>
          </PanelBox>
        }
        dontText="A title and a close on the row's detail. Details says nothing the row did not, and the close leaves the row selected with nothing beside it."
      />
      <Pair
        do={
          <PanelBox>
            <Panel title="Comments" onClose={() => undefined}>
              <Stack space="space.100">{filler.slice(0, 3)}</Stack>
            </Panel>
          </PanelBox>
        }
        doText="Named by what it shows: the object, or the action it completes."
        dont={
          <PanelBox>
            <Panel title="Panel" onClose={() => undefined}>
              <Stack space="space.100">{filler.slice(0, 3)}</Stack>
            </Panel>
          </PanelBox>
        }
        dontText="Panel as the title. The heading and the landmark both say where the reader is, not what is there."
      />
    </Stack>
  ),
};

export const Playground: Story = {
  render: (args) => (
    <PanelBox>
      <Panel {...args} onClose={() => undefined} />
    </PanelBox>
  ),
};

/** A subheader is an independent slot even when the panel has no title row. */
export const SubheaderOnly: Story = {
  render: () => (
    <PanelBox>
      <Panel subheader="3 selected records" flush>
        <Text>Selection details</Text>
      </Panel>
    </PanelBox>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("3 selected records")).toBeVisible();
    await expect(canvas.getByText("Selection details")).toBeVisible();
    await expect(canvas.queryByRole("heading")).not.toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  },
};
