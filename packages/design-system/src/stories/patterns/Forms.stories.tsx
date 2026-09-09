import {
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldSet,
  FieldLegend,
  ComboboxInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
  Button,
  Checkbox,
  Combobox,
  DatePicker,
  Dot,
  Field,
  Input,
  InputGroup,
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
import { revalidateLogic, useForm } from "@tanstack/react-form";
import { z } from "zod";
import { type Meta, type StoryObj } from "@storybook/react-vite";
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
  const fieldId = useId();

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
            const fieldError1 = isInvalid
              ? [...new Set(field.state.meta.errors.map((error) => error?.message))].join(" ")
              : undefined;
            return (
              <Field data-invalid={Boolean(fieldError1)}>
                <FieldLabel
                  id={`${fieldId}-control-name-1-label`}
                  htmlFor={`${fieldId}-control-name-1`}
                >
                  {"Control name"}
                  <span aria-hidden="true" className="text-danger">
                    {" "}
                    *
                  </span>
                </FieldLabel>
                <Input
                  id={`${fieldId}-control-name-1`}
                  aria-labelledby={`${fieldId}-control-name-1-label`}
                  aria-required={true}
                  aria-describedby={`${fieldId}-control-name-1-message`}
                  name={field.name}
                  value={field.state.value}
                  required
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={Boolean(fieldError1) || isInvalid}
                  placeholder="Segregation of duties, payables"
                />
                {Boolean(fieldError1) ? (
                  <FieldError id={`${fieldId}-control-name-1-message`}>{fieldError1}</FieldError>
                ) : (
                  <FieldDescription id={`${fieldId}-control-name-1-message`}>
                    {"How it appears in the register."}
                  </FieldDescription>
                )}
              </Field>
            );
          }}
        </form.Field>
        <form.Field name="owner">
          {(field) => {
            const valueItems = [
              { value: "", label: "Choose an owner" },
              { value: "dana", label: "Dana Whitfield" },
              { value: "priya", label: "Priya Natarajan" },
              { value: "marcus", label: "Marcus Oyelaran" },
            ];
            return (
              <Field>
                <FieldLabel id={`${fieldId}-owner-2-label`} htmlFor={`${fieldId}-owner-2`}>
                  {"Owner"}
                </FieldLabel>
                <Select<string>
                  items={valueItems}
                  name={field.name}
                  value={field.state.value}
                  onValueChange={(value) => {
                    if (value === null) return;
                    return field.handleChange(value);
                  }}
                >
                  <SelectTrigger
                    id={`${fieldId}-owner-2`}
                    aria-labelledby={`${fieldId}-owner-2-label`}
                    className="w-full"
                    onBlur={field.handleBlur}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent aria-labelledby={`${fieldId}-owner-2-label`}>
                    {valueItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            );
          }}
        </form.Field>
        <form.Field name="rationale">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            const fieldError3 = isInvalid
              ? [...new Set(field.state.meta.errors.map((error) => error?.message))].join(" ")
              : undefined;
            return (
              <Field data-invalid={Boolean(fieldError3)}>
                <FieldLabel id={`${fieldId}-rationale-3-label`} htmlFor={`${fieldId}-rationale-3`}>
                  {"Rationale"}
                  <span aria-hidden="true" className="text-danger">
                    {" "}
                    *
                  </span>
                </FieldLabel>
                <Textarea
                  id={`${fieldId}-rationale-3`}
                  aria-labelledby={`${fieldId}-rationale-3-label`}
                  aria-required={true}
                  aria-describedby={fieldError3 ? `${fieldId}-rationale-3-message` : undefined}
                  name={field.name}
                  value={field.state.value}
                  rows={3}
                  required
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  aria-invalid={Boolean(fieldError3) || isInvalid}
                  placeholder="Why this control exists and what it prevents."
                />
                {Boolean(fieldError3) ? (
                  <FieldError id={`${fieldId}-rationale-3-message`}>{fieldError3}</FieldError>
                ) : null}
              </Field>
            );
          }}
        </form.Field>
        <form.Field name="reference">
          {(field) => (
            <Field>
              <FieldLabel id={`${fieldId}-reference-4-label`} htmlFor={`${fieldId}-reference-4`}>
                {"Reference"}
              </FieldLabel>
              <Input
                id={`${fieldId}-reference-4`}
                aria-labelledby={`${fieldId}-reference-4-label`}
                aria-describedby={`${fieldId}-reference-4-message`}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                readOnly
              />
              <FieldDescription id={`${fieldId}-reference-4-message`}>
                {"Read only until the assessment closes."}
              </FieldDescription>
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
    <div style={{ width: 360 }}>
      <Stack space="space.200">
        <Field>
          <FieldLabel id={`${fieldId}-status-5-label`} htmlFor={`${fieldId}-status-5`}>
            {"Status"}
          </FieldLabel>
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
            <SelectTrigger
              id={`${fieldId}-status-5`}
              aria-labelledby={`${fieldId}-status-5-label`}
              aria-describedby={`${fieldId}-status-5-message`}
              className="w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              aria-labelledby={`${fieldId}-status-5-label`}
              align="start"
              alignItemWithTrigger={false}
            >
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
          <FieldDescription id={`${fieldId}-status-5-message`}>
            {"A Select: the options carry their Dot."}
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel id={`${fieldId}-owner-6-label`} htmlFor={`${fieldId}-owner-6`}>
            {"Owner"}
          </FieldLabel>
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
            <ComboboxInput
              id={`${fieldId}-owner-6`}
              aria-labelledby={`${fieldId}-owner-6-label`}
              aria-describedby={`${fieldId}-owner-6-message`}
              placeholder="Choose an owner"
            />
            <ComboboxContent>
              <ComboboxEmpty>{"No matches."}</ComboboxEmpty>
              <ComboboxList aria-labelledby={`${fieldId}-owner-6-label`}>
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
          <FieldDescription id={`${fieldId}-owner-6-message`}>
            {"A Combobox: a list worth searching."}
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel id={`${fieldId}-due-7-label`} htmlFor={`${fieldId}-due-7`}>
            {"Due"}
          </FieldLabel>
          <DatePicker
            id={`${fieldId}-due-7`}
            aria-labelledby={`${fieldId}-due-7-label`}
            aria-describedby={`${fieldId}-due-7-message`}
            value={due}
            onChange={setDue}
          />
          <FieldDescription id={`${fieldId}-due-7-message`}>
            {"A DatePicker: one day, held as an ISO date."}
          </FieldDescription>
        </Field>
      </Stack>
    </div>
  );
}

