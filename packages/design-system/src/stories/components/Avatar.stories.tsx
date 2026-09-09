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
  avatarInitials,
  avatarHue,
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
export const Playground: Story = {};
