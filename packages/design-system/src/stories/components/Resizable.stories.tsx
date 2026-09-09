import type { Meta, StoryObj } from "@storybook/react-vite";

import { Resizable, ScrollArea, Separator } from "../../components";
import { Box, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Resizable",
  component: Resizable,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Resizable>;
export default meta;
type Story = StoryObj;

function List({ count = 24 }: { count?: number | undefined }) {
  return (
    <ScrollArea className="h-full" viewportProps={{ role: "region", "aria-label": "Controls" }}>
      <Stack space="space.0">
        {Array.from({ length: count }, (_, i) => (
          <Box key={i} paddingInline="space.150" paddingBlock="space.075">
            <Text size="small">CTRL-{400 + i}</Text>
          </Box>
        ))}
      </Stack>
    </ScrollArea>
  );
}

function Frame({
  height = 260,
  children,
}: {
  height?: number | undefined;
  children: React.ReactNode;
}) {
  return (
    <div
      className="max-w-layout-measure overflow-hidden rounded-large border border-default"
      style={{ height }}
    >
      {children}
    </div>
  );
}

/** A list beside what it opens: the list at 30% with a floor of 20%, the detail taking the rest. Drag the hairline; focus it and the arrows move it by 5%. */
export const Panes: Story = {
  render: () => (
    <Frame>
      <Resizable>
        <Resizable.Panel defaultSize={30} minSize={20}>
          <List />
        </Resizable.Panel>
        <Resizable.Handle />
        <Resizable.Panel>
          <Box padding="space.200">
            <Text color="color.text.subtle">Drag the hairline. The arrow keys move it too.</Text>
          </Box>
        </Resizable.Panel>
      </Resizable>
    </Frame>
  ),
};

/** `orientation="vertical"`: panes stacked, the handle a horizontal hairline that Up and Down move. A log under a form. */
export const Vertical: Story = {
  render: () => (
    <Frame>
      <Resizable orientation="vertical">
        <Resizable.Panel defaultSize={55} minSize={30}>
          <Box padding="space.200">
            <Text color="color.text.subtle">The work above.</Text>
          </Box>
        </Resizable.Panel>
        <Resizable.Handle />
        <Resizable.Panel minSize={20}>
          <List count={12} />
        </Resizable.Panel>
      </Resizable>
    </Frame>
  ),
};

/** `collapsible` on a pane: dragged under its minimum it folds to nothing, and Enter on the handle after it folds and unfolds it. A tree the reader hides. */
export const Collapsible: Story = {
  render: () => (
    <Frame>
      <Resizable>
        <Resizable.Panel defaultSize={30} minSize={20} collapsible>
          <List count={10} />
        </Resizable.Panel>
        <Resizable.Handle label="Resize the tree" />
        <Resizable.Panel>
          <Box padding="space.200">
            <Text color="color.text.subtle">
              Drag the tree past its floor, or focus the handle and press Enter.
            </Text>
          </Box>
        </Resizable.Panel>
      </Resizable>
    </Frame>
  ),
};

/** `persist`: the sizes are kept under the key, so the split opens as the reader left it. Resize, reload, and it holds. Each pane has an `id`. */
export const Persisted: Story = {
  render: () => (
    <Frame>
      <Resizable persist="storybook.resizable.persisted">
        <Resizable.Panel id="list" defaultSize={35} minSize={20}>
          <List />
        </Resizable.Panel>
        <Resizable.Handle />
        <Resizable.Panel id="detail">
          <Box padding="space.200">
            <Text color="color.text.subtle">Resize me, then reload the page.</Text>
          </Box>
        </Resizable.Panel>
      </Resizable>
    </Frame>
  ),
};

/** Horizontal and vertical; a floor and a ceiling; a collapsible pane; three panes with two handles. */
export const ResizableMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Specimens title="horizontal · vertical">
        <Box style={{ width: 320, height: 160 }} className="rounded-medium border border-default">
          <Resizable>
            <Resizable.Panel defaultSize={30} minSize={20}>
              <Box padding="space.150">
                <Text size="small">List · 30%</Text>
              </Box>
            </Resizable.Panel>
            <Resizable.Handle />
            <Resizable.Panel>
              <Box padding="space.150">
                <Text size="small">Detail</Text>
              </Box>
            </Resizable.Panel>
          </Resizable>
        </Box>
        <Box style={{ width: 320, height: 160 }} className="rounded-medium border border-default">
          <Resizable orientation="vertical">
            <Resizable.Panel defaultSize={50}>
              <Box padding="space.150">
                <Text size="small">Top</Text>
              </Box>
            </Resizable.Panel>
            <Resizable.Handle />
            <Resizable.Panel>
              <Box padding="space.150">
                <Text size="small">Bottom</Text>
              </Box>
            </Resizable.Panel>
          </Resizable>
        </Box>
      </Specimens>
      <Specimens title="floor and ceiling · collapsible · three panes">
        <Box style={{ width: 320, height: 120 }} className="rounded-medium border border-default">
          <Resizable>
            <Resizable.Panel defaultSize={40} minSize={25} maxSize={60}>
              <Box padding="space.150">
                <Text size="small">25% to 60%</Text>
              </Box>
            </Resizable.Panel>
            <Resizable.Handle />
            <Resizable.Panel>
              <Box padding="space.150">
                <Text size="small">The rest</Text>
              </Box>
            </Resizable.Panel>
          </Resizable>
        </Box>
        <Box style={{ width: 320, height: 120 }} className="rounded-medium border border-default">
          <Resizable>
            <Resizable.Panel defaultSize={35} minSize={25} collapsible>
              <Box padding="space.150">
                <Text size="small">Tree, folds</Text>
              </Box>
            </Resizable.Panel>
            <Resizable.Handle label="Resize the tree" />
            <Resizable.Panel>
              <Box padding="space.150">
                <Text size="small">Work</Text>
              </Box>
            </Resizable.Panel>
          </Resizable>
        </Box>
        <Box style={{ width: 320, height: 120 }} className="rounded-medium border border-default">
          <Resizable>
            <Resizable.Panel defaultSize={25} minSize={15}>
              <Box padding="space.150">
                <Text size="small">Tree</Text>
              </Box>
            </Resizable.Panel>
            <Resizable.Handle label="Resize the tree" />
            <Resizable.Panel>
              <Box padding="space.150">
                <Text size="small">Record</Text>
              </Box>
            </Resizable.Panel>
            <Resizable.Handle label="Resize the preview" />
            <Resizable.Panel defaultSize={25} minSize={15}>
              <Box padding="space.150">
                <Text size="small">Preview</Text>
              </Box>
            </Resizable.Panel>
          </Resizable>
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
          <Box
            style={{ height: 140 }}
            className="overflow-hidden rounded-medium border border-default"
          >
            <Resizable>
              <Resizable.Panel defaultSize={35} minSize={20}>
                <List count={8} />
              </Resizable.Panel>
              <Resizable.Handle />
              <Resizable.Panel>
                <Box padding="space.150">
                  <Text size="small" color="color.text.subtle">
                    The chosen control.
                  </Text>
                </Box>
              </Resizable.Panel>
            </Resizable>
          </Box>
        }
        doText="A list beside what it opens: the reader gives the list room when the names are long and the preview room when they read."
        dont={
          <Box
            style={{ height: 140 }}
            className="overflow-hidden rounded-medium border border-default"
          >
            <Resizable>
              <Resizable.Panel defaultSize={50} minSize={30}>
                <Box padding="space.150">
                  <Text size="small" color="color.text.subtle">
                    Implementation
                  </Text>
                </Box>
              </Resizable.Panel>
              <Resizable.Handle />
              <Resizable.Panel>
                <Box padding="space.150">
                  <Text size="small" color="color.text.subtle">
                    Assessment
                  </Text>
                </Box>
              </Resizable.Panel>
            </Resizable>
          </Box>
        }
        dontText="A page's sections split by a handle. Sections stack and the page scrolls; there is nothing to trade between them."
      />
      <Pair
        do={
          <Stack space="space.150">
            <Text size="small">Above the rule</Text>
            <Separator />
            <Text size="small">Below it</Text>
          </Stack>
        }
        doText="A rule that divides is a Separator: not focusable, not draggable."
        dont={
          <Box
            style={{ height: 100 }}
            className="overflow-hidden rounded-medium border border-default"
          >
            <Resizable orientation="vertical">
              <Resizable.Panel defaultSize={50} minSize={50} maxSize={50}>
                <Box padding="space.150">
                  <Text size="small">Above the rule</Text>
                </Box>
              </Resizable.Panel>
              <Resizable.Handle />
              <Resizable.Panel>
                <Box padding="space.150">
                  <Text size="small">Below it</Text>
                </Box>
              </Resizable.Panel>
            </Resizable>
          </Box>
        }
        dontText="A handle as a rule, with the panes pinned so it cannot move. It takes focus, shows a resize cursor and does nothing."
      />
    </Stack>
  ),
};

export const Playground: StoryObj<{ orientation: "horizontal" | "vertical" }> = {
  args: { orientation: "horizontal" },
  argTypes: { orientation: { control: "radio", options: ["horizontal", "vertical"] } },
  render: (args) => (
    <Frame>
      <Resizable {...args}>
        <Resizable.Panel defaultSize={30} minSize={20}>
          <List />
        </Resizable.Panel>
        <Resizable.Handle />
        <Resizable.Panel>
          <Box padding="space.200">
            <Text color="color.text.subtle">The other pane.</Text>
          </Box>
        </Resizable.Panel>
      </Resizable>
    </Frame>
  ),
};
