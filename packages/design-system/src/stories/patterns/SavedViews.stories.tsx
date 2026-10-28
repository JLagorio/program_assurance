import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../../components/button";
import { Stack, Text } from "../../primitives";
import {
  SavedViewPicker,
  SavedViewManager,
  SavedViewEditor,
  type SavedViewDraft,
} from "../../patterns/saved-views";

const meta = {
  title: "Patterns/SavedViews",
  component: SavedViewPicker,
  parameters: { layout: "padded" },
  args: {
    views: [
      { id: "personal", name: "My open items", visibilityLabel: "Private" },
      { id: "team", name: "Team review", visibilityLabel: "Shared" },
      {
        id: "unsupported",
        name: "Older layout",
        disabledReason: "This layout is no longer available.",
      },
    ],
    open: false,
    onOpenChange: fn(),
    onApply: fn(),
    onCreate: fn(),
    onManage: fn(),
  },
} satisfies Meta<typeof SavedViewPicker>;
export default meta;
type Story = StoryObj<typeof meta>;

/** One menu in a collection toolbar; the host receives the stable selected id. */
export const Picker: Story = {
  render: function Picker(args) {
    const [open, setOpen] = useState(false);
    return <SavedViewPicker {...args} open={open} onOpenChange={setOpen} />;
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    const trigger = canvas.getByRole("button", { name: "Saved views" });
    await user.click(trigger);
    const menu = await body.findByRole("menu");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(within(menu).getByRole("menuitem", { name: "Older layout" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await expect(
      within(menu).getByRole("menuitem", { name: "Older layout" }),
    ).toHaveAccessibleDescription("This layout is no longer available.");
    await user.click(within(menu).getByRole("menuitem", { name: "Team review" }));
    await expect(args.onApply).toHaveBeenCalledWith("team");
    await user.click(trigger);
    await body.findByRole("menu");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

/** Management exposes only supplied capabilities. Search and long names fit a phone. */
export const Manager: Story = {
  render: function Manager() {
    const [open, setOpen] = useState(false);
    const [favorite, setFavorite] = useState(false);
    const [action, setAction] = useState("No action requested");
    return (
      <Stack space="space.150">
        <Button onClick={() => setOpen(true)}>Manage views</Button>
        <SavedViewManager
          open={open}
          onOpenChange={setOpen}
          description="Apply a named view or manage the views you own."
          feedback={<Text role="status">{action}</Text>}
          views={[
            {
              id: "personal",
              name: "My open items",
              visibilityLabel: "Private",
              favorite,
              canEdit: true,
              canDuplicate: true,
              canDelete: true,
            },
            {
              id: "team",
              name: "Shared operations review with a very long descriptive name for weekly planning and handover",
              visibilityLabel: "Shared",
              canDuplicate: true,
            },
          ]}
          onApply={(id) => setAction(`Applied ${id}`)}
          onCreate={() => setAction("Create requested")}
          onFavoriteChange={(_, next) => setFavorite(next)}
          onEdit={(id) => setAction(`Edit ${id}`)}
          onDuplicate={(id) => setAction(`Duplicate ${id}`)}
          onDelete={(id) => setAction(`Confirm deletion of ${id}`)}
        />
      </Stack>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    await user.click(canvas.getByRole("button", { name: "Manage views" }));
    const dialog = await body.findByRole("dialog", { name: "Saved views" });
    const own = within(dialog).getByRole("listitem", { name: "My open items" });
    const shared = within(dialog).getByRole("listitem", { name: /^Shared operations/ });
    await expect(within(shared).queryByRole("button", { name: "Edit" })).toBeNull();
    await expect(within(shared).queryByRole("button", { name: "Delete" })).toBeNull();
    await user.click(within(own).getByRole("button", { name: "Favorite" }));
    await expect(within(own).getByRole("button", { name: "Unfavorite" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await user.click(within(own).getByRole("button", { name: "Edit" }));
    await expect(within(dialog).getByRole("status")).toHaveTextContent("Edit personal");
    await user.click(within(shared).getByRole("button", { name: "Duplicate" }));
    await expect(within(dialog).getByRole("status")).toHaveTextContent("Duplicate team");
    await user.click(within(own).getByRole("button", { name: "Delete" }));
    await expect(within(dialog).getByRole("status")).toHaveTextContent(
      "Confirm deletion of personal",
    );
    const search = within(dialog).getByRole("searchbox", { name: "Find saved views" });
    await user.type(search, "missing");
    await expect(within(dialog).getByText("No views match this search.")).toBeVisible();
    await user.clear(search);
    await expect(within(dialog).getAllByRole("listitem")).toHaveLength(2);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(canvas.getByRole("button", { name: "Manage views" })).toHaveFocus());
  },
};

/** The host retains a failed draft; retry uses the same name, sharing choice and settings. */
export const Editor: Story = {
  render: function Editor() {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState<SavedViewDraft>({
      name: "Weekly review",
      visibility: "private",
      replaceSettings: false,
    });
    const [error, setError] = useState<string>();
    const [saved, setSaved] = useState(false);
    return (
      <Stack space="space.150">
        <Button onClick={() => setOpen(true)}>Edit view</Button>
        <Text role="status">{saved ? "View saved" : "Unsaved view"}</Text>
        <SavedViewEditor
          open={open}
          onOpenChange={setOpen}
          title="Edit saved view"
          description="Name this view and choose who can use it."
          value={value}
          onValueChange={setValue}
          visibilityOptions={[
            { value: "private", label: "Only me" },
            { value: "shared", label: "Team", disabledReason: "Sharing requires an editor role." },
          ]}
          showReplaceSettings
          error={error}
          submitLabel="Save view"
          onSubmit={() => {
            if (!error) setError("Connection interrupted. Try saving again.");
            else {
              setSaved(true);
              setOpen(false);
            }
          }}
        />
      </Stack>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    await user.click(canvas.getByRole("button", { name: "Edit view" }));
    const dialog = await body.findByRole("dialog", { name: "Edit saved view" });
    const name = within(dialog).getByRole("textbox", { name: "Name" });
    await waitFor(() => expect(name).toHaveFocus());
    await user.clear(name);
    await expect(within(dialog).getByRole("button", { name: "Save view" })).toBeDisabled();
    await user.type(name, "Review queue");
    await user.click(within(dialog).getByRole("combobox", { name: "Visibility" }));
    const option = await body.findByRole("option", { name: "Team" });
    await expect(option).toHaveAttribute("aria-disabled", "true");
    await expect(option).toHaveAccessibleDescription("Sharing requires an editor role.");
    await user.keyboard("{Escape}");
    await user.click(
      within(dialog).getByRole("checkbox", { name: "Replace settings with the current view" }),
    );
    await user.click(within(dialog).getByRole("button", { name: "Save view" }));
    await expect(within(dialog).getByRole("alert")).toHaveTextContent("Connection interrupted");
    await expect(name).toHaveValue("Review queue");
    await expect(within(dialog).getByRole("checkbox")).toBeChecked();
    await user.click(within(dialog).getByRole("button", { name: "Save view" }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await expect(canvas.getByRole("status")).toHaveTextContent("View saved");
    await expect(canvas.getByRole("button", { name: "Edit view" })).toHaveFocus();
  },
};

/** Read failures retain views and expose retry; a pending editor blocks dismissal and duplicate submits. */
export const PendingAndRetry: Story = {
  tags: ["!manifest"],
  render: function PendingAndRetry() {
    const [manager, setManager] = useState(false);
    const [editor, setEditor] = useState(false);
    const [error, setError] = useState<string>("The view list could not be refreshed.");
    return (
      <Stack space="space.150">
        <Button onClick={() => setManager(true)}>Open failed list</Button>
        <Button onClick={() => setEditor(true)}>Open pending editor</Button>
        <SavedViewManager
          open={manager}
          onOpenChange={setManager}
          views={[]}
          error={error}
          onRetry={() => setError("")}
          onApply={() => undefined}
        />
        <SavedViewEditor
          open={editor}
          onOpenChange={setEditor}
          pending
          title="Save current view"
          value={{ name: "Weekly review", visibility: "private", replaceSettings: false }}
          onValueChange={() => undefined}
          visibilityOptions={[{ value: "private", label: "Only me" }]}
          onSubmit={() => undefined}
          submitLabel="Save view"
        />
      </Stack>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    await user.click(canvas.getByRole("button", { name: "Open failed list" }));
    const manager = await body.findByRole("dialog", { name: "Saved views" });
    await expect(within(manager).getByRole("alert")).toHaveTextContent("could not be refreshed");
    await user.click(within(manager).getByRole("button", { name: "Retry" }));
    await expect(within(manager).getByRole("status")).toHaveTextContent("No saved views yet.");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(manager).not.toBeInTheDocument());
    await user.click(canvas.getByRole("button", { name: "Open pending editor" }));
    const editor = await body.findByRole("dialog", { name: "Save current view" });
    await expect(editor).toHaveAttribute("aria-busy", "true");
    await expect(within(editor).getByRole("textbox", { name: "Name" })).toBeDisabled();
    await expect(within(editor).getByRole("button", { name: "Cancel" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await user.keyboard("{Escape}");
    await expect(editor).toBeVisible();
  },
};

const pickerRef = createRef<HTMLSpanElement>();
const triggerRef = createRef<HTMLButtonElement>();
const managerRef = createRef<HTMLDivElement>();
const editorRef = createRef<HTMLFormElement>();
/** Native refs/attributes reach each public part and the picker exposes its focus target. */
export const NativeAttributes: Story = {
  tags: ["!manifest"],
  render: function NativeAttributes() {
    const [open, setOpen] = useState(false);
    const [manager, setManager] = useState(false);
    const [editor, setEditor] = useState(false);
    return (
      <>
        <SavedViewPicker
          ref={pickerRef}
          triggerRef={triggerRef}
          data-testid="picker"
          open={open}
          onOpenChange={setOpen}
          views={[]}
          onApply={() => undefined}
          onManage={() => setManager(true)}
          onCreate={() => setEditor(true)}
        />
        <SavedViewManager
          ref={managerRef}
          data-testid="manager"
          open={manager}
          onOpenChange={setManager}
          views={[]}
          onApply={() => undefined}
          finalFocus={triggerRef}
        />
        <SavedViewEditor
          ref={editorRef}
          data-testid="editor"
          open={editor}
          onOpenChange={setEditor}
          title="New view"
          value={{ name: "", visibility: "private", replaceSettings: false }}
          onValueChange={() => undefined}
          visibilityOptions={[{ value: "private", label: "Only me" }]}
          onSubmit={() => undefined}
          submitLabel="Save"
          finalFocus={triggerRef}
        />
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    await expect(pickerRef.current).toBe(canvas.getByTestId("picker"));
    await expect(triggerRef.current).toBe(canvas.getByRole("button", { name: "Saved views" }));
    await user.click(triggerRef.current!);
    await user.click(await body.findByRole("menuitem", { name: "Manage saved views…" }));
    await body.findByRole("dialog", { name: "Saved views" });
    await expect(managerRef.current).toBe(body.getByTestId("manager"));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(triggerRef.current).toHaveFocus());
    await user.click(triggerRef.current!);
    await user.click(await body.findByRole("menuitem", { name: "Save current view…" }));
    await body.findByRole("dialog", { name: "New view" });
    await expect(editorRef.current).toBe(body.getByTestId("editor"));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(triggerRef.current).toHaveFocus());
  },
};

/** Keep the management surface open for narrow, long-content, touch and focus-ring checks. */
export const LongNames: Story = {
  tags: ["!manifest"],
  render: function LongNames() {
    const [open, setOpen] = useState(true);
    const [favorite, setFavorite] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Manage views</Button>
        <SavedViewManager
          open={open}
          onOpenChange={setOpen}
          description="Choose the saved layout that matches this review."
          views={[
            {
              id: "long",
              name: "Shared operations review with a very long descriptive name for weekly planning and handover",
              visibilityLabel: "Shared",
              canEdit: true,
              canDuplicate: true,
              canDelete: true,
              favorite,
            },
            {
              id: "private",
              name: "My items awaiting feedback",
              visibilityLabel: "Private",
              canDuplicate: true,
            },
          ]}
          onApply={() => undefined}
          onEdit={() => undefined}
          onDuplicate={() => undefined}
          onDelete={() => undefined}
          onFavoriteChange={(_, next) => setFavorite(next)}
          onCreate={() => undefined}
        />
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const user = userEvent.setup({ document: canvasElement.ownerDocument });
    const dialog = await body.findByRole("dialog", { name: "Saved views" });
    const row = within(dialog).getByRole("listitem", { name: /^Shared operations review/ });
    await expect(
      within(row).getByRole("button", { name: /^Shared operations review/ }),
    ).toHaveAccessibleName(
      "Shared operations review with a very long descriptive name for weekly planning and handover",
    );
    await user.click(within(row).getByRole("button", { name: "Favorite" }));
    await expect(within(row).getByRole("button", { name: "Unfavorite" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  },
};
