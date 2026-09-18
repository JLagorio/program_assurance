import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Calendar, CalendarDayButton } from "../../components";

const meta = {
  title: "Components/Calendar",
  component: Calendar,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Calendar>;
export default meta;
type Story = StoryObj<typeof meta>;
function SingleDemo() {
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 8, 14));
  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      defaultMonth={new Date(2026, 8, 1)}
      disabled={{ dayOfWeek: [0, 6] }}
    />
  );
}
export const Single: Story = {
  render: () => <SingleDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const selected = canvas.getByRole("button", { name: /September 14, 2026/ });
    await expect(selected).toHaveAttribute("data-selected-single", "true");
    selected.focus();
    await userEvent.keyboard("{ArrowRight}");
    const next = canvas.getByRole("button", { name: /September 15, 2026/ });
    await waitFor(() => expect(next).toHaveFocus());
    await userEvent.keyboard("{Enter}");
    await expect(next).toHaveAttribute("data-selected-single", "true");
    await expect(selected).toHaveAttribute("data-selected-single", "false");
    await expect(canvas.getByRole("button", { name: /September 19, 2026/ })).toBeDisabled();
  },
};
function RangeDemo() {
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(2026, 8, 7),
    to: new Date(2026, 8, 11),
  });
  return (
    <Calendar
      mode="range"
      selected={range}
      onSelect={setRange}
      defaultMonth={new Date(2026, 8, 1)}
      numberOfMonths={2}
      showOutsideDays={false}
    />
  );
}
export const CalendarRange: Story = {
  render: () => <RangeDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /September 28, 2026/ }));
    await userEvent.click(canvas.getByRole("button", { name: /October 9, 2026/ }));
    await expect(canvas.getByRole("button", { name: /October 9, 2026/ })).toHaveAttribute(
      "data-range-end",
      "true",
    );
    await expect(canvas.getByRole("button", { name: /October 1, 2026/ })).toHaveAttribute(
      "data-range-middle",
      "true",
    );
  },
};
export const DropdownsAndWeekNumbers: Story = {
  render: () => (
    <Calendar
      mode="single"
      defaultMonth={new Date(2026, 8, 1)}
      startMonth={new Date(2020, 0, 1)}
      endMonth={new Date(2030, 11, 1)}
      captionLayout="dropdown"
      showWeekNumber
      components={{
        DayButton: (props) => (
          <CalendarDayButton {...props} title={`Day ${props.day.date.getDate()}`} />
        ),
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.selectOptions(canvas.getByRole("combobox", { name: "Month" }), "9");
    await expect(canvas.getByRole("button", { name: /October 14, 2026/ })).toHaveAttribute(
      "title",
      "Day 14",
    );
    await userEvent.selectOptions(canvas.getByRole("combobox", { name: "Year" }), "2027");
    await expect(canvas.getByRole("button", { name: /October 14, 2027/ })).toBeVisible();
  },
};

/** Native navigation layouts keep the controls beside their captions in either direction. */
export const NavigationLayouts: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-400">
      {(["ltr", "rtl"] as const).flatMap((dir) =>
        ([undefined, "around"] as const).map((navLayout) => (
          <section key={`${dir}-${navLayout}`} aria-label={`${dir} ${navLayout ?? "default"}`}>
            <h2 className="font-heading-xsmall">{`${dir} · ${navLayout ?? "default"}`}</h2>
            <Calendar
              mode="single"
              dir={dir}
              navLayout={navLayout}
              labels={{ labelNav: () => `${dir} ${navLayout ?? "default"} navigation` }}
              numberOfMonths={navLayout === "around" ? 2 : 1}
              defaultMonth={new Date(2026, 8, 1)}
            />
          </section>
        )),
      )}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const dir of ["ltr", "rtl"]) {
      for (const layout of ["default", "around"]) {
        const group = within(canvas.getByRole("region", { name: `${dir} ${layout}` }));
        const previous = group.getByRole("button", { name: "Previous month" });
        const next = group.getByRole("button", { name: "Next month" });
        const captions = group.getAllByRole("status");
        const first = captions[0]!.getBoundingClientRect();
        const last = captions[captions.length - 1]!.getBoundingClientRect();
        const previousBox = previous.getBoundingClientRect();
        const nextBox = next.getBoundingClientRect();
        await expect(
          Math.abs(previousBox.top + previousBox.height / 2 - first.top - first.height / 2),
        ).toBeLessThanOrEqual(2);
        await expect(
          Math.abs(nextBox.top + nextBox.height / 2 - last.top - last.height / 2),
        ).toBeLessThanOrEqual(2);
        if (dir === "rtl") {
          await expect(previousBox.left).toBeGreaterThanOrEqual(first.right);
          await expect(nextBox.right).toBeLessThanOrEqual(last.left);
        } else {
          await expect(previousBox.right).toBeLessThanOrEqual(first.left);
          await expect(nextBox.left).toBeGreaterThanOrEqual(last.right);
        }
        // DayPicker resolves the around layout's physical icon directions itself.
        const previousIcon = previous.querySelector("svg")!;
        if (layout === "around") {
          await expect(previousIcon).toHaveClass(
            dir === "rtl" ? "lucide-chevron-right" : "lucide-chevron-left",
          );
          await expect(getComputedStyle(previousIcon).rotate).toBe("none");
        }
        await userEvent.click(next);
        await expect(group.getAllByRole("status")[0]).toHaveTextContent("October 2026");
        await userEvent.click(previous);
        await expect(group.getAllByRole("status")[0]).toHaveTextContent("September 2026");
      }
    }
  },
};
