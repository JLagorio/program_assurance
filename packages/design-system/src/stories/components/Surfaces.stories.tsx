import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button, CodeBlock, Resizable, ScrollArea, Toaster, toast } from "../../components";
import { Box, Inline, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";

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
    <div
      className="h-400 max-w-[720px] overflow-hidden rounded-large border border-default"
      style={{ height: 260 }}
    >
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
        <Button
          onClick={() =>
            toast.success("Evidence linked", { description: "Bank reconciliation, July" })
          }
        >
          Success
        </Button>
        <Button
          onClick={() =>
            toast.error("Could not save", { description: "The owner must be on the programme." })
          }
        >
          Error
        </Button>
        <Button onClick={() => toast.warning("Due in 2 days")}>Warning</Button>
        <Button
          onClick={() =>
            toast.info("3 controls updated", {
              action: { label: "Undo", onClick: () => undefined },
            })
          }
        >
          Info with action
        </Button>
      </Inline>
    </>
  ),
};

/** A few lines, numbered from a start line, and a capped height that scrolls. */
export const CodeBlockMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <CodeBlock
        lines={["{", '  "control-id": "ac-2.3",', '  "status": "partially-satisfied"', "}"]}
      />
      <CodeBlock
        start={118}
        lines={["line vty 0 4", " transport input telnet ssh", " login local"]}
      />
      <CodeBlock maxHeight={96} lines={Array.from({ length: 24 }, (_, i) => `row ${i + 1}`)} />
    </Stack>
  ),
};

/** Horizontal and vertical splits with a minimum. */
export const ResizableMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Box style={{ height: 120 }} className="rounded-medium border border-default">
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
      <Box style={{ height: 200 }} className="rounded-medium border border-default">
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
    </Stack>
  ),
};

/** Vertical, horizontal, and both. */
export const ScrollAreaMatrix: Story = {
  render: () => (
    <Inline space="space.300" alignBlock="start" shouldWrap>
      {(["vertical", "horizontal", "both"] as const).map((o) => (
        <Box
          key={o}
          style={{ width: 220, height: 140 }}
          className="rounded-medium border border-default"
        >
          <ScrollArea orientation={o} className="h-full">
            <Box padding="space.150" style={{ width: o === "vertical" ? undefined : 480 }}>
              <Stack space="space.050">
                {Array.from({ length: o === "horizontal" ? 3 : 12 }, (_, i) => (
                  <Text key={i} size="small">
                    {o} · row {i + 1}
                  </Text>
                ))}
              </Stack>
            </Box>
          </ScrollArea>
        </Box>
      ))}
    </Inline>
  ),
};

/** Every kind of toast, fired from a button. */
export const ToasterMatrix: Story = {
  render: () => (
    <Stack space="space.200">
      <Toaster />
      <Specimens title="toast">
        <Button variant="secondary" size="small" onClick={() => toast("Saved")}>
          Plain
        </Button>
        <Button
          variant="secondary"
          size="small"
          onClick={() => toast.success("Assessment recorded")}
        >
          Success
        </Button>
        <Button
          variant="secondary"
          size="small"
          onClick={() => toast.error("Could not reach the evidence store")}
        >
          Error
        </Button>
        <Button
          variant="secondary"
          size="small"
          onClick={() => toast.info("Three artifacts expire this month")}
        >
          Info
        </Button>
        <Button
          variant="secondary"
          size="small"
          onClick={() => toast.loading("Generating the package…")}
        >
          Loading
        </Button>
        <Button
          variant="secondary"
          size="small"
          onClick={() =>
            toast("Archived PRG-1041", {
              description: "Its controls stay readable.",
              action: { label: "Undo", onClick: () => {} },
            })
          }
        >
          With an action
        </Button>
      </Specimens>
    </Stack>
  ),
};
