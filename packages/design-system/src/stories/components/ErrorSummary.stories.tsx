import type { Meta, StoryObj } from "@storybook/react-vite";
import { useId, useRef, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  Button,
  Checkbox,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ErrorSummary,
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Input,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type ErrorSummaryIssue,
} from "../../components";
import { HeadingLevelProvider, Inline, Stack, Text } from "../../primitives";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/ErrorSummary",
  component: ErrorSummary,
  parameters: { layout: "padded" },
  args: {
    autoFocus: false,
    issues: [
      { message: "Enter a task title.", target: "summary-playground-title" },
      {
        message: "Choose a due date that is after the start date.",
        target: "summary-playground-due",
      },
    ],
  },
  render: (args) => (
    <Stack space="space.200" className="w-layout-list max-w-full">
      <ErrorSummary {...args} />
      <Field invalid>
        <FieldLabel>Task title</FieldLabel>
        <Input id="summary-playground-title" />
        <FieldError>Enter a task title.</FieldError>
      </Field>
      <Field invalid>
        <FieldLabel>Due</FieldLabel>
        <Input id="summary-playground-due" type="date" defaultValue="2026-01-02" />
        <FieldError>Choose a due date that is after the start date.</FieldError>
      </Field>
    </Stack>
  ),
} satisfies Meta<typeof ErrorSummary>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A titled danger Alert that lists every issue; each item is a button that moves focus to its field. */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const summary = canvas.getByRole("alert", { name: "There is a problem" });
    // The title is a heading at the contextual level: an h2 outside every HeadingLevelProvider.
    await expect(within(summary).getByRole("heading", { level: 2 })).toHaveTextContent(
      "There is a problem",
    );
    await expect(within(summary).getAllByRole("listitem")).toHaveLength(2);
    await userEvent.click(within(summary).getByRole("button", { name: "Enter a task title." }));
    await expect(canvas.getByRole("textbox", { name: "Task title" })).toHaveFocus();
    await userEvent.click(
      within(summary).getByRole("button", {
        name: "Choose a due date that is after the start date.",
      }),
    );
    await expect(canvasElement.ownerDocument.activeElement).toHaveAttribute(
      "id",
      "summary-playground-due",
    );
  },
};

type Person = { value: string; label: string };
const assessors: Person[] = [
  { value: "dana", label: "Dana Whitlock" },
  { value: "priya", label: "Priya Natarajan" },
];

