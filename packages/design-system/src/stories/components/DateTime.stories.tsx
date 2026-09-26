import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { DateLabel, DateTime, RelativeTime, TextLink } from "../../components";
import { LedgerProvider } from "../../lib/locale";
import { Stack } from "../../primitives";
import { Pair } from "../_lib/pair";

/* Every story names its zone and its now, so what it shows does not depend on the machine. */
const LosAngeles = ({ children }: { children: ReactNode }) => (
  <LedgerProvider timeZone="America/Los_Angeles">{children}</LedgerProvider>
);
const NOW = Date.parse("2026-09-25T19:00:00Z"); // Friday, Sep 25, 2026, 12:00 PM in Los Angeles

const meta = {
  title: "Components/DateTime",
  component: DateTime,
  parameters: { layout: "padded" },
  decorators: [(Story) => <LosAngeles>{Story()}</LosAngeles>],
  args: { value: "2026-09-19T00:30:00.000Z", format: "datetime" },
} satisfies Meta<typeof DateTime>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The controls. */
export const Playground: Story = {};

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-wrap items-baseline gap-100">
    <span className="font-body-small text-subtle">{label}</span>
    {children}
  </div>
);

/**
 * A day never shifts; an instant shows in the provider's zone. Each is a `<time>` with its ISO
 * value, and nothing shows Absent. The same instant reads Sep 18 in Los Angeles and Sep 19 in
 * Tokyo, which is why the product names one zone for everyone.
 */
export const Formats: Story = {
  render: () => (
    <Stack space="space.100">
      <Row label="A day">
        <DateTime value="2026-09-18" />
      </Row>
      <Row label="An instant">
        <DateTime value="2026-09-19T00:30:00.000Z" />
      </Row>
      <Row label="Its day">
        <DateTime value="2026-09-19T00:30:00.000Z" format="date" />
      </Row>
      <Row label="Its time, with the zone">
        <DateTime value="2026-09-19T00:30:00.000Z" format="time" showTimeZone />
      </Row>
      <Row label="In Tokyo">
        <LedgerProvider timeZone="Asia/Tokyo">
          <DateTime value="2026-09-19T00:30:00.000Z" format="date" />
        </LedgerProvider>
      </Row>
      <Row label="No value">
        <DateTime value={null} absentLabel="Not recorded" />
      </Row>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const times = [...canvasElement.querySelectorAll("time")];
    await expect(times.map((time) => time.textContent)).toEqual([
      "Sep 18, 2026",
      "Sep 18, 2026, 5:30 PM",
      "Sep 18, 2026",
      "5:30 PM PDT",
      "Sep 19, 2026",
    ]);
    await expect(times[0]).toHaveAttribute("datetime", "2026-09-18");
    await expect(times[1]).toHaveAttribute("datetime", "2026-09-19T00:30:00.000Z");
    await expect(within(canvasElement).getByText("Not recorded")).toBeInTheDocument();
  },
};

/**
 * The full value opens in a tooltip on hover and on keyboard focus, and is the description a
 * screen reader hears on focus. Standing alone the date takes a tab stop; inside a link the link's
 * focus opens it and the date takes none.
 */
export const FullValue: Story = {
  render: () => (
    <Stack space="space.200">
      <Row label="Updated">
        <DateTime value="2026-09-19T00:30:00.000Z" />
      </Row>
      <Row label="In a link">
        <TextLink href="#review">
          Review on <DateTime value="2026-09-18" />
        </TextLink>
      </Row>
      <div role="table" aria-label="Reviews">
        <div role="rowgroup">
          <div role="row" className="flex gap-100">
            <span role="cell">Access review</span>
            <span role="cell">
              <DateTime value="2026-09-19T00:30:00.000Z" format="date" />
            </span>
          </div>
        </div>
      </div>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const full = "Friday, September 18, 2026 at 5:30 PM Pacific Daylight Time";
    const [standalone, linked, inRow] = [...canvasElement.querySelectorAll("time")];
    await expect(standalone).toHaveAttribute("data-slot", "date-time");
    await userEvent.tab();
    await expect(standalone).toHaveFocus();
    await expect(standalone).toHaveAccessibleDescription(full);
    await waitFor(() =>
      expect(
        body.getByText(full, {
          selector: "[data-slot=tooltip-content] *, [data-slot=tooltip-content]",
        }),
      ).toBeVisible(),
    );
    await expect(linked).not.toHaveAttribute("tabindex");
    await userEvent.tab();
    await expect(canvas.getByRole("link", { name: /Review on/ })).toHaveFocus();
    await waitFor(() =>
      expect(
        body.getByText("Friday, September 18, 2026", {
          selector: "[data-slot=tooltip-content] *, [data-slot=tooltip-content]",
        }),
      ).toBeVisible(),
    );
    // A row that cannot take focus is no host: the date keeps its own tab stop and its tooltip.
    await userEvent.tab();
    await expect(inRow).toHaveFocus();
    await expect(inRow).toHaveAccessibleDescription(
      "Friday, September 18, 2026 at 5:30 PM Pacific Daylight Time",
    );
    await userEvent.tab();
  },
};

