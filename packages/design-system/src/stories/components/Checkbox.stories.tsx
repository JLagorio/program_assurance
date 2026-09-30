import type { Meta, StoryObj } from "@storybook/react-vite";
import { useId, createRef, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  FieldSet,
  FieldLegend,
  FieldDescription,
  FieldLabel,
  FieldError,
  Button,
  Checkbox,
  CheckboxGroup,
  CheckboxGroupSelectAll,
  Field,
  FieldContent,
  FieldGroup,
  FieldTitle,
} from "../../components";
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
    <CheckboxGroup defaultValue={["ac"]} allValues={families.map(([key]) => key)}>
      <FieldLegend variant="label">Control families</FieldLegend>
      <FieldDescription>Choose which families to include in this review.</FieldDescription>
      <CheckboxGroupSelectAll inputRef={parentInputRef}>Every family</CheckboxGroupSelectAll>
      <Stack space="space.100" className="ps-300">
        {families.map(([key, label]) => (
          <Field key={key} orientation="horizontal">
            <Checkbox value={key} />
            <FieldLabel>{label}</FieldLabel>
          </Field>
        ))}
      </Stack>
    </CheckboxGroup>
  );
}

/** A CheckboxGroup derives the select-all box’s checked and mixed states from the ticked children. See [CheckboxGroup](?path=/docs/components-checkboxgroup--docs). */
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
  const fieldId = useId();

  const [pii, setPii] = useState(false);
  const [attested, setAttested] = useState(false);
  const [tried, setTried] = useState(false);
  const [saved, setSaved] = useState("Not submitted.");
  const [submissions, setSubmissions] = useState(0);
  const fieldError2 = tried && !attested ? "Review the evidence before submitting." : undefined;
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
        <Field data-invalid={Boolean(fieldError2)}>
          <FieldLabel
            id={`${fieldId}-i-have-reviewed-the-evidence-2-label`}
            htmlFor={"review-attestation"}
          >
            {"I have reviewed the evidence"}
            <span aria-hidden="true" className="text-danger">
              {" "}
              *
            </span>
          </FieldLabel>
          <Checkbox
            id={"review-attestation"}
            aria-labelledby={`${fieldId}-i-have-reviewed-the-evidence-2-label`}
            aria-required={true}
            aria-invalid={Boolean(fieldError2)}
            aria-describedby={`${fieldId}-i-have-reviewed-the-evidence-2-message`}
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
          {Boolean(fieldError2) ? (
            <FieldError id={`${fieldId}-i-have-reviewed-the-evidence-2-message`}>
              {fieldError2}
            </FieldError>
          ) : (
            <FieldDescription id={`${fieldId}-i-have-reviewed-the-evidence-2-message`}>
              {"Confirm the review before submitting the package."}
            </FieldDescription>
          )}
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
    await expect(canvasElement.querySelector('[data-slot="field-error"]')).toHaveTextContent(
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
    await expect(attestation).toHaveAccessibleDescription(
      "Confirm the review before submitting the package.",
    );
    // Native `required` is also Base UI's constraint: a required box that was ticked and cleared
    // stays reported until it is ticked again, whatever the form's own state says. A form that
    // validates in its own code marks the Field `required` instead and leaves `required` off the box.
    await userEvent.click(canvas.getByText("I have reviewed the evidence"));
    await expect(attestation).not.toHaveAttribute("aria-invalid", "true");
  },
};

/**
 * Inside a Field the box needs no ids: the label names it, the error describes it and `invalid`
 * reaches it. Invalid is the danger border; focus keeps the focus outline, so a focused invalid
 * box still shows where focus is.
 */
