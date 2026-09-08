import { revalidateLogic, useForm } from "@tanstack/react-form";
import { z } from "zod";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";

import {
  Button,
  Checkbox,
  Combobox,
  DatePicker,
  Dot,
  Field,
  Input,
  InputGroup,
  useFieldControl,
  NativeSelect,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  Switch,
  Textarea,
  useRequired,
} from "../../components";
import { Grid, Inline, Stack, Text } from "../../primitives";

const meta = {
  title: "Patterns/Forms",
  parameters: { layout: "padded" },
} satisfies Meta;
export default meta;
type Story = StoryObj;

const controlSchema = z.object({
  title: z.string().trim().min(1, "Enter a control name."),
  owner: z.string(),
  rationale: z
    .string()
    .trim()
    .min(1, "A rationale is required before the control can be verified."),
  reference: z.string(),
});

function ControlForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [saved, setSaved] = useState<z.infer<typeof controlSchema> | null>(null);
  const form = useForm({
    defaultValues: { title: "", owner: "", rationale: "", reference: "CTRL-0412" },
    validationLogic: revalidateLogic({ mode: "blur", modeAfterSubmission: "change" }),
    validators: { onDynamic: controlSchema },
    onSubmitInvalid: () => {
      // Validation has updated the store; React commits aria-invalid before the next frame.
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );
    },
    onSubmit: ({ value }) => setSaved(value),
  });
  return (
    <form
      ref={formRef}
      aria-label="Control details"
      style={{ width: "100%", maxWidth: 420 }}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setSaved(null);
        void form.handleSubmit();
      }}
    >
      <Stack space="space.200">
        <form.Field name="title">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field
                label="Control name"
                hint="How it appears in the register."
                isRequired
                error={
                  isInvalid
                    ? [...new Set(field.state.meta.errors.map((error) => error?.message))].join(" ")
                    : undefined
                }
              >
                <Input
                  name={field.name}
                  value={field.state.value}
                  required
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Segregation of duties, payables"
                />
              </Field>
            );
          }}
        </form.Field>
        <form.Field name="owner">
          {(field) => (
            <Field label="Owner">
              <NativeSelect
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              >
                <option value="">Choose an owner</option>
                <option value="dana">Dana Whitfield</option>
                <option value="priya">Priya Natarajan</option>
                <option value="marcus">Marcus Oyelaran</option>
              </NativeSelect>
            </Field>
          )}
        </form.Field>
        <form.Field name="rationale">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field
                label="Rationale"
                isRequired
                error={
                  isInvalid
                    ? [...new Set(field.state.meta.errors.map((error) => error?.message))].join(" ")
                    : undefined
                }
              >
                <Textarea
                  name={field.name}
                  value={field.state.value}
                  rows={3}
                  required
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Why this control exists and what it prevents."
                />
              </Field>
            );
          }}
        </form.Field>
        <form.Field name="reference">
          {(field) => (
            <Field label="Reference" hint="Read only until the assessment closes.">
              <Input
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                readOnly
              />
            </Field>
          )}
        </form.Field>
        <Inline space="space.100" alignInline="end">
          <Button
            type="button"
            variant="subtle"
            onClick={() => {
              form.reset();
              setSaved(null);
            }}
          >
            Reset
          </Button>
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                Save
              </Button>
            )}
          </form.Subscribe>
        </Inline>
        {saved ? (
          <output aria-label="Saved control">
            Saved {saved.title}. Owner: {saved.owner || "Unassigned"}. {saved.rationale} Reference:{" "}
            {saved.reference}.
          </output>
        ) : null}
      </Stack>
    </form>
  );
}

