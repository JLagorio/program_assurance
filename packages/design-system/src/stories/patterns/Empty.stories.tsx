import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button, Table, TextLink } from "../../components";
import { Card, Empty } from "../../patterns";
import { Box, Inline, Stack, Text } from "../../primitives";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Patterns/Empty",
  component: Empty,
  parameters: { layout: "padded" },
  args: { title: "No findings" },
} satisfies Meta<typeof Empty>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Title; with a line; with the action; with a second way; in a narrow card; a search with no results. */
export const EmptyMatrix: Story = {
  render: () => (
    <Stack space="space.300" className="max-w-layout-measure">
      <Empty title="No findings" />
      <Empty title="No findings" description="Nothing on this control has been observed yet." />
      <Empty
        title="Start by linking evidence"
        description="A control is verified by what it can show."
        action={<Button size="small">Link evidence</Button>}
      />
      <Empty
        title="Start by linking evidence"
        description="A control is verified by what it can show."
        action={<Button size="small">Link evidence</Button>}
        secondary={
          <TextLink asChild={false} size="small" href="#import">
            Import from a file
          </TextLink>
        }
      />
      <Empty
        title="No controls match"
        description="Clear a filter or widen the date range."
        action={
          <Button size="small" variant="subtle">
            Clear filters
          </Button>
        }
      />
      <Box style={{ width: 320 }}>
        <Card>
          <Card.Header title="Related findings" />
          <Card.Body>
            <Empty title="No related findings" description="None link to this control yet." />
          </Card.Body>
        </Card>
      </Box>
    </Stack>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Empty
            title="Start by adding a system"
            description="A program scopes one or more systems."
            action={<Button size="small">Add a system</Button>}
          />
        }
        doText="A positive statement and the action that fills the space. Carbon: “Start by…” over “You don't have any…”."
        dont={
          <Empty
            title="You don't have any systems"
            description="There are no systems to display because none have been added to this program."
          />
        }
        dontText="The absence, twice, and no way out."
      />
      <Pair
        do={
          <Empty title="No controls match" description="Clear a filter or widen the date range." />
        }
        doText="The empty state replaces the table: no headers over nothing."
        dont={
          <Card>
            <Table label="Controls">
              <thead>
                <Table.Row>
                  <Table.Header>Id</Table.Header>
                  <Table.Header>Title</Table.Header>
                  <Table.Header>Owner</Table.Header>
                </Table.Row>
              </thead>
            </Table>
            <Card.Body>
              <Text size="small" color="color.text.subtle">
                No controls match.
              </Text>
            </Card.Body>
          </Card>
        }
        dontText="Column headers over an empty body. A screen reader hears the whole table before the line that says there is none."
      />
      <Pair
        do={
          <Inline space="space.200">
            <Box style={{ width: 240 }}>
              <Empty
                title="No findings"
                action={
                  <Button size="small" variant="subtle">
                    Record one
                  </Button>
                }
              />
            </Box>
            <Box style={{ width: 240 }}>
              <Empty
                title="No evidence"
                action={
                  <Button size="small" variant="subtle">
                    Link some
                  </Button>
                }
              />
            </Box>
          </Inline>
        }
        doText="Several empties in view take subtle buttons: one primary per page."
        dont={
          <Inline space="space.200">
            <Box style={{ width: 240 }}>
              <Empty
                title="No findings"
                action={
                  <Button size="small" variant="primary">
                    Record one
                  </Button>
                }
              />
            </Box>
            <Box style={{ width: 240 }}>
              <Empty
                title="No evidence"
                action={
                  <Button size="small" variant="primary">
                    Link some
                  </Button>
                }
              />
            </Box>
          </Inline>
        }
        dontText="A primary in every empty card. A dashboard of them is a row of blue."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
