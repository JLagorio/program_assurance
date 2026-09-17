import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Badge,
  Box,
  Button,
  Grid,
  Inline,
  Input,
  ModeSwitch,
  PageHeader,
  Section,
  Stack,
} from "@ledger/design-system";
export const Route = createFileRoute("/components")({
  head: () => ({ meta: [{ title: "Design system — Program Assurance" }] }),
  component: DesignSystem,
});
function DesignSystem() {
  const [count, setCount] = useState(0);
  return (
    <Stack space="space.250">
      <PageHeader>
        <PageHeader.Lead className="text-subtle">System</PageHeader.Lead>
        <PageHeader.Heading>
          <PageHeader.Title>Design system</PageHeader.Title>
          <PageHeader.Description>
            Interface primitives used by the prototype and schema inspector. This page previews
            presentation components.
          </PageHeader.Description>
        </PageHeader.Heading>
      </PageHeader>
      <Grid
        gap="space.300"
        templateColumns={{ base: "minmax(0,1fr)", xl: "repeat(2,minmax(0,1fr))" }}
      >
        <Section title="Buttons">
          <Inline space="space.150" shouldWrap>
            <Button variant="primary" onClick={() => setCount((value) => value + 1)}>
              Primary
            </Button>
            <Button variant="secondary" onClick={() => setCount(0)}>
              Reset clicks
            </Button>
            <span>{count} interactions</span>
          </Inline>
        </Section>
        <Section title="Recorded lifecycle labels">
          <Inline space="space.150" shouldWrap>
            <Badge tone="neutral">Draft</Badge>
            <Badge tone="success">Published</Badge>
            <Badge tone="warning">In progress</Badge>
          </Inline>
        </Section>
        <Section title="Inputs">
          <Input aria-label="Component preview input" placeholder="Type to preview the input" />
        </Section>
        <Section title="Appearance">
          <ModeSwitch />
        </Section>
      </Grid>
    </Stack>
  );
}