export const InvalidAndFocused: Story = {
  name: "Invalid and focused",
  render: () => (
    <Stack space="space.150">
      <Field orientation="horizontal" invalid required>
        <Checkbox />
        <FieldContent>
          <FieldLabel>I have reviewed the evidence</FieldLabel>
          <FieldError>Confirm the review before you submit.</FieldError>
        </FieldContent>
      </Field>
      <Field orientation="horizontal">
        <Checkbox />
        <FieldLabel>Notify the owner</FieldLabel>
      </Field>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const invalid = canvas.getByRole("checkbox", { name: "I have reviewed the evidence" });
    const valid = canvas.getByRole("checkbox", { name: "Notify the owner" });
    await expect(invalid).toHaveAttribute("aria-invalid", "true");
    await expect(invalid).toHaveAttribute("aria-required", "true");
    await expect(invalid).toHaveAccessibleDescription("Confirm the review before you submit.");
    const danger = getComputedStyle(invalid).getPropertyValue("--ds-color-border-danger").trim();
    await expect(getComputedStyle(invalid).borderColor).toBe(danger);
    await expect(getComputedStyle(invalid).outlineStyle).toBe("none");
    const ring = getComputedStyle(valid).getPropertyValue("--ds-color-border-focused").trim();
    await expect(ring).not.toBe(danger);
    for (const box of [invalid, valid]) {
      // Keyboard focus, as Tab gives it; the option draws :focus-visible without a trusted key press.
      box.focus({ focusVisible: true } as FocusOptions);
      await expect(box).toHaveFocus();
      await waitFor(() => {
        expect(getComputedStyle(box).outlineStyle).toBe("solid");
        expect(getComputedStyle(box).outlineColor).toBe(ring);
      });
    }
    await expect(getComputedStyle(invalid).outlineStyle).toBe("none");
    await expect(getComputedStyle(invalid).borderColor).toBe(danger);
  },
};

export const Playground: Story = {};

/**
 * The box's boundary is `color.border.bold`, 3:1 against every surface, so an unticked box can be
 * found (WCAG 1.4.11); a text field's border stays lighter by decision. contrast.test holds the
 * pair in both modes and under increased contrast. The play compares the box with a hidden
 * `border-bold` reference.
 */
export const Boundary: Story = {
  render: () => (
    <Inline space="space.200" alignBlock="center">
      <Checkbox aria-label="Handles PII" />
      <span data-testid="bold-border" aria-hidden className="hidden border border-bold" />
    </Inline>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByRole("checkbox", { name: "Handles PII" });
    await expect(box).not.toBeChecked();
    if (matchMedia("(forced-colors: active)").matches) return;
    await expect(getComputedStyle(box).borderTopColor).toBe(
      getComputedStyle(canvas.getByTestId("bold-border")).borderTopColor,
    );
  },
};

/**
 * A read-only box keeps its answer and its Tab stop but drops the brand fill and the hover: a
 * sunken box with the tick in the text colour. Its hint says why the value cannot change, and
 * describes the box, so a reader who reaches it hears the reason. An editable box answers the
 * pointer with a hover fill.
 */
export const ReadOnly: Story = {
  name: "Read-only",
  render: () => (
    <FieldGroup className="w-layout-list max-w-full">
      <Field orientation="horizontal">
        <Checkbox defaultChecked />
        <FieldLabel>Encrypt at rest</FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <Checkbox />
        <FieldLabel>Safety-critical</FieldLabel>
      </Field>
      <Field orientation="horizontal">
        <Checkbox defaultChecked readOnly />
        <FieldContent>
          <FieldLabel>Handles PII</FieldLabel>
          <FieldDescription>Set by the system categorization.</FieldDescription>
        </FieldContent>
      </Field>
      <Field orientation="horizontal">
        <Checkbox readOnly />
        <FieldContent>
          <FieldLabel>Cross-domain</FieldLabel>
          <FieldDescription>Set by the system categorization.</FieldDescription>
        </FieldContent>
      </Field>
    </FieldGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const editable = canvas.getByRole("checkbox", { name: "Encrypt at rest" });
    const open = canvas.getByRole("checkbox", { name: "Safety-critical" });
    const fixed = canvas.getByRole("checkbox", { name: "Handles PII" });
    const fixedOff = canvas.getByRole("checkbox", { name: "Cross-domain" });
    await expect(fixed).toHaveAttribute("aria-readonly", "true");
    await expect(fixed).toHaveAccessibleDescription("Set by the system categorization.");
    // Still a Tab stop, so the reason stays reachable.
    open.focus();
    await userEvent.tab();
    await expect(fixed).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect(fixed).toBeChecked();
    if (matchMedia("(forced-colors: active)").matches) return;
    const style = (element: HTMLElement) => getComputedStyle(element);
    await waitFor(() =>
      expect(style(fixed).backgroundColor).not.toBe(style(editable).backgroundColor),
    );
    await expect(style(fixed).color).not.toBe(style(editable).color);
    await expect(style(fixed).borderTopColor).toBe(style(fixedOff).borderTopColor);
  },
};

