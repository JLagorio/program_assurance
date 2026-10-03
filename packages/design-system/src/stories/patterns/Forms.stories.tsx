import {
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldSet,
  FieldLegend,
  FieldContent,
  FieldGroup,
  ComboboxInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
  Button,
  Checkbox,
  CheckboxGroup,
  Combobox,
  DatePicker,
  Dot,
  ErrorSummary,
  Field,
  Input,
  InputGroup,
  InputGroupInput,
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
  type ErrorSummaryIssue,
} from "../../components";
import { revalidateLogic, useForm, useStore } from "@tanstack/react-form";
import { z } from "zod";
import { type Meta, type StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import { useId, useRef, useState } from "react";
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
    validationLogic: revalidateLogic({ mode: "submit", modeAfterSubmission: "change" }),
    validators: { onDynamic: controlSchema },
    onSubmitInvalid: () => {
      // Validation has updated the store; React commits aria-invalid before the next frame.
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );
    },
    onSubmit: ({ value }) => setSaved(value),
  });
  const owners = [
    { value: "", label: "Choose an owner" },
    { value: "dana", label: "Dana Whitfield" },
    { value: "priya", label: "Priya Natarajan" },
    { value: "marcus", label: "Marcus Oyelaran" },
  ];
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
            const invalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field invalid={invalid} required>
                <FieldLabel>Control name</FieldLabel>
                <Input
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onValueChange={field.handleChange}
                  placeholder="Segregation of duties, payables"
                />
                <FieldDescription>How it appears in the register.</FieldDescription>
                <FieldError errors={invalid ? field.state.meta.errors : []} />
              </Field>
            );
          }}
        </form.Field>
        <form.Field name="owner">
          {(field) => (
            <Field>
              <FieldLabel>Owner</FieldLabel>
              <Select<string>
                items={owners}
                name={field.name}
                value={field.state.value}
                onValueChange={(value) => {
                  if (value !== null) field.handleChange(value);
                }}
              >
                <SelectTrigger className="w-full" onBlur={field.handleBlur}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {owners.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.Field>
        <form.Field name="rationale">
          {(field) => {
            const invalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field invalid={invalid} required>
                <FieldLabel>Rationale</FieldLabel>
                <Textarea
                  name={field.name}
                  value={field.state.value}
                  rows={3}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Why this control exists and what it prevents."
                />
                <FieldError errors={invalid ? field.state.meta.errors : []} />
              </Field>
            );
          }}
        </form.Field>
        <form.Field name="reference">
          {(field) => (
            <Field>
              <FieldLabel>Reference</FieldLabel>
              <Input
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                readOnly
              />
              <FieldDescription>Read only until the assessment closes.</FieldDescription>
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
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Save control
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

/**
 * The short path: TanStack owns values and validation and passes `invalid` and `errors` to each
 * Field; the Field ties label, hint, error and requirement to the control with no ids. Validation
 * runs on submit, then on change; focus goes to the first invalid control.
 */
export const Fields: Story = {
  render: ControlForm,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const title = canvas.getByRole("textbox", { name: "Control name" });
    const rationale = canvas.getByRole("textbox", { name: "Rationale" });
    await expect(canvas.queryAllByRole("alert")).toHaveLength(0);
    await expect(title).toHaveAccessibleDescription("How it appears in the register.");
    await expect(title).toHaveAttribute("aria-required", "true");
    // Nothing is marked before the first submission.
    await userEvent.type(title, "x{Backspace}");
    await userEvent.tab();
    await expect(title).not.toHaveAttribute("aria-invalid", "true");
    await userEvent.click(canvas.getByRole("button", { name: "Save control" }));
    await waitFor(() => expect(title).toHaveFocus());
    await expect(title).toHaveAttribute("aria-invalid", "true");
    await expect(title.closest('[data-slot="field"]')).toHaveAttribute("data-invalid");
    await expect(title).toHaveAccessibleDescription(
      "How it appears in the register. Enter a control name.",
    );
    await expect(rationale).toHaveAccessibleDescription(
      "A rationale is required before the control can be verified.",
    );
    await expect(canvas.queryByRole("status", { name: "Saved control" })).not.toBeInTheDocument();
    await userEvent.type(title, "Separate payment approvals");
    await waitFor(() => expect(title).not.toHaveAttribute("aria-invalid", "true"));
    await userEvent.click(canvas.getByRole("combobox", { name: "Owner" }));
    await userEvent.click(
      await within(canvasElement.ownerDocument.body).findByRole("option", {
        name: "Priya Natarajan",
      }),
    );
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
    await expect(canvas.getByRole("combobox", { name: "Owner" })).toHaveTextContent(
      "Choose an owner",
    );
    await expect(new FormData(canvasElement.querySelector("form")!).get("owner")).toBe("");
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
  const fieldId = useId();
  const [owner, setOwner] = useState<string | undefined>("priya");
  const [status, setStatus] = useState("review");
  const [due, setDue] = useState("2026-09-14");
  const ownerItems = people;
  return (
    <div style={{ maxWidth: 360 }}>
      <Stack space="space.200">
        <Field>
          <FieldLabel>Status</FieldLabel>
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
          <FieldDescription>A Select: the options carry their Dot.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel>Owner</FieldLabel>
          <Combobox<(typeof ownerItems)[number]>
            items={ownerItems}
            isItemEqualToValue={(item, selected) => item.value === selected.value}
            filter={(item, query) =>
              [item.label, item.value, "keywords" in item ? item.keywords : ""]
                .join(" ")
                .toLocaleLowerCase()
                .includes(query.toLocaleLowerCase())
            }
            value={ownerItems.find((item) => item.value === owner) ?? null}
            onValueChange={(item) => setOwner(item?.value ?? "")}
          >
            <ComboboxInput placeholder="Choose an owner" />
            <ComboboxContent>
              <ComboboxEmpty>No matches.</ComboboxEmpty>
              <ComboboxList>
                {(item) => (
                  <ComboboxItem
                    key={item.value}
                    value={item}
                    disabled={"disabled" in item && Boolean(item.disabled)}
                  >
                    <span className="min-w-0 flex-1">{item.label}</span>
                    {"meta" in item && item.meta ? (
                      <span className="text-subtle font-body-small">{String(item.meta)}</span>
                    ) : null}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          <FieldDescription>A Combobox: a list worth searching.</FieldDescription>
        </Field>
        <Field>
          {/* The ids are optional: DatePicker binds to its Field. Its description starts with the day. */}
          <FieldLabel id={`${fieldId}-due-label`} htmlFor={`${fieldId}-due`}>
            Due
          </FieldLabel>
          <DatePicker
            id={`${fieldId}-due`}
            aria-labelledby={`${fieldId}-due-label`}
            aria-describedby={`${fieldId}-due-message`}
            value={due}
            onValueChange={setDue}
          />
          <FieldDescription id={`${fieldId}-due-message`}>
            A DatePicker: one day, held as an ISO date.
          </FieldDescription>
        </Field>
      </Stack>
    </div>
  );
}

/** The pickers in Fields: the same shape as the fields beside them, named and described by the Field. */
export const Pickers: Story = {
  render: () => <PickerFields />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("combobox", { name: "Status" })).toHaveAccessibleDescription(
      "A Select: the options carry their Dot.",
    );
    await expect(canvas.getByRole("combobox", { name: "Owner" })).toHaveAccessibleDescription(
      "A Combobox: a list worth searching.",
    );
    await expect(canvas.getByRole("button", { name: /Due/ })).toHaveAccessibleDescription(
      /A DatePicker: one day, held as an ISO date\.$/,
    );
  },
};

function ChoiceFields() {
  const [parameters, setParameters] = useState<string[]>(["pii"]);
  const [frequency, setFrequency] = useState("quarterly");
  const [notify, setNotify] = useState(true);
  return (
    <div style={{ maxWidth: 420 }}>
      <Stack space="space.300">
        <Field>
          <CheckboxGroup value={parameters} onValueChange={setParameters}>
            <FieldLegend variant="label">Parameters</FieldLegend>
            <FieldDescription>Each one adds controls to the baseline.</FieldDescription>
            {(
              [
                ["pii", "Handles PII"],
                ["cross", "Cross-domain"],
                ["safety", "Safety-critical"],
              ] as const
            ).map(([value, label]) => (
              <Field key={value} orientation="horizontal">
                <Checkbox value={value} />
                <FieldLabel>{label}</FieldLabel>
              </Field>
            ))}
          </CheckboxGroup>
        </Field>
        <FieldSet>
          <FieldLegend variant="label">Frequency</FieldLegend>
          <RadioGroup<string> value={frequency} onValueChange={setFrequency}>
            {(["Monthly", "Quarterly", "Annually"] as const).map((label) => (
              <Field key={label} orientation="horizontal">
                <RadioGroupItem value={label.toLowerCase()} />
                <FieldLabel>{label}</FieldLabel>
              </Field>
            ))}
          </RadioGroup>
        </FieldSet>
        <Field orientation="horizontal">
          <Switch checked={notify} onCheckedChange={setNotify} />
          <FieldContent>
            <FieldLabel>Notify the owner on status change</FieldLabel>
            <FieldDescription>Send an email when a finding changes status.</FieldDescription>
          </FieldContent>
        </Field>
      </Stack>
    </div>
  );
}

/**
 * The choice controls: a CheckboxGroup whose legend names it and whose hint describes it, a
 * RadioGroup named by its FieldSet's legend, and a Switch in a horizontal Field. Each item is a
 * horizontal Field, so its label needs no id.
 */
export const Choices: Story = {
  render: () => <ChoiceFields />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("group", { name: "Parameters" })).toHaveAccessibleDescription(
      "Each one adds controls to the baseline.",
    );
    await userEvent.click(canvas.getByText("Cross-domain"));
    await expect(canvas.getByRole("checkbox", { name: "Cross-domain" })).toBeChecked();
    const frequency = canvas.getByRole("radiogroup", { name: "Frequency" });
    await expect(within(frequency).getByRole("radio", { name: "Quarterly" })).toBeChecked();
    const notify = canvas.getByRole("switch", { name: "Notify the owner on status change" });
    await expect(notify).toHaveAccessibleDescription(
      "Send an email when a finding changes status.",
    );
    await userEvent.click(canvas.getByText("Notify the owner on status change"));
    await expect(notify).not.toBeChecked();
  },
};

/**
 * A form on a six-column Grid inside a FieldGroup: each field as wide as its answer, a description
 * across the row, the buttons at the end. The FieldGroup is a size container, so the cells span the
 * whole row until the form is 28rem wide: one column in a phone, a narrow dialog or a panel, the
 * six-column layout beside them, and the same order at every width.
 */
export const Layout: Story = {
  render: function FieldExample() {
    const priyaItems = people;
    return (
      <div style={{ maxWidth: 640 }}>
        <Stack space="space.300">
          <FieldGroup>
            <Grid templateColumns="repeat(6, minmax(0, 1fr))" gap="space.200">
              <div data-testid="acronym" className="col-span-6 @md/field-group:col-span-2">
                <Field required>
                  <FieldLabel>Acronym</FieldLabel>
                  <Input defaultValue="ATLAS" maxLength={8} />
                  <FieldDescription>Up to eight characters.</FieldDescription>
                </Field>
              </div>
              <div data-testid="name" className="col-span-6 @md/field-group:col-span-4">
                <Field required>
                  <FieldLabel>Program name</FieldLabel>
                  <Input defaultValue="Atlas payments platform" />
                </Field>
              </div>
              <div className="col-span-6 @md/field-group:col-span-3">
                <Field>
                  <FieldLabel>Owner</FieldLabel>
                  <Combobox<(typeof priyaItems)[number]>
                    items={priyaItems}
                    isItemEqualToValue={(item, selected) => item.value === selected.value}
                    filter={(item, query) =>
                      [item.label, item.value, "keywords" in item ? item.keywords : ""]
                        .join(" ")
                        .toLocaleLowerCase()
                        .includes(query.toLocaleLowerCase())
                    }
                    defaultValue={priyaItems.find((item) => item.value === "priya") ?? null}
                  >
                    <ComboboxInput placeholder="Choose an owner" />
                    <ComboboxContent>
                      <ComboboxEmpty>No matches.</ComboboxEmpty>
                      <ComboboxList>
                        {(item) => (
                          <ComboboxItem
                            key={item.value}
                            value={item}
                            disabled={"disabled" in item && Boolean(item.disabled)}
                          >
                            <span className="min-w-0 flex-1">{item.label}</span>
                            {"meta" in item && item.meta ? (
                              <span className="text-subtle font-body-small">
                                {String(item.meta)}
                              </span>
                            ) : null}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </Field>
              </div>
              <div className="col-span-6 @md/field-group:col-span-3">
                <Field>
                  <FieldLabel>Authorization due</FieldLabel>
                  <DatePicker defaultValue="2026-12-18" />
                </Field>
              </div>
              <div className="col-span-6">
                <Field>
                  <FieldLabel>Description</FieldLabel>
                  <Textarea
                    rows={3}
                    autoResize
                    maxRows={8}
                    placeholder="Cardholder and settlement processing for the Atlas platform."
                  />
                  <FieldDescription>What the system does for the mission.</FieldDescription>
                </Field>
              </div>
            </Grid>
          </FieldGroup>
          <Inline space="space.100" alignInline="end">
            <Button variant="subtle">Cancel</Button>
            <Button variant="primary">Create program</Button>
          </Inline>
        </Stack>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvasElement.querySelector<HTMLElement>('[data-slot="field-group"]')!;
    const acronym = canvas.getByTestId("acronym").getBoundingClientRect();
    const name = canvas.getByTestId("name").getBoundingClientRect();
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    if (group.getBoundingClientRect().width >= 28 * rem) {
      // Wide enough: the acronym and the name share a row, the name twice as wide.
      await expect(Math.abs(acronym.top - name.top)).toBeLessThan(1);
      await expect(name.width).toBeGreaterThan(acronym.width * 1.5);
    } else {
      // Narrow: one column, in the same order, each field the row's full width.
      await expect(name.top).toBeGreaterThan(acronym.bottom - 1);
      await expect(Math.abs(name.width - acronym.width)).toBeLessThan(1);
    }
    await expect(canvas.getByRole("button", { name: /Authorization due/ })).toBeVisible();
  },
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
            {(field) => {
              const invalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field invalid={invalid} required>
                  <FieldLabel>{name === "title" ? "Title" : "Owner"}</FieldLabel>
                  <Input
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onValueChange={field.handleChange}
                  />
                  <FieldError errors={invalid ? field.state.meta.errors : []} />
                </Field>
              );
            }}
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
            Save record
          </Button>
        </Inline>
      </Stack>
    </form>
  );
}
export const RequiredOnSubmit: Story = {
  name: "Required on submit",
  render: () => <RequiredForm />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const title = canvas.getByRole("textbox", { name: "Title" });
    await expect(title).toHaveAttribute("aria-required", "true");
    await expect(canvas.getByRole("button", { name: "Save record" })).toBeEnabled();
    await userEvent.click(canvas.getByRole("button", { name: "Save record" }));
    await expect(title).toHaveAttribute("aria-invalid", "true");
    await expect(title).toHaveAccessibleDescription("Enter a title.");
    await expect(canvas.getByRole("textbox", { name: "Owner" })).toHaveAccessibleDescription(
      "Enter an owner.",
    );
  },
};

function BoundCustomControl({
  onChange,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "onChange"> & { onChange: (value: string) => void }) {
  return <Input {...props} onChange={(event) => onChange(event.target.value)} />;
}
const recoverySchema = z
  .object({
    name: z.string().trim().min(1, "Enter a name."),
    email: z
      .string()
      .trim()
      .min(1, "Enter an email address.")
      .pipe(z.string().email("Enter an email address like name@example.test.")),
    custom: z.string(),
    status: z.string(),
    owner: z.string(),
  })
  .refine((value) => value.status !== "assigned" || Boolean(value.owner), {
    path: ["owner"],
    message: "Choose an owner for assigned work.",
  });
const recoveryOwners = [{ value: "alice", label: "Alice" }];
const takenEmail = "This email is already registered.";
const summarized = ["name", "email", "owner"] as const;
const firstMessage = (errors: readonly unknown[] | undefined) =>
  errors
    ?.map((error) =>
      typeof error === "string" ? error : (error as { message?: string } | undefined)?.message,
    )
    .find(Boolean);

function RecoveryDemo() {
  const fieldId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const selectRef = useRef<HTMLButtonElement>(null);
  const comboRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(false);
  const [issues, setIssues] = useState<ErrorSummaryIssue[]>([]);
  const [attempts, setAttempts] = useState(0);
  // TanStack clears a submit-time error on the field's next blur, and the summary taking focus is
  // that blur, so the rejected value is kept here until the reader changes it.
  const [rejectedEmail, setRejectedEmail] = useState<string | null>(null);
  const form = useForm({
    defaultValues: { name: "", email: "", custom: "", status: "open", owner: "" },
    validationLogic: revalidateLogic({ mode: "submit", modeAfterSubmission: "change" }),
    validators: {
      onDynamic: recoverySchema,
      // A local stand-in for a server response; no request leaves the story.
      onSubmitAsync: async ({ value }) => {
        if (value.email !== "taken@example.test") return undefined;
        setRejectedEmail(value.email);
        return { fields: { email: { message: takenEmail } } };
      },
    },
    // The summary takes the issues found at this submission and focuses itself.
    onSubmitInvalid: ({ formApi }) => {
      setIssues(
        summarized.flatMap((key) => {
          const message = firstMessage(formApi.getFieldMeta(key)?.errors);
          return message ? [{ message, target: `${fieldId}-${key}` }] : [];
        }),
      );
      setAttempts((count) => count + 1);
    },
    onSubmit: () => {
      setIssues([]);
      setSaved(true);
    },
  });
  const requiresOwner = useStore(form.store, (state) => state.values.status === "assigned");
  return (
    <Stack space="space.200" className="max-w-[420px]">
      <form
        id={fieldId}
        ref={formRef}
        aria-label="Recovery form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          setSaved(false);
          void form.handleSubmit();
        }}
      >
        <Stack space="space.200">
          <ErrorSummary issues={issues} focusKey={attempts} />
          {(["name", "email"] as const).map((name) => (
            <form.Field key={name} name={name}>
              {(field) => {
                const rejected = name === "email" && field.state.value === rejectedEmail;
                const invalid =
                  rejected || (field.state.meta.isTouched && !field.state.meta.isValid);
                const control = {
                  id: `${fieldId}-${name}`,
                  name: field.name,
                  value: field.state.value,
                  onBlur: field.handleBlur,
                  onValueChange: field.handleChange,
                };
                return (
                  <Field invalid={invalid} required>
                    <FieldLabel>{name === "name" ? "Name" : "Email"}</FieldLabel>
                    {name === "name" ? (
                      <div data-testid="field-wrapper">
                        <InputGroup>
                          <InputGroupInput {...control} />
                        </InputGroup>
                      </div>
                    ) : (
                      <Input {...control} type="email" />
                    )}
                    <FieldDescription>
                      {name === "name"
                        ? "Use the full name."
                        : "Use taken@example.test to try a server rejection."}
                    </FieldDescription>
                    <FieldError
                      errors={
                        rejected
                          ? [{ message: takenEmail }]
                          : invalid
                            ? field.state.meta.errors
                            : []
                      }
                    />
                  </Field>
                );
              }}
            </form.Field>
          ))}
          <form.Field name="custom">
            {(field) => (
              <Field>
                <FieldLabel>Custom identifier</FieldLabel>
                <BoundCustomControl
                  name={field.name}
                  value={field.state.value}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                />
                <FieldDescription>
                  The Field reaches the input through a custom component.
                </FieldDescription>
              </Field>
            )}
          </form.Field>
          <form.Field name="status">
            {(field) => (
              <Field>
                <FieldLabel>Status</FieldLabel>
                <Select
                  items={{ open: "Open", assigned: "Assigned" }}
                  name={field.name}
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value ?? "open")}
                >
                  <SelectTrigger
                    ref={selectRef}
                    data-testid="status-trigger"
                    className="w-full"
                    onBlur={field.handleBlur}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}
          </form.Field>
          <form.Field name="owner">
            {(field) => {
              const invalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field invalid={invalid} required={requiresOwner}>
                  <FieldLabel>Owner</FieldLabel>
                  <Combobox
                    items={recoveryOwners}
                    name={field.name}
                    value={recoveryOwners.find((item) => item.value === field.state.value) ?? null}
                    onValueChange={(item) => field.handleChange(item?.value ?? "")}
                  >
                    <ComboboxInput
                      id={`${fieldId}-owner`}
                      ref={comboRef}
                      onBlur={field.handleBlur}
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>No matches.</ComboboxEmpty>
                      <ComboboxList>
                        {(item) => (
                          <ComboboxItem key={item.value} value={item}>
                            {item.label}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  <FieldDescription>Required when status is Assigned.</FieldDescription>
                  <FieldError errors={invalid ? field.state.meta.errors : []} />
                </Field>
              );
            }}
          </form.Field>
          <Inline space="space.100" shouldWrap>
            <Button type="button" onClick={() => selectRef.current?.focus()}>
              Focus status ref
            </Button>
            <Button type="button" onClick={() => comboRef.current?.focus()}>
              Focus owner ref
            </Button>
            <Button type="button" onClick={() => form.setFieldValue("owner", "alice")}>
              Assign Alice
            </Button>
          </Inline>
          <form.Subscribe selector={(state) => state.fieldMeta.status?.isBlurred ?? false}>
            {(blurred) => (
              <output aria-label="Status touched">Status touched: {String(blurred)}</output>
            )}
          </form.Subscribe>
          <Inline space="space.100" alignInline="end">
            <Button
              type="button"
              variant="subtle"
              onClick={() => {
                form.reset();
                setIssues([]);
                setRejectedEmail(null);
                setSaved(false);
              }}
            >
              Reset
            </Button>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(submitting) => (
                <Button type="submit" variant="primary" isLoading={submitting}>
                  Save details
                </Button>
              )}
            </form.Subscribe>
          </Inline>
          {saved && (
            <p role="status" aria-label="Saved details">
              Details saved for this example.
            </p>
          )}
        </Stack>
      </form>
      <Combobox
        items={recoveryOwners}
        name="external"
        form={fieldId}
        value={recoveryOwners[0]}
        readOnly
      >
        <ComboboxInput aria-label="External owner" showTrigger={false} />
      </Combobox>
    </Stack>
  );
}

