import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

import {
  Button,
  Checkbox,
  CheckboxGroup,
  CheckboxGroupSelectAll,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  RadioGroup,
  RadioGroupItem,
  FieldSet,
} from "../../components";
import { Inline, Stack, Text } from "../../primitives";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Pair } = pairLayout;

const families = [
  ["ac", "AC · Access control"],
  ["au", "AU · Audit and accountability"],
  ["cm", "CM · Configuration management"],
] as const;
const allFamilies = families.map(([value]) => value);

const meta = {
  title: "Components/CheckboxGroup",
  component: CheckboxGroup,
  parameters: { layout: "padded" },
  args: { defaultValue: ["ac"], disabled: false, onValueChange: fn() },
  render: (args) => (
    <CheckboxGroup {...args} allValues={allFamilies} className="w-layout-list max-w-full">
      <FieldLegend variant="label">Control families</FieldLegend>
      <CheckboxGroupSelectAll>Every family</CheckboxGroupSelectAll>
      <Stack space="space.100" className="ps-300">
        {families.map(([value, label]) => (
          <Field key={value} orientation="horizontal">
            <Checkbox value={value} name="families" />
            <FieldLabel>{label}</FieldLabel>
          </Field>
        ))}
      </Stack>
    </CheckboxGroup>
  ),
} satisfies Meta<typeof CheckboxGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A group under a legend with a select-all box. The box is ticked when every family is, mixed
 * when some are, and a press ticks or clears them all.
 */
export const Playground: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("group", { name: "Control families" }).tagName).toBe("FIELDSET");
    const parent = canvas.getByRole("checkbox", { name: "Every family" });
    const children = families.map(([, name]) => canvas.getByRole("checkbox", { name }));
    await expect(parent).toBePartiallyChecked();
    await expect(parent.querySelector("svg.lucide-minus")).toBeVisible();
    await userEvent.click(canvas.getByText("Every family"));
    for (const checkbox of [parent, ...children]) await expect(checkbox).toBeChecked();
    await expect(args.onValueChange).toHaveBeenLastCalledWith(allFamilies, expect.anything());
    await userEvent.keyboard(" ");
    for (const checkbox of [parent, ...children]) await expect(checkbox).not.toBeChecked();
    await userEvent.click(canvas.getByText("AU · Audit and accountability"));
    await expect(children[1]).toBeChecked();
    await expect(parent).toBePartiallyChecked();
    // Every box is its own tab stop, in order.
    children[1]!.focus();
    await userEvent.tab();
    await expect(children[2]).toHaveFocus();
  },
};

/** The select-all label defaults to the locale's "Select all". */
export const DefaultSelectAll: Story = {
  name: "Select all label",
  render: () => (
    <CheckboxGroup allValues={["email", "chat"]} defaultValue={["email", "chat"]}>
      <FieldLegend variant="label">Channels</FieldLegend>
      <CheckboxGroupSelectAll />
      <Field orientation="horizontal">
        <Checkbox value="email" />
        <FieldLabel>Email</FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <Checkbox value="chat" />
        <FieldLabel>Chat</FieldLabel>
      </Field>
    </CheckboxGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const parent = canvas.getByRole("checkbox", { name: "Select all" });
    await expect(parent).toBeChecked();
    await userEvent.click(parent);
    await expect(canvas.getByRole("checkbox", { name: "Email" })).not.toBeChecked();
    await expect(canvas.getByRole("checkbox", { name: "Chat" })).not.toBeChecked();
  },
};