/** A form pattern: TanStack owns state and validation; Ledger components render the fields. */
export const Fields: Story = {
  render: () => <ControlForm />,
  play: async ({ canvasElement }) => {
    const { expect, userEvent, within, waitFor } = await import("storybook/test");
    const canvas = within(canvasElement);
    const title = canvas.getByRole("textbox", { name: "Control name" });
    const rationale = canvas.getByRole("textbox", { name: "Rationale" });
    await expect(canvas.queryAllByRole("alert")).toHaveLength(0);
    await expect(title).toHaveAccessibleDescription("How it appears in the register.");
    await userEvent.click(canvas.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(title).toHaveFocus());
    await expect(title).toHaveAttribute("aria-invalid", "true");
    await expect(title.closest("[data-invalid]")).toHaveAttribute("data-invalid", "true");
    await expect(rationale).toHaveAccessibleDescription(
      "A rationale is required before the control can be verified.",
    );
    await expect(canvas.queryByRole("status", { name: "Saved control" })).not.toBeInTheDocument();
    await userEvent.type(title, "Separate payment approvals");
    await waitFor(() => expect(title).not.toHaveAttribute("aria-invalid", "true"));
    await userEvent.selectOptions(canvas.getByRole("combobox", { name: "Owner" }), "priya");
    await userEvent.type(rationale, "Prevents a single person from approving their own payments.");
    // Enter in a single-line field submits the native form.
    await userEvent.click(title);
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByRole("status", { name: "Saved control" })).toHaveTextContent(
      "Owner: priya",
    );
    await expect(canvas.getByRole("status", { name: "Saved control" })).toHaveTextContent(
      "Prevents a single person",
    );
    await expect(title).toHaveValue("Separate payment approvals");
    await userEvent.click(canvas.getByRole("button", { name: "Reset" }));
    await expect(title).toHaveValue("");
    await expect(rationale).toHaveValue("");
    await expect(canvas.getByRole("combobox", { name: "Owner" })).toHaveValue("");
    await expect(canvas.getByRole("textbox", { name: "Reference" })).toHaveValue("CTRL-0412");
    await expect(canvas.queryAllByRole("alert")).toHaveLength(0);
    await expect(canvas.queryByRole("status", { name: "Saved control" })).not.toBeInTheDocument();
  },
};

const people = [
  { value: "dana", label: "Dana Whitfield", meta: "Finance" },
  { value: "priya", label: "Priya Natarajan", meta: "Security" },
  { value: "marcus", label: "Marcus Oyelaran", meta: "Operations", keywords: "ops" },
  { value: "lee", label: "Lee Anand", disabled: true },
];

