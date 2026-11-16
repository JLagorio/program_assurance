import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { DateLabel, EmptySeat, Person, RelativeTime } from "../../components";
import { WorkRow } from "../../patterns";

const meta = {
  title: "Patterns/WorkRow",
  component: WorkRow,
  parameters: { layout: "padded" },
  args: {
    verb: { label: "Assign owner", onAction: fn() },
    title: "11 POA&M items under Condition 1",
    link: <a href="#condition-1" />,
    meta: "WS-X90",
    reason: <EmptySeat label="No owner" />,
    when: (
      <DateLabel
        value="2026-12-17"
        now={Date.UTC(2026, 10, 16)}
        format={{ month: "short", day: "numeric" }}
      />
    ),
  },
  render: (args) => (
    <WorkRow.Group aria-label="Waiting on you">
      <WorkRow {...args} />
    </WorkRow.Group>
  ),
} satisfies Meta<typeof WorkRow>;
export default meta;
type Story = StoryObj<typeof meta>;

/** One line of open work: the verb, what it is done to, why, who it waits on and when. The verb is a button described by what it is done to, so a desk of Assign owner buttons is told apart. */
export const Playground: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole("list", { name: "Waiting on you" });
    await expect(within(list).getAllByRole("listitem")).toHaveLength(1);
    const verb = canvas.getByRole("button", { name: "Assign owner" });
    await expect(verb).toHaveAccessibleDescription("11 POA&M items under Condition 1 WS-X90");
    await userEvent.click(verb);
    await expect(args.verb.onAction).toHaveBeenCalled();
    // The name is the record's link, described by where it belongs and why it waits.
    const name = canvas.getByRole("link", { name: "11 POA&M items under Condition 1" });
    await expect(name).toHaveAttribute("href", "#condition-1");
    await expect(name).toHaveAccessibleDescription("WS-X90 No owner");
    // Nobody holds the seat: the EmptySeat says so in words.
    await expect(canvas.getByText("No owner")).toBeVisible();
  },
};

/**
 * A desk: tiers of rows ranked by when they are due, the reader's own first and what waits on
 * others last. The first row is the reader's next act, the one primary in the tray. Every row's
 * cells make columns across the tiers, whatever each row carries.
 */
