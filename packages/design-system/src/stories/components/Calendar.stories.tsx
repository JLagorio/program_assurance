import type { Meta, StoryObj } from "@storybook/react-vite";
import { useId, useState } from "react";
import type { DateRange } from "react-day-picker";

import { FieldLabel, FieldSet, FieldLegend, Calendar, DatePicker, Field } from "../../components";
import { Inline, Stack } from "../../primitives";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Calendar",
  component: Calendar,
  parameters: { layout: "padded" },
  args: { mode: "single", defaultMonth: new Date(2026, 8, 1) },
} satisfies Meta<typeof Calendar>;
export default meta;
type Story = StoryObj<typeof meta>;

/** One day, a range, and a month with the days before a date disabled. */
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

/** A range across two months: click a start, then an end. The days between paint the selection colour. */
export const CalendarRange: Story = { render: () => <Range /> };

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  // Independent calendar examples repeat the library navigation landmark.
  parameters: { a11y: { config: { rules: [{ id: "landmark-unique", enabled: false }] } } },
  render: function FieldExample() {
    const fieldId = useId();
    return (
      <Stack space="space.400">
        <Pair
          do={
            <div style={{ width: 220 }}>
              <Field>
                <FieldLabel
                  id={`${fieldId}-scheduled-completion-1-label`}
                  htmlFor={`${fieldId}-scheduled-completion-1`}
                >
                  {"Scheduled completion"}
                </FieldLabel>
                <DatePicker
                  id={`${fieldId}-scheduled-completion-1`}
                  aria-labelledby={`${fieldId}-scheduled-completion-1-label`}
                  defaultValue="2026-09-18"
                />
              </Field>
            </div>
          }
          doText="One day in a form is a DatePicker; the month opens when asked."
          dont={
            <div style={{ width: 300 }}>
              <FieldSet aria-labelledby={`${fieldId}-scheduled-completion-2-label`}>
                <FieldLegend id={`${fieldId}-scheduled-completion-2-label`} variant="label">
                  {"Scheduled completion"}
                </FieldLegend>
                <Calendar
                  aria-labelledby={`${fieldId}-scheduled-completion-2-label`}
                  mode="single"
                  selected={new Date(2026, 8, 18)}
                  defaultMonth={new Date(2026, 8, 1)}
                />
              </FieldSet>
            </div>
          }
          dontText="A month grid inline for one field. It takes the room of six."
        />
        <Pair
          do={
            <Calendar
              mode="range"
              selected={{ from: new Date(2026, 8, 28), to: new Date(2026, 9, 9) }}
              defaultMonth={new Date(2026, 8, 1)}
              numberOfMonths={2}
            />
          }
          doText="Two months for a range that may cross one."
          dont={
            <Calendar
              mode="single"
              selected={new Date(2026, 8, 18)}
              defaultMonth={new Date(2026, 8, 1)}
              numberOfMonths={2}
            />
          }
          dontText="Two months for one day. The second month is noise."
        />
      </Stack>
    );
  },
};

export const Playground: Story = {};