function TaskForm() {
  const id = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [program, setProgram] = useState<string | null>(null);
  const [assessor, setAssessor] = useState<Person | null>(null);
  const [frequency, setFrequency] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [issues, setIssues] = useState<ErrorSummaryIssue[]>([]);
  const [saved, setSaved] = useState(false);
  const errors = {
    title: title.trim() ? undefined : "Enter a task title.",
    program: program ? undefined : "Choose a program.",
    assessor: assessor ? undefined : "Choose an assessor.",
    frequency: frequency ? undefined : "Choose a review frequency.",
    reviewed: reviewed ? undefined : "Confirm you have reviewed the evidence.",
  };
  const shown = (key: keyof typeof errors) => (attempts > 0 ? errors[key] : undefined);
  return (
    <form
      noValidate
      aria-label="Create task"
      className="w-layout-list max-w-full"
      onSubmit={(event) => {
        event.preventDefault();
        setAttempts((count) => count + 1);
        // The summary lists the issues found at submission; it does not change while the reader types.
        const found: ErrorSummaryIssue[] = [
          { message: errors.title, target: () => titleRef.current },
          { message: errors.program, target: `${id}-program` },
          { message: errors.assessor, target: `${id}-assessor` },
          { message: errors.frequency, target: `${id}-frequency` },
          { message: errors.reviewed, target: `${id}-reviewed` },
        ];
        const next = found.filter((issue) => Boolean(issue.message));
        setIssues(next);
        setSaved(next.length === 0);
      }}
    >
      <Stack space="space.200">
        <ErrorSummary issues={issues} focusKey={attempts} />
        <Field invalid={Boolean(shown("title"))} required>
          <FieldLabel>Task title</FieldLabel>
          <Input ref={titleRef} value={title} onValueChange={setTitle} />
          <FieldError>{shown("title")}</FieldError>
        </Field>
        <Field invalid={Boolean(shown("program"))} required>
          <FieldLabel>Program</FieldLabel>
          <Select
            items={{ atlas: "Atlas payments", orion: "Orion telemetry" }}
            value={program}
            onValueChange={setProgram}
          >
            <SelectTrigger id={`${id}-program`} className="w-full">
              <SelectValue placeholder="Choose a program" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              <SelectItem value="atlas">Atlas payments</SelectItem>
              <SelectItem value="orion">Orion telemetry</SelectItem>
            </SelectContent>
          </Select>
          <FieldError>{shown("program")}</FieldError>
        </Field>
        <Field invalid={Boolean(shown("assessor"))} required>
          <FieldLabel>Assessor</FieldLabel>
          <Combobox items={assessors} value={assessor} onValueChange={setAssessor}>
            <ComboboxInput id={`${id}-assessor`} placeholder="Choose a person" />
            <ComboboxContent>
              <ComboboxEmpty>No matches.</ComboboxEmpty>
              <ComboboxList>
                {(item: Person) => (
                  <ComboboxItem key={item.value} value={item}>
                    {item.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          <FieldError>{shown("assessor")}</FieldError>
        </Field>
        <Field invalid={Boolean(shown("frequency"))} required>
          <FieldSet>
            <FieldLegend variant="label">Review frequency</FieldLegend>
            <RadioGroup<string>
              id={`${id}-frequency`}
              value={frequency}
              onValueChange={setFrequency}
            >
              <Field orientation="horizontal">
                <RadioGroupItem value="quarterly" />
                <FieldLabel>Quarterly</FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <RadioGroupItem value="annually" />
                <FieldLabel>Annually</FieldLabel>
              </Field>
            </RadioGroup>
            <FieldError>{shown("frequency")}</FieldError>
          </FieldSet>
        </Field>
        <Field orientation="horizontal" invalid={Boolean(shown("reviewed"))} required>
          <Checkbox id={`${id}-reviewed`} checked={reviewed} onCheckedChange={setReviewed} />
          <FieldContent>
            <FieldLabel>I have reviewed the evidence</FieldLabel>
            <FieldError>{shown("reviewed")}</FieldError>
          </FieldContent>
        </Field>
        <Inline space="space.100" alignInline="end">
          <Button type="submit" variant="primary">
            Create task
          </Button>
        </Inline>
        {saved && <Text role="status">Task created in this example.</Text>}
      </Stack>
    </form>
  );
}

/**
 * On submit the summary appears and takes focus; it lists every issue in field order and each
 * item focuses its control: an Input by ref, a Select trigger, a Combobox input, a RadioGroup and
 * a Checkbox by id. A second failed submission brings focus back to the summary.
 */
export const OnSubmit: Story = {
  name: "On submit",
  render: () => <TaskForm />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const submit = canvas.getByRole("button", { name: "Create task" });
    await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
    await userEvent.click(submit);
    const summary = await canvas.findByRole("alert", { name: "There is a problem" });
    await waitFor(() => expect(summary).toHaveFocus());
    const item = (name: string) => within(summary).getByRole("button", { name });
    await expect(within(summary).getAllByRole("listitem")).toHaveLength(5);
    await userEvent.click(item("Enter a task title."));
    await expect(canvas.getByRole("textbox", { name: "Task title" })).toHaveFocus();
    await userEvent.click(item("Choose a program."));
    await expect(canvas.getByRole("combobox", { name: "Program" })).toHaveFocus();
    await userEvent.click(item("Choose an assessor."));
    await expect(canvas.getByRole("combobox", { name: "Assessor" })).toHaveFocus();
    await userEvent.click(item("Choose a review frequency."));
    await expect(canvas.getByRole("radio", { name: "Quarterly" })).toHaveFocus();
    await userEvent.click(item("Confirm you have reviewed the evidence."));
    await expect(
      canvas.getByRole("checkbox", { name: "I have reviewed the evidence" }),
    ).toHaveFocus();
    // Keyboard: Tab from the summary reaches its first item, and Enter follows it.
    summary.focus();
    await userEvent.tab();
    await expect(item("Enter a task title.")).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await userEvent.type(canvas.getByRole("textbox", { name: "Task title" }), "Review payables");
    await userEvent.click(submit);
    await waitFor(() => expect(summary).toHaveFocus());
    await expect(within(summary).getAllByRole("listitem")).toHaveLength(4);
    await expect(within(summary).queryByText("Enter a task title.")).not.toBeInTheDocument();
  },
};

const openStep = fn();

function StepsForm() {
  const [step, setStep] = useState<1 | 2>(2);
  const nameRef = useRef<HTMLInputElement>(null);
  return (
    <Stack space="space.200" className="w-layout-list max-w-full">
      <Text weight="medium">Step {step} of 2</Text>
      {step === 2 && (
        <ErrorSummary
          autoFocus={false}
          issues={[
            {
              message: "Enter a program name.",
              onSelect: () => {
                openStep(1);
                setStep(1);
              },
              target: () => nameRef.current,
            },
          ]}
        >
          Fix these on the earlier steps before you create the program.
        </ErrorSummary>
      )}
      {step === 1 ? (
        <Field invalid required>
          <FieldLabel>Program name</FieldLabel>
          <Input ref={nameRef} />
          <FieldError>Enter a program name.</FieldError>
        </Field>
      ) : (
        <Text>Review the program before you create it.</Text>
      )}
    </Stack>
  );
}

/**
 * On the last step of a longer flow an item opens the step that holds the field with `onSelect`,
 * then focuses the field once that step has rendered.
 */
export const EarlierStep: Story = {
  name: "Field on an earlier step",
  render: () => <StepsForm />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    openStep.mockClear();
    const summary = canvas.getByRole("alert", { name: "There is a problem" });
    await expect(summary).toHaveAccessibleName("There is a problem");
    await expect(summary).toHaveTextContent("Fix these on the earlier steps");
    await expect(summary).not.toHaveFocus();
    await userEvent.click(within(summary).getByRole("button", { name: "Enter a program name." }));
    await expect(openStep).toHaveBeenCalledWith(1);
    await waitFor(() =>
      expect(canvas.getByRole("textbox", { name: "Program name" })).toHaveFocus(),
    );
  },
};

/**
 * Inside a HeadingLevelProvider the title takes the surrounding level (an h3 under a dialog's or
 * a section's h2). An issue with no field to lead to, such as a rule across two fields, is text.
 */
export const InSection: Story = {
  name: "In a section",
  render: () => (
    <HeadingLevelProvider level={3}>
      <ErrorSummary
        autoFocus={false}
        className="w-layout-list max-w-full"
        issues={[
          { message: "Enter a task title.", target: "section-title" },
          { message: "The start and due dates cannot both be empty." },
        ]}
      />
      <Field invalid>
        <FieldLabel>Task title</FieldLabel>
        <Input id="section-title" />
      </Field>
    </HeadingLevelProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const summary = canvas.getByRole("alert", { name: "There is a problem" });
    await expect(within(summary).getByRole("heading", { level: 3 })).toHaveTextContent(
      "There is a problem",
    );
    await expect(within(summary).getAllByRole("listitem")).toHaveLength(2);
    await expect(within(summary).getAllByRole("button")).toHaveLength(1);
    await expect(
      within(summary).getByText("The start and due dates cannot both be empty.").closest("button"),
    ).toBeNull();
  },
};

/** With no issues the summary renders nothing, so it can stay in place above the form. */
export const NoIssues: Story = {
  name: "No issues",
  args: { issues: [] },
  render: (args) => <ErrorSummary {...args} />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole("alert")).not.toBeInTheDocument();
    await expect(canvasElement.querySelector('[data-slot="error-summary"]')).toBeNull();
  },
};

/** Each item says what fixes the field, naming it, as the field's own error does. */
export const DoDont: Story = {
  name: "Do and don't",
  render: () => (
    <Pair
      do={
        <ErrorSummary
          autoFocus={false}
          issues={[
            { message: "Enter a task title.", target: "do-title" },
            { message: "Choose a program.", target: "do-program" },
          ]}
        />
      }
      doText="Each item names the field and what fixes it, and moves focus there."
      dont={
        <ErrorSummary
          autoFocus={false}
          title="Error"
          issues={[
            { message: "Required.", target: "dont-title" },
            { message: "Required.", target: "dont-program" },
          ]}
        />
      }
      dontText="A generic title and repeated 'Required.' leave the reader to find which field is wrong."
    />
  ),
};
