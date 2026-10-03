import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useMemo, useRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Field,
  FieldError,
  FieldLabel,
  SearchField,
  Textarea,
} from "../../components";
import { WorkPane, type WorkPaneView } from "../../patterns";
import { Box, Heading, Stack, Text, VisuallyHidden } from "../../primitives";
import * as pairLayout from "../_lib/pair";

// Story-only helpers, bound locally so the MCP snippet does not list them as package exports.
const { Pair } = pairLayout;

type Control = { id: string; code: string; title: string; inSet: boolean };

const names = [
  "Policy and procedures",
  "Account management",
  "Access enforcement",
  "Information flow enforcement",
  "Separation of duties",
  "Least privilege",
  "Unsuccessful logon attempts",
  "System use notification",
  "Session lock",
  "Remote access",
  "Wireless access",
  "Use of external systems",
];

/** A catalog's first controls: an id that tells rows apart, a name, whether the baseline selects it. */
const catalog: Control[] = names.map((title, index) => ({
  id: `ac-${index + 1}`,
  code: `AC-${index + 1}`,
  title,
  inSet: index % 3 !== 2,
}));

/** A long list: the enhancements of every control, as a tailoring dialog shows them. */
const longCatalog: Control[] = Array.from({ length: 120 }, (_, index) => {
  const base = names[index % names.length]!;
  const control = Math.floor(index / names.length) + 1;
  return {
    id: `ac-${(index % names.length) + 1}-${control}`,
    code: `AC-${(index % names.length) + 1}(${control})`,
    title: `${base}, enhancement ${control}`,
    inSet: index % 4 !== 0,
  };
});

function ControlDetail({
  control,
  level = "h2",
  formId,
}: {
  control: Control;
  level?: "h2" | "h3";
  /** A form the dialog's primary submits from its footer: a decision needs a rationale. */
  formId?: string;
}) {
  const [rationale, setRationale] = useState("");
  const [attempts, setAttempts] = useState(0);
  const field = useRef<HTMLTextAreaElement>(null);
  const invalid = attempts > 0 && !rationale.trim();
  // The form's own error handling: after a submit, and not as the reader types, focus goes to the
  // field that needs fixing.
  useEffect(() => {
    if (invalid) field.current?.focus();
  }, [attempts]);
  const body = (
    <Stack space="space.200">
      <Heading size="page" as={level}>
        {control.code} · {control.title}
      </Heading>
      <Text>
        The organization defines the {control.title.toLowerCase()} the system enforces, reviews them
        each year and records who approved the change.
      </Text>
      <Field invalid={invalid || undefined}>
        <FieldLabel>Rationale</FieldLabel>
        <Textarea
          ref={field}
          rows={3}
          value={rationale}
          onChange={(event) => setRationale(event.target.value)}
        />
        {invalid ? <FieldError>Enter why this control is tailored.</FieldError> : null}
      </Field>
    </Stack>
  );
  if (!formId) return body;
  return (
    <form
      id={formId}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setAttempts((count) => count + 1);
      }}
    >
      {body}
    </form>
  );
}

