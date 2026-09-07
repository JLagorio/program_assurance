import type { Decorator, Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState, type ComponentProps } from "react";

import { Alert, AlertDialog, Button, Toaster, toast } from "../../components";
import { toastClasses, toastIcons } from "../../components/toaster";
import { Box, Inline, Stack, Text } from "../../primitives";
import { Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

/* One Toaster on a docs page, however many stories it embeds: the first story to mount keeps it,
   the rest fire into it. A story opened alone mounts its own. */
let mounted = 0;
function OneToaster(props: ComponentProps<typeof Toaster>) {
  const [mine] = useState(() => mounted === 0);
  useEffect(() => {
    if (!mine) return;
    mounted += 1;
    return () => {
      mounted -= 1;
    };
  }, [mine]);
  return mine ? <Toaster {...props} /> : null;
}

const withToaster: Decorator = (Story, context) => (
  <>
    <OneToaster {...context.args} />
    <Story />
  </>
);

const meta = {
  title: "Components/Toaster",
  component: Toaster,
  parameters: { layout: "padded" },
  decorators: [withToaster],
} satisfies Meta<typeof Toaster>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The kinds, fired from a button: a plain toast, and one per tone with the tone's mark. */
export const Toasts: Story = {
  render: () => (
    <Inline space="space.100" shouldWrap>
      <Button variant="secondary" onClick={() => toast("Saved")}>
        Plain
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast.success("Evidence linked", { description: "Bank reconciliation, July" })
        }
      >
        Success
      </Button>
      <Button variant="secondary" onClick={() => toast.info("Three artifacts expire this month")}>
        Info
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast.warning("Due in 2 days", { description: "The assessment of AC-2." })}
      >
        Warning
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast.error("Could not save", { description: "The owner must be on the programme." })
        }
      >
        Error
      </Button>
    </Inline>
  ),
};

/** `action`: one verb the reader may still take, Undo mostly. `cancel` is the quiet second. */
function UndoExample() {
  const [archived, setArchived] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  return (
    <Stack space="space.200">
      <Text role="status">PRG-1041 is {archived ? "archived" : "active"} in this example.</Text>
      <Inline space="space.100" shouldWrap>
        <Button
          disabled={archived}
          onClick={() => {
            setArchived(true);
            toast.success("Archived PRG-1041", {
              action: {
                label: "Undo",
                onClick: () => {
                  setArchived(false);
                  toast("Restored PRG-1041");
                },
              },
            });
          }}
        >
          Archive example
        </Button>
        <Button
          onClick={() =>
            toast.info("3 controls updated", {
              action: { label: "View", onClick: () => setShowDetails(true) },
              cancel: { label: "Dismiss", onClick: () => setShowDetails(false) },
            })
          }
        >
          View and Dismiss
        </Button>
      </Inline>
      {showDetails ? <Text>Updated controls: AC-1, AC-2, AC-3.</Text> : null}
    </Stack>
  );
}
export const WithAction: Story = {
  render: () => <UndoExample />,
  play: async ({ canvasElement }) => {
    const { expect, userEvent, within } = await import("storybook/test");
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Archive example" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("archived");
    await userEvent.click(
      await within(canvasElement.ownerDocument.body).findByRole("button", {
        name: "Undo",
      }),
    );
    await expect(canvas.getByRole("status")).toHaveTextContent("active");
    await userEvent.click(canvas.getByRole("button", { name: "View and Dismiss" }));
    await userEvent.click(
      await within(canvasElement.ownerDocument.body).findByRole("button", {
        name: "View",
      }),
    );
    await expect(canvas.getByText("Updated controls: AC-1, AC-2, AC-3.")).toBeVisible();
    toast.dismiss();
  },
};

/** An error stays eight seconds and carries a close; a reader who looked away still finds it. */
export const Errors: Story = {
  render: () => (
    <Inline space="space.100" shouldWrap>
      <Button variant="secondary" onClick={() => toast.error("Could not reach the evidence store")}>
        Error, eight seconds
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast.error("Export failed", {
            description: "The package is missing the SAR. Add it and export again.",
            duration: Infinity,
          })
        }
      >
        Error that stays
      </Button>
    </Inline>
  ),
};

const build = () => new Promise<string>((r) => setTimeout(() => r("PRG-0994-CDR-SSP.zip"), 1800));

/** `toast.promise`: one toast that says working, then what came of it. `toast.loading` is the first half alone. */
export const Working: Story = {
  render: () => (
    <Inline space="space.100" shouldWrap>
      <Button
        variant="secondary"
        onClick={() =>
          toast.promise(build(), {
            loading: "Building the package…",
            success: (file) => `${file} ready`,
            error: "Could not build the package",
          })
        }
      >
        Build the package
      </Button>
      <Button
        variant="secondary"
        onClick={() => {
          const id = toast.loading("Generating the report…");
          setTimeout(() => toast.success("Report ready", { id }), 1500);
        }}
      >
        Loading, then done
      </Button>
    </Inline>
  ),
};

