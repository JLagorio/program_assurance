import type { Meta, StoryObj } from "@storybook/react-vite";

import { KeyValue, ScrollArea, Table } from "../../components";
import { Box, Inline, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/ScrollArea",
  component: ScrollArea,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ScrollArea>;
export default meta;
type Story = StoryObj;

const facts = [
  ["Owner", "Priya Natarajan"],
  ["System", "Atlas"],
  ["Class", "Moderate"],
  ["Hosting", "Cloud"],
  ["Assessed", "12 Aug 2026"],
  ["Next gate", "12 Sep 2026"],
  ["Authorizing official", "Dana Whitfield"],
  ["Assessor", "Northwind Audit"],
  ["Environment", "Production"],
  ["Review gate", "CDR"],
  ["Inherited", "4 controls"],
  ["Suspect links", "2"],
] as const;

function Facts() {
  return (
    <Stack space="space.050">
      {facts.map(([k, v]) => (
        <KeyValue key={k} label={k}>
          {v}
        </KeyValue>
      ))}
    </Stack>
  );
}

const wide = Array.from({ length: 9 }, (_, i) => ({
  id: `AC-${i + 2}`,
  name: ["Account management", "Access enforcement", "Information flow", "Separation of duties", "Least privilege", "Unsuccessful logons", "System use notification", "Session lock", "Session termination"][i],
  owner: ["Dana Whitfield", "Priya Natarajan", "Sam Okafor"][i % 3],
  status: ["Verified", "In review", "Draft"][i % 3],
  method: ["Examine", "Interview", "Test"][i % 3],
  assessed: `2026-08-${String(i + 3).padStart(2, "0")}`,
}));

/** A rail's facts in a fixed height: the bar shows while the pointer is over them. A keyboard reader tabs to the region, named "Facts", and scrolls it with the arrows. */
export const Rail: Story = {
  render: () => (
    <Box style={{ width: 300, height: 220 }} className="rounded-large border border-default bg-surface-raised">
      <ScrollArea className="h-full" label="Facts">
        <Box padding="space.150">
          <Facts />
        </Box>
      </ScrollArea>
    </Box>
  ),
};

/** `orientation="horizontal"`: a table wider than its card scrolls sideways under the kit's bar. */
export const Wide: Story = {
  render: () => (
    <Box style={{ width: 520 }} className="rounded-large border border-default">
      <ScrollArea orientation="horizontal" label="Controls">
        <Table label="Controls" className="w-max min-w-full">
          <thead>
            <Table.Row>
              <Table.Header width={72}>Id</Table.Header>
              <Table.Header width={200}>Control</Table.Header>
              <Table.Header width={160}>Owner</Table.Header>
              <Table.Header width={120}>Status</Table.Header>
              <Table.Header width={120}>Method</Table.Header>
              <Table.Header width={120}>Assessed</Table.Header>
            </Table.Row>
          </thead>
          <tbody>
            {wide.map((r) => (
              <Table.Row key={r.id}>
                <Table.Id id={r.id} />
                <Table.Cell>{r.name}</Table.Cell>
                <Table.Cell>{r.owner}</Table.Cell>
                <Table.Cell>{r.status}</Table.Cell>
                <Table.Cell>{r.method}</Table.Cell>
                <Table.Cell>{r.assessed}</Table.Cell>
              </Table.Row>
            ))}
          </tbody>
        </Table>
      </ScrollArea>
    </Box>
  ),
};

/** `bar="always"`: the bar stays, so a reader sees there is more without touching the region. For a list whose length matters. */
export const Always: Story = {
  render: () => (
    <Box style={{ width: 300, height: 220 }} className="rounded-large border border-default bg-surface-raised">
      <ScrollArea className="h-full" bar="always" label="Facts">
        <Box padding="space.150">
          <Facts />
        </Box>
      </ScrollArea>
    </Box>
  ),
};

/** Vertical, horizontal and both, with the bar on hover and always. */
export const ScrollAreaMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      {(["hover", "always"] as const).map((bar) => (
        <Specimens key={bar} title={`bar ${bar}`}>
          {(["vertical", "horizontal", "both"] as const).map((o) => (
            <Box key={o} style={{ width: 220, height: 140 }} className="rounded-medium border border-default">
              <ScrollArea orientation={o} bar={bar} label={`${o}, ${bar}`} className="h-full">
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
        </Specimens>
      ))}
    </Stack>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Box style={{ width: 280, height: 160 }} className="rounded-large border border-default bg-surface-raised">
            <ScrollArea className="h-full" label="Facts">
              <Box padding="space.150">
                <Facts />
              </Box>
            </ScrollArea>
          </Box>
        }
        doText="A rail of fixed height scrolls inside itself: the page keeps its place and the rail keeps its facts."
        dont={
          <Box style={{ width: 280, height: 160 }} className="rounded-large border border-default">
            <ScrollArea className="h-full" label="The page">
              <Box padding="space.150">
                <Stack space="space.150">
                  <Text weight="semibold">Implementation</Text>
                  <Text size="small" color="color.text.subtle">The three implementation statements.</Text>
                  <Text weight="semibold">Assessment</Text>
                  <Text size="small" color="color.text.subtle">The assessment, its objectives and its result.</Text>
                  <Text weight="semibold">Evidence</Text>
                  <Text size="small" color="color.text.subtle">The evidence table.</Text>
                </Stack>
              </Box>
            </ScrollArea>
          </Box>
        }
        dontText="The page's body in a ScrollArea. The reader scrolls a box inside a page that also scrolls, and the sections are hidden in it."
      />
      <Pair
        do={
          <Inline space="space.100" alignBlock="center">
            <Text size="small" color="color.text.subtle">
              A register is a DataTable: it scrolls the page, or itself past `maxHeight` with its header held.
            </Text>
          </Inline>
        }
        doText="A table of records is the page's, or a DataTable with its own frame; its header stays put and its rows are counted."
        dont={
          <Box style={{ width: 280, height: 120 }} className="rounded-large border border-default">
            <ScrollArea className="h-full" label="Controls">
              <Table label="Controls">
                <tbody>
                  {wide.slice(0, 6).map((r) => (
                    <Table.Row key={r.id}>
                      <Table.Id id={r.id} />
                      <Table.Cell>{r.name}</Table.Cell>
                    </Table.Row>
                  ))}
                </tbody>
              </Table>
            </ScrollArea>
          </Box>
        }
        dontText="A register in a 120px ScrollArea. The reader sees three rows of a hundred, and the header, if there were one, would scroll away."
      />
    </Stack>
  ),
};

export const Playground: StoryObj<{ orientation: "vertical" | "horizontal" | "both"; bar: "hover" | "always"; label: string }> = {
  args: { orientation: "vertical", bar: "hover", label: "Facts" },
  argTypes: { orientation: { control: "radio", options: ["vertical", "horizontal", "both"] }, bar: { control: "radio", options: ["hover", "always"] } },
  render: (args) => (
    <Box style={{ width: 300, height: 220 }} className="rounded-large border border-default bg-surface-raised">
      <ScrollArea {...args} className="h-full">
        <Box padding="space.150" style={{ width: args.orientation === "vertical" ? undefined : 480 }}>
          <Facts />
        </Box>
      </ScrollArea>
    </Box>
  ),
};
