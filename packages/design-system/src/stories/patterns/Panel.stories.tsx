import type { Meta, StoryObj } from "@storybook/react-vite";
import { ExternalLink, Info, Maximize2 } from "lucide-react";

import { Button, IconButton } from "../../components";
import { Panel } from "../../patterns";
import { Inline, Stack, Text } from "../../primitives";
import { Inspector } from "../../shapes";
import { Specimens } from "../_lib/matrix";
import { panelGroups } from "../_lib/patterns-fixtures";

const meta = {
  title: "Patterns/Panel",
  component: Panel,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Panel>;
export default meta;
type Story = StoryObj;

/** A panel surface in a box the size of the shell's Panel area. */
function PanelBox({ height = 300, children }: { height?: number; children: React.ReactNode }) {
  return (
    <div
      style={{ width: 320, height }}
      className="overflow-y-auto rounded-medium border border-default bg-surface"
    >
      {children}
    </div>
  );
}

const filler = Array.from({ length: 6 }, (_, i) => (
  <Text key={i} color="color.text.subtle">
    Line {i + 1} of the panel's body. The area scrolls; the header and the footer stay put.
  </Text>
));

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
        <Inline space="space.300" alignBlock="start">
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
        <Inline space="space.300" alignBlock="start">
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
