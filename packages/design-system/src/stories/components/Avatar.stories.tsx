import { type Meta, type StoryObj } from "@storybook/react-vite";
import { Plus, Server } from "lucide-react";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
  Person,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  avatarInitials,
  avatarHue,
  type AvatarSize,
} from "../../components";
import { Inline, Stack } from "../../primitives";
import { Matrix } from "../_lib/matrix";

const meta = {
  title: "Components/Avatar",
  component: Avatar,
  parameters: { layout: "padded" },
  args: { size: "small", "aria-label": "Dana Whitfield", role: "img" },
  render: (args) => (
    <Avatar {...args}>
      <AvatarFallback>DW</AvatarFallback>
    </Avatar>
  ),
} satisfies Meta<typeof Avatar>;
export default meta;
type Story = StoryObj<typeof meta>;

const photo =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' fill='#d6c8b8'/><circle cx='32' cy='25' r='12' fill='#6b5a4a'/><path d='M8 66c0-15 11-24 24-24s24 9 24 24z' fill='#6b5a4a'/></svg>",
  );

export const AvatarMatrix: Story = {
  render: () => (
    <Matrix
      rows={["xsmall", "small", "medium", "large", "xlarge"] as const}
      cols={["neutral", "tinted", "bold", "gradient", "photo"] as const}
      rowLabel="size"
      render={(size, variant) => (
        <Avatar
          size={size}
          variant={variant === "photo" ? "neutral" : variant}
          hue={avatarHue("Dana Whitfield")}
          role="img"
          aria-label="Dana Whitfield"
        >
          {variant === "photo" && <AvatarImage src={photo} />}
          <AvatarFallback>
            {avatarInitials("Dana Whitfield", size === "xsmall" ? 1 : 2)}
          </AvatarFallback>
        </Avatar>
      )}
    />
  ),
};

export const People: Story = {
  render: () => (
    <Stack space="space.300">
      <Person name="Dana Whitfield" />
      <AvatarGroup
        role="group"
        aria-label="Reviewers: Dana Whitfield, Grace Hoppel, and two others"
      >
        {["Dana Whitfield", "Grace Hoppel"].map((name) => (
          <Avatar
            key={name}
            size="medium"
            aria-hidden="true"
            variant="tinted"
            hue={avatarHue(name)}
          >
            <AvatarFallback>{avatarInitials(name)}</AvatarFallback>
          </Avatar>
        ))}
        <AvatarGroupCount aria-hidden="true">+2</AvatarGroupCount>
      </AvatarGroup>
      <Inline space="space.200">
        <Avatar size="medium" shape="square" variant="bold" role="img" aria-label="Payables host">
          <AvatarFallback>
            <Server aria-hidden="true" className="size-icon-small" />
          </AvatarFallback>
        </Avatar>
        <Avatar size="medium" role="img" aria-label="Dana Whitfield, online">
          <AvatarFallback>DW</AvatarFallback>
          <AvatarBadge tone="success" />
        </Avatar>
        <Avatar size="large" role="img" aria-label="Grace Hoppel, invited">
          <AvatarFallback>GH</AvatarFallback>
          <AvatarBadge>
            <Plus aria-hidden="true" />
          </AvatarBadge>
        </Avatar>
      </Inline>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("group", { name: /Reviewers/ });
    await expect(group.querySelectorAll('[data-slot="avatar"][aria-hidden="true"]')).toHaveLength(
      2,
    );
    await expect(group.querySelector('[data-slot="avatar-group-count"]')).toHaveTextContent("+2");
  },
};

