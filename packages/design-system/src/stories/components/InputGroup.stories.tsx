import { type Meta, type StoryObj } from "@storybook/react-vite";
import { Search, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import {
  FieldLabel,
  FieldDescription,
  FieldError,
  Field,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "../../components";
import { Stack } from "../../primitives";

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
        <Field>
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
      </Stack>
    );
  },
};
