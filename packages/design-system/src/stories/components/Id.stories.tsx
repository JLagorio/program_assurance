import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef } from "react";
import { expect, within } from "storybook/test";

import { Id, Table, TextLink } from "../../components";
import { Box, Inline, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Id",
  component: Id,
  parameters: { layout: "padded" },
  args: { children: "CTRL-0412" },
} satisfies Meta<typeof Id>;
export default meta;
type Story = StoryObj<typeof meta>;

/** An Id in text, in a title, in a link, in a cell, a hash, and the list with many and with none. */
export const IdMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Specimens title="In text, in a title, in a link">
        <Text>
          Finding <Id>FND-2231</Id> rolls up to <Id>RSK-0021</Id>.
        </Text>
        <Inline space="space.100" alignBlock="baseline">
          <Id className="text-subtle">CTRL-0412</Id>
          <Text weight="medium">Segregation of duties, payables</Text>
        </Inline>
        <TextLink render={<a href="#f" />}>
          <Id>FND-2231</Id>
        </TextLink>
      </Specimens>
      <Specimens title="A hash breaks anywhere">
        <Box style={{ width: 200 }}>
          <Id className="break-all font-body-small text-subtle">
            sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
          </Id>
        </Box>
      </Specimens>
      <Specimens title="Id.List: many, wrapping in 160px, none, none with a word">
        <Box style={{ width: 160 }}>
          <Id.List
            data-testid="many"
            ids={["AC-2", "AC-2(1)", "AC-2(3)", "AC-3", "AC-6(1)", "AC-7", "AC-11", "AC-17"]}
          />
        </Box>
        <Id.List ids={[]} data-testid="none" />
        <Id.List ids={[]} empty="No controls" data-testid="none-word" />
      </Specimens>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const many = canvas.getByTestId("many");
    const ids = Array.from(many.querySelectorAll<HTMLElement>('[data-slot="id"]'));
    await expect(ids.map((id) => id.textContent)).toEqual([
      "AC-2",
      "AC-2(1)",
      "AC-2(3)",
      "AC-3",
      "AC-6(1)",
      "AC-7",
      "AC-11",
      "AC-17",
    ]);
    // The run wraps between ids, never inside one, and stays in its column.
    const tops = new Set(ids.map((id) => Math.round(id.getBoundingClientRect().top)));
    await expect(tops.size).toBeGreaterThan(1);
    for (const id of ids) {
      await expect(id.getClientRects()).toHaveLength(1);
      await expect(id.getBoundingClientRect().right).toBeLessThanOrEqual(
        many.getBoundingClientRect().right + 0.5,
      );
    }
    // None: the muted dash, or the word the caller gives.
    await expect(canvas.getByTestId("none")).toHaveTextContent("—");
    await expect(canvas.getByTestId("none")).toHaveAttribute("data-empty");
    await expect(canvas.getByTestId("none-word")).toHaveTextContent("No controls");
  },
};

const idRef = createRef<HTMLSpanElement>();

/** Native span props, a class and a ref reach the Id, and it names itself last with `data-slot="id"`; Id.List takes the same on its run. */
export const NativeAttributes: Story = {
  render: () => (
    <Text>
      Finding{" "}
      <Id ref={idRef} data-testid="finding" title="Finding FND-2231" className="text-subtle">
        FND-2231
      </Id>{" "}
      is open.
    </Text>
  ),
  play: async ({ canvasElement }) => {
    const id = within(canvasElement).getByTestId("finding");
    await expect(idRef.current).toBe(id);
    await expect(id).toHaveAttribute("data-slot", "id");
    await expect(id).toHaveAttribute("title", "Finding FND-2231");
    await expect(id).toHaveClass("tabular-nums", "text-subtle");
  },
};

/** In a table: the id column subtle, the name default; both tabular so the ids line up. */
export const InRows: Story = {
  render: () => (
    <div style={{ maxWidth: 520 }}>
      <Table label="Controls">
        <thead>
          <tr>
            <Table.Header width={104}>Id</Table.Header>
            <Table.Header>Control</Table.Header>
          </tr>
        </thead>
        <tbody>
          {[
            ["CTRL-0412", "Segregation of duties, payables"],
            ["CTRL-0418", "Privileged access review"],
            ["CTRL-1207", "Change approval before release"],
          ].map(([id, name]) => (
            <Table.Row key={id}>
              <Table.Cell>
                <Id className="text-subtle">{id}</Id>
              </Table.Cell>
              <Table.Cell>{name}</Table.Cell>
            </Table.Row>
          ))}
        </tbody>
      </Table>
    </div>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Text>
            Finding <Id>FND-2231</Id> rolls up to <Id>RSK-0021</Id>.
          </Text>
        }
        doText="An Id takes the colour of its sentence; only its numerals change."
        dont={
          <Text>
            Finding <Id className="text-brand">FND-2231</Id> rolls up to{" "}
            <Id className="text-brand">RSK-0021</Id>.
          </Text>
        }
        dontText="Ids in the link colour with nothing to click. The reader tries, and learns not to trust blue."
      />
      <Pair
        do={<Id.List ids={["AC-2", "AC-2(1)", "AC-2(3)", "AC-3"]} />}
        doText="Many ids are an Id.List: each its own run, wrapping."
        dont={<Text>AC-2, AC-2(1), AC-2(3), AC-3</Text>}
        dontText="Ids joined with commas. One string, no runs, and a wrap can split an id from its parenthesis."
      />
      <Pair
        do={<Id>CTRL-0412</Id>}
        doText="The id as the record writes it."
        dont={<Text>Control #412</Text>}
        dontText="A prose rendering of the id. It cannot be searched, and it is not what the record says."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
