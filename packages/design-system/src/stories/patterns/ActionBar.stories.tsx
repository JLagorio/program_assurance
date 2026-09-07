import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Badge,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  Button,
  Fact,
  Tabs,
} from "../../components";
import { RecordHeader } from "../../patterns";
import { Inline, Stack } from "../../primitives";
import { ActionBar } from "../../shapes";
import { Pair } from "../_lib/pair";

const noop = () => {};

const meta = {
  title: "Shapes/ActionBar",
  component: ActionBar,
  parameters: { layout: "padded" },
  args: {
    id: "AC-2(3)",
    title: "Disable accounts",
    context: "Access control · Moderate baseline",
    states: [
      { label: "Assessment", value: "Partially satisfied", tone: "warning" },
      { label: "Evidence", value: "34d", tone: "warning" },
    ],
    actions: [
      { label: "Mark satisfied", onSelect: noop, blocked: "2 findings still open" },
      { label: "Request evidence", onSelect: noop, primary: true },
    ],
  },
} satisfies Meta<typeof ActionBar>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A primary allowed and a secondary blocked with its reason; every action blocked; the trail, a state with a control and the tab strip. */
export const ActionBarMatrix: Story = {
  // Several bars in one story mean several trails named "breadcrumb"; a page has one.
  parameters: { a11y: { config: { rules: [{ id: "landmark-unique", enabled: false }] } } },
  render: () => (
    <Stack space="space.400">
      <ActionBar
        id="AC-2(3)"
        title="Disable accounts"
        context="Access control · Moderate baseline"
        states={[
          { label: "Assessment", value: "Partially satisfied", tone: "warning" },
          { label: "Evidence", value: "34d", tone: "warning" },
        ]}
        actions={[
          { label: "Mark satisfied", onSelect: noop, blocked: "2 findings still open" },
          { label: "Request evidence", onSelect: noop, primary: true },
        ]}
      />
      <ActionBar
        id="PKG-2026-114"
        title="Authorization package"
        context="Moderate · 340 controls"
        states={[
          { label: "Lifecycle", value: "In assessment", tone: "information" },
          { label: "Findings", value: "7 open", tone: "danger" },
        ]}
        actions={[
          { label: "Submit", onSelect: noop, primary: true, blocked: "7 findings still open" },
        ]}
      />
      <ActionBar
        crumbs={
          <>
            <BreadcrumbItem>
              <BreadcrumbLink href="#programs">Programs</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#program">Atlas payments platform</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>AC controls</BreadcrumbItem>
          </>
        }
        id="AC-17"
        title="Remote access"
        context="Atlas payments platform · Dana Whitlock"
        states={[
          { label: "Implementation", value: "Implemented", tone: "success" },
          {
            label: "Owner",
            value: "Dana Whitlock",
            tone: "neutral",
            control: (
              <Button size="xsmall" variant="subtle">
                Dana Whitlock
              </Button>
            ),
          },
        ]}
        actions={[{ label: "Assess", onSelect: noop, primary: true }]}
        tabs={
          <Tabs defaultValue="Implementation" className="contents">
            <Tabs.List label="Sections">
              <Tabs.Tab value="Implementation">Implementation</Tabs.Tab>
              <Tabs.Tab value="Assessment" count={3}>
                Assessment
              </Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="Implementation" />
          </Tabs>
        }
      />
    </Stack>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  parameters: { a11y: { config: { rules: [{ id: "landmark-unique", enabled: false }] } } },
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <ActionBar
            id="PKG-2026-114"
            title="Authorization package"
            states={[{ label: "Findings", value: "7 open", tone: "danger" }]}
            actions={[
              { label: "Export", onSelect: noop },
              { label: "Submit", onSelect: noop, primary: true, blocked: "7 findings still open" },
            ]}
          />
        }
        doText="The blocked action stays, disabled, with its reason under the row. The reader sees what the rule is and what would unblock it."
        dont={
          <ActionBar
            id="PKG-2026-114"
            title="Authorization package"
            states={[{ label: "Findings", value: "7 open", tone: "danger" }]}
            actions={[{ label: "Export", onSelect: noop }]}
          />
        }
        dontText="Submit hidden because it is blocked. The reader does not know there is a Submit, or that the findings are why."
      />
      <Pair
        do={
          <ActionBar
            id="AC-2(3)"
            title="Disable accounts"
            states={[
              { label: "Assessment", value: "Partially satisfied", tone: "warning" },
              { label: "Implementation", value: "Implemented", tone: "success" },
              { label: "Evidence", value: "34d", tone: "warning" },
            ]}
          />
        }
        doText="The first state is the headline and the bar's only pill; the rest read as a dot and a word."
        dont={
          <RecordHeader
            id="AC-2(3)"
            title="Disable accounts"
            facts={
              <>
                <Fact label="Assessment">
                  <Badge variant="secondary" size="xsmall" tone="warning">
                    Partially satisfied
                  </Badge>
                </Fact>
                <Fact label="Implementation">
                  <Badge variant="secondary" size="xsmall" tone="success">
                    Implemented
                  </Badge>
                </Fact>
                <Fact label="Evidence">
                  <Badge variant="secondary" size="xsmall" tone="warning">
                    34d
                  </Badge>
                </Fact>
                <Fact label="Findings">
                  <Badge variant="secondary" size="xsmall" tone="danger">
                    2 open
                  </Badge>
                </Fact>
              </>
            }
          />
        }
        dontText="Four pills in a row. Every state shouts and none is the headline."
      />
    </Stack>
  ),
};

export const Playground: Story = {
  render: (args) => (
    <Inline>
      <ActionBar {...args} />
    </Inline>
  ),
};
