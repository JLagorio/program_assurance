import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Diff, diffText } from "../../components";
import { LedgerProvider } from "../../mode";
import { Box, Inline as Row, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Diff",
  component: Diff,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Diff>;
export default meta;
type Story = StoryObj<typeof meta>;

const version3 = `Access to the payments system is granted by the system owner.
Access requests are recorded in the ticketing system.
Requests include the business reason and the end date.
Shared accounts are not permitted.
Privileged access requires a second approver.
Accounts are reviewed quarterly, and access that is no longer needed is removed.
Temporary access expires automatically.
Service accounts have a named owner.
Passwords follow the password standard.
Default passwords are changed before a system goes live.
Administrators use a separate account for administration.
Access badges are returned on the last day of work.
Remote sessions lock after fifteen minutes of inactivity.
Access logs are kept for one year.
Access logs are reviewed weekly.
Multi-factor authentication is required for remote access.
Emergency access is logged and reviewed within one business day.
Vendors sign the acceptable use policy before access is granted.
Exceptions are approved by the security lead.`;

const now = `Access to the payments system is granted by the system owner.
Access requests are recorded in the ticketing system.
Requests include the business reason and the end date.
Shared accounts are not permitted.
Privileged access requires a second approver.
Accounts are reviewed monthly, and access that is no longer needed is removed within five days.
Temporary access expires automatically.
Service accounts have a named owner.
Passwords follow the password standard.
Default passwords are changed before a system goes live.
Administrators use a separate account for administration.
Access badges are returned on the last day of work.
Remote sessions lock after fifteen minutes of inactivity.
Access logs are kept for one year.
Access logs are reviewed weekly.
Multi-factor authentication is required for all access.
Emergency access is logged and reviewed within one business day.
Exceptions are approved by the security lead and reviewed every year.
Access for contractors ends with their contract.`;

const lines = (root: HTMLElement, kind: string) =>
  Array.from(root.querySelectorAll<HTMLElement>(`[data-slot="diff-line"][data-kind="${kind}"]`));

/** Two versions of a narrative, inline: each edited paragraph's earlier version above its later one, the changed words struck through and underlined, the unchanged paragraphs folded behind a button. */
export const Inline: Story = {
  args: { before: version3, after: now, beforeLabel: "Version 3", afterLabel: "Now" },
  render: (args) => <Diff {...args} className="max-w-layout-measure" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const diff = canvas.getByRole("group", { name: "Changes from Version 3 to Now" });
    await expect(diff).toHaveAttribute("data-slot", "diff");
    await expect(diff).toHaveAttribute("data-layout", "inline");
    // The summary counts rows: an edited paragraph is one change, not one removal and one addition.
    await expect(within(diff).getByText("3 changed, 1 added, 1 removed")).toBeVisible();
    await expect(diff).toHaveTextContent(
      "Removed lines are from Version 3; added lines are from Now.",
    );

    // More than colour: a marker, a visually hidden word and a decoration on every change.
    const removed = lines(diff, "delete");
    const added = lines(diff, "insert");
    await expect(removed).toHaveLength(4);
    await expect(added).toHaveLength(4);
    for (const line of removed) {
      await expect(line.querySelector('[aria-hidden="true"]')).toHaveTextContent("−");
      await expect(line.querySelector(".sr-only")).toHaveTextContent("Removed:");
    }
    for (const line of added) {
      await expect(line.querySelector('[aria-hidden="true"]')).toHaveTextContent("+");
      await expect(line.querySelector(".sr-only")).toHaveTextContent("Added:");
    }
    const deletion = within(diff).getByText("quarterly");
    const insertion = within(diff).getByText("monthly");
    await expect(deletion.tagName).toBe("DEL");
    await expect(insertion.tagName).toBe("INS");
    await expect(getComputedStyle(deletion).textDecorationLine).toContain("line-through");
    await expect(getComputedStyle(insertion).textDecorationLine).toContain("underline");
    // The space between two changed words joins them into one change.
    await expect(within(diff).getByText("remote")).toHaveProperty("tagName", "DEL");
    await expect(within(diff).getByText(/within five days/)).toHaveProperty("tagName", "INS");
    // Inline, the earlier version of an edited paragraph comes first, then the later one.
    const edited = removed[0]!;
    await expect(edited.nextElementSibling).toBe(added[0]);
    // A paragraph rewritten from scratch, and a paragraph added or removed, has no word marks.
    await expect(removed[2]!.querySelector("del")).toBeNull();
    await expect(removed[2]).toHaveTextContent("Vendors sign the acceptable use policy");

    // Unchanged runs fold, three paragraphs of context kept on each side of a change.
    const folds = within(diff).getAllByRole("button", { name: /^Show \d+ unchanged lines$/ });
    await expect(folds.map((b) => b.textContent)).toEqual([
      "Show 2 unchanged lines",
      "Show 3 unchanged lines",
    ]);
    const first = folds[0]!;
    await expect(first).toHaveAttribute("aria-expanded", "false");
    const panel = first
      .closest('[data-slot="diff-fold"]')!
      .querySelector<HTMLElement>('[data-slot="collapsible-content"]')!;
    // Hidden until found: the browser's find-in-page reaches the folded lines and opens them.
    await expect(panel).toHaveAttribute("hidden", "until-found");
    const folded = within(diff).getByText(
      "Access to the payments system is granted by the system owner.",
    );
    await expect(folded).not.toBeVisible();

    // The keyboard opens a fold; focus stays on its button, which now hides the lines again.
    await userEvent.tab();
    await expect(first).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(first).toHaveAttribute("aria-expanded", "true"));
    await expect(first).toHaveAccessibleName("Hide 2 unchanged lines");
    await expect(first).toHaveAttribute("aria-controls", panel.id);
    await expect(first).toHaveFocus();
    await waitFor(() => expect(folded).toBeVisible());
    await userEvent.keyboard(" ");
    await waitFor(() => expect(first).toHaveAttribute("aria-expanded", "false"));
    await expect(first).toHaveFocus();
    await userEvent.tab();
    await expect(folds[1]).toHaveFocus();

    // Find-in-page: the browser fires beforematch on a hidden-until-found panel it matched, and
    // the fold opens without moving focus.
    const second = folds[1]!;
    const secondPanel = second
      .closest('[data-slot="diff-fold"]')!
      .querySelector<HTMLElement>('[data-slot="collapsible-content"]')!;
    secondPanel.dispatchEvent(new Event("beforematch", { bubbles: true }));
    await waitFor(() => expect(second).toHaveAttribute("aria-expanded", "true"));
    await expect(
      within(secondPanel).getByText("Administrators use a separate account for administration."),
    ).toBeVisible();
    await expect(second).toHaveFocus();
  },
};

