import type { Meta, StoryObj } from "@storybook/react-vite";

import { Alert, Banner } from "../../components";
import { Stack } from "../../primitives";
import { Matrix } from "../_lib/matrix";
import { Pair } from "../_lib/pair";

const meta = {
  title: "Components/Banner",
  component: Banner,
  parameters: { layout: "padded" },
  args: { tone: "warning", children: "The control catalogue moved to revision 5.2 overnight." },
} satisfies Meta<typeof Banner>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Every tone alone, with an action, and truncated in a narrow screen. */
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
            action={col === "with an action" ? <a href="#action">See what changed</a> : undefined}
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

/** The three messages a banner carries: something changed, something is about to, something is lost. */
export const Banners: Story = {
  render: () => (
    <Stack space="space.100">
      <Banner tone="information" action={<button type="button">See what changed</button>}>
        The control catalogue moved to revision 5.2 overnight.
      </Banner>
      <Banner tone="warning" action={<a href="#renew">Ask for an extension</a>}>
        The audit window closes in three days; evidence uploads lock after that.
      </Banner>
      <Banner tone="danger">
        We have lost the connection to the evidence store. Uploads are not being saved.
      </Banner>
    </Stack>
  ),
};

/** The mistakes the page is written to prevent, each beside the right way. */
export const Dont: Story = {
  render: () => (
    <Stack space="space.400">
      <Pair
        do={
          <Banner tone="danger">
            We have lost the connection to the evidence store. Uploads are not being saved.
          </Banner>
        }
        doText="About the whole site: every reader, every screen."
        dont={<Banner tone="warning">CTRL-0412 is due on Friday.</Banner>}
        dontText="About one record. That is an Alert in the record's rail, or a row in a table."
      />
      <Pair
        do={
          <div style={{ width: 480 }}>
            <Alert tone="success" title="Snapshot submitted" />
          </div>
        }
        doText="Feedback after an act is a toast or an Alert; it says what happened."
        dont={<Banner tone="information">Your snapshot was submitted successfully.</Banner>}
        dontText="Feedback in the banner. There is no success banner: a banner is gone when it is no longer true, and feedback is always true."
      />
      <Pair
        do={
          <Banner tone="warning" action={<a href="#renew">Ask for an extension</a>}>
            The audit window closes in three days; evidence uploads lock after that.
          </Banner>
        }
        doText="One line and one action."
        dont={
          <Banner
            tone="warning"
            action={<a href="#renew">Ask for an extension, or read the audit calendar</a>}
          >
            The audit window closes in three days. After that evidence uploads lock, findings cannot
            be closed, and the package snapshot is what the assessor sees.
          </Banner>
        }
        dontText="Two sentences and two actions in one link. It truncates; the reader gets neither."
      />
    </Stack>
  ),
};

export const Playground: Story = {};
