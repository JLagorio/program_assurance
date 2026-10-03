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
  RadioGroup,
  RadioGroupItem,
  ToggleGroup,
  ToggleGroupItem,
} from "../../components";
import { Inline, Stack } from "../../primitives";
import * as storyLayout from "../_lib/matrix";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Matrix: Grid } = storyLayout;
const { Pair } = pairLayout;

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
  tags: ["!manifest"],
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
    <div style={{ maxWidth: 640 }}>
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
            <Popover>
              <PopoverTrigger
                render={
                  <FilterChip label="Owner" value={owner ?? undefined} isActive={owner !== null} />
                }
              />
              <PopoverContent style={{ width: 220 }} aria-label="Owner">
                <Stack space="space.100">
                  <RadioGroup
                    aria-label="Owner"
                    value={owner ?? ""}
                    onValueChange={(value) => setOwner(typeof value === "string" ? value : null)}
                  >
                    {owners.map((o) => (
                      <label key={o} className="inline-flex items-center gap-100">
                        <RadioGroupItem value={o} />
                        {o}
                      </label>
                    ))}
                  </RadioGroup>
                  {owner ? (
                    <Inline alignInline="end">
                      <Button variant="link" size="small" onClick={() => setOwner(null)}>
                        Clear
                      </Button>
                    </Inline>
                  ) : null}
                </Stack>
              </PopoverContent>
            </Popover>
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

export const Playground: Story = {};

/** In a Toolbar: a yes-or-no toggle, and two chips that open a popover, one to choose an owner and one to choose statuses. The value shows on the chip; a chip that opens a popover says expanded, never pressed. Clear filters appears when any is on. On a phone or in a panel the chips fold into More. */
export const InToolbar: Story = {
  render: () => <ToolbarDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    if (!canvas.queryByRole("button", { name: "Gaps" })) {
      // Too narrow for the chips: they wait in More, where each still works and Escape returns.
      const more = canvas.getByRole("button", { name: /^More filters/ });
      await userEvent.click(more);
      const folded = await body.findByRole("dialog", { name: "Filters" });
      const gaps = within(folded).getByRole("button", { name: "Gaps" });
      const status = within(folded).getByRole("button", { name: "Status Overdue" });
      await waitFor(() => expect(gaps).toBeVisible());
      await waitFor(() => expect(status).toBeVisible());
      await expect(toolbarRefs.toggle.current).toBe(gaps);
      await expect(gaps).toHaveAttribute("aria-pressed", "true");
      await userEvent.click(gaps);
      await expect(gaps).toHaveAttribute("aria-pressed", "false");
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
      await waitFor(() => expect(more).toHaveFocus());
      return;
    }
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

    // Owner opens a popover of names: it says expanded, not pressed, and shows the one chosen.
    await userEvent.tab();
    const owner = canvas.getByRole("button", { name: "Owner" });
    await expect(owner).toHaveFocus();
    await expect(owner).toHaveAttribute("aria-expanded", "false");
    await expect(owner).not.toHaveAttribute("aria-pressed");
    await expect(owner).toHaveAttribute("data-slot", "filter-chip");
    await userEvent.keyboard("{Enter}");
    const owners = await body.findByRole("dialog", { name: "Owner" });
    await userEvent.click(within(owners).getByRole("radio", { name: "Priya Natarajan" }));
    await expect(owner).toHaveAccessibleName("Owner Priya Natarajan");
    await expect(owner).not.toHaveAttribute("aria-pressed");
    await userEvent.click(within(owners).getByRole("button", { name: "Clear" }));
    await expect(owner).toHaveAccessibleName("Owner");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(owner).toHaveFocus());

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

const longOwner = "Priya Natarajan-Oyelaran, Dana Whitfield";

/** In a 320px frame, a panel or a phone: every chip stays one line, no chip shrinks below its label, and a long value truncates with its full text as the title and in the chip's name. */
export const Narrow: Story = {
  name: "In a 320px frame",
  globals: { viewport: { value: "ledgerSmall", isRotated: false } },
  render: () => (
    <div data-testid="frame" style={{ maxWidth: 320 }}>
      <Inline space="space.075" shouldWrap>
        <FilterChip label="Status filter" value="In review" isActive />
        <FilterChip label="Owner" value={longOwner} isActive />
        <FilterChip label="Gaps" />
        <FilterChip label="Hide closed" />
      </Inline>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument.documentElement;
    await expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);
    const frame = canvas.getByTestId("frame").getBoundingClientRect();
    const chips = canvas.getAllByRole("button");
    await expect(chips).toHaveLength(4);
    const oneLine = chips[2]!.getBoundingClientRect().height;
    for (const chip of chips) {
      const box = chip.getBoundingClientRect();
      // One line: the text never spills out of the pill's height, and the pill stays in the frame.
      await expect(chip.scrollHeight).toBeLessThanOrEqual(chip.clientHeight);
      await expect(box.height).toBe(oneLine);
      await expect(box.right).toBeLessThanOrEqual(frame.right + 0.5);
      const label = chip.querySelector<HTMLElement>('[data-slot="filter-chip-label"]')!;
      await expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth);
    }
    await expect(canvas.getByRole("button", { name: "Status filter In review" })).toBeVisible();
    const owner = canvas.getByRole("button", { name: `Owner ${longOwner}` });
    const value = owner.querySelector<HTMLElement>('[data-slot="filter-chip-value"]')!;
    await expect(value.scrollWidth).toBeGreaterThan(value.clientWidth);
    await expect(value).toHaveAttribute("title", longOwner);
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  tags: ["!manifest"],
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
          <Inline space="space.075" rowSpace="space.075" shouldWrap>
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