function NothingChosen() {
  return (
    <Empty size="compact">
      <EmptyHeader>
        <EmptyTitle>No control chosen</EmptyTitle>
        <EmptyDescription>
          Choose a control to read its statement and record a decision.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

/** The usage to copy: the caller owns the choice and the search; the pane lays them out. */
function Controls({
  controls = catalog,
  initial,
  level = "h2",
  defaultView,
  formId,
}: {
  controls?: Control[];
  initial?: string;
  level?: "h2" | "h3";
  defaultView?: WorkPaneView;
  formId?: string;
}) {
  const [chosen, setChosen] = useState<string | undefined>(initial);
  const [search, setSearch] = useState("");
  const shown = useMemo(() => {
    const query = search.trim().toLowerCase();
    return controls.filter(
      (item) =>
        !query ||
        item.code.toLowerCase().includes(query) ||
        item.title.toLowerCase().includes(query),
    );
  }, [controls, search]);
  const control = controls.find((item) => item.id === chosen);
  return (
    <WorkPane
      listWidth={300}
      {...(defaultView ? { defaultView } : {})}
      listLabel={<Text weight="medium">Catalog controls</Text>}
      listToolbar={
        <Stack space="space.075">
          <SearchField
            size="small"
            aria-label="Search catalog controls"
            placeholder="Find a control"
            value={search}
            onValueChange={setSearch}
          />
          <Text size="small" color="color.text.subtle">
            {shown.length} of {controls.length} controls
          </Text>
        </Stack>
      }
      backLabel="Back to controls"
      list={shown.map((item) => (
        <WorkPane.Row
          key={item.id}
          id={item.code}
          title={item.title}
          tone={item.inSet ? "success" : "neutral"}
          meta={item.inSet ? "In effective set" : "Outside effective set"}
          isActive={item.id === chosen}
          onSelect={() => setChosen(item.id)}
        />
      ))}
      listEmpty={
        <Empty size="compact">
          <EmptyHeader>
            <EmptyTitle>No control matches</EmptyTitle>
            <EmptyDescription>Change the search to find a catalog control.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="small" onClick={() => setSearch("")}>
              Show all controls
            </Button>
          </EmptyContent>
        </Empty>
      }
      detail={
        control ? (
          <ControlDetail
            key={control.id}
            control={control}
            level={level}
            {...(formId ? { formId } : {})}
          />
        ) : undefined
      }
      empty={<NothingChosen />}
    />
  );
}

const meta = {
  title: "Patterns/WorkPane",
  component: WorkPane,
  parameters: { layout: "padded" },
  args: {
    listLabel: "Catalog controls",
    list: catalog
      .slice(0, 4)
      .map((item) => (
        <WorkPane.Row
          key={item.id}
          id={item.code}
          title={item.title}
          isActive={item.id === "ac-2"}
          onSelect={() => undefined}
        />
      )),
    detail: <ControlDetail control={catalog[1]!} />,
  },
} satisfies Meta<typeof WorkPane>;
export default meta;
type Story = StoryObj<typeof meta>;

const isStacked = (root: HTMLElement) =>
  root.querySelector('[data-slot="work-pane"]')?.getAttribute("data-layout") === "stacked";

/**
 * Master-detail: the list is the navigation, and choosing a row shows its detail. From 768px of
 * pane the two sit side by side and focus stays on the row. Narrower (a phone, a panel, a dialog
 * on a phone), the pane is a drill-in: the detail takes the list's place, focus moves to its
 * heading, and Back returns focus to the row, with the draft kept. Each row is named by its id and
 * its title, and the open one says so.
 */
export const WorkPaneStory: Story = {
  name: "WorkPane",
  render: function WorkPaneExample() {
    const [chosen, setChosen] = useState<string | undefined>();
    const [search, setSearch] = useState("");
    const query = search.trim().toLowerCase();
    const shown = catalog.filter(
      (item) =>
        !query ||
        item.code.toLowerCase().includes(query) ||
        item.title.toLowerCase().includes(query),
    );
    const control = catalog.find((item) => item.id === chosen);
    return (
      <WorkPane
        listWidth={300}
        listLabel={<Text weight="medium">Catalog controls</Text>}
        listToolbar={
          <Stack space="space.075">
            <SearchField
              size="small"
              aria-label="Search catalog controls"
              placeholder="Find a control"
              value={search}
              onValueChange={setSearch}
            />
            <Text size="small" color="color.text.subtle">
              {shown.length} of {catalog.length} controls
            </Text>
          </Stack>
        }
        backLabel="Back to controls"
        list={shown.map((item) => (
          <WorkPane.Row
            key={item.id}
            id={item.code}
            title={item.title}
            tone={item.inSet ? "success" : "neutral"}
            meta={item.inSet ? "In effective set" : "Outside effective set"}
            isActive={item.id === chosen}
            onSelect={() => setChosen(item.id)}
          />
        ))}
        listEmpty={
          <Empty size="compact">
            <EmptyHeader>
              <EmptyTitle>No control matches</EmptyTitle>
              <EmptyDescription>Change the search to find a catalog control.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        }
        detail={control ? <ControlDetail key={control.id} control={control} /> : undefined}
        empty={<NothingChosen />}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("complementary", { name: "Catalog controls" })).toBeVisible();
    const list = canvas.getByRole("list", { name: "Catalog controls" });
    await expect(list).toBeVisible();
    const row = canvas.getByRole("button", { name: "AC-2, Account management" });
    await expect(row).toHaveAccessibleDescription("In effective set");
    await userEvent.click(row);
    await expect(row).toHaveAttribute("aria-current", "true");
    const heading = await canvas.findByRole("heading", { name: "AC-2 · Account management" });
    const pane = canvasElement.querySelector<HTMLElement>('[data-slot="work-pane"]')!;
    if (pane.getBoundingClientRect().width >= 768) {
      // From 768px of pane the list sits beside the detail and sticks under the shell's header.
      await expect(isStacked(canvasElement)).toBe(false);
      const side = canvasElement.querySelector<HTMLElement>('[data-slot="work-pane-list"]')!;
      await expect(getComputedStyle(side).position).toBe("sticky");
    }
    if (isStacked(canvasElement)) {
      // The detail takes the list's place, with its heading focused.
      await waitFor(() => expect(heading).toHaveFocus());
      await expect(list).not.toBeVisible();
      await userEvent.type(canvas.getByRole("textbox", { name: "Rationale" }), "Out of scope");
      await userEvent.click(canvas.getByRole("button", { name: "Back to controls" }));
      await waitFor(() => expect(row).toHaveFocus());
      await expect(list).toBeVisible();
      await expect(heading).not.toBeVisible();
      // The row opens its detail again from the keyboard, with the draft where it was.
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(heading).toHaveFocus());
      await expect(canvas.getByRole("textbox", { name: "Rationale" })).toHaveValue("Out of scope");
    } else {
      // Side by side, the list keeps focus and the detail changes beside it.
      await expect(heading).toBeVisible();
      await expect(row).toHaveFocus();
      await expect(canvas.queryByRole("button", { name: "Back to controls" })).toBeNull();
      const other = canvas.getByRole("button", { name: "AC-6, Least privilege" });
      await userEvent.click(other);
      await expect(canvas.getByRole("heading", { name: "AC-6 · Least privilege" })).toBeVisible();
      await expect(row).not.toHaveAttribute("aria-current");
      // The pane narrows under the reader (a zoom): the side they are on stays, with their focus.
      const frame =
        canvasElement.querySelector<HTMLElement>('[data-slot="work-pane"]')!.parentElement!;
      frame.style.maxWidth = "390px";
      try {
        await waitFor(() => expect(isStacked(canvasElement)).toBe(true));
        await expect(list).toBeVisible();
        await expect(other).toHaveFocus();
      } finally {
        frame.style.removeProperty("max-width");
      }
    }
  },
};

/**
 * The list is one Tab stop, the open row or the first: Up and Down move between rows, Home and End
 * go to the ends, and typing the start of a name goes to it. Tab leaves the list for the detail.
 */
export const OneTabStop: Story = {
  name: "One Tab stop",
  render: () => <Controls initial="ac-3" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const search = canvas.getByRole("searchbox", { name: "Search catalog controls" });
    const rows = canvas.getAllByRole("button", { name: /^AC-\d+, / });
    await expect(rows.filter((row) => row.tabIndex === 0)).toHaveLength(1);
    search.focus();
    await userEvent.tab();
    const open = canvas.getByRole("button", { name: "AC-3, Access enforcement" });
    await expect(open).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(
      canvas.getByRole("button", { name: "AC-4, Information flow enforcement" }),
    ).toHaveFocus();
    await userEvent.keyboard("{End}");
    await expect(
      canvas.getByRole("button", { name: "AC-12, Use of external systems" }),
    ).toHaveFocus();
    await userEvent.keyboard("{Home}");
    await expect(canvas.getByRole("button", { name: "AC-1, Policy and procedures" })).toHaveFocus();
    await userEvent.keyboard("l");
    await expect(canvas.getByRole("button", { name: "AC-6, Least privilege" })).toHaveFocus();
    // Tab leaves the list: the next stop is past every other row.
    await userEvent.tab();
    await expect(rows.some((row) => row === document.activeElement)).toBe(false);
    // Shift+Tab returns to the row the reader left.
    await userEvent.tab({ shift: true });
    await expect(canvas.getByRole("button", { name: "AC-6, Least privilege" })).toHaveFocus();
  },
};

