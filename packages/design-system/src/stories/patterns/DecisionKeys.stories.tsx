import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { Button, Field, FieldLabel, Item, Textarea } from "../../components";
import { FootBar } from "../../layout";
import { CommandScope, DecisionKeys, type DecisionKeyOption } from "../../patterns";
import { Stack } from "../../primitives";

const meta = {
  title: "Patterns/DecisionKeys",
  component: DecisionKeys,
  parameters: { layout: "padded" },
  args: {
    "aria-label": "Determination",
    options: [
      { value: "satisfied", shortcut: "S", label: "Satisfied", tone: "success" },
      { value: "partial", shortcut: "P", label: "Partially satisfied", tone: "warning" },
      { value: "other", shortcut: "O", label: "Other than satisfied", tone: "danger" },
      { value: "not-assessed", shortcut: "N", label: "Not assessed", tone: "neutral" },
    ],
    onValueChange: fn(),
  },
  render: (args) => (
    <div style={{ maxWidth: 360 }}>
      <DecisionKeys {...args} />
    </div>
  ),
} satisfies Meta<typeof DecisionKeys>;
export default meta;
type Story = StoryObj<typeof meta>;

/** What the polite live regions hold now, one entry a line. */
const politeLines = (canvasElement: HTMLElement) =>
  [
    ...canvasElement.ownerDocument.querySelectorAll(
      '[data-slot="announcer-region"][data-politeness="polite"] > div',
    ),
  ].map((line) => line.textContent ?? "");

/** A determination chosen from cards that are keys. Each card is a radio named by its answer, and its key chooses it: S, P, O, N. Outside a workspace the keys answer while focus is on the cards. */
export const Playground: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const changed = args.onValueChange as ReturnType<typeof fn>;
    changed.mockClear();
    const group = canvas.getByRole("radiogroup", { name: "Determination" });
    const cards = within(group).getAllByRole("radio");
    await expect(cards.map((card) => card.getAttribute("aria-keyshortcuts"))).toEqual([
      "S",
      "P",
      "O",
      "N",
    ]);
    // The key is drawn on the card and its mark paints the answer; both are decoration.
    const satisfied = canvas.getByRole("radio", { name: "Satisfied" });
    await expect(satisfied.querySelector("kbd")).toHaveTextContent("S");
    await expect(satisfied.querySelector("kbd")).toHaveAttribute("aria-hidden", "true");
    await expect(satisfied.querySelector('[data-slot="decision-key-mark"]')).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    // One Tab stop; the key chooses its card.
    await userEvent.tab();
    await expect(cards[0]).toHaveFocus();
    await userEvent.keyboard("o");
    await expect(canvas.getByRole("radio", { name: "Other than satisfied" })).toBeChecked();
    await expect(changed).toHaveBeenLastCalledWith("other", expect.anything());
    // Capitals are the same key; a key held with a modifier is another shortcut.
    await userEvent.keyboard("N");
    await expect(canvas.getByRole("radio", { name: "Not assessed" })).toBeChecked();
    await userEvent.keyboard("{Control>}s{/Control}");
    await expect(canvas.getByRole("radio", { name: "Not assessed" })).toBeChecked();
    await userEvent.keyboard("{Shift>}s{/Shift}");
    await expect(canvas.getByRole("radio", { name: "Not assessed" })).toBeChecked();
    // A press chooses as the key does.
    await userEvent.click(canvas.getByRole("radio", { name: "Partially satisfied" }));
    await expect(changed).toHaveBeenLastCalledWith("partial", expect.anything());
  },
};

const determinations: DecisionKeyOption[] = [
  { value: "satisfied", shortcut: "S", label: "Satisfied", tone: "success" },
  { value: "partial", shortcut: "P", label: "Partially satisfied", tone: "warning" },
  { value: "other", shortcut: "O", label: "Other than satisfied", tone: "danger" },
  { value: "not-assessed", shortcut: "N", label: "Not assessed", tone: "neutral" },
];

const objectives = ["IA-02(01)", "IA-02(02)", "IA-02(12)"];

/** A workspace in brief: the objectives to judge, the finding's text, the keys and the foot bar, in one CommandScope. */
function Bench() {
  const [open, setOpen] = useState(objectives[0]!);
  const [judged, setJudged] = useState<Record<string, string>>({});
  const recorded = objectives.filter((objective) => judged[objective]).length;
  return (
    <Stack space="space.200">
      <CommandScope commands={[]} aria-label="Assessment workspace">
        <Stack space="space.200">
          <Item.Group aria-label="Objectives" size="compact">
            {objectives.map((objective) => (
              <Item
                key={objective}
                title={objective}
                meta={judged[objective]}
                isActive={objective === open}
                onSelect={() => setOpen(objective)}
              />
            ))}
          </Item.Group>
          <Field>
            <FieldLabel>Finding</FieldLabel>
            <Textarea />
          </Field>
          <DecisionKeys
            aria-label="Determination"
            options={determinations}
            value={judged[open] ?? ""}
            onValueChange={(value) => setJudged((all) => ({ ...all, [open]: value }))}
          />
          <FootBar
            summary={`${recorded} of ${objectives.length} recorded`}
            actions={
              <Button
                variant="primary"
                size="large"
                disabledReason={
                  recorded < objectives.length ? "Every objective needs a determination." : ""
                }
              >
                Send to lead
              </Button>
            }
          />
        </Stack>
      </CommandScope>
      <Button>Outside the workspace</Button>
    </Stack>
  );
}

/**
 * In a workspace the keys answer from anywhere in it, the nearest CommandScope: here from the
 * list of objectives, so the reader judges without leaving the list, and hears what the key chose.
 * Typed into the finding, the same key is a letter. Outside the workspace it does nothing.
 */