const photoStatus = fn();
const imageRef = fn();
function RecoverablePhoto() {
  const [src, setSrc] = useState("data:image/png;base64,invalid");
  return (
    <Stack space="space.150" alignInline="start">
      <Avatar
        size="medium"
        role="img"
        aria-label="Grace Hoppel"
        data-testid="recoverable-photo"
        render={<span data-testid="recoverable-photo" />}
        className={(state) =>
          state.imageLoadingStatus === "loaded" ? "cursor-default" : undefined
        }
      >
        <AvatarImage ref={imageRef} src={src} onLoadingStatusChange={photoStatus} />
        <AvatarFallback delay={100}>GH</AvatarFallback>
      </Avatar>
      <Button onClick={() => setSrc(photo)}>Retry photo</Button>
    </Stack>
  );
}
export const ImageLoading: Story = {
  render: () => <RecoverablePhoto />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const avatar = canvas.getByTestId("recoverable-photo");
    await waitFor(() => expect(avatar).toHaveTextContent("GH"));
    await expect(avatar.querySelector("img")).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Retry photo" }));
    await waitFor(() => expect(photoStatus).toHaveBeenCalledWith("loaded"));
    await expect(imageRef).toHaveBeenCalledWith(expect.any(HTMLImageElement));
    await expect(avatar.querySelector("img")).not.toBeNull();
    await expect(avatar.querySelector('[data-slot="avatar-fallback"]')).toBeNull();
  },
};
const sizes = ["xsmall", "small", "medium", "large", "xlarge"] as const satisfies AvatarSize[];
const reviewers = ["Dana Whitfield", "Grace Hoppel", "Priya Natarajan"];
const overlaps = { xsmall: 4, small: 6, medium: 8, large: 8, xlarge: 16 } as const;

/** A group at every size: the +n circle is as large as the avatars it follows, with type a step under theirs, and the overlap is about a quarter of their size. */
export const GroupSizes: Story = {
  render: () => (
    <Stack space="space.200">
      {sizes.map((size) => (
        <AvatarGroup
          key={size}
          role="group"
          aria-label={`Reviewers at ${size}: ${reviewers.join(", ")} and two others`}
          data-testid={`group-${size}`}
        >
          {reviewers.map((name) => (
            <Avatar key={name} size={size} aria-hidden="true" variant="tinted" hue={avatarHue(name)}>
              <AvatarFallback>{avatarInitials(name, size === "xsmall" ? 1 : 2)}</AvatarFallback>
            </Avatar>
          ))}
          <AvatarGroupCount aria-hidden="true">+2</AvatarGroupCount>
        </AvatarGroup>
      ))}
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const size of sizes) {
      const group = canvas.getByTestId(`group-${size}`);
      const [first, second] = Array.from(
        group.querySelectorAll<HTMLElement>('[data-slot="avatar"]'),
        (el) => el.getBoundingClientRect(),
      );
      const count = group.querySelector('[data-slot="avatar-group-count"]')!.getBoundingClientRect();
      await expect(count.width).toBe(first!.width);
      await expect(count.height).toBe(first!.height);
      await expect(Math.round(first!.right - second!.left)).toBe(overlaps[size]);
    }
  },
};

const hidden = ["Marcus Oyelaran", "Ines Albrecht", "Tomás Ruiz"];

/** The members the group does not draw, a click or a key away: the +n circle is a button (`render`) that opens a Popover listing them, and it is named for what it holds. */
export const HiddenMembers: Story = {
  render: () => (
    <AvatarGroup role="group" aria-label="Reviewers">
      {reviewers.map((name) => (
        <Avatar key={name} size="small" role="img" aria-label={name} variant="tinted" hue={avatarHue(name)}>
          <AvatarFallback>{avatarInitials(name)}</AvatarFallback>
        </Avatar>
      ))}
      <Popover>
        <PopoverTrigger
          render={
            <AvatarGroupCount
              render={<button type="button" />}
              aria-label={`${hidden.length} more reviewers`}
            />
          }
        >
          +{hidden.length}
        </PopoverTrigger>
        <PopoverContent aria-label="More reviewers" style={{ width: 240 }}>
          <Stack space="space.100" as="ul">
            {hidden.map((name) => (
              <li key={name}>
                <Person name={name} variant="tinted" />
              </li>
            ))}
          </Stack>
        </PopoverContent>
      </Popover>
    </AvatarGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const more = canvas.getByRole("button", { name: "3 more reviewers" });
    await expect(more).toHaveAttribute("data-slot", "avatar-group-count");
    await expect(more.tagName).toBe("BUTTON");
    more.focus();
    await userEvent.keyboard("{Enter}");
    const list = await body.findByRole("dialog", { name: "More reviewers" });
    for (const name of hidden) await expect(within(list).getByText(name)).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(more).toHaveFocus());
  },
};

export const Playground: Story = {};
