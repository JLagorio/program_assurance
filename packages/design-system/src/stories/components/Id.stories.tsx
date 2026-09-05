import type { Meta, StoryObj } from "@storybook/react-vite";

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
        <TextLink>
          <a href="#f">
            <Id>FND-2231</Id>
          </a>
        </TextLink>
      </Specimens>
      <Specimens title="A hash breaks anywhere">
        <Box style={{ width: 200 }}>
          <Id className="break-all font-body-small text-subtle">
            sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
          </Id>
        </Box>
      </Specimens>
      <Specimens title="Id.List: many, none, none with a word">
        <Id.List
          ids={["AC-2", "AC-2(1)", "AC-2(3)", "AC-3", "AC-6(1)", "AC-7", "AC-11", "AC-17"]}
        />
        <Id.List ids={[]} />
        <Id.List ids={[]} empty="No controls" />
      </Specimens>
    </Stack>
  ),
};

/** In a table: the id column subtle, the name default; both tabular so the ids line up. */
export const InRows: Story = {
  render: () => (
    <div style={{ width: 520 }}>
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
