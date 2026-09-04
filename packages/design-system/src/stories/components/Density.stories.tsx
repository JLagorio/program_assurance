import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import {
  DENSITY_STORAGE_KEY,
  DensityProvider,
  DensitySwitch,
  useDensity,
  type Density,
} from "../../mode";
import { Table } from "../../components";
import { Stack, Text } from "../../primitives";
import { Matrix, Specimens } from "../_lib/matrix";

const meta = {
  title: "Components/Density",
  component: DensitySwitch,
  parameters: { layout: "padded" },
} satisfies Meta<typeof DensitySwitch>;
export default meta;
type Story = StoryObj<typeof meta>;

function DensityReadout() {
  const { density } = useDensity();
  return (
    <Text size="small" color="color.text.subtle">
      Choice: {density} · stored under {DENSITY_STORAGE_KEY} · every table follows
    </Text>
  );
}

const specimenRows = [
  ["CTRL-0412", "Segregation of duties, payables", "Verified"],
  ["CTRL-0418", "Privileged access review", "Overdue"],
  ["CTRL-0421", "Firewall rule recertification", "In review"],
] as const;

function SpecimenTable() {
  return (
    <Table>
      <thead>
        <tr>
          <Table.Header width={110}>ID</Table.Header>
          <Table.Header>Control</Table.Header>
          <Table.Header width={100}>Status</Table.Header>
        </tr>
      </thead>
      <tbody>
        {specimenRows.map(([id, name, status]) => (
          <Table.Row key={id}>
            <Table.Id id={id} />
            <Table.Cell>{name}</Table.Cell>
            <Table.Cell>{status}</Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

/** Density is a setting, not a prop: the provider sets `data-density` on the root and every table follows. The choice is stored in this browser. */
export const DensityLive: Story = {
  name: "Density, live",
  render: () => (
    <DensityProvider>
      <Stack space="space.150">
        <DensitySwitch />
        <DensityReadout />
        <SpecimenTable />
      </Stack>
    </DensityProvider>
  ),
};

function DensityControlled() {
  const [density, setDensity] = useState<Density>("compact");
  return (
    <Stack space="space.150">
      <DensitySwitch value={density} onChange={setDensity} showLabels />
      <div data-density={density === "compact" ? "compact" : undefined}>
        <SpecimenTable />
      </div>
    </Stack>
  );
}
/** `value` and `onChange` override the provider; here the attribute sits on one frame, which is how a table that is compact by design (a picker's) opts in alone. */
export const DensityControlledStory: Story = {
  name: "Density, one frame",
  render: () => <DensityControlled />,
};

/** Each state, icons only and with labels; then the two row heights side by side. */
export const DensityMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Matrix
        rows={["icons", "labels"] as const}
        cols={["default", "compact"] as const}
        rowLabel="form"
        render={(form, density) => (
          <DensitySwitch value={density} onChange={() => {}} showLabels={form === "labels"} />
        )}
      />
      <Specimens title="Default, 40px rows">
        <SpecimenTable />
      </Specimens>
      <Specimens title="Compact, 36px rows">
        <div data-density="compact">
          <SpecimenTable />
        </div>
      </Specimens>
    </Stack>
  ),
};