/** The pickers in Fields: the same shape as the fields beside them. */
export const Pickers: Story = { render: () => <PickerFields /> };

function ChoiceFields() {
  const fieldId = useId();

  const [p, setP] = useState({ pii: true, cross: false, safety: false });
  const [frequency, setFrequency] = useState("quarterly");
  const [notify, setNotify] = useState(true);
  return (
    <div style={{ width: 420 }}>
      <Stack space="space.300">
        <FieldSet
          aria-labelledby={`${fieldId}-parameters-8-label`}
          aria-describedby={`${fieldId}-parameters-8-message`}
        >
          <FieldLegend id={`${fieldId}-parameters-8-label`} variant="label">
            {"Parameters"}
          </FieldLegend>
          <Stack space="space.100">
            <label className="inline-flex items-center gap-100">
              <Checkbox
                aria-describedby={`${fieldId}-parameters-8-message`}
                checked={p.pii}
                onCheckedChange={(v) => setP({ ...p, pii: v })}
              />
              Handles PII
            </label>
            <label className="inline-flex items-center gap-100">
              <Checkbox
                aria-describedby={`${fieldId}-parameters-8-message`}
                checked={p.cross}
                onCheckedChange={(v) => setP({ ...p, cross: v })}
              />
              Cross-domain
            </label>
            <label className="inline-flex items-center gap-100">
              <Checkbox
                aria-describedby={`${fieldId}-parameters-8-message`}
                checked={p.safety}
                onCheckedChange={(v) => setP({ ...p, safety: v })}
              />
              Safety-critical
            </label>
          </Stack>
          <FieldDescription id={`${fieldId}-parameters-8-message`}>
            {"Each one adds controls to the baseline."}
          </FieldDescription>
        </FieldSet>
        <FieldSet aria-labelledby={`${fieldId}-frequency-9-label`}>
          <FieldLegend id={`${fieldId}-frequency-9-label`} variant="label">
            {"Frequency"}
          </FieldLegend>
          <RadioGroup
            aria-labelledby={`${fieldId}-frequency-9-label`}
            value={frequency}
            onValueChange={setFrequency}
          >
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
        </FieldSet>
        <Field>
          <FieldLabel
            id={`${fieldId}-notify-the-owner-on-status-change-10-label`}
            htmlFor={`${fieldId}-notify-the-owner-on-status-change-10`}
          >
            {"Notify the owner on status change"}
          </FieldLabel>
          <Switch
            id={`${fieldId}-notify-the-owner-on-status-change-10`}
            aria-labelledby={`${fieldId}-notify-the-owner-on-status-change-10-label`}
            aria-describedby={`${fieldId}-notify-the-owner-on-status-change-10-message`}
            checked={notify}
            onCheckedChange={setNotify}
          />
          <FieldDescription id={`${fieldId}-notify-the-owner-on-status-change-10-message`}>
            {"Send an email when a finding changes status."}
          </FieldDescription>
        </Field>
      </Stack>
    </div>
  );
}

