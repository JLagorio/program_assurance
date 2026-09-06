import { riskDraft, saveRiskDraft } from "@/lib/risk-store";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { Button, Stack, Toaster } from "@ledger/design-system";
import { CreateRiskDialog } from "@/components/app/risk-create-dialog";
import { UnavailableAction } from "@/components/app/unavailable-action";

function RiskWorkflow() {
  const [open, setOpen] = useState(false);
  return (
    <Stack space="space.200">
      <p>The actual create-risk dialog. Drafts and created records are saved to this browser.</p>
      <Button onClick={() => setOpen(true)}>New risk</Button>
      <UnavailableAction
        reason="Artifact storage is not connected. Uploads are unavailable."
        variant="secondary"
      >
        Upload artifact
      </UnavailableAction>
      {open ? <CreateRiskDialog open onClose={() => setOpen(false)} /> : null}
      <Toaster />
    </Stack>
  );
}

const meta = {
  title: "Product/Action outcomes",
  component: RiskWorkflow,
  tags: ["app-contract"],
  globals: { theme: "ledger" },
  parameters: { layout: "padded", a11y: { test: "error" } },
  beforeEach: () => {
    const key = "equinox.risks.v1";
    const stored = window.localStorage.getItem(key);
    const originalDraft = riskDraft();
    return () => {
      saveRiskDraft(originalDraft);
      if (stored === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, stored);
    };
  },
} satisfies Meta<typeof RiskWorkflow>;
export default meta;
type Story = StoryObj<typeof meta>;

export const DraftReopens: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "New risk" }));
    let dialog = within(await within(canvasElement.ownerDocument.body).findByRole("dialog"));
    await userEvent.clear(dialog.getByRole("textbox", { name: "Title" }));
    await userEvent.type(
      dialog.getByRole("textbox", { name: "Title" }),
      "Review the export permissions",
    );
    await userEvent.click(dialog.getByRole("button", { name: "Save draft" }));
    await userEvent.click(canvas.getByRole("button", { name: "New risk" }));
    dialog = within(await within(canvasElement.ownerDocument.body).findByRole("dialog"));
    await expect(dialog.getByRole("textbox", { name: "Title" })).toHaveValue(
      "Review the export permissions",
    );
  },
};

export const InvalidScoreStaysOpen: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "New risk" }));
    const dialog = within(await within(canvasElement.ownerDocument.body).findByRole("dialog"));
    await userEvent.clear(dialog.getByRole("textbox", { name: "Title" }));
    await userEvent.type(
      dialog.getByRole("textbox", { name: "Title" }),
      "Scoring validation example",
    );
    const likelihood = dialog.getByRole("spinbutton", { name: "Likelihood (1–5)" });
    await userEvent.clear(likelihood);
    await userEvent.type(likelihood, "6");
    await userEvent.click(dialog.getByRole("button", { name: "Create risk" }));
    await expect(dialog.getByRole("alert")).toHaveTextContent("whole numbers from 1 to 5");
    await expect(dialog.getByRole("textbox", { name: "Title" })).toHaveValue(
      "Scoring validation example",
    );
  },
};

export const StorageFailureKeepsInput: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "New risk" }));
    const dialog = within(await within(canvasElement.ownerDocument.body).findByRole("dialog"));
    await userEvent.clear(dialog.getByRole("textbox", { name: "Title" }));
    await userEvent.type(
      dialog.getByRole("textbox", { name: "Title" }),
      "Do not discard my changes",
    );
    const original = Storage.prototype.setItem;
    try {
      Storage.prototype.setItem = () => {
        throw new Error("Browser storage is full.");
      };
      await userEvent.click(dialog.getByRole("button", { name: "Save draft" }));
      await expect(dialog.getByRole("alert")).toHaveTextContent("Browser storage is full.");
      await expect(dialog.getByRole("textbox", { name: "Title" })).toHaveValue(
        "Do not discard my changes",
      );
    } finally {
      Storage.prototype.setItem = original;
    }
  },
};
