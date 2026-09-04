import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Button, Pagination, Table } from "../../components";
import { Inline, Stack, Text } from "../../primitives";
import { Matrix as Grid } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Pagination",
  component: Pagination,
  parameters: { layout: "padded" },
  args: { page: 6, pageCount: 12, onPageChange: () => {}, total: 289, pageSize: 25 },
} satisfies Meta<typeof Pagination>;
export default meta;
type Story = StoryObj<typeof meta>;

const states = ["first page", "middle page", "last page", "one page", "no rows"] as const;
type State = (typeof states)[number];
const stateProps = (s: State) =>
  s === "first page"
    ? { page: 1, pageCount: 12, total: 289 }
    : s === "middle page"
      ? { page: 6, pageCount: 12, total: 289 }
      : s === "last page"
        ? { page: 12, pageCount: 12, total: 289 }
        : s === "one page"
          ? { page: 1, pageCount: 1, total: 5 }
          : { page: 1, pageCount: 1, total: 0 };

/** Every state down the side; with the range and bare across. Each nav is named, so a page of several stays valid. */
export const PaginationMatrix: Story = {
  render: () => (
    <Grid
      rows={states}
      cols={["with the range", "bare"] as const}
      rowLabel="state"
      render={(state, col) => {
        const { page, pageCount, total } = stateProps(state);
        return (
          <div style={{ width: 440 }}>
            <Pagination
              page={page}
              pageCount={pageCount}
              onPageChange={() => {}}
              label={`${state}, ${col}`}
              {...(col === "with the range" ? { total, pageSize: 25 } : {})}
            />
          </div>
        );
      }}
    />
  ),
};

const risks = Array.from({ length: 23 }, (_, i) => ({
  id: `RSK-${String(i + 1).padStart(3, "0")}`,
  title:
    [
      "Export resolver leaks tenants",
      "Stale admin accounts",
      "Unsigned firmware",
      "Backups untested",
    ][i % 4] ?? "",
  owner: ["Sarah Chen", "Linus Aarto", "Priya Raghavan"][i % 3] ?? "",
}));

function Rows({ from, to }: { from: number; to: number }) {
  return (
    <Table label="Risks">
      <thead>
        <tr>
          <Table.Header width={110}>Risk</Table.Header>
          <Table.Header>Title</Table.Header>
          <Table.Header width={160}>Owner</Table.Header>
        </tr>
      </thead>
      <tbody>
        {risks.slice(from, to).map((r) => (
          <Table.Row key={r.id}>
            <Table.Id id={r.id} />
            <Table.Cell>{r.title}</Table.Cell>
            <Table.Cell>{r.owner}</Table.Cell>
          </Table.Row>
        ))}
      </tbody>
    </Table>
  );
}

function PagedDemo() {
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const pageCount = Math.ceil(risks.length / pageSize);
  return (
    <div style={{ width: 560 }}>
      <Stack space="space.150">
        <Rows from={(page - 1) * pageSize} to={page * pageSize} />
        <Pagination
          page={page}
          pageCount={pageCount}
          onPageChange={setPage}
          total={risks.length}
          pageSize={pageSize}
          label="Risks pagination"
        />
      </Stack>
    </div>
  );
}

/** Under the table it pages: the range at the start, the pages at the end. The owner holds the page; a DataTable does this itself with `pageSize`. */
export const Paged: Story = { render: () => <PagedDemo /> };

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Stack space="space.150">
            <Rows from={0} to={3} />
            <Pagination
              page={1}
              pageCount={8}
              onPageChange={() => {}}
              total={23}
              pageSize={3}
              label="Below the table"
            />
          </Stack>
        }
        doText="Under the table it pages, the range at the start and the pages at the end."
        dont={
          <Stack space="space.150">
            <Pagination
              page={1}
              pageCount={8}
              onPageChange={() => {}}
              total={23}
              pageSize={3}
              label="Above the table"
            />
            <Rows from={0} to={3} />
          </Stack>
        }
        dontText="Above the table. The reader turns the page before seeing what is on it, and the header is no longer the first row."
      />
      <Pair
        do={
          <Pagination
            page={2}
            pageCount={12}
            onPageChange={() => {}}
            total={289}
            pageSize={25}
            label="The range"
          />
        }
        doText='The range is numbers: "26–50 of 289", and every page is one click away.'
        dont={
          <Inline space="space.100" alignBlock="center">
            <Text size="small" color="color.text.subtle">
              Showing 26 to 50 of 289 results
            </Text>
            <Button size="small" variant="subtle">
              Previous
            </Button>
            <Button size="small" variant="subtle">
              Next
            </Button>
          </Inline>
        }
        dontText="A sentence and two word buttons. There is no way to a page but one step at a time, and the sentence takes the room the pages need."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