/** The choice controls: a Checkbox group and a RadioGroup in FieldSets; a Switch uses Field for its external label and hint. */
export const Choices: Story = { render: () => <ChoiceFields /> };

/** A form on a six-column Grid: each field as wide as its answer, a description across the row, the buttons at the end. */
export const Layout: Story = {
  render: function FieldExample() {
    const fieldId = useId();

    const priyaItems = people;
    return (
      <div style={{ width: 640 }}>
        <Stack space="space.300">
          <Grid
            templateColumns="repeat(6, minmax(0, 1fr))"
            columnGap="space.200"
            rowGap="space.200"
          >
            <div style={{ gridColumn: "span 2" }}>
              <Field>
                <FieldLabel id={`${fieldId}-acronym-11-label`} htmlFor={`${fieldId}-acronym-11`}>
                  {"Acronym"}
                  <span aria-hidden="true" className="text-danger">
                    {" "}
                    *
                  </span>
                </FieldLabel>
                <Input
                  id={`${fieldId}-acronym-11`}
                  aria-labelledby={`${fieldId}-acronym-11-label`}
                  aria-required={true}
                  aria-describedby={`${fieldId}-acronym-11-message`}
                  defaultValue="ATLAS"
                  maxLength={8}
                />
                <FieldDescription id={`${fieldId}-acronym-11-message`}>
                  {"Up to eight characters."}
                </FieldDescription>
              </Field>
            </div>
            <div style={{ gridColumn: "span 4" }}>
              <Field>
                <FieldLabel
                  id={`${fieldId}-program-name-12-label`}
                  htmlFor={`${fieldId}-program-name-12`}
                >
                  {"Program name"}
                  <span aria-hidden="true" className="text-danger">
                    {" "}
                    *
                  </span>
                </FieldLabel>
                <Input
                  id={`${fieldId}-program-name-12`}
                  aria-labelledby={`${fieldId}-program-name-12-label`}
                  aria-required={true}
                  defaultValue="Atlas payments platform"
                />
              </Field>
            </div>
            <div style={{ gridColumn: "span 3" }}>
              <Field>
                <FieldLabel id={`${fieldId}-owner-13-label`} htmlFor={`${fieldId}-owner-13`}>
                  {"Owner"}
                </FieldLabel>
                <Combobox<(typeof priyaItems)[number]>
                  items={priyaItems}

                  isItemEqualToValue={(item, selected) => item.value === selected.value}
                  filter={(item, query) =>
                    [item.label, item.value, "keywords" in item ? item.keywords : ""]
                      .join(" ")
                      .toLocaleLowerCase()
                      .includes(query.toLocaleLowerCase())
                  }
                  value={priyaItems.find((item) => item.value === "priya") ?? null}
                  onValueChange={(item) => {
                    return undefined;
                  }}
                >
                  <ComboboxInput
                    id={`${fieldId}-owner-13`}
                    aria-labelledby={`${fieldId}-owner-13-label`}
                    placeholder="Choose an owner"
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>{"No matches."}</ComboboxEmpty>
                    <ComboboxList aria-labelledby={`${fieldId}-owner-13-label`}>
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
              </Field>
            </div>
            <div style={{ gridColumn: "span 3" }}>
              <Field>
                <FieldLabel
                  id={`${fieldId}-authorization-due-14-label`}
                  htmlFor={`${fieldId}-authorization-due-14`}
                >
                  {"Authorization due"}
                </FieldLabel>
                <DatePicker
                  id={`${fieldId}-authorization-due-14`}
                  aria-labelledby={`${fieldId}-authorization-due-14-label`}
                  defaultValue="2026-12-18"
                />
              </Field>
            </div>
            <div style={{ gridColumn: "span 6" }}>
              <Field>
                <FieldLabel
                  id={`${fieldId}-description-15-label`}
                  htmlFor={`${fieldId}-description-15`}
                >
                  {"Description"}
                </FieldLabel>
                <Textarea
                  id={`${fieldId}-description-15`}
                  aria-labelledby={`${fieldId}-description-15-label`}
                  aria-describedby={`${fieldId}-description-15-message`}
                  rows={3}
                  placeholder="Cardholder and settlement processing for the Atlas platform."
                />
                <FieldDescription id={`${fieldId}-description-15-message`}>
                  {"What the system does for the mission."}
                </FieldDescription>
              </Field>
            </div>
          </Grid>
          <Inline space="space.100" alignInline="end">
            <Button variant="subtle">Cancel</Button>
            <Button variant="primary">Create program</Button>
          </Inline>
        </Stack>
      </div>
    );
  },
};

