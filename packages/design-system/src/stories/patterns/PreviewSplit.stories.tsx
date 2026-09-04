import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Table } from "../../components";
import { PreviewRail, PreviewSplit } from "../../patterns";
import { Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";

const meta = {
  title: "Patterns/PreviewSplit",
  component: PreviewSplit,
  parameters: { layout: "padded" },
} satisfies Meta<typeof PreviewSplit>;
export default meta;
type Story = StoryObj;

const splitRows = [
  { id: "PRG-001", title: "Ground segment refresh", phase: "Assess" },
  { id: "PRG-002", title: "Payload integration", phase: "Authorise" },
  { id: "PRG-003", title: "Fleet telemetry", phase: "Monitor" },
  { id: "PRG-004", title: "Range safety", phase: "Prepare" },
];

/** The list, and beside it the rail of the chosen row, sized by the reader. */
function SplitDemo({ open }: { open: boolean }) {
  const [selected, setSelected] = useState<string | null>(open ? "PRG-002" : null);
  const row = splitRows.find((r) => r.id === selected);
  return (
    <PreviewSplit open={row !== undefined}>
      <Table>
        <thead>
          <tr>
            <Table.Header width={120}>Program</Table.Header>
            <Table.Header>Title</Table.Header>
            <Table.Header width={120}>Phase</Table.Header>
          </tr>
        </thead>
        <tbody>
          {splitRows.map((r) => (
            <Table.Row key={r.id} isSelected={r.id === selected} onClick={() => setSelected(r.id)}>
              <Table.Id id={r.id} />
              <Table.Cell>{r.title}</Table.Cell>
              <Table.Cell>{r.phase}</Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
      {row ? (
        <PreviewRail id={row.id} title={row.title} onClose={() => setSelected(null)}>
          <Text color="color.text.subtle">
            Phase {row.phase}. The rail beside a table, sized by the reader; the record's own rail
            is the shell's panel.
          </Text>
        </PreviewRail>
      ) : null}
    </PreviewSplit>
  );
}
export const PreviewSplitStory: Story = { name: "Preview split", render: () => <SplitDemo open /> };
export const PreviewSplitMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Specimens title="Closed: the list at full width">
        <SplitDemo open={false} />
      </Specimens>
      <Specimens title="Open: the rail the reader sizes, from 18% to 45%">
        <SplitDemo open />
      </Specimens>
    </Stack>
  ),
};
