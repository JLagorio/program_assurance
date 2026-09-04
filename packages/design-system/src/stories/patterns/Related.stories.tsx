import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge, Button, Person } from "../../components";
import { Related } from "../../patterns";
import { Stack } from "../../primitives";

const meta = {
  title: "Patterns/Related",
  component: Related,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Related>;
export default meta;
type Story = StoryObj;

/** Rows with every slot, an action, and the empty case. */
export const RelatedMatrix: Story = {
  render: () => (
    <Stack space="space.300" className="w-layout-rail">
      <Related
        title="Linked findings"
        count={2}
        action={
          <Button size="xsmall" variant="subtle">
            Link
          </Button>
        }
      >
        <Related.Row
          lead={
            <Badge tone="danger" size="xsmall">
              CAT I
            </Badge>
          }
          label="FND-2231"
          meta="Router management plane accepts unencrypted telnet"
          onClick={() => {}}
        />
        <Related.Row
          label="FND-2214"
          meta="SSH permits GSSAPI authentication"
          trailing={<Person name="Dana Whitlock" />}
        />
      </Related>
      <Related title="Risks" />
      <Related title="Packages" empty="Not in a package yet" />
    </Stack>
  ),
};