/** Submit-only validation; incomplete fields keep the submit button available. */
function RequiredForm() {
  const fieldId = useId();

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
              const fieldError16 =
                field.state.meta.isTouched && !field.state.meta.isValid
                  ? [...new Set(field.state.meta.errors.map((error) => error?.message))].join(" ")
                  : undefined;
              return (
                <Field data-invalid={Boolean(fieldError16)}>
                  <FieldLabel
                    id={`${fieldId}-field-16-${encodeURIComponent(String(name))}-label`}
                    htmlFor={`${fieldId}-field-16-${encodeURIComponent(String(name))}`}
                  >
                    {name === "title" ? "Title" : "Owner"}
                    <span aria-hidden="true" className="text-danger">
                      {" "}
                      *
                    </span>
                  </FieldLabel>
                  <Input
                    id={`${fieldId}-field-16-${encodeURIComponent(String(name))}`}
                    aria-labelledby={`${fieldId}-field-16-${encodeURIComponent(String(name))}-label`}
                    aria-required={true}
                    aria-invalid={Boolean(fieldError16)}
                    aria-describedby={
                      fieldError16
                        ? `${fieldId}-field-16-${encodeURIComponent(String(name))}-message`
                        : undefined
                    }
                    name={field.name}
                    value={field.state.value}
                    required
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                  {Boolean(fieldError16) ? (
                    <FieldError
                      id={`${fieldId}-field-16-${encodeURIComponent(String(name))}-message`}
                    >
                      {fieldError16}
                    </FieldError>
                  ) : null}
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

function BoundCustomControl({
  onChange,
  ...props
}: Omit<React.ComponentProps<"input">, "onChange"> & { onChange: (value: string) => void }) {
  return <input {...props} onChange={(event) => onChange(event.target.value)} />;
}
function RecoveryDemo() {
  const fieldId = useId();

  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [custom, setCustom] = useState("");
  const validation = useRequired({ name, email }, undefined, {
    formRef,
    validate: { email: (value) => (value.includes("@") ? null : "Enter an email address.") },
  });
  const fieldError17 = validation.errorFor("name");
  const fieldError18 = validation.errorFor("email");
  return (
    <form
      ref={formRef}
      aria-label="Recovery form"
      onSubmit={(event) => {
        event.preventDefault();
        validation.check();
      }}
    >
      <Field data-invalid={Boolean(fieldError17)}>
        <FieldLabel id={`${fieldId}-name-17-label`} htmlFor={`${fieldId}-name-17`}>
          {"Name"}
          <span aria-hidden="true" className="text-danger">
            {" "}
            *
          </span>
        </FieldLabel>
        <div data-testid="field-wrapper">
          <InputGroup>
            <Input
              id={`${fieldId}-name-17`}
              aria-labelledby={`${fieldId}-name-17-label`}
              aria-required={true}
              aria-invalid={Boolean(fieldError17)}
              aria-describedby={`${fieldId}-name-17-message`}
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </InputGroup>
        </div>
        {Boolean(fieldError17) ? (
          <FieldError id={`${fieldId}-name-17-message`}>{fieldError17}</FieldError>
        ) : (
          <FieldDescription id={`${fieldId}-name-17-message`}>
            {"Use the full name."}
          </FieldDescription>
        )}
      </Field>
      <Field data-invalid={Boolean(fieldError18)}>
        <FieldLabel id={`${fieldId}-email-18-label`} htmlFor={`${fieldId}-email-18`}>
          {"Email"}
          <span aria-hidden="true" className="text-danger">
            {" "}
            *
          </span>
        </FieldLabel>
        <>
          <Input
            id={`${fieldId}-email-18`}
            aria-labelledby={`${fieldId}-email-18-label`}
            aria-required={true}
            aria-invalid={Boolean(fieldError18)}
            aria-describedby={fieldError18 ? `${fieldId}-email-18-message` : undefined}
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onBlur={() => validation.touch("email")}
          />
        </>
        {Boolean(fieldError18) ? (
          <FieldError id={`${fieldId}-email-18-message`}>{fieldError18}</FieldError>
        ) : null}
      </Field>
      <Field>
        <FieldLabel
          id={`${fieldId}-custom-identifier-19-label`}
          htmlFor={`${fieldId}-custom-identifier-19`}
        >
          {"Custom identifier"}
        </FieldLabel>
        <BoundCustomControl
          id={`${fieldId}-custom-identifier-19`}
          aria-labelledby={`${fieldId}-custom-identifier-19-label`}
          aria-describedby={`${fieldId}-custom-identifier-19-message`}
          value={custom}
          onChange={setCustom}
        />
        <FieldDescription id={`${fieldId}-custom-identifier-19-message`}>
          {"Native props reach the input through a custom component."}
        </FieldDescription>
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
    ).toHaveAccessibleDescription("Native props reach the input through a custom component.");
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
  const fieldId = useId();

  const formRef = useRef<HTMLFormElement>(null);
  const selectRef = useRef<HTMLButtonElement>(null);
  const comboRef = useRef<HTMLInputElement>(null);
  const [owner, setOwner] = useState("");
  const [blurred, setBlurred] = useState(false);
  const validation = useRequired({ owner }, undefined, { formRef });
  const ownerItems2 = [{ value: "alice", label: "Alice" }];
  const aliceItems = [{ value: "alice", label: "Alice" }];
  const fieldError21 = validation.errorFor("owner");
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
        <Field>
          <FieldLabel id={`${fieldId}-status-20-label`} htmlFor={`${fieldId}-status-20`}>
            {"Status"}
          </FieldLabel>
          <Select items={{ open: "Open" }} name="status" defaultValue="open">
            <SelectTrigger
              id={`${fieldId}-status-20`}
              aria-labelledby={`${fieldId}-status-20-label`}
              className="w-full"
              ref={selectRef}
              data-testid="status-trigger"
              onBlur={() => setBlurred(true)}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              aria-labelledby={`${fieldId}-status-20-label`}
              align="start"
              alignItemWithTrigger={false}
            >
              <SelectItem value="open">Open</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field data-invalid={Boolean(fieldError21)}>
          <FieldLabel id={`${fieldId}-owner-21-label`} htmlFor={`${fieldId}-owner-21`}>
            {"Owner"}
          </FieldLabel>
          <Combobox<(typeof ownerItems2)[number]>
            items={ownerItems2}

            isItemEqualToValue={(item, selected) => item.value === selected.value}
            filter={(item, query) =>
              [item.label, item.value, "keywords" in item ? item.keywords : ""]
                .join(" ")
                .toLocaleLowerCase()
                .includes(query.toLocaleLowerCase())
            }
            name="owner"
            value={ownerItems2.find((item) => item.value === owner) ?? null}
            onValueChange={(item) => setOwner(item?.value ?? "")}
          >
            <ComboboxInput
              id={`${fieldId}-owner-21`}
              aria-labelledby={`${fieldId}-owner-21-label`}
              aria-invalid={Boolean(fieldError21)}
              aria-describedby={fieldError21 ? `${fieldId}-owner-21-message` : undefined}
              ref={comboRef}
            />
            <ComboboxContent>
              <ComboboxEmpty>{"No matches."}</ComboboxEmpty>
              <ComboboxList aria-labelledby={`${fieldId}-owner-21-label`}>
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
          {Boolean(fieldError21) ? (
            <FieldError id={`${fieldId}-owner-21-message`}>{fieldError21}</FieldError>
          ) : null}
        </Field>
        <Button type="submit">Validate owner</Button>
        <Button onClick={() => selectRef.current?.focus()}>Focus status ref</Button>
        <Button onClick={() => comboRef.current?.focus()}>Focus owner ref</Button>
        <Button onClick={() => setOwner("alice")}>Assign Alice</Button>
        <output aria-label="Status touched">{String(blurred)}</output>
      </form>
      <Combobox<(typeof aliceItems)[number]>
        items={aliceItems}

        isItemEqualToValue={(item, selected) => item.value === selected.value}
        filter={(item, query) =>
          [item.label, item.value, "keywords" in item ? item.keywords : ""]
            .join(" ")
            .toLocaleLowerCase()
            .includes(query.toLocaleLowerCase())
        }
        name="external"
        form="composite-controls-form"
        value={aliceItems.find((item) => item.value === "alice") ?? null}
        onValueChange={(item) => {}}
      >
        <ComboboxInput aria-label="External owner" />
        <ComboboxContent>
          <ComboboxEmpty>{"No matches."}</ComboboxEmpty>
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
