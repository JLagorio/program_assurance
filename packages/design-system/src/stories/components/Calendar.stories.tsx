import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  Button,
  Calendar,
  CalendarDayButton,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components";
import { LedgerProvider } from "../../lib/locale";

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
    // The ends say which end they are; the middle days say selected.
    await expect(
      canvas.getByRole("button", { name: /September 7, 2026, Start of range/ }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: /October 9, 2026, End of range/ }),
    ).toBeVisible();
    await expect(canvas.getByRole("button", { name: /October 1, 2026, Selected/ })).toBeVisible();
    // The completed range is announced once, politely.
    await waitFor(() =>
      expect(
        canvasElement.ownerDocument.querySelector(
          '[data-slot="announcer-region"][data-politeness="polite"]',
        ),
      ).toHaveTextContent("September 7, 2026 to October 9, 2026 selected"),
    );
    // Choosing the start again leaves a one-day range, which is said as its day, not "7 to 7".
    await userEvent.click(canvas.getByRole("button", { name: /September 7, 2026/ }));
    await expect(
      canvas.getByRole("button", { name: /September 7, 2026, Start of range, End of range/ }),
    ).toBeVisible();
    await waitFor(() => {
      const lines = [
        ...canvasElement.ownerDocument.querySelectorAll(
          '[data-slot="announcer-region"][data-politeness="polite"] > *',
        ),
      ].map((line) => line.textContent);
      expect(lines).toContain("September 7, 2026 selected");
    });
  },
};
/** Two months side by side when the space holds them, stacked when it does not: above the `sm` window the months follow the calendar's own space. */
const expectMonthsFit = async (space: HTMLElement) => {
  const bounds = space.getBoundingClientRect();
  const grids = [...space.querySelectorAll<HTMLElement>('[role="grid"]')].map((grid) =>
    grid.getBoundingClientRect(),
  );
  await expect(grids).toHaveLength(2);
  const [first, second] = grids as [DOMRect, DOMRect];
  for (const grid of grids) {
    await expect(grid.left).toBeGreaterThanOrEqual(bounds.left - 0.5);
    await expect(grid.right).toBeLessThanOrEqual(bounds.right + 0.5);
  }
  const room = bounds.width >= first.width + second.width + 16;
  if (room) await expect(second.top).toBe(first.top);
  else await expect(second.top).toBeGreaterThan(first.bottom);
  return room;
};
const expectNoSidewaysScroll = async (element: HTMLElement) => {
  const doc = element.ownerDocument.documentElement;
  await expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);
};

