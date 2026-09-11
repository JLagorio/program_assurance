import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { Toolbar } from "../..";
import {
  Button,
  Checkbox,
  Count,
  FilterChip,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ToggleGroup,
  ToggleGroupItem,
} from "../../components";
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
          <Popover>
            <PopoverTrigger
              disabled={disabled}
              render={
                <FilterChip
                  label="Status"
                  value={isActive ? "2 chosen" : undefined}
                  isActive={isActive}
                  disabled={disabled}
                />
              }
            />
            <PopoverContent style={{ width: 220 }} aria-label="Status">
              <Stack space="space.075">
                <label className="inline-flex items-center gap-100">
                  <Checkbox defaultChecked={isActive} />
                  Overdue
                </label>
                <label className="inline-flex items-center gap-100">
                  <Checkbox defaultChecked={isActive} />
                  In review
                </label>
                <label className="inline-flex items-center gap-100">
                  <Checkbox />
                  Verified
                </label>
              </Stack>
            </PopoverContent>
          </Popover>
        );
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const disabled = canvas
      .getAllByRole("button")
      .filter((button) => button.hasAttribute("disabled"));
    await expect(disabled).toHaveLength(3);
    for (const button of disabled) {
      await expect(button).toBeDisabled();
      button.focus();
      await expect(button).not.toHaveFocus();
    }
    await expect(within(canvasElement.ownerDocument.body).queryByRole("dialog")).toBeNull();
  },
};

const owners = ["Dana Whitfield", "Priya Natarajan", "Marcus Oyelaran"];
const statuses = ["Draft", "In review", "Verified", "Overdue"];
const toolbarRefs = {
  toggle: createRef<HTMLButtonElement>(),
  chip: createRef<HTMLButtonElement>(),
  trigger: createRef<HTMLButtonElement>(),
};
const toolbarCalls = { chip: fn(), trigger: fn() };

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
        filters={
          <>
            <FilterChip
              ref={toolbarRefs.toggle}
              label="Gaps"
              isActive={gaps}
              onClick={() => setGaps((v) => !v)}
            />
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
            <Popover>
              <PopoverTrigger
                ref={toolbarRefs.trigger}
                onClick={toolbarCalls.trigger}
                render={
                  <FilterChip
                    ref={toolbarRefs.chip}
                    label="Status"
                    value={statusValue}
                    isActive={chosen.length > 0}
                    onClick={toolbarCalls.chip}
                  />
                }
              />
              <PopoverContent style={{ width: 220 }} aria-label="Status">
                <Stack space="space.100">
                  <Stack space="space.075">
                    {statuses.map((s) => (
                      <label key={s} className="inline-flex items-center gap-100">
                        <Checkbox
                          checked={chosen.includes(s)}
                          onCheckedChange={(v) =>
                            setChosen((c) => (v ? [...c, s] : c.filter((x) => x !== s)))
                          }
                        />
                        {s}
                      </label>
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
              </PopoverContent>
            </Popover>
          </>
        }
      ></Toolbar>
    </div>
  );
}

/** In a Toolbar: a toggle, a chip that steps through its values, and a chip that opens a popover of checkboxes. Clear filters appears when any is on. */
export const InToolbar: Story = {
  render: () => <ToolbarDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const gaps = canvas.getByRole("button", { name: "Gaps" });
    const status = canvas.getByRole("button", { name: "Status Overdue" });
    toolbarCalls.chip.mockClear();
    toolbarCalls.trigger.mockClear();

    await expect(toolbarRefs.toggle.current).toBe(gaps);
    await expect(toolbarRefs.chip.current).toBe(status);
    await expect(toolbarRefs.trigger.current).toBe(status);
    await expect(gaps).toHaveAttribute("type", "button");
    await expect(gaps).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(gaps);
    await expect(gaps).toHaveAttribute("aria-pressed", "false");
    await userEvent.keyboard(" ");
    await expect(gaps).toHaveAttribute("aria-pressed", "true");
    await userEvent.keyboard("{Enter}");
    await expect(gaps).toHaveAttribute("aria-pressed", "false");

    await userEvent.tab(); // Owner.
    await userEvent.tab();
    await expect(status).toHaveFocus();
    await expect(status).toHaveAttribute("aria-expanded", "false");
    await expect(status).not.toHaveAttribute("aria-pressed");
    await userEvent.keyboard("{Enter}");
    const popup = await body.findByRole("dialog", { name: "Status" });
    await expect(status).toHaveAttribute("aria-expanded", "true");
    const draft = within(popup).getByRole("checkbox", { name: "Draft" });
    await waitFor(() => expect(draft).toHaveFocus());
    await userEvent.keyboard(" ");
    await expect(draft).toBeChecked();
    await expect(status).toHaveTextContent("Status2 chosen");
    await expect(status).not.toHaveAttribute("aria-pressed");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(status).toHaveFocus());
    await expect(status).toHaveAttribute("aria-expanded", "false");

    await userEvent.keyboard(" ");
    const reopened = await body.findByRole("dialog", { name: "Status" });
    await expect(within(reopened).getByRole("checkbox", { name: "Draft" })).toBeChecked();
    await userEvent.click(within(reopened).getByRole("button", { name: "Clear" }));
    await expect(status).toHaveTextContent("Status");
    await expect(status).not.toHaveTextContent("chosen");
    await expect(status).not.toHaveAttribute("aria-pressed");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(status).toHaveFocus());
    await expect(toolbarCalls.chip).toHaveBeenCalledTimes(2);
    await expect(toolbarCalls.trigger).toHaveBeenCalledTimes(2);
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <ToggleGroup aria-label="Severity" defaultValue={["high"]}>
            <ToggleGroupItem value="all">
              All <Count value={24} />
            </ToggleGroupItem>
            <ToggleGroupItem value="high">
              High <Count value={6} />
            </ToggleGroupItem>
            <ToggleGroupItem value="medium">
              Medium <Count value={11} />
            </ToggleGroupItem>
            <ToggleGroupItem value="low">
              Low <Count value={7} />
            </ToggleGroupItem>
          </ToggleGroup>
        }
        doText="A ToggleGroup coordinates exclusive choices; Count displays the totals."
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