/** The earlier text beside the later, row for row, with each side's line numbers. An unchanged line's second copy is hidden from a screen reader, which reads it once. */
export const SideBySide: Story = {
  args: {
    before: version3,
    after: now,
    beforeLabel: "Version 3",
    afterLabel: "Now",
    layout: "side-by-side",
    lineNumbers: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const diff = canvas.getByRole("group", { name: "Changes from Version 3 to Now" });
    await expect(diff).toHaveAttribute("data-layout", "side-by-side");
    const edited = within(diff)
      .getByText("quarterly")
      .closest<HTMLElement>('[data-slot="diff-row"]')!;
    const [earlier, later] = Array.from(edited.children) as HTMLElement[];
    await expect(earlier).toHaveAttribute("data-kind", "delete");
    await expect(later).toHaveAttribute("data-kind", "insert");
    // The line numbers are each side's own, and a screen reader skips them.
    await expect(earlier!.querySelector('[aria-hidden="true"]')).toHaveTextContent("6");
    const unchanged = within(diff)
      .getAllByText("Temporary access expires automatically.")
      .map((text) => text.closest<HTMLElement>('[data-slot="diff-line"]')!);
    await expect(unchanged).toHaveLength(2);
    await expect(unchanged[1]).toHaveAttribute("aria-hidden", "true");
    const a = earlier!.getBoundingClientRect();
    const b = later!.getBoundingClientRect();
    if (diff.clientWidth >= 576) {
      // Wide enough for two columns: the halves share a row.
      await expect(Math.round(a.top)).toBe(Math.round(b.top));
      await expect(b.left).toBeGreaterThan(a.left);
    } else {
      // Narrower than 36rem of its own: the halves stack and it reads as the inline view.
      await expect(b.top).toBeGreaterThanOrEqual(a.bottom - 1);
      await expect(unchanged[1]!.checkVisibility()).toBe(false);
    }
  },
};