/**
 * A choice card: a FieldLabel around a horizontal Field, so a press anywhere on the card chooses.
 * The FieldTitle names the box and the FieldDescription describes it once; the card draws the one
 * focus ring and the box none. A chosen card takes the selected fill and its hint stays neutral.
 */
export const ChoiceCard: Story = {
  name: "Choice card",
  render: () => (
    <FieldGroup className="w-layout-list max-w-full">
      <FieldLabel>
        <Field orientation="horizontal">
          <Checkbox defaultChecked />
          <FieldContent>
            <FieldTitle>Require a second reviewer</FieldTitle>
            <FieldDescription>A colleague confirms the determination.</FieldDescription>
          </FieldContent>
        </Field>
      </FieldLabel>
      <FieldLabel>
        <Field orientation="horizontal">
          <Checkbox />
          <FieldContent>
            <FieldTitle>Keep archived evidence</FieldTitle>
            <FieldDescription>Superseded versions stay on the record.</FieldDescription>
          </FieldContent>
        </Field>
      </FieldLabel>
    </FieldGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const reviewer = canvas.getByRole("checkbox", { name: "Require a second reviewer" });
    const archived = canvas.getByRole("checkbox", { name: "Keep archived evidence" });
    await expect(reviewer).toHaveAccessibleDescription("A colleague confirms the determination.");
    await expect(archived).toHaveAccessibleDescription("Superseded versions stay on the record.");
    // A press on the hint, far from the box, still chooses.
    await userEvent.click(canvas.getByText("Superseded versions stay on the record."));
    await expect(archived).toBeChecked();
    await userEvent.click(canvas.getByText("Keep archived evidence"));
    await expect(archived).not.toBeChecked();
    const card = archived.closest("label")!;
    // Keyboard focus, as Tab gives it: the card draws the ring, the box inside draws none.
    (archived.ownerDocument.activeElement as HTMLElement | null)?.blur();
    archived.focus({ focusVisible: true } as FocusOptions);
    await waitFor(() => expect(getComputedStyle(card).outlineStyle).toBe("solid"));
    await expect(getComputedStyle(archived).outlineStyle).toBe("none");
    if (matchMedia("(forced-colors: active)").matches) return;
    const hint = canvas.getByText("A colleague confirms the determination.");
    const selectedText = getComputedStyle(hint).getPropertyValue("--ds-color-text-selected").trim();
    await expect(getComputedStyle(hint).color).not.toBe(selectedText);
  },
};

/**
 * Outside a Field a plain label still works: the box is inline, so the text follows it on the same
 * line instead of dropping under it.
 */
export const InAPlainLabel: Story = {
  name: "In a plain label",
  render: () => (
    <div className="w-layout-panel max-w-full">
      <label>
        <Checkbox /> Seed AC-2 on the payments platform
      </label>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByRole("checkbox", { name: "Seed AC-2 on the payments platform" });
    await expect(getComputedStyle(box).display).toBe("inline-flex");
    // One line: the label is no taller than a line of text beside the box.
    const label = box.closest("label")!;
    await expect(label.getBoundingClientRect().height).toBeLessThan(
      box.getBoundingClientRect().height * 2,
    );
  },
};
