import type { Meta, StoryObj } from "@storybook/react-vite";
import { Calendar, Columns3, List, Table2 } from "lucide-react";
import { useState } from "react";

import { Button, ButtonGroup, Switch, ToggleGroup } from "../../components";
import { Box, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/ToggleGroup",
  component: ToggleGroup,
  parameters: { layout: "padded" },
  args: {
    "aria-label": "Scope",
    value: "open",
    onChange: () => {},
    items: [
      { value: "all", label: "All" },
      { value: "open", label: "Open" },
      { value: "settled", label: "Settled" },
    ],
  },
} satisfies Meta<typeof ToggleGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

const views = [
  { value: "table", label: "Table", icon: <Table2 /> },
  { value: "board", label: "Board", icon: <Columns3 /> },
  { value: "list", label: "List", icon: <List /> },
  { value: "calendar", label: "Calendar", icon: <Calendar />, disabled: true },
];

/** Both sizes: words, words with icons, icons alone with their tooltips, counts, and a disabled item. */
export const ToggleGroupMatrix: Story = {
  render: () => (
    <Stack space="space.400">
      {(["small", "medium"] as const).map((size) => (
        <Specimens key={size} title={`${size}: words · with icons · icons alone · with counts`}>
          <ToggleGroup
            size={size}
            aria-label="Scope"
            value="open"
            onChange={() => {}}
            items={[
              { value: "all", label: "All" },
              { value: "open", label: "Open" },
              { value: "settled", label: "Settled", disabled: true },
            ]}
          />
          <ToggleGroup
            size={size}
            aria-label="View"
            value="table"
            onChange={() => {}}
            items={views}
          />
          <ToggleGroup
            size={size}
            aria-label="View"
            value="board"
            onChange={() => {}}
            items={views.map((v) => ({ ...v, isIconOnly: true }))}
          />
          <ToggleGroup
            size={size}
            aria-label="Requirements"
            value="all"
            onChange={() => {}}
            items={[
              { value: "all", label: "All", count: 372 },
              { value: "unallocated", label: "Unallocated", count: 14 },
              { value: "verified", label: "Verified", count: 0 },
            ]}
          />
        </Specimens>
      ))}
    </Stack>
  ),
};

function Views() {
  const [view, setView] = useState("table");
  return (
    <Stack space="space.200">
      <ToggleGroup aria-label="View" value={view} onChange={setView} items={views} />
      <Box
        padding="space.300"
        className="rounded-medium border border-default"
        style={{ minHeight: 96 }}
      >
        <Text color="color.text.subtle">
          The register as a {view}. The same rows, laid out another way.
        </Text>
      </Box>
    </Stack>
  );
}

/** The group over what it controls: the view changes, the rows do not. */
export const ViewsStory: Story = { name: "Views", render: () => <Views /> };

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={<ToggleGroup aria-label="View" value="table" onChange={() => {}} items={views} />}
        doText="One of several views of the same rows; exactly one on."
        dont={
          <ButtonGroup>
            <Button size="small" isSelected>
              Table
            </Button>
            <Button size="small">Board</Button>
            <Button size="small">List</Button>
          </ButtonGroup>
        }
        dontText="Selected buttons in a ButtonGroup. Buttons act; a choice among views is this group, and its on state says so."
      />
      <Pair
        do={<Switch>Show archived</Switch>}
        doText="Two answers, on or off, are a Switch."
        dont={
          <ToggleGroup
            aria-label="Archived"
            value="hide"
            onChange={() => {}}
            items={[
              { value: "show", label: "Show archived" },
              { value: "hide", label: "Hide archived" },
            ]}
          />
        }
        dontText="A binary as two segments. A switcher is views, not a yes or no."
      />
      <Pair
        do={
          <ToggleGroup
            aria-label="Period"
            value="week"
            onChange={() => {}}
            items={[
              { value: "day", label: "Day" },
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
            ]}
          />
        }
        doText="Nouns of a word or two: what the reader will see."
        dont={
          <ToggleGroup
            aria-label="Period"
            value="week"
            onChange={() => {}}
            items={[
              { value: "day", label: "Show me today's events only" },
              { value: "week", label: "Show the whole week" },
              { value: "month", label: "Switch to the month view" },
            ]}
          />
        }
        dontText="Sentences and verbs. They read as actions, and the group grows past the toolbar."
      />
      <Pair
        do={
          <ToggleGroup
            aria-label="Scope"
            value="open"
            onChange={() => {}}
            items={[
              { value: "all", label: "All" },
              { value: "open", label: "Open" },
            ]}
          />
        }
        doText="Sorting the same rows: all of them, or the open ones."
        dont={
          <ToggleGroup
            aria-label="Section"
            value="overview"
            onChange={() => {}}
            items={[
              { value: "overview", label: "Overview" },
              { value: "controls", label: "Controls" },
              { value: "evidence", label: "Evidence" },
            ]}
          />
        }
        dontText="Sections of a record as segments. Distinct content is Tabs; a segment shows the same content another way."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
