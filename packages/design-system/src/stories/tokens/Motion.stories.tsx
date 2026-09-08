import { ChevronDown } from "lucide-react";
import { Collapsible, Count } from "../../components";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import {
  Button,
  Dialog,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Sheet,
  Spinner,
  Stat,
} from "../../components";

import { Box, Inline, Stack, Text } from "../../primitives";

const meta = { title: "Tokens/Motion", parameters: { layout: "padded" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/** Each kind of move, live: a popover, a section, a dialog, a sheet, and a set of tiles arriving one after the other. */
export const Specimens: Story = {
  render: () => {
    const [dialog, setDialog] = useState(false);
    const [sheet, setSheet] = useState(false);
    const [round, setRound] = useState(0);
    return (
      <Stack space="space.300">
        <Inline space="space.100" alignBlock="center" shouldWrap>
          <Popover>
            <PopoverTrigger
              render={
                <Button variant="secondary" size="small">
                  Popover
                </Button>
              }
            />
            <PopoverContent aria-label="A popover">
              <Text size="small" color="color.text.subtle">
                Arrives in medium on the enter curve; leaves in fast on the exit curve.
              </Text>
            </PopoverContent>
          </Popover>
          <Button variant="secondary" size="small" onClick={() => setDialog(true)}>
            Dialog
          </Button>
          <Button variant="secondary" size="small" onClick={() => setSheet(true)}>
            Sheet
          </Button>
          <Button variant="secondary" size="small" onClick={() => setRound((r) => r + 1)}>
            Replay the tiles
          </Button>
        </Inline>
        <Box style={{ width: 360 }}>
          <Collapsible className="border-t border-default">
            <h3>
              <Collapsible.Trigger className="group/collapsible flex w-full items-center gap-100 py-100 text-start font-body font-semibold hover:bg-neutral-subtle-hovered">
                {"A section that opens and closes"} <Count value={3} />
                <ChevronDown
                  aria-hidden="true"
                  className="ms-auto size-icon-small shrink-0 transition-transform duration-fast ease-standard group-data-[state=open]/collapsible:rotate-180"
                />
              </Collapsible.Trigger>
            </h3>
            <Collapsible.Content>
              <div className="pb-200">
                <Text size="small" color="color.text.subtle">
                  Height and opacity together: medium on the enter curve opening, medium on the exit
                  curve closing.
                </Text>
              </div>
            </Collapsible.Content>
          </Collapsible>
        </Box>
        <Stat.Grid key={round} cols={4}>
          <Stat.Tile label="Coverage" value="80%" note="298 of 372" tone="success" />
          <Stat.Tile label="Not satisfied" value={74} note="26 other · 40 partial" tone="danger" />
          <Stat.Tile label="Open findings" value={5} note="1 CAT I" tone="danger" />
          <Stat.Tile label="Gates remaining" value={5} note="Next: MS-C" />
        </Stat.Grid>
        <Text size="small" color="color.text.subtlest">
          The tiles rise in moderate, each one stagger step after the last. The blanket under the
          dialog and the sheet dims in slower; the dialog arrives in moderate and leaves in medium;
          the sheet slides in on the enter curve and out on the standard curve, because it stays
          nearby.
        </Text>
        <Dialog
          open={dialog}
          onClose={() => setDialog(false)}
          title="A dialog"
          description="The blanket dims in slower while the dialog arrives in moderate on the enter curve. It leaves in medium on the exit curve."
          footer={
            <Button variant="primary" onClick={() => setDialog(false)}>
              Close
            </Button>
          }
        >
          <Text size="small" color="color.text.subtle">
            Nothing bounces, stretches or stops suddenly.
          </Text>
        </Dialog>
        <Sheet open={sheet} onClose={() => setSheet(false)} title="A sheet">
          <Text size="small" color="color.text.subtle">
            Slides in from the end in moderate on the enter curve; slides out in medium on the
            standard curve.
          </Text>
        </Sheet>
      </Stack>
    );
  },
};

/** Checks the generated state variants, including the reduced-motion media rules. */
export const Preference: Story = {
  render: () => (
    <Stack space="space.200">
      <div data-testid="motion-enter" data-state="open" className="data-[state=open]:animate-enter">
        Overlay arrives
      </div>
      <div
        data-testid="motion-exit"
        data-state="closed"
        className="data-[state=closed]:animate-exit"
      >
        Overlay leaves
      </div>
      <div
        data-testid="motion-slide"
        data-state="open"
        className="data-[state=open]:animate-slide-in-end"
      >
        Panel arrives from the logical end
      </div>
      <Spinner label="Refreshing records" />
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const { expect, within } = await import("storybook/test");
    const canvas = within(canvasElement);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    for (const name of ["motion-enter", "motion-exit", "motion-slide"]) {
      const duration = Number.parseFloat(
        getComputedStyle(canvas.getByTestId(name)).animationDuration,
      );
      if (reduced) await expect(duration).toBeLessThanOrEqual(0.001);
      else await expect(duration).toBeGreaterThan(0.001);
    }
    await expect(getComputedStyle(canvas.getByTestId("motion-slide")).animationName).toBe(
      "ds-slide-in-end",
    );
    const status = canvas.getByRole("status", { name: "Refreshing records" });
    await expect(getComputedStyle(status).animationName).toBe(reduced ? "none" : "spin");
  },
};
