import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

import { Calendar } from "../../components";
import { Inline } from "../../primitives";

const meta = {
  title: "Components/Calendar",
  component: Calendar,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Calendar>;
export default meta;
type Story = StoryObj<typeof meta>;

function Range() {
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
    />
  );
}

export const CalendarRange: Story = { render: () => <Range /> };

/** Single and range selections, days before today disabled. */
export const CalendarMatrix: Story = {
  parameters: {
    // Three calendars, three "Navigation bar" navs from react-day-picker; a page has one. A false positive of the layout.
    a11y: { config: { rules: [{ id: "landmark-unique", enabled: false }] } },
  },
  render: () => (
    <Inline space="space.300" alignBlock="start" shouldWrap>
      <Calendar
        mode="single"
        selected={new Date(2026, 8, 14)}
        defaultMonth={new Date(2026, 8, 1)}
      />
      <Calendar
        mode="range"
        selected={{ from: new Date(2026, 8, 7), to: new Date(2026, 8, 18) }}
        defaultMonth={new Date(2026, 8, 1)}
      />
      <Calendar
        mode="single"
        disabled={{ before: new Date(2026, 8, 10) }}
        defaultMonth={new Date(2026, 8, 1)}
      />
    </Inline>
  ),
};
