import { type Meta, type StoryObj } from "@storybook/react-vite";
import { createRef, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  SearchField,
} from "../../components";
import { LedgerProvider } from "../../lib/locale";
import { Stack, Text } from "../../primitives";
import { Matrix } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/SearchField",
  component: SearchField,
  parameters: { layout: "padded" },
  args: { placeholder: "Search controls", size: "medium" },
} satisfies Meta<typeof SearchField>;
export default meta;
type Story = StoryObj<typeof meta>;

const fieldWidth = { width: 280, maxWidth: "100%" } as const;

const controls = [
  "AC-2 Account management",
  "AC-3 Access enforcement",
  "AU-2 Event logging",
  "CM-6 Configuration settings",
  "IA-2 Identification and authentication",
  "SC-7 Boundary protection",
];

/** The controls: size, placeholder, disabled and read-only. Type to see the clear button. */
export const Playground: Story = {
  render: (args) => <SearchField {...args} style={fieldWidth} />,
  play: async ({ canvas }) => {
    const search = canvas.getByRole("searchbox", { name: "Search controls" });
    await expect(search).toHaveAttribute("type", "search");
    await expect(search).toHaveAttribute("enterkeyhint", "search");
    // One searchbox, with no unnamed groups around it or its icon.
    await expect(canvas.queryAllByRole("group")).toHaveLength(0);
    await userEvent.type(search, "AC");
    await expect(canvas.getByRole("button", { name: "Clear search" })).toBeVisible();
    await expect(canvas.queryAllByRole("group")).toHaveLength(0);
  },
};

const states = ["empty", "typed", "disabled", "read-only"] as const;
const sizes = ["medium", "small"] as const;

/** Both sizes, empty and typed, disabled and read-only. The clear button shows only while there is a query the reader can change. */
export const States: Story = {
  render: () => (
    <Matrix
      rows={states}
      cols={sizes}
      rowLabel="state"
      render={(state, size) => (
        <SearchField
          size={size}
          aria-label={`Search, ${state}, ${size}`}
          placeholder="Search controls"
          {...(state === "empty" ? {} : { defaultValue: "AC-2" })}
          disabled={state === "disabled"}
          readOnly={state === "read-only"}
          style={{ width: 200, maxWidth: "100%" }}
        />
      )}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const size of sizes) {
      const typed = canvas.getByRole("searchbox", { name: `Search, typed, ${size}` });
      const frame = typed.closest<HTMLElement>('[data-slot="search-field"]')!;
      await expect(frame.getBoundingClientRect().height).toBe(size === "small" ? 28 : 32);
      await expect(within(frame).getByRole("button", { name: "Clear search" })).toBeVisible();
      for (const state of ["empty", "disabled", "read-only"]) {
        const other = canvas
          .getByRole("searchbox", { name: `Search, ${state}, ${size}` })
          .closest<HTMLElement>('[data-slot="search-field"]')!;
        await expect(within(other).queryByRole("button", { name: "Clear search" })).toBeNull();
      }
    }
    await expect(
      canvas.getByRole("searchbox", { name: "Search, disabled, medium" }),
    ).toBeDisabled();
    // Escape never erases a query the reader cannot change.
    const readOnly = canvas.getByRole("searchbox", { name: "Search, read-only, medium" });
    readOnly.focus();
    await userEvent.keyboard("{Escape}");
    await expect(readOnly).toHaveValue("AC-2");
  },
};

function LiveFilter({ onClear }: { onClear?: (() => void) | undefined }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const rows = controls.filter((control) => !q || control.toLowerCase().includes(q));
  return (
    <div style={{ maxWidth: 360 }}>
      <Stack space="space.150">
        <SearchField
          placeholder="Search controls"
          value={query}
          onValueChange={setQuery}
          onClear={onClear}
        />
        <Text size="small" color="color.text.subtle">
          {rows.length} of {controls.length} controls
        </Text>
        <Stack as="ul" space="space.050">
          {rows.map((row) => (
            <Text as="li" key={row}>
              {row}
            </Text>
          ))}
        </Stack>
      </Stack>
    </div>
  );
}

