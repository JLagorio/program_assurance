import { CheckboxGroup } from "@base-ui/react/checkbox-group";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef, useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

import { Button, Checkbox, Field } from "../../components";
import { Inline, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
  parameters: { layout: "padded" },
  args: { "aria-label": "Handles PII", defaultChecked: true },
} satisfies Meta<typeof Checkbox>;
export default meta;
type Story = StoryObj<typeof meta>;

const blockedChange = fn();

/** Independent choices, unavailable and read-only values, and a cancellable change. */
export const CheckboxMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Specimens title="Selection states">
        {(["Unchecked", "Checked", "Disabled", "Read-only"] as const).map((state) => (
          <label key={state} className="inline-flex items-center gap-100">
            <Checkbox
              defaultChecked={state !== "Unchecked"}
              disabled={state === "Disabled"}
              readOnly={state === "Read-only"}
              onCheckedChange={
                state === "Disabled" || state === "Read-only" ? blockedChange : undefined
              }
            />
            {state}
          </label>
        ))}
      </Specimens>
      <Specimens title="A program can reject a change">
        <label className="inline-flex items-center gap-100">
          <Checkbox
            defaultChecked
            onCheckedChange={(_, details) => details.cancel()}
            aria-describedby="retention-policy"
          />
          Retain audit evidence
        </label>
        <Text id="retention-policy">Retention is required by the program policy.</Text>
      </Specimens>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    blockedChange.mockClear();
    const unchecked = canvas.getByRole("checkbox", { name: "Unchecked" });
    await expect(unchecked.tagName).toBe("SPAN");
    await expect(unchecked).toHaveAttribute("data-slot", "checkbox");
    await expect(unchecked.getBoundingClientRect().width).toBe(16);
    await expect(unchecked.getBoundingClientRect().height).toBe(16);
    await userEvent.click(canvas.getByText("Unchecked"));
    await expect(unchecked).toBeChecked();
    await expect(unchecked.querySelector('[data-slot="checkbox-indicator"]')).toBeVisible();
    await userEvent.keyboard(" ");
    await expect(unchecked).not.toBeChecked();
    await userEvent.keyboard("{Enter}");
    await expect(unchecked).not.toBeChecked();
    const disabled = canvas.getByRole("checkbox", { name: "Disabled" });
    await expect(disabled).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(disabled, { pointerEventsCheck: 0 });
    await expect(disabled).toBeChecked();
    const readOnly = canvas.getByRole("checkbox", { name: "Read-only" });
    await expect(readOnly).toHaveAttribute("aria-readonly", "true");
    canvas.getByRole("checkbox", { name: "Checked" }).focus();
    await userEvent.tab();
    await expect(readOnly).toHaveFocus();
    await userEvent.click(readOnly);
    await userEvent.keyboard(" ");
    await expect(readOnly).toBeChecked();
    await expect(blockedChange).not.toHaveBeenCalled();
    const retention = canvas.getByRole("checkbox", { name: "Retain audit evidence" });
    await userEvent.click(retention);
    await expect(retention).toBeChecked();
    await expect(retention).toHaveAccessibleDescription(
      "Retention is required by the program policy.",
    );
  },
};

const parentInputRef = createRef<HTMLInputElement>();
const families = [
  ["ac", "AC · Access control"],
  ["au", "AU · Audit and accountability"],
  ["cm", "CM · Configuration management"],
] as const;

function ParentDemo() {
  return (
    <Field label="Control families" isGroup hint="Choose which families to include in this review.">
      <CheckboxGroup
        aria-label="Selected control families"
        defaultValue={["ac"]}
        allValues={families.map(([key]) => key)}
        className="grid gap-100"
      >
        <label className="inline-flex items-center gap-100">
          <Checkbox inputRef={parentInputRef} parent />
          Every family
        </label>
        <Stack space="space.100" className="ps-300">
          {families.map(([key, label]) => (
            <label key={key} className="inline-flex items-center gap-100">
              <Checkbox value={key} />
              {label}
            </label>
          ))}
        </Stack>
      </CheckboxGroup>
    </Field>
  );
}

/** Base UI CheckboxGroup derives a parent’s checked and mixed states from its selected children. */
export const Parent: Story = {
  render: () => <ParentDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const parent = canvas.getByRole("checkbox", { name: "Every family" });
    const children = families.map(([, name]) => canvas.getByRole("checkbox", { name }));
    await expect(parent).toBePartiallyChecked();
    await expect(parentInputRef.current?.indeterminate).toBe(true);
    await expect(parent.querySelector("svg.lucide-minus")).toBeVisible();
    await userEvent.click(canvas.getByText("Every family"));
    for (const checkbox of [parent, ...children]) await expect(checkbox).toBeChecked();
    await expect(parentInputRef.current?.indeterminate).toBe(false);
    await expect(parent.querySelector("svg.lucide-check")).toBeVisible();
    await userEvent.keyboard(" ");
    for (const checkbox of [parent, ...children]) await expect(checkbox).not.toBeChecked();
    await userEvent.click(children[1]!);
    await expect(parent).toBePartiallyChecked();
    await expect(children[0]).not.toBeChecked();
    await expect(children[2]).not.toBeChecked();
  },
};

const rootRef = createRef<HTMLElement>();
const inputRef = createRef<HTMLInputElement>();
const buttonRef = createRef<HTMLElement>();
const renderedRef = createRef<HTMLButtonElement>();
const renderedInputRef = createRef<HTMLInputElement>();
const rootClick = fn();
const renderedClick = fn();