function ChannelsForm() {
  const [value, setValue] = useState<string[]>([]);
  const [tried, setTried] = useState(false);
  const [saved, setSaved] = useState("Nothing saved.");
  const invalid = tried && value.length === 0;
  return (
    <form
      noValidate
      aria-label="Notifications"
      className="w-layout-list max-w-full"
      onReset={() => {
        setValue([]);
        setTried(false);
        setSaved("Nothing saved.");
      }}
      onSubmit={(event) => {
        event.preventDefault();
        setTried(true);
        if (value.length)
          setSaved(`Channels: ${new FormData(event.currentTarget).getAll("channels").join(", ")}.`);
      }}
    >
      <Stack space="space.200">
        <Field invalid={invalid} required>
          <CheckboxGroup value={value} onValueChange={setValue}>
            <FieldLegend variant="label">Notify by</FieldLegend>
            <FieldDescription>Choose every channel the owner reads.</FieldDescription>
            <Field orientation="horizontal">
              <Checkbox value="email" name="channels" />
              <FieldLabel>Email</FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <Checkbox value="chat" name="channels" />
              <FieldLabel>Chat</FieldLabel>
            </Field>
            {invalid && <FieldError>Choose at least one channel.</FieldError>}
          </CheckboxGroup>
        </Field>
        <Inline space="space.100">
          <Button type="submit" variant="primary">
            Save channels
          </Button>
          <Button type="reset" variant="subtle">
            Reset
          </Button>
        </Inline>
        <Text role="status">{saved}</Text>
      </Stack>
    </form>
  );
}

/**
 * The group inside a Field: the legend names it and shows the requirement, the hint and the error
 * describe it, and an invalid group marks every box. A required group does not require each box;
 * no checkbox announces it, so the legend's name says "(required)" to assistive technology.
 */
export const InField: Story = {
  name: "In a Field",
  render: () => <ChannelsForm />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("group", { name: "Notify by (required)" });
    const email = canvas.getByRole("checkbox", { name: "Email" });
    await expect(group).toHaveAccessibleDescription("Choose every channel the owner reads.");
    await expect(email).not.toHaveAttribute("aria-required", "true");
    const legend = canvas.getByText("Notify by");
    // The asterisk is the visible marker and hidden from the name; the spoken text is not seen.
    await expect(legend.querySelector('[data-slot="field-required"]')).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    await expect(within(legend).getByText("(required)")).toHaveClass("sr-only");
    await userEvent.click(canvas.getByRole("button", { name: "Save channels" }));
    await expect(group).toHaveAccessibleDescription(
      "Choose every channel the owner reads. Choose at least one channel.",
    );
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(canvas.getByRole("status")).toHaveTextContent("Nothing saved.");
    await userEvent.click(canvas.getByText("Chat"));
    await expect(email).not.toHaveAttribute("aria-invalid", "true");
    await userEvent.click(email);
    await userEvent.click(canvas.getByRole("button", { name: "Save channels" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Channels: email, chat.");
    await userEvent.click(canvas.getByRole("button", { name: "Reset" }));
    await expect(email).not.toBeChecked();
  },
};

/** `disabled` reaches every box, the select-all box included, and takes them out of the tab order. */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    for (const checkbox of canvas.getAllByRole("checkbox")) {
      await expect(checkbox).toHaveAttribute("aria-disabled", "true");
      await userEvent.click(checkbox, { pointerEventsCheck: 0 });
    }
    await expect(args.onValueChange).not.toHaveBeenCalled();
    await expect(canvas.getByRole("checkbox", { name: "AC · Access control" })).toBeChecked();
  },
};

/** Several boxes answer several questions; one answer out of two is a RadioGroup. */
export const DoDont: Story = {
  tags: ["!manifest"],
  name: "Do and don't",
  render: () => (
    <Pair
      do={
        <FieldSet>
          <FieldLegend variant="label">Decision</FieldLegend>
          <RadioGroup defaultValue="accept">
            <Field orientation="horizontal">
              <RadioGroupItem value="accept" />
              <FieldLabel>Accept this version</FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <RadioGroupItem value="na" />
              <FieldLabel>Not applicable</FieldLabel>
            </Field>
          </RadioGroup>
        </FieldSet>
      }
      doText="An either/or decision is a RadioGroup: one tab stop, arrows move between answers."
      dont={
        <CheckboxGroup defaultValue={["accept"]}>
          <FieldLegend variant="label">Decision</FieldLegend>
          <Field orientation="horizontal">
            <Checkbox value="accept" />
            <FieldLabel>Accept this version</FieldLabel>
          </Field>
          <Field orientation="horizontal">
            <Checkbox value="na" />
            <FieldLabel>Not applicable</FieldLabel>
          </Field>
        </CheckboxGroup>
      }
      dontText="Two checkboxes for one answer let the reader tick both and announce two independent choices."
    />
  ),
};