/**
 * A phone-width pane with a long list: choosing a row far down shows its detail at the top, never
 * below 120 rows, and Back brings that row back into view with focus on it.
 */
export const DrillIn: Story = {
  name: "Drill-in, long list",
  render: () => (
    <Box style={{ maxWidth: 390 }}>
      <Controls controls={longCatalog} />
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(isStacked(canvasElement)).toBe(true);
    const first = canvas.getAllByRole("button", { name: /^AC-\d+\(\d+\), / })[0]!;
    first.focus();
    await userEvent.keyboard("{End}");
    const last = canvas.getByRole("button", {
      name: "AC-12(10), Use of external systems, enhancement 10",
    });
    await expect(last).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    const heading = await canvas.findByRole("heading", {
      name: "AC-12(10) · Use of external systems, enhancement 10",
    });
    await waitFor(() => expect(heading).toHaveFocus());
    const top = heading.getBoundingClientRect().top;
    await expect(top).toBeGreaterThanOrEqual(0);
    await expect(top).toBeLessThan(window.innerHeight);
    await userEvent.click(canvas.getByRole("button", { name: "Back to controls" }));
    await waitFor(() => expect(last).toHaveFocus());
    const box = last.getBoundingClientRect();
    await expect(box.top).toBeGreaterThanOrEqual(0);
    await expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
  },
};

