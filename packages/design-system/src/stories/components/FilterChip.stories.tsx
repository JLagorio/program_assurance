import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Button, Checkbox, FilterChip, Popover, ToggleGroup, Toolbar } from "../../components";
import { Inline, Stack } from "../../primitives";
import { Matrix as Grid } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/FilterChip",
  component: FilterChip,
  parameters: { layout: "padded" },
  args: { label: "Owner", isActive: false },
} satisfies Meta<typeof FilterChip>;
export default meta;
type Story = StoryObj<typeof meta>;

const states = ["rest", "active", "disabled"] as const;
const cols = ["toggle", "with a value", "opens a popover"] as const;

/** Every state down the side; a toggle, a chip with a value and a chip that opens a popover across. */
export const FilterChipMatrix: Story = {
  render: () => (
    <Grid
      rows={states}
      cols={cols}
      rowLabel="state"
      render={(state, col) => {
        const isActive = state === "active";
        const disabled = state === "disabled";
        if (col === "toggle")
          return <FilterChip label="Gaps" isActive={isActive} disabled={disabled} />;
        if (col === "with a value")
          return (
            <FilterChip
              label="Owner"
              value={isActive ? "Dana Whitfield" : undefined}
              isActive={isActive}
              disabled={disabled}
            />
          );
        return (
          <Popover
            width={220}
            label="Status"
            trigger={
              <FilterChip
                label="Status"
                value={isActive ? "2 chosen" : undefined}
                isActive={isActive}
                disabled={disabled}
              />
            }
          >
            <Stack space="space.075">
              <Checkbox defaultChecked={isActive}>Overdue</Checkbox>
              <Checkbox defaultChecked={isActive}>In review</Checkbox>
              <Checkbox>Verified</Checkbox>
            </Stack>
          </Popover>
        );
      }}
    />
  ),
};

const owners = ["Dana Whitfield", "Priya Natarajan", "Marcus Oyelaran"];
const statuses = ["Draft", "In review", "Verified", "Overdue"];

function ToolbarDemo() {
  const [gaps, setGaps] = useState(true);
  const [owner, setOwner] = useState<string | null>(null);
  const [chosen, setChosen] = useState<string[]>(["Overdue"]);
  const active = gaps || owner !== null || chosen.length > 0;
  const statusValue =
    chosen.length === 1 ? chosen[0] : chosen.length > 1 ? `${chosen.length} chosen` : undefined;
  return (
    <div style={{ width: 640 }}>
      <Toolbar
        search=""
        onSearch={() => {}}
        placeholder="Search controls"
        actions={
          active ? (
            <Button
              variant="link"
              size="small"
              onClick={() => {
                setGaps(false);
                setOwner(null);
                setChosen([]);
              }}
            >
              Clear filters
            </Button>
          ) : null
        }
      >
        <FilterChip label="Gaps" isActive={gaps} onClick={() => setGaps((v) => !v)} />
        <FilterChip
          label="Owner"
          value={owner ?? undefined}
          isActive={owner !== null}
          onClick={() =>
            setOwner((o) =>
              o === null ? (owners[0] ?? null) : (owners[owners.indexOf(o) + 1] ?? null),
            )
          }
        />
        <Popover
          width={220}
          label="Status"
          trigger={<FilterChip label="Status" value={statusValue} isActive={chosen.length > 0} />}
        >
          <Stack space="space.100">
            <Stack space="space.075">
              {statuses.map((s) => (
                <Checkbox
                  key={s}
                  checked={chosen.includes(s)}
                  onCheckedChange={(v) =>
                    setChosen((c) => (v === true ? [...c, s] : c.filter((x) => x !== s)))
                  }
                >
                  {s}
                </Checkbox>
              ))}
            </Stack>
            {chosen.length ? (
              <Inline alignInline="end">
                <Button variant="link" size="small" onClick={() => setChosen([])}>
                  Clear
                </Button>
              </Inline>
            ) : null}
          </Stack>
        </Popover>
      </Toolbar>
    </div>
  );
}

/** In a Toolbar: a toggle, a chip that steps through its values, and a chip that opens a popover of checkboxes. Clear filters appears when any is on. */
export const InToolbar: Story = { render: () => <ToolbarDemo /> };

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <ToggleGroup
            aria-label="Severity"
            value="high"
            onChange={() => {}}
            items={[
              { value: "all", label: "All", count: 24 },
              { value: "high", label: "High", count: 6 },
              { value: "medium", label: "Medium", count: 11 },
              { value: "low", label: "Low", count: 7 },
            ]}
          />
        }
        doText="One of a few, always one on: a ToggleGroup, its counts as Counts."
        dont={
          <Inline space="space.075">
            {["All", "High", "Medium", "Low"].map((s) => (
              <FilterChip key={s} label={s} isActive={s === "High"} />
            ))}
          </Inline>
        }
        dontText="Exclusive choices as chips. Each says pressed on its own, and nothing says only one can be."
      />
      <Pair
        do={<FilterChip label="Owner" value="Dana Whitfield" isActive />}
        doText="The value is what was chosen, as the cell shows it."
        dont={<FilterChip label="High" value="6" isActive />}
        dontText="A count as the value. Six what? The rows a filter would leave belong to a preset's Count, not the chip."
      />
      <Pair
        do={<Button size="small">Export</Button>}
        doText="A thing to do is a Button."
        dont={<FilterChip label="Export" />}
        dontText="A chip as an action. It promises to narrow the rows and does something else."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