/** Side by side in a 320px panel: the Diff measures its own width, not the window's, and below 36rem it reads as the inline view. The second copies of unchanged lines and the empty halves go. */
export const InANarrowContainer: Story = {
  args: {
    before: version3,
    after: now,
    beforeLabel: "Version 3",
    afterLabel: "Now",
    layout: "side-by-side",
  },
  render: (args) => (
    <Box style={{ maxWidth: 320 }}>
      <Diff {...args} />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const diff = canvas.getByRole("group", { name: "Changes from Version 3 to Now" });
    await expect(diff.clientWidth).toBeLessThanOrEqual(320);
    for (const empty of diff.querySelectorAll<HTMLElement>('[data-slot="diff-empty"]'))
      await expect(empty.checkVisibility()).toBe(false);
    const copies = within(diff)
      .getAllByText("Temporary access expires automatically.")
      .map((text) => text.closest<HTMLElement>('[data-slot="diff-line"]')!);
    await expect(copies[0]!.checkVisibility()).toBe(true);
    await expect(copies[1]!.checkVisibility()).toBe(false);
    const edited = within(diff)
      .getByText("quarterly")
      .closest<HTMLElement>('[data-slot="diff-row"]')!;
    const [earlier, later] = Array.from(edited.children) as HTMLElement[];
    await expect(later!.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      earlier!.getBoundingClientRect().bottom - 1,
    );
    await expect(Math.round(later!.getBoundingClientRect().width)).toBe(
      Math.round(earlier!.getBoundingClientRect().width),
    );
    await expect(diff.scrollWidth).toBeLessThanOrEqual(diff.clientWidth);
  },
};

const sameText = `Scope: payments system.
Owner: finance operations.
Review: quarterly.`;

/** The states: no differences (the text folded behind one button), a new text, a removed text, and a paragraph rewritten from scratch, which is marked as a whole line with no word marks. */
export const States: Story = {
  args: { before: "", after: "" },
  render: () => (
    <Stack space="space.400" className="max-w-layout-measure">
      <Specimens title="No differences">
        <Box style={{ width: 480, maxWidth: "100%" }}>
          <Diff before={sameText} after={sameText} label="Unchanged scope" />
        </Box>
      </Specimens>
      <Specimens title="A new text">
        <Box style={{ width: 480, maxWidth: "100%" }}>
          <Diff before="" after={sameText} label="New scope" />
        </Box>
      </Specimens>
      <Specimens title="A removed text">
        <Box style={{ width: 480, maxWidth: "100%" }}>
          <Diff before={sameText} after="" label="Removed scope" />
        </Box>
      </Specimens>
      <Specimens title="Rewritten: whole lines, no word marks">
        <Box style={{ width: 480, maxWidth: "100%" }}>
          <Diff
            before="Evidence is kept by each team in its own folder."
            after="All evidence goes to the shared repository within a week of collection."
            label="Rewritten statement"
          />
        </Box>
      </Specimens>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const same = canvas.getByRole("group", { name: "Unchanged scope" });
    await expect(within(same).getByText("No differences")).toBeVisible();
    await expect(
      within(same).getByRole("button", { name: "Show 3 unchanged lines" }),
    ).toHaveAttribute("aria-expanded", "false");

    const added = canvas.getByRole("group", { name: "New scope" });
    await expect(within(added).getByText("3 added")).toBeVisible();
    await expect(lines(added, "insert")).toHaveLength(3);
    await expect(added.querySelectorAll("ins")).toHaveLength(0);

    const removed = canvas.getByRole("group", { name: "Removed scope" });
    await expect(within(removed).getByText("3 removed")).toBeVisible();
    await expect(lines(removed, "delete")).toHaveLength(3);

    const rewritten = canvas.getByRole("group", { name: "Rewritten statement" });
    await expect(within(rewritten).getByText("1 changed")).toBeVisible();
    await expect(rewritten.querySelectorAll("ins, del")).toHaveLength(0);
    await expect(lines(rewritten, "delete")[0]).toHaveTextContent("Removed:");
  },
};

