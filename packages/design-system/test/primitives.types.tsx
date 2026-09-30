// The primitives' promises, held by the type checker (`npm run typecheck`): no link or button
// element, a required Heading size, token-typed space and colour, no margin and no `style` where
// the primitive takes none. Each `@ts-expect-error` must stay an error.
import { createRef } from "react";

import {
  Bleed,
  Box,
  Flex,
  Grid,
  Heading,
  HeadingLevelProvider,
  Inline,
  Stack,
  Text,
  VisuallyHidden,
} from "../src";

/* ---- what compiles ---- */

<Box
  as="section"
  ref={createRef<HTMLElement>()}
  padding="space.200"
  paddingInlineStart="space.100"
  backgroundColor="elevation.surface.raised"
  shrink="none"
  style={{ width: 240 }}
  aria-labelledby="title"
/>;
<Stack as="ol" space="space.100" alignInline="start" grow="fill" shrink="none" />;
<Inline
  space="space.100"
  rowSpace="space.050"
  alignBlock="baseline"
  separator="·"
  shouldWrap
  grow="fill"
  display="inline-flex"
/>;
<Flex direction="column" gap="space.100" wrap="wrap" shrink="none" />;
<Grid
  templateColumns={{ base: "1fr", md: "1fr 1fr" }}
  gap="space.200"
  style={{ gridTemplateRows: "auto" }}
/>;
<Bleed inline="space.200" />;
<Text
  as="p"
  size="small"
  weight="medium"
  color="color.text.subtle"
  maxLines={2}
  numeric
  preserveLineBreaks
/>;
<Text as="label" htmlFor="name">
  Name
</Text>;
<Heading size="xsmall" as="h3" color="color.text.inverse" />;
<HeadingLevelProvider level={2}>
  <Heading size="small" />
</HeadingLevelProvider>;
<VisuallyHidden as="h2">Filters</VisuallyHidden>;

/* ---- no link and no button: TextLink and Button carry the ring, the face and the name ---- */

// @ts-expect-error a Box is never a link
<Box as="a" />;
// @ts-expect-error a Box is never a button
<Box as="button" />;
// @ts-expect-error a Stack is never a link
<Stack as="a" />;
// @ts-expect-error an Inline is never a button
<Inline as="button" />;
// @ts-expect-error a Flex is never a link
<Flex as="a" />;
// @ts-expect-error a Grid is never a button
<Grid as="button" />;
// @ts-expect-error a Text is never a link
<Text as="a" />;
// @ts-expect-error a Text is never a heading: a title is a Heading
<Text as="h2" />;
// @ts-expect-error a Heading is never a paragraph
<Heading size="small" as="p" />;
// @ts-expect-error VisuallyHidden is never a button
<VisuallyHidden as="button" />;

/* ---- a Heading's size is the design's, and required ---- */

// @ts-expect-error size is required
<Heading>Title</Heading>;
// @ts-expect-error size is one of the four heading sizes
<Heading size="xxlarge" />;
// @ts-expect-error a tone is not a heading colour
<Heading size="small" color="color.text.danger" />;
// @ts-expect-error the level context runs from 1 to 6
<HeadingLevelProvider level={7} />;

/* ---- space and colour are tokens ---- */

// @ts-expect-error space is a token, never a number
<Stack space={16} />;
// @ts-expect-error space is a token, never a class
<Inline space="gap-200" />;
// @ts-expect-error a padding is a space token
<Box padding="16px" />;
// @ts-expect-error a background is a background or surface token, never a text colour
<Box backgroundColor="color.text" />;
// @ts-expect-error a Text colour is a text token, never a background
<Text color="color.background.neutral" />;
// @ts-expect-error a bleed is a token the padding is
<Bleed inline="space.1000" />;

/* ---- no margin, and no style where the primitive has no computed dimension ---- */

// @ts-expect-error no margin props: the parent owns the distance
<Box margin="space.100" />;
// @ts-expect-error a Stack takes no style; a computed dimension is a Box's
<Stack style={{ width: 240 }} />;
// @ts-expect-error an Inline takes no style
<Inline style={{ gap: 4 }} />;
// @ts-expect-error a Text takes no style
<Text style={{ fontSize: 13 }} />;
// @ts-expect-error a Heading takes no style
<Heading size="small" style={{ fontSize: 20 }} />;

/* ---- one axis each ---- */

// @ts-expect-error Stack has no baseline: baseline is a row's
<Stack alignBlock="baseline" />;
// @ts-expect-error no reverse direction: visual order is DOM order
<Flex direction="row-reverse" />;
// @ts-expect-error maxLines clamps one, two or three lines
<Text maxLines={4} />;
// @ts-expect-error shrink is only ever turned off
<Stack shrink="fill" />;
