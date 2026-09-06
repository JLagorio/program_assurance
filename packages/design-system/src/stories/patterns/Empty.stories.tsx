import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileSearch, Link2, Search } from "lucide-react";

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

/** Title; with a line; with the action; with a second way; a search with no results, with its icon; compact in a rail card, in a panel and beside a page's body. */
export const EmptyMatrix: Story = {
  tags: ["contract"],
  render: () => (
    <Stack space="space.300" className="max-w-layout-measure">
      <Empty title="No findings" />
      <Empty
        icon={<Search />}
        title="No controls match"
        description="Clear a filter or widen the date range."
        action={
          <Button size="small" variant="link">
            Clear filters
          </Button>
        }
      />
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
          <Button size="small" variant="link">
            Clear filters
          </Button>
        }
      />
      <Inline space="space.300" alignBlock="start" shouldWrap>
        <Box style={{ width: 320 }}>
          <Card>
            <Card.Header title="Related findings" />
            <Card.Body>
              <Empty
                size="compact"
                icon={<Link2 />}
                title="Nothing linked yet"
                description="Link the findings this control answers."
                action={
                  <Button size="small" variant="link">
                    Link a finding
                  </Button>
                }
              />
            </Card.Body>
          </Card>
        </Box>
        <Box style={{ width: 320 }}>
          <Card>
            <Card.Header title="Evidence" />
            <Card.Body>
              <Empty size="compact" icon={<FileSearch />} title="No evidence yet" />
            </Card.Body>
          </Card>
        </Box>
      </Inline>
      <Card>
        <Card.Header title="Linked findings" />
        <Card.Body>
          <Empty
            size="compact"
            icon={<Link2 />}
            title="Nothing linked yet"
            description="Link the findings this control answers, and they show here with their severity."
            action={
              <Button size="small" variant="link">
                Link a finding
              </Button>
            }
          />
        </Card.Body>
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
          <Empty
            title="Start by adding a system"
            description="A program scopes one or more systems."
            action={<Button size="small">Add a system</Button>}
          />
        }
        doText="A positive statement and the action that fills the space: “Start by…” over “You don't have any…”."
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
          <Box style={{ width: 320 }}>
            <Card>
              <Card.Header title="Risks" />
              <Card.Body>
                <Empty
                  size="compact"
                  icon={<Link2 />}
                  title="Nothing linked yet"
                  action={
                    <Button size="small" variant="link">
                      Link a risk
                    </Button>
                  }
                />
              </Card.Body>
            </Card>
          </Box>
        }
        doText="Inside a card, the compact size: the mark beside a statement and the way to fill it. The card's border is the frame."
        dont={
          <Box style={{ width: 320 }}>
            <Card>
              <Card.Header title="Risks" />
              <Card.Body>
                <Text size="small" color="color.text.subtle">
                  Nothing linked yet.
                </Text>
              </Card.Body>
            </Card>
          </Box>
        }
        dontText="A line of grey text where the rows would be. It reads as a row that failed to load, and there is no way out."
      />
      <Pair
        do={
          <Inline space="space.200">
            <Box style={{ width: 240 }}>
              <Empty
                title="No findings"
                action={
                  <Button size="small" variant="link">
                    Record one
                  </Button>
                }
              />
            </Box>
            <Box style={{ width: 240 }}>
              <Empty
                title="No evidence"
                action={
                  <Button size="small" variant="link">
                    Link some
                  </Button>
                }
              />
            </Box>
          </Inline>
        }
        doText="Several empties in view take link buttons, on the text's edge: one primary per page."
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