const hashBefore =
  "Evidence bundle: https://evidence.example.com/bundles/2026/access-review/quarterly/final/evidence-bundle-2026-q3-approved-by-owner.pdf sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08";
const hashAfter =
  "Evidence bundle: https://evidence.example.com/bundles/2026/access-review/monthly/final/evidence-bundle-2026-09-approved-by-owner.pdf sha256:2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae";

/** A link and a hash with no spaces wrap at the Diff's edge instead of widening it; nothing scrolls sideways in a 320px frame. */
export const LongUnbrokenText: Story = {
  args: { before: hashBefore, after: hashAfter, label: "Evidence link" },
  render: (args) => (
    <Box style={{ maxWidth: 320 }}>
      <Diff {...args} />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const diff = canvas.getByRole("group", { name: "Evidence link" });
    await expect(diff.scrollWidth).toBeLessThanOrEqual(diff.clientWidth);
    for (const text of diff.querySelectorAll<HTMLElement>('[data-slot="diff-text"]')) {
      await expect(getComputedStyle(text).overflowWrap).toBe("anywhere");
      await expect(text.getBoundingClientRect().right).toBeLessThanOrEqual(
        diff.getBoundingClientRect().right,
      );
    }
    await expect(diff.querySelectorAll("ins").length).toBeGreaterThan(0);
  },
};

const paragraphsBefore = "Scope\n\nOwner\n\nReview";
const paragraphsAfter = "Scope\n\nOwner: finance\n\n\nReview";

/** Paragraphs separated by blank lines: a blank line keeps a full line's height, and a blank line added or removed is marked like any other. */
export const BlankLines: Story = {
  args: { before: paragraphsBefore, after: paragraphsAfter, label: "Paragraphs with blank lines" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const diff = canvas.getByRole("group", { name: "Paragraphs with blank lines" });
    const rows = Array.from(diff.querySelectorAll<HTMLElement>('[data-slot="diff-line"]'));
    const height = (row: HTMLElement) => Math.round(row.getBoundingClientRect().height);
    const scope = rows.find((row) => row.textContent?.endsWith("Scope"))!;
    const blank = rows.filter((row) => row.dataset["kind"] === "equal" && !row.textContent?.trim());
    await expect(blank.length).toBeGreaterThan(0);
    for (const row of blank) await expect(height(row)).toBe(height(scope));
    const added = lines(diff, "insert").filter((row) => !row.textContent?.includes("Owner"));
    await expect(added).toHaveLength(1);
    await expect(added[0]!.querySelector('[aria-hidden="true"]')).toHaveTextContent("+");
    await expect(added[0]!.querySelector(".sr-only")).toHaveTextContent("Added:");
    await expect(height(added[0]!)).toBe(height(scope));
  },
};

