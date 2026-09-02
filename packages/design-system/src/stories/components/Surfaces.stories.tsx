import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button, CodeBlock, Resizable, ScrollArea, Toaster, toast } from "../../components";
import { Box, Inline, Stack, Text } from "../../primitives";

const meta = {
  title: "Components/Surfaces",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

const source = `{
  "control": "CTRL-0412",
  "name": "Segregation of duties, payables",
  "owner": "dana.whitfield",
  "frequency": "quarterly",
  "evidence": ["EV-2201", "EV-2202"],
  "verified": "2026-08-12"
}`.split("\n");

export const Code: Story = {
  render: () => <CodeBlock lines={source} start={40} className="max-w-[560px]" />,
};

export const Panes: Story = {
  render: () => (
    <div className="h-400 max-w-[720px] overflow-hidden rounded-large border border-default" style={{ height: 260 }}>
      <Resizable>
        <Resizable.Panel defaultSize={30} minSize={20}>
          <ScrollArea className="h-full">
            <Stack space="space.0">
              {Array.from({ length: 24 }, (_, i) => (
                <Box key={i} paddingInline="space.150" paddingBlock="space.075">
                  <Text size="small">CTRL-{400 + i}</Text>
                </Box>
              ))}
            </Stack>
          </ScrollArea>
        </Resizable.Panel>
        <Resizable.Handle />
        <Resizable.Panel>
          <Box padding="space.200">
            <Text color="color.text.subtle">Drag the hairline. The arrow keys move it too.</Text>
          </Box>
        </Resizable.Panel>
      </Resizable>
    </div>
  ),
};

export const Toasts: Story = {
  render: () => (
    <>
      <Toaster />
      <Inline space="space.100">
        <Button onClick={() => toast.success("Evidence linked", { description: "Bank reconciliation, July" })}>Success</Button>
        <Button onClick={() => toast.error("Could not save", { description: "The owner must be on the programme." })}>Error</Button>
        <Button onClick={() => toast.warning("Due in 2 days")}>Warning</Button>
        <Button onClick={() => toast.info("3 controls updated", { action: { label: "Undo", onClick: () => undefined } })}>Info with action</Button>
      </Inline>
    </>
  ),
};