function ControlsDialog() {
  return (
    <Dialog>
      <DialogTrigger render={<Button />}>Tailor controls</DialogTrigger>
      <DialogContent width="xlarge">
        <DialogHeader>
          <DialogTitle>Tailor controls</DialogTitle>
          <DialogDescription>Choose a control, then record why it is tailored.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Controls controls={longCatalog} level="h3" formId="tailor-decision" />
        </DialogBody>
        <DialogFooter>
          <DialogClose render={<Button variant="subtle" />}>Close</DialogClose>
          <Button variant="primary" type="submit" form="tailor-decision">
            Record decision
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * In a dialog the list sticks to the dialog's body. A focused row always lands below the label and
 * the search that stay put over the rows, however short the window. The footer's primary submits
 * the detail's form; stacked, a submit while the list shows brings the detail back, and the form
 * takes focus to the field that needs fixing.
 */
export const InADialog: Story = {
  name: "In a dialog",
  render: () => <ControlsDialog />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Tailor controls" }));
    const dialog = within(await body.findByRole("dialog", { name: "Tailor controls" }));
    const search = dialog.getByRole("searchbox", { name: "Search catalog controls" });
    const label = search.closest<HTMLElement>(".sticky")!;
    const clear = (row: HTMLElement) =>
      expect(row.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        label.getBoundingClientRect().bottom - 1,
      );
    dialog.getAllByRole("button", { name: /^AC-\d+\(\d+\), / })[0]!.focus();
    await userEvent.keyboard("{End}");
    const last = dialog.getByRole("button", {
      name: "AC-12(10), Use of external systems, enhancement 10",
    });
    await expect(last).toHaveFocus();
    for (let step = 0; step < 30; step++) await userEvent.keyboard("{ArrowUp}");
    const up = document.activeElement as HTMLElement;
    await expect(up).toHaveAccessibleName("AC-6(8), Least privilege, enhancement 8");
    await clear(up);
    await userEvent.keyboard("{Home}");
    await clear(document.activeElement as HTMLElement);
    // The primary submits the detail's form. Stacked, a submit while the list shows brings the
    // detail back, and the form's own error handling puts focus on the field.
    await userEvent.keyboard("{Enter}");
    const heading = await dialog.findByRole("heading", {
      name: "AC-1(1) · Policy and procedures, enhancement 1",
    });
    const pane = canvasElement.ownerDocument.querySelector<HTMLElement>(
      '[role="dialog"] [data-slot="work-pane"]',
    )!;
    if (pane.getAttribute("data-layout") === "stacked") {
      await waitFor(() => expect(heading).toHaveFocus());
      await userEvent.click(dialog.getByRole("button", { name: "Back to controls" }));
      await waitFor(() => expect(heading).not.toBeVisible());
    }
    const record = dialog.getByRole("button", { name: "Record decision" });
    await userEvent.click(record);
    const rationale = dialog.getByRole("textbox", { name: "Rationale" });
    await waitFor(() => expect(rationale).toHaveFocus());
    await expect(heading).toBeVisible();
    await expect(rationale).toHaveAttribute("aria-invalid", "true");
    // A submit that needs nothing fixed leaves focus on the primary.
    await userEvent.type(rationale, "Inherited from the enclave");
    await userEvent.click(record);
    await expect(record).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
  },
};

/**
 * Nothing chosen: `detail` is undefined and `empty` shows beside the list (stacked, the list shows
 * alone). A search that matches nothing shows `listEmpty` with its way out.
 */
export const NothingChosenAndNoMatches: Story = {
  name: "Nothing chosen and no matches",
  render: () => <Controls />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    if (isStacked(canvasElement))
      await expect(canvas.queryByText("No control chosen")).not.toBeVisible();
    else await expect(canvas.getByText("No control chosen")).toBeVisible();
    await userEvent.type(canvas.getByRole("searchbox", { name: "Search catalog controls" }), "zz");
    await expect(canvas.getByText("No control matches")).toBeVisible();
    await expect(canvas.getByText("0 of 12 controls")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Show all controls" }));
    await expect(canvas.getByRole("button", { name: "AC-1, Policy and procedures" })).toBeVisible();
  },
};

/** A caller that asks before it discards a draft: choosing another row returns the answer's promise. */
function GuardedControls() {
  const [chosen, setChosen] = useState<string | undefined>();
  const [draft, setDraft] = useState("");
  const [answer, setAnswer] = useState<((discard: boolean) => void) | null>(null);
  const choose = (id: string): boolean | Promise<boolean> => {
    if (id === chosen || !draft) {
      setChosen(id);
      return true;
    }
    return new Promise<boolean>((resolve) => {
      setAnswer(() => (discard: boolean) => {
        setAnswer(null);
        if (discard) {
          setChosen(id);
          setDraft("");
        }
        resolve(discard);
      });
    });
  };
  const control = catalog.find((item) => item.id === chosen);
  return (
    <>
      <WorkPane
        listWidth={300}
        listLabel={<Text weight="medium">Catalog controls</Text>}
        backLabel="Back to controls"
        list={catalog.map((item) => (
          <WorkPane.Row
            key={item.id}
            id={item.code}
            title={item.title}
            isActive={item.id === chosen}
            onSelect={() => choose(item.id)}
          />
        ))}
        detail={
          control ? (
            <Stack space="space.200">
              <Heading size="page" as="h2">
                {control.code} · {control.title}
              </Heading>
              <Field>
                <FieldLabel>Rationale</FieldLabel>
                <Textarea
                  rows={3}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
              </Field>
            </Stack>
          ) : undefined
        }
        empty={<NothingChosen />}
      />
      <AlertDialog
        open={answer !== null}
        onOpenChange={(open) => {
          if (!open) answer?.(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard the rationale?</AlertDialogTitle>
            <AlertDialogDescription>
              The rationale you started for this control is not saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction variant="danger" onClick={() => answer?.(true)}>
              Discard rationale
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/**
 * A guard that asks first: `onSelect` returns the answer's promise. Keep editing stays where the
 * reader was, with focus back on the row they chose; Discard opens the chosen row's detail, and
 * stacked, focus lands on its heading once the question has closed.
 */
export const GuardedChoice: Story = {
  name: "Guarded choice",
  render: () => <GuardedControls />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const stacked = isStacked(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "AC-2, Account management" }));
    await userEvent.type(canvas.getByRole("textbox", { name: "Rationale" }), "Out of scope");
    if (stacked) await userEvent.click(canvas.getByRole("button", { name: "Back to controls" }));
    // Keep editing: nothing changes, and focus is back on the row the reader chose.
    const other = canvas.getByRole("button", { name: "AC-6, Least privilege" });
    await userEvent.click(other);
    const question = await body.findByRole("alertdialog", { name: "Discard the rationale?" });
    await userEvent.click(within(question).getByRole("button", { name: "Keep editing" }));
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
    await waitFor(() => expect(other).toHaveFocus());
    await expect(other).not.toHaveAttribute("aria-current");
    await expect(canvas.getByRole("textbox", { name: "Rationale", hidden: true })).toHaveValue(
      "Out of scope",
    );
    // Discard: the chosen row's detail opens, with focus where the reader can go on.
    await userEvent.click(other);
    const again = await body.findByRole("alertdialog", { name: "Discard the rationale?" });
    await userEvent.click(within(again).getByRole("button", { name: "Discard rationale" }));
    await waitFor(() => expect(body.queryByRole("alertdialog")).toBeNull());
    const heading = await canvas.findByRole("heading", { name: "AC-6 · Least privilege" });
    await expect(other).toHaveAttribute("aria-current", "true");
    if (stacked) await waitFor(() => expect(heading).toHaveFocus());
    else await waitFor(() => expect(other).toHaveFocus());
    await expect(canvas.getByRole("textbox", { name: "Rationale" })).toHaveValue("");
  },
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  tags: ["!manifest"],
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <WorkPane
            listLabel={<VisuallyHidden>Catalog controls</VisuallyHidden>}
            listToolbar={
              <SearchField
                size="small"
                aria-label="Search catalog controls"
                placeholder="Find a control"
              />
            }
            list={catalog.slice(0, 3).map((item) => (
              <WorkPane.Row
                key={item.id}
                id={item.code}
                title={item.title}
                onSelect={() => undefined}
              />
            ))}
            empty={<NothingChosen />}
          />
        }
        doText="The label names the list, and the search sits in listToolbar under it."
        dont={
          <WorkPane
            listLabel={
              <SearchField
                size="small"
                aria-label="Search catalog controls"
                placeholder="Find a control"
              />
            }
            list={catalog.slice(0, 3).map((item) => (
              <WorkPane.Row
                key={item.id}
                id={item.code}
                title={item.title}
                onSelect={() => undefined}
              />
            ))}
            detail={
              <Text size="small" color="color.text.subtle">
                Choose a control.
              </Text>
            }
          />
        }
        dontText="A search as the label, and a grey sentence as the detail: the list has no name, and nothing-chosen is not an Empty."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
