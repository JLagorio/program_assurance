import type { ReactNode } from "react";

import { Box, Grid, Stack, Text } from "../../primitives";

/**
 * A do beside a don't: the same intent built the right way and the wrong way, each with one line
 * that says why. A family with a likely misuse has a pair (Guidance/Writing stories). A story that
 * renders one is tagged `!manifest`, so MCP never offers the Don't as code to copy.
 * The halves sit side by side while each can have 280px of the pair's own width and stack when
 * they cannot, so a pair follows the space it is given: a phone, a 320px panel or the canvas. It
 * never widens the column it sits in (`min-w-0`): a wide example scrolls or wraps inside its half.
 */
export function Pair({
  do: doNode,
  doText,
  dont,
  dontText,
}: {
  do: ReactNode;
  doText: string;
  dont: ReactNode;
  dontText: string;
}) {
  return (
    <Grid
      templateColumns="repeat(auto-fit, minmax(min(100%, 280px), 1fr))"
      gap="space.300"
      className="min-w-0"
    >
      <Half tone="success" label="Do" text={doText}>
        {doNode}
      </Half>
      <Half tone="danger" label="Don't" text={dontText}>
        {dont}
      </Half>
    </Grid>
  );
}

/**
 * The halves of the story's Pair at `index` (the first by default), in the order they render: the
 * example in its Do half and the one in its Don't half, for a play that asserts what makes the Do
 * right and the Don't wrong where both halves use the same words
 * (`within(halves(canvasElement).dont)`).
 */
export function halves(
  canvasElement: HTMLElement,
  index = 0,
): { do: HTMLElement; dont: HTMLElement } {
  const side = (half: "do" | "dont") =>
    canvasElement.querySelectorAll<HTMLElement>(`[data-pair="${half}"]`)[index];
  const doHalf = side("do");
  const dontHalf = side("dont");
  if (!doHalf || !dontHalf) throw new Error(`The story renders no Pair at ${index}.`);
  return { do: doHalf, dont: dontHalf };
}

function Half({
  tone,
  label,
  text,
  children,
}: {
  tone: "success" | "danger";
  label: string;
  text: string;
  children: ReactNode;
}) {
  return (
    <Stack space="space.100">
      <Box
        data-pair={tone === "success" ? "do" : "dont"}
        padding="space.300"
        backgroundColor="elevation.surface.sunken"
        className={
          tone === "success"
            ? "rounded-large border-t border-success"
            : "rounded-large border-t border-danger"
        }
      >
        {children}
      </Box>
      <Text size="small" color="color.text.subtle">
        <Text
          as="span"
          size="small"
          weight="semibold"
          color={tone === "success" ? "color.text.success" : "color.text.danger"}
        >
          {label}.
        </Text>{" "}
        {text}
      </Text>
    </Stack>
  );
}
