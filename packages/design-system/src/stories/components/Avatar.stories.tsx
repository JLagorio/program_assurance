import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus, Server } from "lucide-react";

import { Avatar, Button, Fact, KeyValue, Person, Table } from "../../components";
import { useState } from "react";
import { fn } from "storybook/test";

import { Inline, Stack, Text } from "../../primitives";
import { Matrix, Specimens } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Avatar",
  component: Avatar,
  parameters: { layout: "padded" },
  args: { name: "Dana Whitfield" },
} satisfies Meta<typeof Avatar>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A stand-in portrait, so the photo column needs no network. */
const photo =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' fill='#d6c8b8'/><circle cx='32' cy='25' r='12' fill='#6b5a4a'/><path d='M8 66c0-15 11-24 24-24s24 9 24 24z' fill='#6b5a4a'/></svg>",
  );

const variants = ["neutral", "tinted", "bold", "gradient", "photo"] as const;

/** Five sizes by five treatments; then shapes, a Person, and stacks that overflow. */
export const AvatarMatrix: Story = {
  render: () => (
    <Stack space="space.300">
      <Matrix
        rows={["xsmall", "small", "medium", "large", "xlarge"] as const}
        cols={variants}
        rowLabel="size"
        render={(size, col) =>
          col === "photo" ? (
            <Avatar name="Dana Whitlock" size={size} src={photo} />
          ) : (
            <Avatar name="Dana Whitlock" size={size} variant={col} />
          )
        }
      />
      <Specimens title="The six hues, drawn from the name and stable per person">
        {[
          "Dana Whitlock",
          "Grace Hoppel",
          "Linus Aarto",
          "Marcus Ryde",
          "Priya Raghavan",
          "Sarah Chen",
        ].map((n) => (
          <Avatar key={n} name={n} variant="tinted" />
        ))}
      </Specimens>
      <Specimens title="Square, for a thing: a system pinned to one hue, a program with a photo">
        <Avatar name="Payables host" shape="square" variant="bold" hue="blue" />
        <Avatar name="Payables host" shape="square" variant="tinted" hue="blue" size="medium" />
        <Avatar name="Program Aurora" shape="square" src={photo} size="medium" />
      </Specimens>
      <Specimens title="A Person, plain and with a photo; the photo that failed">
        <Person name="Dana Whitlock" />
        <Person name="Dana Whitlock" src={photo} />
        <Person name="Dana Whitlock" src="/no-such-photo.png" variant="tinted" />
      </Specimens>
      <Specimens title="Stacks: three, six at small, and six at medium with photos">
        <Avatar.Stack names={["Dana Whitlock", "Grace Hoppel", "Linus Aarto"]} />
        <Avatar.Stack
          names={[
            "Dana Whitlock",
            "Grace Hoppel",
            "Linus Aarto",
            "Marcus Ryde",
            "Priya Raghavan",
            "Sarah Chen",
          ]}
          variant="gradient"
        />
        <Avatar.Stack
          size="medium"
          names={[
            { name: "Dana Whitlock", src: photo },
            "Grace Hoppel",
            { name: "Linus Aarto", src: photo },
            "Marcus Ryde",
            "Priya Raghavan",
            "Sarah Chen",
          ]}
          variant="tinted"
        />
      </Specimens>
    </Stack>
  ),
};