export const Desk: Story = {
  render: () => (
    <WorkRow.Group aria-label="Joel Barrantes's desk">
      <WorkRow.Tier title="Late">
        <WorkRow
          isNext
          verb={{ label: "Add security outcomes", onAction: () => {} }}
          title="PDR"
          link={<a href="#pdr" />}
          meta="WS-X90"
          reason="no criteria"
          when={
            <DateLabel
              value="2026-10-12"
              now={Date.UTC(2026, 10, 16)}
              format={{ month: "short", day: "numeric" }}
            />
          }
        />
        <WorkRow
          verb={{ label: "Request extension", onAction: () => {} }}
          title="11 late POA&M items"
          link={<a href="#poam-late" />}
          meta="WS-X90"
          when={
            <DateLabel
              value="2026-09-10"
              now={Date.UTC(2026, 10, 16)}
              format={{ month: "short", day: "numeric" }}
            />
          }
        />
        <WorkRow
          verb={{ label: "Unblock scan", onAction: () => {} }}
          title="Monthly STIG compliance scan"
          link={<a href="#stig-scan" />}
          meta="WS-X90"
          reason="maintenance window slipped"
          when={
            <DateLabel
              value="2026-11-13"
              now={Date.UTC(2026, 10, 16)}
              format={{ month: "short", day: "numeric" }}
            />
          }
        />
      </WorkRow.Tier>
      <WorkRow.Tier title="Next">
        <WorkRow
          verb={{ label: "Assign owner", onAction: () => {} }}
          title="11 POA&M items under Condition 1"
          link={<a href="#condition-1" />}
          meta="WS-X90"
          reason={<EmptySeat label="No owner" />}
          when={
            <DateLabel
              value="2026-12-17"
              now={Date.UTC(2026, 10, 16)}
              format={{ month: "short", day: "numeric" }}
            />
          }
        />
        <WorkRow
          verb={{ label: "Retry import", onAction: () => {} }}
          title="Container image scan, telemetry services"
          link={<a href="#container-scan" />}
          meta="WS-X90"
          reason="SARIF validation failed Oct 30"
        />
      </WorkRow.Tier>
      <WorkRow.Tier title="Waiting on others">
        <WorkRow
          verb={{ label: "Publish results" }}
          title="Expanded control set assessment, increment 2"
          link={<a href="#increment-2" />}
          meta="WS-X90"
          waitingOn={<Person name="D. Okafor" />}
          when={
            <DateLabel
              value="2026-11-20"
              now={Date.UTC(2026, 10, 16)}
              format={{ month: "short", day: "numeric" }}
            />
          }
        />
        <WorkRow
          verb={{ label: "Approve security plan" }}
          title="Customer B"
          link={<a href="#customer-b" />}
          waitingOn={<Person name="R. Calloway" />}
          when={
            <RelativeTime
              value="2026-11-05T12:00:00Z"
              now={Date.UTC(2026, 10, 16, 12)}
              unitStyle="narrow"
            />
          }
        />
        <WorkRow
          verb={{ label: "Accept risk" }}
          title="Unattended console sessions"
          link={<a href="#console-sessions" />}
          meta="Atlas"
          waitingOn={<EmptySeat label="No authorizing official" />}
        />
      </WorkRow.Tier>
    </WorkRow.Group>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("group", { name: "Joel Barrantes's desk" })).toBeVisible();
    // Each tier is a heading and the list it names.
    for (const [tier, rows] of [
      ["Late", 3],
      ["Next", 2],
      ["Waiting on others", 3],
    ] as const) {
      await expect(canvas.getByRole("heading", { name: tier })).toBeVisible();
      const list = canvas.getByRole("list", { name: tier });
      await expect(within(list).getAllByRole("listitem")).toHaveLength(rows);
    }
    // The next act is the one primary, at 36px; the rest are small secondaries.
    const next = canvas.getByRole("button", { name: "Add security outcomes" });
    await expect(next).toHaveAttribute("data-button-variant", "primary");
    await expect(Math.round(next.getBoundingClientRect().height)).toBe(36);
    await expect(
      canvas.getAllByRole("button").filter((b) => b.dataset["buttonVariant"] === "primary"),
    ).toHaveLength(1);
    await expect(canvas.getByRole("button", { name: "Retry import" })).toHaveAttribute(
      "data-button-variant",
      "secondary",
    );
    // Work that waits on someone else leads with their verb as words, not a button.
    await expect(canvas.queryByRole("button", { name: "Publish results" })).toBeNull();
    await expect(canvas.getByText("Publish results")).toBeVisible();
    // The names make one column across every tier, whatever each row carries.
    const starts = canvas
      .getAllByRole("link")
      .map((link) => Math.round(link.getBoundingClientRect().left));
    await expect(new Set(starts).size).toBe(1);
    // Nobody holds a seat: said in words, in the who column.
    await expect(canvas.getByText("No authorizing official")).toBeVisible();
  },
};

/**
 * A program's next fixes: one list with no tiers, each verb a link to where the fix is made. A
 * verb that goes somewhere is `link`; one done on the page is `onAction`.
 */
