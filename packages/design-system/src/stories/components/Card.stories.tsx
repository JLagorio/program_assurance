import { useId, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Table,
} from "../../components";

const meta = {
  title: "Components/Card",
  component: Card,
  parameters: { layout: "padded" },
  args: { size: "default", ref: fn() },
} satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: function Example(args) {
    const id = useId();
    const [saved, setSaved] = useState(false);
    return (
      <Card {...args} role="region" aria-labelledby={id} className="w-layout-list max-w-full">
        <CardHeader>
          <CardTitle>
            <h2 id={id}>Review preferences</h2>
          </CardTitle>
          <CardDescription>Choose who receives the assessment.</CardDescription>
          <CardAction>
            <Button size="small" variant="link" onClick={() => setSaved(false)}>
              Reset
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p>Owner: Dana Whitfield</p>
        </CardContent>
        <CardFooter>
          <Button size="small" onClick={() => setSaved(true)}>
            Save preferences
          </Button>
          <span role="status">{saved ? "Preferences saved" : "Ready to save"}</span>
        </CardFooter>
      </Card>
    );
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const card = canvas.getByRole("region", { name: "Review preferences" });
    await expect(args.ref).toHaveBeenCalledWith(card);
    await expect(canvas.getByRole("heading", { level: 2 })).toHaveTextContent("Review preferences");
    await userEvent.click(canvas.getByRole("button", { name: "Save preferences" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Preferences saved");
    await userEvent.click(canvas.getByRole("button", { name: "Reset" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Ready to save");
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex max-w-layout-measure flex-col gap-200">
      {(["default", "sm"] as const).map((size) => (
        <Card key={size} size={size}>
          <CardHeader>
            <CardTitle>
              <h3>{size === "sm" ? "Small card" : "Default card"}</h3>
            </CardTitle>
            <CardDescription>
              The same parts, with a smaller inset when space is limited.
            </CardDescription>
          </CardHeader>
          <CardContent>Three artifacts are linked to this assessment.</CardContent>
        </Card>
      ))}
    </div>
  ),
};

export const EdgeToEdge: Story = {
  render: () => (
    <Card className="w-layout-list max-w-full">
      <CardHeader>
        <CardTitle>
          <h2>Controls</h2>
        </CardTitle>
      </CardHeader>
      <Table label="Controls">
        <thead>
          <Table.Row>
            <Table.Header>Id</Table.Header>
            <Table.Header>Title</Table.Header>
          </Table.Row>
        </thead>
        <tbody>
          <Table.Row>
            <Table.Cell>AC-2</Table.Cell>
            <Table.Cell>Account management</Table.Cell>
          </Table.Row>
        </tbody>
      </Table>
    </Card>
  ),
};