/** Right to left: the gutter, the marker and the earlier column sit at the start, which is the right. Each line of prose takes its direction from its own text, so a Latin statement keeps its full stop at its end; code always reads left to right, so a brace never mirrors. */
export const RightToLeft: Story = {
  args: { before: "", after: "" },
  render: () => (
    <LedgerProvider direction="rtl">
      <Stack space="space.300">
        <Diff
          before="Accounts are reviewed quarterly."
          after="Accounts are reviewed monthly."
          beforeLabel="Version 3"
          afterLabel="Now"
          layout="side-by-side"
          lineNumbers
          label="Review frequency, right to left"
        />
        <Diff
          before={'{\n  "review": "quarterly"\n}'}
          after={'{\n  "review": "monthly"\n}'}
          code
          context={Infinity}
          label="Configuration, right to left"
        />
      </Stack>
    </LedgerProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const diff = canvas.getByRole("group", { name: "Review frequency, right to left" });
    await expect(getComputedStyle(diff).direction).toBe("rtl");
    const rect = (el: Element) => el.getBoundingClientRect();
    const [earlier, later] = lines(diff, "delete").concat(lines(diff, "insert"));
    for (const line of [earlier!, later!]) {
      const [number, marker] = Array.from(line.querySelectorAll('[aria-hidden="true"]'));
      const text = line.querySelector('[data-slot="diff-text"]')!;
      // Start is the right: the line number, then the marker, then the text.
      await expect(rect(number!).left).toBeGreaterThanOrEqual(rect(marker!).right - 1);
      await expect(rect(marker!).left).toBeGreaterThanOrEqual(rect(text).right - 1);
    }
    if (diff.clientWidth >= 576)
      await expect(rect(earlier!).left).toBeGreaterThan(rect(later!).left);
    else await expect(rect(later!).top).toBeGreaterThanOrEqual(rect(earlier!).bottom - 1);
    const summary = within(diff).getByText("1 changed");
    const caption = within(diff).getByText("Now");
    await expect(rect(summary).left).toBeLessThan(rect(caption).left);
    await expect(diff.scrollWidth).toBeLessThanOrEqual(diff.clientWidth);

    // Prose: the Latin line reads left to right inside the right-to-left page, full stop last.
    const glyph = (node: Node, index: number) => {
      const range = document.createRange();
      range.setStart(node, index);
      range.setEnd(node, index + 1);
      return range.getBoundingClientRect();
    };
    const words = Array.from(
      within(earlier!).getByText("quarterly").parentElement!.childNodes,
    ).filter((child) => child.nodeType === Node.TEXT_NODE && child.textContent);
    const [start, stop] = [words[0]!, words[words.length - 1]!];
    await expect(stop.textContent).toBe(".");
    await expect(glyph(stop, 0).left).toBeGreaterThan(glyph(start, 0).left);

    // Code: every line is left to right, its first character at the text's left edge.
    const config = canvas.getByRole("group", { name: "Configuration, right to left" });
    const brace = within(config).getAllByText("{")[0]!;
    const text = brace.closest<HTMLElement>('[data-slot="diff-text"]')!;
    await expect(brace).toHaveAttribute("dir", "ltr");
    const node = Array.from(brace.childNodes).find((child) => child.textContent === "{")!;
    await expect(Math.round(glyph(node, 0).left)).toBe(Math.round(rect(brace).left));
    // The line keeps its end padding at the frame's edge, which on this page is the left.
    await expect(rect(brace).left).toBeGreaterThanOrEqual(rect(text).left + 8);
  },
};

/** Beside other content in a flex row, the Diff takes the row's free width. It measures itself for the side-by-side fallback, so its own lines do not size it; it fills the width it is given. */
export const BesideOtherContent: Story = {
  args: { before: "", after: "" },
  render: () => (
    <Row space="space.200" alignBlock="start" data-testid="row">
      <Diff
        before="Accounts are reviewed quarterly."
        after="Accounts are reviewed monthly."
        beforeLabel="Library"
        afterLabel="This program"
        label="Review frequency beside its note"
      />
      <Text size="small" color="color.text.subtle">
        Tailored on 12 September.
      </Text>
    </Row>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = canvas.getByTestId("row");
    const diff = canvas.getByRole("group", { name: "Review frequency beside its note" });
    await expect(diff.getBoundingClientRect().width).toBeGreaterThanOrEqual(
      row.getBoundingClientRect().width / 2,
    );
    await expect(within(diff).getByText("monthly")).toBeVisible();
    await expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth);
  },
};

const configBefore = `{
  "system": "payments",
  "review": "quarterly",
  "owner": "finance-operations",
  "approver": "security-lead",
  "retentionDays": 365,
  "logReviewDays": 7,
  "mfa": "remote",
  "sessionTimeoutMinutes": 15
}`;
const configAfter = `{
  "system": "payments",
  "review": "monthly",
  "owner": "finance-operations",
  "approver": "security-lead",
  "retentionDays": 365,
  "logReviewDays": 7,
  "mfa": "all",
  "sessionTimeoutMinutes": 15
}`;

/** Source in the code face with line numbers from both versions, one line of context. */
export const Code: Story = {
  args: {
    before: configBefore,
    after: configAfter,
    code: true,
    lineNumbers: true,
    context: 1,
    beforeLabel: "Published",
    afterLabel: "Draft",
  },
  render: (args) => <Diff {...args} className="max-w-layout-measure" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const diff = canvas.getByRole("group", { name: "Changes from Published to Draft" });
    await expect(diff).toHaveClass("font-code");
    await expect(within(diff).getByText("2 changed")).toBeVisible();
    // One fold between the two changes: four unchanged lines, one kept on each side.
    await expect(within(diff).getAllByRole("button", { name: /unchanged line/ })).toHaveLength(1);
    const edit = lines(diff, "delete")[0]!;
    const numbers = edit.querySelectorAll('[aria-hidden="true"]');
    await expect(numbers[0]).toHaveTextContent("3");
    await expect(numbers[1]).toHaveTextContent("");
    await expect(edit).toHaveTextContent('"review": "quarterly"');
    await expect(within(edit).getByText("quarterly").tagName).toBe("DEL");
  },
};