function PickerFields() {
  const [owner, setOwner] = useState<string | undefined>("priya");
  const [status, setStatus] = useState("review");
  const [due, setDue] = useState("2026-09-14");
  return (
    <div style={{ width: 360 }}>
      <Stack space="space.200">
        <Field label="Status" hint="A Select: the options carry their Dot.">
          <Select
            items={{
              draft: (
                <>
                  <Dot tone="neutral" /> Draft
                </>
              ),
              review: (
                <>
                  <Dot tone="information" /> In review
                </>
              ),
              verified: (
                <>
                  <Dot tone="success" /> Verified
                </>
              ),
              overdue: (
                <>
                  <Dot tone="danger" /> Overdue
                </>
              ),
            }}
            value={status}
            onValueChange={(value) => {
              if (value !== null) setStatus(value);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false}>
              <SelectGroup>
                <SelectLabel>Open</SelectLabel>
                <SelectItem value="draft" label="Draft">
                  <Dot tone="neutral" /> Draft
                </SelectItem>
                <SelectItem value="review" label="In review">
                  <Dot tone="information" /> In review
                </SelectItem>
              </SelectGroup>
              <SelectSeparator />
              <SelectItem value="verified" label="Verified">
                <Dot tone="success" /> Verified
              </SelectItem>
              <SelectItem value="overdue" label="Overdue">
                <Dot tone="danger" /> Overdue
              </SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Owner" hint="A Combobox: a list worth searching.">
          <Combobox
            options={people}
            value={owner}
            onChange={setOwner}
            placeholder="Choose an owner"
            searchPlaceholder="Search people…"
          />
        </Field>
        <Field label="Due" hint="A DatePicker: one day, held as an ISO date.">
          <DatePicker value={due} onChange={setDue} />
        </Field>
      </Stack>
    </div>
  );
}

/** The pickers in Fields: the same shape as the fields beside them. */
export const Pickers: Story = { render: () => <PickerFields /> };

function ChoiceFields() {
  const [p, setP] = useState({ pii: true, cross: false, safety: false });
  const [frequency, setFrequency] = useState("quarterly");
  const [notify, setNotify] = useState(true);
  return (
    <div style={{ width: 420 }}>
      <Stack space="space.300">
        <Field label="Parameters" isGroup hint="Each one adds controls to the baseline.">
          <Stack space="space.100">
            <label className="inline-flex items-center gap-100">
              <Checkbox checked={p.pii} onCheckedChange={(v) => setP({ ...p, pii: v })} />
              Handles PII
            </label>
            <label className="inline-flex items-center gap-100">
              <Checkbox checked={p.cross} onCheckedChange={(v) => setP({ ...p, cross: v })} />
              Cross-domain
            </label>
            <label className="inline-flex items-center gap-100">
              <Checkbox checked={p.safety} onCheckedChange={(v) => setP({ ...p, safety: v })} />
              Safety-critical
            </label>
          </Stack>
        </Field>
        <Field label="Frequency" isGroup>
          <RadioGroup value={frequency} onValueChange={setFrequency}>
            <label className="inline-flex items-center gap-100">
              <RadioGroupItem value="monthly" />
              Monthly
            </label>
            <label className="inline-flex items-center gap-100">
              <RadioGroupItem value="quarterly" />
              Quarterly
            </label>
            <label className="inline-flex items-center gap-100">
              <RadioGroupItem value="annually" />
              Annually
            </label>
          </RadioGroup>
        </Field>
        <Field
          label="Notify the owner on status change"
          hint="Send an email when a finding changes status."
        >
          <Switch checked={notify} onCheckedChange={setNotify} />
        </Field>
      </Stack>
    </div>
  );
}

/** The choice controls: a Checkbox group and a RadioGroup in Fields with `isGroup`; a Switch uses Field for its external label and hint. */
export const Choices: Story = { render: () => <ChoiceFields /> };

/** A form on a six-column Grid: each field as wide as its answer, a description across the row, the buttons at the end. */
export const Layout: Story = {
  render: () => (
    <div style={{ width: 640 }}>
      <Stack space="space.300">
        <Grid templateColumns="repeat(6, minmax(0, 1fr))" columnGap="space.200" rowGap="space.200">
          <div style={{ gridColumn: "span 2" }}>
            <Field label="Acronym" isRequired hint="Up to eight characters.">
              <Input defaultValue="ATLAS" maxLength={8} />
            </Field>
          </div>
          <div style={{ gridColumn: "span 4" }}>
            <Field label="Program name" isRequired>
              <Input defaultValue="Atlas payments platform" />
            </Field>
          </div>
          <div style={{ gridColumn: "span 3" }}>
            <Field label="Owner">
              <Combobox
                options={people}
                value="priya"
                onChange={() => undefined}
                placeholder="Choose an owner"
              />
            </Field>
          </div>
          <div style={{ gridColumn: "span 3" }}>
            <Field label="Authorization due">
              <DatePicker defaultValue="2026-12-18" />
            </Field>
          </div>
          <div style={{ gridColumn: "span 6" }}>
            <Field label="Description" hint="What the system does for the mission.">
              <Textarea
                rows={3}
                placeholder="Cardholder and settlement processing for the Atlas platform."
              />
            </Field>
          </div>
        </Grid>
        <Inline space="space.100" alignInline="end">
          <Button variant="subtle">Cancel</Button>
          <Button variant="primary">Create program</Button>
        </Inline>
      </Stack>
    </div>
  ),
};

/** Submit-only validation; incomplete fields keep the submit button available. */
function RequiredForm() {
  const [saved, setSaved] = useState(false);
  const schema = z.object({
    title: z.string().trim().min(1, "Enter a title."),
    owner: z.string().trim().min(1, "Enter an owner."),
  });
  const form = useForm({
    defaultValues: { title: "", owner: "" },
    validators: { onSubmit: schema },
    onSubmit: () => setSaved(true),
  });
  return (
    <form
      noValidate
      style={{ width: "100%", maxWidth: 420 }}
      onSubmit={(event) => {
        event.preventDefault();
        setSaved(false);
        void form.handleSubmit();
      }}
    >
      <Stack space="space.200">
        {(["title", "owner"] as const).map((name) => (
          <form.Field key={name} name={name}>
            {(field) => (
              <Field
                label={name === "title" ? "Title" : "Owner"}
                isRequired
                error={
                  field.state.meta.isTouched && !field.state.meta.isValid
                    ? [...new Set(field.state.meta.errors.map((error) => error?.message))].join(" ")
                    : undefined
                }
              >
                <Input
                  name={field.name}
                  value={field.state.value}
                  required
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </Field>
            )}
          </form.Field>
        ))}
        <Inline space="space.100" alignBlock="center" alignInline="end">
          {saved ? <Text color="color.text.subtle">Saved.</Text> : null}
          <Button
            type="button"
            variant="subtle"
            onClick={() => {
              form.reset();
              setSaved(false);
            }}
          >
            Reset
          </Button>
          <Button type="submit" variant="primary">
            Save
          </Button>
        </Inline>
      </Stack>
    </form>
  );
}
export const RequiredOnSubmit: Story = {
  name: "Required on submit",
  render: () => <RequiredForm />,
};

function BoundCustomControl(props: { value: string; onChange: (value: string) => void }) {
  const binding = useFieldControl({});
  return (
    <input
      {...binding}
      value={props.value}
      onChange={(event) => props.onChange(event.target.value)}
    />
  );
}
function RecoveryDemo() {
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [custom, setCustom] = useState("");
  const validation = useRequired({ name, email }, undefined, {
    formRef,
    validate: { email: (value) => (value.includes("@") ? null : "Enter an email address.") },
  });
  return (
    <form
      ref={formRef}
      aria-label="Recovery form"
      onSubmit={(event) => {
        event.preventDefault();
        validation.check();
      }}
    >
      <Field label="Name" hint="Use the full name." isRequired error={validation.errorFor("name")}>
        <div data-testid="field-wrapper">
          <InputGroup>
            <Input name="name" value={name} onChange={(event) => setName(event.target.value)} />
          </InputGroup>
        </div>
      </Field>
      <Field label="Email" isRequired error={validation.errorFor("email")}>
        <>
          <Input
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onBlur={() => validation.touch("email")}
          />
        </>
      </Field>
      <Field label="Custom identifier" hint="The control opts into the binding context.">
        <BoundCustomControl value={custom} onChange={setCustom} />
      </Field>
      {Object.keys(validation.errors).length ? (
        <div role="alert">
          <ul>
            {Object.entries(validation.errors).map(([key, error]) => (
              <li key={key}>
                <button type="button" onClick={() => validation.focus(key as "name" | "email")}>
                  {key}: {error}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <Button type="submit">Save details</Button>
    </form>
  );
}

export const ValidationRecovery: Story = {
  name: "Legacy useRequired: validation recovery",
  render: () => <RecoveryDemo />,
  play: async ({ canvasElement }) => {
    const { expect, userEvent, within, waitFor } = await import("storybook/test");
    const canvas = within(canvasElement);
    const name = canvas.getByRole("textbox", { name: "Name" });
    const email = canvas.getByRole("textbox", { name: "Email" });
    await expect(name).toHaveAccessibleDescription("Use the full name.");
    await expect(canvasElement.querySelectorAll(`[id="${name.id}"]`)).toHaveLength(1);
    const label = canvasElement.querySelector<HTMLLabelElement>(`label[for="${name.id}"]`)!;
    await userEvent.click(label);
    await expect(name).toHaveFocus();
    await expect(
      canvas.getByRole("textbox", { name: "Custom identifier" }),
    ).toHaveAccessibleDescription("The control opts into the binding context.");
    await userEvent.click(canvas.getByRole("button", { name: "Save details" }));
    await expect(name).toHaveFocus();
    await expect(name).toHaveAttribute("aria-invalid", "true");
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await userEvent.type(name, "Alice");
    await waitFor(() => expect(name).not.toHaveAttribute("aria-invalid", "true"));
    await userEvent.type(email, "wrong");
    await expect(email).toHaveAccessibleDescription("Enter an email address.");
    await userEvent.clear(email);
    await userEvent.type(email, "alice@example.test{Enter}");
    await expect(name).toHaveValue("Alice");
    await expect(email).not.toHaveAttribute("aria-invalid", "true");
  },
};

function CompositeDemo() {
  const formRef = useRef<HTMLFormElement>(null);
  const selectRef = useRef<HTMLButtonElement>(null);
  const comboRef = useRef<HTMLInputElement>(null);
  const [owner, setOwner] = useState("");
  const [blurred, setBlurred] = useState(false);
  const validation = useRequired({ owner }, undefined, { formRef });
  return (
    <>
      <form
        id="composite-controls-form"
        ref={formRef}
        onSubmit={(event) => {
          event.preventDefault();
          validation.check();
        }}
      >
        <Field label="Status">
          <Select items={{ open: "Open" }} name="status" defaultValue="open">
            <SelectTrigger
              className="w-full"
              ref={selectRef}
              data-testid="status-trigger"
              onBlur={() => setBlurred(true)}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false}>
              <SelectItem value="open">Open</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Owner" error={validation.errorFor("owner")}>
          <Combobox
            ref={comboRef}
            name="owner"
            value={owner}
            onChange={setOwner}
            options={[{ value: "alice", label: "Alice" }]}
          />
        </Field>
        <Button type="submit">Validate owner</Button>
        <Button onClick={() => selectRef.current?.focus()}>Focus status ref</Button>
        <Button onClick={() => comboRef.current?.focus()}>Focus owner ref</Button>
        <Button onClick={() => setOwner("alice")}>Assign Alice</Button>
        <output aria-label="Status touched">{String(blurred)}</output>
      </form>
      <Combobox
        aria-label="External owner"
        name="external"
        form="composite-controls-form"
        value="alice"
        onChange={() => {}}
        options={[{ value: "alice", label: "Alice" }]}
      />
    </>
  );
}
export const CompositeControl: Story = {
  name: "Legacy useRequired: composite controls",
  render: () => <CompositeDemo />,
  play: async ({ canvasElement }) => {
    const { expect, userEvent, within } = await import("storybook/test");
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Validate owner" }));
    await expect(canvas.getByRole("combobox", { name: "Owner" })).toHaveFocus();
    await userEvent.click(canvas.getByRole("button", { name: "Focus status ref" }));
    await expect(canvas.getByRole("combobox", { name: "Status" })).toHaveFocus();
    await expect(canvas.getByTestId("status-trigger")).toHaveAttribute(
      "data-testid",
      "status-trigger",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Focus owner ref" }));
    await expect(canvas.getByRole("combobox", { name: "Owner" })).toHaveFocus();
    await expect(canvas.getByLabelText("Status touched")).toHaveTextContent("true");
    await userEvent.click(canvas.getByRole("button", { name: "Assign Alice" }));
    const data = new FormData(canvasElement.querySelector("form")!);
    await expect(data.get("status")).toBe("open");
    await expect(data.get("owner")).toBe("alice");
    await expect(data.get("external")).toBe("alice");
  },
};
