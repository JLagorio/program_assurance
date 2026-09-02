import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus } from "lucide-react";
import { useState } from "react";

import {
  Button,
  FilterChip,
  Kbd,
  SegmentedControl,
  TabStrip,
  Tabs,
  Toolbar,
} from "@/components/app/ui";
import { Spec } from "../_lib/tokens";

const tabItems = [
  { label: "Overview" },
  { label: "Findings", count: 7 },
  { label: "Evidence", count: 12 },
  { label: "History" },
];

const meta = {
  title: "Navigation/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  args: { items: tabItems, active: "Findings" },
  argTypes: {
    active: { control: "inline-radio", options: tabItems.map((t) => t.label) },
    items: { control: false },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = () => {};

/** Button-mode Tabs with neutral count chips; the active tab is the only blue. */
export const Basic: Story = { name: "Tabs" };

function Count({ n }: { n: number }) {
  return (
    <span className="tnum rounded bg-muted px-1 text-[11px] font-medium text-muted-foreground">
      {n}
    </span>
  );
}

/** TabStrip in button mode: one active, counts as trailing chips, one disabled item (no onSelect). */
export const Strip: Story = {
  name: "TabStrip",
  parameters: { controls: { disable: true } },
  render: () => (
    <TabStrip
      items={[
        { key: "overview", label: "Overview", active: true, onSelect: noop },
        { key: "findings", label: "Findings", onSelect: noop, trailing: <Count n={7} /> },
        { key: "evidence", label: "Evidence", onSelect: noop, trailing: <Count n={12} /> },
        { key: "history", label: "History", disabled: true },
      ]}
    />
  ),
};

/** Dashed when inactive, solid blue-soft when carrying a value. */
export const FilterChips: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="space-y-5">
      <div className="space-y-2">
        <Spec>inactive</Spec>
        <FilterChip label="Status" />
      </div>
      <div className="space-y-2">
        <Spec>active with value</Spec>
        <FilterChip label="Status" value="Partially satisfied" active />
      </div>
      <div className="space-y-2">
        <Spec>a filter row</Spec>
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip label="Status" value="Partially satisfied" active />
          <FilterChip label="Owner" value="D. Reyes" active />
          <FilterChip label="Family" />
          <FilterChip label="Package" />
          <FilterChip label="Evidence age" />
        </div>
      </div>
    </div>
  ),
};

type View = "table" | "matrix" | "board";

function SegmentedDemo() {
  const [view, setView] = useState<View>("table");
  return (
    <div className="flex items-center gap-4">
      <SegmentedControl
        items={[
          { value: "table", label: "Table" },
          { value: "matrix", label: "Matrix" },
          { value: "board", label: "Board" },
        ]}
        value={view}
        onChange={setView}
      />
      <Spec>value: {view}</Spec>
    </div>
  );
}

/** Stateful: click to move the raised segment. */
export const Segmented: Story = {
  parameters: { controls: { disable: true } },
  render: () => <SegmentedDemo />,
};

function ToolbarDemo() {
  const [search, setSearch] = useState("");
  return (
    <Toolbar
      search={search}
      onSearch={setSearch}
      placeholder="Search findings"
      actions={
        <Button variant="primary">
          <Plus className="size-4" />
          New finding
        </Button>
      }
    >
      <FilterChip label="Status" value="Open" active />
      <FilterChip label="Severity" />
      <FilterChip label="Owner" />
    </Toolbar>
  );
}

/** Search, chips and a primary action on one row, as an index page uses it. */
export const ToolbarRow: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="max-w-[880px]">
      <ToolbarDemo />
    </div>
  ),
};

/** Kbd inline in running text and as a ⌘K pair. */
export const Keys: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="space-y-3 text-[13px]">
      <p>
        Press <Kbd>/</Kbd> to focus search, <Kbd>Esc</Kbd> to close the preview rail.
      </p>
      <p className="flex items-center gap-2 text-muted-foreground">
        Command palette
        <span className="inline-flex items-center gap-0.5">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </span>
      </p>
    </div>
  ),
};