/** A range calendar in a 320px panel on a wide screen: the second month goes under the first instead of past the panel's edge, and the days keep their 32px cells. */
export const InANarrowPanel: Story = {
  render: () => (
    <section aria-label="Narrow panel" style={{ maxWidth: 320 }}>
      <RangeDemo />
    </section>
  ),
  play: async ({ canvasElement }) => {
    const panel = within(canvasElement).getByRole("region", { name: "Narrow panel" });
    await expect(await expectMonthsFit(panel)).toBe(false);
    await expectNoSidewaysScroll(canvasElement);
    const day = within(panel).getByRole("button", { name: /October 9, 2026/ });
    await expect(day.getBoundingClientRect().width).toBeGreaterThanOrEqual(24);
    await expect(day.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
  },
};

function RangePopoverDemo() {
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(2026, 8, 7),
    to: new Date(2026, 8, 11),
  });
  return (
    // Room under the trigger for the two-month popup, so on the docs page it opens over the
    // canvas rather than the next example. The play opens it: a docs page renders it closed and
    // keeps its scroll position and focus.
    <div style={{ minHeight: 320 }}>
      <Popover>
        <PopoverTrigger render={<Button variant="secondary">Review window</Button>} />
        <PopoverContent
          aria-label="Choose the review window"
          align="start"
          className="p-0"
          style={{ width: "auto" }}
        >
          <Calendar
            mode="range"
            selected={range}
            onSelect={setRange}
            defaultMonth={new Date(2026, 8, 1)}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
/** Opens the popover from its trigger, as a reader does, and waits for it to settle. */
const openPopup = async (canvasElement: HTMLElement) => {
  const doc = canvasElement.ownerDocument;
  await userEvent.click(within(canvasElement).getByRole("button", { name: "Review window" }));
  await waitFor(() =>
    expect(doc.querySelector('[data-slot="popover-content"] [role="grid"]')).not.toBeNull(),
  );
  const popup = doc.querySelector<HTMLElement>('[data-slot="popover-content"]')!;
  await Promise.all(popup.getAnimations().map((animation) => animation.finished));
  return popup;
};
/** Escape closes the popover and returns focus to its trigger. */
const closePopup = async (canvasElement: HTMLElement) => {
  await userEvent.keyboard("{Escape}");
  const doc = canvasElement.ownerDocument;
  await waitFor(() => expect(doc.querySelector('[data-slot="popover-content"]')).toBeNull());
  await expect(within(canvasElement).getByRole("button", { name: "Review window" })).toHaveFocus();
};

/** A range in a popover sized to its content: two months side by side on a desktop. The play opens it; on the docs page, open Review window. */
export const RangeInAPopover: Story = {
  render: () => <RangePopoverDemo />,
  play: async ({ canvasElement }) => {
    const popup = await openPopup(canvasElement);
    const room = await expectMonthsFit(popup);
    if (canvasElement.ownerDocument.defaultView!.innerWidth >= 640) await expect(room).toBe(true);
    await expect(popup.getBoundingClientRect().right).toBeLessThanOrEqual(
      canvasElement.ownerDocument.documentElement.clientWidth,
    );
    await expectNoSidewaysScroll(canvasElement);
  },
};

/** The same popover on a phone: the popup keeps to the screen and the months stack in one column.
    It stays open in Storybook. Under the Vitest runner the play closes it after its checks,
    because the runner resizes the page to the next story's viewport before it unmounts this one,
    and an open popover resized across `sm` logs a ResizeObserver loop the next story reports. */
export const RangeInAPopoverOnAPhone: Story = {
  globals: { viewport: { value: "ledgerPhone", isRotated: false } },
  render: () => <RangePopoverDemo />,
  play: async ({ canvasElement }) => {
    const popup = await openPopup(canvasElement);
    await expect(await expectMonthsFit(popup)).toBe(false);
    await expect(popup.getBoundingClientRect().right).toBeLessThanOrEqual(
      canvasElement.ownerDocument.documentElement.clientWidth,
    );
    await expectNoSidewaysScroll(canvasElement);
    // The same test addon-vitest's setViewport makes before it resizes the page.
    if ((globalThis as { __vitest_browser__?: unknown }).__vitest_browser__) {
      await closePopup(canvasElement);
    }
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

/** A disabled day says why in its name (`describeDay`); the rule itself belongs in the field's hint as well. */
export const DisabledDayReasons: Story = {
  render: () => (
    <Calendar
      mode="single"
      defaultMonth={new Date(2026, 8, 1)}
      disabled={{ dayOfWeek: [0, 6] }}
      describeDay={(date, modifiers) =>
        modifiers["disabled"] && [0, 6].includes(date.getDay()) ? "Weekends are closed." : undefined
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const saturday = canvas.getByRole("button", { name: /September 19, 2026/ });
    await expect(saturday).toBeDisabled();
    await expect(saturday).toHaveAccessibleName(
      "Saturday, September 19, 2026, Weekends are closed.",
    );
    await expect(canvas.getByRole("button", { name: /September 18, 2026/ })).toBeEnabled();
  },
};

/** Under a LedgerProvider the month speaks its locale: `lang`, the first day of the week, the weekday names and the digits. German weeks start on Monday; Egyptian Arabic weeks on Saturday, right to left, in Arabic-Indic digits. Two months on one page name their navigation apart (`labels.labelNav`), or it repeats as a landmark. */
export const Localized: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-400">
      <LedgerProvider locale="de-DE">
        <section aria-label="German">
          <Calendar
            mode="single"
            defaultMonth={new Date(2026, 8, 1)}
            labels={{ labelNav: () => "Monatsnavigation" }}
          />
        </section>
      </LedgerProvider>
      <LedgerProvider locale="ar-EG" direction="rtl">
        <section aria-label="Arabic">
          <Calendar
            mode="single"
            defaultMonth={new Date(2026, 8, 1)}
            labels={{ labelNav: () => "التنقل بين الأشهر" }}
          />
        </section>
      </LedgerProvider>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const german = canvas.getByRole("region", { name: "German" });
    await expect(german.querySelector('[data-slot="calendar"]')).toHaveAttribute("lang", "de-DE");
    const germanDays = german.querySelectorAll("thead th");
    await expect(germanDays[0]).toHaveAttribute("aria-label", "Montag");
    await expect(within(german).getByRole("grid")).toHaveAccessibleName("September 2026");
    await expect(within(german).getByRole("navigation")).toHaveAccessibleName("Monatsnavigation");

    const arabic = canvas.getByRole("region", { name: "Arabic" });
    const root = arabic.querySelector('[data-slot="calendar"]');
    await expect(root).toHaveAttribute("lang", "ar-EG");
    await expect(root).toHaveAttribute("dir", "rtl");
    const arabicDays = arabic.querySelectorAll("thead th");
    await expect(arabicDays[0]).toHaveAttribute("aria-label", "السبت");
    // Arabic's short names are whole words, too wide for a 32px column: the header shows the
    // narrow form and keeps the full name as its label. German keeps its short "Mo".
    await expect([...(arabicDays[0]?.textContent ?? "")].length).toBeLessThanOrEqual(2);
    await expect(germanDays[0]).toHaveTextContent("Mo");
    await expect(within(arabic).getAllByRole("button", { name: /١٨/ }).length).toBeGreaterThan(0);
  },
};
