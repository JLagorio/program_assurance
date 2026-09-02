import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

import { Calendar } from "@/ds/primitives";
import { Card } from "@/ds/patterns";
import { Spec } from "../_lib/tokens";

const meta = {
  title: "Primitives/Calendar",
  component: Calendar,
  tags: ["autodocs"],
  args: {},
  argTypes: { className: { control: false }, classNames: { control: false } },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

const today = new Date(2026, 8, 2);

function SingleDemo() {
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 8, 14));
  return (
    <Card className="inline-block">
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        defaultMonth={today}
        today={today}
      />
    </Card>
  );
}

/** Single selection, with today in weight 600 and outside days muted. */
export const Single: Story = {
  render: () => <SingleDemo />,
};

function RangeDemo() {
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(2026, 8, 7),
    to: new Date(2026, 8, 18),
  });
  return (
    <div className="space-y-2">
      <Card className="inline-block">
        <Calendar
          mode="range"
          selected={range}
          onSelect={setRange}
          defaultMonth={today}
          today={today}
        />
      </Card>
      <Spec>assessment window · Sep 7 – Sep 18</Spec>
    </div>
  );
}

/** A range: the ends in blue, the middle on the soft blue. */
export const Range: Story = {
  render: () => <RangeDemo />,
};

/** Weekends disabled, two months side by side. */
export const TwoMonths: Story = {
  render: () => (
    <Card className="inline-block">
      <Calendar
        mode="single"
        numberOfMonths={2}
        defaultMonth={today}
        today={today}
        disabled={{ dayOfWeek: [0, 6] }}
      />
    </Card>
  ),
};
