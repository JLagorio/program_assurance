import type { Meta, StoryObj } from "@storybook/react-vite";

import { Banner } from "../../components";
import { Stack } from "../../primitives";
import { Matrix } from "../_lib/matrix";

const meta = {
  title: "Components/Banner",
  component: Banner,
  parameters: { layout: "padded" },
  args: { children: "The control catalogue moved to revision 5.2 overnight." },
} satisfies Meta<typeof Banner>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Banners: Story = {
  render: () => (
    <Stack space="space.100">
      <Banner tone="warning" action={<a href="#renew">Ask for an extension</a>}>
        The audit window closes in three days; evidence uploads lock after that.
      </Banner>
      <Banner tone="danger">
        We have lost the connection to the evidence store. Uploads are not being saved.
      </Banner>
      <Banner tone="information" action={<button type="button">See what changed</button>}>
        The control catalogue moved to revision 5.2 overnight.
      </Banner>
    </Stack>
  ),
};

/** Every tone, alone, with an action, and truncated in a narrow screen. */
export const BannerMatrix: Story = {
  render: () => (
    <Matrix
      rows={["information", "warning", "danger"] as const}
      cols={["message", "with an action", "narrow, truncated"] as const}
      rowLabel="tone"
      render={(tone, col) => (
        <div style={{ width: col === "narrow, truncated" ? 320 : 480 }}>
          <Banner
            tone={tone}
            action={col === "with an action" ? <a href="#action">Do the thing</a> : undefined}
          >
            {col === "narrow, truncated"
              ? "A message long enough that it cannot fit on one line of a narrow screen and is cut"
              : "A message about the whole site, one line."}
          </Banner>
        </div>
      )}
    />
  ),
};