/** RelativeTime words through Intl.RelativeTimeFormat in the provider's locale, from a fixed `now` here. A day reads relative to today. */
export const Relative: Story = {
  render: () => (
    <Stack space="space.100">
      <Row label="Just now">
        <RelativeTime value={NOW - 20_000} now={NOW} />
      </Row>
      <Row label="Minutes">
        <RelativeTime value={NOW - 5 * 60_000} now={NOW} />
      </Row>
      <Row label="Hours">
        <RelativeTime value={NOW - 3 * 3_600_000} now={NOW} />
      </Row>
      <Row label="Yesterday">
        <RelativeTime value={NOW - 26 * 3_600_000} now={NOW} />
      </Row>
      <Row label="Ahead">
        <RelativeTime value={NOW + 3 * 86_400_000} now={NOW} />
      </Row>
      <Row label="A day">
        <RelativeTime value="2026-10-02" now={NOW} />
      </Row>
      <Row label="Narrow">
        <RelativeTime value={NOW - 3 * 3_600_000} now={NOW} unitStyle="narrow" />
      </Row>
      <Row label="In German">
        <LedgerProvider locale="de-DE">
          <RelativeTime value={NOW - 26 * 3_600_000} now={NOW} />
        </LedgerProvider>
      </Row>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const words = [...canvasElement.querySelectorAll("time")].map((time) => time.textContent);
    await expect(words).toEqual([
      "now",
      "5 minutes ago",
      "3 hours ago",
      "yesterday",
      "in 3 days",
      "next week",
      "3h ago",
      "gestern",
    ]);
  },
};

/** Without `now` the words follow the clock: a minute after "now" they read "1 minute ago", with no reload. */
export const Updating: Story = {
  render: () => (
    <Row label="Saved">
      <RelativeTime value={Date.now() - 59_000} />
    </Row>
  ),
  play: async ({ canvasElement }) => {
    const time = canvasElement.querySelector("time");
    await expect(time).toHaveTextContent("now");
    await waitFor(() => expect(time).toHaveTextContent("1 minute ago"), { timeout: 4000 });
  },
};

/**
 * DateLabel marks where a due date stands. Overdue, due today and due soon each carry an icon and
 * words as well as a tone, so the state never rests on colour; a completed item's date shows
 * plainly. A day is judged against the reader's today, an instant against now.
 */
export const DueDates: Story = {
  render: () => (
    <Stack space="space.100">
      <Row label="Overdue">
        <DateLabel value="2026-09-22" now={NOW} />
      </Row>
      <Row label="Today">
        <DateLabel value="2026-09-25" now={NOW} />
      </Row>
      <Row label="Soon">
        <DateLabel value="2026-09-26" now={NOW} />
      </Row>
      <Row label="Later">
        <DateLabel value="2026-10-30" now={NOW} />
      </Row>
      <Row label="Done">
        <DateLabel value="2026-09-22" now={NOW} complete />
      </Row>
      <Row label="Due at a time, passed">
        <DateLabel value="2026-09-25T18:00:00.000Z" now={NOW} />
      </Row>
      <Row label="Not set">
        <DateLabel value={null} absentLabel="No due date" />
      </Row>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const labels = [...canvasElement.querySelectorAll('[data-slot="date-label"]')];
    await expect(labels.map((label) => label.getAttribute("data-state"))).toEqual([
      "overdue",
      "today",
      "soon",
      "upcoming",
      "complete",
      "overdue",
    ]);
    // What shows; the full value the tooltip opens is a hidden description beside it.
    const shown = labels.map((label) => (label as HTMLElement).innerText.replace(/\s+/g, " "));
    await expect(shown).toEqual([
      "Sep 22, 2026 · Overdue",
      "Sep 25, 2026 · Due today",
      "Sep 26, 2026 · Due tomorrow",
      "Oct 30, 2026",
      "Sep 22, 2026",
      "Sep 25, 2026, 11:00 AM · Overdue",
    ]);
  },
};

/** The mistakes the page is written to prevent. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.300">
      <Pair
        do={<DateTime value="2026-09-19T00:30:00.000Z" />}
        doText="An instant through the provider: one zone and one format on every screen."
        dont={<span>{new Date("2026-09-19T00:30:00.000Z").toLocaleString("en-US")}</span>}
        dontText="toLocaleString in the host's zone, with seconds: the record reads another day than its register."
      />
      <Pair
        do={<DateLabel value="2026-09-22" now={NOW} />}
        doText="Overdue in words and an icon beside the date."
        dont={<span className="text-danger">Sep 22, 2026</span>}
        dontText="Overdue as red text alone. Without colour, and to a screen reader, it is an ordinary date."
      />
    </Stack>
  ),
};