/** Where a person is written: a rail row, a fact, a table cell, a stack of reviewers, a profile row. */
export const People: Story = {
  render: () => (
    <Stack space="space.300" className="max-w-[480px]">
      <div>
        <KeyValue label="Owner">
          <Person name="Dana Whitfield" />
        </KeyValue>
        <KeyValue label="Assessor">
          <Person name="Priya Natarajan" />
        </KeyValue>
      </div>
      <Fact.Group>
        <Fact label="Owner">
          <Person name="Dana Whitfield" />
        </Fact>
        <Fact label="Reviewers">
          <Avatar.Stack names={["Priya Natarajan", "Marcus Oyelaran", "Lee Anand"]} />
        </Fact>
      </Fact.Group>
      <Table label="Findings">
        <thead>
          <tr>
            <Table.Header>Finding</Table.Header>
            <Table.Header width={180}>Owner</Table.Header>
          </tr>
        </thead>
        <tbody>
          <Table.Row>
            <Table.Cell>Shared admin account on the payables host</Table.Cell>
            <Table.Cell>
              <Person name="Dana Whitfield" />
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>Backup restore untested this quarter</Table.Cell>
            <Table.Cell>
              <Person name="Marcus Oyelaran" />
            </Table.Cell>
          </Table.Row>
        </tbody>
      </Table>
      <Inline space="space.150" alignBlock="center">
        <Avatar name="Sarah Chen" size="large" src={photo} />
        <Stack space="space.0">
          <Text weight="medium">Sarah Chen</Text>
          <Text size="small" color="color.text.subtle">
            Compliance lead
          </Text>
        </Stack>
      </Inline>
    </Stack>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={<Person name="Dana Whitfield" />}
        doText="In a row or a rail the name is written; the avatar is a mark beside it."
        dont={
          <Inline space="space.100">
            <Avatar name="Dana Whitfield" size="xsmall" />
            <Avatar name="Priya Natarajan" size="xsmall" />
            <Avatar name="Marcus Oyelaran" size="xsmall" />
          </Inline>
        }
        dontText="Initials alone as the owner column. Two people share initials, and a hover is the only way to tell."
      />
      <Pair
        do={
          <Avatar.Stack
            names={[
              "Dana Whitfield",
              "Priya Natarajan",
              "Marcus Oyelaran",
              "Lee Anand",
              "Sam Reyes",
              "Noor Haddad",
            ]}
          />
        }
        doText="Six reviewers: four and a +2."
        dont={
          <Inline space="space.050">
            {[
              "Dana Whitfield",
              "Priya Natarajan",
              "Marcus Oyelaran",
              "Lee Anand",
              "Sam Reyes",
              "Noor Haddad",
            ].map((n) => (
              <Avatar key={n} name={n} size="xsmall" />
            ))}
          </Inline>
        }
        dontText="Six avatars in a row. Past four the circles are a pattern, not people."
      />
      <Pair
        do={
          <Inline space="space.100">
            <Avatar name="Dana Whitfield" variant="tinted" />
            <Avatar name="Priya Natarajan" variant="tinted" />
            <Avatar name="Marcus Oyelaran" variant="tinted" />
          </Inline>
        }
        doText="One treatment per surface: every circle on a page is neutral, or every one is tinted."
        dont={
          <Inline space="space.100">
            <Avatar name="Dana Whitfield" />
            <Avatar name="Priya Natarajan" variant="bold" />
            <Avatar name="Marcus Oyelaran" variant="gradient" />
          </Inline>
        }
        dontText="Treatments mixed in one list. A bold circle beside a grey one reads as a rank."
      />
      <Pair
        do={<Avatar name="Dana Whitfield" />}
        doText="The full name goes in; the initials come out, and the name is what a screen reader hears."
        dont={<Avatar name="DW" />}
        dontText="Initials passed as the name. The avatar is named 'DW' and its title says nothing more."
      />
    </Stack>
  ),
};

export const Playground: Story = {};

const photoStatus = fn();
const avatarImageRef = fn();

function RecoverablePhoto() {
  const [src, setSrc] = useState("/no-such-photo.png");
  return <Stack space="space.100" alignInline="start">
    <Avatar name="Grace Hoppel" size="medium" data-testid="recoverable-photo">
      <Avatar.Image src={src} />
      <Avatar.Fallback delay={600} />
    </Avatar>
    <Button size="small" onClick={() => setSrc(photo)}>Retry photo</Button>
  </Stack>;
}