export const InAWorkspace: Story = {
  name: "In a workspace",
  tags: ["!manifest"],
  render: () => <Bench />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = canvas.getByRole("button", { name: "IA-02(01)" });
    row.focus();
    await userEvent.keyboard("o");
    const other = canvas.getByRole("radio", { name: "Other than satisfied" });
    await expect(other).toBeChecked();
    // Focus stays where the reader is, and the choice is said.
    await expect(row).toHaveFocus();
    await waitFor(() =>
      expect(politeLines(canvasElement)).toContain("Other than satisfied chosen"),
    );
    // The foot bar's count moves and is said.
    await expect(canvas.getByText("1 of 3 recorded")).toBeVisible();
    await waitFor(() => expect(politeLines(canvasElement)).toContain("1 of 3 recorded"));
    // In a text field the key is the field's: the letter is typed and nothing is chosen.
    const finding = canvas.getByRole("textbox", { name: "Finding" });
    await userEvent.click(finding);
    await userEvent.keyboard("s");
    await expect(finding).toHaveValue("s");
    await expect(canvas.getByRole("radio", { name: "Satisfied" })).not.toBeChecked();
    await expect(other).toBeChecked();
    // Outside the workspace the key does nothing.
    canvas.getByRole("button", { name: "Outside the workspace" }).focus();
    await userEvent.keyboard("s");
    await expect(canvas.getByRole("radio", { name: "Satisfied" })).not.toBeChecked();
    // The next objective takes its own answer.
    await userEvent.click(canvas.getByRole("button", { name: "IA-02(02)" }));
    await userEvent.keyboard("s");
    await expect(canvas.getByRole("radio", { name: "Satisfied" })).toBeChecked();
    await expect(canvas.getByText("2 of 3 recorded")).toBeVisible();
  },
};

/** On a heading the answer also judges the objectives under it: each card says how many, and its name says so. */
export const OnAHeading: Story = {
  name: "On a heading",
  args: { covers: 6 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const satisfied = canvas.getByRole("radio", { name: "Satisfied and 6 under it" });
    await expect(satisfied).toHaveTextContent("+6");
    await expect(canvas.getAllByRole("radio")).toHaveLength(4);
  },
};

/** Read-only for a reader who may not judge: the answer shows in its tone, the cards keep their Tab stop, and the keys sleep. */
export const Locked: Story = {
  args: { readOnly: true, defaultValue: "other" },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const changed = args.onValueChange as ReturnType<typeof fn>;
    changed.mockClear();
    const other = canvas.getByRole("radio", { name: "Other than satisfied" });
    await expect(other).toBeChecked();
    await userEvent.tab();
    await expect(other).toHaveFocus();
    await userEvent.keyboard("s");
    await expect(other).toBeChecked();
    await userEvent.click(canvas.getByRole("radio", { name: "Satisfied" }));
    await expect(other).toBeChecked();
    await expect(changed).not.toHaveBeenCalled();
  },
};

/** Two answers for evidence, three for a decision. An answer with no tone has no mark and is chosen in the neutral fill. The cards stand in one row where they fit, two a row where four do not, and one a row in less. */
export const OtherDecisions: Story = {
  name: "Other decisions",
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.300">
      <div style={{ maxWidth: 360 }}>
        <DecisionKeys
          aria-label="Review"
          defaultValue="changes"
          options={[
            { value: "accept", shortcut: "A", label: "Accept", tone: "success" },
            { value: "changes", shortcut: "R", label: "Request changes", tone: "warning" },
          ]}
        />
      </div>
      <div style={{ maxWidth: 720 }}>
        <DecisionKeys
          aria-label="Decision"
          defaultValue="conditions"
          options={[
            { value: "approve", shortcut: "A", label: "Approve" },
            { value: "conditions", shortcut: "C", label: "Approve with conditions" },
            { value: "return", shortcut: "R", label: "Return" },
          ]}
        />
      </div>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const review = canvas.getByRole("radiogroup", { name: "Review" });
    await expect(within(review).getByRole("radio", { name: "Request changes" })).toBeChecked();
    const decision = canvas.getByRole("radiogroup", { name: "Decision" });
    const conditions = within(decision).getByRole("radio", { name: "Approve with conditions" });
    await expect(conditions).toBeChecked();
    await expect(conditions.querySelector('[data-slot="decision-key-mark"]')).toBeNull();
    // Each group answers its own keys while focus is on it: R in the decision returns.
    conditions.focus();
    await userEvent.keyboard("r");
    await expect(within(decision).getByRole("radio", { name: "Return" })).toBeChecked();
    await expect(within(review).getByRole("radio", { name: "Request changes" })).toBeChecked();
  },
};

/** Four answers stand two by two in a narrow pane and in one row in a wide one, never three and one. */
export const Widths: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.300">
      <div data-testid="pane" style={{ maxWidth: 320 }}>
        <DecisionKeys aria-label="In a pane" options={determinations} />
      </div>
      <div data-testid="dock" style={{ maxWidth: 640 }}>
        <DecisionKeys aria-label="In a dock" options={determinations} />
      </div>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rowsOf = (name: string) =>
      new Set(
        within(canvas.getByRole("radiogroup", { name }))
          .getAllByRole("radio")
          .map((card) => Math.round(card.getBoundingClientRect().top)),
      ).size;
    await expect(rowsOf("In a pane")).toBe(2);
    const dock = canvas.getByTestId("dock").getBoundingClientRect().width;
    // In a dock as wide as four cards they stand in one row; a phone's frame keeps them two by two.
    await expect(rowsOf("In a dock")).toBe(dock >= 512 ? 1 : 2);
  },
};