/** A controlled search that narrows a list as the reader types. The clear button empties it and keeps focus in the field; so does Escape. The button is not a Tab stop, because Escape does the same from the keyboard. */
export const ClearAndEscape: Story = {
  args: { onClear: fn() },
  render: (args) => <LiveFilter onClear={args.onClear} />,
  play: async ({ args, canvas }) => {
    const search = canvas.getByRole("searchbox", { name: "Search controls" });
    await userEvent.type(search, "ac");
    await expect(canvas.getByText("2 of 6 controls")).toBeVisible();
    const clear = canvas.getByRole("button", { name: "Clear search" });
    await expect(clear).toHaveAttribute("tabindex", "-1");
    await userEvent.click(clear);
    await expect(search).toHaveValue("");
    await expect(search).toHaveFocus();
    await expect(args.onClear).toHaveBeenCalledTimes(1);
    await expect(canvas.getByText("6 of 6 controls")).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "Clear search" })).toBeNull();

    await userEvent.type(search, "boundary");
    await expect(canvas.getByText("1 of 6 controls")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect(search).toHaveValue("");
    await expect(search).toHaveFocus();
    await expect(args.onClear).toHaveBeenCalledTimes(2);
    // Tab leaves the field for the page, not for the clear button.
    await userEvent.type(search, "au");
    await userEvent.tab();
    await expect(canvas.queryByRole("button", { name: "Clear search" })).not.toHaveFocus();
  },
};

function FormAround({ onSubmit }: { onSubmit?: ((value: string) => void) | undefined }) {
  const [submitted, setSubmitted] = useState(0);
  const [ran, setRan] = useState<string | null>(null);
  return (
    <form
      aria-label="Add members"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted((count) => count + 1);
      }}
      style={{ maxWidth: 360 }}
    >
      <Stack space="space.150">
        <SearchField
          placeholder="Search people"
          onSubmit={
            onSubmit
              ? (value) => {
                  onSubmit(value);
                  setRan(value);
                }
              : undefined
          }
        />
        <Text size="small" color="color.text.subtle">
          {`Form submitted ${submitted} ${submitted === 1 ? "time" : "times"}`}
        </Text>
        {onSubmit ? (
          <Text size="small" color="color.text.subtle">
            {ran === null ? "No search run" : `Searched for “${ran}”`}
          </Text>
        ) : null}
        <Button type="submit" variant="primary">
          Add members
        </Button>
      </Stack>
    </form>
  );
}

/** A live filter inside a form: Enter never submits the form, so the reader cannot save by pressing Enter to search. The form's own primary still submits it. */
export const InsideAForm: Story = {
  render: () => <FormAround />,
  play: async ({ canvas }) => {
    const search = canvas.getByRole("searchbox", { name: "Search people" });
    await userEvent.type(search, "Dana{Enter}");
    await expect(canvas.getByText("Form submitted 0 times")).toBeVisible();
    await expect(search).toHaveValue("Dana");
    // Enter that confirms an input method's composition is left to the input method.
    const composing = new KeyboardEvent("keydown", {
      key: "Enter",
      isComposing: true,
      bubbles: true,
      cancelable: true,
    });
    search.dispatchEvent(composing);
    await expect(composing.defaultPrevented).toBe(false);
    // So is Escape that cancels a composition: the query stays.
    const cancelling = new KeyboardEvent("keydown", {
      key: "Escape",
      isComposing: true,
      bubbles: true,
      cancelable: true,
    });
    search.dispatchEvent(cancelling);
    await expect(cancelling.defaultPrevented).toBe(false);
    await expect(search).toHaveValue("Dana");
    await userEvent.click(canvas.getByRole("button", { name: "Add members" }));
    await expect(canvas.getByText("Form submitted 1 time")).toBeVisible();
    // A native form reset empties the field, and the clear button follows it.
    await expect(canvas.getByRole("button", { name: "Clear search" })).toBeVisible();
    (search as HTMLInputElement).form!.reset();
    await expect(search).toHaveValue("");
    await waitFor(() => expect(canvas.queryByRole("button", { name: "Clear search" })).toBeNull());
  },
};

/** A search that runs on Enter rather than on every keystroke: `onSubmit` receives the query. Enter still leaves the form around it alone. */
export const RunsOnEnter: Story = {
  args: { onSubmit: fn() },
  render: (args) => <FormAround onSubmit={args.onSubmit} />,
  play: async ({ args, canvas }) => {
    await userEvent.type(canvas.getByRole("searchbox", { name: "Search people" }), "Priya{Enter}");
    await expect(args.onSubmit).toHaveBeenCalledWith("Priya");
    await expect(canvas.getByText("Searched for “Priya”")).toBeVisible();
    await expect(canvas.getByText("Form submitted 0 times")).toBeVisible();
  },
};