/** TanStack validation, conditional owner selection, server rejection and native composite-control integration. */
export const ValidationRecovery: Story = {
  name: "Validation and recovery",
  render: () => <RecoveryDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const name = canvas.getByRole("textbox", { name: "Name" });
    const email = canvas.getByRole("textbox", { name: "Email" });
    const owner = canvas.getByRole("combobox", { name: "Owner" });
    const status = canvas.getByRole("combobox", { name: "Status" });
    const save = canvas.getByRole("button", { name: "Save details" });
    await expect(name).toHaveAccessibleDescription("Use the full name.");
    await expect(canvasElement.querySelectorAll(`[id="${name.id}"]`)).toHaveLength(1);
    const label = canvasElement.querySelector<HTMLLabelElement>(`label[for="${name.id}"]`)!;
    await userEvent.click(label);
    await expect(name).toHaveFocus();
    await expect(
      canvas.getByRole("textbox", { name: "Custom identifier" }),
    ).toHaveAccessibleDescription("The Field reaches the input through a custom component.");
    // A failed submission focuses the summary, which lists every issue and leads to each field.
    await userEvent.click(save);
    const summary = await canvas.findByRole("alert", { name: "There is a problem" });
    await waitFor(() => expect(summary).toHaveFocus());
    await expect(within(summary).getAllByRole("listitem")).toHaveLength(2);
    await expect(name).toHaveAttribute("aria-invalid", "true");
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(name).toHaveAccessibleDescription("Use the full name. Enter a name.");
    await userEvent.click(within(summary).getByRole("button", { name: "Enter an email address." }));
    await expect(email).toHaveFocus();
    await userEvent.click(within(summary).getByRole("button", { name: "Enter a name." }));
    await expect(name).toHaveFocus();
    await userEvent.type(name, "Alice");
    await waitFor(() => expect(name).not.toHaveAttribute("aria-invalid", "true"));
    await userEvent.type(email, "wrong");
    await expect(email).toHaveAccessibleDescription(
      "Use taken@example.test to try a server rejection. Enter an email address like name@example.test.",
    );
    await userEvent.clear(email);
    await userEvent.type(email, "taken@example.test{Enter}");
    await waitFor(() => expect(summary).toHaveTextContent("This email is already registered."));
    await waitFor(() => expect(summary).toHaveFocus());
    await userEvent.click(
      within(summary).getByRole("button", { name: "This email is already registered." }),
    );
    await expect(email).toHaveFocus();
    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(email).toHaveAccessibleDescription(
      "Use taken@example.test to try a server rejection. This email is already registered.",
    );
    await expect(name).toHaveValue("Alice");
    await expect(canvas.queryByRole("status", { name: "Saved details" })).toBeNull();
    await userEvent.clear(email);
    await userEvent.type(email, "alice@example.test");
    await userEvent.click(status);
    await userEvent.click(await page.findByRole("option", { name: "Assigned" }));
    await expect(owner).toHaveAttribute("aria-required", "true");
    await userEvent.click(save);
    await waitFor(() => expect(summary).toHaveFocus());
    await userEvent.click(
      within(summary).getByRole("button", { name: "Choose an owner for assigned work." }),
    );
    await expect(owner).toHaveFocus();
    await expect(owner).toHaveAccessibleDescription(
      "Required when status is Assigned. Choose an owner for assigned work.",
    );
    // Removing a conditional requirement clears its stale error.
    await userEvent.click(status);
    await userEvent.click(await page.findByRole("option", { name: "Open" }));
    await waitFor(() => expect(owner).not.toHaveAttribute("aria-invalid", "true"));
    await expect(owner).not.toHaveAttribute("aria-required", "true");
    await userEvent.click(canvas.getByRole("button", { name: "Focus status ref" }));
    await expect(status).toHaveFocus();
    await expect(status).toHaveAttribute("data-testid", "status-trigger");
    await userEvent.click(canvas.getByRole("button", { name: "Focus owner ref" }));
    await expect(owner).toHaveFocus();
    await expect(canvas.getByLabelText("Status touched")).toHaveTextContent("true");
    await userEvent.click(canvas.getByRole("button", { name: "Assign Alice" }));
    await userEvent.type(canvas.getByRole("textbox", { name: "Custom identifier" }), "REC-1");
    const data = new FormData(
      canvas.getByRole("form", { name: "Recovery form" }) as HTMLFormElement,
    );
    await expect(data.get("status")).toBe("open");
    await expect(data.get("owner")).toBe("alice");
    await expect(data.get("external")).toBe("alice");
    await expect(data.get("custom")).toBe("REC-1");
    await userEvent.click(save);
    await waitFor(() =>
      expect(canvas.getByRole("status", { name: "Saved details" })).toHaveTextContent(
        "Details saved",
      ),
    );
    await expect(canvas.queryByRole("alert")).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Reset" }));
    await expect(name).toHaveValue("");
    await expect(email).toHaveValue("");
    await expect(owner).toHaveValue("");
    await expect(canvas.queryAllByRole("alert")).toHaveLength(0);
    await expect(canvas.queryByRole("status", { name: "Saved details" })).toBeNull();
  },
};
