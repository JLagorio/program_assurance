import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge, Table, ToggleGroup, type Tone } from "../../components";
import { DataTable, defineColumns, useDataTable } from "../../patterns";
import { Box, Inline, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

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
              <Badge tone={tone[c.status]}>{c.status}</Badge>
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

/** The two heights side by side on a plain Table and on a DataTable; the header row is 32px in both. */
export const DensityMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Specimens title="Table · default · compact">
        <Box style={{ width: 400 }}>
          <Plain />
        </Box>
        <Box style={{ width: 400 }}>
          <Plain density="compact" />
        </Box>
      </Specimens>
      <Specimens title="DataTable · compact by design">
        <Box style={{ width: 720 }}>
          <Register density="compact" />
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
          <Box style={{ width: 460 }}>
            <Register view="storybook.density.dont" />
          </Box>
        }
        doText="Density is the table's: Compact rows in its Columns menu, one table at a time, kept with its view."
        dont={
          <Box style={{ width: 460 }}>
            <Stack space="space.150">
              <Inline
                space="space.100"
                alignBlock="center"
                className="rounded-medium border border-default bg-surface-raised px-150 py-075"
              >
                <Text size="small" color="color.text.subtle">
                  Equinox
                </Text>
                <span className="ms-auto">
                  <ToggleGroup
                    aria-label="Row density"
                    value="compact"
                    onChange={() => {}}
                    items={[
                      { value: "default", label: "Comfortable" },
                      { value: "compact", label: "Compact" },
                    ]}
                  />
                </span>
              </Inline>
              <Plain density="compact" />
            </Stack>
          </Box>
        }
        dontText="A density switch in the top bar. It squeezes every table in the product at once, including the rails and the pickers that were sized on purpose."
      />
      <Pair
        do={
          <Box style={{ width: 460 }}>
            <Plain />
          </Box>
        }
        doText="Default rows for a register the reader reads: a Badge and a name with room around them."
        dont={
          <Box style={{ width: 460 }} data-density="compact">
            <Stack space="space.150">
              <Plain />
              <Text size="small" color="color.text.subtle">
                The page's facts, its lists and every other row here are compact too.
              </Text>
            </Stack>
          </Box>
        }
        dontText="The attribute on a page wrapper to fit more in. Everything inside with a row height follows, and nothing chose to."
      />
    </Stack>
  ),
};

export const Playground: StoryObj<{ density: "default" | "compact" }> = {
  args: { density: "default" },
  argTypes: { density: { control: "radio", options: ["default", "compact"] } },
  render: (args) => (
    <Box style={{ width: 460 }}>
      <Plain density={args.density} />
    </Box>
  ),
};