/** Inside a Field the label names the search, the hint and the error describe it, and the Field's `invalid`, `required` and `disabled` reach it with no ids. A disabled field has no clear button. */
export const BoundInField: Story = {
  name: "Bound in a Field",
  render: () => (
    <Stack space="space.200" className="w-layout-list max-w-full">
      <Field invalid required>
        <FieldLabel>Supplier</FieldLabel>
        <SearchField defaultValue="Northwind" />
        <FieldDescription>Search by name or identifier.</FieldDescription>
        <FieldError>Choose a supplier from the results.</FieldError>
      </Field>
      <Field disabled>
        <FieldLabel>Owner</FieldLabel>
        <SearchField defaultValue="Dana Whitfield" />
      </Field>
    </Stack>
  ),
  play: async ({ canvas }) => {
    const supplier = canvas.getByRole("searchbox", { name: "Supplier" });
    await expect(supplier).toHaveAttribute("aria-invalid", "true");
    await expect(supplier).toHaveAttribute("aria-required", "true");
    await expect(supplier).toHaveAccessibleDescription(
      "Search by name or identifier. Choose a supplier from the results.",
    );
    const owner = canvas.getByRole("searchbox", { name: "Owner" });
    await expect(owner).toBeDisabled();
    await expect(
      within(owner.closest<HTMLElement>('[data-slot="search-field"]')!).queryByRole("button"),
    ).toBeNull();
  },
};

const trigger = createRef<HTMLButtonElement>();

/** In a dialog, Escape clears the query first and keeps the dialog open; the next Escape closes the dialog and returns focus to its trigger. */
export const InADialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger ref={trigger} render={<Button />}>
        Choose an owner
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Choose an owner</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <SearchField placeholder="Search people" />
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button variant="subtle" />}>Cancel</DialogClose>
          <Button variant="primary">Choose owner</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Choose an owner" }));
    const dialog = await body.findByRole("dialog", { name: "Choose an owner" });
    const search = within(dialog).getByRole("searchbox", { name: "Search people" });
    await userEvent.click(search);
    await userEvent.type(search, "Marcus");
    await userEvent.keyboard("{Escape}");
    await expect(search).toHaveValue("");
    await expect(body.getByRole("dialog", { name: "Choose an owner" })).toBeVisible();
    await expect(search).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(trigger.current).toHaveFocus());
  },
};

/** The clear button's name and the default name of an unlabelled search come from the locale, so a LedgerProvider translates them. */
export const Localized: Story = {
  render: () => (
    <LedgerProvider locale="es" messages={{ search: "Buscar", clearSearch: "Borrar búsqueda" }}>
      <SearchField defaultValue="AC-2" style={fieldWidth} />
    </LedgerProvider>
  ),
  play: async ({ canvas }) => {
    const search = canvas.getByRole("searchbox", { name: "Buscar" });
    await userEvent.click(canvas.getByRole("button", { name: "Borrar búsqueda" }));
    await expect(search).toHaveValue("");
    await expect(search).toHaveFocus();
  },
};

/** Right to left, the icon sits at the start of the field (the right) and the clear button at its end (the left). */
export const RightToLeft: Story = {
  render: () => (
    <LedgerProvider direction="rtl">
      <SearchField placeholder="Search controls" defaultValue="AC-2" style={fieldWidth} />
    </LedgerProvider>
  ),
  play: async ({ canvas }) => {
    const search = canvas.getByRole("searchbox", { name: "Search controls" });
    const frame = search.closest<HTMLElement>('[data-slot="search-field"]')!;
    const icon = frame.querySelector<SVGElement>('[data-slot="input-group-addon"] > svg')!;
    const clear = canvas.getByRole("button", { name: "Clear search" });
    const box = search.getBoundingClientRect();
    await expect(icon.getBoundingClientRect().left).toBeGreaterThanOrEqual(box.right - 1);
    await expect(clear.getBoundingClientRect().right).toBeLessThanOrEqual(box.left + 1);
    await userEvent.click(clear);
    await expect(search).toHaveValue("");
    await expect(search).toHaveFocus();
  },
};

/** A search finds; a record's value is typed. */
export const Dont: Story = {
  render: () => (
    <Pair
      do={
        <Stack space="space.150">
          <SearchField placeholder="Search suppliers" style={fieldWidth} />
          <Field>
            <FieldLabel>Supplier name</FieldLabel>
            <Input defaultValue="Northwind Avionics" style={fieldWidth} />
          </Field>
        </Stack>
      }
      doText="SearchField narrows or finds records; the record's own name is an Input in a Field."
      dont={
        <Field>
          <FieldLabel>Supplier name</FieldLabel>
          <SearchField defaultValue="Northwind Avionics" style={fieldWidth} />
        </Field>
      }
      dontText="A SearchField for a value the record keeps. Escape and the clear button erase it, and a screen reader calls it a search."
    />
  ),
};