/** Every word comes from the locale's messages, and the counts from its number and list formats. Here in German. */
export const Localized: Story = {
  args: { before: version3, after: now },
  render: (args) => (
    <LedgerProvider
      locale="de-DE"
      messages={{
        diffLabel: "Änderungen von {before} zu {after}",
        diffBefore: "Vorher",
        diffAfter: "Nachher",
        diffLegend: "Entfernte Zeilen stammen aus {before}; hinzugefügte aus {after}.",
        diffChangedCount: "{count} geändert",
        diffAddedCount: "{count} hinzugefügt",
        diffRemovedCount: "{count} entfernt",
        diffAdded: "Hinzugefügt:",
        diffRemoved: "Entfernt:",
        diffShowLinesOne: "{count} unveränderte Zeile anzeigen",
        diffShowLinesOther: "{count} unveränderte Zeilen anzeigen",
        diffHideLinesOne: "{count} unveränderte Zeile ausblenden",
        diffHideLinesOther: "{count} unveränderte Zeilen ausblenden",
      }}
    >
      <Diff {...args} className="max-w-layout-measure" />
    </LedgerProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const diff = canvas.getByRole("group", { name: "Änderungen von Vorher zu Nachher" });
    await expect(within(diff).getByText("3 geändert, 1 hinzugefügt und 1 entfernt")).toBeVisible();
    await expect(lines(diff, "delete")[0]!.querySelector(".sr-only")).toHaveTextContent(
      "Entfernt:",
    );
    const fold = within(diff).getByRole("button", { name: "2 unveränderte Zeilen anzeigen" });
    await userEvent.click(fold);
    await expect(fold).toHaveAccessibleName("2 unveränderte Zeilen ausblenden");
  },
};

/** `diffText` is the comparison without the view: the rows and the counts, for a section's count or a decision whether to show the Diff at all. */
export const Counts: Story = {
  args: { before: version3, after: now },
  render: (args) => {
    const result = diffText(args.before, args.after);
    return (
      <Text size="small" color="color.text.subtle" data-testid="counts">
        {`${result.changed} changed · ${result.added} added · ${result.removed} removed · ${result.unchanged} unchanged · ${result.rows.length} rows`}
      </Text>
    );
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByTestId("counts")).toHaveTextContent(
      "3 changed · 1 added · 1 removed · 15 unchanged · 20 rows",
    );
  },
};

/** Do show what changed; don't make the reader find it in two full copies. */
export const Dont: Story = {
  args: { before: "", after: "" },
  render: () => (
    <Pair
      do={
        <Diff
          before="Accounts are reviewed quarterly."
          after="Accounts are reviewed monthly."
          beforeLabel="Version 3"
          afterLabel="Now"
          label="Review frequency, compared"
        />
      }
      doText="A Diff marks the one word that changed, in more than colour."
      dont={
        <Stack space="space.100">
          <Text size="small">Version 3: Accounts are reviewed quarterly.</Text>
          <Text size="small">Now: Accounts are reviewed monthly.</Text>
        </Stack>
      }
      dontText="Two full copies leave the reader to spot the change."
    />
  ),
  play: async ({ canvasElement }) => {
    const diff = within(canvasElement).getByRole("group", { name: "Review frequency, compared" });
    await expect(within(diff).getByText("monthly").tagName).toBe("INS");
  },
};

export const Playground: Story = {
  args: {
    before: version3,
    after: now,
    layout: "inline",
    beforeLabel: "Version 3",
    afterLabel: "Now",
    context: 3,
    lineNumbers: false,
    code: false,
  },
  argTypes: {
    layout: { control: "inline-radio", options: ["inline", "side-by-side"] },
  },
};
