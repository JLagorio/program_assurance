import type { ReactNode } from "react";

import { Box, Grid, Stack, Text } from "../../primitives";

/**
 * A do beside a don't: the same intent built the right way and the wrong way, each with one line
 * that says why. The pairs are the page's "Don't" section; the ratchet asks every family for one.
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