export const NextFixes: Story = {
  name: "Next fixes",
  render: () => (
    <WorkRow.Group aria-label="Next fixes">
      <WorkRow
        verb={{ label: "Add evidence", link: <a href="#req-052" /> }}
        title="REQ-052"
        link={<a href="#req-052-record" />}
        meta="PL-2"
        reason="moves 38 objectives"
      />
      <WorkRow
        verb={{ label: "Add evidence", link: <a href="#req-372" /> }}
        title="REQ-372"
        link={<a href="#req-372-record" />}
        meta="MA-1"
        reason="moves 17 objectives"
      />
      <WorkRow
        verb={{ label: "Add to assessment", link: <a href="#ir-8" /> }}
        title="IR-8"
        link={<a href="#ir-8-record" />}
        reason="moves 17 objectives"
      />
    </WorkRow.Group>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole("list", { name: "Next fixes" });
    await expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    // A verb that goes somewhere is a link drawn as a button, described by its record.
    const verbs = canvas.getAllByRole("link", { name: "Add evidence" });
    await expect(verbs[0]).toHaveAttribute("href", "#req-052");
    await expect(verbs[0]).toHaveAccessibleDescription("REQ-052 PL-2");
    await expect(canvas.queryByRole("button")).toBeNull();
  },
};

const longTitle = "Expanded control set assessment of the ground segment, increment 2";

/** At a phone's width every row stays one line: each cell narrower than its words cuts them with an ellipsis and shows them whole on hover, and on keyboard focus of the link or button they sit in. The when keeps its words. */
export const OneLine: Story = {
  name: "One line",
  render: () => (
    <div style={{ width: 340, maxWidth: "100%" }}>
      <WorkRow.Group aria-label="Waiting on you">
        <WorkRow
          isNext
          verb={{ label: "Add security outcomes", onAction: () => {} }}
          title="Preliminary design review"
          link={<a href="#pdr" />}
          meta="WS-X90"
          reason="no criteria recorded for the gate"
          when={
            <RelativeTime
              value="2026-11-15T12:00:00Z"
              now={Date.UTC(2026, 10, 16, 12)}
              unitStyle="narrow"
            />
          }
        />
        <WorkRow
          verb={{ label: "Request extension", onAction: () => {} }}
          title={longTitle}
          link={<a href="#increment-2" />}
          meta="WS-X90"
          reason="maintenance window slipped"
          waitingOn={<Person name="Hana Lindqvist" />}
          when={
            <RelativeTime
              value="2026-11-13T12:00:00Z"
              now={Date.UTC(2026, 10, 16, 12)}
              unitStyle="narrow"
            />
          }
        />
      </WorkRow.Group>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // One line a row: no row is taller than its verb's control and the row's padding.
    for (const row of canvas.getAllByRole("listitem")) {
      const control = row.querySelector<HTMLElement>('[data-slot="work-row-verb"] > *')!;
      await expect(row.getBoundingClientRect().height).toBeLessThanOrEqual(
        control.getBoundingClientRect().height + 25,
      );
      for (const cut of row.querySelectorAll<HTMLElement>('[data-slot="truncate"]')) {
        const line = parseFloat(getComputedStyle(cut).lineHeight);
        await expect(cut.getBoundingClientRect().height).toBeLessThanOrEqual(line + 1);
      }
    }
    // The name is cut, and its whole text is there: read by a screen reader, shown on focus.
    const name = canvas.getByRole("link", { name: longTitle });
    const text = name.querySelector<HTMLElement>('[data-slot="truncate"]')!;
    await expect(text.scrollWidth).toBeGreaterThan(text.clientWidth);
    const revealed = () =>
      waitFor(() => {
        const popup = document.querySelector<HTMLElement>('[data-slot="truncate-full-text"]');
        expect(popup).not.toBeNull();
        return popup!;
      });
    name.focus();
    await expect(name).toHaveFocus();
    await expect(await revealed()).toHaveTextContent(longTitle);
    name.blur();
    await waitFor(() =>
      expect(document.querySelector('[data-slot="truncate-full-text"]')).toBeNull(),
    );
    // A cut reason shows whole under the pointer.
    const reason = canvas.getByText("maintenance window slipped");
    await expect(reason.scrollWidth).toBeGreaterThan(reason.clientWidth);
    await userEvent.hover(reason);
    await expect(await revealed()).toHaveTextContent("maintenance window slipped");
    await userEvent.unhover(reason);
    // The page never scrolls sideways.
    const frame = canvasElement.ownerDocument.documentElement;
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
  },
};
