import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge, Table, type Tone } from "../../components";
import { DataTable, defineColumns, useDataTable } from "../../patterns";
import { Box, Inline, Stack, Text } from "../../primitives";

const meta = {
  title: "Components/Density",
  component: Table,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Table>;
export default meta;
type Story = StoryObj;

type Control = {
  id: string;
  name: string;
  status: "Verified" | "Overdue" | "In review";
  owner: string;
};
const tone: Record<Control["status"], Tone> = {
  Verified: "success",
  Overdue: "danger",
  "In review": "information",
};
const controls: Control[] = [
  {
    id: "CTRL-0412",
    name: "Segregation of duties, payables",
    status: "Verified",
    owner: "Dana Whitfield",
  },
  {
    id: "CTRL-0418",
    name: "Privileged access review",
    status: "Overdue",
    owner: "Priya Natarajan",
  },
  {
    id: "CTRL-0421",
    name: "Firewall rule recertification",
    status: "In review",
    owner: "Sam Okafor",
  },
  { id: "CTRL-0430", name: "Backup restore test", status: "Verified", owner: "Dana Whitfield" },
];

function Plain({ density }: { density?: "default" | "compact" | undefined }) {
  return (
    <Table label="Controls" density={density}>
      <thead>
        <tr>
          <Table.Header width={110}>ID</Table.Header>
          <Table.Header>Control</Table.Header>
          <Table.Header width={110}>Status</Table.Header>
        </tr>
      </thead>
      <tbody>
        {controls.map((c) => (
          <Table.Row key={c.id}>
            <Table.Id id={c.id} />
            <Table.Cell>{c.name}</Table.Cell>
            <Table.Cell>
              <Badge variant="secondary" tone={tone[c.status]}>
                {c.status}
              </Badge>
            </Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

/** The two heights on a plain Table: `density="compact"` sets `data-density` on the frame and every row inside follows. The header keeps its height. */
export const Tables: Story = {
  render: () => (
    <Inline space="space.300" alignBlock="start" shouldWrap>
      <Box style={{ width: 440 }}>
        <Stack space="space.100">
          <Text size="xsmall" color="color.text.subtlest">
            default · 40px rows
          </Text>
          <Plain />
        </Stack>
      </Box>
      <Box style={{ width: 440 }}>
        <Stack space="space.100">
          <Text size="xsmall" color="color.text.subtlest">
            compact · 36px rows
          </Text>
          <Plain density="compact" />
        </Stack>
      </Box>
    </Inline>
  ),
};

const columns = defineColumns<Control>((c) => [
  c.id("id"),
  c.text("name", { header: "Control", minWidth: 220 }),
  c.status("status", { header: "Status", tone: (r) => tone[r.status] }),
  c.person("owner", { header: "Owner" }),
]);

function Register({
  view,
  density,
}: {
  view?: string | undefined;
  density?: "default" | "compact" | undefined;
}) {
  const table = useDataTable({
    columns,
    data: controls,
    getRowId: (r) => r.id,
    label: "Controls",
    view,
    density,
  });
  return (
    <DataTable
      table={table}
      toolbar={
        <Inline space="space.100" alignBlock="center">
          <Text size="small" color="color.text.subtle">
            {view
              ? "Open Columns, tick Compact rows; the choice persists under the view's name."
              : "Compact by design: the author set it."}
          </Text>
          <span className="ms-auto">
            <DataTable.Columns table={table} />
          </span>
        </Inline>
      }
    />
  );
}

/** A DataTable's density is the reader's: Compact rows in the Columns menu, kept with the rest of the view under `view`, and put back by Reset view. */
export const RegisterStory: Story = {
  name: "Register",
  render: () => (
    <Box style={{ maxWidth: 760 }}>
      <Register view="storybook.density.register" />
    </Box>
  ),
};

/** `density: "compact"` on `useDataTable`: the author's default, for a picker's table where the rows are many and short. The reader can still change it. */
export const ByDesign: Story = {
  render: () => (
    <Box style={{ maxWidth: 760 }}>
      <Register density="compact" />
    </Box>
  ),
};