type Kind = "plain" | "success" | "info" | "warning" | "error" | "loading";

/** A toast drawn with the Toaster's classes and marks, for the page: the live one is the same DOM under sonner. */
function Specimen({
  kind,
  title,
  description,
  action,
  cancel,
  close,
}: {
  kind: Kind;
  title: string;
  description?: string | undefined;
  action?: string | undefined;
  cancel?: string | undefined;
  close?: boolean | undefined;
}) {
  return (
    <div className={toastClasses.toast} style={{ width: 356 }}>
      {close ? (
        <button type="button" aria-label="Close" className={toastClasses.closeButton}>
          {toastIcons.close}
        </button>
      ) : null}
      {kind !== "plain" ? <span className={toastClasses.icon}>{toastIcons[kind]}</span> : null}
      <div className={toastClasses.content}>
        <div className={toastClasses.title}>{title}</div>
        {description ? <div className={toastClasses.description}>{description}</div> : null}
      </div>
      {cancel ? (
        <button type="button" className={toastClasses.cancelButton}>
          {cancel}
        </button>
      ) : null}
      {action ? (
        <button type="button" className={toastClasses.actionButton}>
          {action}
        </button>
      ) : null}
    </div>
  );
}

/** Every kind at rest, then the shapes a toast takes: a title alone, with a description, with an action, an error with its close, working. Drawn with the Toaster's classes; the buttons above fire the live ones. */
export const ToasterMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Specimens title="kinds">
        <Specimen kind="plain" title="Saved" />
        <Specimen kind="success" title="Evidence linked" />
        <Specimen kind="info" title="Three artifacts expire this month" />
        <Specimen kind="warning" title="Due in 2 days" />
        <Specimen kind="error" title="Could not save" close />
      </Specimens>
      <Specimens title="shapes">
        <Specimen kind="success" title="Evidence linked" description="Bank reconciliation, July" />
        <Specimen
          kind="success"
          title="Archived PRG-1041"
          description="Its controls stay readable."
          action="Undo"
        />
        <Specimen kind="info" title="3 controls updated" action="View" cancel="Dismiss" />
        <Specimen
          kind="error"
          title="Export failed"
          description="The package is missing the SAR. Add it and export again."
          close
        />
        <Specimen kind="loading" title="Building the package…" />
      </Specimens>
    </Stack>
  ),
};

function DeleteDialog() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Delete finding
      </Button>
      <AlertDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Delete F-0088?"
        description="Its evidence stays; the finding and its history go."
        confirmLabel="Delete"
        onConfirm={() => {
          setOpen(false);
          toast.success("Deleted F-0088", { action: { label: "Undo", onClick: () => undefined } });
        }}
      />
    </>
  );
}

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Stack space="space.150">
            <DeleteDialog />
            <Specimen kind="success" title="Deleted F-0088" action="Undo" />
          </Stack>
        }
        doText="The question is an AlertDialog; the toast confirms what was done and offers Undo."
        dont={
          <Specimen
            kind="warning"
            title="Delete F-0088?"
            description="This cannot be undone."
            action="Delete"
            cancel="Keep"
          />
        }
        dontText="A toast that asks. It goes in four seconds, it sits in the corner while the reader works, and Enter does not answer it."
      />
      <Pair
        do={
          <Box className="w-layout-list">
            <Alert tone="warning" title="Assessment overdue">
              AC-2 was due on 12 Aug. Record the assessment or move the date.
            </Alert>
          </Box>
        }
        doText="A condition of the record is an Alert on the record: true until the record changes, read by every reader."
        dont={
          <Specimen
            kind="warning"
            title="Assessment overdue"
            description="AC-2 was due on 12 Aug."
          />
        }
        dontText="A record's state as a toast. It is gone in four seconds and the next reader never sees it."
      />
      <Pair
        do={
          <Specimen
            kind="success"
            title="Evidence linked"
            description="Bank reconciliation, July"
          />
        }
        doText="The title is what happened, past tense, with the object; the description names the thing."
        dont={
          <Specimen
            kind="success"
            title="Success!"
            description="The evidence has been successfully linked to the control."
          />
        }
        dontText="A cheer for a title and the outcome in the description. The reader glances at the title and learns nothing."
      />
    </Stack>
  ),
};

export const Playground: Story = {
  args: { position: "bottom-right", expand: false, closeButton: false },
  render: () => (
    <Stack space="space.150">
      <Inline space="space.100">
        <Button
          variant="secondary"
          onClick={() =>
            toast.success("Evidence linked", { description: "Bank reconciliation, July" })
          }
        >
          Fire one
        </Button>
        <Button variant="secondary" onClick={() => toast.error("Could not save")}>
          Fire an error
        </Button>
      </Inline>
    </Stack>
  ),
};
