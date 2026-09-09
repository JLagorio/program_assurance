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
