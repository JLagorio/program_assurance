import type { Meta, StoryObj } from "@storybook/react-vite";
import { CircleAlert, Laptop, ShieldCheck, TriangleAlert, Users } from "lucide-react";
import { expect, userEvent, within } from "storybook/test";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Icon,
  Progress,
  Stat,
  TextLink,
  Tray,
} from "../../components";
import { Section } from "../../layout";
import { Box, Grid, Stack, Text } from "../../primitives";

const meta = {
  title: "Components/Tray",
  component: Tray,
  parameters: { layout: "padded" },
  args: { title: "monitored devices", value: 20 },
} satisfies Meta<typeof Tray>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A count and its breakdown: the heading leads with the number, and each part is a Stat.Row. */
export const Playground: Story = {
  render: (args) => (
    <Tray {...args} style={{ maxWidth: 360 }}>
      <Stat.List>
        <Stat.Row label="Need attention" value={7} tone="danger" />
        <Stat.Row label="Compliant" value={9} />
        <Stat.Row label="Dormant" value={4} />
      </Stat.List>
    </Tray>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tray = canvas.getByRole("group", { name: "20 monitored devices" });
    await expect(tray).toHaveAttribute("data-slot", "tray");
    // Outside every provider the heading is an h2, and it holds the count and the words together.
    await expect(
      within(tray).getByRole("heading", { level: 2, name: "20 monitored devices" }),
    ).toBeVisible();
    await expect(within(tray).getAllByRole("listitem")).toHaveLength(3);
  },
};

/** A tray holds cards as well as rows: the heading counts them, and the tray's edge says which cards it counts. */
export const HoldingCards: Story = {
  render: () => (
    <Tray title="frameworks" value={2} style={{ maxWidth: 520 }}>
      <Grid templateColumns="repeat(auto-fit, minmax(min(100%, 144px), 1fr))" gap="space.075">
        <Card size="small">
          <CardHeader>
            <CardTitle render={<h3 />}>NIST SP 800-53</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={87} aria-label="Controls satisfied, NIST SP 800-53" />
          </CardContent>
        </Card>
        <Card size="small">
          <CardHeader>
            <CardTitle render={<h3 />}>CNSSI 1253</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={67} aria-label="Controls satisfied, CNSSI 1253" />
          </CardContent>
        </Card>
      </Grid>
    </Tray>
  ),
  play: async ({ canvasElement }) => {
    const tray = within(canvasElement).getByRole("group", { name: "2 frameworks" });
    await expect(within(tray).getAllByRole("heading", { level: 3 })).toHaveLength(2);
  },
};

/** With `link`, the heading opens the register the tray counts, and each linked row opens its part of it. */
export const Linked: Story = {
  render: () => (
    <Tray
      title="people"
      value={16}
      icon={
        <Icon>
          <Users />
        </Icon>
      }
      link={<a href="#people" onClick={(event) => event.preventDefault()} />}
      style={{ maxWidth: 360 }}
    >
      <Stat.List>
        <Stat.Row
          label="Need attention"
          value={0}
          tone="danger"
          icon={
            <Icon>
              <CircleAlert />
            </Icon>
          }
          link={<a href="#attention" onClick={(event) => event.preventDefault()} />}
        />
        <Stat.Row
          label="Compliant"
          value={14}
          icon={
            <Icon>
              <ShieldCheck />
            </Icon>
          }
          link={<a href="#compliant" onClick={(event) => event.preventDefault()} />}
        />
      </Stat.List>
    </Tray>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The heading is the link: its name is the count and the words, and it is a tab stop.
    const heading = canvas.getByRole("link", { name: "16 people" });
    await expect(heading).toHaveAttribute("href", "#people");
    await userEvent.tab();
    await expect(heading).toHaveFocus();
    // A linked row is one link named by its label and its number.
    await expect(canvas.getByRole("link", { name: /Compliant\s*14/ })).toBeVisible();
  },
};

/** The one count on a screen that cannot wait takes the bold tray. The rows inside stay raised, and their own tone says which part is the problem. */
export const Danger: Story = {
  render: () => (
    <Tray
      tone="danger"
      title="active vulnerabilities"
      value={245}
      icon={
        <Icon>
          <TriangleAlert />
        </Icon>
      }
      link={<a href="#vulnerabilities" onClick={(event) => event.preventDefault()} />}
      style={{ maxWidth: 360 }}
    >
      <Stat.List>
        <Stat.Row
          label="Pentest findings"
          value={9}
          tone="danger"
          link={<a href="#pentest" onClick={(event) => event.preventDefault()} />}
        />
        <Stat.Row
          label="Code security issues"
          value={10}
          tone="danger"
          link={<a href="#code" onClick={(event) => event.preventDefault()} />}
        />
      </Stat.List>
    </Tray>
  ),
  play: async ({ canvasElement }) => {
    const tray = within(canvasElement).getByRole("group", { name: "245 active vulnerabilities" });
    await expect(tray).toHaveAttribute("data-tone", "danger");
  },
};

/** While the count loads the heading holds its place, the tray is busy, and each row waits the same way. */
export const Loading: Story = {
  render: () => (
    <Tray title="monitored devices" isLoading style={{ maxWidth: 360 }}>
      <Stat.List>
        <Stat.Row label="Need attention" value={0} isLoading />
        <Stat.Row label="Compliant" value={0} isLoading />
      </Stat.List>
    </Tray>
  ),
  play: async ({ canvasElement }) => {
    const tray = within(canvasElement).getByRole("group");
    await expect(tray).toHaveAttribute("aria-busy", "true");
    await expect(within(tray).getAllByRole("listitem")[0]).toHaveAttribute("aria-busy", "true");
  },
};

/** `action` sits at the heading's end, and takes the next row where the heading needs the width. A zero count reads muted. */
export const WithAnAction: Story = {
  render: () => (
    <Box style={{ maxWidth: 520 }}>
      <Stack space="space.200">
        <Tray
          title="controls assigned"
          value="87%"
          action={<TextLink href="#unassigned">13 unassigned</TextLink>}
        >
          <Card size="small">
            <CardContent>
              <Progress value={87} aria-label="Controls assigned" />
            </CardContent>
          </Card>
        </Tray>
        <Tray title="open requests" value={0}>
          <Card size="small">
            <CardContent>
              <Text color="color.text.subtle">Nothing waiting on you.</Text>
            </CardContent>
          </Card>
        </Tray>
      </Stack>
    </Box>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("link", { name: "13 unassigned" })).toBeVisible();
    await expect(canvas.getByRole("group", { name: "0 open requests" })).toBeVisible();
  },
};

/** Under a titled Section the tray's heading is one level below the Section's, and what the tray holds one below that. */
export const HeadingLevels: Story = {
  render: () => (
    <Section title="Devices" style={{ maxWidth: 360 }}>
      <Tray
        title="laptops"
        value={12}
        icon={
          <Icon>
            <Laptop />
          </Icon>
        }
      >
        <Card size="small">
          <CardHeader>
            <CardTitle render={<h4 />}>Encrypted</CardTitle>
          </CardHeader>
        </Card>
      </Tray>
    </Section>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { level: 2, name: "Devices" })).toBeVisible();
    await expect(canvas.getByRole("heading", { level: 3, name: "12 laptops" })).toBeVisible();
  },
};