function FormDemo() {
  const [pii, setPii] = useState(false);
  const [attested, setAttested] = useState(false);
  const [tried, setTried] = useState(false);
  const [saved, setSaved] = useState("Not submitted.");
  const [submissions, setSubmissions] = useState(0);
  return (
    <form
      noValidate
      aria-label="Package review"
      className="max-w-layout-measure"
      onReset={() => {
        setPii(false);
        setAttested(false);
        setTried(false);
      }}
      onSubmit={(event) => {
        event.preventDefault();
        setTried(true);
        setSubmissions((count) => count + 1);
        const data = new FormData(event.currentTarget);
        setSaved(`PII: ${data.get("pii")}; attested: ${data.get("attested") ?? "omitted"}.`);
      }}
    >
      <Stack space="space.300">
        <Stack space="space.050">
          <label className="inline-flex items-center gap-100">
            <Checkbox
              ref={rootRef}
              inputRef={inputRef}
              id="handles-pii"
              name="pii"
              value="yes"
              uncheckedValue="no"
              checked={pii}
              onCheckedChange={setPii}
              aria-describedby="pii-description"
            />
            Handles PII
          </label>
          <Text id="pii-description" size="small" color="color.text.subtle">
            The package includes records about a person.
          </Text>
        </Stack>
        <Field
          label="I have reviewed the evidence"
          controlId="review-attestation"
          isRequired
          hint="Confirm the review before submitting the package."
          error={tried && !attested ? "Review the evidence before submitting." : undefined}
        >
          <Checkbox
            ref={buttonRef}
            inputRef={renderedInputRef}
            name="attested"
            value="yes"
            required
            checked={attested}
            onCheckedChange={setAttested}
            nativeButton
            render={
              <button
                ref={renderedRef}
                title="Review attestation"
                className="align-middle"
                style={{ marginInlineEnd: 4 }}
                onClick={renderedClick}
              />
            }
            className={(state) => (state.checked ? "align-top" : "align-baseline")}
            style={(state) => ({ outlineOffset: state.checked ? 4 : 2 })}
            onClick={rootClick}
          />
        </Field>
        <Inline space="space.100">
          <Button type="submit" variant="primary">
            Submit package
          </Button>
          <Button type="reset">Reset review</Button>
        </Inline>
        <Text role="status">
          {saved} Submissions: {submissions}.
        </Text>
      </Stack>
    </form>
  );
}

/** Wrapping and Field labels, native form values/reset, and a composed button with merged refs and handlers. */
export const InField: Story = {
  render: () => <FormDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    rootClick.mockClear();
    renderedClick.mockClear();
    const pii = canvas.getByRole("checkbox", { name: "Handles PII" });
    const attestation = canvas.getByRole("checkbox", { name: "I have reviewed the evidence" });
    await expect(rootRef.current).toBe(pii);
    await expect(inputRef.current).toHaveAttribute("id", "handles-pii");
    await expect(inputRef.current).toHaveAttribute("aria-hidden", "true");
    await expect(pii).not.toHaveAttribute("id", "handles-pii");
    await expect(pii).toHaveAccessibleDescription("The package includes records about a person.");
    await expect(attestation.tagName).toBe("BUTTON");
    await expect(buttonRef.current).toBe(attestation);
    await expect(renderedRef.current).toBe(attestation);
    await expect(attestation).toHaveAttribute("id", "review-attestation");
    await expect(attestation).toHaveAttribute("title", "Review attestation");
    await expect(renderedInputRef.current).toHaveAttribute("required");
    await expect(renderedInputRef.current).not.toHaveAttribute("id", "review-attestation");
    await expect(attestation).toHaveAttribute("aria-required", "true");
    await expect(attestation).toHaveStyle({ outlineOffset: "2px", marginInlineEnd: "4px" });
    await userEvent.click(canvas.getByRole("button", { name: "Submit package" }));
    await expect(attestation).toHaveAttribute("aria-invalid", "true");
    await expect(attestation).toHaveAccessibleDescription("Review the evidence before submitting.");
    await expect(canvas.getByRole("alert")).toHaveTextContent(
      "Review the evidence before submitting.",
    );
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "PII: no; attested: omitted. Submissions: 1.",
    );
    await userEvent.click(canvas.getByText("Handles PII"));
    await expect(pii).toBeChecked();
    await expect(inputRef.current).toBeChecked();
    await userEvent.click(canvas.getByText("I have reviewed the evidence"));
    await expect(attestation).toBeChecked();
    await expect(rootClick).toHaveBeenCalledTimes(1);
    await expect(renderedClick).toHaveBeenCalledTimes(1);
    await expect(attestation).toHaveClass("align-top", "align-middle");
    await expect(attestation).toHaveStyle({ outlineOffset: "4px", marginInlineEnd: "4px" });
    await expect(attestation).not.toHaveAttribute("aria-invalid", "true");
    await expect(attestation).toHaveAccessibleDescription(
      "Confirm the review before submitting the package.",
    );
    attestation.focus();
    await userEvent.keyboard("{Enter}");
    await expect(attestation).toBeChecked();
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "PII: yes; attested: yes. Submissions: 2.",
    );
    await userEvent.keyboard(" ");
    await expect(attestation).not.toBeChecked();
    await expect(canvas.getByRole("status")).toHaveTextContent("Submissions: 2.");
    await userEvent.click(canvas.getByRole("button", { name: "Reset review" }));
    await expect(pii).not.toBeChecked();
    await expect(attestation).not.toBeChecked();
    await expect(attestation).not.toHaveAttribute("aria-invalid", "true");
  },
};

export const Playground: Story = {};