/** The parts composed by hand: a photo over the initials, an icon for a thing, a fallback held back, a stack the caller names and counts. */
export const Composed: Story = {
  render: () => (
    <Stack space="space.300">
      <Specimens title="Avatar.Image and Avatar.Fallback: the initials from the name until the photo loads; an icon for a thing; a fallback held back 600ms so a fast photo never flashes initials">
        <Avatar name="Dana Whitlock" size="medium" variant="tinted">
          <Avatar.Image ref={avatarImageRef} src={photo} onLoadingStatusChange={photoStatus} />
          <Avatar.Fallback />
        </Avatar>
        <Avatar name="Payables host" shape="square" size="medium" variant="bold" hue="blue">
          <Avatar.Fallback>
            <Server aria-hidden="true" className="size-icon-small" />
          </Avatar.Fallback>
        </Avatar>
        <RecoverablePhoto />
      </Specimens>
      <Specimens title="Avatar.Badge: present at every size; a mark with an icon from medium up; away in danger">
        <Avatar name="Dana Whitlock" size="xsmall" aria-label="Dana Whitlock, online">
          <Avatar.Fallback />
          <Avatar.Badge tone="success" />
        </Avatar>
        <Avatar name="Dana Whitlock" aria-label="Dana Whitlock, online">
          <Avatar.Fallback />
          <Avatar.Badge tone="success" />
        </Avatar>
        <Avatar name="Dana Whitlock" size="medium" aria-label="Dana Whitlock, online">
          <Avatar.Image src={photo} />
          <Avatar.Fallback />
          <Avatar.Badge tone="success" />
        </Avatar>
        <Avatar name="Dana Whitlock" size="large" aria-label="Dana Whitlock, online">
          <Avatar.Fallback />
          <Avatar.Badge tone="success" />
        </Avatar>
        <Avatar
          name="Dana Whitlock"
          size="xlarge"
          variant="tinted"
          aria-label="Dana Whitlock, online"
        >
          <Avatar.Fallback />
          <Avatar.Badge tone="success" />
        </Avatar>
        <Avatar name="Dana Whitlock" size="medium" aria-label="Dana Whitlock, invited">
          <Avatar.Fallback />
          <Avatar.Badge>
            <Plus aria-hidden="true" />
          </Avatar.Badge>
        </Avatar>
        <Avatar name="Dana Whitlock" size="large" variant="bold" aria-label="Dana Whitlock, away">
          <Avatar.Fallback />
          <Avatar.Badge tone="danger" />
        </Avatar>
      </Specimens>
      <Specimens title="A stack composed: the caller names the group and writes the count">
        <Avatar.Stack
          size="medium"
          variant="tinted"
          aria-label="Reviewers: Dana Whitlock, Grace Hoppel, Linus Aarto and 3 more"
        >
          <Avatar name="Dana Whitlock" src={photo} />
          <Avatar name="Grace Hoppel" />
          <Avatar name="Linus Aarto" />
          <Avatar.Count>+3</Avatar.Count>
        </Avatar.Stack>
      </Specimens>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const { expect, within, userEvent, waitFor } = await import("storybook/test");
    const canvas = within(canvasElement);
    await waitFor(() => expect(photoStatus).toHaveBeenCalledWith("loaded"));
    await expect(avatarImageRef).toHaveBeenCalledWith(expect.any(HTMLImageElement));
    const failed = canvas.getByTestId("recoverable-photo");
    await waitFor(() => expect(failed).toHaveTextContent("GH"));
    await expect(failed.querySelector("img")).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Retry photo" }));
    await waitFor(() => expect(failed.querySelector("img")).not.toBeNull());
    await expect(failed.querySelector('[data-slot="avatar-fallback"]')).toBeNull();
    const group = canvas.getByRole("group", { name: /Reviewers/ });
    await expect(group.querySelectorAll('[data-slot="avatar"][aria-hidden="true"]')).toHaveLength(
      3,
    );
    await expect(group.querySelector('[data-slot="avatar-count"]')).toHaveTextContent("+3");
  },
};
