import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button, KeyValue, Table } from "../../components";
import { Card, Section } from "../../patterns";
import { Box, Stack, Text } from "../../primitives";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Patterns/Card",
  component: Card,
  parameters: { layout: "padded" },
  args: {
    children: (
      <Card.Body>
        <Text>Plain card</Text>
      </Card.Body>
    ),
  },
} satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Plain with a body; with a header; with a description and an action; a table drawing its own edges. */
export const CardMatrix: Story = {
  render: () => (
    <Stack space="space.200" className="w-layout-list">
      <Card>
        <Card.Body>
          <Text>Plain card</Text>
        </Card.Body>
      </Card>
      <Card>
        <Card.Header title="With a header" />
        <Card.Body>
          <Text size="small" color="color.text.subtle">
            Body
          </Text>
        </Card.Body>
      </Card>
      <Card>
        <Card.Header
          title="Description and action"
          description="Derived from the live matrix."
          action={
            <Button size="small" variant="subtle">
              Edit
            </Button>
          }
        />
        <Card.Body>
          <KeyValue label="Owner">Dana Whitfield</KeyValue>
          <KeyValue label="Baseline">NIST SP 800-53 Rev. 5</KeyValue>
        </Card.Body>
      </Card>
      <Card>
        <Card.Header title="Controls" description="3 of 287" />
        <Table label="Controls">
          <thead>
            <Table.Row>
              <Table.Header>Id</Table.Header>
              <Table.Header>Title</Table.Header>
            </Table.Row>
          </thead>
          <tbody>
            <Table.Row>
              <Table.Cell>AC-2</Table.Cell>
              <Table.Cell>Account management</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>AC-3</Table.Cell>
              <Table.Cell>Access enforcement</Table.Cell>
            </Table.Row>
          </tbody>
        </Table>
      </Card>
    </Stack>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Card>
            <Card.Header title="Evidence" description="3 items" />
            <Card.Body>
              <Text size="small" color="color.text.subtle">
                Body
              </Text>
            </Card.Body>
          </Card>
        }
        doText="One frame: the card, its header, its body."
        dont={
          <Card>
            <Card.Header title="Evidence" />
            <Card.Body>
              <Card>
                <Card.Body>
                  <Text size="small" color="color.text.subtle">
                    Body
                  </Text>
                </Card.Body>
              </Card>
            </Card.Body>
          </Card>
        }
        dontText="A card in a card. Two frames and two shadows say nothing the one did not."
      />
      <Pair
        do={
          <Section title="Objective">
            <Text as="p" size="small" color="color.text.subtle" className="pt-150">
              Payables are approved and paid by different people.
            </Text>
          </Section>
        }
        doText="A region of the page is a Section: a heading and a rule, on the page's own surface."
        dont={
          <Card>
            <Card.Header title="Objective" />
            <Card.Body>
              <Text size="small" color="color.text.subtle">
                Payables are approved and paid by different people.
              </Text>
            </Card.Body>
          </Card>
        }
        dontText="A paragraph in a card. Framed, it reads as a thing among things; a page of framed regions is a wall of boxes."
      />
      <Pair
        do={
          <Card>
            <Card.Body>
              <Text>Body on the standard inset</Text>
            </Card.Body>
          </Card>
        }
        doText="Card.Body sets the inset once, space.200 all round."
        dont={
          <Card>
            <Box paddingInline="space.300" paddingBlock="space.100">
              <Text>Body on its own inset</Text>
            </Box>
          </Card>
        }
        dontText="A hand-padded body. Every card then has its own inset, and a page of them does not line up."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
