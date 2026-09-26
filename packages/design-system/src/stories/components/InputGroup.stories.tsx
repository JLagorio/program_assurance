import { type Meta, type StoryObj } from "@storybook/react-vite";
import { Search, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  Button,
  FieldLabel,
  FieldDescription,
  FieldError,
  Field,
  IconButton,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
  Kbd,
  KbdGroup,
} from "../../components";
import { Stack } from "../../primitives";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/InputGroup",
  component: InputGroup,
  parameters: { layout: "padded" },
} satisfies Meta<typeof InputGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

export const SearchBox: Story = {
  render: function SearchExample() {
    const fieldId = useId();

    const [query, setQuery] = useState("AC-2");
    const input = useRef<HTMLInputElement>(null);
    return (
      <div className="w-layout-list max-w-full">
        <Field>
          <FieldLabel
            id={`${fieldId}-search-controls-1-label`}
            htmlFor={`${fieldId}-search-controls-1`}
          >
            {"Search controls"}
          </FieldLabel>
          <InputGroup>
            <InputGroupInput
              id={`${fieldId}-search-controls-1`}
              aria-labelledby={`${fieldId}-search-controls-1-label`}
              aria-describedby={`${fieldId}-search-controls-1-message`}
              ref={input}
              type="search"
              value={query}
              onValueChange={setQuery}
            />
            <InputGroupAddon data-testid="search-addon">
              <Search aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                aria-label="Clear search"
                onClick={() => {
                  setQuery("");
                  input.current?.focus();
                }}
              >
                <X aria-hidden="true" />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <FieldDescription id={`${fieldId}-search-controls-1-message`}>
            {"Search by identifier or title."}
          </FieldDescription>
        </Field>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("searchbox", { name: "Search controls" });
    await expect(input).toHaveAccessibleDescription("Search by identifier or title.");
    await userEvent.click(canvas.getByTestId("search-addon"));
    await expect(input).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Clear search" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(input).toHaveValue("");
    await expect(input).toHaveFocus();
    await userEvent.type(input, "AU-2");
    await expect(input).toHaveValue("AU-2");
  },
};

export const Units: Story = {
  render: function FieldExample() {
    const fieldId = useId();
    return (
      <Stack space="space.200" className="w-layout-list max-w-full">
        <Field>
          <FieldLabel id={`${fieldId}-retention-2-label`} htmlFor={`${fieldId}-retention-2`}>
            {"Retention"}
          </FieldLabel>
          <InputGroup>
            <InputGroupInput
              id={`${fieldId}-retention-2`}
              aria-labelledby={`${fieldId}-retention-2-label`}
              aria-describedby={`${fieldId}-retention-2-message`}
              type="number"
              defaultValue="90"
              min={0}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupText>days</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
          <FieldDescription id={`${fieldId}-retention-2-message`}>
            {"Days before the scan is purged."}
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel id={`${fieldId}-budget-3-label`} htmlFor={`${fieldId}-budget-3`}>
            {"Budget"}
          </FieldLabel>
          <InputGroup>
            <InputGroupInput
              id={`${fieldId}-budget-3`}
              aria-labelledby={`${fieldId}-budget-3-label`}
              type="number"
              defaultValue="240000"
              min={0}
            />
            <InputGroupAddon>
              <InputGroupText>$</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </Stack>
    );
  },
};

export const Multiline: Story = {
  render: function FieldExample() {
    const fieldId = useId();
    return (
      <div className="w-layout-list max-w-full">
        <Field>
          <FieldLabel id={`${fieldId}-review-note-4-label`} htmlFor={`${fieldId}-review-note-4`}>
            {"Review note"}
          </FieldLabel>
          <InputGroup>
            <InputGroupTextarea
              id={`${fieldId}-review-note-4`}
              aria-labelledby={`${fieldId}-review-note-4-label`}
              placeholder="Explain the decision"
              rows={3}
            />
            <InputGroupAddon align="block-start">
              <InputGroupText>Decision record</InputGroupText>
            </InputGroupAddon>
            <InputGroupAddon align="block-end">
              <InputGroupText>Visible to the assessment team</InputGroupText>
              <InputGroupButton className="ms-auto">Save note</InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </div>
    );
  },
};

export const States: Story = {
  render: function FieldExample() {
    const fieldId = useId();
    return (
      <Stack space="space.200" className="w-layout-list max-w-full">
        <Field data-invalid={Boolean("Choose an owner.")}>
          <FieldLabel id={`${fieldId}-owner-5-label`} htmlFor={`${fieldId}-owner-5`}>
            {"Owner"}
          </FieldLabel>
          <InputGroup>
            <InputGroupInput
              id={`${fieldId}-owner-5`}
              aria-labelledby={`${fieldId}-owner-5-label`}
              aria-describedby={`${fieldId}-owner-5-message`}
              aria-invalid={Boolean("Choose an owner.") || true}
              placeholder="Search owners"
            />
            <InputGroupAddon>
              <Search aria-hidden="true" />
            </InputGroupAddon>
          </InputGroup>
          {Boolean("Choose an owner.") ? (
            <FieldError id={`${fieldId}-owner-5-message`}>{"Choose an owner."}</FieldError>
          ) : null}
        </Field>
        <Field data-disabled>
          <FieldLabel
            id={`${fieldId}-archived-record-6-label`}
            htmlFor={`${fieldId}-archived-record-6`}
          >
            {"Archived record"}
          </FieldLabel>
          <InputGroup>
            <InputGroupInput
              id={`${fieldId}-archived-record-6`}
              aria-labelledby={`${fieldId}-archived-record-6-label`}
              disabled
              defaultValue="AC-2"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton disabled>Open</InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>
        <Field>
          <FieldLabel id={`${fieldId}-record-id-7-label`} htmlFor={`${fieldId}-record-id-7`}>
            {"Record ID"}
          </FieldLabel>
          <InputGroup>
            <InputGroupInput
              id={`${fieldId}-record-id-7`}
              aria-labelledby={`${fieldId}-record-id-7-label`}
              readOnly
              defaultValue="REQ-1041"
              size="small"
            />
          </InputGroup>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${fieldId}-lookup`}>Directory search</FieldLabel>
          <InputGroup>
            <InputGroupInput id={`${fieldId}-lookup`} placeholder="Enter a name" />
            <InputGroupAddon align="inline-end">
              <InputGroupButton disabled>Search</InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </Stack>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const owner = canvas.getByRole("textbox", { name: "Owner" });
    const ownerGroup = owner.closest('[data-slot="input-group"]')!;
    const invalidBorder = getComputedStyle(ownerGroup).borderColor;
    await userEvent.click(owner);
    await expect(owner).toHaveFocus();
    await waitFor(() => expect(getComputedStyle(ownerGroup).borderColor).toBe(invalidBorder));
    const directory = canvas.getByRole("textbox", { name: "Directory search" });
    const archived = canvas.getByRole("textbox", { name: "Archived record" });
    await expect(directory).toBeEnabled();
    await expect(
      getComputedStyle(directory.closest('[data-slot="input-group"]')!).backgroundColor,
    ).not.toBe(getComputedStyle(archived.closest('[data-slot="input-group"]')!).backgroundColor);
    await userEvent.type(directory, "Dana");
    await expect(directory).toHaveValue("Dana");
  },
};

/** A search with a clear button and a ⌘K hint, as a toolbar or a top nav holds it. */
function HintedSearch({ label }: { label: string }) {
  return (
    <InputGroup>
      <InputGroupInput type="search" aria-label={label} placeholder="Search controls" />
      <InputGroupAddon>
        <Search aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupAddon align="inline-end">
        <InputGroupButton size="icon-xs" aria-label="Clear search">
          <X aria-hidden="true" />
        </InputGroupButton>
        <InputGroupText>
          <KbdGroup>
            <Kbd label="Command">⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  );
}

/** In a 320px frame: the keyboard hint shows while the group is 256px or wider and steps aside below that, so the input keeps the room; a unit stays at every width. */
export const Narrow: Story = {
  name: "In a narrow frame",
  globals: { viewport: { value: "ledgerSmall", isRotated: false } },
  tags: ["narrow"],
  render: function NarrowExample() {
    const fieldId = useId();
    return (
      <div style={{ maxWidth: 320 }}>
        <Stack space="space.300">
          <div data-testid="wide">
            <HintedSearch label="Search at full width" />
          </div>
          <div data-testid="narrow" style={{ maxWidth: 200 }}>
            <HintedSearch label="Search at 200px" />
          </div>
          <div style={{ maxWidth: 200 }}>
            <Field>
              <FieldLabel htmlFor={`${fieldId}-retention`}>Retention</FieldLabel>
              <InputGroup>
                <InputGroupInput id={`${fieldId}-retention`} type="number" defaultValue="90" />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>days</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </Field>
          </div>
        </Stack>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument.documentElement;
    await expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);
    const hint = (id: string) =>
      canvas.getByTestId(id).querySelector<HTMLElement>('[data-slot="input-group-text"]')!;
    await expect(hint("wide")).toBeVisible();
    await expect(hint("narrow")).not.toBeVisible();
    await expect(canvas.getByText("days")).toBeVisible();
    // Without the hint the input keeps a usable width beside the icon and the clear button.
    const narrowInput = canvas.getByRole("searchbox", { name: "Search at 200px" });
    await expect(narrowInput.getBoundingClientRect().width).toBeGreaterThan(100);
    await expect(
      within(canvas.getByTestId("narrow")).getByRole("button", { name: "Clear search" }),
    ).toBeVisible();
  },
};

/** The mistake the narrow rule is written to prevent, beside the right way. */
export const Dont: Story = {
  render: () => (
    <Pair
      do={
        <div data-testid="do" className="flex items-center gap-100" style={{ maxWidth: 128 }}>
          <IconButton label="Search" variant="subtle" icon={<Search />} aria-haspopup="dialog" />
          <Button variant="primary">Create</Button>
        </div>
      }
      doText="In a crowded row the search is an icon button that opens the search in a dialog, as the Shell's top nav does below md. Both controls keep their size."
      dont={
        <div data-testid="dont" className="flex items-center gap-100" style={{ maxWidth: 128 }}>
          <HintedSearch label="Search beside Create" />
          <Button variant="primary">Create</Button>
        </div>
      }
      dontText="The field squeezed beside Create. The group clips its addons at its own edge instead of painting over the button, but the input is too narrow to use."
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument.documentElement;
    await expect(doc.scrollWidth).toBeLessThanOrEqual(doc.clientWidth);
    // Do: the icon button and Create sit side by side at full size inside the frame.
    const good = canvas.getByTestId("do");
    const search = within(good).getByRole("button", { name: "Search" });
    const goodCreate = within(good).getByRole("button", { name: "Create" });
    await expect(search.getBoundingClientRect().right).toBeLessThanOrEqual(
      goodCreate.getBoundingClientRect().left,
    );
    await expect(goodCreate.getBoundingClientRect().right).toBeLessThanOrEqual(
      good.getBoundingClientRect().right,
    );
    // Don't: the group clips its addons at its edge, so the button next to it is what a pointer reaches.
    const squeezed = canvas.getByTestId("dont");
    const group = squeezed.querySelector<HTMLElement>('[data-slot="input-group"]')!;
    await expect(getComputedStyle(group).overflowX).toBe("clip");
    const create = within(squeezed).getByRole("button", { name: "Create" });
    const box = create.getBoundingClientRect();
    await expect(group.getBoundingClientRect().right).toBeLessThanOrEqual(box.left);
    const hit = canvasElement.ownerDocument.elementFromPoint(
      box.left + 2,
      box.top + box.height / 2,
    );
    await expect(create.contains(hit)).toBe(true);
    await userEvent.click(create);
    await expect(create).toHaveFocus();
  },
};

/**
 * InputGroupInput inside a Field is bound like Input: named by the label, described by the hint
 * and error, and the whole group draws the invalid border.
 */
export const BoundInField: Story = {
  name: "Bound in a Field",
  render: () => (
    <div className="max-w-full" style={{ width: 320 }}>
      <Field invalid required>
        <FieldLabel>Budget</FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>$</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput inputMode="decimal" />
          <InputGroupAddon align="inline-end">
            <InputGroupText>USD</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
        <FieldDescription>The approved amount for this year.</FieldDescription>
        <FieldError>Enter a budget in US dollars.</FieldError>
      </Field>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const budget = canvas.getByRole("textbox", { name: "Budget" });
    await expect(budget).toHaveAttribute("aria-invalid", "true");
    await expect(budget).toHaveAttribute("aria-required", "true");
    await expect(budget).toHaveAccessibleDescription(
      "The approved amount for this year. Enter a budget in US dollars.",
    );
    const group = budget.closest<HTMLElement>('[data-slot="input-group"]')!;
    const danger = getComputedStyle(group).getPropertyValue("--ds-color-border-danger").trim();
    await expect(getComputedStyle(group).borderColor).toBe(danger);
    await userEvent.click(canvas.getByText("USD"));
    await expect(budget).toHaveFocus();
  },
};
